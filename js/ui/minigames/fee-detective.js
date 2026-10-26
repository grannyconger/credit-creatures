// Fee Detective (GAME-SPECS.md game 12, upgraded 2026-10-25): three cases. Mark
// every fee, pick how to handle each one (3 calls a shift), pick the habit that
// stops it. Case 3 is Case 1's client a month later. Keeps the noir skin.
// Rules: js/arcade/fees.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { createRng } from "../../engine/index.js";
import * as D from "../../arcade/fees.js";
import { FD_DOC_NAMES } from "../../data/arcade/fees.js";
import { docInspector, keyHelp, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const ACTION_LABEL = { refund: "Ask for a refund", dispute: "Dispute", cancel: "Cancel", accept: "Accept" };

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const difficulty = training ? "easy" : settings.difficulty;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.fees;
  const deal = D.newShift(seed, difficulty);
  const s = D.newState(deal);
  const rng = createRng(`${seed}:habits`);
  const root = h("div.minigame.fees2");
  const bar = h("div.mg-bar");
  const body = h("div.fd2-body");
  const ring = timed ? timerRing({ label: "Time left this shift" }) : null;
  let showYearly = false;
  let over = false;
  let tick = null;
  let keys = null;
  fill(root, bar, body);

  function paintBar(text) {
    window.scrollTo(0, 0);
    fill(bar, h("span.mg-clock", text), ring, h("span.fd2-calls", { role: "img", "aria-label": `${s.calls} calls left` }, Array.from({ length: cfg.calls }, (_, i) => h("span", { class: i < s.calls ? "on" : "off" }, icon("phone", { size: 16 }))), ` ${s.calls} call${s.calls === 1 ? "" : "s"} left`));
  }

  // ---------- The skill moment (Case 1 only) ----------
  function skill() {
    paintBar("Before Case 1");
    const input = h("input", { type: "text", inputmode: "decimal", "aria-label": "Yearly cost, in dollars" });
    const go = () => {
      const ok = Number(input.value.replace(/[$,\s]/g, "")) === 144;
      ctx.track("skillMoment", { game: "fees", right: ok });
      (ok ? sfx.correct : sfx.error)();
      showYearly = true;
      fill(body, h("div.fd2-skill", h("p.mg-flash", { class: ok ? "good" : "bad" }, icon(ok ? "check" : "alert", { size: 18 }), ok ? " Right. $12 times 12 months is $144." : " It's $144. $12 times 12 months."), h("p", "From now on, every fee you mark shows what it costs in a year."), h("button.big", { type: "button", "data-autofocus": "", onclick: () => openCase() }, "Open Case 1")));
      body.querySelector("button").focus();
    };
    input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), go()));
    fill(body, h("div.fd2-skill", h("h4", "Every fee has a yearly cost"), h("p", "This $12 fee every month costs how much a year?"), h("div.row", h("span", "$"), input, h("button", { type: "button", onclick: go }, "Check"))));
    input.focus();
  }

  // ---------- A case ----------
  function openCase() {
    const k = D.currentCase(s);
    if (!k) return end();
    paintBar(`Case ${k.n} of 3: ${k.client}`);
    const marks = new Set();
    let callbackAdded = false;
    const lines = () => k.lines.map((l) => ({ id: l.id, cells: [l.credit ? "+" : "-", l.text, money(l.amount)] }));
    const yearly = h("div.fd2-yearly", { "aria-live": "polite" });
    const paintYearly = () => {
      if (!showYearly) return;
      const sel = k.lines.filter((l) => marks.has(l.id));
      fill(yearly, sel.length ? sel.map((l) => h("p", icon("calendar", { size: 14 }), ` ${l.text}: ${money(l.amount)} a month is ${money(l.amount * 12)} a year`)) : null);
    };
    let doc = docInspector({ title: `${FD_DOC_NAMES[k.doc]}: ${k.client}`, className: "fd2-doc", lines: lines(), marked: marks, onToggle: paintYearly });
    const docSlot = h("div.fd2-docslot", doc);
    const done = () => {
      // The client calls back mid-case with one more line (once a shift, Case 2).
      if (k.n === 2 && !callbackAdded && !s.callbackShown) {
        callbackAdded = true;
        s.callbackShown = true;
        k.lines.push({ ...deal.callback });
        doc = docInspector({ title: `${FD_DOC_NAMES[k.doc]}: ${k.client}`, className: "fd2-doc", lines: lines(), marked: marks, onToggle: paintYearly });
        fill(docSlot, doc);
        doc.querySelector(`[data-id="c2cb"]`)?.classList.add("fd2-new");
        ctx.echo(`${k.client} called back: "Wait, can you check one more line?"`, { kind: "safe" });
        return;
      }
      if (!marks.size) return ctx.notice("Mark the fees first, or press No fees.");
      actionsStep(k, marks);
    };
    const none = () => {
      if (k.n === 2 && !callbackAdded && !s.callbackShown) return done();
      finishCase(k, { marks: new Set(), noFeeClaim: true, actions: {}, habit: null });
    };
    fill(body, h("p.fd2-intro", icon("plaza", { size: 18 }), ` ${k.client}: "${k.intro}"`), h("div.fd2-case", docSlot, h("div.fd2-side", yearly, h("button.big", { type: "button", "aria-keyshortcuts": "F", onclick: done }, h("kbd", "F"), " That's all the fees"), h("button.secondary", { type: "button", "aria-keyshortcuts": "N", onclick: none }, h("kbd", "N"), " No fees on this one"))), keyHelp("Tab moves between lines, Enter or Space marks one. F when you're done, N if there are no fees."));
    keys = (e) => {
      const k2 = e.key.toLowerCase();
      if (k2 === "f") (e.preventDefault(), done());
      else if (k2 === "n") (e.preventDefault(), none());
    };
    if (training && k.n === 1) ctx.coach(0, doc);
    doc.querySelector("button")?.focus();
  }

  function actionsStep(k, marks) {
    const actions = {};
    const marked = k.lines.filter((l) => marks.has(l.id));
    const callsUsed = () => Object.values(actions).filter((a) => D.COSTS_CALL.has(a)).length;
    const rows = h("div.fd2-actions");
    // The habit question only shows when the case's main fee was marked, so it
    // never hints at a fee the student missed.
    const habits = k.lines.some((l) => l.fee && l.kind === k.key && marks.has(l.id)) ? D.habitOptions(k, rng) : [];
    let habit = null;
    const paint = () => {
      const left = s.calls - callsUsed();
      fill(
        rows,
        marked.map((l, i) =>
          h(
            "div.fd2-row",
            { tabindex: "0", "data-i": String(i) },
            h("span.fd2-line", h("strong", l.text), h("small", ` ${money(l.amount)}`)),
            h(
              "span.fd2-btns",
              D.ACTIONS.map((a, j) => {
                const needCall = D.COSTS_CALL.has(a) && actions[l.id] !== a;
                const off = needCall && left <= 0;
                return h("button.fd2-act", { type: "button", "aria-pressed": String(actions[l.id] === a), disabled: off, title: off ? "No calls left" : D.COSTS_CALL.has(a) ? "Costs a call" : "", onclick: () => ((actions[l.id] = a), paint(), rows.querySelector(`[data-i="${i}"]`)?.focus()) }, h("kbd", String(j + 1)), ` ${ACTION_LABEL[a]}`, off ? h("small", " No calls left") : D.COSTS_CALL.has(a) ? h("small", " (1 call)") : null);
              })
            )
          )
        ),
        habits.length ? h("fieldset.fd2-habit", h("legend", "Pick the habit that stops the main fee next time"), habits.map((t) => h("button.fd2-hab", { type: "button", "aria-pressed": String(habit === t), onclick: () => ((habit = t), paint()) }, t))) : null,
        h("button.big", { type: "button", onclick: () => finishCase(k, { marks, noFeeClaim: false, actions, habit }) }, "Close the case")
      );
      paintBar(`Case ${k.n} of 3: ${k.client}`);
      const callsSpan = bar.querySelector(".fd2-calls");
      if (callsSpan) callsSpan.lastChild.textContent = ` ${left} call${left === 1 ? "" : "s"} left`;
    };
    fill(body, h("p.fd2-intro", "For each line you marked, pick what to do. Refunds and disputes cost a call."), rows);
    paint();
    keys = (e) => {
      const n = Number(e.key);
      if (n < 1 || n > 4) return;
      const row = e.target.closest?.(".fd2-row") || rows.querySelector(".fd2-row");
      if (!row) return;
      const l = marked[Number(row.dataset.i)];
      const a = D.ACTIONS[n - 1];
      if (D.COSTS_CALL.has(a) && actions[l.id] !== a && s.calls - callsUsed() <= 0) return ctx.notice("No calls left.");
      e.preventDefault();
      actions[l.id] = a;
      paint();
      rows.querySelector(`[data-i="${row.dataset.i}"]`)?.focus();
    };
    if (training && k.n === 1) ctx.coach(1, rows).then(() => (habits.length ? ctx.coach(2, rows.querySelector(".fd2-habit") || rows) : null));
    rows.querySelector(".fd2-row")?.focus();
  }

  function finishCase(k, pick) {
    const r = D.closeCase(s, k, pick);
    ctx.track("feeCase", { n: k.n, found: r.found, fees: r.fees, wrong: r.wrongMarks, recovered: r.recovered, habit: r.habitRight, noFee: k.noFee });
    (r.missed.length || r.wrongMarks ? sfx.error : sfx.correct)();
    for (const m of r.missed) ctx.mistake({ type: "missedFee", cost: m.amount, label: `Missed fee: ${m.label}` });
    for (const l of r.disputedLegit) ctx.mistake({ type: "disputeLegit", cost: cfg.disputeLegitCost, label: `Disputed a real charge: ${l.text}` });
    const verdicts = {};
    for (const l of k.lines) {
      const o = r.outcomes.find((x) => x.line.id === l.id);
      if (l.fee && !o) verdicts[l.id] = { kind: "wrong", text: `Missed: ${l.label}` };
      else if (o) verdicts[l.id] = { kind: o.right && l.fee ? "right" : "wrong", text: `${l.fee ? l.label : "Not a fee"}. ${ACTION_LABEL[o.action]}: ${o.note}${o.got ? ` +${money(o.got)}` : ""}` };
    }
    const doc = docInspector({ title: `${FD_DOC_NAMES[k.doc]}: ${k.client}`, className: "fd2-doc", lines: k.lines.map((l) => ({ id: l.id, cells: [l.credit ? "+" : "-", l.text, money(l.amount)] })), marked: new Set(r.outcomes.map((o) => o.line.id)), locked: true });
    doc.grade(verdicts);
    const next = h("button.big", { type: "button", "data-autofocus": "", onclick: () => openCase() }, D.currentCase(s) ? `Next: Case ${s.at + 1}` : "Close the file");
    fill(body, h("p.fd2-intro", h("strong", `Case ${k.n}: ${r.score} points. `), k.noFee ? (r.noFeeRight ? "No fees, and you said so. Nice." : "This one had no fees.") : `${r.found} of ${r.fees} fees found, ${money(r.recovered)} recovered.${k.key ? r.habitRight ? " Good habit pick." : " That habit won't stop it." : ""}`), doc, next);
    if (k.n === 1 && !r.habitRight && r.key) ctx.echo(`${k.client} didn't fix the habit. That fee will be back next month.`);
    keys = (e) => e.key === "Enter" && !e.target.closest("button") && (e.preventDefault(), next.click());
    next.focus();
    const n3 = D.currentCase(s);
    if (n3?.n === 3 && n3.lines.some((l) => l.repeat)) {
      const back = n3.lines.find((l) => l.repeat);
      setTimeout(() => ctx.echo(`${back.label} is back, ${money(back.amount)}. From: Case 1, no habit fix.`), 50);
    }
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = D.score(s);
    const reveal = h("div.fd2-reveal", h("p.fd2-big", `These fees would have cost your clients ${money(sc.monthly)} a month, ${money(sc.yearly)} a year. You saved ${money(sc.saved)}.`), h("ul.bd-reveal-list", s.results.map((r) => h("li", icon(r.missed.length ? "alert" : "check", { size: 14 }), ` Case ${r.n}, ${r.client}: ${r.found} of ${r.fees} fees, ${money(r.recovered)} back`))));
    ctx.finish({ score: sc.score, tie: sc.wrongMarks, tier: difficulty, sub: { saved: sc.saved, missed: sc.missed, wrongMarks: sc.wrongMarks, habits: sc.habits }, perfect: !sc.missed && !sc.wrongMarks, reveal, biggest: D.biggest(s), stats: { difficulty } });
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
        // Time's up: any open cases close with nothing marked.
        while (D.currentCase(s)) D.closeCase(s, D.currentCase(s), { marks: new Set(), noFeeClaim: false, actions: {}, habit: null });
        end();
      }
    }, 250);
  }
  if (training) {
    showYearly = true;
    openCase();
  } else skill();
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
