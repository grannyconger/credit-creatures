// Your Cottage: the creature menu, open from anywhere by clicking the creature
// in the top bar. Its dream, its look, its rank, and your settings.
import { h, add, fill, money, ageLabel, toast } from "../dom.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { fullName } from "../../data/creatures.js";
import { DREAMS, dreamProgress } from "../../data/dreams.js";
import { moveToChecking, debitPurchase } from "../../engine/index.js";
import { rankFor } from "../../progress.js";
import { placeHeader } from "../place-header.js";
import { settingsControls } from "../settings-controls.js";
import { celebrate } from "../celebrate.js";
import { xpBar } from "./trophies.js";
import { meters } from "./hub.js";

export function render(root, { game, go, track, refreshWho, back }) {
  const play = game.play;
  const c = game.save.creature;
  const panel = h("section.panel.place-screen.cottage");
  root.append(panel);
  track("cottageOpen", {});

  function paint() {
    const life = game.life;
    const r = rankFor(play.xp);
    const dream = c.dream ? DREAMS[c.dream] : null;
    const prog = dream ? dreamProgress(life, c.dream) : null;
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
        h("div.cottage-side", dreamCard(dream, prog), settingsCard())
      )
    );
  }

  function dreamCard(dream, prog) {
    if (!dream) {
      return h("section.dream-card", h("h3", icon("dream", { size: 20 }), " No dream picked yet"), h("p", "Every creature in Coinhaven has a dream. Pick one to work toward."), h("div.row", h("button", { type: "button", onclick: () => go("dream") }, "Pick a dream")));
    }
    const box = h("section.dream-card", h("h3", `${dream.icon} ${dream.title}`), h("p", dream.story), h("p.note.tight", dream.why));
    if (play.dreamDone) {
      add(box, h("p.callout.good", icon("check", { size: 16 }), " ", dream.finish), h("div.row", h("button.secondary", { type: "button", onclick: () => go("dream") }, "Pick a new dream")));
      return box;
    }
    add(
      box,
      meters(prog),
      h(
        "ul.dream-goals",
        h("li", { class: prog.savings.ok ? "ok" : "" }, prog.savings.ok ? icon("check", { size: 14 }) : icon("piggy", { size: 14 }), ` Save ${money(prog.savings.goal)} in savings (now ${money(prog.savings.value)})`),
        h("li", { class: prog.score.ok ? "ok" : "" }, prog.score.ok ? icon("check", { size: 14 }) : icon("gauge", { size: 14 }), ` Credit score of ${prog.score.goal} or more (now ${prog.score.value ?? "none yet"})`),
        prog.habits.list.map((x) => h("li", { class: x.ok ? "ok" : "" }, x.ok ? icon("check", { size: 14 }) : icon("alert", { size: 14 }), ` ${x.label}`))
      )
    );
    if (prog.ready && !game.practice) {
      const btn = h("button.big", { type: "button" }, `Make the dream come true (${money(dream.savings)} from savings)`);
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        let r = moveToChecking(game.life, dream.savings);
        if (r.ok) r = debitPurchase(r.life, dream.savings, `dream: ${dream.title}`);
        if (!r.ok) {
          btn.disabled = false;
          return toast(r.message, "bad");
        }
        game.life = r.life;
        play.dreamDone = { dream: c.dream, month: game.life.month };
        track("dreamAchieved", { dream: c.dream, score: game.life.score ?? -1 });
        celebrate({ kind: "dream", id: c.dream, icon: dream.icon, kicker: "Dream come true!", title: dream.title, text: dream.finish });
        refreshWho();
        await game.persist("dream");
        paint();
      });
      add(box, h("div.row", btn));
    } else {
      add(box, h("p.note.tight", "Keep paying on time and saving. The Vault and the Guild Hall are how you get there."), h("div.row", h("button.link", { type: "button", onclick: () => go("dream") }, "Change the dream")));
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
}
