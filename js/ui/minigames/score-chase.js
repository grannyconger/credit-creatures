// Score Chase (GAME-SPECS.md game 7): from no score to 700 in 18 months, one
// card at a time. The factor bars use the same names, weights and wording as My
// Score (FACTOR_LABELS, CONFIG.score.weights, FACTOR_EXPLAINERS). Rules live in
// js/arcade/scorechase.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { FACTOR_EXPLAINERS } from "../../data/explainers.js";
import * as S from "../../arcade/scorechase.js";
import { eventCard, keyHelp } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const FACTORS = Object.keys(CONFIG.score.weights);
const pct = (w) => `${Math.round(w * 100)}% of your score`;

// A half-circle gauge from 300 to 850 with a goal tick at 700. The number is
// always written out, so the needle is never the only signal.
function gauge(score, goal) {
  const ang = (v) => Math.PI * (1 - (v - 300) / 550);
  const pt = (v, r) => [100 + r * Math.cos(ang(v)), 100 - r * Math.sin(ang(v))];
  const [gx1, gy1] = pt(goal, 70);
  const [gx2, gy2] = pt(goal, 96);
  const needle = score ? pt(score, 74) : null;
  const arc = (from, to) => {
    const [x1, y1] = pt(from, 84);
    const [x2, y2] = pt(to, 84);
    return `M${x1} ${y1}A84 84 0 0 1 ${x2} ${y2}`;
  };
  return `<svg viewBox="0 0 200 112" aria-hidden="true" focusable="false"><path d="${arc(300, 850)}" class="sc-arc"/>${score ? `<path d="${arc(300, score)}" class="sc-arc-fill"/>` : ""}<path d="M${gx1} ${gy1}L${gx2} ${gy2}" class="sc-goal"/><text x="${gx2 + 2}" y="${gy2 - 2}" class="sc-goal-text">700</text>${needle ? `<path d="M100 100L${needle[0]} ${needle[1]}" class="sc-needle"/><circle cx="100" cy="100" r="5" class="sc-hub"/>` : ""}</svg>`;
}

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.scorechase;
  const s = S.newState(S.newShift(seed));
  let over = false;
  let logOpen = false;
  let card = null;
  let after = null;
  let lastChange = null;
  const coached = new Set();

  const root = h("div.minigame.scorechase");
  const top = h("section.sc-top");
  const stage = h("section.sc-stage");
  const bars = h("section.sc-bars", { "aria-label": "What your score is made of" });
  const log = h("section.sc-log", { "aria-live": "polite" });

  // ---------- Skill moment ----------
  function skillMoment() {
    const box = h("div.sc-skill");
    const answer = (k) => {
      const right = k === "payment";
      ctx.track("skillMoment", { game: "scorechase", right, pick: k });
      (right ? sfx.correct : sfx.error)();
      fill(box, h("p.mg-flash", { class: right ? "good" : "bad" }, icon(right ? "check" : "alert", { size: 18 }), right ? " Right. Paying on time is about 35 percent of your score." : ` It's ${S.FACTOR_LABELS.payment}, about 35 percent. Paying on time matters most.`), h("p", "From here on, the bars show you how much each part counts."), h("button.big", { type: "button", "data-autofocus": "", onclick: begin }, "Start the chase"));
      box.querySelector("button").focus();
    };
    fill(box, h("h4", "Before you start"), h("p.sc-skill-q", "Which part counts the most in your credit score?"), h("div.sc-skill-opts", FACTORS.map((k, i) => h("button", { type: "button", onclick: () => answer(k) }, h("kbd", String(i + 1)), ` ${S.FACTOR_LABELS[k]}`))));
    const onKey = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 5 && box.querySelector(".sc-skill-opts")) {
        e.preventDefault();
        document.removeEventListener("keydown", onKey);
        answer(FACTORS[n - 1]);
      }
    };
    document.addEventListener("keydown", onKey);
    root.stop = () => document.removeEventListener("keydown", onKey);
    fill(root, box);
    box.querySelector("button").focus();
  }

  function begin() {
    fill(root, h("div.sc-grid", top, h("div.sc-mid", stage, log), bars), keyHelp(`${"Left and Right"} choose (1 to 4 when there are more), Enter continues, L opens the log${timed ? "" : ""}.`));
    document.addEventListener("keydown", onKey);
    paintSide();
    showCard();
  }

  // ---------- Cards ----------
  async function showCard() {
    if (over) return;
    card = S.current(s);
    after = null;
    if (!card) return monthEnd();
    const ev = eventCard({
      title: card.title,
      text: card.text,
      tag: s.month === 0 ? "Setup" : `Month ${s.month} of ${S.MONTHS}`,
      choices: card.choices.map((c) => ({ label: c.label })),
      timer: timed ? cfg.cardSeconds : null,
      onPick: (i) => picked(i),
    });
    fill(stage, ev);
    ev.querySelector("button")?.focus();
    if (training && !coached.has(0) && s.month >= 1) {
      coached.add(0);
      const resume = ev.pause();
      await ctx.coach(0, ev);
      resume();
    }
  }

  function picked(i) {
    const out = S.choose(s, i);
    if (!out) return;
    ctx.track("scChoice", { game: "scorechase", month: s.month, card: out.card.id, choice: i, timedOut: out.timedOut });
    for (const m of out.mistakes) ctx.mistake(m);
    if (out.timedOut) ctx.notice("Time ran out, so the do-nothing choice happened.");
    after = out;
    paintSide();
    const cont = h("button.big", { type: "button", "data-autofocus": "", onclick: next }, "Continue");
    fill(
      stage,
      h(
        "div.sc-outcome",
        h("p.sc-out-card", out.card.title),
        h("p.sc-out-choice", icon(out.timedOut ? "clock" : "check", { size: 18 }), out.choice ? ` You chose: ${out.choice.label}` : " Time ran out"),
        h("p.sc-out-text", out.text || ""),
        out.extra ? h("p.sc-out-extra", out.extra) : null,
        s.pending.size ? h("p.sc-out-pending", icon("clock", { size: 16 }), " This reports to your score next month.") : null,
        cont
      )
    );
    cont.focus();
    if (timed) setTimeout(() => after === out && next(), 2600);
  }

  function next() {
    if (over || !after) return;
    after = null;
    showCard();
  }

  async function monthEnd() {
    const r = S.endMonth(s);
    for (const m of r.mistakes) ctx.mistake(m);
    for (const n of r.notes) ctx.echo(n);
    const change = S.startMonth(s);
    lastChange = change;
    if (change) {
      // Every change is in the log. Big ones also get an echo tag.
      if (Math.abs(change.delta) >= 15 || !change.delta) ctx.echo(change.text, { kind: change.delta >= 0 ? "good" : "bad" });
      change.delta > 0 ? sfx.correct() : change.delta < 0 ? sfx.error() : null;
    }
    paintSide();
    if (training && s.month >= 2 && !coached.has(1)) {
      coached.add(1);
      await ctx.coach(1, bars);
      await ctx.coach(2, bars.querySelector(".sc-pending") || log);
    }
    if (s.done) return end();
    showCard();
  }

  // ---------- The side panels ----------
  function paintSide() {
    const res = s.result;
    const sc = res?.score ?? null;
    const util = S.utilization(s);
    fill(
      top,
      h("div.sc-gauge", { html: gauge(sc, cfg.goal) }),
      h(
        "div.sc-num",
        sc ? h("strong", { class: sc >= cfg.goal ? "goal" : "" }, String(sc), sc >= cfg.goal ? h("small", " Goal reached") : null) : h("strong.none", "No score yet"),
        sc ? null : h("small", "No score is not the same as a bad score."),
        lastChange?.delta ? h("small.sc-delta", { class: lastChange.delta < 0 ? "down" : "up" }, icon(lastChange.delta < 0 ? "down" : "up", { size: 14 }), ` ${lastChange.delta > 0 ? "+" : ""}${lastChange.delta} ${S.FACTOR_LABELS[lastChange.factor]}`) : null
      ),
      h("div.sc-meta", h("span", icon("calendar", { size: 16 }), s.month === 0 ? " Setup" : ` Month ${s.month} of ${S.MONTHS}`), h("span", icon("flag", { size: 16 }), " Goal: 700"), h("span", icon("coins", { size: 16 }), ` Cash ${money(s.cash)}`))
    );
    const pend = new Set(s.pending);
    fill(
      bars,
      h("h4", "Your score is made of"),
      FACTORS.map((k) => {
        const f = res?.factors?.[k];
        const v = f ? Math.round(f.value * 100) : 0;
        const tip = FACTOR_EXPLAINERS[k]?.means || "";
        return h(
          "div.sc-factor",
          { tabindex: "0", title: tip, "aria-label": `${S.FACTOR_LABELS[k]}, ${pct(CONFIG.score.weights[k])}: ${f ? `${v} out of 100` : "not reported yet"}` },
          h("div.sc-f-head", h("strong", S.FACTOR_LABELS[k]), h("small", pct(CONFIG.score.weights[k]))),
          h("div.factor-meter.sc-meter", { role: "img", "aria-hidden": "true" }, h("span", { style: { width: `${v}%` } })),
          h("div.sc-f-foot", f ? h("small", `${v} of 100`) : h("small", "Not reported yet"), k === "owed" && util != null ? h("small.sc-util", `Utilization ${Math.round(util * 100)}%`) : null, pend.has(k) ? h("span.sc-pending", icon("clock", { size: 12 }), " Pending: reports next month") : null)
        );
      })
    );
    const lines = s.log.slice().reverse();
    fill(
      log,
      h("div.sc-log-head", h("h4", "Change log"), h("button.secondary", { type: "button", "aria-keyshortcuts": "L", "aria-expanded": String(logOpen), onclick: () => ((logOpen = !logOpen), paintSide()) }, logOpen ? "Hide (L)" : "Show all (L)")),
      lines.length ? h("ol.sc-log-list", { class: logOpen ? "open" : "" }, (logOpen ? lines : lines.slice(0, 2)).map((l) => h("li", { class: l.delta < 0 ? "down" : "up" }, icon(l.delta < 0 ? "down" : "up", { size: 14 }), ` Month ${l.month}: ${l.text}`))) : h("p.muted", "Changes show up here a month after you make them.")
    );
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    if (e.key.toLowerCase() === "l") return e.preventDefault(), (logOpen = !logOpen), paintSide();
    if (e.key === "Enter" && after && !e.target.closest("button")) return e.preventDefault(), next();
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    document.removeEventListener("keydown", onKey);
    const sc = S.score(s);
    const pts = s.history.filter((p) => p.score != null);
    const W = 560;
    const H = 150;
    const x = (m) => 30 + ((W - 40) * m) / S.MONTHS;
    const y = (v) => 10 + (H - 30) * (1 - (v - 300) / 550);
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p.month)} ${y(p.score)}`).join("");
    const dots = s.log.filter((l) => l.delta && pts.some((p) => p.month === l.month)).map((l) => {
      const p = pts.find((q) => q.month === l.month);
      return `<g><title>${l.text.replace(/[<&]/g, "")}</title><circle cx="${x(p.month)}" cy="${y(p.score)}" r="5" class="sc-dot ${l.delta < 0 ? "down" : "up"}"/></g>`;
    });
    const chart = h("div.sc-chart", {
      html: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Your score from month ${pts[0]?.month ?? 0} to ${S.MONTHS}"><path d="M30 ${y(700)}H${W - 10}" class="sc-goal-line"/><text x="${W - 12}" y="${y(700) - 4}" text-anchor="end" class="sc-axis">700 goal</text><text x="26" y="${y(850) + 8}" text-anchor="end" class="sc-axis">850</text><text x="26" y="${y(300)}" text-anchor="end" class="sc-axis">300</text><path d="${path}" class="sc-line"/>${dots.join("")}${Array.from({ length: S.MONTHS }, (_, i) => `<text x="${x(i + 1)}" y="${H - 4}" text-anchor="middle" class="sc-axis">${i + 1}</text>`).join("")}</svg>`,
    });
    const big = s.log.filter((l) => l.delta).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 4);
    ctx.finish({
      score: sc.metric,
      tie: Math.round(sc.cash),
      payScore: sc.points,
      sub: { final: sc.final, cash: sc.cash, lates: sc.lates, collections: sc.collections, reached: sc.reached },
      perfect: sc.reached && !sc.lates && !sc.collections,
      reveal: h("div", chart, h("ul.sc-big", big.map((l) => h("li", { class: l.delta < 0 ? "down" : "up" }, icon(l.delta < 0 ? "down" : "up", { size: 14 }), ` Month ${l.month}: ${l.text}`))), h("p", sc.final == null ? "You never got a score. No history, no score." : sc.reached ? `You reached ${sc.final}. The apartment is yours.` : `You reached ${sc.final}. The apartment wanted 700.`)),
      biggest: S.biggest(s),
      stats: { final: sc.final, lates: sc.lates },
    });
  }

  if (training) begin();
  else skillMoment();
  const stopAll = root.stop;
  root.stop = () => {
    over = true;
    stopAll?.();
    document.removeEventListener("keydown", onKey);
    stage.querySelector(".arc-event")?.stop?.();
  };
  return root;
}
