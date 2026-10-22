// Your Cottage: the creature menu, open from anywhere by clicking the creature
// in the top bar. Overhauled 2026-10-22 (teacher request: students didn't know
// what was in here). Every room is listed up front with what it does and how
// it's going, so nothing is hidden. The dream and the house open below the
// list, and the other rooms open their own pages.
import { h, add, fill, money, ageLabel, toast } from "../dom.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { fullName } from "../../data/creatures.js";
import { DREAMS, dreamProgress, finishStage, stageCostText } from "../../data/dreams.js";
import { rankFor } from "../../progress.js";
import { placeHeader } from "../place-header.js";
import { celebrate } from "../celebrate.js";
import { firstVisitLesson } from "../guide.js";
import { hasFeature, opensText } from "../../progression.js";
import { ACHIEVEMENTS } from "../../data/achievements.js";
import { HOME_UPGRADES, homeQuote, homeSteps } from "../../data/garage.js";
import { loanPicker } from "../loan-picker.js";
import { resolveChoice } from "../../engine/index.js";
import { xpBar } from "./trophies.js";
import { meters } from "./hub.js";

let room = "dream";

export function render(root, { game, go, track, refreshWho, back }) {
  const play = game.play;
  const c = game.save.creature;
  const panel = h("section.panel.place-screen.cottage");
  root.append(h("div.bestiary.bst-cottage", panel));
  track("cottageOpen", {});
  if (play.prologue && !play.prologue.cottageVisited && !game.practice) {
    play.prologue.cottageVisited = true;
    game.persist("prologueCottage");
  }

  function paint() {
    const life = game.life;
    const r = rankFor(play.xp);
    const dream = c.dream ? DREAMS[c.dream] : null;
    const prog = dream ? dreamProgress(life, c.dream, play) : null;
    const homeOpen = hasFeature(play, "homeLoan");
    if (room === "home" && !homeOpen) room = "dream";
    fill(
      panel,
      placeHeader({ go, iconName: "cottage", kicker: "Your creature's home", title: `${c.name}'s Cottage`, subtitle: `Everything about ${c.name} is in here. Pick a room.` }),
      h(
        "div.cottage-top",
        h(
          "div.cottage-stage",
          { class: c.background && c.background !== "none" ? `creature-stage bg-${c.background}` : "" },
          h("div", { html: creatureSvg(c, { size: 200, ageMonths: life?.ageMonths || 0 }) }),
          h("h2", fullName(c)),
          h("p.muted.tight", `${life ? ageLabel(life.ageMonths) : ""} · ${r.icon} ${r.title}`),
          xpBar(play.xp)
        ),
        roomsNav(rooms(dream, prog, homeOpen))
      ),
      h("div.cottage-room-body", { id: "cottage-room" }, room === "home" ? homeCard() : dreamCard(dream, prog))
    );
  }

  // Every room, with what it does and how it's going right now.
  function rooms(dream, prog, homeOpen) {
    const owned = (play.owned || []).length;
    const earned = Object.keys(play.achievements || {}).length;
    const done = (play.home || []).length;
    let dreamNote = "No dream picked yet";
    let dreamTone = "action";
    if (dream && play.dreamDone) [dreamNote, dreamTone] = ["Dream come true!", "calm"];
    else if (prog?.ready) dreamNote = `Stage ${prog.stageIndex + 1} is ready to finish!`;
    else if (prog?.stage) [dreamNote, dreamTone] = [`Stage ${prog.stageIndex + 1} of ${prog.stages.length}: ${prog.stage.goals.filter((g) => g.ok).length} of ${prog.stage.goals.length} goals met`, "calm"];
    return [
      { id: "dream", main: true, ico: "dream", title: "The dream", does: `What ${c.name} is working toward, and the button to finish each stage.`, note: dreamNote, tone: dreamTone, here: true },
      { id: "wardrobe", main: true, ico: "palette", title: "Wardrobe", does: `Change ${c.name}'s look and wear what you bought at the Market.`, note: owned ? `${owned} item${owned === 1 ? "" : "s"} in the closet` : "Buy clothes and items at the Market", tone: "calm", route: "creature" },
      { id: "home", main: true, ico: "home", title: "Fix up the house", does: "Add a garden, a workshop and more, paid with cash or a loan.", note: homeOpen ? `${done} of ${HOME_UPGRADES.length} upgrades done` : opensText("homeLoan"), tone: homeOpen ? "calm" : "locked", here: true },
      { id: "trophies", ico: "trophy", title: "Trophies", does: "Achievements, your rank and the class leaderboard.", note: hasFeature(play, "academy") ? `${earned} of ${ACHIEVEMENTS.length} earned` : opensText("academy"), tone: hasFeature(play, "academy") ? "calm" : "locked", route: "trophies" },
      game.classInfo?.social === false ? null : { id: "friends", ico: "people", title: "Friends", does: "Add classmates as friends and send gifts.", note: hasFeature(play, "plaza") ? "At Friendship Plaza" : opensText("plaza"), tone: hasFeature(play, "plaza") ? "calm" : "locked", route: "friends" },
      { id: "settings", ico: "gear", title: "Settings", does: "Light or dark, reading size, motion and sound.", note: "Also the gear at the top", tone: "calm", route: "settings" },
    ].filter(Boolean);
  }

  // The dream, the wardrobe and the house are the big rooms (teacher request
  // 2026-10-22: six same-looking cards were hard to tell apart). Trophies,
  // friends and settings are a small row under them.
  function roomsNav(list) {
    return h(
      "nav.cottage-rooms",
      { "aria-label": "Rooms in the Cottage" },
      h("ul.rooms-main", list.filter((rm) => rm.main).map((rm) => h("li", roomButton(rm)))),
      h("ul.rooms-small", list.filter((rm) => !rm.main).map((rm) => h("li", roomButton(rm))))
    );
  }

  function roomButton(rm) {
    const open = rm.here && room === rm.id;
    return h(
      "button.cottage-room",
      {
        type: "button",
        class: `tone-${rm.tone}${open ? " open" : ""} room-${rm.id}`,
        "data-room": rm.id,
        "aria-pressed": rm.here ? String(open) : null,
        disabled: rm.tone === "locked",
        onclick: () => {
          track("cottageRoom", { room: rm.id });
          if (rm.route) return go(rm.route);
          room = rm.id;
          paint();
          document.getElementById("cottage-room")?.scrollIntoView({ block: "start", behavior: "smooth" });
        },
      },
      h("span.room-icon", icon(rm.tone === "locked" ? "lock" : rm.ico, { size: rm.main ? 40 : 22 })),
      h("span.room-text", h("strong", rm.title, rm.route ? icon("next", { size: 14 }) : null), rm.main ? h("span.room-does", rm.does) : null, h("small.room-note", rm.note)),
      open ? h("span.room-open", "Open below") : null
    );
  }

  // The dream as a quest path: finished stages, the current one with its
  // goals and a finish button, and the stages still to come.
  function dreamCard(dream, prog) {
    if (!dream) {
      return h("section.dream-card", h("h3", icon("dream", { size: 20 }), " No dream picked yet"), h("p", "Every creature in Coinhaven has a dream. Pick one to work toward."), h("div.row", h("button", { type: "button", onclick: () => go("dream") }, "Pick a dream")));
    }
    const box = h("section.dream-card", h("h3", icon(dream.mark || "dream", { size: 20 }), ` ${dream.title}`), h("p", dream.story), h("p.note.tight", dream.why), meters(prog));
    if (prog.complete) {
      add(box, h("p.callout.good", icon("check", { size: 16 }), " ", dream.finish), h("div.row", h("button.secondary", { type: "button", onclick: () => go("dream") }, "Pick a new dream")));
      return box;
    }
    add(box, h("ol.dream-path", prog.stages.map((st) => stageItem(st))));
    add(box, h("div.row", h("button.link", { type: "button", onclick: () => go("dream") }, "Change the dream")));
    return box;
  }

  function stageItem(st) {
    const life = game.life;
    const head = h("div.stage-head", h("span.stage-num", st.done ? icon("check", { size: 16 }) : String(st.index + 1)), h("strong", st.title), st.done ? h("small.good-text", " Done") : !st.current ? h("small.muted", " Locked") : null);
    if (st.done) return h("li.stage.done", head);
    const goals = h(
      "ul.dream-goals",
      st.goals.map((g) => h("li", { class: g.ok ? "ok" : g.locked ? "locked" : "" }, icon(g.ok ? "check" : g.locked ? "lock" : g.icon, { size: 14 }), ` ${g.label}`, g.locked ? h("small.muted", ` (${g.locked.replace("Opens", "opens")})`) : st.current ? h("small.muted", ` (${g.text})`) : null))
    );
    if (!st.current) return h("li.stage.locked", head, goals);
    const item = h("li.stage.current", head, h("p.note.tight", st.story), goals, st.cost ? h("p.stage-cost", icon("coins", { size: 14 }), " ", stageCostText(st, life)) : null);
    if (!st.ready) {
      add(item, h("p.note.tight", "Meet every goal to finish this stage. Town Hall, the Guild Hall, the Vault and the Academy all help."));
      return item;
    }
    if (game.practice) return add(item, h("p.note.tight", "Leave practice to finish this stage."));
    const last = st.index === DREAMS[c.dream].stages.length - 1;
    const btn = h("button.big", { type: "button", "data-sound": "none" }, last ? `Make the dream come true${st.cost ? ` ($${st.cost.toLocaleString()})` : ""}` : `Finish stage ${st.index + 1}${st.cost ? ` ($${st.cost.toLocaleString()})` : ""}`);
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const r = finishStage(game.life, play, c.dream);
      if (!r.ok) {
        btn.disabled = false;
        return toast(r.message, "bad");
      }
      game.life = r.life;
      track(r.complete ? "dreamAchieved" : "dreamStage", { dream: c.dream, stage: st.index + 1, cost: st.cost || 0, score: game.life.score ?? -1 });
      const d = DREAMS[c.dream];
      celebrate(
        r.complete
          ? { kind: "dream", id: c.dream, icon: d.icon, kicker: "Dream come true!", title: d.title, text: d.finish, xp: st.xp }
          : { kind: "dreamStage", id: `${c.dream}:${st.index + 1}`, icon: d.icon, kicker: `Dream stage ${st.index + 1} of 3 done!`, title: st.title, text: `Next up: ${d.stages[st.index + 1].title}.`, xp: st.xp }
      );
      refreshWho();
      await game.persist("dream");
      paint();
    });
    return add(item, h("div.row", btn));
  }

  // Chapter 2: fix up your Cottage with cash or a home improvement loan.
  // Upgrades show on the kingdom map.
  function homeCard() {
    play.home ??= [];
    const box = h(
      "section.dream-card.home-card-box",
      h("h3", icon("home", { size: 20 }), " Fix up your Cottage"),
      h("p.note.tight", "Pay cash, or take a home improvement loan and pay it back monthly. Upgrades show on your kingdom map.")
    );
    for (const u of HOME_UPGRADES) {
      const card = h("article.home-card", h("h3", `${u.icon} ${u.name}`), h("p.tight", h("strong", money(u.price)), ` · ${u.about}`));
      if (play.home.includes(u.id)) {
        add(card, h("p.good-text.tight", icon("check", { size: 14 }), " Done"));
      } else if (!game.practice) {
        add(
          card,
          loanPicker({
            life: game.life,
            item: u,
            quote: (plan) => homeQuote(game.life, u, plan),
            terms: u.loan?.terms,
            onBuy: async (plan) => {
              const r = resolveChoice(game.life, { steps: homeSteps(u, plan) });
              if (!r.ok) return toast(r.message, "bad");
              game.life = r.life;
              track("homeUpgrade", { id: u.id, cash: Boolean(plan.cash), term: plan.term || 0, approved: !r.denied });
              if (r.denied) {
                toast(r.message, "bad");
              } else {
                play.home.push(u.id);
                celebrate({ kind: "home", id: u.id, icon: u.icon, kicker: plan.cash ? "Paid in full!" : "Loan approved!", title: u.name, text: plan.cash ? "Your Cottage looks even better." : "Your first payment comes out at the next End Month." });
              }
              refreshWho();
              await game.persist("homeUpgrade");
              paint();
            },
          })
        );
      }
      add(box, card);
    }
    return box;
  }

  paint();
  firstVisitLesson({ game, track, id: "cottage", route: "cottage" });
}
