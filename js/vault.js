// The Vault's layout, as plain data you can test (teacher request 2026-10-25). Tabs are
// named after the jobs a person does with money: see where you stand, pay bills, save
// for goals, manage debt, build credit, protect yourself and read your letters. A tab
// appears only when it has something real to show, and a tab with several views
// (Build Credit) has sub-tabs. The screen is js/ui/screens/accounts.js.
import { hasFeature } from "./progression.js";
import { amountOwed, upcomingPayments, dollars } from "./engine/index.js";
import { unreadCount } from "./play.js";

// What counts as insurance, shared accounts and collections on the student's life.
const isInsurance = (b) => /insurance/i.test(b.name);
export function protectContent(life) {
  return {
    insurance: life.bills.filter(isInsurance),
    authorized: life.accounts.filter((a) => a.owner === "authorized" && a.status === "open"),
    cosigned: life.accounts.filter((a) => a.owner === "cosigned" && a.status === "open"),
  };
}
export const hasProtectContent = (life) => {
  const p = protectContent(life);
  return p.insurance.length + p.authorized.length + p.cosigned.length > 0;
};

// key, label, icon, a test for whether it shows, and its sub-tabs (same shape).
const feature = (name) => (play, life) => hasFeature(play, name, life);
export const VAULT_LAYOUT = [
  { key: "overview", label: "Overview", icon: "vault", show: feature("vault") },
  { key: "paybills", label: "Pay Bills", icon: "receipt", show: feature("bills") },
  { key: "save", label: "Save for Goals", icon: "piggy", show: feature("savings") },
  { key: "debt", label: "Manage Debt", icon: "chart", show: (play, life) => hasFeature(play, "loans", life) || hasFeature(play, "bnpl", life) },
  {
    key: "credit",
    label: "Build Credit",
    icon: "card",
    subs: [
      { key: "cards", label: "Cards", show: feature("card") },
      { key: "statements", label: "Statements", show: feature("statements") },
      { key: "score", label: "My Score", show: feature("score") },
      { key: "report", label: "My Report", show: feature("report") },
    ],
  },
  { key: "protect", label: "Protect Yourself", icon: "lock", show: (play, life) => hasProtectContent(life) },
  { key: "messages", label: "Messages", icon: "inbox", show: feature("inbox") },
];

// The tabs a student can see right now, each with the sub-tabs they can see.
export function vaultTabs(play, life) {
  const out = [];
  for (const t of VAULT_LAYOUT) {
    if (t.subs) {
      const subs = t.subs.filter((s) => s.show(play, life));
      if (subs.length) out.push({ key: t.key, label: t.label, icon: t.icon, subs });
    } else if (t.show(play, life)) out.push({ key: t.key, label: t.label, icon: t.icon, subs: [] });
  }
  return out;
}

// The Vault used to have Wallet, Statements and Inbox tabs, and the Hall of Records had
// My Score and My Report. Old links and lessons name those, so they still land somewhere.
const LEGACY = {
  wallet: { tab: "paybills" },
  statements: { tab: "credit", sub: "statements" },
  inbox: { tab: "messages" },
  score: { tab: "credit", sub: "score" },
  report: { tab: "credit", sub: "report" },
  desk: { tab: "overview" },
};
export const legacyVaultTab = (key) => LEGACY[key] || { tab: key };

// Moves a choice of tab and sub-tab onto what is showing. Falls back to the first tab.
export function pickVaultTab(tabs, tab, sub) {
  const t = tabs.find((x) => x.key === tab) || tabs[0];
  const s = t.subs.length ? t.subs.find((x) => x.key === sub) || t.subs[0] : null;
  return { tab: t.key, sub: s ? s.key : null };
}

// Things that need the student's attention, each with the tab that fixes it.
export function vaultAttention(play, life) {
  const out = [];
  const up = upcomingPayments(life);
  for (const c of up.cardsDue) out.push({ id: `due-${c.accountId}`, tone: "warn", text: `Your ${c.name} payment is due. Pay it before End Month.`, tab: "paybills" });
  if (up.short > 0) out.push({ id: "short", tone: "warn", text: `Checking is ${dollars(up.short)} short for what comes out at End Month.`, tab: "paybills" });
  for (const a of life.accounts.filter((x) => x.status === "collections" && amountOwed(x) > 0)) out.push({ id: `col-${a.id}`, tone: "warn", text: `${a.name} is in collections. Paying it hurts your credit less.`, tab: "debt" });
  for (const a of life.accounts.filter((x) => x.owner === "cosigned" && x.status === "open" && x.pastDue > 0)) out.push({ id: `cos-${a.id}`, tone: "warn", text: `A cosigned loan is behind, and it shows on your report.`, tab: "protect" });
  const unread = unreadCount(play);
  if (unread) out.push({ id: "mail", tone: "calm", text: `${unread} new letter${unread === 1 ? "" : "s"} waiting.`, tab: "messages" });
  return out;
}

// The money that moved in and out of checking lately, newest first, in plain words.
// amount is signed: money in is positive. Only actions that touch checking are shown.
export function checkingActivity(life, max = 12) {
  const name = (id) => life.accounts.find((a) => a.id === id)?.name || "an account";
  const rows = [];
  for (const e of life.log) {
    const [a, b] = e.args || [];
    if (e.action === "earn") rows.push({ month: e.month, label: `Paid for ${b || "work"}`, amount: a });
    else if (e.action === "receiveCash") rows.push({ month: e.month, label: `Money from ${b || "someone"}`, amount: a });
    else if (e.action === "debitPurchase") rows.push({ month: e.month, label: `Bought ${b || "something"}`, amount: -a });
    else if (e.action === "moveToSavings") rows.push({ month: e.month, label: "Moved to savings", amount: -a });
    else if (e.action === "moveToChecking") rows.push({ month: e.month, label: "Moved from savings", amount: a });
    else if (e.action === "pay") rows.push({ month: e.month, label: `Paid ${name(a)}`, amount: -b });
  }
  return rows.slice(-max).reverse();
}

// Net worth by month, from the month records that kept it (js/play.js finishMonth).
export function netWorthSeries(play) {
  const records = [...(play.history?.at(-1)?.records || []), ...(play.active?.records || [])];
  return records.filter((r) => r.netWorth != null).map((r) => ({ month: r.month, netWorth: r.netWorth }));
}
