// Runs one Arcade game the GAME-SPECS.md way (Part 2): the settings modal, an
// optional training shift with three coach beats, the shift itself in its
// cabinet, risky mode mistakes and firing, then the shared results screen with
// the echo recap, the why capture and the bonus round.
//
// A game's UI module exports start(ctx) and returns an element with stop().
// ctx: { seed, settings, training, risky, track, frame, mistake, echo, coach, finish }.
// It calls ctx.finish(result) once, with result:
//   { score, tie, sub, perfect, multiplier, tier, payScore, reveal (Element), biggest: { text, reasons }, stats }
// score is the ranked metric. payScore (optional) is what pay is figured from.
import { h, add, fill, money, toast } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { JOBS } from "../../data/minigames.js";
import { ARCADE } from "../../data/arcade/index.js";
import { arcadeCharge, earn } from "../../engine/index.js";
import * as P from "../../play.js";
import * as AC from "../../arcade/core.js";
import { experienceBonus, rideAndHomeBonus, recordShift, shiftRewards } from "../../progress.js";
import { fullName } from "../../data/creatures.js";
import { coinsFly } from "../fx.js";
import { cabinetArt } from "../arcade-art.js";
import { calcWidget } from "../minigames/calculator.js";
import { setArcadeVoice, sfx } from "../arcade-sound.js";
import { hasGuide, openGameGuide } from "../game-guide.js";
import { echoHost, coachMark } from "./components.js";
import { GAME_UI } from "../minigames/arcade-games.js";

const fmtDate = (ms) => new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });

// The class top scores, read at most once a minute.
let boardCache = { at: 0, classId: null, rows: [] };
async function classRows(game) {
  const classId = game.profile?.classId;
  if (!classId || !game.db?.readArcadeBoard) return null;
  if (game.classInfo && game.classInfo.leaderboard === false) return null;
  if (boardCache.classId === classId && Date.now() - boardCache.at < 60000) return boardCache.rows;
  try {
    const rows = await game.db.readArcadeBoard(classId);
    boardCache = { at: Date.now(), classId, rows };
    return rows;
  } catch {
    return null;
  }
}

async function shareBest(game) {
  const classId = game.profile?.classId;
  if (!classId || !game.db?.writeArcadeBest || !game.user) return;
  try {
    // person: the student's Google name, shown faintly after the creature name.
    await game.db.writeArcadeBest(classId, game.user.uid, { creatureName: (fullName(game.save.creature) || "Creature").slice(0, 41), person: (game.user.displayName || "").slice(0, 100), best: game.save.play.arcade.best });
    boardCache.at = 0;
  } catch (err) {
    console.warn("Arcade score share failed", err);
  }
}

// A game can name and format its metric per board (The Grind: an hourly rate
// for Delivery, points for Store).
export function scoreText(meta, b, board = null) {
  if (!b) return "";
  if (meta.formatBoard) return meta.formatBoard(board, b.s);
  return meta.format ? meta.format(b.s) : String(b.s);
}
const metricName = (meta, settings) => meta.metricFor?.(settings) ?? meta.metric;

// Each choice gets a tone and a shape (teacher request 2026-10-27), so Easy,
// Medium and Hard, and calm and fast rounds, read at a glance. The word is
// always there too, so color is never the only cue.
const TONES = {
  easy: { tone: "easy", pips: 1 },
  medium: { tone: "medium", pips: 2 },
  hard: { tone: "hard", pips: 3 },
  chill: { tone: "calm", icon: "moon" },
  none: { tone: "calm", icon: "pause" },
  speed: { tone: "fast", icon: "clock" },
  timed: { tone: "fast", icon: "clock" },
};
const pipsSvg = (n) => `<svg viewBox="0 0 30 10" width="30" height="10" aria-hidden="true" focusable="false">${[0, 1, 2].map((i) => `<circle cx="${5 + i * 10}" cy="5" r="${i < n ? 4 : 3}" style="${i < n ? "fill:var(--tone)" : "fill:none;stroke:var(--tone);stroke-width:1.5"}"/>`).join("")}</svg>`;
function toneMark(t) {
  if (!t) return null;
  return t.pips ? h("span.arc-opt-mark", { html: pipsSvg(t.pips) }) : h("span.arc-opt-mark", icon(t.icon, { size: 18 }));
}

