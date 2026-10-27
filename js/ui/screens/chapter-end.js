// Chapter summary (SPEC §9): a big celebration, then the score change, best
// and worst decision, and one button on to the next chapter. No reflections
// (teacher decision 2026-10-26).
// A page of the Mossy Bestiary (2026-10-23): the naturalist's chapter report,
// with the numbers as a ruled record, the best and toughest moments as two
// field observations.
import { afterChapter } from "../../progression.js";
import { celebrate } from "../celebrate.js";
import { h, add, fill, money } from "../dom.js";
import { creatureSvg } from "../creature-art.js";
import { icon } from "../icons.js";
import { sealSvg, fernSvg } from "../bestiary-art.js";
import { CONFIG } from "../../data/config.js";
import { confetti } from "../fx.js";
import { sfx } from "../sound.js";
import { synth } from "../arcade-sound.js";
import { burstFrom } from "../motion/particles.js";
import { react } from "../motion/gaze.js";
import * as P from "../../play.js";
import { monthSummary } from "../month-summary.js";
import { DREAMS, dreamProgress } from "../../data/dreams.js";
import { meters } from "./hub.js";

const XP_CHAPTER = CONFIG.pacing.xp.chapterDone;

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const s = run.play.summary;
  if (!s) return go("hub");
  const c = game.save.creature;
  const delta = s.endScore != null && s.startScore != null ? s.endScore - s.startScore : null;
  track("chapterSummary", { chapter: s.chapter, practice: run.practice, delta: delta ?? 0 });
  refreshWho();

  const scoreText =
    s.endScore == null ? "No score yet" : delta == null ? `${s.endScore} (your first score!)` : `${s.startScore} → ${s.endScore}`;

  const panel = h(
    "section.panel.chapter-end",
    run.practice ? h("p.callout.warn.practice", icon("info", { size: 18 }), " Practice results. Nothing here is saved.") : null,
    h(
      "header.ce-head",
      h("figure.ce-portrait", { "aria-hidden": "true" }, h("span", { html: creatureSvg(c, { size: 130, label: "" }) })),
      h("div", h("h1", s.title), h("p.bst-margin.ce-kicker", `Chapter ${s.chapter} is done. Here's what the naturalist wrote down.`))
    ),
    h(
      "dl.ce-record",
      stat("Credit score", scoreText, delta == null ? "" : delta > 0 ? "up" : delta < 0 ? "down" : ""),
      stat("Checking", `${money(s.startChecking)} → ${money(s.endChecking)}`),
      stat("Fees paid", money(s.fees), s.fees > 0 ? "down" : ""),
      stat("Late payments", String(s.lates), s.lates > 0 ? "down" : "up")
    ),
    h(
      "div.ce-moments",
      s.best ? moment("Best move", s.best, "good") : null,
      s.worst ? moment("Toughest moment", s.worst, "bad") : h("article.ce-moment.good", h("h3", icon("check", { size: 18 }), "Toughest moment"), h("p", "No risky choices this chapter. The naturalist had nothing to worry about."))
    ),
    c.dream && DREAMS[c.dream] ? dreamBlock(c, run.life, run.play) : null,
    h(
      "details.months",
      h("summary", "Month by month"),
      s.records.map((r, i) => monthSummary(r, `Month ${i + 1}: ${r.change}`))
    )
  );

  if (run.practice) {
    add(panel, h("div.row", h("button", { type: "button", onclick: () => ((game.practice = null), go("hub")) }, "Back to my real game")));
  }
  root.append(
    h(
      "div.bestiary.bst-chapter-end",
      h("div.bst-decor", { "aria-hidden": "true" }, h("span.bst-fern-left", { html: fernSvg({ seed: 63, curl: 0.36, width: 140, height: 260 }) })),
      panel,
      run.practice ? null : continueButton(s, run, go, track, c.name)
    )
  );
  if (!run.practice) {
    chapterParty(s, c, XP_CHAPTER);
    track("chapterCelebrate", { chapter: s.chapter });
  }
}

// Where the dream stands after this chapter (teacher request: keep the purpose in view).
function dreamBlock(c, life, play) {
  const d = DREAMS[c.dream];
  const prog = dreamProgress(life, c.dream, play);
  return h(
    "section.dream-card",
    h("h3", icon(d.mark || "dream", { size: 20 }), `${c.name}'s dream: ${d.title}`),
    meters(prog),
    h("p.note.tight", prog.complete ? "Your creature's dream came true!" : prog.ready ? `Stage ${prog.stageIndex + 1} is ready. Finish it in your Cottage!` : `${Math.round(prog.overall * 100)}% of the way there. Every goal you meet moves it forward.`)
  );
}

