// "Pay with" screen (SPEC §14), built to look like a phone payment sheet (teacher
// request 2026-10-25): who you are paying and how much, your wallet's cards drawn
// like the real thing (the debit card, each credit card, a pay-later plan, or
// cash from the piggy bank), the live numbers behind the one you pick, and a Pay
// button. Paying shows "Hold near reader", then a check mark and the chime a
// phone makes after a tap to pay, and only then does the purchase go through.
import { h, add, fill, money, percent } from "./dom.js";
import { icon } from "./icons.js";
import { cardArt } from "./card-art.js";
import { sfx } from "./sound.js";
import { paymentOptions, findAccount } from "../engine/index.js";
import { CONFIG } from "../data/config.js";

const WHAT = {
  debit: "Spends your own money right now. Not on your credit report.",
  card: "Borrows from the bank. Due after your next statement. Raises your utilization until you pay it.",
  bnpl: "Splits it into 3 payments from checking. Not on your report unless you miss and it goes to collections.",
};

// How long each step of paying shows, in ms. Calm motion and reduced motion
// keep it short, so nobody waits on an animation.
const STEPS = { reader: 900, done: 1000, calmReader: 250, calmDone: 500 };
const calm = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "calm";

// A pay-later plan drawn like a card: dots for each payment, the first one filled.
function laterArt(o) {
  const parts = CONFIG.bnpl.schedule.length;
  return h(
    "div.pay-art.later-art",
    { role: "img", "aria-label": `Pay later in ${parts} payments` },
    h("span.later-name", "Pay later"),
    h("strong.later-first", `${money(o.first)} today`),
    h("span.later-dots", { "aria-hidden": "true" }, Array.from({ length: parts }, (_, i) => h("i", { class: i === 0 ? "on" : "" }))),
    h("span.later-note", `${parts} payments`)
  );
}

// Cash from the piggy bank: a bill with a coin on it.
function cashArt() {
  return h("div.pay-art.cash-art", { role: "img", "aria-label": "Cash from your piggy bank" }, h("span.cash-bill", h("b", "$")), h("span.cash-coin", { "aria-hidden": "true" }, "¢"), h("span.cash-name", "Cash"));
}

// Everything the sheet needs to show one way to pay.
function instrument(o, { life, piggy }) {
  if (o.kind === "debit" && piggy) {
    return { art: cashArt(), name: "Cash from your piggy bank", what: "Cash you already have. Once it's spent, it's gone.", numbers: `Piggy bank ${money(o.before)} → ${money(o.after)}` };
  }
  if (o.kind === "debit") {
    return { art: cardArt({ name: "Debit card", network: "visa", design: "vault", issuerText: "🏦 The Vault", size: "mini" }), name: "Vault debit card", what: WHAT.debit, numbers: `Checking ${money(o.before)} → ${money(o.after)}` };
  }
  if (o.kind === "card") {
    const a = findAccount(life, o.accountId);
    const high = o.utilAfter > 0.3;
    return {
      art: cardArt({ issuer: a.issuer, network: a.network, name: a.name, design: a.design || "plasticBlue", nickname: a.nickname, size: "mini" }),
      name: a.nickname ? `${a.name} "${a.nickname}"` : a.name,
      what: WHAT.card,
      numbers: `Utilization ${percent(o.utilBefore)} → ${percent(Math.min(o.utilAfter, 9.99))}`,
      bar: { width: Math.min(100, Math.round(o.utilAfter * 100)), high },
      warn: high && o.ok ? "Over 30% can lower your score." : "",
    };
  }
  return { art: laterArt(o), name: "Pay later (BNPL)", what: WHAT.bnpl, numbers: `${money(o.first)} today, then ${o.later.map(money).join(" and ")} at the next ${o.later.length} End Months` };
}

