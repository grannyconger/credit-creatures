// Market Dash (GAME-SPECS.md game 13): shop for a week of meals on a budget,
// check the receipt, then watch the week play out. No nutrition labels anywhere.
// Rules: js/arcade/dash.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { createRng } from "../../engine/index.js";
import * as M from "../../arcade/dash.js";
import { DASH_AISLES, DASH_TYPE_LABEL } from "../../data/arcade/dash.js";
import { docInspector, keyHelp, simplified, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const cents = (c) => money(c / 100);

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const difficulty = training ? "easy" : settings.difficulty;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.dash;
  const d = M.newShift(seed, difficulty);
  const root = h("div.minigame.dash");
  const ring = timed ? timerRing({ label: "Shopping time left" }) : null;
  const cart = [];
  let aisle = 0;
  let sel = 0;
  let showUnit = false;
  let sale = { on: false, done: false, adds: 0 };
  let roommateShown = difficulty !== "hard";
  let over = false;
  let tick = null;
  let t0 = 0;
  let keys = null;
  const coached = new Set();

  // ---------- Skill moment: unit prices ----------
  function skillMoment() {
    const rng = createRng(`${seed}:skill`);
    const a = { size: 16, price: 240 };
    const b = { size: 32, price: 416 + rng.int(0, 2) * 4 };
    const box = h("div.md-skill");
    const step2 = () => {
      const input = h("input", { type: "text", inputmode: "decimal", "aria-label": "Price per ounce, in dollars" });
      const go = () => {
        const ok = Math.abs(Number(input.value.replace(/[$,\s]/g, "")) - 0.15) < 0.005;
        ctx.track("skillMoment", { game: "dash", step: "unit", right: ok });
        (ok ? sfx.correct : sfx.error)();
        showUnit = true;
        fill(box, h("p.mg-flash", { class: ok ? "good" : "bad" }, icon(ok ? "check" : "alert", { size: 18 }), ok ? " Right. $3.60 divided by 24 is 15 cents an ounce." : " It's $0.15. Divide the price by the ounces: $3.60 over 24."), h("p", "From now on, every tag shows its unit price."), h("button.big", { type: "button", "data-autofocus": "", onclick: begin }, "Grab a cart"));
        box.querySelector("button").focus();
      };
      input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), go()));
      fill(box, h("p.md-q", "What is the price per ounce of the 24 oz jar at $3.60?"), h("div.row", h("span", "$"), input, h("button", { type: "button", onclick: go }, "Check")));
      input.focus();
    };
    const pick = (better) => {
      ctx.track("skillMoment", { game: "dash", step: "pick", right: better });
      (better ? sfx.correct : sfx.error)();
      fill(box, h("p.mg-flash", { class: better ? "good" : "bad" }, icon(better ? "check" : "alert", { size: 18 }), ` The 32 oz is ${(b.price / b.size).toFixed(1)} cents an ounce. The 16 oz is ${(a.price / a.size).toFixed(1)} cents. ${better ? "Good eye." : "Bigger was cheaper per ounce here."}`));
      setTimeout(step2, 1100);
    };
    fill(box, h("h4", "Which is the better buy?"), h("div.md-pair", h("button.md-tag", { type: "button", onclick: () => pick(false) }, h("strong", cents(a.price)), h("span", "Rice, 16 oz")), h("button.md-tag", { type: "button", onclick: () => pick(true) }, h("strong", cents(b.price)), h("span", "Rice, 32 oz"))));
    fill(root, box);
    box.querySelector("button").focus();
  }

  // ---------- Shopping ----------
  const meals = h("section.md-meals");
  const shelf = h("section.md-shelf");
  const cartBox = h("section.md-cart");

  function begin() {
    fill(root, h("div.mg-bar", h("span.mg-clock", "Shopping"), ring, h("span.mg-score", `Budget ${cents(d.budget)}`)), h("div.md-grid", meals, shelf, cartBox), keyHelp("1 to 6 pick an aisle, Left and Right pick an item, Enter adds it, Backspace takes the last one back, G goes to checkout."));
    t0 = Date.now();
    document.addEventListener("keydown", onKey);
    if (timed) tick = setInterval(loop, 250);
    keys = shopKeys;
    paint();
    if (training) ctx.coach(0, meals).then(() => ctx.coach(1, shelf));
  }

  function loop() {
    if (over) return;
    const t = (Date.now() - t0) / 1000;
    ring.set(cfg.seconds - t, cfg.seconds);
    if (!sale.on && !sale.done && t >= cfg.seconds / 4) startSale();
    if (sale.on && t >= cfg.seconds / 4 + cfg.saleSeconds) endSale();
    if (!roommateShown && t >= cfg.seconds / 2) roommate();
    if (t >= cfg.seconds) checkout();
  }

  function startSale() {
    sale.on = true;
    ctx.echo(`Flash sale! ${d.saleAisle} is 30 percent off for a short time.`, { kind: "good" });
    paint();
  }
  function endSale() {
    sale.on = false;
    sale.done = true;
    ctx.notice("The flash sale ended.");
    paint();
  }
  function roommate() {
    roommateShown = true;
    ctx.echo("Your roommate texts: can you grab toilet paper too?", { kind: "safe" });
    paint();
  }

  const items = () => M.ITEMS.filter((it) => it.aisle === DASH_AISLES[aisle]);
  const plan = () => d.plan.filter((m) => !m.roommate || roommateShown);

  function covered() {
    // Servings in the cart by type against the servings the plan needs.
    const have = {};
    for (const l of cart) have[M.ITEMS[l.i].type] = (have[M.ITEMS[l.i].type] || 0) + M.ITEMS[l.i].servings;
    const need = {};
    for (const m of plan()) for (const t of m.needs) need[t] = (need[t] || 0) + 1;
    return { have, need };
  }

  function add(it) {
    if (it.i === d.out) return ctx.notice(`${it.name} is out of stock. Try a different one.`);
    cart.push({ i: it.i, price: M.priceOf(d, it, sale.on) });
    sfx.correct();
    ctx.track("dashAdd", { item: it.name, price: M.priceOf(d, it, sale.on) });
    if (!timed) {
      sale.adds++;
      if (!sale.on && !sale.done && cart.length === 3) startSale();
      else if (sale.on && sale.adds >= 9) endSale();
      if (!roommateShown && cart.length >= 5) roommate();
    }
    if (training && !coached.has(2) && cart.length >= 2) {
      coached.add(2);
      ctx.coach(2, cartBox);
    }
    paint();
  }

  function removeLast(i = null) {
    const k = i == null ? cart.length - 1 : cart.map((l) => l.i).lastIndexOf(i);
    if (k < 0) return;
    cart.splice(k, 1);
    paint();
  }

  function paint() {
    const { have, need } = covered();
    fill(
      meals,
      h("h4", icon("calendar", { size: 16 }), " This week's meals"),
      h(
        "ul",
        plan().map((m) =>
          h(
            "li",
            h("strong", `${m.roommate ? "Extra" : `Day ${m.day}`}: ${m.name}`),
            h("span.md-needs", m.needs.map((t) => h("span.md-need", { class: (have[t] || 0) >= (need[t] || 1) ? "ok" : "" }, (have[t] || 0) >= (need[t] || 1) ? icon("check", { size: 12 }) : null, ` ${DASH_TYPE_LABEL[t]}`)))
          )
        )
      ),
      M.spoils(d) ? h("p.md-hint", icon("clock", { size: 14 }), " Fresh food spoils after its good-for days.") : h("p.md-hint", "On Easy, nothing spoils.")
    );
    const list = items();
    sel = Math.min(sel, list.length - 1);
    fill(
      shelf,
      h("div.md-aisles", { role: "tablist" }, DASH_AISLES.map((a, k) => h("button.md-aisle", { type: "button", role: "tab", "aria-selected": String(k === aisle), onclick: () => ((aisle = k), (sel = 0), paint()) }, h("kbd", String(k + 1)), ` ${a}`, a === d.saleAisle && sale.on ? h("span.md-saletag", "SALE") : null))),
      h(
        "div.md-items",
        list.map((it, k) => {
          const p = M.priceOf(d, it, sale.on);
          const out = it.i === d.out;
          const inCart = cart.filter((l) => l.i === it.i).length;
          return h(
            "button.md-item",
            { type: "button", "aria-pressed": String(k === sel), disabled: out, onclick: () => ((sel = k), add(it)) },
            h("span.md-brand", it.brand === "store" ? "Store brand" : "Name brand"),
            h("strong", it.name),
            h("span.md-price", p !== it.price ? h("s", cents(it.price)) : null, ` ${cents(p)}`),
            h("small", `${it.size} ${it.unit}, ${it.servings} serving${it.servings === 1 ? "" : "s"}`),
            // Cents to one decimal, so close prices still compare (3.6 cents vs 2.9 cents an ounce).
            showUnit ? h("small.md-unit", `${(p / it.size).toFixed(1)}¢ per ${it.unit === "count" ? "item" : it.unit}`) : null,
            it.good && M.spoils(d) ? h("small.md-good", icon("clock", { size: 12 }), ` Good for ${it.good} days`) : null,
            it.taxable ? h("small", "Taxable") : null,
            out ? h("span.md-out", "Out of stock") : null,
            inCart ? h("span.md-incart", `In cart: ${inCart}`) : null
          );
        })
      )
    );
    const t = M.cartTotal(d, cart);
    const pct = Math.min(1, t.total / d.budget);
    const grouped = [];
    for (const l of cart) {
      const g = grouped.find((x) => x.i === l.i && x.price === l.price);
      if (g) g.qty++;
      else grouped.push({ ...l, qty: 1 });
    }
    fill(
      cartBox,
      h("h4", icon("cart", { size: 16 }), " Your cart"),
      h("div.md-budget", h("div.md-bar", { role: "img", "aria-label": `${Math.round(pct * 100)} percent of budget` }, h("span", { class: t.total > d.budget ? "over" : "", style: `width: ${Math.round(pct * 100)}%` })), h("p", h("strong", cents(t.total)), ` of ${cents(d.budget)}`, t.total > d.budget ? h("em.bad", " Over budget!") : h("span", ` (${cents(d.budget - t.total)} left)`)), t.tax ? h("small", `Includes ${cents(t.tax)} tax`) : null),
      grouped.length ? h("ul.md-cartlist", grouped.map((g) => h("li", h("span", `${g.qty} x ${M.ITEMS[g.i].name}`), h("span", cents(g.price * g.qty)), h("button.small", { type: "button", "aria-label": `Take one ${M.ITEMS[g.i].name} back`, onclick: () => removeLast(g.i) }, icon("minus", { size: 12 }))))) : h("p.muted", "Empty."),
      h("button.big", { type: "button", "aria-keyshortcuts": "G", onclick: checkout }, "Checkout (G)"),
      simplified("tax rules vary by state")
    );
  }

  function shopKeys(e) {
    const k = e.key;
    const n = Number(k);
    if (n >= 1 && n <= 6) return e.preventDefault(), (aisle = n - 1), (sel = 0), paint(), shelf.querySelector('.md-item[aria-pressed="true"]')?.focus();
    if (k === "ArrowRight" || k === "ArrowLeft") {
      e.preventDefault();
      sel = Math.max(0, Math.min(items().length - 1, sel + (k === "ArrowRight" ? 1 : -1)));
      paint();
      return shelf.querySelector('.md-item[aria-pressed="true"]')?.focus();
    }
    if (k === "Enter" && !e.target.closest("button")) return e.preventDefault(), add(items()[sel]);
    if (k === "Backspace") return e.preventDefault(), removeLast();
    if (k.toLowerCase() === "g") return e.preventDefault(), checkout();
  }

  // ---------- Checkout: the receipt ----------
  function checkout() {
    if (over) return;
    over = true;
    clearInterval(tick);
    roommateShown = true;
    const r = M.receipt(d, cart);
    const marks = new Set();
    const lines = [...r.lines.map((l) => ({ id: l.id, cells: [`${l.qty} x`, l.name, cents(l.total)] })), { id: "sub", cells: ["", "Subtotal", cents(r.sub)] }, { id: "tax", cells: ["", `Tax (${Math.round(cfg.taxRate * 100)}%, household items)`, cents(r.tax)] }, { id: "total", cells: ["", "TOTAL", cents(r.total)] }];
    const doc = docInspector({ title: "Your receipt", className: "md-receipt", lines, marked: marks, onToggle: (id, on) => { if (on) for (const x of [...marks]) if (x !== id) marks.delete(x); doc.querySelectorAll(".arc-doc-line").forEach((b) => b.setAttribute("aria-pressed", String(marks.has(b.dataset.id)))); } });
    const pay = (claim) => {
      const caught = claim && marks.has(r.bad);
      ctx.track("dashReceipt", { kind: r.kind, caught, claimed: claim });
      (caught ? sfx.correct : sfx.error)();
      if (claim && !caught) ctx.notice("That line was right. The real mistake slipped through.");
      weekView(caught, r);
    };
    fill(root, h("div.mg-bar", h("span.mg-clock", "Checkout"), h("span.mg-score", `Budget ${cents(d.budget)}`)), h("div.md-checkout", h("div", h("p.md-q", "Check the receipt against the shelf prices before you pay. Tap the one line that's wrong, or press Looks good."), doc), h("aside.md-cartmini", h("h5", "What you put in the cart"), h("ul", cart.map((l) => h("li", `${M.ITEMS[l.i].name}: ${cents(l.price)}`))), h("div.row", h("button.big", { type: "button", onclick: () => (marks.size ? pay(true) : ctx.notice("Tap the line that's wrong first.")) }, "That's the mistake"), h("button.secondary", { type: "button", onclick: () => pay(false) }, "Looks good")))), keyHelp("Tab moves between lines, Enter marks one."));
    if (training) ctx.coach(2, doc);
    doc.querySelector("button")?.focus();
    keys = null;
  }

  // ---------- The week ----------
  function weekView(caught, r) {
    const sc = M.score(d, cart, { caught });
    if (caught) ctx.echo(`Receipt fixed: ${cents(r.over)} back. From: a ${r.kind === "double" ? "double scan" : r.kind === "qty" ? "quantity math slip" : r.kind === "tax" ? "tax mistake" : r.kind === "total" ? "wrong total" : "shelf price mismatch"}.`, { kind: "good" });
    else if (r.bad) ctx.mistake({ type: "receipt", cost: r.over / 100, label: "Missed the receipt error" });
    if (sc.over > 0) ctx.mistake({ type: "overBudget", cost: sc.over, label: "Over budget" });
    for (const x of sc.week.days.filter((x) => !x.cooked && x.takeout)) {
      ctx.echo(`Day ${x.meal.day}: no ${x.missing.map((t) => DASH_TYPE_LABEL[t]).join(" or ")}, so it was takeout for ${money(x.takeout)}.`);
      ctx.mistake({ type: "takeout", cost: CONFIG.arcade.games.dash.takeout, label: `Takeout on day ${x.meal.day}`, quiet: true });
    }
    for (const s of sc.week.spoiled) ctx.echo(`${s.name} spoiled on day ${s.day}: ${cents(s.cents)} in the trash.`);
    const strip = h(
      "ol.md-week",
      sc.week.days.map((x) => h("li", { class: x.cooked ? "cooked" : "takeout" }, h("small", x.meal.roommate ? "Extra" : `Day ${x.meal.day}`), h("strong", x.meal.name), h("span", icon(x.cooked ? "check" : "alert", { size: 14 }), x.cooked ? " Cooked" : x.meal.roommate ? " Forgot it" : ` Takeout ${money(x.takeout)}`))),
      sc.week.spoiled.map((s) => h("li.spoiled", h("small", `Day ${s.day}`), h("strong", s.name), h("span", icon("x", { size: 14 }), ` Spoiled ${cents(s.cents)}`)))
    );
    ctx.finish({
      score: sc.score,
      tie: Math.round(sc.left * 100),
      tier: difficulty,
      sub: { cooked: sc.cooked, left: sc.left, waste: sc.waste, takeout: sc.takeout, caught: sc.caught },
      perfect: sc.cooked === sc.meals && !sc.waste && sc.caught && sc.left >= 0,
      reveal: h("div", strip, h("ul.bd-reveal-list", h("li", icon("check", { size: 14 }), ` ${sc.cooked} of ${sc.meals} cooked`), h("li", icon("coins", { size: 14 }), ` ${money(sc.left)} of budget left`), h("li", icon(sc.waste ? "alert" : "check", { size: 14 }), ` Waste ${money(sc.waste)}`), h("li", icon(sc.caught ? "check" : "alert", { size: 14 }), sc.caught ? " Receipt error caught" : " Receipt error missed"))),
      biggest: M.biggest(d, cart),
      stats: { difficulty, items: cart.length },
    });
  }

  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    keys?.(e);
  }

  if (training) {
    showUnit = true;
    begin();
  } else skillMoment();
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
