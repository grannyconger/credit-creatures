// Chapter summary and reflection (SPEC §9): score change, best and worst
// decision, then one question plus fun and clarity ratings for the teacher.
// A page of the Mossy Bestiary (2026-10-23): the naturalist's chapter report,
// with the numbers as a ruled record, the best and toughest moments as two
// field observations, and the reflection on a lined notebook page beneath.
import { afterChapter } from "../../progression.js";
import { celebrate } from "../celebrate.js";
import { h, add, fill, money } from "../dom.js";
import { creatureSvg } from "../creature-art.js";
import { icon } from "../icons.js";
import { sealSvg, fernSvg } from "../bestiary-art.js";
import { chapterInfo, RATING_LABELS, REFLECTION_MAX } from "../../data/chapters.js";
import * as P from "../../play.js";
import { monthSummary } from "../month-summary.js";
import { DREAMS, dreamProgress } from "../../data/dreams.js";
import { meters } from "./hub.js";

const MIN_CHARS = 15;

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
      run.practice ? null : reflectionForm(s, run, go, track, game.save.creature.name)
    )
  );
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

function ratingGroup(name, question) {
  let value = 0;
  const group = h(
    "div.rating",
    { role: "radiogroup", "aria-label": question },
    RATING_LABELS[name].map((label, i) =>
      h(
        "button.rating-option",
        {
          type: "button",
          role: "radio",
          "aria-checked": "false",
          "aria-label": `${i + 1}: ${label}`,
          onclick: (e) => {
            value = i + 1;
            group.querySelectorAll(".rating-option").forEach((b) => b.setAttribute("aria-checked", String(b === e.currentTarget)));
          },
        },
        h("strong", String(i + 1)),
        h("small", label)
      )
    )
  );
  return { el: h("fieldset.rating-set", h("legend", question), group), get value() {
    return value;
  } };
}

function reflectionForm(s, run, go, track, creatureName) {
  const question = chapterInfo(s.chapter, run.play).reflect;
  const text = h("textarea", { id: "reflection", rows: 4, maxlength: REFLECTION_MAX, "aria-describedby": "reflection-help" });
  const count = h("span.muted", `0 / ${REFLECTION_MAX}`);
  text.addEventListener("input", () => (count.textContent = `${text.value.length} / ${REFLECTION_MAX}`));
  const fun = ratingGroup("fun", "How fun was this chapter?");
  const clear = ratingGroup("clear", "How clear was it?");
  const error = h("p.error", { role: "alert" });
  const btn = h("button.bst-seal-btn", { type: "submit" }, h("span.bst-seal-wax", { html: sealSvg({ seed: 71, size: 80, letter: String(s.chapter) }) }), h("span.bst-seal-text", "Save my reflection"));
  const form = h(
    "form.reflection.ce-notebook",
    h("h2", "Your field notebook"),
    h("label", { for: "reflection" }, question),
    h("p.note.tight", { id: "reflection-help" }, "Write 1 to 3 sentences. Your teacher reads these. Don't include personal info like your real name or address."),
    text,
    h("p.note.tight", count),
    fun.el,
    clear.el,
    error,
    h("div.bst-actions", btn)
  );
  const started = Date.now();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const words = text.value.trim();
    if (words.length < MIN_CHARS) {
      error.textContent = "Write at least one full sentence.";
      return text.focus();
    }
    if (!fun.value || !clear.value) {
      error.textContent = "Pick a number for both questions.";
      return;
    }
    btn.disabled = true;
    P.submitReflection(run.play, { text: words, fun: fun.value, clear: clear.value });
    // Phase 10: between chapters (after Chapter 1, time jumps to age 18).
    const between = run.practice ? { skipped: null } : afterChapter(run.play, run.life, s.chapter);
    if (between.skipped) {
      run.life = between.life;
      const k = between.skipped;
      track("timeSkip", { months: k.months, earned: k.earned, spent: k.spent });
      celebrate({ kind: "timeSkip", id: String(s.chapter), icon: "⏳", kicker: "Time flies!", title: `${k.months} months later, ${creatureName} is 18`, text: `A part-time job paid ${money(k.earned)} along the way, and ${money(k.spent)} went to everyday things. Now you're old enough to borrow money.` });
    }
    track("reflection", { chapter: s.chapter, chars: words.length, seconds: Math.round((Date.now() - started) / 1000) });
    track("chapterRating", { chapter: s.chapter, fun: fun.value, clear: clear.value });
    await run.persist("reflection");
    go("hub");
  });
  return form;
}
