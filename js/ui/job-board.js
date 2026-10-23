// The job board: pick a job, play its minigame, see your pay and what you
// missed, then collect (SPEC §17). Pay rises with experience at each job.
import { h, fill, money } from "./dom.js";
import { coinsFly } from "./fx.js";
import { CONFIG } from "../data/config.js";
import { JOBS } from "../data/minigames.js";
import { jobPay, experienceBonus, recordShift, rideAndHomeBonus } from "../progress.js";
import { openJobs, opensText, unlockStage } from "../progression.js";
import { icon } from "./icons.js";
import { sealSvg } from "./bestiary-art.js";
import * as P from "../play.js";
import { ledgerSort } from "./minigames/ledger-sort.js";
import { cashierRush } from "./minigames/cashier-rush.js";
import { checkWriter } from "./minigames/check-writer.js";
import { spotOverdraft } from "./minigames/spot-overdraft.js";
import { registerBalancer } from "./minigames/register-balancer.js";
import { checkHunt } from "./minigames/check-hunt.js";
import { countDrawer } from "./minigames/count-drawer.js";
import { unitPriceShowdown } from "./minigames/unit-price.js";
import { feeDetective } from "./minigames/fee-detective.js";
import { hasGuide, openGameGuide } from "./game-guide.js";

// The games that only need the shared options (seed, timed, onDone, track).
const GAMES = { ledger: ledgerSort, cashier: cashierRush, overdraft: spotOverdraft, register: registerBalancer, checkhunt: checkHunt, drawer: countDrawer, unitprice: unitPriceShowdown, fees: feeDetective };

const REACTIONS = [
  ["up", "👍", "I liked this job"],
  ["meh", "😐", "This job was okay"],
  ["down", "👎", "I didn't like this job"],
];

