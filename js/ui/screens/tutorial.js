// Tutorial months (SPEC §6): a guided work shift, a debit purchase, End Month,
// a "your report is thin" explainer and a tour of the 5 score factors.
import { h, clear, money } from "../dom.js";
import { earn, debitPurchase, endMonth, tutorialShiftPay, creditReport, createRng } from "../../engine/index.js";
import { SHIFT_ITEMS, SHIFT_ITEMS_PER_SHIFT, FIRST_PURCHASES, FACTOR_TOUR } from "../../data/onboarding.js";
import { CONFIG } from "../../data/config.js";
import { monthRecord, monthSummary } from "../month-summary.js";

const STAGES = ["shift", "purchase", "month1", "thin", "factors", "month2"];
const STAGE_LABELS = ["First shift", "First purchase", "End Month", "Your report", "Your score", "End Month"];

export function render(root, ctx) {
  const { game } = ctx;
  const panel = h("section.panel.tutorial");
  root.append(panel);

  async function next() {
    game.ob.tutorialStage = (game.ob.tutorialStage || 0) + 1;
    await game.persist("tutorial");
    paint();
  }

  function paint() {
    clear(panel);
    const i = game.ob.tutorialStage || 0;
    panel.append(
      h("p.step-label", "Chapter 1: tutorial"),
      h(
        "ol.stepper",
        STAGE_LABELS.map((label, k) => h("li", { class: k < i ? "done" : k === i ? "current" : "" }, label))
      )
    );
    const body = h("div.stage");
    panel.append(body);
    STAGE_RENDER[STAGES[i]](body, { ...ctx, next, paint });
    ctx.refreshWho();
  }

  paint();
}

