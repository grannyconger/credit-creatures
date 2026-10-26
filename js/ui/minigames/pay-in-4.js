// Pay in 4 (GAME-SPECS.md game 4): twelve weeks of items with a "4 easy
// payments" button. Each app shows only its own next payment. The Wallet (W)
// shows them all. The rules live in js/arcade/payin4.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { createRng } from "../../engine/index.js";
import * as P from "../../arcade/payin4.js";
import { BNPL_APPS } from "../../data/arcade/payin4.js";
import { cashTimeline, eventCard, keyHelp, simplified, timerRing } from "../arcade/components.js";
import { creatureSvg } from "../creature-art.js";
import { sfx } from "../arcade-sound.js";

// A drawn face for each mood, so the mood never rests on color alone.
const MOUTH = ["M8 17q4-5 8 0", "M8 16q4-2 8 0", "M8 15h8", "M8 14q4 3 8 0", "M7 13q5 6 10 0"];
const face = (m) => `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.3" fill="currentColor"/><circle cx="15" cy="10" r="1.3" fill="currentColor"/><path d="${MOUTH[m]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.payin4;
  const m = P.newShift(seed);
  const s = P.newState(m);
  let picking = null;
  let walletOpen = false;
  let tick = null;
  let weekEnd = 0;
  let paused = false;
  let blocking = 0;
  let over = false;
  const coached = new Set();

  const root = h("div.minigame.payin4");
  const apps = h("section.p4-apps", { "aria-label": "Your pay-later apps" });
  const stage = h("section.p4-stage");
  const side = h("section.p4-side");
  const overlay = h("div.p4-overlay");
  const ring = timed ? timerRing({ label: "Time left this week" }) : null;

  // ---------- Skill moment ----------
  function skillMoment() {
    const rng = createRng(`${seed}:skill`);
    const price = rng.int(10, 20) * 8;
    const part = price / 4;
    const box = h("div.p4-skill");
    const today = h("input", { type: "text", inputmode: "decimal", "aria-label": "Due today, in dollars", "data-autofocus": "" });
    const later = h("input", { type: "text", inputmode: "decimal", "aria-label": "Every 2 weeks after, in dollars" });
    const check = h("button", { type: "button" }, "Check");
    const go = () => {
      const a = Number(today.value.replace(/[$,\s]/g, ""));
      const b = Number(later.value.replace(/[$,\s]/g, ""));
      const right = Math.abs(a - part) < 0.01 && Math.abs(b - part) < 0.01;
      ctx.track("skillMoment", { game: "payin4", right });
      (right ? sfx.correct : sfx.error)();
      fill(box, h("p.mg-flash", { class: right ? "good" : "bad" }, icon(right ? "check" : "alert", { size: 18 }), right ? ` Right. $${price} divided by 4 is $${part}, today and three more times.` : ` It's $${part} today and $${part} every 2 weeks after. $${price} divided by 4.`), h("p", "From now on, every plan shows its payments for you."), h("button.big", { type: "button", "data-autofocus": "", onclick: begin }, "Start shopping"));
      box.querySelector("button").focus();
    };
    check.addEventListener("click", go);
    later.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), go()));
    today.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), later.focus()));
    fill(box, h("h4", "Before you shop"), h("p.p4-skill-q", `Sneakers cost $${price} with Pay in 4. How much is due today, and how much every 2 weeks after?`), h("div.p4-skill-row", h("label", "Today $", today), h("label", "Every 2 weeks $", later), check));
    fill(root, box);
    today.focus();
  }

  // ---------- The twelve weeks ----------
  function begin() {
    fill(root, h("div.p4-main", apps, stage, side), keyHelp(`1 cash, 2 Pay in 4 (then 1 or 2 for the app), 3 skip, W wallet, ${timed ? "P pause" : "Space next week"}.`), overlay);
    document.addEventListener("keydown", onKey);
    advance();
  }

  async function advance() {
    if (over) return;
    if (s.week >= P.WEEKS) return end();
    const happened = P.nextWeek(s);
    picking = null;
    for (const x of happened) {
      if (x.type === "fail") {
        sfx.error();
        ctx.echo(x.text);
        ctx.mistake({ type: "failedDraft", cost: x.fee, label: `Failed ${P.appName(x.plan.app)} draft`, quiet: true });
      } else if (x.type === "pay" && x.cut) ctx.echo(`Hours cut. This paycheck is only ${money(x.amount)}.`);
      else if (x.type === "gift") ctx.echo(`Birthday money! +${money(x.amount)}`, { kind: "good" });
    }
    const em = happened.find((x) => x.type === "emergency");
    if (em) await showEmergency(em.covered);
    weekEnd = Date.now() + cfg.weekMs;
    paint();
    if (training && !coached.has(0) && P.open(s).some((i) => i.apps.length)) {
      coached.add(0);
      await hold(ctx.coach(0, stage.querySelector(".p4-btn.split") || stage));
    }
    if (timed) {
      clearInterval(tick);
      tick = setInterval(() => {
        if (paused || blocking || over) return (weekEnd += 200);
        const left = (weekEnd - Date.now()) / 1000;
        ring.set(left, cfg.weekMs / 1000);
        if (left <= 0) {
          clearInterval(tick);
          advance();
        }
      }, 200);
    }
  }

  function hold(p) {
    blocking++;
    return p.finally(() => blocking--);
  }

  function showEmergency(covered) {
    const e = s.emergency;
    if (!covered) ctx.mistake({ type: "emergency", cost: e.short, label: "Emergency you couldn't cover" });
    return hold(
      new Promise((resolve) => {
        const ev = eventCard({
          title: `${e.title}: ${money(e.amount)}`,
          text: covered ? `${e.text} Your cash covered it.` : `${e.text} Your cash couldn't cover it. That hurts.`,
          tag: `Week ${s.week}`,
          choices: [{ label: "Got it" }],
          onPick: () => (fill(overlay), resolve()),
        });
        fill(overlay, ev);
        ev.querySelector("button").focus();
      })
    );
  }

  async function choose(how) {
    const it = P.open(s)[0];
    if (!it || blocking) return;
    if (how === "split") {
      const offered = P.appsOffered(s, it);
      if (!offered.length) return ctx.notice("No app will split this one.");
      if (s.cash < P.partOf(it.price)) return ctx.notice("Not enough cash for the first payment.");
      picking = it.id;
      paint();
      return;
    }
    const r = P.decide(s, it.id, how);
    if (!r.ok) {
      picking = null;
      ctx.notice(r.message);
      return paint();
    }
    if (how !== "skip") sfx.correct();
    ctx.track("p4Decide", { game: "payin4", week: s.week, how: how === "cash" || how === "skip" ? how : "split", price: it.price, vibes: it.vibes });
    picking = null;
    paint();
    if (training && how !== "skip" && how !== "cash" && !coached.has(1)) {
      coached.add(1);
      await hold(ctx.coach(1, apps));
      await hold(ctx.coach(2, side.querySelector(".p4-wallet-btn")));
    }
    if (!P.open(s).length && !timed) side.querySelector(".p4-next")?.focus();
  }

  function paint() {
    const it = P.open(s)[0];
    // The apps: each shows only its own next payment.
    fill(
      apps,
      h("h4", "Your apps"),
      BNPL_APPS.map((a) => {
        const next = s.plans
          .filter((p) => p.app === a.id)
          .flatMap((p) => p.payments.filter((x) => !x.paid))
          .sort((x, y) => x.week - y.week)[0];
        const locked = s.locked.includes(a.id);
        return h("div.p4-app", { class: `app-${a.id}${locked ? " locked" : ""}` }, h("span.p4-app-logo", a.name.charAt(0)), h("strong", a.name), locked ? h("small", icon("lock", { size: 14 }), " Locked you out") : next ? h("small", `Next: ${money(next.amount)} in week ${next.week}`) : h("small", "Nothing due"));
      }),
      simplified("fees and prices")
    );

    // The stage: the current item, or the end of the week.
    if (!it) {
      fill(stage, h("div.p4-done", h("p", icon("check", { size: 20 }), ` That's everything for week ${s.week}.`), timed ? h("p.muted", "The next week starts soon.") : h("p.muted", "Press Space or Next week.")));
    } else {
      const offered = P.appsOffered(s, it);
      const part = P.partOf(it.price);
      fill(
        stage,
        h(
          "article.p4-item",
          { class: it.flash ? "flash" : "" },
          it.flash ? h("span.p4-flash", icon("clock", { size: 14 }), " FLASH SALE: double Vibes") : null,
          h("small.p4-store", it.store),
          h("h3", it.name),
          h("div.p4-price", money(it.price)),
          h("div.p4-vibes", icon("star", { size: 18 }), ` ${it.vibes} Vibes`),
          offered.length ? h("p.p4-plan", `Or 4 payments of ${money(part)}, every 2 weeks.`) : it.apps.length ? h("p.p4-plan", icon("lock", { size: 14 }), " The apps that offer this one locked you out.") : h("p.p4-plan", "No Pay in 4 on items this small.")
        ),
        picking
          ? h(
              "div.p4-btns",
              offered.map((a, i) => h("button.p4-btn.split", { type: "button", onclick: () => choose(a) }, h("kbd", String(i + 1)), ` ${P.appName(a)}: ${money(part)} today`)),
              h("button.p4-btn.skip", { type: "button", onclick: () => ((picking = null), paint()) }, "Back")
            )
          : h(
              "div.p4-btns",
              h("button.p4-btn.cash", { type: "button", disabled: s.cash < it.price, onclick: () => choose("cash") }, h("kbd", "1"), " Cash ", money(it.price)),
              h("button.p4-btn.split", { type: "button", disabled: !offered.length || s.cash < part, onclick: () => choose("split") }, h("kbd", "2"), " Pay in 4"),
              h("button.p4-btn.skip", { type: "button", onclick: () => choose("skip") }, h("kbd", "3"), " Skip")
            )
      );
    }

    // The side: creature, mood, cash, week, wallet.
    fill(
      side,
      h("div.p4-creature", { html: ctx.creature ? creatureSvg(ctx.creature, { size: 96 }) : "" }),
      h("p.p4-mood", { html: face(s.mood) }, h("strong", ` ${P.MOODS[s.mood]}`)),
      h("div.p4-cash", h("small", "Cash"), h("strong", { class: s.cash < 0 ? "neg" : "" }, money(s.cash))),
      h("p.p4-week", `Week ${s.week} of ${P.WEEKS}`, ring),
      h("button.secondary.p4-wallet-btn", { type: "button", "aria-keyshortcuts": "W", "aria-expanded": String(walletOpen), onclick: toggleWallet }, icon("wallet", { size: 16 }), " Wallet (W)"),
      timed ? h("button.secondary", { type: "button", "aria-keyshortcuts": "P", onclick: () => ((paused = !paused), paint()) }, icon(paused ? "play" : "pause", { size: 16 }), paused ? " Resume" : " Pause") : h("button.big.p4-next", { type: "button", "aria-keyshortcuts": "Space", onclick: () => !blocking && advance() }, "Next week ", icon("next", { size: 16 }))
    );
    if (walletOpen) paintWallet();
  }

  function toggleWallet() {
    walletOpen = !walletOpen;
    ctx.track("p4Wallet", { game: "payin4", week: s.week, open: walletOpen });
    if (!walletOpen) fill(overlay);
    paint();
  }

  function paintWallet() {
    const tl = cashTimeline({ unit: "Week", title: "Cash after every payment you know about" });
    const weeks = P.draftsByWeek(s);
    const chips = [];
    weeks.forEach((w, i) => {
      const total = Object.values(w).reduce((a, b) => a + b, 0);
      if (total) chips.push({ at: i, kind: "bill", text: `Drafts ${money(total)}: ${Object.entries(w).map(([a, v]) => `${P.appName(a)} ${money(v)}`).join(", ")}` });
    });
    m.paydays.forEach((d) => chips.push({ at: d - 1, kind: "pay", text: `Paycheck about ${money(m.paycheck)}` }));
    tl.update({ balances: P.forecast(s), chips, today: s.week - 1, forecastFrom: s.week - 1 });
    const list = weeks
      .map((w, i) => ({ week: i + 1, w }))
      .filter((x) => x.week > s.week && Object.keys(x.w).length)
      .map((x) => h("li", h("strong", `Week ${x.week}: `), Object.entries(x.w).map(([a, v]) => h("span.p4-draft", { class: `app-${a}` }, `${P.appName(a)} ${money(v)}`))));
    fill(overlay, h("div.p4-wallet", { role: "dialog", "aria-label": "Your Wallet" }, h("div.p4-wallet-head", h("h4", icon("wallet", { size: 18 }), " Wallet: every payment coming"), h("button.secondary", { type: "button", onclick: toggleWallet }, "Close (W)")), tl, list.length ? h("ul.p4-drafts", list) : h("p", "No payments coming."), h("small", `Living costs of ${money(m.living)} come out every week.`)));
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    if (blocking) return;
    const k = e.key.toLowerCase();
    if (k === "w") return e.preventDefault(), toggleWallet();
    if (k === "p" && timed) return e.preventDefault(), (paused = !paused), paint();
    if (k === " " && !timed && !e.target.closest("button")) return e.preventDefault(), advance();
    const it = P.open(s)[0];
    if (!it) return;
    if (picking) {
      const offered = P.appsOffered(s, it);
      if (k === "1" || k === "2") return e.preventDefault(), offered[Number(k) - 1] && choose(offered[Number(k) - 1]);
      if (k === "escape" || k === "3") return e.preventDefault(), (picking = null), paint();
      return;
    }
    if (k === "1") return e.preventDefault(), choose("cash");
    if (k === "2") return e.preventDefault(), choose("split");
    if (k === "3") return e.preventDefault(), choose("skip");
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = P.score(s);
    if (sc.owed > 0) ctx.echo(`You still owe ${money(sc.owed)} in payments after week 12. That comes out of your ending cash.`);
    // The phantom debt chart: drafts each week, by app (pattern and name), against cash.
    const weeks = P.draftsByWeek(s);
    const heaviest = weeks.reduce((best, w, i) => {
      const t = Object.values(w).reduce((a, b) => a + b, 0);
      return t > best.t ? { i, t } : best;
    }, { i: -1, t: 0 });
    // One honest scale for drafts and cash, capped at 3 times the heaviest week.
    // Cash above the cap sits at the top with an arrow and its value.
    const maxDraft = Math.max(1, ...weeks.map((w) => Object.values(w).reduce((a, b) => a + b, 0)));
    const max = maxDraft * 3;
    const dotAt = (c) => Math.max(0, Math.min(110, Math.round((c / max) * 110))) + 18;
    const chart = h(
      "div.p4-phantom",
      h(
        "div.p4-bars",
        weeks.map((w, i) =>
          h(
            "div.p4-bar",
            { class: i === heaviest.i ? "heavy" : "", title: `Week ${i + 1}` },
            h(
              "div.p4-stack",
              Object.entries(w).map(([a, v]) => h("span", { class: `app-${a}`, style: `height: ${Math.max(4, Math.round((v / max) * 110))}px`, title: `${P.appName(a)} ${money(v)}` }))
            ),
            h("small", String(i + 1)),
            i === heaviest.i ? h("em", "Heaviest") : null,
            h("span.p4-cashdot", { class: (s.cashByWeek[i] ?? 0) > max ? "over" : (s.cashByWeek[i] ?? 0) < 0 ? "neg" : "", style: `bottom: ${dotAt(s.cashByWeek[i] ?? 0)}px`, title: `Cash ${money(s.cashByWeek[i] ?? 0)}` }),
            (s.cashByWeek[i] ?? 0) > max ? h("small.p4-over", `${money(Math.round(s.cashByWeek[i]))}`) : null
          )
        )
      ),
      h("div.p4-legend", BNPL_APPS.map((a) => h("span", h("i", { class: `app-${a.id}` }), a.name)), h("span", h("i.cashdot"), "Your cash that week")),
      heaviest.i >= 0 ? h("p", `Heaviest week: week ${heaviest.i + 1}, ${money(heaviest.t)} in drafts.`) : h("p", "No pay-later payments at all.")
    );
    const summary = h("ul.bd-reveal-list", h("li", icon("star", { size: 14 }), ` ${sc.vibes} Vibes from ${sc.bought} item${sc.bought === 1 ? "" : "s"}`), h("li", icon("coins", { size: 14 }), ` Ending cash ${money(sc.endCash)}`), h("li", icon(sc.fails ? "alert" : "check", { size: 14 }), ` ${sc.fails} failed draft${sc.fails === 1 ? "" : "s"}`), h("li", icon(sc.covered ? "check" : "alert", { size: 14 }), sc.covered ? " Emergency covered" : " Emergency not covered"));
    ctx.finish({
      score: sc.score,
      tie: Math.round(sc.endCash),
      sub: { vibes: sc.vibes, endCash: sc.endCash, fails: sc.fails, covered: sc.covered },
      perfect: !sc.fails && sc.covered,
      reveal: h("div", chart, summary),
      biggest: P.biggest(s),
      stats: { plans: s.plans.length, bought: sc.bought, wallet: undefined },
    });
  }

  if (training) begin();
  else skillMoment();
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