// allowed: the methods unlocked so far (js/progression.js payMethods). piggy:
// the prologue, before the bank, when "debit" means coins from the piggy bank.
export function payWith({ life, cost, onPick, onBack, allowed = null, piggy = false }) {
  const methods = (cost.methods || ["debit", "card", "bnpl"]).filter((m) => !allowed || allowed.includes(m));
  const options = paymentOptions(life, { ...cost, methods });
  const merchant = cost.merchant || "Coinhaven";
  const amount = money(cost.amount);
  const wrap = h("div.pay-with");
  const sheet = h("div.pay-sheet");
  add(wrap, sheet);
  const header = h(
    "header.ps-merchant",
    h("span.ps-logo", { "aria-hidden": "true" }, icon(piggy ? "piggy" : "market", { size: 26 })),
    h("div.ps-who", h("small", "Pay"), h("strong", merchant), cost.item ? h("span", cost.item) : null),
    h("strong.ps-amount", amount)
  );

  // Tapping a card only selects it. The Pay button makes it count (bug fix
  // 2026-10-22: a scroll on a touch screen could pick one by accident).
  let selected = null;
  const detail = h("div.ps-detail", { "aria-live": "polite" }, h("p.ps-hint", "Pick a card from your wallet."));
  const payBtn = h("button.pay-confirm.ps-pay", { type: "button", disabled: true, "data-sound": "none" }, icon("contactless", { size: 22 }), h("span", `Pay ${amount}`));
  const cards = h("div.pay-options.ps-cards", { role: "radiogroup", "aria-label": piggy ? "Ways to pay" : "Cards in your digital wallet" });
  const chosenParts = new Map();

  for (const o of options) {
    const inst = instrument(o, { life, piggy });
    chosenParts.set(o, inst);
    const btn = h(
      "button.pay-option.ps-card",
      { type: "button", role: "radio", "aria-checked": "false", disabled: !o.ok, onclick: () => select(o, btn) },
      inst.art,
      h("span.ps-card-name", inst.name),
      o.ok ? null : h("span.ps-decline", icon("alert", { size: 14 }), h("span", o.reason))
    );
    cards.append(btn);
  }

  function select(o, btn) {
    selected = o;
    cards.querySelectorAll(".ps-card").forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
    const inst = chosenParts.get(o);
    fill(
      detail,
      h("strong.ps-name", inst.name),
      h("p.ps-what", inst.what),
      h("p.ps-numbers.pay-numbers", inst.numbers),
      inst.bar ? h("span.util-bar", { "aria-hidden": "true" }, h("span", { class: inst.bar.high ? "high" : "", style: { width: `${inst.bar.width}%` } })) : null,
      inst.warn ? h("p.ps-warn.warn-text", icon("alert", { size: 14 }), ` ${inst.warn}`) : null
    );
    payBtn.disabled = false;
  }

  // Hold near reader, then a check and the chime, then the purchase goes through.
  payBtn.addEventListener("click", () => {
    if (!selected || payBtn.disabled) return;
    payBtn.disabled = true;
    const o = selected;
    const inst = chosenParts.get(o);
    const cash = piggy && o.kind === "debit";
    const quick = calm();
    const art = inst.art.cloneNode(true);
    const state = h("strong.ps-state", cash ? "Counting out your cash" : o.kind === "bnpl" ? "Approving pay later" : "Hold near reader");
    const ring = h("div.ps-ring", { "aria-hidden": "true" }, h("i"), h("i"), h("i"), icon(cash ? "coins" : "contactless", { size: 34 }));
    const terminal = h("div.ps-terminal", { role: "status" }, h("div.ps-art", art), ring, state, h("small", `${merchant}: ${amount}`));
    sheet.classList.add("paying");
    fill(sheet, terminal);
    setTimeout(() => {
      terminal.classList.add("done");
      state.textContent = cash ? "Paid" : o.kind === "bnpl" ? "Approved" : "Payment complete";
      ring.replaceChildren(icon("check", { size: 44, draw: true }));
      sfx.tapToPay();
      setTimeout(() => onPick(o.method, o), quick ? STEPS.calmDone : STEPS.done);
    }, quick ? STEPS.calmReader : STEPS.reader);
  });

  const none = options.every((o) => !o.ok);
  add(
    sheet,
    h("span.ps-grabber", { "aria-hidden": "true" }),
    header,
    h("div.ps-label", h("span", piggy ? "Pay with" : "Pay with your digital wallet"), piggy ? null : icon("wallet", { size: 16 })),
    cards,
    detail,
    none ? h("p.error-text", piggy ? "Your piggy bank doesn't have enough yet. Work a shift at the Arcade." : "Nothing in your wallet can cover this right now.") : null,
    h("div.row.ps-actions", h("button.secondary", { type: "button", onclick: onBack }, "Back"), none ? null : payBtn)
  );
  return wrap;
}

// Short words for telemetry and the decision log.
export function methodLabel(method, life) {
  if (!method) return "";
  if (method === "debit") return "debit card";
  if (method === "bnpl") return "pay later";
  const a = findAccount(life, method.slice(5));
  return a ? a.name : "credit card";
}
