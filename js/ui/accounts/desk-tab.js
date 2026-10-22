// Practice Desk (SPEC §14): 5 quick questions with new numbers each visit,
// instant feedback with the worked math, accuracy by standard, and Unicorn
// Sparkle Points for right answers (SPEC §15).
import { icon } from "../icons.js";
import { h } from "../dom.js";
import { createRng } from "../../engine/index.js";
import { QUESTION_TYPES, DESK_QUESTIONS, STANDARD_LABELS } from "../../data/practice-questions.js";
import * as P from "../../play.js";
import { finishDeskVisit } from "../../progress.js";

let session = null;

// Questions with arithmetic say "The math". The rest explain "Why".
const NUMBER_TYPES = new Set(["runningBalance", "utilization", "monthlyInterest", "tipMath"]);

function newSession(play) {
  const rng = createRng(`desk:${Date.now()}:${play.desk.visits}`);
  const types = Object.keys(QUESTION_TYPES);
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return {
    questions: types.slice(0, DESK_QUESTIONS).map((type) => ({ type, ...QUESTION_TYPES[type].make(rng) })),
    k: 0,
    right: 0,
    sparkle: 0,
    chosen: null,
    shownAt: Date.now(),
  };
}

export function deskTab(ctx) {
  const play = ctx.run.play;
  if (!session) return startView(play, ctx);
  if (session.k >= session.questions.length) return doneView(play, ctx);
  return questionView(play, ctx);
}

function startView(play, { track, repaint, run }) {
  const left = P.sparkleLeft(play);
  return h(
    "div.desk",
    h("h2", icon("scroll", { size: 24 }), " Practice Desk"),
    h("p", `${DESK_QUESTIONS} quick questions with new numbers every time. Real math is fine. Grab a calculator if you want one.`),
    run.practice ? null : h("p.sparkle-line", icon("star", { size: 16 }), P.answerXpLeft(play) ? ` ${P.answerXpLeft(play)} XP from right answers left this chapter.` : " You've earned all the answer XP for this chapter. Practice still counts for your teacher."),
    h("p.sparkle-line", icon("sparkle", { size: 16 }), run.practice ? " Practice mode: Sparkle Points and XP aren't saved." : left ? ` Each right answer earns 1 Sparkle Point. ${left} left this chapter.` : " You've earned all the Sparkle Points you can for now. Practice still counts for your teacher."),
    h(
      "div.row",
      h(
        "button.big",
        {
          type: "button",
          onclick: () => {
            play.desk.visits++;
            session = newSession(play);
            track("deskStart", { visit: play.desk.visits });
            repaint();
          },
        },
        "Start practice"
      )
    ),
    accuracy(play)
  );
}

function questionView(play, { track, save, repaint }) {
  const q = session.questions[session.k];
  const meta = QUESTION_TYPES[q.type];
  const answered = session.chosen != null;
  const correct = answered && session.chosen === q.answer;
  return h(
    "div.desk",
    h("p.step-label", `Question ${session.k + 1} of ${session.questions.length} · ${meta.label} · ${STANDARD_LABELS[meta.standard]}`),
    h("div.desk-prompt", q.prompt.map((line) => h("p", line))),
    h(
      "div.dc-choices",
      { role: "group", "aria-label": "Answers" },
      q.choices.map((c, i) =>
        h(
          "button.dc-choice.desk-choice",
          {
            type: "button",
            disabled: answered,
            class: answered && i === q.answer ? "right" : answered && i === session.chosen ? "wrong" : "",
            onclick: async () => {
              session.chosen = i;
              const ok = i === q.answer;
              if (ok) session.right++;
              const got = P.recordAnswer(play, { type: q.type, standard: meta.standard, correct: ok });
              session.sparkle += got.sparkle;
              track("question", { qtype: q.type, standard: meta.standard, correct: ok, seconds: Math.round((Date.now() - session.shownAt) / 1000), sparkle: got.sparkle, xp: got.xp });
              repaint();
              await save("desk");
            },
          },
          answered && i === q.answer ? "✓ " : answered && i === session.chosen ? "✗ " : "",
          c
        )
      )
    ),
    answered
      ? h(
          "div",
          h("div.callout", { class: correct ? "good" : "bad", role: "status" }, h("p", icon(correct ? "check" : "alert", { size: 16 }), " ", h("strong", correct ? "Right!" : `Not quite. The answer is ${q.choices[q.answer]}.`)), h("p", h("strong", NUMBER_TYPES.has(q.type) ? "The math: " : "Why: "), q.math)),
          h(
            "div.row",
            h(
              "button.big",
              {
                type: "button",
                onclick: () => {
                  session.k++;
                  session.chosen = null;
                  session.shownAt = Date.now();
                  repaint();
                },
              },
              session.k + 1 < session.questions.length ? "Next question" : "See my results"
            )
          )
        )
      : null
  );
}

function doneView(play, { track, repaint, save }) {
  const s = session;
  track("deskDone", { right: s.right, total: s.questions.length, sparkle: s.sparkle });
  finishDeskVisit(play, s.right, s.questions.length);
  session = null;
  save("deskDone");
  return h(
    "div.desk",
    h("h2", `You got ${s.right} of ${s.questions.length} right`),
    s.sparkle ? h("p.sparkle-line", icon("sparkle", { size: 16 }), ` +${s.sparkle} Unicorn Sparkle Point${s.sparkle === 1 ? "" : "s"}`) : null,
    h("div.row", h("button.big", { type: "button", onclick: () => repaint() }, "Practice again")),
    accuracy(play)
  );
}

function accuracy(play) {
  const rows = Object.entries(STANDARD_LABELS).map(([std, label]) => {
    const r = play.desk.byStandard[std];
    return r ? h("li", h("span", label), h("strong", `${r.right} of ${r.total} (${Math.round((r.right / r.total) * 100)}%)`)) : null;
  });
  if (rows.every((r) => !r)) return null;
  return h("section", h("h3", "Your accuracy by standard"), h("ul.upcoming", rows));
}
