// The Grind (GAME-SPECS.md game 9): Delivery mode (accept or decline orders,
// then set your tax jar) or Store mode (shifts, energy, overtime, then predict
// your take-home and check the paystub). Rules: js/arcade/grind.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import * as G from "../../arcade/grind.js";
import { docInspector, keyHelp, simplified, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const clockText = (min) => {
  const total = 17 * 60 + Math.round(min);
  const hh = Math.floor(total / 60) % 12 || 12;
  return `${hh}:${String(total % 60).padStart(2, "0")} PM`;
};

export function start(ctx) {
  return ctx.settings.mode === "store" ? store(ctx) : delivery(ctx);
}

// A typed skill question. onDone() continues.
function skillQ(root, ctx, { title, q, answer, right, wrong, cont, onDone }) {
  const box = h("div.gr-skill");
  const input = h("input", { type: "text", inputmode: "decimal", "aria-label": "Your answer, in dollars" });
  const go = () => {
    const n = Number(input.value.replace(/[$,\s]/g, ""));
    const ok = Math.abs(n - answer) < 0.01;
    ctx.track("skillMoment", { game: "grind", right: ok });
    (ok ? sfx.correct : sfx.error)();
    fill(box, h("p.mg-flash", { class: ok ? "good" : "bad" }, icon(ok ? "check" : "alert", { size: 18 }), ` ${ok ? right : wrong}`), h("button.big", { type: "button", "data-autofocus": "", onclick: onDone }, cont));
    box.querySelector("button").focus();
  };
  input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), go()));
  fill(box, h("h4", title), h("p.gr-skill-q", q), h("div.row", h("span", "$"), input, h("button", { type: "button", onclick: go }, "Check")));
  fill(root, box);
  input.focus();
}

