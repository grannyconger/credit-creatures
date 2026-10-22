// My Credit Report (SPEC §14): accounts, the 24-month on-time grid, inquiries,
// collections, authorized-user accounts, and "helping you / hurting you".
import { icon } from "../icons.js";
import { h, money, ageLabel } from "../dom.js";
import { creditReport, FACTOR_LABELS } from "../../engine/index.js";

const OWNER = { self: "Yours", authorized: "Authorized user (parent's card)", cosigned: "You cosigned" };
const STATUS = { open: "Open", closed: "Closed", paid: "Paid off", collections: "In collections", collectionPaid: "Collection paid" };
const CODE_TEXT = { OK: "On time", 30: "30 days late", 60: "60 days late", 90: "90 days late", CO: "Collections" };

export function reportTab({ run }) {
  const life = run.life;
  const r = creditReport(life);
  const ageAt = (m) => ageLabel(life.start.ageMonths + m);
  const soft = life.inquiries.filter((q) => !q.hard);
  return h(
    "div.report-tab",
    h("p.muted", "This is what lenders see. Debit cards, checking, savings and BNPL plans that are paid on time are not on it."),
    r.helping.length || r.hurting.length
      ? h(
          "div.best-worst",
          h("div.callout.good", h("p", h("strong", "👍 Helping you")), r.helping.length ? h("ul", r.helping.map((x) => h("li", `${FACTOR_LABELS[x.factor]}: ${x.text}`))) : h("p", "Nothing stands out yet.")),
          h("div.callout.bad", h("p", h("strong", "👎 Hurting you")), r.hurting.length ? h("ul", r.hurting.map((x) => h("li", `${FACTOR_LABELS[x.factor]}: ${x.text}`))) : h("p", "Nothing major. Nice."))
        )
      : null,
    h("h2", "Accounts"),
    r.tradelines.length
      ? r.tradelines.map((t) => {
          const row = r.grid.find((g) => g.id === t.id);
          return h(
            "article.tradeline",
            h("div.bill-head", h("strong", t.name), h("span.badge", OWNER[t.owner] || t.owner)),
            h(
              "dl.bill-facts",
              fact("Status", STATUS[t.status] || t.status),
              fact("Opened", t.ageMonths > 0 ? `${t.ageMonths} months ago` : "This month"),
              fact("Balance", money(t.balance)),
              t.limit ? fact("Limit", money(t.limit)) : t.original ? fact("Original loan", money(t.original)) : null
            ),
            h(
              "div.grid-row.report-grid",
              { role: "img", "aria-label": `Last 24 months: ${summary(row.cells)}` },
              row.cells.map((c) => h("span.grid-cell", { class: c ? `code-${c}` : "empty", title: c ? CODE_TEXT[c] : "Not reported" }, c === "OK" ? "✓" : c || ""))
            )
          );
        })
      : h("p.callout", "No accounts yet. Your report is empty, so you have no score."),
    h("p.grid-key", h("span.grid-cell.code-OK", "✓"), " on time ", h("span.grid-cell.code-30", "30"), " days late ", h("span.grid-cell.code-CO", "CO"), " collections ", h("span.grid-cell.empty"), " not reported. Oldest month on the left."),
    h("h2", "Inquiries"),
    r.inquiries.length
      ? h("ul.plain", r.inquiries.slice().reverse().map((q) => h("li", `🔎 Hard: ${q.source}, at ${ageAt(q.month)}. ${q.counts ? "Counts against your score for now." : "Too old to count anymore."}`)))
      : h("p.muted", "No hard inquiries."),
    soft.length ? h("ul.plain", soft.map((q) => h("li", `👀 Soft: ${q.source}, at ${ageAt(q.month)}. Never changes your score.`))) : null,
    h("h2", "Collections"),
    r.collections.length ? h("ul.plain", r.collections.map((c) => h("li", icon("alert", { size: 16 }), ` ${c.name}: ${money(c.balance)} ${c.paid ? "(paid)" : "unpaid"}`))) : h("p.muted", "None. Keep it that way.")
  );
}

function summary(cells) {
  const reported = cells.filter(Boolean);
  if (!reported.length) return "nothing reported";
  const late = reported.filter((c) => c !== "OK").length;
  return `${reported.length} months reported, ${late} late`;
}

function fact(label, value) {
  return h("div", h("dt", label), h("dd", value));
}
