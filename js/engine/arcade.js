// Two actions for the Arcade's safe and risky modes and for going broke
// (GAME-SPECS.md 2.3 and 2.4). Both return { life, ok, message } and never
// change the life they are given.
import { CONFIG } from "../data/config.js";
import { copyLife, logAction } from "./life.js";
import { amountOwed } from "./accounts.js";
import { money, dollars } from "./util.js";

// The one IOU account a creature can owe the Arcade. Not on the credit report.
export const IOU_TYPE = "arcadeIou";

export function arcadeIou(life) {
  return life.accounts.find((a) => a.type === IOU_TYPE && a.owner === "self" && a.status === "open") || null;
}

// A risky mode mistake costs real money. Checking pays what it can (never below
// $0) and the rest goes onto the Arcade IOU, which opens the first time.
export function arcadeCharge(life, amount, label = "Arcade mistake") {
  const cost = money(amount);
  if (!(cost > 0)) return { life, ok: false, message: "Nothing to charge." };
  const next = copyLife(life);
  const fromChecking = money(Math.max(0, Math.min(cost, next.checking)));
  const toDebt = money(cost - fromChecking);
  next.checking = money(next.checking - fromChecking);
  if (toDebt > 0) {
    let a = next.accounts.find((x) => x.type === IOU_TYPE && x.owner === "self" && x.status === "open");
    if (!a) {
      a = {
        id: "a" + next.nextId++,
        type: IOU_TYPE,
        kind: "iou",
        owner: "self",
        reported: false,
        name: CONFIG.arcade.iouName,
        icon: "🎟️",
        openedMonth: next.month,
        closedMonth: null,
        status: "open",
        balance: 0,
        original: 0,
        paidThisCycle: 0,
        pastDue: 0,
        monthsDelinquent: 0,
        history: [],
      };
      next.accounts.push(a);
    }
    a.balance = money(a.balance + toDebt);
    a.original = money(a.original + toDebt);
  }
  logAction(next, "arcadeCharge", [cost, label]);
  const message = toDebt > 0 ? `${label}: ${dollars(cost)}. Checking paid ${dollars(fromChecking)} and ${dollars(toDebt)} went on your Arcade IOU.` : `${label}: ${dollars(cost)} from checking.`;
  return { life: next, ok: true, fromChecking, toDebt, message };
}

// Going broke (teacher decision 2026-10-25): every debt is wiped, checking is set
// to a fresh amount, and the credit report gets a fresh-start mark that hurts the
// score for a long while, like a bankruptcy. Savings, bills and history stay.
export function freshStart(life, checking = CONFIG.broke.resetChecking) {
  const next = copyLife(life);
  let wiped = 0;
  for (const a of next.accounts) {
    if (a.owner === "authorized") continue;
    const owed = amountOwed(a);
    const live = a.status === "open" || a.status === "collections";
    if (!live || owed <= 0) continue;
    wiped = money(wiped + owed);
    a.balance = 0;
    if (a.pending) a.pending = [];
    if (a.installments) a.installments = a.installments.map((i) => ({ ...i, paid: i.amount }));
    a.due = null;
    a.autopay = null;
    a.pastDue = 0;
    a.monthsDelinquent = 0;
    a.status = "discharged";
    a.closedMonth = next.month;
  }
  next.checking = money(checking);
  next.marks = [...(life.marks || []), { type: "freshStart", month: next.month, wiped }];
  logAction(next, "freshStart", [checking]);
  return { life: next, ok: true, wiped, message: `A fresh start. ${dollars(wiped)} of debt was wiped and checking is ${dollars(checking)}. It's on your credit report now.` };
}
