// "What would each choice do?" for the side-by-side view after a life card
// (teacher request 2026-10-23). Pure: it runs every choice on the same starting
// life and copies are never changed, so nothing here touches the real game.
import { amountOwed, isOpen } from "./accounts.js";
import { resolveChoice, paymentOptions, utilization } from "./cards.js";
import { buildReport } from "./report.js";
import { computeScore } from "./score.js";

// The numbers a student can compare. score is null until there's enough history.
export function lifeMetrics(life) {
  const owed = life.accounts.filter((a) => a.owner === "self" && (isOpen(a) || a.status === "collections")).reduce((sum, a) => sum + amountOwed(a), 0);
  let score = null;
  try {
    score = computeScore(buildReport(life)).score;
  } catch {
    score = null;
  }
  return { checking: life.checking, savings: life.savings, owed, util: utilization(life), score };
}

// The way to pay a choice's cost: the one the student used, else the first that works.
function methodFor(life, choice, preferred, allowed) {
  if (!choice.cost) return null;
  if (preferred) return preferred;
  const opts = paymentOptions(life, { amount: choice.cost.amount, methods: (choice.cost.methods || ["debit", "card", "bnpl"]).filter((m) => !allowed || allowed.includes(m)) });
  return opts.find((o) => o.ok)?.method || null;
}

// For each choice: { key, label, ok, denied, metrics, delta, effect }. delta is
// the change from now. A choice that can't be done (no money, locked) is ok: false.
export function compareChoices(life, choices, { chosenKey = null, chosenMethod = null, allowed = null } = {}) {
  const now = lifeMetrics(life);
  return choices.map((c) => {
    const out = { key: c.key, label: c.label, chosen: c.key === chosenKey, effect: c.effect || null, quiz: Boolean(c.quiz) };
    if (c.disabled) return { ...out, ok: false, reason: c.disabled };
    const method = methodFor(life, c, c.key === chosenKey ? chosenMethod : null, allowed);
    if (c.cost && !method) return { ...out, ok: false, reason: "You can't pay for this one right now." };
    const r = resolveChoice(life, c, method);
    if (!r.ok) return { ...out, ok: false, reason: r.message };
    const metrics = lifeMetrics(r.life);
    const delta = {};
    for (const k of Object.keys(now)) delta[k] = now[k] == null || metrics[k] == null ? null : metrics[k] - now[k];
    return { ...out, ok: true, denied: Boolean(r.denied), metrics, delta };
  });
}

// True when no choice changes any number, so a side-by-side would show nothing.
export function allSame(rows) {
  const ok = rows.filter((r) => r.ok);
  if (ok.length < 2) return true;
  return ok.every((r) => Object.values(r.delta).every((d) => !d) && !r.effect) ;
}

// A column for "where you started", used when a card has only one choice to compare.
export function startRow(life) {
  const metrics = lifeMetrics(life);
  const delta = Object.fromEntries(Object.keys(metrics).map((k) => [k, metrics[k] == null ? null : 0]));
  return { key: "_start", label: "Where you started", chosen: false, start: true, ok: true, denied: false, metrics, delta, effect: null, quiz: false };
}
