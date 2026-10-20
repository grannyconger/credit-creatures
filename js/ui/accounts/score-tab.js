// My Score (SPEC §11, §14, §15): a 300 to 850 gauge with Sparkle Points shown
// apart, the 5 factors with life-choice explainers, and a score history chart.
import { h, ageLabel, percent } from "../dom.js";
import { creditReport, FACTOR_LABELS } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { FACTOR_EXPLAINERS, SCORE_BANDS, bandFor } from "../../data/explainers.js";

const SVG = "http://www.w3.org/2000/svg";
const s = (tag, attrs = {}, ...kids) => {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...kids.filter((k) => k != null));
  return el;
};

export function scoreTab({ run }) {
  const life = run.life;
  const rep = creditReport(life);
  const sparkle = run.play.sparkle.total;
  return h("div.score-tab", gaugeBlock(life.score, sparkle, rep), factorList(rep.factors), historyChart(life));
}

function gaugeBlock(score, sparkle, rep) {
  const cap = CONFIG.pacing.sparkle;
  const sparkleLine = h(
    "p.sparkle-line",
    `✨ ${sparkle} Unicorn Sparkle Point${sparkle === 1 ? "" : "s"} `,
    h("small", `(classroom bonus for right answers, up to ${cap.perChapter} a chapter and ${cap.total} total. Real scores don't work this way.)`)
  );
  if (score == null) {
    const need = Math.max(0, CONFIG.score.minHistoryMonths - rep.reportedMonths);
    return h(
      "section.gauge-block",
      gauge(null),
      h("p.big-score", "No score yet"),
      h("p", need ? `You need ${need} more month${need === 1 ? "" : "s"} of reported credit history.` : "Your first score comes at the next End Month."),
      sparkleLine
    );
  }
  const band = bandFor(score);
  return h(
    "section.gauge-block",
    gauge(score),
    h("p.big-score", String(score), sparkle ? h("span.sparkle-add", ` + ${sparkle} ✨`) : null),
    h("p.band-label", `${band.label} (${band.min} to ${band.max})`),
    sparkleLine
  );
}

