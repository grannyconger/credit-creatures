// Town Hall: one game month's news and decisions, then End Month (SPEC §8).
// Work happens at the Arcade and bills at the Vault, so the month is
// shared across the kingdom and always comes back to the hub.
// In practice mode the same screen runs on a throwaway copy.
import { payMethods } from "../../progression.js";
import { firstVisitLesson } from "../guide.js";
import { react } from "../motion/gaze.js";
import { h, add, fill, money, ageLabel, toast } from "../dom.js";
import { ownCards, upcomingPayments, utilization, amountOwed } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { chapterInfo } from "../../data/chapters.js";
import * as P from "../../play.js";
import { decisionCard } from "../decision-card.js";
import { moneyChips } from "../wallet.js";
import { placeHeader } from "../place-header.js";
import { icon } from "../icons.js";
import { sfx } from "../sound.js";
import { createRng } from "../../engine/index.js";
import { factorOptions, factorChoice } from "../../data/practice-questions.js";
import { monthSummary } from "../month-summary.js";
import { ASKS } from "../../data/card-asks.js";
import { HINTS } from "../../data/card-hints.js";
import { vehicleValue } from "../../data/garage.js";
import { sealSvg } from "../bestiary-art.js";
import { showBrokeAlert } from "../broke-alert.js";
import { confetti } from "../fx.js";
import { synth } from "../arcade-sound.js";
import { burstFrom } from "../motion/particles.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const panel = h("section.panel.month");
  // A page of the Mossy Bestiary (2026-10-22): the Town Hall logbook. The
  // month's agenda runs down the margin and the current card is a pinned notice.
  root.append(h("div.bestiary.bst-month", panel));
  // The teacher can pause play for the class. Practice mode still works.
  const paused = () =>
    fill(
      panel,
      placeHeader({ go, iconName: "pause", title: "Town Hall is closed", subtitle: "Your teacher paused the game for now. Your progress is saved." }),
      h("p", "You can still visit the Vault, the Market and the Academy.")
    );
  if (!run.practice && game.classInfo?.paused) {
    paused();
    return;
  }
  if (!run.practice && game.profile.classId) {
    game.db
      .getClass(game.profile.classId)
      .then((cls) => {
        if (!cls) return;
        game.classInfo = cls;
        if (cls.paused && panel.isConnected) paused();
      })
      .catch(() => {});
  }
  let view = null;
  let monthStartedAt = Date.now();

  const items = () => {
    const m = run.play.active.month;
    return [...(m.life ? ["life"] : []), ...m.cards.map((_, i) => i)];
  };
  const isDone = (item) => P.itemDef(run.play, item).state.done;
  const nextOpen = () => items().find((i) => !isDone(i)) ?? "end";

  async function save(reason) {
    refreshWho();
    await run.persist(reason);
  }

  // Cards drawn at the start of the month that no longer fit are skipped.
  function skipStale() {
    for (const item of items()) {
      if (!isDone(item) && !P.stillFits(run.play, run.life, item)) {
        P.skipItem(run.play, item);
        track("cardSkipped", { id: P.itemDef(run.play, item).def.id });
      }
    }
  }

  function paint() {
    const play = run.play;
    if (!play.active) return go(play.summary ? "chapterEnd" : "hub");
    skipStale();
    const a = play.active;
    const m = a.month;
    const life = run.life;
    if (view == null || (view !== "end" && isDone(view) && !revisit)) view = nextOpen();
    const info = chapterInfo(a.chapter, run.play);
    const fresh = !m.shifts && items().every((i) => !isDone(i));
    // A card on screen folds the page header and money strip away (like an Arcade shift),
    // so the card, its outcome and Continue fit one screen.
    panel.classList.toggle("playing", view !== "end");

    fill(
      panel,
      placeHeader({
        go,
        iconName: "townhall",
        kicker: `Chapter ${a.chapter}: ${info.title}`,
        title: `Town Hall: month ${a.monthIndex + 1} of ${a.months || CONFIG.pacing.monthsPerChapter}`,
        subtitle: `${game.save.creature.name} is ${ageLabel(life.ageMonths).replace(" old", "")} old. Make this month's decisions, then end the month here.`,
        practice: run.practice,
      }),
      moneyChips(life, play),
      brokeBanner(),
      fresh && a.records.length ? monthSummary(a.records.at(-1), "Last month") : null,
      agenda(),
      h("div.month-main", view === "end" ? endView() : cardView(view))
    );
  }

  let revisit = false;

  // This month at a glance. Done cards can be opened again to reread them.
  function agenda() {
    const play = run.play;
    const m = play.active.month;
    const steps = items().map((item, n) => {
      const { def, state, kind } = P.itemDef(play, item);
      return { key: item, label: kind === "life" ? "News" : `Decision ${n + (m.life ? 0 : 1)}`, title: def.title, done: state.done, skipped: state.skipped };
    });
    steps.push({ key: "end", label: "End Month", title: "End the month", done: false });
    // The quest board (visual plan item 7): one pinned note per step.
    return h(
      "ol.agenda.quest-board",
      { "aria-label": "This month's quests" },
      steps.map((st) =>
        h(
          "li",
          { class: `${st.done ? "done" : ""} ${view === st.key ? "current" : ""}` },
          h(
            "button",
            {
              type: "button",
              "aria-current": view === st.key ? "step" : null,
              title: st.title,
              disabled: !st.done && st.key !== "end" && view !== st.key,
              onclick: () => {
                revisit = st.key !== "end";
                view = st.key;
                track("monthTask", { task: typeof st.key === "number" ? "card" : st.key });
                paint();
              },
            },
            h("span.quest-pin", { "aria-hidden": "true" }),
            h("span.quest-label", st.key === "end" ? icon("moon", { size: 14 }) : null, ` ${st.label}`),
            h("span.quest-title", st.key === "end" ? "Close the month" : st.title),
            st.done ? h("span.quest-stamp", { "aria-hidden": "true" }, st.skipped ? "Skipped" : "Done") : null,
            st.done ? h("span.sr-only", st.skipped ? " (skipped)" : " (done)") : null
          )
        )
      )
    );
  }

  function cardView(item) {
    const play = run.play;
    const { def, state, ctx, kind } = P.itemDef(play, item);
    if (state.done) {
      const d = play.active.decisions.filter((x) => x.id === def.id).at(-1);
      return h(
        "div.decision-card.done-card-view",
        h("header.dc-head", h("span.dc-icon", def.icon), h("h2", def.title)),
        state.skipped ? h("p", "This card no longer applied, so it was skipped.") : h("div.callout", h("p", h("strong", `You chose: ${d?.label || state.choice}`)), d?.outcome ? h("p", d.outcome) : null),
        h("div.row", h("button", { type: "button", onclick: () => ((revisit = false), (view = null), paint()) }, "Back to this month"))
      );
    }
    revisit = false;
    return decisionCard({
      payAllowed: payMethods(run.play, run.life),
      ask: ASKS[def.id] || "",
      hint: HINTS[def.id] || null,
      qolNow: run.play.qol ?? CONFIG.pacing.qol.start,
      vehicleValue: vehicleValue(run.play),
      def,
      kind,
      life: run.life,
      ctx,
      choices: P.choicesFor(play, run.life, item),
      track,
      choose: async (key, method) => {
        const r = P.choose(play, run.life, item, key, method);
        if (r.ok) {
          run.life = r.life;
          await save(kind === "life" ? "lifeCard" : "card");
        }
        return r;
      },
      factorCheck: (choice) => {
        if (!choice.factor) return null;
        const { choices, answer } = factorOptions(createRng(`${run.life.seed}:fc:${run.life.month}:${def.id}`), choice.factor.key, choice.factor.dir);
        return {
          choices,
          answer,
          explain: factorChoice(choice.factor.key, choice.factor.dir),
          onAnswer: async (correct) => {
            const got = P.recordAnswer(play, { type: "factorCheck", standard: 3, correct });
            track("factorCheck", { id: def.id, correct, xp: got.xp });
            await save("factorCheck");
            return got.xp;
          },
        };
      },
      onContinue: ({ reaction, confusing, clarity }) => {
        if (reaction || confusing || clarity) track("cardReaction", { id: def.id, reaction, confusing, clarity: clarity || "" });
        view = null;
        paint();
        // Every card starts at the same spot on the page.
        window.scrollTo(0, 0);
        panel.querySelector(".month-main button, .month-main a")?.focus({ preventScroll: true });
      },
    });
  }

  function endView() {
    const play = run.play;
    const life = run.life;
    const open = items().filter((i) => !isDone(i));
    const up = upcomingPayments(life);
    const warnings = [];
    for (const c of up.cardsDue) warnings.push(`Your ${c.name} minimum of ${money(c.amount)} isn't paid. If you end the month now, it will be late.`);
    if (up.short > 0) warnings.push(`Checking is ${money(up.short)} short of the ${money(up.total)} that comes out automatically. Payments that bounce cost ${money(CONFIG.fees.overdraft)} each.`);
    const left = P.shiftsLeft(play);
    const wrap = h("div.end-month", h("h2", icon("moon", { size: 24 }), " End Month"));
    if (open.length) {
      add(
        wrap,
        h("p.callout", `Finish your ${open.length} open card${open.length === 1 ? "" : "s"} first.`),
        h("div.row", h("button", { type: "button", onclick: () => ((view = open[0]), paint()) }, "Go to the next card"))
      );
      return wrap;
    }
    add(
      wrap,
      h("p", "When the month ends, statements close, interest and fees are charged, automatic payments come out of checking, lenders report to the credit bureau, and your score updates."),
      left > 0
        ? h("p.callout", icon("guild", { size: 18 }), ` You have ${left} shift${left === 1 ? "" : "s"} to go at the Arcade this month. `, h("button.small.secondary", { type: "button", onclick: () => go("guild") }, "Go to the Arcade"))
        : null,
      warnings.length ? h("div.callout.warn", { role: "alert" }, warnings.map((w) => h("p", icon("alert", { size: 16 }), " ", w))) : h("p.callout.good", icon("check", { size: 16 }), " Your bills are covered."),
      h(
        "div.row",
        warnings.length
          ? h(
              "button.secondary",
              {
                type: "button",
                onclick: () => {
                  game.accountsTab = "paybills";
                  go("accounts");
                },
              },
              icon("vault", { size: 18 }),
              " Pay bills at the Vault"
            )
          : null,
        endButton(warnings.length ? "End Month anyway" : "End Month")
      )
    );
    return wrap;
  }

  // While a broke warning stands, Town Hall says so at the top.
  function brokeBanner() {
    const b = run.play.broke;
    if (!b) return null;
    return h("p.callout.bad.broke-banner", { role: "alert" }, icon("alert", { size: 20 }), h("strong", " RED ALERT: "), "You're broke. Get checking above $0 before this month ends, or time travels back a chapter.");
  }

  function endButton(label) {
    const btn = h(
      "button.big.bst-seal-btn",
      { type: "button", "data-sound": "none" },
      h("span.bst-seal-wax", { html: sealSvg({ seed: 37, size: 84, letter: (game.save.creature.name || "C").charAt(0).toUpperCase() }) }),
      h("span.bst-seal-text", label)
    );
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const play = run.play;
      const chapter = play.active.chapter;
      const monthIndex = play.active.monthIndex;
      const r = P.finishMonth(play, run.life);
      if (!r.ok) {
        btn.disabled = false;
        return toast(r.message, "bad");
      }
      run.life = r.life;
      const life = r.life;
      const util = utilization(life);
      const fees = r.events.filter((e) => e.type === "fee").reduce((s, e) => s + (e.amount || 0), 0);
      track("endMonth", {
        month: r.record.month,
        chapter,
        monthIndex,
        score: life.score ?? -1,
        delta: r.scoreChange.delta ?? 0,
        factor: r.scoreChange.factor || "",
        checking: life.checking,
        savings: life.savings,
        util: util == null ? -1 : Math.round(util * 100) / 100,
        debt: Math.round(life.accounts.filter((a) => a.owner === "self").reduce((s, a) => s + amountOwed(a), 0)),
        fees,
        cards: ownCards(life).length,
      });
      track("monthTime", { chapter, monthIndex, seconds: Math.round((Date.now() - monthStartedAt) / 1000) });
      monthStartedAt = Date.now();
      if (r.chapterDone) track("chapterDone", { chapter, score: life.score ?? -1 });
      // Fees first, then the score change a beat later, so the two never overlap.
      const delta = r.scoreChange.delta ?? 0;
      if (fees > 0) sfx.coinLoss();
      if (delta) setTimeout(delta > 0 ? sfx.creditScoreUp : sfx.creditScoreDown, fees > 0 ? 600 : 0);
      await save("endMonth");
      view = null;
      // Going broke (GAME-SPECS.md 2.4): a RED ALERT warning, or the time travel.
      if (r.broke?.type === "warning" || r.broke?.type === "reset") {
        sfx.coinLoss();
        await showBrokeAlert(r.broke, { name: game.save.creature.name, chapter, track });
      }
      if (r.chapterDone) go("chapterEnd");
      else {
        paint();
        if (r.broke?.type !== "reset") {
          monthParty(monthIndex + 1, r.xp);
          track("monthCelebrate", { chapter, monthIndex });
        }
      }
      window.scrollTo(0, 0);
      // Phase 17: the creature wobbles after a fee or a late mark, or hops
      // when the score goes up. The month summary says why in words.
      const worried = fees > 0 || r.events.some((e) => e.type === "late");
      if (worried || delta > 0) setTimeout(() => react(worried ? "worried" : "happy"), 300);
    });
    return btn;
  }

  paint();
  if (run.play.active) firstVisitLesson({ game, track, id: "townhall", route: "month" });
}

// A finished month (teacher request 2026-10-26): a smaller party than a
// finished chapter. A stamped banner drops in, a shower of leaves, a cheer,
// then it tucks itself away. It never blocks the screen.
export function monthParty(n, xp) {
  document.querySelector(".month-party")?.remove();
  const banner = h(
    "div.month-party.bst-scope",
    { role: "status" },
    confetti(40),
    h("p.month-party-stamp", `Month ${n} done!`),
    xp ? h("p.month-party-xp", `+${xp} XP`) : null
  );
  const close = () => {
    banner.classList.add("out");
    setTimeout(() => banner.remove(), 400);
  };
  banner.addEventListener("click", close);
  document.body.append(banner);
  setTimeout(() => burstFrom(banner, "leaves", { n: 22 }), 250);
  synth("cheer");
  sfx.questComplete();
  setTimeout(close, 3200);
}
