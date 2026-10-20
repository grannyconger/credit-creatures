// One game month (SPEC §8): a life card, Decision cards, work shifts, bills,
// then End Month. In practice mode the same screen runs on a throwaway copy.
import { h, add, fill, money, ageLabel, toast } from "../dom.js";
import { pay, moveToSavings, moveToChecking, ownCards, upcomingPayments, utilization, amountOwed } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { chapterInfo } from "../../data/chapters.js";
import * as P from "../../play.js";
import { decisionCard } from "../decision-card.js";
import { jobBoard } from "../job-board.js";
import { notePayment } from "../../progress.js";
import { billsPanel } from "../bills-panel.js";
import { moneyChips, accountButtons } from "../wallet.js";
import { createRng } from "../../engine/index.js";
import { factorOptions, factorChoice } from "../../data/practice-questions.js";
import { monthSummary } from "../month-summary.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const panel = h("section.panel.month");
  root.append(panel);
  let view = null;
  let monthStartedAt = Date.now();
  // The job board, so a running minigame timer can stop when the screen repaints.
  let board = null;

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
    board?.stop();
    board = null;
    const play = run.play;
    if (!play.active) return go(play.summary ? "chapterEnd" : "hub");
    skipStale();
    const a = play.active;
    const m = a.month;
    const life = run.life;
    if (view == null || (view !== "work" && view !== "bills" && view !== "end" && isDone(view) && !revisit)) view = nextOpen();
    const info = chapterInfo(a.chapter);
    const fresh = !m.shifts && items().every((i) => !isDone(i));

    fill(
      panel,
      run.practice ? h("p.callout.warn.practice", "🔁 Practice mode. Nothing you do here is saved. Your real game is safe.") : null,
      h("p.step-label", `Chapter ${a.chapter}: ${info.title}`),
      h("h1", `Month ${a.monthIndex + 1} of ${CONFIG.pacing.monthsPerChapter}`),
      h("p.muted", `${game.save.creature.name} is ${ageLabel(life.ageMonths).replace(" old", "")} old.`),
      moneyChips(life, play.sparkle.total),
      accountButtons(game, go, P.unreadCount(play)),
      fresh && a.records.length ? monthSummary(a.records.at(-1), "Last month") : null,
      h("div.month-grid", taskList(), h("div.month-main", mainView()))
    );
  }

  let revisit = false;

  function taskList() {
    const play = run.play;
    const m = play.active.month;
    const up = upcomingPayments(run.life);
    const billWarn = up.cardsDue.length > 0 || up.short > 0;
    const entries = items().map((item, n) => {
      const { def, state, kind } = P.itemDef(play, item);
      const label = kind === "life" ? `Life card: ${def.title}` : state.done || view === item ? def.title : `Decision card ${n + (m.life ? 0 : 1)}`;
      return { key: item, icon: kind === "life" ? def.icon : "📜", label, done: state.done, note: state.skipped ? "skipped" : "" };
    });
    const left = P.shiftsLeft(play);
    entries.push({ key: "work", icon: "💼", label: `Work shifts (${m.shifts} of ${m.shifts + left})`, done: left === 0 });
    entries.push({ key: "bills", icon: "🧾", label: "Pay bills and move money", done: false, warn: billWarn });
    entries.push({ key: "end", icon: "🌙", label: "End Month", done: false });
    return h(
      "nav.task-list",
      { "aria-label": "This month" },
      h(
        "ol",
        entries.map((e) =>
          h(
            "li",
            { class: `${e.done ? "done" : ""} ${e.warn ? "warn" : ""}` },
            h(
              "button",
              {
                type: "button",
                "aria-current": view === e.key ? "step" : null,
                onclick: () => {
                  revisit = typeof e.key === "number" || e.key === "life";
                  view = e.key;
                  track("monthTask", { task: typeof e.key === "number" ? "card" : e.key });
                  paint();
                },
              },
              h("span.task-mark", { "aria-hidden": "true" }, e.done ? "✓" : e.warn ? "!" : e.icon),
              h("span", e.label, e.done ? h("span.sr-only", " (done)") : null, e.note ? h("small", ` (${e.note})`) : null)
            )
          )
        )
      )
    );
  }

  function mainView() {
    if (view === "work") return workView();
    if (view === "bills") return billsView();
    if (view === "end") return endView();
    return cardView(view);
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
            track("factorCheck", { id: def.id, correct, sparkle: got.sparkle, xp: got.xp });
            await save("factorCheck");
            return got.sparkle;
          },
        };
      },
      onContinue: ({ reaction, confusing }) => {
        if (reaction || confusing) track("cardReaction", { id: def.id, reaction, confusing });
        view = null;
        paint();
        panel.querySelector(".month-main button, .month-main a")?.focus();
      },
    });
  }

  function workView() {
    const play = run.play;
    const left = P.shiftsLeft(play);
    const wrap = h("div", h("h2", "💼 Work a shift"), h("p", "Pick a job. Pay depends on how well you do, and it goes up as you get more experience at a job."));
    if (left <= 0) {
      add(wrap, h("p.callout", "No shifts left this month."), h("div.row", h("button", { type: "button", onclick: () => ((view = "end"), paint()) }, "Go to End Month")));
      return wrap;
    }
    board = jobBoard({
      game,
      run,
      track,
      save,
      onCollected: (pay) => {
        toast(`${money(pay)} went into checking.`, "good");
        paint();
      },
    });
    add(wrap, h("p.muted", `${left} shift${left === 1 ? "" : "s"} left this month.`), board);
    return wrap;
  }

  function billsView() {
    return h(
      "div",
      h("h2", "🧾 Bills and money"),
      billsPanel({
        life: run.life,
        onPay: async (accountId, amount, kind) => {
          const before = run.life;
          const r = pay(before, accountId, amount);
          if (!r.ok) return toast(r.message, "bad");
          notePayment(run.play, before, accountId, r.paid);
          run.life = r.life;
          track("billPay", { kind, amount: r.paid });
          toast(r.message, "good");
          await save("pay");
          paint();
        },
        onMove: async (dir, amount) => {
          const r = dir === "toSavings" ? moveToSavings(run.life, amount) : moveToChecking(run.life, amount);
          if (!r.ok) return toast(r.message, "bad");
          run.life = r.life;
          track("moveMoney", { dir, amount });
          toast(r.message, "good");
          await save("move");
          paint();
        },
      })
    );
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
    const wrap = h("div", h("h2", "🌙 End Month"));
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
      left > 0 ? h("p.note.tight", `You still have ${left} work shift${left === 1 ? "" : "s"} you could do first.`) : null,
      warnings.length ? h("div.callout.warn", { role: "alert" }, warnings.map((w) => h("p", "⚠️ ", w))) : h("p.callout.good", "✓ Your bills are covered."),
      h(
        "div.row",
        warnings.length ? h("button.secondary", { type: "button", onclick: () => ((view = "bills"), paint()) }, "Pay bills first") : null,
        endButton(warnings.length ? "End Month anyway" : "End Month")
      )
    );
    return wrap;
  }

  function endButton(label) {
    const btn = h("button.big", { type: "button" }, label);
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
      await save("endMonth");
      view = null;
      if (r.chapterDone) go("chapterEnd");
      else paint();
      window.scrollTo(0, 0);
    });
    return btn;
  }

  paint();
  return () => board?.stop();
}
