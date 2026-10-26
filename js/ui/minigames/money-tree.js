// Money Tree (GAME-SPECS.md game 11): a garden of four plots grows for 40
// years. Set the split at each checkpoint, ride out storms, hit the car goal.
// Rules: js/arcade/tree.js. Simplified for learning, not investment advice.
import { h, fill, money as cents } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import * as T from "../../arcade/tree.js";
import { TREE_PLOTS, TREE_KEYS, TREE_TEMPTATIONS } from "../../data/arcade/tree.js";
import { keyHelp, simBars, simplified, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

// The garden shows whole dollars.
const money = (v) => cents(Math.round(v));
const SKILL = { q: "$1,000 grows 7 percent a year. About how much after 10 years?", choices: ["About $1,070", "About $1,700", "About $1,970", "About $7,000"], answer: 2 };

// Generated plant art for each plot, sized by how much is growing there.
function plantSvg(k, value, stormy) {
  const s = Math.max(0.35, Math.min(1, 0.35 + Math.log10(1 + value / 200) / 3.4));
  const body = {
    savings: `<path d="M40 76V${76 - 40 * s}" class="mt-stem"/><ellipse cx="${40 - 9 * s}" cy="${76 - 30 * s}" rx="${10 * s}" ry="${5 * s}" class="mt-leaf"/><ellipse cx="${40 + 9 * s}" cy="${76 - 38 * s}" rx="${10 * s}" ry="${5 * s}" class="mt-leaf"/>`,
    cd: `<path d="M40 76V${76 - 36 * s}" class="mt-stem"/><circle cx="40" cy="${76 - 40 * s}" r="${9 * s}" class="mt-bloom"/><path d="M8 76V48M72 76V48M8 56h64M8 68h64" class="mt-fence"/><rect x="33" y="52" width="14" height="11" rx="2" class="mt-lock"/><path d="M36 52v-4a4 4 0 0 1 8 0v4" class="mt-fence"/>`,
    index: `<path d="M40 76V${76 - 30 * s}" class="mt-trunk"/><circle cx="40" cy="${76 - 42 * s}" r="${20 * s}" class="mt-leaf"/><circle cx="${40 - 12 * s}" cy="${76 - 34 * s}" r="${12 * s}" class="mt-leaf"/><circle cx="${40 + 12 * s}" cy="${76 - 34 * s}" r="${12 * s}" class="mt-leaf"/>`,
    coin: `<path d="M40 76V${76 - 22 * s}" class="mt-stalk"/><path d="M${40 - 18 * s} ${76 - 22 * s}a${18 * s} ${14 * s} 0 0 1 ${36 * s} 0z" class="mt-cap"/><circle cx="${40 - 6 * s}" cy="${76 - 28 * s}" r="${2.5 * s}" class="mt-dot"/><circle cx="${40 + 7 * s}" cy="${76 - 26 * s}" r="${2 * s}" class="mt-dot"/>`,
  }[k];
  return `<svg class="mt-plant${stormy ? " stormy" : ""}" viewBox="0 0 80 84" aria-hidden="true" focusable="false"><rect x="0" y="76" width="80" height="8" class="mt-soil"/>${body}</svg>`;
}

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const manual = settings.water === "manual";
  const cfg = CONFIG.arcade.games.tree;
  const g = T.newGarden(T.market(seed));
  const root = h("div.minigame.tree");
  const ring = timed ? timerRing({ label: "Time left this season" }) : null;
  const split = { savings: 70, cd: 30, index: 0, coin: 0 };
  const waters = {};
  let rebalance = false;
  let sel = 0;
  let tick = null;
  let over = false;
  let skill = null;
  let busy = false;
  let lastGrowth = null;
  let pendingGhost = null;
  let keys = null;
  let crashes = 0;
  let clockAt = null;

  const sum = () => TREE_KEYS.reduce((t, k) => t + split[k], 0);
  const age = () => 22 + g.year;
  const nextCp = () => T.CHECKPOINTS[g.cp + 1];
  const carReady = () => Math.min(cfg.carGoal, g.savings + T.cdValue(g) * (1 - cfg.cdPenalty) + g.index + g.coin);

  function goals() {
    const carPct = g.car ? (g.car.hit ? 100 : (g.car.got / cfg.carGoal) * 100) : (carReady() / cfg.carGoal) * 100;
    const retPct = Math.min(100, (T.total(g) / cfg.retireTarget) * 100);
    const bar = (label, pct, note, done) => h("div.mt-goal", h("div.mt-goal-head", h("strong", label), h("small", note)), h("span.mt-goal-track", { role: "img", "aria-label": `${label}: ${Math.round(pct)} percent` }, h("span.mt-goal-fill", { class: done, style: `width: ${Math.round(pct)}%` })));
    return h(
      "div.mt-goals",
      bar("Car goal, year 3", carPct, g.car ? (g.car.hit ? "Hit. You bought the car." : `Missed by ${money(g.car.short)}`) : `${money(carReady())} of ${money(cfg.carGoal)} ready`, g.car ? (g.car.hit ? "good" : "bad") : ""),
      bar("Retirement, year 40", retPct, `${money(T.total(g))} of ${money(cfg.retireTarget)}`, T.total(g) >= cfg.retireTarget ? "good" : "")
    );
  }

  function growthChart() {
    const pts = g.history;
    const W = 420;
    const H = 90;
    const hi = Math.max(cfg.retireTarget, ...pts.map((p) => p.total));
    const x = (yr) => 6 + ((W - 12) * yr) / T.YEARS;
    const y = (v) => H - 6 - ((H - 14) * v) / hi;
    const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)} ${y(p.total).toFixed(1)}`).join("");
    const storms = g.mkt.years.filter((m) => m.crash && m.y <= g.year).map((m) => `<path d="M${x(m.y).toFixed(1)} 4V${H - 6}" class="mt-chart-storm"/>`).join("");
    const el = h("figure.mt-chart", h("figcaption", "Your garden's total value"));
    el.insertAdjacentHTML("beforeend", `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M6 ${y(cfg.retireTarget).toFixed(1)}H${W - 6}" class="mt-chart-goal"/>${storms}<path d="${line}" class="mt-chart-line"/></svg>`);
    return el;
  }

  function plots(stormy = false) {
    return h(
      "div.mt-garden",
      { role: "listbox", "aria-label": "Your four plots" },
      TREE_KEYS.map((k, i) => {
        const p = TREE_PLOTS[k];
        const v = T.plotValue(g, k);
        const lock = k === "cd" && g.cd.length ? g.cd.reduce((m, x) => Math.max(m, x.start + cfg.cdYears), 0) : null;
        const growth = lastGrowth && skill?.done ? lastGrowth[k] : null;
        const el = h(
          "div.mt-plot",
          { role: "option", "aria-selected": String(i === sel), class: `plot-${k}`, onclick: () => ((sel = i), paint()) },
          h("span.mt-art", { html: plantSvg(k, v, stormy && (k === "index" || k === "coin")) }),
          h("div.mt-plot-text", h("strong", p.name), h("small", p.plant), h("span.mt-val", money(v)), h("small.mt-label", p.label), lock && lock > g.year ? h("small.mt-lock-note", icon("key", { size: 12 }), ` Newest CD unlocks at year ${lock}`) : null, growth != null ? h("small.mt-growth", { class: growth < 0 ? "neg" : "" }, icon(growth < 0 ? "minus" : "up", { size: 12 }), ` ${growth >= 0 ? "+" : ""}${(growth * 100).toFixed(1)} percent a year lately`) : null),
          stormy
            ? null
            : h(
                "div.mt-split",
                h("button", { type: "button", "aria-label": `Less to ${p.name}`, onclick: (e) => (e.stopPropagation(), adjust(k, -10)) }, icon("minus", { size: 14 })),
                h("strong", { "aria-live": "polite" }, `${split[k]}%`),
                h("button", { type: "button", "aria-label": `More to ${p.name}`, onclick: (e) => (e.stopPropagation(), adjust(k, 10)) }, icon("plus", { size: 14 }))
              )
        );
        return el;
      })
    );
  }

  function adjust(k, d) {
    if (busy) return;
    const v = split[k] + d;
    if (v < 0 || v > 100 || (d > 0 && sum() >= 100)) return;
    split[k] = v;
    paint();
  }

  function bar() {
    return h("div.mg-bar", h("span.mg-clock", `Age ${age()}, year ${g.year}`), ring, h("span.mg-score", `Garden ${money(T.total(g))}`));
  }

  // ---------- The checkpoint panel ----------
  function paint() {
    const s = sum();
    let penalty = 0;
    for (const lot of g.cd) if (g.year - lot.start < cfg.cdYears) penalty += lot.amount * cfg.cdPenalty;
    const isStart = g.year === 0;
    const skillEl = isStart && !skill?.done ? skillBox() : null;
    const go = h("button.big", { type: "button", "aria-keyshortcuts": "Enter", onclick: () => confirm() }, icon("play", { size: 18 }), isStart ? " Plant and grow" : ` Grow to year ${nextCp()}`);
    const side = h(
      "aside.mt-panel",
      skillEl,
      h("h4", isStart ? "Plant your $2,000" : `Season check, year ${g.year}`),
      h("p", `Each year, ${money(cfg.yearly)} goes in, split like this.`),
      h("p.mt-sum", { class: s === 100 ? "ok" : "bad" }, icon(s === 100 ? "check" : "alert", { size: 14 }), s === 100 ? " The split adds up to 100 percent." : ` The split adds up to ${s} percent. ${s < 100 ? `Add ${100 - s} more.` : `Take away ${s - 100}.`}`),
      isStart
        ? null
        : h(
            "label.mt-rebal",
            h("input", { type: "checkbox", checked: rebalance, onchange: (e) => ((rebalance = e.target.checked), paint()) }),
            " Also move the money already growing into this split",
            rebalance && penalty > 0 ? h("small.mt-warn", icon("alert", { size: 12 }), ` Pulling CDs early costs a ${money(penalty)} penalty.`) : null
          ),
      g.year === 0 && training ? h("p.mt-eva", h("strong", "Early Eva and Late Leo. "), "Eva starts at 22, Leo at 32. Same yearly amount. Eva ends up with far more, because her money gets ten extra years to grow.") : null,
      go,
      simplified("not investment advice")
    );
    fill(root, bar(), goals(), h("div.mt-main", h("div.mt-left", plots(), growthChart()), side), keyHelp("Up and Down pick a plot, Left and Right change its percent, Enter grows the garden."));
    keys = (e) => {
      if (busy) return;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") (e.preventDefault(), (sel = (sel + (e.key === "ArrowUp" ? 3 : 1)) % 4), paint(), root.querySelector('.mt-plot[aria-selected="true"]')?.focus?.());
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") (e.preventDefault(), adjust(TREE_KEYS[sel], e.key === "ArrowRight" ? 10 : -10));
      else if (e.key === "Enter" && !e.target.closest("button, input")) (e.preventDefault(), confirm());
    };
    if (timed && clockAt !== g.year) clockAt = g.year, startClock(cfg.seasonSeconds, () => {
      if (isStart && !skill?.done) answer(-1);
      const left = 100 - sum();
      if (left > 0) split.savings += left;
      else if (left < 0) for (const k of [...TREE_KEYS].reverse()) while (sum() > 100 && split[k] > 0) split[k] -= 10;
      confirm();
    });
  }

  function skillBox() {
    return h("div.mt-skill", h("p", h("strong", "Quick check: "), SKILL.q), h("div.mt-skill-row", SKILL.choices.map((c, i) => h("button", { type: "button", onclick: () => answer(i) }, `${i + 1}. ${c}`))));
  }

  function answer(i) {
    if (skill?.done) return;
    const ok = i === SKILL.answer;
    skill = { done: true, ok };
    ctx.track("skillMoment", { game: "tree", right: ok });
    (ok ? sfx.correct : sfx.error)();
    ctx.notice(ok ? "Right. 1.07 multiplied 10 times is about 1.97. Growth labels now show on each plot." : "It's about $1,970. Each year's growth grows too. Growth labels now show on each plot.");
    paint();
  }

  function startClock(seconds, onEnd) {
    clearInterval(tick);
    if (!timed) return;
    const endAt = Date.now() + seconds * 1000;
    tick = setInterval(() => {
      const left = (endAt - Date.now()) / 1000;
      ring.set(left, seconds);
      if (left <= 0) (clearInterval(tick), onEnd());
    }, 250);
  }

  function confirm() {
    if (busy || over) return;
    if (g.year === 0 && !skill?.done) return ctx.notice("Answer the quick check first. Press 1, 2, 3 or 4.");
    if (sum() !== 100) return ctx.notice(`Your split adds up to ${sum()} percent. Make it 100 first.`);
    clearInterval(tick);
    if (g.year === 0) {
      T.plant(g, split);
      ctx.track("treeSplit", { year: 0, ...split });
    } else {
      const pen = T.setSplit(g, split, rebalance);
      ctx.track("treeSplit", { year: g.year, ...split, rebalance });
      if (pen) ctx.echo(`Pulling CDs early cost ${money(pen)}.`);
    }
    rebalance = false;
    if (manual) water();
    else grow(true);
  }

  // ---------- Watering by hand ----------
  function water() {
    busy = true;
    const offer = TREE_TEMPTATIONS[(g.cp * 7 + String(seed).length) % TREE_TEMPTATIONS.length];
    let done = false;
    const pick = (watered, treat) => {
      if (done) return;
      done = true;
      clearInterval(tick);
      waters[g.cp] = watered;
      if (treat) g.treats++;
      ctx.track("treeWater", { year: g.year, watered, treat });
      if (!watered) ctx.echo(treat ? `Treat taken. ${money(cfg.yearly)} a year skipped until year ${nextCp()}.` : `Missed watering. ${money(cfg.yearly)} a year skipped until year ${nextCp()}.`, { kind: "alert" });
      grow(watered);
    };
    const wRing = timerRing({ label: "Time to water" });
    const btn = h("button.big", { type: "button", "aria-keyshortcuts": "Space", onclick: () => pick(true, false) }, icon("plus", { size: 18 }), " Water (Space)");
    fill(
      root,
      bar(),
      goals(),
      h("div.mt-water", h("div.mt-water-card", h("h4", "Time to water"), h("p", `Press Space in ${cfg.waterSeconds} seconds to put in ${money(cfg.yearly)} a year until year ${nextCp()}.`), wRing, btn, h("div.mt-tempt", h("p", icon("star", { size: 14 }), ` ${offer} (+${cfg.treatPoints} points now)`), h("button.secondary", { type: "button", onclick: () => pick(false, true) }, "Take the treat")))),
      keyHelp("Space waters the garden.")
    );
    btn.focus();
    keys = (e) => e.key === " " && (e.preventDefault(), pick(true, false));
    const endAt = Date.now() + cfg.waterSeconds * 1000;
    tick = setInterval(() => {
      const left = (endAt - Date.now()) / 1000;
      wRing.set(left, cfg.waterSeconds);
      if (left <= 0) pick(false, false);
    }, 200);
  }

  // ---------- Growing ----------
  function grow(watered) {
    busy = true;
    const from = g.year;
    const r = T.run(g, { watered });
    // Each plot's average yearly growth over the stretch, not counting new money.
    const span = g.mkt.years.slice(from, g.year);
    const yearly = (f) => Math.pow(span.reduce((t, m) => t * f(m), 1), 1 / span.length) - 1;
    lastGrowth = { savings: yearly((m) => 1 + m.savings), cd: g.mkt.cdRate, index: yearly((m) => 1 + m.index), coin: yearly((m) => m.coin) };
    for (const ev of r.events) {
      if (ev.type === "car") {
        if (ev.hit) (sfx.correct(), ctx.echo(`Year 3: you had the ${money(cfg.carGoal)} for the car.`, { kind: "up" }));
        else {
          sfx.error();
          ctx.echo(`Year 3: you were ${money(ev.short)} short for the car.`, { kind: "alert" });
          ctx.mistake({ type: "carShort", cost: Math.min(cfg.riskyCap, ev.short), label: "Car goal short" });
        }
      } else if (ev.type === "surprise") ctx.echo(`Year 15: a ${money(ev.amount)} surprise expense came out of your garden.`, { kind: "alert" });
      else if (ev.type === "mania") ctx.notice("Hype coin mania! The coin is spiking and everyone is talking about it.");
    }
    if (pendingGhost && r.at !== "crash") {
      ctx.echo(`Ghost line: ${pendingGhost.sold ? "holding" : "selling"} would have left ${money(pendingGhost.value)}. You have ${money(T.total(g))}.`, { kind: "info" });
      pendingGhost = null;
    }
    const after = () => {
      busy = false;
      if (r.at === "crash") storm(watered);
      else if (r.at === "end" || g.year >= T.YEARS) end();
      else paint();
    };
    // A short pause so the growth reads as time passing.
    fill(root, bar(), goals(), h("div.mt-main", h("div.mt-left", plots(r.at === "crash"), growthChart()), h("aside.mt-panel", h("h4", r.at === "crash" ? "A storm rolls in" : `Growing to year ${g.year}`), h("p", `Age ${age()}.`))));
    setTimeout(after, 700);
  }

  function storm(watered) {
    busy = true;
    crashes++;
    const drop = Math.round(-g.mkt.years[g.year - 1].index * 100);
    const choose = (sell) => {
      if (keys !== onStorm) return;
      keys = null;
      const ghostValue = T.ghost(g, sell);
      const moved = T.crashChoice(g, sell);
      ctx.track("treeCrash", { year: g.year, sell });
      if (sell) {
        sfx.error();
        ctx.echo(`Sold ${money(moved)} into savings at the storm price.`, { kind: "alert" });
        ctx.mistake({ type: "panicSell", cost: cfg.sellCost, label: "Sold in a storm" });
      } else sfx.correct();
      pendingGhost = { sold: sell, value: ghostValue };
      if (T.atCheckpoint(g)) {
        if (g.year >= T.YEARS) return end();
        busy = false;
        paint();
      } else grow(watered);
    };
    const onStorm = (e) => {
      const k = e.key.toLowerCase();
      if (k === "h") (e.preventDefault(), choose(false));
      else if (k === "s") (e.preventDefault(), choose(true));
    };
    keys = onStorm;
    const hold = h("button.big", { type: "button", "aria-keyshortcuts": "H", onclick: () => choose(false) }, icon("shield", { size: 18 }), " Hold (H)");
    fill(
      root,
      bar(),
      goals(),
      h("div.mt-main", h("div.mt-left", plots(true), growthChart()), h("aside.mt-panel.mt-storm", { role: "alertdialog", "aria-label": "Storm" }, h("h4", icon("alert", { size: 18 }), ` Storm in year ${g.year}`), h("p", `The index fund dropped ${drop} percent this year. Your index fund and Hype coin are worth ${money(g.index + g.coin)} now.`), h("p", "Hold and wait, or sell everything risky into savings at today's price?"), hold, h("button.secondary", { type: "button", "aria-keyshortcuts": "S", onclick: () => choose(true) }, "Sell everything (S)"))),
      keyHelp("H holds, S sells everything risky.")
    );
    hold.focus();
    if (training && crashes === 1) ctx.coach(2, hold);
    if (timed) (clockAt = null), startClock(cfg.seasonSeconds, () => choose(false));
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = T.score(g);
    const mine = T.policyOf(g, waters);
    const sim = T.simulate(seed, mine);
    const sav = T.simulate(seed, T.POLICIES.allSavings);
    const coin = T.simulate(seed, T.POLICIES.allCoin);
    const full = sc.missed ? T.score(T.play(seed, { ...mine, waterAt: () => true })).final : sc.final;
    if (sc.missed) ctx.echo(`Missed watering cost you ${money(sc.missed)} in deposits and ${money(Math.max(0, full - sc.final - sc.missed))} more in lost growth.`, { kind: "alert" });
    const reveal = h(
      "div.mt-reveal",
      h("p", `At 62 your garden is worth ${money(sc.final)}. That's your net worth from investing, since the garden holds no debt. ${sc.carHit ? "You hit the car goal." : `You missed the car goal by ${money(sc.carShort)}.`} ${sc.retired ? "You reached the retirement target." : `The retirement target was ${money(cfg.retireTarget)}.`}`),
      simBars({ title: "The same plan on 100 different markets", note: "Money at 62: average, best, and the worst 5 percent.", rows: [{ label: "Your plan", avg: sim.avg, best: sim.best, worst: sim.worst, mine: true }, { label: "All savings", avg: sav.avg, best: sav.best, worst: sav.worst }, { label: "All Hype coin", avg: coin.avg, best: coin.best, worst: coin.worst }] }),
      simplified("not investment advice")
    );
    ctx.finish({ score: sc.score, tie: sc.final, payScore: sc.score, sub: { final: sc.final, carHit: sc.carHit, retired: sc.retired, treats: sc.treats, missed: sc.missed }, perfect: sc.carHit && sc.retired && !g.sold.length, reveal, biggest: T.biggest(g), stats: { decisions: g.decisions.length, sold: g.sold.length } });
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("textarea, select, dialog, .arc-coach")) return;
    if (!busy && g.year === 0 && !skill?.done && /^[1-4]$/.test(e.key)) return answer(Number(e.key) - 1);
    keys?.(e);
  }
  document.addEventListener("keydown", onKey);
  paint();
  if (training) ctx.coach(0, root.querySelector(".mt-garden")).then(() => ctx.coach(1, root.querySelector(".mt-goals")));
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