// ======================= Delivery =======================
function delivery(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const c = CONFIG.arcade.games.grind.delivery;
  const perSec = c.shiftMin / c.realSeconds;
  const s = G.deliveryState(G.newDelivery(seed));
  const root = h("div.minigame.grind.gr-delivery");
  const map = h("section.gr-map");
  const side = h("section.gr-side");
  const ring = timed ? timerRing({ size: 52, label: "Time left to accept" }) : null;
  let t0 = 0;
  let paused = 0;
  let pauseAt = 0;
  let tick = null;
  let over = false;
  const coached = new Set();
  const gameMin = () => (timed ? ((pauseAt || Date.now()) - t0 - paused) / 1000 * perSec : s.t);

  function begin() {
    fill(root, h("div.gr-grid", map, side), keyHelp(`A accept, D decline${timed ? ", P pause" : ""}.`));
    t0 = Date.now();
    document.addEventListener("keydown", onKey);
    if (timed) {
      tick = setInterval(step, 200);
      step();
    } else jump();
  }

  async function pause(p) {
    pauseAt = Date.now();
    await p;
    paused += Date.now() - pauseAt;
    pauseAt = 0;
  }

  // Untimed: the evening jumps ahead to the next thing that happens.
  function jump() {
    let t = s.t;
    while (t < c.shiftMin + 120 && !s.offer && !(t >= c.shiftMin && !s.current)) {
      t++;
      handle(G.deliveryTick(s, t));
    }
    if (t >= c.shiftMin && !s.current && !s.offer) return payday();
    paint();
  }

  function step() {
    if (over || pauseAt) return;
    const t = gameMin();
    const ev = G.deliveryTick(s, t);
    handle(ev);
    if (t >= c.shiftMin && !s.current) {
      if (s.offer) G.declineOffer(s, t);
      return payday();
    }
    paint();
  }

  function handle(ev) {
    for (const e of ev) {
      if (e.type === "offer") {
        sfx.correct?.();
        if (training && !coached.has(0)) {
          coached.add(0);
          pause(ctx.coach(0, map.querySelector(".gr-offer") || map));
        }
      } else if (e.type === "delivered") {
        if (e.bait) ctx.echo(`Tip shrank after delivery: promised ${money(e.promised)}, paid ${money(e.pay)}. From: ${e.o.restaurant}.`);
        else ctx.notice(`Delivered for ${e.o.restaurant}: +${money(e.pay)}`);
        if (training && !coached.has(1)) {
          coached.add(1);
          pause(ctx.coach(1, side));
        }
      } else if (e.type === "surge") ctx.echo("Surge! Orders pay double for a little while.", { kind: "good" });
      else if (e.type === "car") ctx.echo("Car trouble. You lose half an hour of the evening.");
      else if (e.type === "missed") ctx.notice("You let an offer run out. That counts as a decline.");
    }
    if (s.lowRate && !s.lowWarned) {
      s.lowWarned = true;
      ctx.echo("Acceptance rate low. Fewer offers from now on.");
    }
  }

  function decide(yes) {
    if (over || !s.offer) return;
    const t = gameMin();
    if (yes) {
      const o = G.accept(s, t);
      ctx.track("grindOrder", { yes, pay: o.base + o.tip, miles: o.miles, minutes: o.minutes });
      if (o.wait) ctx.echo(`Long wait at ${o.restaurant}. ${o.wait} extra unpaid minutes.`);
    } else {
      ctx.track("grindOrder", { yes, pay: s.offer.base + s.offer.tip, miles: s.offer.miles });
      G.declineOffer(s, t);
    }
    if (!timed) jump();
    else paint();
  }

  let lastKey = "";
  function paint() {
    const t = Math.min(gameMin(), c.shiftMin);
    const o = s.offer;
    // Rebuild the card only when it changes, so keyboard focus stays put.
    const key = `${o?.i ?? "-"}|${s.current?.i ?? "-"}|${G.surgeOn(s)}`;
    if (key === lastKey) {
      if (o) ring?.set((c.windowMin - (gameMin() - s.offerAt)) / perSec, c.windowMin / perSec);
      const bar = map.querySelector(".gr-bar span");
      if (bar && s.current) bar.style.width = `${Math.round(Math.min(1, (t - (s.busyUntil - s.current.minutes - s.current.wait)) / (s.current.minutes + s.current.wait)) * 100)}%`;
      const left = map.querySelector(".gr-driving small");
      if (left && s.current) left.textContent = `${Math.max(0, Math.round(s.busyUntil - t))} minutes left`;
      return paintSide(t);
    }
    lastKey = key;
    let card;
    if (o) {
      const pay = G.offerPay(s, o);
      const gas = G.gasFor(o.miles);
      const left = c.windowMin - (gameMin() - s.offerAt);
      ring?.set(left / perSec, c.windowMin / perSec);
      card = h(
        "div.gr-offer",
        h("div.gr-offer-head", h("strong", o.restaurant), G.surgeOn(s) ? h("span.gr-surge", icon("up", { size: 14 }), " 2x SURGE") : null, ring),
        h("p.gr-offer-pay", money(pay), h("small", ` (${money(G.surgeOn(s) ? o.base * 2 : o.base)} pay + ${money(G.surgeOn(s) ? o.tip * 2 : o.tip)} tip estimate)`)),
        h("p", icon("car", { size: 16 }), ` ${o.miles} miles, about ${o.minutes} minutes`),
        h("p.gr-keep", `Gas about ${money(gas)}. You'd keep about ${money(pay - gas)}, or ${money(((pay - gas) / o.minutes) * 60)} an hour while driving.`),
        h("div.row", h("button.big.accept", { type: "button", onclick: () => decide(true) }, h("kbd", "A"), " Accept"), h("button.big.decline", { type: "button", onclick: () => decide(false) }, h("kbd", "D"), " Decline"))
      );
    } else if (s.current) {
      const f = Math.min(1, (t - (s.busyUntil - s.current.minutes - s.current.wait)) / (s.current.minutes + s.current.wait));
      card = h("div.gr-driving", h("p", icon("car", { size: 18 }), ` Delivering for ${s.current.restaurant}`), h("div.gr-bar", { role: "img", "aria-label": `${Math.round(f * 100)} percent done` }, h("span", { style: `width: ${Math.round(f * 100)}%` })), h("small", `${Math.max(0, Math.round(s.busyUntil - t))} minutes left`));
    } else card = h("p.gr-idle", icon("clock", { size: 18 }), " Waiting for an order. Waiting time isn't paid.");
    fill(map, h("div.gr-city", { "aria-hidden": "true" }), card);
    map.querySelector(".accept")?.focus();
    paintSide(t);
  }

  function paintSide(t) {
    const hours = Math.max(t, 1) / 60;
    const gas = G.gasFor(s.miles);
    fill(
      side,
      h("div.gr-stat", h("small", "Time"), h("strong", clockText(t)), h("small", `${(t / 60).toFixed(1)} of 4 hours online`)),
      h("div.gr-stat", h("small", "Earned"), h("strong", money(s.earned))),
      h("div.gr-stat", h("small", "Gas so far"), h("strong.neg", money(gas)), h("small", `${s.miles.toFixed(1)} miles`)),
      h("div.gr-stat", h("small", "True hourly so far (before taxes)"), h("strong", money((s.earned - gas) / hours))),
      h("p", { class: s.lowRate ? "warn" : "" }, icon(s.lowRate ? "alert" : "check", { size: 14 }), ` Acceptance ${Math.round(G.acceptRate(s) * 100)}%${s.lowRate ? ", fewer offers" : ""}`),
      simplified("gas and taxes")
    );
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    const k = e.key.toLowerCase();
    if (k === "a") (e.preventDefault(), decide(true));
    else if (k === "d") (e.preventDefault(), decide(false));
    else if (k === "p" && timed) {
      e.preventDefault();
      if (pauseAt) (paused += Date.now() - pauseAt), (pauseAt = 0);
      else pauseAt = Date.now();
    }
  }

  // ---------- Payday: the tax jar ----------
  function payday() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    let pct = 0;
    const out = h("p.gr-jar-pct", { "aria-live": "polite" });
    const slider = h("input.gr-slider", { type: "range", min: "0", max: "40", step: "5", value: "0", "aria-label": "Tax jar, percent of profit" });
    const paint2 = () => {
      pct = Number(slider.value);
      const p = Math.max(0, s.earned - G.gasFor(s.miles));
      out.textContent = `Save ${pct}% of your ${money(p)} profit: ${money((p * pct) / 100)} in the jar.`;
    };
    slider.addEventListener("input", paint2);
    const done = h("button.big", { type: "button", onclick: () => reveal() }, "Lock in my tax jar");
    slider.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), reveal()));
    fill(root, h("div.gr-payday", h("h4", "Payday"), h("p", `You earned ${money(s.earned)} and used ${money(G.gasFor(s.miles))} of gas. DashDash didn't take out any taxes.`), h("p", "How much of your profit goes in your tax jar?"), slider, out, done, simplified("not tax advice")));
    paint2();
    slider.focus();
    if (training) ctx.coach(2, slider);
    function reveal() {
      const p = G.deliveryPayday(s, pct / 100);
      ctx.track("grindJar", { pct, short: p.short });
      if (p.short) {
        ctx.echo(`Tax bill ${money(p.tax)}. Your jar had ${money(p.jar)}. You owe ${money(p.short)} plus a ${money(p.penalty)} penalty.`);
        ctx.mistake({ type: "taxShort", cost: p.short + p.penalty, label: "Tax shortfall and penalty", quiet: true });
      }
      const rates = G.compareRates();
      const waterfall = h(
        "ol.gr-fall",
        h("li", h("span", "Earned"), h("strong", money(p.earned))),
        h("li", h("span", "Gas"), h("strong", `-${money(p.gas)}`)),
        h("li", h("span", `Tax bill (${Math.round(c.taxRate * 100)}%, simplified)`), h("strong", `-${money(p.tax)}`)),
        p.penalty ? h("li.bad", h("span", "Late penalty"), h("strong", `-${money(p.penalty)}`)) : null,
        h("li.total", h("span", "You really keep"), h("strong", money(p.net)))
      );
      ctx.finish({
        score: p.metric,
        tie: Math.round(p.net),
        tier: "delivery",
        payScore: p.points,
        sub: { rate: p.rate, net: p.net, deliveries: p.deliveries, jar: pct, short: p.short },
        perfect: !p.short && G.acceptRate(s) >= c.lowRate,
        reveal: h("div", waterfall, rateBars([["Delivery tonight", p.rate, true], ["Store job", rates.store], ["Salary, 40 hours a week", rates.salary40], ["Salary, 50 hours a week", rates.salary50]]), simplified("not tax advice")),
        biggest: { text: `putting ${pct}% of your profit in the tax jar` },
        stats: { mode: "delivery", acceptRate: G.acceptRate(s) },
      });
    }
  }

  if (training) begin();
  else skillQ(root, ctx, { title: "Before your first order", q: "You earned $60 in 4 hours and spent $12 on gas. What is your true hourly rate?", answer: 12, right: "Right. $60 minus $12 is $48, and $48 over 4 hours is $12 an hour.", wrong: "It's $12. Take off the gas first: $48, then divide by 4 hours.", cont: "Go online", onDone: begin });
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}

