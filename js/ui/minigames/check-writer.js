// Check Writer (SPEC §17): write a check from a bill, sign the front, then
// endorse the back of your paycheck and deposit it. The person writing a
// check signs the front. Whoever cashes a check signs the back.
import { h, fill, money } from "../dom.js";
import { createRng } from "../../engine/index.js";
import { CHECK_BILLS, CHECK_FIELDS, MONTH_NAMES, amountInWords, gradeCheck } from "../../data/minigames.js";
import { fullName } from "../../data/creatures.js";
import { askSignature, signatureMark } from "../signature-pad.js";

// payFor(right) gives the paycheck amount. onDone({ right, wrong, total, seconds, misses, depositOnly }).
export function checkWriter({ seed, life, creature, payFor, onDone, track }) {
  const rng = createRng(seed);
  const bill = CHECK_BILLS[Math.floor(rng.next() * CHECK_BILLS.length)];
  const cents = 2000 + Math.floor(rng.next() * 23000);
  const dateText = `${MONTH_NAMES[(life.ageMonths + 3) % 12]} ${1 + Math.floor(rng.next() * 28)}`;
  const name = fullName(creature) || creature.name;
  const started = Date.now();
  const el = h("div.minigame.checks");
  let frontSig = null;

  const input = (id, label, attrs = {}) => h("input", { id, type: "text", autocomplete: "off", spellcheck: "false", "aria-label": label, ...attrs });
  const f = {
    date: input("ck-date", "Date", { placeholder: "Date" }),
    payee: input("ck-payee", "Pay to the order of"),
    amount: input("ck-amount", "Amount in numbers", { inputmode: "decimal", placeholder: "0.00" }),
    words: input("ck-words", "Amount in words"),
    memo: input("ck-memo", "Memo"),
  };
  const sigSlot = h("button.sig-slot", { type: "button", onclick: () => sign() }, "Tap to sign");

  async function sign() {
    const sig = await askSignature({ name, title: "Sign the front of your check" });
    if (!sig) return;
    frontSig = sig;
    track("checkSigned", { side: "front", kind: sig.kind });
    fill(sigSlot, signatureMark(sig));
  }

  function partOne() {
    fill(
      el,
      h("p.step-label", "Part 1 of 2: pay a bill by check"),
      h(
        "div.bill-paper",
        h("p", h("strong", `🧾 ${bill.payee}`)),
        h("p", `For: ${bill.what}`),
        h("p", "Amount due: ", h("strong", money(cents / 100))),
        h("p", `Write this in the memo: ${bill.memo}`),
        h("p", `Today's date: ${dateText}`)
      ),
      h(
        "div.check",
        { role: "group", "aria-label": "Your check" },
        h("div.check-top", h("span.check-owner", name, h("br"), "Market Village"), h("label.check-date", "Date ", f.date), h("span.check-no", "No. 101")),
        h("div.check-line", h("label", { for: "ck-payee" }, "Pay to the order of"), f.payee, h("span.check-dollar", "$"), f.amount),
        h("div.check-line", f.words, h("span", "Dollars")),
        h("div.check-bank", "🏦 The Gilded Vault"),
        h("div.check-bottom", h("label", { for: "ck-memo" }, "Memo"), f.memo, h("div.check-sign", sigSlot, h("small", "Signature")))
      ),
      h("p.note.tight", "Tip: write the cents as a fraction, like ", h("strong", "Forty-seven and 25/100"), "."),
      h("div.row", h("button.big", { type: "button", onclick: send }, "Send the check"))
    );
  }

  let grade = null;
  function send() {
    grade = gradeCheck(
      { date: f.date.value, payee: f.payee.value, amount: f.amount.value, words: f.words.value, memo: f.memo.value, signed: Boolean(frontSig) },
      { dateText, payee: bill.payee, cents, memo: bill.memo }
    );
    const right = Object.values(grade).filter(Boolean).length;
    track("checkGraded", { right, ...Object.fromEntries(Object.entries(grade).map(([k, v]) => [k, v ? 1 : 0])) });
    const correct = { date: dateText, payee: bill.payee, amount: (cents / 100).toFixed(2), words: amountInWords(cents), memo: bill.memo, signature: "Your signature on the front" };
    fill(
      el,
      h("p.step-label", "Part 1 of 2: how did your check do?"),
      h(
        "ul.check-grade",
        Object.entries(CHECK_FIELDS).map(([k, label]) =>
          h("li", { class: grade[k] ? "good" : "bad" }, h("strong", `${grade[k] ? "✓" : "✗"} ${label}`), grade[k] ? null : h("span", ` should be: ${correct[k]}`))
        )
      ),
      grade.signature ? null : h("p.callout.bad", "A check without a signature can't be cashed. The person who writes the check signs the FRONT."),
      h("p", `${right} of 6 right. Your boss pays you `, h("strong", money(payFor(right))), " for this shift, by paycheck."),
      h("div.row", h("button.big", { type: "button", onclick: () => partTwo(right) }, "Get my paycheck"))
    );
  }

  function partTwo(right) {
    const pay = payFor(right);
    let backSig = null;
    const depositOnly = h("input", { type: "checkbox", id: "ck-dep" });
    const depositBtn = h("button.big", { type: "button", disabled: true }, "Deposit to checking");
    const backSlot = h("button.sig-slot", { type: "button" }, "Tap to endorse");
    backSlot.addEventListener("click", async () => {
      const sig = await askSignature({ name, title: "Endorse the back of your paycheck" });
      if (!sig) return;
      backSig = sig;
      track("checkSigned", { side: "back", kind: sig.kind });
      fill(backSlot, signatureMark(sig));
      depositBtn.disabled = false;
    });
    depositBtn.addEventListener("click", () => {
      depositBtn.disabled = true;
      const misses = Object.entries(grade)
        .filter(([, ok]) => !ok)
        .map(([k]) => `${CHECK_FIELDS[k]} was not right.`);
      onDone({ right, wrong: 6 - right, total: 6, seconds: Math.round((Date.now() - started) / 1000), misses, depositOnly: depositOnly.checked });
    });
    const front = h(
      "div.check.paycheck",
      h("div.check-top", h("span.check-owner", "The Gilded Vault", h("br"), "Payroll"), h("span.check-date", dateText), h("span.check-no", "No. 5520")),
      h("div.check-line", h("span", "Pay to the order of"), h("strong.check-fill", name), h("span.check-dollar", "$"), h("strong.check-fill", pay.toFixed(2))),
      h("div.check-line", h("strong.check-fill", amountInWords(Math.round(pay * 100))), h("span", "Dollars")),
      h("div.check-bottom", h("span", "Memo: work shift"), h("div.check-sign", h("span.sig-script", "Bookkeeper Bramblewood"), h("small", "Signature")))
    );
    const back = h(
      "div.check.check-back",
      h("p.endorse-title", "ENDORSE HERE"),
      backSlot,
      h("label.dep-only", depositOnly, " Also write ", h("em", "For deposit only"), " (safer: the check can only go into your account)"),
      h("p.endorse-note", "DO NOT WRITE BELOW THIS LINE")
    );
    fill(
      el,
      h("p.step-label", "Part 2 of 2: deposit your paycheck"),
      h("p", "This check is made out to you. To deposit it, flip it over and sign the BACK. That's called endorsing it."),
      front,
      h("div.row", h("button.secondary", { type: "button", onclick: () => fill(el, h("p.step-label", "Part 2 of 2: endorse the back"), back, h("div.row", depositBtn)) }, "Flip it over"))
    );
  }

  partOne();
  return el;
}
