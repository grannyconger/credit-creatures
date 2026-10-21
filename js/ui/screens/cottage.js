// Your Cottage: the creature menu, open from anywhere by clicking the creature
// in the top bar. Its dream, its look, its rank, and your settings.
import { h, add, fill, money, ageLabel, toast } from "../dom.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { fullName } from "../../data/creatures.js";
import { DREAMS, dreamProgress, finishStage, stageCostText } from "../../data/dreams.js";
import { rankFor } from "../../progress.js";
import { placeHeader } from "../place-header.js";
import { settingsControls } from "../settings-controls.js";
import { celebrate } from "../celebrate.js";
import { firstVisitLesson } from "../guide.js";
import { hasFeature } from "../../progression.js";
import { HOME_UPGRADES, homeQuote, homeSteps } from "../../data/garage.js";
import { loanPicker } from "../loan-picker.js";
import { resolveChoice } from "../../engine/index.js";
import { xpBar } from "./trophies.js";
import { meters } from "./hub.js";

export function render(root, { game, go, track, refreshWho, back }) {
  const play = game.play;
  const c = game.save.creature;
  const panel = h("section.panel.place-screen.cottage");
  root.append(panel);
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
    fill(
      panel,
      placeHeader({ go, iconName: "cottage", title: `${c.name}'s Cottage`, subtitle: "Your creature, its dream, and your settings." }),
      h(
        "div.cottage-grid",
        h(
          "div.cottage-stage",
          { class: c.background && c.background !== "none" ? `creature-stage bg-${c.background}` : "" },
          h("div", { html: creatureSvg(c, { size: 220, ageMonths: life?.ageMonths || 0 }) }),
          h("h2", fullName(c)),
          h("p.muted.tight", `${life ? ageLabel(life.ageMonths) : ""} · ${r.icon} ${r.title}`),
          xpBar(play.xp),
          h(
            "div.row",
            h("button", { type: "button", onclick: () => go("creature") }, icon("palette", { size: 18 }), " Customize"),
            h("button.secondary", { type: "button", onclick: () => go("trophies") }, icon("trophy", { size: 18 }), " Trophies"),
            game.classInfo?.social === false ? null : h("button.secondary", { type: "button", onclick: () => go("friends") }, icon("people", { size: 18 }), " Friends")
          )
        ),
        h("div.cottage-side", dreamCard(dream, prog), hasFeature(play, "homeLoan") ? homeCard() : null, settingsCard())
      )
    );
  }

  // The dream as a quest path: finished stages, the current one with its
  // goals and a finish button, and the stages still to come.
  function dreamCard(dream, prog) {
    if (!dream) {
      return h("section.dream-card", h("h3", icon("dream", { size: 20 }), " No dream picked yet"), h("p", "Every creature in Coinhaven has a dream. Pick one to work toward."), h("div.row", h("button", { type: "button", onclick: () => go("dream") }, "Pick a dream")));
    }
    const box = h("section.dream-card", h("h3", `${dream.icon} ${dream.title}`), h("p", dream.story), h("p.note.tight", dream.why), meters(prog));
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
      st.goals.map((g) => h("li", { class: g.ok ? "ok" : "" }, icon(g.ok ? "check" : g.icon, { size: 14 }), ` ${g.label}`, st.current ? h("small.muted", ` (${g.text})`) : null))
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

  function settingsCard() {
    return h(
      "section.settings-card",
      h("h3", icon("gear", { size: 20 }), " Settings"),
      h("p.note.tight", "Dark mode and a dyslexia-friendly font. These follow you to any computer."),
      settingsControls({
        current: { appearance: "system", reading: "standard", ...(play.settings || {}) },
        onChange: async (s) => {
          play.settings = s;
          track("settingsChanged", s);
          await game.persist("settings");
        },
      })
    );
  }

  paint();
  firstVisitLesson({ game, track, id: "cottage", route: "cottage" });
}