const STAGE_RENDER = {
  shift(el, { game, next, track }) {
    const rng = createRng(`${game.life.seed}:shift`);
    const pool = SHIFT_ITEMS.slice();
    const items = [];
    while (items.length < SHIFT_ITEMS_PER_SHIFT) items.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
    const t = CONFIG.onboarding.tutorialShift;
    const started = Date.now();
    let k = 0;
    let correct = 0;

    const area = h("div.shift");
    el.append(
      h("h1", "Your first work shift"),
      h(
        "p",
        `You are helping the bookkeeper at The Gilded Vault. Sort each item. Is it something you OWN (an asset) or something you OWE (a liability)? You get ${money(t.base)} for showing up and ${money(t.perCorrect)} for each right answer.`
      ),
      area
    );

    function ask() {
      clear(area);
      if (k === items.length) return finish();
      const it = items[k];
      const choose = (answer) => {
        const right = answer === it.answer;
        if (right) correct++;
        track("shiftAnswer", { n: k, right });
        clear(area);
        area.append(
          h("p.shift-count", `Item ${k + 1} of ${items.length}`),
          h("div.shift-item", it.item),
          h("div.callout", { class: right ? "good" : "bad" }, h("strong", right ? "Right! " : "Not quite. "), it.why),
          h("div.row.center", h("button.big", { type: "button", onclick: () => (k++, ask()) }, k + 1 < items.length ? "Next item" : "See my pay"))
        );
      };
      area.append(
        h("p.shift-count", `Item ${k + 1} of ${items.length}`),
        h("div.shift-item", it.item),
        h(
          "div.row.center",
          h("button.big", { type: "button", onclick: () => choose("asset") }, "🏠 I OWN it (asset)"),
          h("button.big", { type: "button", onclick: () => choose("liability") }, "📝 I OWE it (liability)")
        )
      );
    }

    function finish() {
      const pay = tutorialShiftPay(correct);
      const btn = h("button", { type: "button" }, `Collect ${money(pay)}`);
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        game.life = earn(game.life, pay, "first work shift").life;
        track("tutorialShift", { correct, total: items.length, pay, seconds: Math.round((Date.now() - started) / 1000) });
        await next();
      });
      area.append(
        h("div.big-number", money(pay)),
        h("p.center", `You sorted ${correct} of ${items.length} right. Your pay goes straight into your checking account.`),
        h("div.row.center", btn)
      );
    }

    ask();
  },

  purchase(el, { game, next, track }) {
    const debit = game.life.teenDebit;
    el.append(
      h("h1", "Payday! Time for a first purchase"),
      h("p", `You have ${money(game.life.checking)} in checking. Pick one thing to buy.`),
      h(
        "p.note",
        debit ? "You'll pay with your teen debit card." : "You don't have a debit card, so you'll take cash out of checking."
      )
    );
    const result = h("div");
    const row = h(
      "div.tile-row",
      FIRST_PURCHASES.map((p) =>
        h(
          "button.tile",
          {
            type: "button",
            onclick: () => {
              const r = debitPurchase(game.life, p.price, p.item);
              if (!r.ok) {
                result.replaceChildren(h("p.error", r.message));
                return;
              }
              game.life = r.life;
              track("firstPurchase", { item: p.item, price: p.price, method: debit ? "teenDebit" : "cash" });
              row.remove();
              result.replaceChildren(
                h(
                  "div.callout.good",
                  h("p", h("strong", `${p.icon} You bought ${p.item.toLowerCase()} for ${money(p.price)}.`)),
                  h(
                    "p",
                    debit
                      ? "With a debit card, the money leaves your checking account right away. You spent your own money and didn't borrow anything."
                      : "The cash came out of your checking account. You spent your own money and didn't borrow anything."
                  ),
                  h("p", "That's why debit doesn't build credit. Credit history only comes from borrowing money and paying it back."),
                  h("p", `Checking now: ${money(game.life.checking)}`)
                ),
                h("div.row", h("button", { type: "button", onclick: next }, "Next"))
              );
            },
          },
          h("span.tile-emoji", p.icon),
          h("span", p.item),
          h("strong", money(p.price))
        )
      )
    );
    el.append(row, result);
  },

  month1(el, ctx) {
    endMonthStage(el, ctx, {
      title: "The end of the month",
      text: [
        "At the end of every month, the bank closes the books. Bills get paid, card statements close, and lenders report what happened to the credit bureau. Then your credit score updates.",
        "Ready to end your first month?",
      ],
      button: "End Month 1",
    });
  },

  thin(el, { game, next }) {
    const report = creditReport(game.life);
    const au = report.tradelines.find((t) => t.owner === "authorized");
    el.append(monthSummary(game.ob.lastEnd), h("h1", "Your credit report"));
    el.append(h("p", "A credit report is the record lenders read before they lend you money. It lists your accounts and whether you paid on time."));

    if (!au) {
      el.append(
        h(
          "div.callout",
          h("p", h("strong", "Your report is empty.")),
          h("p", "You have never borrowed money, so there is nothing to report. Lenders call this a thin file. With no history, you have no credit score."),
          h("p", `You need at least ${CONFIG.score.minHistoryMonths} months of reported history to get a score.`)
        )
      );
    } else {
      const cells = report.grid.find((g) => g.id === au.id).cells.slice(-12);
      el.append(
        h(
          "div.callout",
          h("p", h("strong", "Your parent's card is on your report.")),
          h("p", `It brought ${au.history.length} months of history with it. Your parent's habits now count as part of your record.`),
          h(
            "div.mini-report",
            h("span", "🔷 Parent's card, last 12 months"),
            h(
              "div.grid-row",
              cells.map((c) => h("span.grid-cell", { class: c ? `code-${c}` : "empty", title: c || "No report" }, c === "OK" ? "✓" : c || ""))
            )
          ),
          h(
            "p",
            report.score != null
              ? `Because of it, you already have a score: ${report.score}.`
              : "It doesn't count enough for a score yet."
          )
        )
      );
    }
    if (game.life.teenDebit) {
      el.append(h("p.note", "Your teen debit card is not on your report. Checking accounts are never reported."));
    }
    el.append(h("div.row", h("button", { type: "button", onclick: next }, "Next: what makes a score")));
  },

  factors(el, { next, track }) {
    const total = FACTOR_TOUR.length;
    const started = Date.now();
    let k = 0;
    let furthest = 0;
    const bar = h("div.weight-bar", { "aria-hidden": "true" });
    const steps = h("ol.factor-steps", { "aria-label": "Your progress through the 5 parts" });
    const status = h("p.factor-progress", { "aria-live": "polite" });
    const box = h("div");
    el.append(
      h("h1", "The 5 parts of a credit score"),
      h("p", "Scores run from 300 to 850. Every score is built from these 5 parts. Bigger parts matter more."),
      bar,
      steps,
      status,
      box
    );

    const stateOf = (i) => (i === k ? "current" : i <= furthest ? "done" : "");

    function go(i, how) {
      k = i;
      furthest = Math.max(furthest, k);
      track("factorPart", { part: FACTOR_TOUR[k].key, n: k + 1, how });
      show();
    }

    function show() {
      const f = FACTOR_TOUR[k];
      const last = k === total - 1;

      clear(bar).append(
        ...FACTOR_TOUR.map((x, i) =>
          h("span", { style: { flex: parseInt(x.weight, 10) }, class: `f${i} ${stateOf(i)}` }, `${stateOf(i) === "done" ? "✓ " : ""}${x.icon} ${x.weight}`)
        )
      );

      clear(steps).append(
        ...FACTOR_TOUR.map((x, i) => {
          const state = stateOf(i);
          const words = state === "current" ? "you are here" : state === "done" ? "done" : "not yet";
          return h(
            "li",
            { class: `f${i} ${state}` },
            h(
              "button.factor-step",
              {
                type: "button",
                disabled: i > furthest || i === k,
                "aria-current": state === "current" ? "step" : null,
                "aria-label": `Part ${i + 1}: ${x.title}, ${words}`,
                onclick: () => go(i, "jump"),
              },
              h("span.factor-dot", state === "done" ? "✓" : String(i + 1)),
              h("span.factor-label", x.title)
            )
          );
        })
      );

      status.className = `factor-progress f${k}`;
      clear(status).append(
        `Part ${k + 1} of ${total}: ${f.title}`,
        h("span.meter", { "aria-hidden": "true" }, h("span", { style: { width: `${Math.round(((k + 1) / total) * 100)}%` } }))
      );

      box.replaceChildren(
        h(
          "div.factor-card",
          { class: `f${k}` },
          h(
            "div.factor-head",
            h("span.factor-icon", { "aria-hidden": "true" }, f.icon),
            h("div", h("span.factor-num", `Part ${k + 1} of ${total}`), h("h2", f.title)),
            h("span.factor-weight", f.weight, h("small", "of your score"))
          ),
          h("div.factor-body", h("p", f.means), h("div.callout", h("strong", "Life choice: "), f.example))
        ),
        h(
          "div.row",
          k > 0 ? h("button.secondary", { type: "button", onclick: () => go(k - 1, "back") }, "Back") : null,
          h(
            "button.big",
            {
              type: "button",
              onclick: () => {
                if (!last) return go(k + 1, "next");
                track("factorTour", { seconds: Math.round((Date.now() - started) / 1000) });
                next();
              },
            },
            last ? "Got it" : `Next part (${k + 2} of ${total})`
          )
        )
      );
    }
    show();
  },

  month2(el, ctx) {
    endMonthStage(el, ctx, {
      title: "One more month",
      text: [
        "You learned 3 big ideas so far. Debit spends your own money and doesn't build credit. A credit report tracks borrowing. Your score comes from 5 parts, and paying on time is the biggest one.",
        "End this month, and then we'll skip ahead to age 18.",
      ],
      button: "End Month 2",
      after: "skip",
    });
  },
};

function endMonthStage(el, { game, next, advance, track }, { title, text, button, after }) {
  const btn = h("button", { type: "button" }, button);
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const month = game.life.month;
    const r = endMonth(game.life);
    game.life = r.life;
    game.ob.lastEnd = monthRecord(month, r);
    track("endMonth", { month, score: r.life.score ?? -1, delta: r.scoreChange.delta ?? 0, checking: r.life.checking, tutorial: true });
    if (after) await advance(after);
    else await next();
  });
  el.append(h("h1", title), text.map((t) => h("p", t)), h("div.row", btn));
}