// host: the job board's element. onBack(): back to the cabinets.
export function arcadeRunner({ key, host, game, run, track, save, onBack }) {
  const meta = ARCADE[key];
  const play = run.play;
  AC.ensureArcade(play);
  let running = null;
  let keyHandler = null;
  const prologue = Boolean(play.prologue && !play.prologue.done);

  const setKeys = (fn) => {
    if (keyHandler) document.removeEventListener("keydown", keyHandler);
    keyHandler = fn;
    if (fn) document.addEventListener("keydown", fn);
  };

  // ---------- 2.1 The settings modal ----------
  function openSettings(prefill = null) {
    const defs = meta.settings(play);
    const last = play.arcade.last[key] || {};
    const settings = {};
    for (const d of defs) settings[d.key] = d.locked ?? prefill?.settings?.[d.key] ?? last[d.key] ?? d.def;
    if (meta.timer !== false) settings.timer = prefill?.settings?.timer ?? last.timer ?? (prologue ? "none" : "timed");
    let training = prefill?.training ?? false;
    let mode = prologue ? "safe" : prefill?.mode ?? play.arcade.lastMode ?? "safe";

    const dialog = h("dialog.arc-settings.bst-scope", { "aria-labelledby": "arc-set-title" });
    const topCard = h("section.arc-top", { "aria-live": "polite" });
    const ranked = h("p.arc-ranked");
    const modeBox = h("section.arc-mode");
    const startBtn = h("button.arc-start", { type: "button", "aria-keyshortcuts": "Enter" }, "Start");
    const close = (go) => {
      dialog.close();
      dialog.remove();
      if (go) begin({ settings: { ...settings }, training, mode });
    };

    const paintTop = async () => {
      const board = meta.board(settings);
      const mine = AC.bestOf(play, board);
      fill(topCard, h("h3", icon("trophy", { size: 18 }), ` Class top: ${metricName(meta, settings)}${meta.boardLabel ? ` (${meta.boardLabel(settings)})` : ""}`), h("p.arc-top-load", "Checking the class board..."), h("p.arc-top-mine", mine ? `Your best: ${scoreText(meta, mine, board)} on ${fmtDate(mine.at)}` : "Your best: no ranked shift yet."));
      const rows = await classRows(game);
      if (!dialog.isConnected || meta.board(settings) !== board) return;
      const top = rows ? AC.classTop(rows, board, meta.tie.better) : null;
      const line = topCard.querySelector(".arc-top-load");
      if (!rows) line.replaceWith(h("p.arc-top-none", "Class scores show up when you play with your class."));
      else if (!top) line.replaceWith(h("p.arc-top-none", "No class score yet. Be the first."));
      else line.replaceWith(h("p.arc-top-best", h("strong.arc-top-num", scoreText(meta, top.best, board)), h("span", " held by ", top.creatureName, top.person ? h("span.arc-top-person", ` (${top.person})`) : null, `, ${fmtDate(top.best.at)}`)));
    };

    const paintRanked = () => {
      const r = !training && meta.ranked(settings);
      fill(ranked, icon(r ? "star" : "info", { size: 16 }), r ? " Ranked: this shift counts toward the class top score." : ` Not ranked: ${training ? "training shifts never count" : meta.rankedHint}.`);
      ranked.classList.toggle("on", r);
    };

    const paintMode = () => {
      const left = P.shiftsLeft(play);
      const fired = AC.minutesLeft(play, key);
      const pick = (m) => () => {
        mode = m;
        paintMode();
      };
      const safeBtn = h("button.arc-mode-btn", { type: "button", "data-tone": "easy", "aria-pressed": String(mode === "safe"), disabled: training, onclick: pick("safe") }, icon("check", { size: 18 }), h("strong", "Safe mode"), h("small", prologue ? (left ? `${left} shift${left === 1 ? "" : "s"} to go before the bank opens.` : "Mistakes cost nothing.") : left ? `${left} shift${left === 1 ? "" : "s"} to go this month. Mistakes cost nothing.` : "Mistakes cost nothing. Work as much as you like."));
      const riskyBtn = h("button.arc-mode-btn.risky", { type: "button", "data-tone": "hard", "aria-pressed": String(mode === "risky"), disabled: training || prologue, onclick: pick("risky") }, icon("alert", { size: 18 }), h("strong", "Risky mode"), h("small", prologue ? "Opens with your bank account." : "Mistakes cost real coins."));
      const warn = mode === "risky" && !training ? h("div.arc-risk-warn", h("p", h("strong", "In risky mode, mistakes cost your creature:")), h("ul", meta.mistakes.map((m) => h("li", m))), h("p", `${CONFIG.arcade.fireAfter} mistakes in one shift and you're fired from this game for ${CONFIG.arcade.cooldownMinutes} minutes. If a cost is more than your checking, the rest goes on your Arcade IOU.`)) : null;
      const firedNote = fired ? h("p.arc-fired", icon("lock", { size: 18 }), ` You were fired from ${meta.title}. It opens again in ${fired} minute${fired === 1 ? "" : "s"}.`) : null;
      fill(modeBox, h("h3", "Play mode"), h("div.arc-mode-row", safeBtn, riskyBtn), warn, firedNote);
      const check = AC.canStart(play, key, { mode, training, shiftsLeft: left, prologue });
      startBtn.disabled = !check.ok;
      startBtn.title = check.ok ? "" : check.reason;
    };

    const group = (d) => {
      const btns = d.options.map((o) =>
        h(
          "button.arc-opt",
          {
            type: "button",
            "data-tone": TONES[o.value]?.tone ?? null,
            "aria-pressed": String(settings[d.key] === o.value),
            disabled: d.locked != null && d.locked !== o.value,
            onclick: () => {
              settings[d.key] = o.value;
              btns.forEach((b, i) => b.setAttribute("aria-pressed", String(d.options[i].value === o.value)));
              paintRanked();
              paintTop();
            },
          },
          toneMark(TONES[o.value]),
          h("strong", o.label),
          o.hint ? h("small", o.hint) : null
        )
      );
      return h("fieldset.arc-group", h("legend", d.label), h("div.arc-opts", btns), d.locked != null && d.lockedWhy ? h("small.arc-locked", d.lockedWhy) : null);
    };
    const timerDef = meta.timer === false ? null : { key: "timer", label: "Timer", options: [{ value: "timed", label: "Timed", hint: meta.timer?.timed }, { value: "none", label: "No timer", hint: meta.timer?.none }] };
    const trainBox = h("input", { type: "checkbox", id: "arc-train", checked: training });
    trainBox.addEventListener("change", () => {
      training = trainBox.checked;
      paintRanked();
      paintMode();
    });

    dialog.append(
      h(
        "header.arc-set-head",
        { class: `cab-${key}` },
        h("span.arc-set-art", { html: cabinetArt(key) }),
        h("div.arc-set-intro", h("h2", { id: "arc-set-title" }, meta.title), h("p", meta.pitch), h("p.arc-std", `Skill: ${meta.skill}. Standards: ${meta.standards.join(", ")}.`)),
        // The class top score sits up here, beside the title (teacher request 2026-10-27).
        topCard
      ),
      h(
        "div.arc-set-body",
        h("div.arc-set-col", defs.map(group), timerDef ? group(timerDef) : null),
        h("div.arc-set-col", modeBox, ranked)
      ),
      // The training choice sits beside Start, since it changes what Start does,
      // and the footer is always on screen (layout audit 2026-10-26).
      h("footer.arc-set-foot", h("button.arc-back-btn", { type: "button", "aria-keyshortcuts": "Escape", onclick: () => close(false) }, icon("back", { size: 16 }), " Back"), h("label.arc-train", trainBox, " Training shift (guided, no pay)"), startBtn)
    );
    startBtn.addEventListener("click", () => !startBtn.disabled && close(true));
    dialog.addEventListener("cancel", (e) => (e.preventDefault(), close(false)));
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.target.closest("button, input")) {
        e.preventDefault();
        if (!startBtn.disabled) close(true);
      }
    });
    document.body.append(dialog);
    paintTop();
    paintRanked();
    paintMode();
    dialog.showModal();
    startBtn.disabled ? dialog.querySelector(".arc-back-btn").focus() : startBtn.focus();
    track("arcadeSettingsOpen", { game: key });
  }

  // ---------- The shift ----------
  function begin({ settings, training, mode }) {
    const left = P.shiftsLeft(play);
    const check = AC.canStart(play, key, { mode, training, shiftsLeft: left, prologue });
    if (!check.ok) return toast(check.reason, "bad");
    const risky = mode === "risky" && !training;
    if (!training) {
      play.arcade.last[key] = { ...settings };
      play.arcade.lastMode = mode;
    }
    // Training plays without a clock, so coach marks never race a timer.
    const shiftSettings = training ? { ...settings, timer: "none" } : settings;
    const seed = AC.nextSeed(play, run.life.seed, key, training);
    AC.beginLive(play, key, risky ? "risky" : "safe");
    if (risky) save("risky shift start");
    const started = Date.now();
    const mistakes = [];
    let lastSave = 0;
    let ended = false;
    track("arcadeStart", { game: key, seed, mode, training, settings: shiftSettings });

    el().closest(".panel")?.classList.add("playing");
    window.scrollTo(0, 0);
    setArcadeVoice(key);
    const echoes = echoHost();
    const strikes = h("span.arc-strikes", { "aria-live": "polite" });
    const paintStrikes = () => {
      if (!risky) return;
      const n = mistakes.length;
      fill(strikes, icon("alert", { size: 16 }), ` Mistakes ${n} of ${CONFIG.arcade.fireAfter}`);
      strikes.classList.toggle("hot", n >= CONFIG.arcade.fireAfter - 1);
    };
    paintStrikes();
    const badge = h("span.arc-mode-badge", { class: training ? "training" : mode }, icon(training ? "compass" : risky ? "alert" : "check", { size: 14 }), training ? " Training" : risky ? " Risky" : " Safe");
    const leave = h("span.job-leave");
    const askLeave = () =>
      fill(
        leave,
        h("span.job-leave-ask", { role: "alertdialog", "aria-label": "Leave without pay?" }, risky && mistakes.length ? `Leave without pay? Your ${mistakes.length} mistake${mistakes.length === 1 ? "" : "s"} still count. ` : "Leave without pay? ", h("button.small", { type: "button", onclick: quit }, "Leave"), h("button.small.secondary", { type: "button", onclick: showLeave }, "Keep playing"))
      );
    const showLeave = () => fill(leave, h("button.small.secondary.job-back", { type: "button", onclick: askLeave }, icon("back", { size: 16 }), " Back to the games"));
    showLeave();
    const body = h("div.arc-body");
    const frame = h(
      "div.arc-frame.arc-v2",
      { class: `skin-${key}` },
      h("div.arc-marquee", leave, h("h3.arc-title", icon(JOBS[key].mark || "guild", { size: 28 }), ` ${meta.title}`), badge, strikes, hasGuide(key) ? h("button.arc-guide", { type: "button", onclick: () => openGameGuide(key, { track }) }, icon("scroll", { size: 14 }), " Guide") : null),
      echoes,
      body
    );
    fill(el(), frame);

    const ctx = {
      seed,
      settings: shiftSettings,
      training,
      risky,
      mode,
      track,
      frame,
      play,
      life: run.life,
      creature: game.save.creature,
      // A risky mistake costs real money the moment it happens (2.3).
      // quiet: the game already showed its own echo for this mistake.
      mistake({ type, cost, label, quiet = false }) {
        if (ended) return;
        const c = Math.max(CONFIG.arcade.minMistake, Math.round(cost * 100) / 100);
        mistakes.push({ type, cost: c, label });
        track("arcadeMistake", { game: key, type, cost: c, risky });
        if (risky) {
          run.life = arcadeCharge(run.life, c, `${meta.title}: ${label}`).life;
          AC.noteMistake(play);
          paintStrikes();
          if (!quiet) echoes.push(`${label}: cost ${money(c)}`);
          if (Date.now() - lastSave > 8000) {
            lastSave = Date.now();
            save("risky mistake");
          }
        } else if (!training && !quiet) echoes.push(`${label}. Free in safe mode, ${money(c)} in risky mode.`, { kind: "safe" });
      },
      echo: (text, opts) => echoes.push(text, opts),
      // A quick note that isn't a consequence, so it stays out of the echo recap.
      notice: (text) => echoes.push(text, { kind: "safe", log: false }),
      coach: (i, target) => (training ? coachMark(frame, target, meta.beats[i]) : Promise.resolve()),
      finish: (result) => {
        if (ended) return;
        ended = true;
        finish(result);
      },
    };

    function quit() {
      if (ended) return;
      ended = true;
      running?.stop?.();
      running = null;
      const fired = training ? false : AC.endLive(play);
      track("arcadeLeave", { game: key, seed, mode, training, mistakes: mistakes.length, fired });
      el().closest(".panel")?.classList.remove("playing");
      if (risky) save("left a risky shift");
      if (fired) toast(`You were fired from ${meta.title} for ${CONFIG.arcade.cooldownMinutes} minutes.`, "bad");
      onBack();
    }

    function finish(result) {
      running?.stop?.();
      running = null;
      const seconds = Math.round((Date.now() - started) / 1000);
      const fired = training ? false : AC.endLive(play);
      const score = Math.round(result.score);
      let coins = 0;
      let pay = 0;
      let rewards = { energy: 0 };
      if (!training) {
        // payScore: a game whose ranked metric isn't its pay points (Score Chase).
        const payPts = result.payScore ?? score;
        coins = AC.payFor(key, payPts, { multiplier: result.multiplier || 1, tier: result.tier });
        pay = coins + experienceBonus(play, key) + (play.shiftBonus || 0) + rideAndHomeBonus(play);
        const r = P.workShift(play, run.life, pay, `Arcade: ${meta.title}`, key, { risky });
        if (r.ok) {
          run.life = r.life;
          recordShift(play, key, { right: score, pay });
          rewards = shiftRewards(play, { ratio: AC.payRatio(key, payPts, result.tier), perfect: Boolean(result.perfect) && !mistakes.length });
        } else pay = 0;
      }
      const ranked = !training && meta.ranked(shiftSettings);
      const board = meta.board(shiftSettings);
      const report = { game: key, seed, settings: shiftSettings, ranked, training, mode, score, tie: result.tie ?? null, sub: result.sub || null, coins: pay, mistakes, seconds, board };
      const rec = AC.recordResult(play, report, { tie: meta.tie.better });
      const saved = training ? Promise.resolve() : save("arcade shift");
      if (rec.newBest && ranked) saved.then(() => shareBest(game));
      track("arcadeShift", { ...report, mistakes: mistakes.map((m) => ({ type: m.type, cost: m.cost })), energy: rewards.energy, fired, ...(result.stats || {}) });
      sfx.questComplete();
      showResults({ result, report, rec, rewards, pay, fired, echoes: echoes.log, training, risky, mode, settings: shiftSettings });
    }

    try {
      running = GAME_UI[key].start(ctx);
    } catch (err) {
      console.error(err);
      ended = true;
      AC.endLive(play);
      el().closest(".panel")?.classList.remove("playing");
      toast("That game hit a snag. Your shift wasn't counted.", "bad");
      return onBack();
    }
    body.append(running);
    (body.querySelector("[data-autofocus]") || body.querySelector("button"))?.focus();
  }

  // ---------- 2.6 The results screen ----------
  function showResults({ result, report, rec, rewards, pay, fired, echoes, training, risky, mode, settings }) {
    // The hall header stays folded so the results fit one screen.
    el().closest(".panel")?.classList.add("playing");
    const prev = rec.prevBest;
    const scoreLine = h("p.arc-res-compare");
    const top = h("p.arc-res-class");
    if (training) fill(scoreLine, "Training shifts don't count toward your best.");
    else if (!report.ranked) fill(scoreLine, `Not ranked (${meta.rankedHint}). `, prev ? `Your ranked best is ${scoreText(meta, prev, report.board)}.` : "");
    else if (rec.newBest) fill(scoreLine, icon("star", { size: 16 }), prev ? ` New personal best! Your old best was ${scoreText(meta, prev, report.board)}.` : " Your first ranked score. That's your best so far.");
    else fill(scoreLine, `Your best is ${scoreText(meta, prev, report.board)}.`);
    if (report.ranked) {
      classRows(game).then((rows) => {
        const t = rows ? AC.classTop(rows, report.board, meta.tie.better) : null;
        if (t) fill(top, icon("trophy", { size: 16 }), ` Class top: ${scoreText(meta, t.best, report.board)} by ${t.creatureName}.`);
        else if (rows) fill(top, icon("trophy", { size: 16 }), " No class top yet. Yours could be first.");
      });
    }

    const money2 = training
      ? h("div.arc-res-pay", h("small", "Training shift"), h("strong", "No pay"), h("small", "Turn training off to earn coins."))
      : h(
          "div.arc-res-pay",
          h("small", "You earned"),
          h("strong.big-number", money(pay)),
          h("div.arc-extras", h("span.arc-extra", icon("energy", { size: 18 }), ` +${rewards.energy} Energy`))
        );
    const mistakeBox = risky && report.mistakes.length ? h("div.arc-res-mistakes", h("h4", icon("alert", { size: 16 }), ` Risky mode cost ${money(report.mistakes.reduce((s, m) => s + m.cost, 0))}`), h("ul", report.mistakes.map((m) => h("li", `${m.label}: ${money(m.cost)}`)))) : null;
    const firedBox = fired ? h("p.arc-res-fired", { role: "alert" }, icon("lock", { size: 18 }), ` Fired! ${CONFIG.arcade.fireAfter} mistakes in one shift. ${meta.title} is closed to you for ${CONFIG.arcade.cooldownMinutes} minutes.${pay > 0 ? " Your pay for this shift still went into checking." : ""}`) : null;

    // 2.8 The bonus round.
    // No "why" question or recap any more (teacher request 2026-10-26): the
    // results are the summary, the bonus round and the buttons.
    const bonusBox = h("section.arc-bonus");
    if (!training && meta.bonus?.length) {
      const q = AC.pickBonus(meta.bonus, report.seed, play.arcade.recentBonus || []);
      const shown = q.type === "number" ? q : { ...q, ...AC.shuffleChoices(q, report.seed) };
      const go = h("button.arc-bonus-go", { type: "button", onclick: () => ask() }, icon("coins", { size: 20 }), ` Earn ${CONFIG.arcade.bonusCoins} extra coins`);
      fill(bonusBox, go);
      const ask = () => {
        track("arcadeBonusOpen", { game: key, id: q.id });
        const answer = (given) => {
          const right = AC.bonusRight(shown, given);
          play.arcade.recentBonus = [...(play.arcade.recentBonus || []), q.id].slice(-10);
          if (right) {
            run.life = earn(run.life, CONFIG.arcade.bonusCoins, "Arcade bonus round").life;
            sfx.correct();
          } else sfx.error();
          track("arcadeBonus", { game: key, id: q.id, right });
          save("bonus round");
          fill(bonusBox, h("p.arc-bonus-result", { class: right ? "good" : "bad" }, icon(right ? "check" : "alert", { size: 18 }), right ? ` Right! +${money(CONFIG.arcade.bonusCoins)}. ` : " Not this time. ", q.why));
        };
        const cw = calcWidget({ onOpen: () => track("calcOpen", { game: key, kind: "bonus" }), onUse: () => track("calcUse", { game: key, kind: "bonus" }) });
        const tools = h("div.arc-bonus-tools", cw.toggle);
        if (q.type === "number") {
          const input = h("input.arc-bonus-num", { type: "text", inputmode: "decimal", "aria-label": "Your answer" });
          const submit = h("button", { type: "button", onclick: () => input.value.trim() && answer(input.value) }, "Answer");
          input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), submit.click()));
          fill(bonusBox, h("p.arc-bonus-q", q.q), tools, cw.slot, h("div.arc-bonus-row", input, submit), h("small", "One try."));
          input.focus();
        } else {
          fill(bonusBox, h("p.arc-bonus-q", q.q), tools, cw.slot, h("div.arc-bonus-choices", shown.choices.map((c, i) => h("button.arc-bonus-choice", { type: "button", onclick: () => answer(i) }, c))), h("small", "One try."));
          bonusBox.querySelector(".arc-bonus-choice").focus();
        }
      };
    }

    const again = h("button.big.arc-again", { type: "button", "aria-keyshortcuts": "Enter", onclick: () => (setKeys(null), openSettings({ settings, training: false, mode })) }, training ? "Play for real" : "Play again");
    const back = h("button.secondary.arc-done", { type: "button", "aria-keyshortcuts": "Escape", onclick: () => (setKeys(null), el().closest(".panel")?.classList.remove("playing"), onBack()) }, icon("back", { size: 16 }), " Back to the games");
    if (!training && pay > 0) coinsFly(again);

    fill(
      el(),
      h(
        "div.arc-frame.arc-results.arc-v2",
        { class: `skin-${key}` },
        // Play again and Back sit in the marquee, so they're always on screen.
        h("div.arc-marquee", h("h3.arc-title", icon(JOBS[key].mark || "guild", { size: 28 }), ` ${meta.title}: shift over!`), hasGuide(key) ? h("button.arc-guide", { type: "button", onclick: () => openGameGuide(key, { track, tab: "irl" }) }, icon("scroll", { size: 14 }), " Read the guide") : null, h("div.arc-after", back, again)),
        h(
          "div.arc-res-grid",
          h(
            "div.arc-res-main",
            h("div.arc-res-top", h("div.arc-res-score", h("small", metricName(meta, settings)), h("strong.big-number", scoreText(meta, { s: report.score }, report.board)), scoreLine, top), money2),
            firedBox,
            mistakeBox,
            result.reveal ? h("section.arc-reveal", h("h4", meta.revealTitle || "The reveal"), result.reveal) : null
          ),
          !training && meta.bonus?.length ? h("div.arc-res-side", h("h4.arc-bonus-head", icon("coins", { size: 18 }), " Earn more coins"), bonusBox) : null
        )
      )
    );
    again.focus();
    setKeys((e) => {
      if (e.target.closest?.("input, textarea, button, dialog")) return;
      if (e.key === "Enter") (e.preventDefault(), again.click());
      else if (e.key === "Escape") (e.preventDefault(), back.click());
    });
  }

  const el = () => host;
  return {
    open: () => openSettings(),
    stop() {
      setKeys(null);
      running?.stop?.();
    },
  };
}
