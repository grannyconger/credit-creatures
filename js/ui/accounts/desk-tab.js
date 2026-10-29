// Practice Desk (SPEC §14): 5 quick questions with new numbers each visit,
// instant feedback with the worked math, accuracy by standard, and XP for
// right answers.
import { icon } from "../icons.js";
import { calcWidget } from "../minigames/calculator.js";
import { formulaBox } from "../formula.js";
import { burstFrom } from "../motion/particles.js";
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
    xp: 0,
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
  return h(
    "div.desk",
    h("h2", icon("scroll", { size: 24 }), " Practice Desk"),
    h("p", `${DESK_QUESTIONS} quick questions with new numbers every time. Real math is fine. Every question has a calculator, and the math questions show a formula.`),
    h("p.reward-line", icon("star", { size: 16 }), run.practice ? " Practice mode: XP isn't saved." : P.answerXpLeft(play) ? ` ${P.answerXpLeft(play)} XP from right answers left this chapter.` : " You've earned all the answer XP for this chapter. Practice still counts for your teacher."),
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

// A formula for the questions with arithmetic, and a calculator on every question.
function deskTools(meta, track) {
  const cw = calcWidget({ onOpen: () => track("calcOpen", { game: "desk" }), onUse: () => track("calcUse", { game: "desk" }) });
  return h("div.vault-desk-tools", formulaBox(meta.formula), h("div.desk-calc", cw.toggle, cw.slot));
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
    deskTools(meta, track),
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
            onclick: async (e) => {
              session.chosen = i;
              const ok = i === q.answer;
              if (ok) burstFrom(e.currentTarget, "motes");
              if (ok) session.right++;
              const got = P.recordAnswer(play, { type: q.type, standard: meta.standard, correct: ok });
              session.xp += got.xp;
              track("question", { qtype: q.type, standard: meta.standard, correct: ok, seconds: Math.round((Date.now() - session.shownAt) / 1000), xp: got.xp });
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
  track("deskDone", { right: s.right, total: s.questions.length, xp: s.xp });
  finishDeskVisit(play, s.right, s.questions.length);
  session = null;
  save("deskDone");
  return h(
    "div.desk",
    h("h2", `You got ${s.right} of ${s.questions.length} right`),
    s.xp ? h("p.reward-line", icon("star", { size: 16 }), ` +${s.xp} XP`) : null,
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