// One ruled line of the record. Up or down is said with an arrow and a word, not color alone.
function stat(label, value, dir = "") {
  return h("div.ce-line", { class: dir || null }, h("dt", label), h("dd", value, dir ? h("small", dir === "up" ? " (better)" : " (worse)") : null));
}

function moment(title, d, cls) {
  return h("article.ce-moment", { class: cls }, h("h3", icon(cls === "good" ? "up" : "down", { size: 18 }), title), h("p", `${P.titled(d.title)}"${d.label}"`), d.outcome ? h("p.ce-outcome", d.outcome) : null);
}

// The big moment (teacher request 2026-10-26): finishing a chapter gets the
// loudest celebration in the game. Waves of falling leaves, a fanfare, the
// creature hopping and a stamp. Any click or key skips to the report.
function chapterParty(s, c, xp) {
  const go = h("button.bst-seal-btn", { type: "button" }, h("span.bst-seal-wax", { html: sealSvg({ seed: 43, size: 84, letter: String(s.chapter) }) }), h("span.bst-seal-text", "See my chapter report"));
  const critter = h("div.ce-party-creature", { "aria-hidden": "true", html: creatureSvg(c, { size: 220, label: "" }) });
  const body = h(
    "div.celebrate-body.ce-party-body",
    h("p.celebrate-kicker.bst-stamp-word", `Chapter ${s.chapter} complete!`),
    critter,
    h("h2", { id: "ce-party-title" }, s.title),
    h("p", { id: "ce-party-text" }, `${c.name} made it through every month. The naturalist is honestly impressed.`),
    h("p.celebrate-xp", `+${xp} XP`),
    h("div.row", go)
  );
  const dialog = h("dialog.celebrate.bst-scope.bst-celebrate.ce-party", { "aria-labelledby": "ce-party-title", "aria-describedby": "ce-party-text" }, h("div.ce-party-glow", { "aria-hidden": "true" }), body);
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(() => dialog.open && fn(), ms));
  const close = () => {
    timers.forEach(clearTimeout);
    if (dialog.open) dialog.close();
    dialog.remove();
  };
  go.addEventListener("click", close);
  dialog.addEventListener("cancel", (e) => (e.preventDefault(), close()));
  document.body.append(dialog);
  dialog.showModal();
  go.focus();
  [0, 650, 1300, 2000].forEach((ms, i) => later(ms, () => dialog.prepend(confetti(i ? 60 : 90))));
  later(200, () => burstFrom(critter, "leaves", { n: 40 }));
  later(700, () => burstFrom(critter, "coins", { n: 16 }));
  later(1400, () => burstFrom(go, "leaves", { n: 30 }));
  later(2100, () => burstFrom(critter, "motes", { n: 24 }));
  synth("fanfare");
  later(900, () => sfx.levelUp());
  later(300, () => react("happy"));
  later(1500, () => react("happy"));
}

function continueButton(s, run, go, track, creatureName) {
  const btn = h("button.bst-seal-btn", { type: "button" }, h("span.bst-seal-wax", { html: sealSvg({ seed: 71, size: 80, letter: String(s.chapter + 1) }) }), h("span.bst-seal-text", `On to Chapter ${s.chapter + 1}`));
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    P.completeChapter(run.play);
    // Phase 10: between chapters (after Chapter 1, time jumps to age 18).
    const between = afterChapter(run.play, run.life, s.chapter);
    if (between.skipped) {
      run.life = between.life;
      const k = between.skipped;
      track("timeSkip", { months: k.months, earned: k.earned, spent: k.spent });
      celebrate({ kind: "timeSkip", id: String(s.chapter), icon: "⏳", kicker: "Time flies!", title: `${k.months} months later, ${creatureName} is 18`, text: `A part-time job paid ${money(k.earned)} along the way, and ${money(k.spent)} went to everyday things. Now you're old enough to borrow money.` });
    }
    track("chapterContinue", { chapter: s.chapter });
    await run.persist("chapterDone");
    go("hub");
  });
  return h("div.bst-actions.ce-continue", btn);
}
