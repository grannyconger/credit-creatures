// A work shift: sort items into what you OWN (asset) or OWE (liability).
// The tutorial and the month loop both use it until Ledger Sort (Phase 6).
import { h, add, fill, money } from "./dom.js";
import { createRng } from "../engine/index.js";
import { SHIFT_ITEMS } from "../data/onboarding.js";

// payFor(correct) gives the pay. onCollect({ correct, total, pay, seconds }) runs on "Collect".
export function shiftGame({ seed, count, payFor, onCollect, track }) {
  const rng = createRng(seed);
  const pool = SHIFT_ITEMS.slice();
  const items = [];
  while (items.length < count && pool.length) items.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
  const started = Date.now();
  let k = 0;
  let correct = 0;
  const area = h("div.shift");

  function ask() {
    fill(area);
    if (k === items.length) return finish();
    const it = items[k];
    const choose = (answer) => {
      const right = answer === it.answer;
      if (right) correct++;
      track("shiftAnswer", { n: k, right });
      fill(
        area,
        h("p.shift-count", `Item ${k + 1} of ${items.length}`),
        h("div.shift-item", it.item),
        h("div.callout", { class: right ? "good" : "bad" }, h("strong", right ? "Right! " : "Not quite. "), it.why),
        h("div.row.center", h("button.big", { type: "button", onclick: () => (k++, ask()) }, k + 1 < items.length ? "Next item" : "See my pay"))
      );
      area.querySelector("button.big").focus();
    };
    add(
      area,
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
    const pay = payFor(correct);
    const btn = h("button.big", { type: "button" }, `Collect ${money(pay)}`);
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      await onCollect({ correct, total: items.length, pay, seconds: Math.round((Date.now() - started) / 1000) });
    });
    add(
      area,
      h("div.big-number", money(pay)),
      h("p.center", `You sorted ${correct} of ${items.length} right. Your pay goes straight into your checking account.`),
      h("div.row.center", btn)
    );
  }

  ask();
  return area;
}
