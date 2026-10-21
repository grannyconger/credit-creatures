// Chapter summary and reflection (SPEC §9): score change, best and worst
// decision, then one question plus fun and clarity ratings for the teacher.
import { h, add, fill, money } from "../dom.js";
import { creatureSvg } from "../creature-art.js";
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
    run.practice ? h("p.callout.warn.practice", "🔁 Practice results. Nothing here is saved.") : null,
    h(
      "div.hero",
      h("div.hero-art", { html: creatureSvg(c, { size: 140 }) }),
      h("div", h("p.step-label", `Chapter ${s.chapter} complete`), h("h1", s.title), h("p.muted", "Here's how it went."))
    ),
    h(
      "div.stat-grid",
      stat("Credit score", scoreText, delta == null ? "" : delta > 0 ? "up" : delta < 0 ? "down" : ""),
      stat("Checking", `${money(s.startChecking)} → ${money(s.endChecking)}`),
      stat("Fees paid", money(s.fees), s.fees > 0 ? "down" : ""),
      stat("Late payments", String(s.lates), s.lates > 0 ? "down" : "up")
    ),
    h(
      "div.best-worst",
      s.best ? moment("👍 Best move", s.best, "good") : null,
      s.worst ? moment("👎 Toughest moment", s.worst, "bad") : h("div.callout.good", h("p", h("strong", "👎 Toughest moment")), h("p", "No risky choices this chapter. Nice."))
    ),
    c.dream && DREAMS[c.dream] ? dreamBlock(c, run.life) : null,
    h(
      "details.months",
      h("summary", "Month by month"),
      s.records.map((r, i) => monthSummary(r, `Month ${i + 1}: ${r.change}`))
    )
  );

  if (run.practice) {
    add(panel, h("div.row", h("button.big", { type: "button", onclick: () => ((game.practice = null), go("hub")) }, "Back to my real game")));
  } else {
    add(panel, reflectionForm(s, run, go, track));
  }
  root.append(panel);
}

// Where the dream stands after this chapter (teacher request: keep the purpose in view).
function dreamBlock(c, life) {
  const d = DREAMS[c.dream];
  const prog = dreamProgress(life, c.dream);
  return h(
    "section.dream-card",
    h("h3", `${d.icon} ${c.name}'s dream: ${d.title}`),
    meters(prog),
    h("p.note.tight", prog.ready ? "Everything's ready. Make it come true in your Cottage!" : `${Math.round(prog.overall * 100)}% of the way there. Saving and paying on time move it forward.`)
  );
}

function stat(label, value, dir = "") {
  return h("div.stat", { class: dir }, h("span.stat-value", value), h("span.stat-label", label));
}

function moment(title, d, cls) {
  return h("div.callout", { class: cls }, h("p", h("strong", title)), h("p", `${d.icon} ${P.titled(d.title)}"${d.label}"`), d.outcome ? h("p.note.tight", d.outcome) : null);
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

function reflectionForm(s, run, go, track) {
  const question = chapterInfo(s.chapter).reflect;
  const text = h("textarea", { id: "reflection", rows: 4, maxlength: REFLECTION_MAX, "aria-describedby": "reflection-help" });
  const count = h("span.muted", `0 / ${REFLECTION_MAX}`);
  text.addEventListener("input", () => (count.textContent = `${text.value.length} / ${REFLECTION_MAX}`));
  const fun = ratingGroup("fun", "How fun was this chapter?");
  const clear = ratingGroup("clear", "How clear was it?");
  const error = h("p.error", { role: "alert" });
  const btn = h("button.big", { type: "submit" }, "Save my reflection");
  const form = h(
    "form.reflection",
    h("h2", "✍️ Reflect"),
    h("label", { for: "reflection" }, question),
    h("p.note.tight", { id: "reflection-help" }, "Write 1 to 3 sentences. Your teacher reads these. Don't include personal info like your real name or address."),
    text,
    h("p.note.tight", count),
    fun.el,
    clear.el,
    error,
    h("div.row", btn)
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
    track("reflection", { chapter: s.chapter, chars: words.length, seconds: Math.round((Date.now() - started) / 1000) });
    track("chapterRating", { chapter: s.chapter, fun: fun.value, clear: clear.value });
    await run.persist("reflection");
    go("hub");
  });
  return form;
}
