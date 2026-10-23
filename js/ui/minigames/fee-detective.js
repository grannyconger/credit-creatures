// Fee Detective (docs/MINIGAMES.md, doc idea 6). A made-up monthly bank
// statement. Mark every fee, then say how to avoid each fee you found. One
// statement a shift has no fees at all, so students can't assume there is
// always one. Tapping a line again takes the mark off, so nothing counts
// twice. Every line has words as well as marks (never color alone).
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { sfx } from "../arcade-sound.js";
import { createRng } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { FEE_KINDS, FEE_DECOYS, MONTH_NAMES } from "../../data/minigames.js";
import { feeStatements, avoidOptions, fmt } from "./gen.js";

export function feeDetective({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.fees;
  const rng = createRng(seed);
  const started = Date.now();
  const { statements } = feeStatements(rng, { statements: cfg.statements, lines: cfg.lines, noFeePoints: cfg.noFeePoints });
  let k = 0;
  let right = 0;
  let wrong = 0;
  let over = false;
  let clockTimer = 0;
  const misses = [];
  const marked = new Set();

  const clock = h("span.mg-clock", { role: "timer" });
  const score = h("span.mg-score");
  const prompt = h("p.fd-prompt", { "aria-live": "polite" });
  const stage = h("div.fd-stage");
  const flash = h("p.mg-flash", { role: "status" });
  const el = h("div.minigame.fees", h("div.mg-bar", clock, score), prompt, stage, flash);
  const paintScore = () => (score.textContent = `✓ ${right}   ✗ ${wrong}`);
  const dateOf = (st, line) => `${MONTH_NAMES[st.month].slice(0, 3)} ${line.day}`;
  const cur = () => statements[k];
  const say = (ok, text) => {
    flash.className = `mg-flash ${ok ? "good" : "bad"}`;
    flash.textContent = `${ok ? "✓" : "✗"} ${text}`;
  };

  // ---- 1. Hunt: mark the fees. ----
  function hunt() {
    const st = cur();
    marked.clear();
    flash.textContent = "";
    flash.className = "mg-flash";
    fill(prompt, h("strong", `Statement ${k + 1} of ${statements.length}: mark every fee. If there are none, say so.`));
    const submit = h("button.big", { type: "button", "data-sound": "none", onclick: () => grade() });
    const label = () => (submit.textContent = marked.size ? `That's all the fees (${marked.size} marked)` : "No fees this month");
    const rows = st.lines.map((l) =>
      h(
        "li",
        h(
          "button.fd-line",
          {
            type: "button",
            "data-sound": "none",
            "data-boop": "none",
            "aria-pressed": "false",
            onclick: (e) => {
              const b = e.currentTarget;
              if (marked.has(l.id)) marked.delete(l.id);
              else marked.add(l.id);
              const on = marked.has(l.id);
              b.setAttribute("aria-pressed", String(on));
              b.querySelector(".fd-mark").textContent = on ? "Marked as a fee" : "";
              label();
            },
          },
          h("span.fd-date", dateOf(st, l)),
          h("span.fd-text", l.text),
          h("span.fd-mark", { "aria-hidden": "false" }),
          h("span.fd-amount", fmt(l.amount))
        )
      )
    );
    label();
    fill(stage, statement(st, rows), h("div.row.fd-actions", submit));
    paintScore();
  }

  const statement = (st, rows) =>
    h(
      "div.fd-paper",
      { role: "group", "aria-label": `Bank statement for ${MONTH_NAMES[st.month]}` },
      h("div.fd-head", h("strong", "The Vault, Coinhaven"), h("span", `Checking statement for ${MONTH_NAMES[st.month]}`)),
      h("ul.fd-lines", rows)
    );

  // ---- 2. Grade the marks and show what each line was. ----
  function grade() {
    if (over) return;
    const st = cur();
    const found = [];
    let missed = 0;
    let falseTaps = 0;
    const rows = st.lines.map((l) => {
      const on = marked.has(l.id);
      const isFee = l.type === "fee";
      let tag = "";
      let cls = "";
      if (isFee && on) {
        right++;
        found.push(l);
        tag = "Fee found";
        cls = "fd-right";
      } else if (isFee) {
        wrong++;
        missed++;
        tag = "Missed fee";
        cls = "fd-missed";
        misses.push(`${FEE_KINDS[l.fee].line}: ${FEE_KINDS[l.fee].why}`);
      } else if (on) {
        wrong++;
        falseTaps++;
        tag = "Not a fee";
        cls = "fd-wrong";
        misses.push(`${l.text}: ${FEE_DECOYS[l.type]}`);
      }
      return h(
        "li",
        h(
          "div.fd-line.fd-shown",
          { class: cls },
          h("span.fd-date", dateOf(st, l)),
          h("span.fd-text", l.text, !isFee && on ? h("small", FEE_DECOYS[l.type]) : isFee ? h("small", FEE_KINDS[l.fee].why) : null),
          h("span.fd-mark", tag ? [icon(cls === "fd-right" ? "check" : "alert", { size: 14 }), ` ${tag}`] : ""),
          h("span.fd-amount", fmt(l.amount))
        )
      );
    });
    if (st.noFee && !marked.size) {
      right += cfg.noFeePoints;
      say(true, "Right. This statement has no fees, and that's a good month.");
    } else if (st.noFee) say(false, "This statement has no fees. Interest earned, deposits, transfers and purchases aren't fees.");
    else say(!missed && !falseTaps, missed || falseTaps ? `You found ${found.length} of ${st.fees.length} fees${falseTaps ? ` and marked ${falseTaps} that aren't fees` : ""}.` : "You found every fee.");
    (missed || falseTaps ? sfx.error : sfx.correct)();
    track("feeGrade", { statement: k, fees: st.fees.length, found: found.length, missed, falseTaps });
    paintScore();
    fill(stage, statement(st, rows), h("div.row.fd-actions", h("button.big", { type: "button", "data-autofocus": "", onclick: () => avoid(found.map((l) => l.fee), 0) }, found.length ? "Next: how to avoid them" : "Next")));
    stage.querySelector("button")?.focus();
  }

  // ---- 3. One "how could you avoid it?" question per fee found. ----
  function avoid(list, i) {
    if (over) return;
    if (i >= list.length) return summary();
    const fee = list[i];
    const opts = avoidOptions(rng, fee);
    flash.textContent = "";
    flash.className = "mg-flash";
    fill(prompt, h("small", `Fee ${i + 1} of ${list.length}`), h("strong", `How could you avoid the ${FEE_KINDS[fee].line.toLowerCase()}?`));
    const buttons = opts.map((o) =>
      h("button.fd-option", { type: "button", "data-sound": "none", onclick: () => pick(o, buttons) }, o.text)
    );
    function pick(o, all) {
      all.forEach((b) => (b.disabled = true));
      all[opts.indexOf(o)].classList.add(o.right ? "fd-right" : "fd-wrong");
      all[opts.findIndex((x) => x.right)].classList.add("fd-answer");
      if (o.right) right++;
      else {
        wrong++;
        misses.push(`Avoiding the ${FEE_KINDS[fee].line.toLowerCase()}: ${FEE_KINDS[fee].avoid}`);
      }
      (o.right ? sfx.correct : sfx.error)();
      say(o.right, o.right ? FEE_KINDS[fee].avoid : `Better: ${FEE_KINDS[fee].avoid}`);
      track("feeAvoid", { fee, right: o.right });
      paintScore();
      const go = h("button.big", { type: "button", "data-autofocus": "", onclick: () => avoid(list, i + 1) }, "Next");
      stage.append(h("div.row.fd-actions", go));
      go.focus();
    }
    fill(stage, h("div.fd-options", buttons));
    buttons[0].focus();
  }

  // ---- 4. What the fees cost. ----
  function summary() {
    const st = cur();
    flash.textContent = "";
    flash.className = "mg-flash";
    const per = st.total;
    fill(
      stage,
      h(
        "div.fd-summary",
        per
          ? [h("h3", "What these fees cost"), h("p", `These fees cost you ${fmt(per)} a month. That's ${fmt(per * 12)} a year.`), h("p.muted", "Every dollar here is money you could keep.")]
          : [h("h3", "A fee-free month"), h("p", "Nothing to pay in fees. Keeping it that way saves real money over a year.")]
      ),
      h("div.row.fd-actions", h("button.big", { type: "button", "data-autofocus": "", onclick: next }, k + 1 >= statements.length ? "Finish the shift" : "Next statement"))
    );
    stage.querySelector("button")?.focus();
  }

  function next() {
    k++;
    if (k >= statements.length) return end();
    hunt();
  }

  function end() {
    if (over) return;
    over = true;
    clearInterval(clockTimer);
    sfx.questComplete();
    track("minigameEnd", { game: "fees", right, wrong, timed });
    onDone({ right, wrong, total: right + wrong, seconds: Math.round((Date.now() - started) / 1000), misses });
  }

  if (timed) {
    const endAt = Date.now() + cfg.seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      clock.textContent = `⏱️ ${left}s`;
      if (left <= 0 && !over) end();
    };
    tick();
    clockTimer = setInterval(tick, 250);
  } else clock.textContent = `No timer: ${statements.length} statements`;
  hunt();
  el.stop = () => {
    over = true;
    clearInterval(clockTimer);
  };
  return el;
}
