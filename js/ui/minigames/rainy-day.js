// Rainy Day (GAME-SPECS.md game 10): shop for insurance and set an emergency
// fund, then open a Life Pack of 12 monthly cards. Results play the plan 100
// times. Rules: js/arcade/rainy.js. Simplified for learning, not insurance advice.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import * as R from "../../arcade/rainy.js";
import { RD_POLICIES } from "../../data/arcade/rainy.js";
import { eventCard, keyHelp, simBars, simplified, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const OPT = { none: "No coverage", low: "Low deductible", high: "High deductible" };

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.rainy;
  const year = R.newYear(seed);
  const plan = { car: "high", renters: "none", health: "high", phone: "none", fund: Math.round(year.start / 2 / 100) * 100 };
  const root = h("div.minigame.rainy");
  const ring = timed ? timerRing({ label: "Time left" }) : null;
  let tick = null;
  let over = false;
  let skillDone = false;
  let result = null;
  let m = 0;
  let keys = null;

  // ---------- The shop ----------
  function shop() {
    const totals = h("div.rd-totals", { "aria-live": "polite" });
    const grid = h("div.rd-policies");
    const slider = h("input.rd-slider", { type: "range", min: "0", max: String(year.start), step: "100", value: String(plan.fund), "aria-label": "Emergency fund" });
    const fundOut = h("strong");
    const paint = () => {
      fill(
        grid,
        R.POLICY_KEYS.map((k) =>
          h(
            "fieldset.rd-policy",
            h("legend", icon(RD_POLICIES[k].icon, { size: 18 }), ` ${RD_POLICIES[k].name}`),
            ["none", "low", "high"].map((o) => {
              const p = RD_POLICIES[k][o];
              return h("button.rd-opt", { type: "button", "aria-pressed": String(plan[k] === o), onclick: () => ((plan[k] = o), paint()) }, h("strong", OPT[o]), p ? h("small", `${money(p.premium)} a month, ${money(p.deductible)} deductible`) : h("small", "$0 a month, you pay it all"));
            }),
            RD_POLICIES[k].note && plan[k] === "none" ? h("small.rd-note", RD_POLICIES[k].note) : null
          )
        )
      );
      fundOut.textContent = money(plan.fund);
      const prem = R.monthlyPremiums(plan);
      fill(totals, h("p", h("strong", `${money(prem)} a month`), ` in premiums, ${money(prem * 12)} a year.`), h("p", `Emergency fund: ${money(plan.fund)}. Starting checking: ${money(year.start - plan.fund)}.`), h("p", `You'll have about ${money(year.income)} a month left after living costs.`), prem > year.income ? h("p.rd-warn", icon("alert", { size: 14 }), " Your premiums are more than your monthly money. Some months your coverage could lapse.") : null);
    };
    slider.addEventListener("input", () => ((plan.fund = Number(slider.value)), paint()));
    const go = h("button.big", { type: "button", "aria-keyshortcuts": "Enter", onclick: () => openPack() }, icon("star", { size: 18 }), " Open the Life Pack");
    const skill = h("div.rd-skill");
    const input = h("input", { type: "text", inputmode: "decimal", "aria-label": "What you pay, in dollars" });
    const check = () => {
      const ok = Number(input.value.replace(/[$,\s]/g, "")) === 500;
      skillDone = true;
      ctx.track("skillMoment", { game: "rainy", right: ok });
      (ok ? sfx.correct : sfx.error)();
      fill(skill, h("p.mg-flash", { class: ok ? "good" : "bad" }, icon(ok ? "check" : "alert", { size: 16 }), ok ? " Right. You pay the $500 deductible and insurance pays $1,500." : " You pay $500, the deductible. Insurance pays the other $1,500."), h("small", "Every card this year shows that split for you."));
    };
    input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), e.stopPropagation(), check()));
    fill(skill, h("p", h("strong", "Quick check: "), "Your deductible is $500. A $2,000 repair happens. How much do you pay?"), h("div.row", h("span", "$"), input, h("button", { type: "button", onclick: check }, "Check")));
    fill(
      root,
      h("div.mg-bar", h("span.mg-clock", "The insurance shop"), ring, h("span.mg-score", `Starting cash ${money(year.start)}`)),
      h("div.rd-shop", h("div", grid), h("aside.rd-side", skill, h("label.rd-fund", "Emergency fund ", fundOut, slider), totals, go, simplified("not insurance advice"))),
      keyHelp("Tab and Enter pick a policy option, arrows move the fund slider, Enter opens the Life Pack.")
    );
    paint();
    if (training) ctx.coach(0, grid.querySelector(".rd-policy")).then(() => ctx.coach(1, grid.querySelector(".rd-opt:nth-of-type(3)") || grid)).then(() => ctx.coach(2, slider));
    else input.focus();
    keys = (e) => e.key === "Enter" && !e.target.closest("button, input") && (e.preventDefault(), openPack());
    if (timed) {
      const endAt = Date.now() + cfg.shopSeconds * 1000;
      tick = setInterval(() => {
        const left = (endAt - Date.now()) / 1000;
        ring.set(left, cfg.shopSeconds);
        if (left <= 0) openPack();
      }, 250);
    }
  }

  // ---------- The year ----------
  function openPack() {
    if (result) return;
    clearInterval(tick);
    ctx.track("rainyPlan", { ...plan, skillDone });
    result = R.runYear(year, plan);
    m = 0;
    sfx.correct();
    showCard();
  }

  function sideStats(x) {
    return h("aside.rd-stats", h("div", h("small", "Month"), h("strong", `${Math.min(m + 1, 12)} of 12`)), h("div", h("small", "Emergency fund"), h("strong", money(x ? x.fund : plan.fund))), h("div", h("small", "Checking"), h("strong", money(x ? x.cash : year.start - plan.fund))), h("div", h("small", "Debt"), h("strong", { class: x?.debt ? "neg" : "" }, money(x ? x.debt : 0))), h("div", h("small", "Premiums"), h("strong", `${money(R.monthlyPremiums(plan))}/mo`)));
  }

  function showCard() {
    if (m >= 12) return end();
    const x = result.months[m];
    const prev = m ? result.months[m - 1] : null;
    const card = eventCard({ title: "Month " + (m + 1), text: "Flip the next card in your Life Pack.", tag: "Life Pack", choices: [{ label: "Flip" }], timer: timed ? cfg.cardSeconds / 2 : null, onPick: () => reveal(x) });
    fill(root, h("div.mg-bar", h("span.mg-clock", "A year of life"), h("span.mg-score", `Card ${m + 1} of 12`)), h("div.rd-year", h("div.rd-cardslot", card), sideStats(prev)), keyHelp("Space flips the card, Enter goes on."));
    card.querySelector("button").focus();
  }

  function reveal(x) {
    const e = x.card;
    const rows = [];
    if (e.cost) {
      rows.push(h("li", `Cost: ${money(e.amount)}`));
      if (x.excluded) rows.push(h("li.bad", icon("alert", { size: 14 }), ` Not covered: ${RD_POLICIES[e.policy].name} has an exclusion for this.`));
      else if (x.covered) rows.push(h("li", icon("shield", { size: 14 }), ` ${RD_POLICIES[e.policy].name} paid ${money(x.ins)}. Your deductible: ${money(x.you)}.`));
      else rows.push(h("li.bad", icon("alert", { size: 14 }), e.policy === "none" ? " No policy covers this." : ` No ${RD_POLICIES[e.policy].name.toLowerCase()}${x.lapsed ? " this month (it lapsed)" : ""}. You pay it all.`));
      rows.push(h("li", `You paid ${money(x.you)}: ${money(x.fromFund)} from your fund, ${money(x.fromCash)} from checking${x.toDebt ? `, ${money(x.toDebt)} as debt` : ""}.`));
      if (x.you > cfg.riskyThreshold && !x.covered) ctx.mistake({ type: "uncovered", cost: Math.min(cfg.riskyCap, x.you), label: `Uncovered: ${e.title}` });
      x.covered ? sfx.correct() : sfx.error();
    } else if (e.gain) rows.push(h("li", icon("up", { size: 14 }), ` +${money(x.gain)} into checking.`));
    if (x.lapsed) ctx.echo(`Not enough in checking for premiums in month ${x.m}. Coverage lapsed, plus a ${money(cfg.lapseFee)} fee.`);
    if (x.renewal) ctx.echo(`Month 6 renewal: your car premium went up 30 percent. From: the at-fault ${result.months.find((y) => y.card.atFault && y.m <= 6)?.card.title.toLowerCase() || "accident"}.`);
    const next = h("button.big", { type: "button", "data-autofocus": "", onclick: () => ((m += 1), showCard()) }, m < 11 ? "Next month" : "See the year");
    fill(root, h("div.mg-bar", h("span.mg-clock", "A year of life"), h("span.mg-score", `Card ${m + 1} of 12`)), h("div.rd-year", h("article.rd-result", { class: `tier-${e.tier}` }, h("span.rd-tier", e.tier === "cat" ? "CATASTROPHE" : e.tier === "medium" ? "BIG" : e.tier === "small" ? "SMALL" : e.tier === "good" ? "GOOD NEWS" : "QUIET"), h("h4", e.title), h("p", e.text), h("ul", rows), next), sideStats(x)), keyHelp("Enter goes on."));
    next.focus();
    keys = (ev) => ev.key === "Enter" && !ev.target.closest("button") && (ev.preventDefault(), next.click());
    if (timed) setTimeout(() => next.isConnected && next.click(), (cfg.cardSeconds / 2) * 1000);
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = R.score(seed, plan, year, result);
    if (result.interest) ctx.echo(`Debt interest this year: ${money(result.interest)} (simplified, ${Math.round(cfg.debtApr * 100)} percent a year).`);
    const none = R.simulate(seed, R.PLANS.none(plan.fund));
    const low = R.simulate(seed, R.PLANS.low(plan.fund));
    const reveal = h(
      "div.rd-reveal",
      h("p", `Your actual year ended with ${money(result.end)} (checking ${money(result.cash)}, fund ${money(result.fund)}, debt ${money(result.debt)}). ${money(result.extras)} of checking went to everyday extras.`),
      simBars({ title: "The same plan, 100 different years", note: "Year-end money: average, best, and the worst 5 percent.", rows: [{ label: "Your plan", avg: sc.strength, best: sc.best, worst: sc.worst, mine: true }, { label: "No insurance", avg: none.avg, best: none.best, worst: none.worst }, { label: "Everything low deductible", avg: low.avg, best: low.best, worst: low.worst }] }),
      simplified("not insurance advice")
    );
    ctx.finish({ score: sc.strength, tie: sc.worst, payScore: sc.points, sub: { strength: sc.strength, worst: sc.worst, end: result.end, debt: result.debt }, perfect: sc.strength >= Math.max(none.avg, low.avg) && sc.worst > none.worst, reveal, biggest: R.biggest(plan, result), stats: { plan: { ...plan } } });
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("textarea, select, dialog, .arc-coach")) return;
    keys?.(e);
  }
  document.addEventListener("keydown", onKey);
  shop();
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