// onCollected() repaints the month after pay goes into checking.
export function jobBoard({ game, run, track, save, onCollected }) {
  const play = run.play;
  const el = h("div.job-board");
  // New players start untimed (Phase 10 prologue).
  let timed = !(play.prologue && !play.prologue.done);
  let running = null;
  // The finished shift's telemetry, sent on Collect or when the student leaves.
  let logShift = null;

  // Jobs that open later, so students know more is coming.
  function lockedJobs() {
    const later = Object.entries(JOBS)
      .filter(([key]) => !openJobs(play).includes(key))
      .sort(([a], [b]) => unlockStage(a) - unlockStage(b));
    if (!later.length) return null;
    // Unopened jobs are pencil-sketch tickets, each saying when it opens.
    return h(
      "ul.jobs-later",
      { "aria-label": "Jobs coming later" },
      later.map(([key, job]) => h("li", icon("lock", { size: 16 }), h("strong", job.title), h("small", opensText(key))))
    );
  }

  function board() {
    const j = CONFIG.play.jobs;
    const timer = h("input", { type: "checkbox", id: "untimed", checked: !timed });
    timer.addEventListener("change", () => (timed = !timer.checked));
    fill(
      el,
      h(
        "div.job-cards",
        Object.entries(JOBS)
          .filter(([key]) => openJobs(play).includes(key))
          .map(([key, job]) => {
          const xp = experienceBonus(play, key) + (play.shiftBonus || 0) + rideAndHomeBonus(play);
          const stats = play.jobs[key];
          const worked = Boolean(play.prologue && !play.prologue.done && (play.prologue.worked || []).includes(key));
          const guide = hasGuide(key) ? h("button.job-guide.small.secondary", { type: "button", onclick: () => openGameGuide(key, { track }) }, icon("scroll", { size: 14 }), " Guide") : null;
          const card = h(
            "button.job-card",
            { type: "button", disabled: worked, onclick: () => start(key) },
            h("span.job-icon", { "aria-hidden": "true" }, job.mark ? icon(job.mark, { size: 30 }) : job.icon),
            h("strong", job.title),
            h("small", job.job),
            h("span", job.skill),
            h("span.job-pay", key === "cashier" ? `Pays ${j.cashier.rates.easy[0]} to ${j.cashier.rates.hard[1]} coins for each right sale` : `Pays ${money(j.pay.min + xp)} to ${money(j.pay.max + xp)}`),
            worked ? h("small.good-text", "Worked. Done for now.") : null,
            stats && !worked ? h("small", `${stats.shifts} shift${stats.shifts === 1 ? "" : "s"} worked. Best: ${stats.best}.`) : worked ? null : h("small", "New job!"),
            xp ? h("small.good-text", `+${money(xp)} for experience`) : null
          );
          return h("div.job-slot", card, guide);
        })
      ),
      lockedJobs(),
      h("label.untimed", timer, " No timer (fewer items, same pay for each right answer)")
    );
  }

  function start(key) {
    if (play.prologue && !play.prologue.done && (play.prologue.worked || []).includes(key)) return;
    const shifts = play.active ? play.active.month.shifts : `p${play.prologue?.shifts ?? 0}`;
    const seed = `${run.life.seed}:job:${run.life.month}:${shifts}`;
    track("minigameStart", { game: key, timed });
    // While a shift runs, the page header and money fold away so the game fits one screen.
    el.closest(".panel")?.classList.add("playing");
    window.scrollTo(0, 0);
    // A minigame can only end a shift once.
    let ended = false;
    const done = (result) => {
      if (ended) return;
      ended = true;
      finish(key, result);
    };
    const opts = { seed, timed, onDone: done, track };
    running = key === "checks" ? checkWriter({ ...opts, life: run.life, creature: game.save.creature, payFor: (right) => jobPay(play, "checks", { right }) }) : GAMES[key](opts);
    fill(el, h("h3", icon(JOBS[key].mark || "guild", { size: 24 }), ` ${JOBS[key].title} `, hasGuide(key) ? h("button.small.secondary.job-guide", { type: "button", onclick: () => openGameGuide(key, { track }) }, "Guide") : null), running);
    // A minigame can say where the keyboard starts (Cashier Rush: Give change).
    (el.querySelector("[data-autofocus]") || el.querySelector("button"))?.focus();
  }

  function finish(key, result) {
    running = null;
    el.closest(".panel")?.classList.remove("playing");
    const pay = jobPay(play, key, result);
    let reaction = "";
    // The pay is banked and saved the moment the shift ends (bug fix
    // 2026-10-22: leaving before Collect lost the whole shift). Collect is
    // just the coins and the reaction now.
    const r = P.workShift(play, run.life, pay, `work shift: ${JOBS[key].title}`, key);
    if (r.ok) {
      run.life = r.life;
      recordShift(play, key, { right: result.right, pay });
    }
    const saved = r.ok ? save("shift") : Promise.resolve();
    logShift = () => {
      logShift = null;
      track("minigame", { game: key, right: result.right, wrong: result.wrong, total: result.total, pay, seconds: result.seconds, timed, reaction, depositOnly: result.depositOnly ?? null });
    };
    const collect = h(
      "button.big.bst-seal-btn",
      { type: "button", "data-sound": "none" },
      h("span.bst-seal-wax", { html: sealSvg({ seed: 47, size: 80, letter: "G" }) }),
      h("span.bst-seal-text", `Collect ${money(pay)}`)
    );
    collect.addEventListener("click", async () => {
      if (collect.disabled) return;
      collect.disabled = true;
      if (!r.ok) return;
      coinsFly(collect);
      logShift?.();
      await saved;
      onCollected(pay);
    });
    const reacts = h(
      "div.reactions",
      { role: "group", "aria-label": "How was this job?" },
      REACTIONS.map(([k, emoji, label]) =>
        h(
          "button.reaction",
          {
            type: "button",
            "aria-label": label,
            "aria-pressed": "false",
            onclick: (e) => {
              reaction = k;
              reacts.querySelectorAll(".reaction").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget)));
            },
          },
          emoji
        )
      )
    );
    fill(
      el,
      h("h3", icon(JOBS[key].mark || "guild", { size: 24 }), " Shift over!"),
      hasGuide(key) ? h("p.center", h("button.small.secondary", { type: "button", onclick: () => openGameGuide(key, { track, tab: "irl" }) }, icon("scroll", { size: 14 }), " Read the guide")) : null,
      h("div.big-number", money(pay)),
      h("p.center", `${result.right} right${result.wrong ? `, ${result.wrong} missed` : ""}.`),
      result.depositOnly ? h("p.callout.good", "Smart: \"For deposit only\" means nobody else can cash your check.") : null,
      result.misses.length
        ? h("details.math", { open: result.misses.length <= 4 }, h("summary", `What you missed (${result.misses.length})`), h("ul", result.misses.slice(0, 8).map((m) => h("li", m))))
        : h("p.callout.good", "Perfect shift!"),
      reacts,
      h("div.row", collect)
    );
    collect.focus();
  }

  board();
  // The month screen calls this when it repaints, so a running timer stops cleanly.
  el.stop = () => {
    el.closest(".panel")?.classList.remove("playing");
    running?.stop?.();
    logShift?.();
  };
  return el;
}
