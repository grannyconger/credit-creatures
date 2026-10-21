// Pay cash or build a loan: pick a term and a down payment and see the
// monthly payment, APR, interest and total cost update before deciding.
// Used by the Garage and the Cottage (Phase 10, Chapter 2).
import { h, fill, money } from "./dom.js";

// quote(plan) -> { payment, apr, totalInterest, total, today, approved }.
// onBuy(plan): plan = { cash: true } or { term, down }.
export function loanPicker({ life, item, quote, terms = null, downs = null, onBuy }) {
  const box = h("div.loan-picker");
  let term = terms?.[0];
  let down = downs?.[0] ?? 0;
  let busy = false;
  const go = async (plan, btn) => {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    await onBuy(plan);
    busy = false;
  };

  function paint() {
    const cashOk = life.checking >= item.price;
    const cash = h("button.secondary", { type: "button", disabled: !cashOk, "data-sound": "none" }, `Pay cash (${money(item.price)})`);
    cash.addEventListener("click", () => go({ cash: true }, cash));
    if (!terms) {
      return fill(box, h("div.row", cash), cashOk ? null : h("p.note.tight", `You have ${money(life.checking)} in checking. Save up for this one.`));
    }
    const q = quote({ term, down });
    const chips = (label, list, value, set, fmt) =>
      h(
        "div.chip-group",
        { role: "group", "aria-label": label },
        h("span.chip-label", label),
        list.map((v) => h("button.chip", { type: "button", "aria-pressed": String(v === value), disabled: label === "Down payment" && v > life.checking, onclick: () => (set(v), paint()) }, fmt(v)))
      );
    const loanBtn = h("button", { type: "button", "data-sound": "none" }, `Get the loan (${money(q.payment)} a month)`);
    loanBtn.addEventListener("click", () => go({ term, down }, loanBtn));
    fill(
      box,
      h("div.row", cash),
      h("p.loan-or", "or borrow it"),
      chips("Term", terms, term, (v) => (term = v), (v) => `${v} months`),
      downs ? chips("Down payment", downs, down, (v) => (down = v), (v) => (v ? money(v) : "$0")) : null,
      h(
        "dl.loan-numbers",
        h("div", h("dt", "Monthly payment"), h("dd", money(q.payment))),
        h("div", h("dt", "APR"), h("dd", `${(q.apr * 100).toFixed(1)}%`)),
        h("div", h("dt", "Interest"), h("dd", money(q.totalInterest))),
        h("div.total", h("dt", "Total cost"), h("dd", money(q.total)))
      ),
      q.approved ? null : h("p.warn-text", "The lender will probably say no: the payment is too big for your income or your score is too low."),
      h("div.row", loanBtn)
    );
  }

  paint();
  return box;
}
