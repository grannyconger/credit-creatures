// Overview: where you stand. Assets, Liabilities and Net Worth (teacher request
// 2026-10-25), what each is made of in color, a net worth line by month, and what
// needs attention, with a button to the tab that fixes it.
import { h, money } from "../dom.js";
import { icon } from "../icons.js";
import { balanceSheet } from "../../engine/index.js";
import { vehicleValue } from "../../data/garage.js";
import { vaultAttention, netWorthSeries } from "../../vault.js";
import { segmentBar, SEGMENT_LABELS } from "../segment-bar.js";

const signedMoney = (n) => (n < 0 ? `−${money(Math.abs(n))}` : money(n));

// A small line of net worth by month. Plain numbers become SVG, so nothing typed is in it.
function trendLine(series) {
  if (series.length < 2) return h("p.muted.tight", "Your net worth line starts after your second End Month.");
  const w = 260;
  const ht = 70;
  const vals = series.map((p) => p.netWorth);
  const lo = Math.min(...vals, 0);
  const hi = Math.max(...vals, 1);
  const x = (i) => 6 + (i * (w - 12)) / (series.length - 1);
  const y = (v) => ht - 6 - ((v - lo) / (hi - lo || 1)) * (ht - 12);
  const pts = series.map((p, i) => `${x(i).toFixed(1)},${y(p.netWorth).toFixed(1)}`).join(" ");
  const zero = y(0).toFixed(1);
  const first = vals[0];
  const last = vals.at(-1);
  const svg = `<svg viewBox="0 0 ${w} ${ht}" width="100%" height="${ht}" role="img" aria-label="Net worth over ${series.length} months, from ${first} to ${last} dollars" focusable="false"><line x1="0" x2="${w}" y1="${zero}" y2="${zero}" class="nw-zero"/><polyline points="${pts}" class="nw-line"/>${series.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.netWorth).toFixed(1)}" r="3" class="nw-dot"/>`).join("")}</svg>`;
  const delta = last - first;
  return h("div.nw-trend", h("div", { html: svg }), h("p.muted.tight", `${delta >= 0 ? "Up" : "Down"} ${money(Math.abs(delta))} over ${series.length} months.`));
}

// A card for one side of the sheet: the total, a bar of its parts, and each part with its amount.
function sideCard(title, side, scale) {
  const parts = side.parts.filter((p) => p.amount > 0);
  return h(
    "article.nw-card",
    { class: title.toLowerCase() },
    h("small.nw-title", title),
    h("strong.nw-total", money(side.total)),
    segmentBar({ parts: side.parts, label: title, scale }),
    parts.length
      ? h(
          "ul.nw-parts",
          parts.map((p) => h("li", h("span.seg-swatch", { class: `seg-${p.key}`, "aria-hidden": "true" }), h("span", SEGMENT_LABELS[p.key]), h("strong", money(p.amount))))
        )
      : h("p.muted.tight", title === "Assets" ? "Nothing yet." : "Nothing owed. Nice.")
  );
}

export function overviewTab({ run, openTab }) {
  const { life, play } = run;
  const sheet = balanceSheet(life, { vehicleValue: vehicleValue(play) });
  const scale = Math.max(1, sheet.assets.total, sheet.liabilities.total);
  const attention = vaultAttention(play, life);
  const net = sheet.netWorth;
  return h(
    "section.vault-overview",
    h("h2", "Where you stand"),
    h("p.muted", "Assets are what you have. Liabilities are what you owe. Your net worth is the difference."),
    h(
      "div.nw-grid",
      sideCard("Assets", sheet.assets, scale),
      sideCard("Liabilities", sheet.liabilities, scale),
      h(
        "article.nw-card.networth",
        { class: net < 0 ? "negative" : "" },
        h("small.nw-title", "Net worth"),
        h("strong.nw-total", signedMoney(net)),
        h("p.muted.tight", "Assets minus liabilities."),
        trendLine(netWorthSeries(play)),
        sheet.cosigned > 0 ? h("p.nw-cosigned", icon("alert", { size: 16 }), ` You cosigned ${money(sheet.cosigned)}. If your friend stops paying, you could owe it.`) : null
      )
    ),
    h(
      "section.nw-attention",
      h("h3", "Needs your attention"),
      attention.length
        ? h(
            "ul",
            attention.map((a) => h("li", { class: a.tone }, icon(a.tone === "warn" ? "alert" : "inbox", { size: 18 }), h("span", a.text), h("button.secondary", { type: "button", onclick: () => openTab(a.tab) }, "Go there")))
          )
        : h("p.callout.good", icon("check", { size: 16 }), " All caught up. Nothing needs you right now.")
    )
  );
}