function rateBars(rows) {
  const max = Math.max(...rows.map((r) => r[1]), 1);
  return h(
    "div.gr-rates",
    h("h5", "Take-home per hour"),
    rows.map(([label, v, mine]) => h("div.gr-rate", { class: mine ? "mine" : "" }, h("span", mine ? icon("star", { size: 14 }) : null, ` ${label}`), h("span.gr-rate-track", h("span", { style: `width: ${Math.max(2, Math.round((Math.max(0, v) / max) * 100))}%` })), h("strong", `${money(v)}/hr`)))
  );
}

// ======================= Store =======================
function store(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const c = CONFIG.arcade.games.grind.store;
  const s = G.storeState(G.newStore(seed));
  const root = h("div.minigame.grind.gr-store");
  const board = h("section.gr-board");
  const panel = h("section.gr-panel");
  let over = false;
  let tick = null;
  let endAt = 0;

  function begin() {
    fill(root, h("div.gr-grid", board, panel), keyHelp("A accept, D decline. At payday, Left and Right move the slider, Enter locks it in."));
    document.addEventListener("keydown", onKey);
    if (training) ctx.coach(0, board.querySelector(".gr-energy") || board);
    nextOffer();
  }

  function nextOffer() {
    paintBoard();
    const o = G.currentOffer(s);
    if (!o) return payday();
    const ring = timed ? timerRing({ label: "Time to answer" }) : null;
    fill(
      panel,
      h("div.gr-offer", h("div.gr-offer-head", h("strong", o.title), h("small", `Week ${o.week}`), ring), h("p", o.text), h("p.gr-keep", o.kind === "swap" ? "Same hours, but it still wears you out." : `+${o.hours} hours. Costs 1 energy.`), h("div.row", h("button.big.accept", { type: "button", onclick: () => decide(true) }, h("kbd", "A"), " Accept"), h("button.big.decline", { type: "button", onclick: () => decide(false) }, h("kbd", "D"), " Decline")))
    );
    clearInterval(tick);
    if (timed) {
      endAt = Date.now() + c.offerSec * 1000;
      tick = setInterval(() => {
        const left = (endAt - Date.now()) / 1000;
        ring.set(left, c.offerSec);
        if (left <= 0) decide(false);
      }, 200);
    }
  }

  function decide(yes) {
    if (over || !G.currentOffer(s)) return;
    clearInterval(tick);
    const r = G.storeDecide(s, yes);
    ctx.track("grindShift", { kind: r.o.kind, yes, sick: r.sick });
    if (r.sick) {
      ctx.echo(`Worn out! Your next shift is a sick day. Lost ${money(c.shiftHours * c.wage)} of pay. From: saying yes to "${r.o.title}".`);
      ctx.mistake({ type: "sick", cost: c.shiftHours * c.wage, label: "Sick day, lost pay", quiet: true });
    }
    if (r.cut) ctx.echo(`Schedule cut: you lost 8 hours in week ${r.cut.week}.`);
    nextOffer();
  }

  function paintBoard() {
    const pips = Array.from({ length: c.energy }, (_, i) => h("span.gr-pip", { class: i < s.energy ? "on" : "" }));
    fill(
      board,
      h("div.gr-energy", h("strong", "Energy"), h("span.gr-pips", { role: "img", "aria-label": `${s.energy} of ${c.energy} energy` }, pips), h("small", `${s.energy} of ${c.energy}`)),
      s.hours.map((hrs, w) => h("div.gr-week", h("h5", `Week ${w + 1}`), h("p", `${hrs} hours${hrs > 40 ? `, ${hrs - 40} overtime` : ""}`), h("div.gr-hours", { role: "img", "aria-label": `${hrs} hours` }, h("span.reg", { style: `width: ${Math.min(40, hrs) * 2}%` }), hrs > 40 ? h("span.ot", { style: `width: ${(hrs - 40) * 2}%` }) : null), s.sickWeeks.includes(w + 1) ? h("small.warn", icon("alert", { size: 12 }), " Sick day") : null)),
      h("p.muted", `Wage ${money(c.wage)} an hour. Overtime past 40 hours a week pays 1.5 times.`)
    );
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    const k = e.key.toLowerCase();
    if (k === "a") (e.preventDefault(), decide(true));
    else if (k === "d") (e.preventDefault(), decide(false));
  }

  // ---------- Payday: predict, waterfall, paystub ----------
  function payday() {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const st = G.stub(s);
    const maxGuess = Math.ceil((st.real.gross * 1.1) / 10) * 10;
    const slider = h("input.gr-slider", { type: "range", min: "0", max: String(maxGuess), step: "5", value: String(Math.round(st.real.gross / 10) * 10), "aria-label": "Your take-home guess" });
    const out = h("p.gr-jar-pct", { "aria-live": "polite" });
    const paint = () => (out.textContent = `My guess: ${money(Number(slider.value))} take-home`);
    slider.addEventListener("input", paint);
    const lock = () => waterfall(Number(slider.value));
    slider.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), lock()));
    fill(root, h("div.gr-payday", h("h4", "Payday: predict your take-home"), h("p", `You worked ${s.hours.reduce((a, b) => a + b, 0)} hours over two weeks at ${money(c.wage)} an hour. Taxes come out first. How much lands in your account?`), slider, out, h("button.big", { type: "button", onclick: lock }, "Lock in my guess"), simplified("not tax advice")));
    paint();
    slider.focus();
    if (training) ctx.coach(1, slider);

    function waterfall(guess) {
      const r = st.real;
      const pct = (v) => `${Number((v * 100).toFixed(2))}%`;
      const rows = [["Gross pay", r.gross], [`Federal income tax (${pct(c.tax.federal)})`, -r.fed], [`State tax (${pct(c.tax.state)})`, -r.state], [`Social Security (${pct(c.tax.socialSecurity)})`, -r.ss], [`Medicare (${pct(c.tax.medicare)})`, -r.med]];
      const marks = new Set();
      const L = (id, cells) => ({ id, cells });
      const p = st.printed;
      const doc = docInspector({
        title: "Your paystub (payroll printed this one)",
        className: "gr-stub",
        lines: [L("regHours", ["Regular hours", "", String(p.regHours)]), L("rate", ["Hourly rate", "", money(p.rate)]), L("regPay", ["Regular pay", "", money(p.regPay)]), L("otHours", ["Overtime hours", "", String(p.otHours)]), L("otRate", ["Overtime rate", "", money(p.otRate)]), L("otPay", ["Overtime pay", "", money(p.otPay)]), L("gross", ["Gross pay", "", money(p.gross)]), L("net", ["Net pay", "", money(p.net)])],
        marked: marks,
        onToggle: () => {},
      });
      const check = h("button.big", { type: "button", onclick: () => finish(guess, marks) }, "Done checking");
      fill(
        root,
        h(
          "div.gr-payday.two",
          h("div", h("h4", "Where your pay went"), h("ol.gr-fall", rows.map(([l, v]) => h("li", h("span", l), h("strong", v < 0 ? `-${money(-v)}` : money(v)))), h("li.total", h("span", "Take-home (net)"), h("strong", money(r.net)))), h("p", `You guessed ${money(guess)}. That's ${money(Math.abs(guess - r.net))} ${guess > r.net ? "too high" : guess < r.net ? "too low" : "exactly right"}.`), simplified("not tax advice")),
          h("div", h("p", h("strong", "Find the mistake: "), "tap the line payroll got wrong, then press Done. If it all looks right, just press Done."), doc, check)
        )
      );
      if (training) ctx.coach(2, doc);
    }

    function finish(guess, marks) {
      const found = marks.has(st.bad) || (st.bad === "regHours" && marks.has("regHours"));
      const pd = G.storePayday(s, { predicted: guess, found });
      ctx.track("grindStub", { found, kind: st.error.kind });
      if (!found) {
        ctx.echo(`Missed paystub error: ${st.error.text} You lost ${money(st.missing)}.`);
        ctx.mistake({ type: "stub", cost: st.missing, label: "Missed a paystub error", quiet: true });
      } else ctx.echo(`You caught it: ${st.error.text} Payroll fixed it.`, { kind: "good" });
      const rates = G.compareRates();
      ctx.finish({
        score: pd.score,
        tie: Math.round(pd.net),
        tier: "store",
        sub: { net: pd.net, bonus: pd.bonus, found, sick: pd.sick, hours: pd.hours },
        perfect: found && !pd.sick && pd.bonus >= 40,
        reveal: h("div", h("ul.bd-reveal-list", h("li", icon("coins", { size: 14 }), ` Take-home ${money(pd.net)}`), h("li", icon("star", { size: 14 }), ` Guess bonus ${pd.bonus}`), h("li", icon(found ? "check" : "alert", { size: 14 }), found ? " Paystub error caught" : ` Missed: ${st.error.text}`), pd.sick ? h("li", icon("alert", { size: 14 }), ` ${pd.sick} sick day${pd.sick === 1 ? "" : "s"}`) : null), rateBars([["Your store weeks", pd.rate, true], ["Store wage after taxes", rates.store], ["Salary, 40 hours a week", rates.salary40], ["Salary, 50 hours a week", rates.salary50]])),
        biggest: { text: `how many extra shifts to take (you said yes to ${s.decisions.filter((d) => d.yes).length})`, reasons: { weak: "More shifts always means more money.", okay: "I took some and skipped some.", strong: "I took the overtime that paid 1.5 times and skipped what would wear me out into a sick day." } },
        stats: { mode: "store", sick: pd.sick },
      });
    }
  }

  begin();
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
