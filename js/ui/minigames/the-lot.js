// The Lot (GAME-SPECS.md game 8): preapproval, three cars, a salesman's
// monthly-payment pitch, counters or walking away, a contract to read, then
// two years of owning it. Rules: js/arcade/lot.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { createRng } from "../../engine/index.js";
import * as L from "../../arcade/lot.js";
import { LOT_TYPE_LABEL, LOT_LINES, LOT_EVENTS } from "../../data/arcade/lot.js";
import { eventCard, keyHelp, simplified, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const pct = (a) => `${(a * 100).toFixed(2)}%`;
const stars = (n) => h("span.lot-stars", { role: "img", "aria-label": `${n} of 5 stars` }, "★".repeat(n) + "☆".repeat(5 - n), h("small", ` ${n} of 5`));

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.lot;
  const s = L.newState(L.newShift(seed));
  const rng = createRng(`${seed}:lines`);
  const root = h("div.minigame.lot");
  const ring = timed ? timerRing({ label: "Time left" }) : null;
  let showTotal = false;
  let skillDone = false;
  let over = false;
  let tick = null;
  let keys = null;
  let pickingCounter = false;
  const say = () => LOT_LINES[Math.floor(rng.next() * LOT_LINES.length)];

  const frame = (step, ...body) => fill(root, h("div.mg-bar", h("span.mg-clock", step), ring, s.pre ? h("span.lot-rate", icon("scroll", { size: 14 }), ` Credit union: ${pct(s.pre.apr)} APR, up to ${money(s.pre.max)}`) : h("span.mg-score", "No preapproval")), ...body);

  // ---------- Preapproval ----------
  function preStep() {
    const go = (yes) => {
      L.preapprove(s, yes);
      ctx.track("lotPre", { yes });
      lotStep();
    };
    frame("Before the dealer", h("div.lot-card.lot-center", h("h4", "Visit the credit union first?"), h("p", "They'll check your credit and tell you the rate and the most they'd lend you for a car."), h("div.row", h("button.big", { type: "button", onclick: () => go(true) }, h("kbd", "Y"), " Yes, get preapproved"), h("button.secondary", { type: "button", onclick: () => go(false) }, h("kbd", "N"), " No, go straight to the lot"))));
    keys = (e) => ({ y: () => go(true), n: () => go(false) })[e.key.toLowerCase()]?.();
    root.querySelector("button").focus();
  }

  // ---------- The lot ----------
  function lotStep(note = null) {
    const open = s.deal.cars.map((c, i) => ({ c, i })).filter((x) => !s.sold.includes(x.i));
    frame(
      "The lot",
      note ? h("p.lot-note", icon("alert", { size: 16 }), ` ${note}`) : h("p.lot-note", icon("plaza", { size: 16 }), ` "${say()}"`),
      h(
        "div.lot-cars",
        open.map(({ c, i }) =>
          h("button.lot-car", { type: "button", onclick: () => pick(i) }, h("kbd", String(i + 1)), h("small.lot-type", LOT_TYPE_LABEL[c.type]), h("strong", c.name), h("span.lot-price", money(c.price)), stars(c.ride), h("small", `Reliability: ${c.reliability}`), h("small", `Insurance quote: ${money(c.insurance)} a month`))
        )
      ),
      s.sold.length ? h("button.secondary.lot-leave", { type: "button", onclick: () => finishNoCar() }, "Leave with no car") : null,
      keyHelp("1, 2 or 3 picks a car.")
    );
    keys = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 3 && !s.sold.includes(n - 1)) pick(n - 1);
    };
    root.querySelector(".lot-car")?.focus();
    if (training) ctx.coach(0, root.querySelector(".lot-cars"));
  }

  function pick(i) {
    L.pickCar(s, i);
    ctx.track("lotCar", { type: s.deal.cars[i].type });
    if (!skillDone && !training) return skill();
    nego();
  }

  // ---------- Skill moment: the real total ----------
  function skill() {
    const m = L.offerMath(s.offer);
    const want = Math.round(m.monthly * s.offer.term + s.offer.down);
    const input = h("input", { type: "text", inputmode: "decimal", "aria-label": "Total you pay, in dollars" });
    const go = () => {
      const n = Number(input.value.replace(/[$,\s]/g, ""));
      const ok = Math.abs(n - want) <= 2;
      skillDone = true;
      showTotal = true;
      ctx.track("skillMoment", { game: "lot", right: ok });
      (ok ? sfx.correct : sfx.error)();
      frame("The first offer", h("div.lot-card.lot-center", h("p.mg-flash", { class: ok ? "good" : "bad" }, icon(ok ? "check" : "alert", { size: 18 }), ` ${money(m.monthly)} times ${s.offer.term} months is ${money(m.monthly * s.offer.term)}, plus ${money(s.offer.down)} down: ${money(want)}.`), h("p", "From now on, press T to see the total on every offer."), h("button.big", { type: "button", "data-autofocus": "", onclick: nego }, "Start negotiating")));
      root.querySelector(".big").focus();
    };
    input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), go()));
    frame("The first offer", h("div.lot-card.lot-center", h("p.lot-pitch", `"Great news! I can put you in this car for just ${money(m.monthly)} a month."`), h("p", `${money(m.monthly)} a month for ${s.offer.term} months, ${money(s.offer.down)} down. What is the total you pay?`), h("div.row", h("span", "$"), input, h("button", { type: "button", onclick: go }, "Check"))));
    input.focus();
    keys = null;
  }

  // ---------- Negotiation ----------
  function nego(line = null) {
    const car = s.deal.cars[s.car];
    const m = L.offerMath(s.offer);
    pickingCounter = false;
    if (s.deal.secondBuyer && s.round + 1 >= s.deal.secondBuyer && !s.secondBuyerSeen) {
      s.secondBuyerSeen = true;
      ctx.echo("Another buyer is looking at the same car. Walking away just got riskier.");
    }
    if (s.managerOn && !s.managerEchoed) {
      s.managerEchoed = true;
      ctx.echo(`Manager special: $${cfg.managerOff} off, but only if you sign this round.`, { kind: "good" });
    }
    const counters = h("div.lot-counters");
    frame(
      `Negotiating: ${car.name}`,
      h(
        "div.lot-nego",
        h(
          "div.lot-offer",
          h("p.lot-pitch", line || `"${say()}"`),
          h("p.lot-monthly", money(m.monthly), h("small", " a month")),
          h("p.lot-fine", `${s.offer.term} months at ${pct(s.offer.apr)} APR, ${money(s.offer.down)} down, ${s.offer.addons.length} add-on${s.offer.addons.length === 1 ? "" : "s"} included, car price ${money(s.offer.price)}`),
          showTotal ? h("p.lot-total", icon("receipt", { size: 16 }), ` Total cost: ${money(m.total)} (interest ${money(m.totalPayments - m.financed)})`) : null,
          h("p.lot-rounds", `Round ${Math.min(s.round + 1, cfg.rounds)} of ${cfg.rounds}${s.round >= cfg.rounds ? ": final offer" : ""}`)
        ),
        h(
          "div.lot-moves",
          h("button.big", { type: "button", onclick: () => acceptDeal() }, h("kbd", "A"), " Accept"),
          h("button.big", { type: "button", disabled: s.round >= cfg.rounds, onclick: () => showCounters() }, h("kbd", "C"), " Counter"),
          h("button.big.walk", { type: "button", onclick: () => walkAway() }, h("kbd", "W"), " Walk away"),
          skillDone || training ? h("button.secondary", { type: "button", "aria-pressed": String(showTotal), onclick: () => ((showTotal = !showTotal), nego(line)) }, h("kbd", "T"), showTotal ? " Hide total cost" : " Show total cost") : null,
          counters
        )
      ),
      keyHelp("A accept, C counter (then 1, 2 or 3), W walk away, T total cost.")
    );
    function showCounters() {
      pickingCounter = true;
      fill(counters, h("p", "Counter with:"), h("button", { type: "button", onclick: () => doCounter("price") }, h("kbd", "1"), " A lower price"), h("button", { type: "button", onclick: () => doCounter("term") }, h("kbd", "2"), " A shorter term"), h("button", { type: "button", onclick: () => doCounter("rate") }, h("kbd", "3"), " Beat my credit union rate"));
      counters.querySelector("button").focus();
    }
    keys = (e) => {
      const k = e.key.toLowerCase();
      if (pickingCounter && ["1", "2", "3"].includes(k)) return doCounter(["price", "term", "rate"][Number(k) - 1]);
      ({ a: acceptDeal, c: () => s.round < cfg.rounds && showCounters(), w: walkAway, t: () => (skillDone || training) && ((showTotal = !showTotal), nego(line)) })[k]?.();
    };
    root.querySelector(".lot-moves .big").focus();
    if (training && s.round === 0) ctx.coach(1, root.querySelector(".lot-moves"));
  }

  function doCounter(kind) {
    const r = L.counter(s, kind);
    ctx.track("lotCounter", { kind, ok: r.ok });
    (r.ok ? sfx.correct : sfx.error)();
    nego(r.text);
  }

  function walkAway() {
    const r = L.walk(s);
    ctx.track("lotWalk", { callback: r.callback });
    if (r.callback) {
      sfx.correct();
      ctx.echo("Walking away worked. A better offer came back.", { kind: "good" });
      nego(r.text);
    } else {
      sfx.error();
      ctx.echo(r.text);
      if (s.sold.length >= 3) return finishNoCar();
      lotStep(`${r.text} Pick another car or leave with no car.`);
    }
  }

  function acceptDeal() {
    L.accept(s);
    contract();
  }

  // ---------- The contract ----------
  function contract() {
    const paint = () => {
      const m = L.offerMath({ ...s.offer, addons: s.offer.addons.filter((a) => !s.strikes.has(a.id)) });
      frame(
        "The contract",
        h(
          "div.lot-contract",
          h(
            "div.lot-paper",
            h("h4", "Retail Installment Contract"),
            h("p.lot-line", h("span", "Car price"), h("span", money(s.offer.price))),
            s.offer.addons.map((a) => h("button.lot-addon", { type: "button", "aria-pressed": String(s.strikes.has(a.id)), onclick: () => (L.strike(s, a.id), paint()) }, h("span", a.name), h("span", money(a.price)), h("small", s.strikes.has(a.id) ? " Struck" : " Tap to strike"))),
            h("p.lot-line", h("span", "Documentation fee"), h("span", money(cfg.docFee))),
            h("p.lot-line", h("span", "Down payment"), h("span", `-${money(s.offer.down)}`)),
            h("p.lot-line.strong", h("span", "Amount financed"), h("span", money(m.financed))),
            h("p.lot-line", h("span", "APR and term"), h("span", `${pct(s.offer.apr)}, ${s.offer.term} months`)),
            h("p.lot-line.strong", h("span", "Monthly payment"), h("span", money(m.monthly))),
            h("p.lot-line", h("span", "Total of payments"), h("span", money(m.totalPayments)))
          ),
          h("aside.lot-sign", h("p", "Strike any add-on you don't want, then sign."), h("button.big", { type: "button", "aria-keyshortcuts": "Enter", onclick: signIt }, "Sign (Enter)"), simplified("not financial advice"))
        ),
        keyHelp("Tab and Enter strike add-ons, Enter on the page signs.")
      );
      root.querySelector(".lot-addon, .lot-sign .big")?.focus();
    };
    paint();
    if (training) ctx.coach(2, root.querySelector(".lot-paper"));
    keys = (e) => e.key === "Enter" && !e.target.closest("button") && (e.preventDefault(), signIt());
  }

  function signIt() {
    const f = L.sign(s);
    if (!f) return;
    sfx.correct();
    for (const a of f.offer.addons) ctx.mistake({ type: "addon", cost: Math.min(cfg.riskyCap, a.price), label: `Signed with ${a.name}` });
    if (s.pre && f.offer.apr > s.pre.apr) {
      const m = L.offerMath(f.offer);
      const extra = Math.max(0, m.totalPayments - L.offerMath({ ...f.offer, apr: s.pre.apr }).totalPayments);
      if (extra > 1) ctx.mistake({ type: "rate", cost: Math.min(cfg.riskyCap, extra), label: "Signed above your preapproved rate" });
    }
    ctx.track("lotSign", { car: s.deal.cars[f.car].type, term: f.offer.term, apr: f.offer.apr, addons: f.offer.addons.length });
    fastForward();
  }

  // ---------- Two years later ----------
  function fastForward() {
    const sc = L.score(s);
    const car = sc.car;
    const cards = [
      { title: "Year 1: insurance", text: `${money(car.insurance)} a month, ${money(car.insurance * 12)} for the year.` },
      car.repairs[0] ? { title: "Year 1: a repair", text: `${LOT_EVENTS.repair[Math.floor(rng.next() * LOT_EVENTS.repair.length)]} ${money(car.repairs[0])}.` } : { title: "Year 1: smooth", text: LOT_EVENTS.quiet[0] },
      { title: "Insurance renewal", text: `Your rate goes up ${Math.round(cfg.renewal * 100)} percent to ${money(car.insurance * (1 + cfg.renewal))} a month.` },
      car.repairs[1] ? { title: "Year 2: a repair", text: `${LOT_EVENTS.repair[Math.floor(rng.next() * LOT_EVENTS.repair.length)]} ${money(car.repairs[1])}.` } : { title: "Year 2: smooth", text: LOT_EVENTS.quiet[1] },
      { title: "Two years in", text: `The car is worth about ${money(sc.mine.resale)} now. You still owe ${money(sc.mine.owed)}.` },
    ];
    let k = 0;
    const next = () => {
      if (k >= cards.length) return end(sc);
      const c = cards[k++];
      if (/repair/.test(c.title)) ctx.echo(`${c.title}: ${c.text}`);
      const ev = eventCard({ title: c.title, text: c.text, tag: "Fast-forward", choices: [{ label: "Next" }], timer: timed ? 2.5 : null, onPick: () => next() });
      frame("Two years later", h("div.lot-center", ev));
      ev.querySelector("button").focus();
    };
    keys = null;
    next();
  }

  function finishNoCar() {
    L.leave(s);
    end(L.score(s));
  }

  // ---------- The end ----------
  function end(sc) {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    let reveal;
    if (sc.noCar) reveal = h("p", "You left with no car. No payments, but no ride either. The bus pass is calling.");
    else {
      const first = sc.base;
      const mine = sc.mine;
      const bar = (label, v, max) => h("div.lot-bar", h("span", label), h("span.lot-track", h("span", { style: `width: ${Math.round((v / max) * 100)}%` })), h("strong", money(v)));
      const maxMonthly = Math.max(first.monthly, mine.monthly);
      const maxTotal = Math.max(first.cost, mine.cost, 1);
      reveal = h(
        "div.lot-reveal",
        h("div", h("h5", "Monthly payment"), bar("First offer", first.monthly, maxMonthly), bar("Your deal", mine.monthly, maxMonthly)),
        h("div", h("h5", "2-year cost of owning it"), bar("First offer", first.cost, maxTotal), bar("Your deal", mine.cost, maxTotal), h("small", "Everything paid, plus what's still owed, insurance and repairs, minus what the car is worth.")),
        h("p", first.cost > mine.cost ? `You saved ${money(first.cost - mine.cost)} over the first offer.` : "The first offer was as good as your deal.")
      );
    }
    ctx.finish({ score: sc.score, tie: sc.cost ?? 999999, sub: { noCar: sc.noCar, cost: sc.cost, ride: sc.car?.ride ?? 0 }, perfect: !sc.noCar && s.final.offer.addons.length === 0 && s.final.offer.term <= 48, reveal, biggest: L.biggest(s), stats: { pre: Boolean(s.pre), walks: s.log.filter((x) => x.kind === "walk").length } });
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    keys?.(e);
  }
  document.addEventListener("keydown", onKey);
  if (timed) {
    const endAt = Date.now() + cfg.seconds * 1000;
    tick = setInterval(() => {
      const left = (endAt - Date.now()) / 1000;
      ring.set(left, cfg.seconds);
      if (left <= 0) {
        // Out of time: whatever's signed stands. Otherwise no car.
        if (s.phase === "contract") signIt();
        else if (s.phase !== "done") finishNoCar();
      }
    }, 250);
  }
  if (training) skillDone = true;
  preStep();
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