// Half-circle gauge. Each band is labeled by name below, never color alone.
function gauge(score) {
  const W = 300;
  const cx = 150;
  const cy = 150;
  const r = 120;
  const angle = (v) => Math.PI * (1 - (v - 300) / 550);
  const pt = (v, rr = r) => [cx + rr * Math.cos(angle(v)), cy - rr * Math.sin(angle(v))];
  const arc = (a, b) => {
    const [x1, y1] = pt(a);
    const [x2, y2] = pt(b);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const svg = s("svg", { viewBox: `0 0 ${W} 170`, class: "gauge", role: "img", "aria-label": score == null ? "Score gauge, no score yet" : `Score ${score} out of 850, ${bandFor(score).label}` });
  for (const b of SCORE_BANDS) {
    svg.append(s("path", { d: arc(b.min, Math.min(850, b.max + 1)), stroke: b.color, "stroke-width": 20, fill: "none", opacity: score == null || bandFor(score) === b ? 1 : 0.35 }));
  }
  if (score != null) {
    const [x, y] = pt(score, r);
    svg.append(s("circle", { cx: x, cy: y, r: 13, fill: "var(--panel)", stroke: "var(--ink)", "stroke-width": 4 }));
  }
  svg.append(s("text", { x: 22, y: 166, class: "gauge-end" }, "300"), s("text", { x: 278, y: 166, class: "gauge-end", "text-anchor": "end" }, "850"));
  return h(
    "div.gauge-wrap",
    svg,
    h(
      "ul.band-key",
      SCORE_BANDS.map((b) => h("li", { class: score != null && bandFor(score) === b ? "on" : "" }, h("span.design-dot", { style: { background: b.color } }), `${b.label} ${b.min}+`))
    )
  );
}

function strength(v) {
  if (v >= 0.85) return ["Strong", "good", "✓"];
  if (v >= 0.6) return ["Okay", "warn", "•"];
  return ["Weak", "bad", "✗"];
}

function detail(key, f) {
  switch (key) {
    case "payment":
      return `${percent(f.onTimePct)} of reports on time. ${f.lateEpisodes ? `${f.lateEpisodes} late episode${f.lateEpisodes === 1 ? "" : "s"}. ` : ""}${f.openCollections ? `${f.openCollections} open collection${f.openCollections === 1 ? "" : "s"}. ` : ""}Your longest record: ${Math.round(f.depthMonths)} months (full credit at ${CONFIG.score.historyDepth.fullMonths}).`;
    case "owed":
      return f.utilization == null ? "No card limits on your report yet." : `You use ${percent(f.utilization)} of your card limits. Your fullest card is at ${percent(f.maxCardUtil)}.${f.installmentRatio != null ? ` Loans: ${percent(f.installmentRatio)} of the original amount is left.` : ""}`;
    case "length":
      return f.oldestMonths ? `Oldest account: ${f.oldestMonths} months. Average: ${f.averageMonths} months.` : "No accounts on your report yet.";
    case "mix":
      return `${f.hasRevolving ? "✓" : "✗"} card  ${f.hasInstallment ? "✓" : "✗"} loan`;
    case "newCredit":
      return `${f.inquiries} hard inquir${f.inquiries === 1 ? "y" : "ies"} in the last 12 months. ${f.newAccounts} account${f.newAccounts === 1 ? "" : "s"} opened in the last 6 months.`;
    default:
      return "";
  }
}

function factorList(factors) {
  const weights = CONFIG.score.weights;
  return h(
    "section.factor-list",
    h("h2", "The 5 parts of your score"),
    Object.keys(weights).map((key, i) => {
      const f = factors[key];
      const x = FACTOR_EXPLAINERS[key];
      const [word, cls, mark] = strength(f.value);
      return h(
        "article.factor-row",
        { class: `f${i}` },
        h(
          "div.factor-row-head",
          h("span.factor-icon", { "aria-hidden": "true" }, x.icon),
          h("div", h("h3", FACTOR_LABELS[key]), h("small", `${Math.round(weights[key] * 100)}% of your score`)),
          h("span.strength", { class: cls }, `${mark} ${word}`)
        ),
        h("div.factor-meter", { role: "img", "aria-label": `${FACTOR_LABELS[key]}: ${Math.round(f.value * 100)} out of 100` }, h("span", { style: { width: `${Math.round(f.value * 100)}%` } })),
        h("p.factor-detail", detail(key, f)),
        h(
          "details",
          h("summary", "What moves this part?"),
          h("p", x.means),
          h("div.moves", h("div", h("strong", "▲ Goes up when..."), h("ul", x.up.map((t) => h("li", t)))), h("div", h("strong", "▼ Goes down when..."), h("ul", x.down.map((t) => h("li", t)))))
        )
      );
    })
  );
}

// Single series, so no legend: the heading names it. 2px line, faint grid,
// hover and focus tooltips, and a table view.
function historyChart(life) {
  const pts = life.scoreHistory.filter((p) => p.score != null);
  const wrap = h("section.history", h("h2", "Score history"));
  if (pts.length < 2) {
    wrap.append(h("p.muted", "Your chart starts after your first two scores."));
    return wrap;
  }
  const W = 640;
  const H = 240;
  const pad = { l: 44, r: 16, t: 12, b: 30 };
  const minM = pts[0].month;
  const maxM = pts.at(-1).month;
  const lo = Math.max(300, Math.floor((Math.min(...pts.map((p) => p.score)) - 30) / 50) * 50);
  const hi = Math.min(850, Math.ceil((Math.max(...pts.map((p) => p.score)) + 30) / 50) * 50);
  const x = (m) => pad.l + ((m - minM) / Math.max(1, maxM - minM)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "history-chart", role: "img", "aria-label": `Score history from ${pts[0].score} to ${pts.at(-1).score}` });
  for (let v = lo; v <= hi; v += 50) {
    svg.append(s("line", { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), class: "grid" }), s("text", { x: pad.l - 6, y: y(v) + 4, "text-anchor": "end", class: "axis" }, String(v)));
  }
  const ageAt = (m) => ageLabel(life.start.ageMonths + m);
  svg.append(
    s("text", { x: pad.l, y: H - 8, class: "axis" }, ageAt(minM)),
    s("text", { x: W - pad.r, y: H - 8, class: "axis", "text-anchor": "end" }, ageAt(maxM)),
    s("path", { d: pts.map((p, i) => `${i ? "L" : "M"} ${x(p.month)} ${y(p.score)}`).join(" "), class: "line" })
  );
  const tip = h("div.chart-tip", { role: "status", hidden: true });
  const last = pts.at(-1);
  svg.append(s("circle", { cx: x(last.month), cy: y(last.score), r: 5, class: "dot" }));
  for (const p of pts) {
    const hit = s("circle", { cx: x(p.month), cy: y(p.score), r: 12, class: "hit", tabindex: 0, "aria-label": `${ageAt(p.month)}: ${p.score}` });
    const show = () => {
      tip.hidden = false;
      tip.textContent = `${ageAt(p.month)}: ${p.score}`;
      tip.style.left = `${(x(p.month) / W) * 100}%`;
      tip.style.top = `${(y(p.score) / H) * 100}%`;
    };
    hit.addEventListener("mouseenter", show);
    hit.addEventListener("focus", show);
    hit.addEventListener("mouseleave", () => (tip.hidden = true));
    hit.addEventListener("blur", () => (tip.hidden = true));
    svg.append(hit);
  }
  wrap.append(
    h("div.chart-box", svg, tip),
    h(
      "details",
      h("summary", "Show as a table"),
      h("table.data-table", h("thead", h("tr", h("th", "Age"), h("th", "Score"))), h("tbody", pts.slice().reverse().map((p) => h("tr", h("td", ageAt(p.month)), h("td", String(p.score))))))
    )
  );
  return wrap;
}
