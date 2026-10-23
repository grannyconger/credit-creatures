// Lantern Alley (Phase 12, Chapter 5): shops with loud signs and small print.
// Read the fine print, call it a trap or a fair deal, then see the real cost.
// Each stall pays bonus XP once, for a right call. Accuracy counts toward
// Standard 5 at the Academy, like a Practice Desk answer.
// A page of the Mossy Bestiary (2026-10-23): the alley at night. Each stall is
// a painted sign hanging from an iron bracket under a lantern. The fine print
// is a paper tag tucked under the sign, and the verdict is stamped on it.
import { h, fill } from "../dom.js";
import { burstFrom } from "../motion/particles.js";
import { icon } from "../icons.js";
import { placeHeader } from "../place-header.js";
import { firstVisitLesson } from "../guide.js";
import { inkStampSvg, stringSvg } from "../bestiary-art.js";
import { sfx } from "../sound.js";
import { STALLS, alleyProgress } from "../../data/alley.js";
import { CONFIG } from "../../data/config.js";
import * as P from "../../play.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const play = run.play;
  play.alley ??= { checked: {} };
  const panel = h("section.panel.place-screen.alley");
  root.append(h("div.bestiary.bst-alley", panel));
  // Which stalls had their fine print opened, and when each one was shown.
  const opened = new Set();
  const shownAt = Date.now();
  let open = null;
  track("alleyOpen", alleyProgress(play));

  function paint() {
    const prog = alleyProgress(play);
    fill(
      panel,
      placeHeader({ go, iconName: "lantern", title: "Lantern Alley", subtitle: "Bright signs, small print. Read every offer before you decide.", practice: run.practice }),
      // A notice nailed to the alley wall.
      h(
        "div.al-top",
      h(
        "section.al-notice",
        h("span.al-notice-string", { "aria-hidden": "true", html: stringSvg() }),
        h("h2", "Before you say yes to any offer, find three things"),
        h("ol", h("li", h("strong", "The total cost"), ": every payment and fee added up."), h("li", h("strong", "The APR"), ": the yearly cost, so you can compare."), h("li", h("strong", "What you lose"), " if you can't pay on time."))
      ),
      h("div.al-top-side", h("p.alley-score", icon("lantern", { size: 18 }), ` ${prog.checked} of ${prog.total} stalls checked`, prog.checked ? `, ${prog.right} called right` : ""),
      h("p.bst-margin.al-margin", "The brightest signs usually have the smallest print. This is not a coincidence."))
      ),
      h("div.stall-grid", STALLS.map(stallCard))
    );
  }

  function stallCard(s) {
    const done = play.alley.checked[s.id];
    const isOpen = open === s.id;
    const card = h(`article.stall${done ? ".checked" : ""}${isOpen ? ".open" : ""}`, { "data-stall": s.id });
    // The bracket and lantern, then the painted sign itself.
    const head = h(
      "div.stall-head",
      h("span.al-bracket", { "aria-hidden": "true" }, h("span.al-lantern", icon("lantern", { size: 26 }))),
      h("div.al-sign", h("span.stall-art", { "aria-hidden": "true" }, icon(s.mark || "lantern", { size: 30 })), h("div", h("h3", s.name), h("p.stall-pitch", s.pitch)))
    );
    if (done && !isOpen) {
      return fill(
        card,
        head,
        h("div.al-tag.done", h("span.al-stamp", { class: s.trap ? "trap" : "fair", "aria-hidden": "true", html: inkStampSvg(s.trap ? "TRAP" : "FAIR DEAL", { seed: s.id.length }) }), h("p.stall-verdict", icon(s.trap ? "alert" : "check", { size: 16 }), s.trap ? " Trap" : " Fair deal", done.right ? ", and you called it" : ", and you missed this one")),
        h("button.secondary.small", { type: "button", onclick: () => ((open = s.id), paint()) }, "See the math again")
      );
    }
    if (!isOpen) return fill(card, head, h("button.small", { type: "button", onclick: () => ((open = s.id), paint()) }, "Look closer"));

    const fine = h("div.fine-print.al-tag", { hidden: !opened.has(s.id) }, h("p.al-tag-title", "The fine print"), h("ul.tight", s.fine.map((f) => h("li", f))));
    const readBtn = opened.has(s.id)
      ? null
      : h(
          "button.secondary.small",
          {
            type: "button",
            onclick: () => {
              opened.add(s.id);
              track("alleyFinePrint", { stall: s.id });
              paint();
            },
          },
          icon("info", { size: 14 }),
          " Read the fine print"
        );

    if (done) return fill(card, head, fine, reveal(s, done), closeBtn());
    return fill(
      card,
      head,
      readBtn,
      fine,
      h("p.al-ask", "Trap or fair deal?"),
      h(
        "div.row.al-calls",
        h("button", { type: "button", "data-sound": "none", onclick: () => decide(s, true) }, icon("alert", { size: 16 }), " It's a trap"),
        h("button", { type: "button", "data-sound": "none", onclick: () => decide(s, false) }, icon("check", { size: 16 }), " Fair deal")
      ),
      closeBtn()
    );
  }

  const closeBtn = () => h("button.secondary.small.stall-close", { type: "button", onclick: () => ((open = null), paint()) }, "Close");

  function reveal(s, done) {
    return h(
      "div.stall-reveal.al-tag",
      h("span.al-stamp", { class: s.trap ? "trap" : "fair", "aria-hidden": "true", html: inkStampSvg(s.trap ? "TRAP" : "FAIR DEAL", { seed: s.id.length }) }),
      h("p.stall-verdict", icon(done.right ? "check" : "alert", { size: 16 }), done.right ? " You called it. " : " Not quite. ", s.trap ? "This is a trap." : "This is a fair deal."),
      done.xp ? h("p.sparkle-line", `+${done.xp} XP`) : null,
      h("p.al-tag-title", "The real cost"),
      h("ol.tight.stall-math", s.math.map((m) => h("li", m))),
      h("p.tight", h("strong", "Look for: "), s.clue),
      h("p.tight", h("strong", s.trap ? "Do this instead: " : "Why it works: "), s.better)
    );
  }

  async function decide(s, saidTrap) {
    if (play.alley.checked[s.id]) return;
    const right = saidTrap === s.trap;
    const readFine = opened.has(s.id);
    opened.add(s.id);
    const got = run.practice ? { xp: 0 } : P.recordAnswer(play, { type: "alley", standard: 5, correct: right });
    const bonus = right && !run.practice ? P.addXp(play, CONFIG.pacing.xp.alleyStall) : 0;
    play.alley.checked[s.id] = { right, xp: got.xp + bonus, readFine };
    if (right) {
      sfx.correct();
      burstFrom(document.activeElement, "motes", { n: 22 });
    } else sfx.error();
    track("alleyCall", { stall: s.id, trap: s.trap, saidTrap, correct: right, readFine, seconds: Math.round((Date.now() - shownAt) / 1000), xp: got.xp + bonus });
    refreshWho();
    paint();
    await run.persist("alleyCall");
  }

  paint();
  firstVisitLesson({ game, track, id: "alley", route: "alley" });
}
