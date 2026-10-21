// The kingdom hub (teacher request 2026-10-20): home base for everything.
// Who you're caring for and its dream, this chapter's next step, and the
// illustrated village. Every place opens from here and comes back here.
import { h, add, fill, money, ageLabel, toast } from "../dom.js";
import { creatureSvg } from "../creature-art.js";
import { icon } from "../icons.js";
import { fullName } from "../../data/creatures.js";
import { chapterInfo } from "../../data/chapters.js";
import { CONFIG } from "../../data/config.js";
import { DREAMS, dreamProgress } from "../../data/dreams.js";
import { HUB_HELP } from "../../data/story.js";
import * as P from "../../play.js";
import { placeStatus, nextStep, PLACES, PROLOGUE_TEXT } from "../../places.js";
import { moneyChips } from "../wallet.js";
import { kingdomMap } from "../kingdom-map.js";
import { rankFor } from "../../progress.js";
import { celebrate } from "../celebrate.js";
import { runLesson } from "../guide.js";
import { newUnlocks, prologueStep, PROLOGUE_STEPS, stageOf } from "../../progression.js";

export function render(root, { game, go, track }) {
  const run = game.run;
  const play = run.play;
  const life = run.life;
  const c = game.save.creature;
  const panel = h("section.panel.hub");
  root.append(panel);

  function paint(checking = false) {
    const status = placeStatus({ life, play, creature: c, classInfo: game.classInfo });
    fill(
      panel,
      run.practice
        ? h(
            "div.callout.warn.practice-bar",
            h("strong", `Practice: Chapter ${play.active?.chapter ?? play.chapter}. `),
            "Nothing here is saved. ",
            h(
              "button.small",
              {
                type: "button",
                onclick: () => {
                  game.practice = null;
                  track("practiceLeave", {});
                  root.replaceChildren();
                  render(root, { game, go, track });
                },
              },
              "Leave practice"
            )
          )
        : null,
      h("div.hub-top", guardianCard(), chapterCard(status, checking)),
      moneyChips(life, play),
      kingdomMap({
        creature: c,
        ageMonths: life.ageMonths,
        status,
        home: play.home || [],
        onOpen: (pl) => {
          track("placeOpen", { place: pl.id, status: status[pl.id]?.text || "" });
          if (status[pl.id]?.tone === "locked") return toast(`${pl.name}: ${status[pl.id].text.toLowerCase()}. Keep playing to unlock it!`, "info");
          if (pl.id === "townhall" && !play.active && !play.summary) return startChapter();
          go(pl.route);
        },
      }),
      stageOf(play) === 0 ? null : h("p.note.center.hub-help", HUB_HELP),
      run.practice ? null : recapBox(play, track),
      run.practice ? null : practiceBox(play, game, go, track)
    );
  }

  // Lessons that play on arrival: Sage's welcome in the prologue, then one
  // for each new unlock (js/progression.js). Never in practice.
  function autoLessons() {
    if (run.practice) return;
    const real = game.save.play;
    if (real.prologue && !real.prologue.welcomed) {
      return runLesson({ game, track, id: "welcome", returnTo: "hub", onFinish: () => finishWelcome() });
    }
    const fresh = newUnlocks(real);
    if (!fresh.length) return;
    const last = fresh.at(-1);
    track("unlock", { stage: last.stage });
    game.persist("unlock");
    if (last.lesson) runLesson({ game, track, id: last.lesson, returnTo: "hub" });
    else celebrate({ kind: "unlock", id: String(last.stage), icon: last.icon, kicker: "Something new!", title: last.title, text: last.text });
  }

  async function finishWelcome() {
    game.save.play.prologue.welcomed = true;
    await game.persist("prologueWelcome");
    root.replaceChildren();
    render(root, { game, go, track });
  }

  // Who you're caring for, and how close its dream is.
  function guardianCard() {
    const r = rankFor(play.xp);
    const dream = c.dream ? DREAMS[c.dream] : null;
    const prog = c.dream ? dreamProgress(life, c.dream, play) : null;
    return h(
      "section.guardian",
      h("button.guardian-art", { type: "button", "aria-label": `Open ${c.name}'s cottage`, onclick: () => go("cottage"), html: creatureSvg(c, { size: 96, ageMonths: life.ageMonths, label: "" }) }),
      h(
        "div.guardian-text",
        h("p.step-label", "You are the Guardian of Coin for"),
        h("h1", fullName(c)),
        h("p.muted.tight", `${ageLabel(life.ageMonths)} · ${r.icon} ${r.title} · ${play.xp} XP`),
        dream
          ? h("div.dream-mini", h("span.dream-name", `${dream.icon} Dream: `, h("strong", dream.title)), play.dreamDone ? h("span.good-text", " Done!") : meters(prog))
          : h("button.small", { type: "button", onclick: () => go("dream") }, "Pick your creature's dream")
      )
    );
  }

  // The prologue: Sage's quest box instead of a chapter.
  function prologueCard() {
    const step = prologueStep(play);
    const place = PLACES_BY_ID[step?.place];
    const done = PROLOGUE_STEPS.indexOf(step);
    return h(
      "section.chapter-box.prologue-box",
      { "aria-live": "polite" },
      h("p.step-label", `Prologue: step ${done + 1} of ${PROLOGUE_STEPS.length}`),
      h("h2", "Coins in a jar"),
      h("p.next-step", icon("next", { size: 16 }), " ", PROLOGUE_TEXT[step?.id] || ""),
      h(
        "ol.prologue-steps",
        PROLOGUE_STEPS.map((st, i) => h("li", { class: i < done ? "done" : i === done ? "current" : "" }, i < done ? icon("check", { size: 14 }) : null, ` ${PROLOGUE_LABELS[st.id]}`))
      ),
      place && step.id !== "welcome" ? h("div.row", h("button", { type: "button", onclick: () => go(place.route) }, icon(place.icon, { size: 18 }), ` Go to ${place.name}`)) : null,
      step?.id === "welcome" ? h("div.row", h("button", { type: "button", onclick: () => runLesson({ game, track, id: "welcome", returnTo: "hub", onFinish: () => finishWelcome() }) }, "Meet Sage")) : null
    );
  }

  function chapterCard(status, checking) {
    if (stageOf(play) === 0) return prologueCard();
    const n = play.chapter;
    const info = chapterInfo(play.active?.chapter ?? n, play);
    const label = play.active ? `Chapter ${play.active.chapter}, month ${play.active.monthIndex + 1} of ${play.active.months || CONFIG.pacing.monthsPerChapter}` : `Chapter ${n}`;
    const box = h("section.chapter-box", { "aria-live": "polite" }, h("p.step-label", label), h("h2", info.title), h("p.next-step", icon("next", { size: 16 }), " ", nextStep({ play, classInfo: game.classInfo, status })));
    const released = game.classInfo?.releasedChapter || 1;
    if (play.active || play.summary) add(box, h("div.row", h("button", { type: "button", onclick: () => go("month") }, icon("townhall", { size: 18 }), " Go to Town Hall")));
    else if (game.classInfo?.paused) add(box, h("p.muted", "Play is paused by your teacher."));
    else if (P.canPlay(play, released)) add(box, h("div.row", h("button", { type: "button", onclick: startChapter }, `Start Chapter ${n}`)));
    else {
      add(box, h("div.row", h("button.secondary", { type: "button", disabled: checking, onclick: () => refreshRelease(true) }, checking ? "Checking..." : "Check again")));
      if (game.local) add(box, localRelease(n));
    }
    return box;
  }

  async function startChapter() {
    const n = play.chapter;
    if (run.practice || game.classInfo?.paused || !P.canPlay(play, game.classInfo?.releasedChapter || 1)) return go("month");
    P.startChapter(play, life, game.classInfo?.monthsPerChapter || CONFIG.pacing.monthsPerChapter);
    track("chapterStart", { chapter: n });
    await game.persist("chapterStart");
    go("month");
  }

  // ?local only: stands in for the teacher's release button.
  function localRelease(n) {
    return h(
      "p.note.center",
      "Local test mode: ",
      h(
        "button.link",
        {
          type: "button",
          onclick: async () => {
            await game.db.releaseChapter(game.profile.classId, n);
            refreshRelease(true);
          },
        },
        `release Chapter ${n}`
      )
    );
  }

  async function refreshRelease(manual = false) {
    if (run.practice || play.active || !game.profile.classId) return paint();
    if (manual) paint(true);
    try {
      const cls = await game.db.getClass(game.profile.classId);
      if (cls) game.classInfo = cls;
    } catch (err) {
      console.warn("Could not check the class", err);
    }
    const released = game.classInfo?.releasedChapter || 1;
    track("releaseCheck", { released, chapter: play.chapter, manual });
    if (P.announceChapter(play, released)) {
      const info = chapterInfo(play.chapter, play);
      celebrate({ kind: "chapter", id: String(play.chapter), icon: "📣", kicker: "New chapter unlocked!", title: `Chapter ${play.chapter}: ${info.title}`, text: info.intro });
      await game.persist("chapterOpen");
    }
    paint();
  }

  paint();
  refreshRelease();
  autoLessons();
}

const PLACES_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));
const PROLOGUE_LABELS = { welcome: "Meet Sage", firstShift: "Work a shift", moreShifts: "Work 3 shifts", market: "Visit the Market", cottage: "Visit your Cottage", bank: "Open a bank account" };

// The dream's 3 stages as a track, plus the current stage's goals. Never
// color alone: the words say which stage and how many goals are met.
export function meters(prog) {
  if (!prog) return null;
  const total = prog.stages.length;
  const cur = prog.stage;
  const met = cur ? cur.goals.filter((g) => g.ok).length : 0;
  const text = prog.complete ? "All 3 stages done!" : `Stage ${prog.stageIndex + 1} of ${total}: ${cur.title}. ${met} of ${cur.goals.length} goals met.`;
  return h(
    "span.meters",
    h(
      "span.stage-track",
      { role: "img", "aria-label": text },
      prog.stages.map((st) => {
        const share = st.done ? 1 : st.current ? st.goals.reduce((s, g) => s + g.share, 0) / st.goals.length : 0;
        return h("span.stage-seg", { class: st.done ? "done" : st.current ? "current" : "" }, h("span", { style: { width: `${Math.round(share * 100)}%` } }));
      })
    ),
    h("small.stage-text", { "aria-hidden": "true" }, text)
  );
}

let recapTracked = false;

// "Previously on..." (decision #3): built from saved month records and the
// last chapter summary, no extra storage.
function recapBox(play, track) {
  const r = P.recap(play);
  if (!r) return null;
  if (!recapTracked) {
    track("recapShown", { chapter: play.chapter });
    recapTracked = true;
  }
  const lines = [];
  if (r.last) {
    const s = r.last;
    const delta = s.endScore != null && s.startScore != null ? s.endScore - s.startScore : null;
    lines.push(
      h(
        "p",
        h("strong", `Chapter ${s.chapter}: ${s.title}. `),
        s.endScore == null
          ? "You were still building history for a first score."
          : delta == null
            ? `You earned your first score: ${s.endScore}.`
            : `Your score went from ${s.startScore} to ${s.endScore} (${delta >= 0 ? "+" : ""}${delta}).`,
        ` Checking went from ${money(s.startChecking)} to ${money(s.endChecking)}.`
      )
    );
    if (s.best) lines.push(h("p", `👍 Best move: ${P.titled(s.best.title)}"${s.best.label}"`));
    if (s.worst) lines.push(h("p", `👎 Toughest moment: ${P.titled(s.worst.title)}"${s.worst.label}"`));
  }
  const months = r.current ? r.current.records : r.last?.records || [];
  const last = months.at(-1);
  if (last) lines.push(h("p", `Last End Month: ${last.change}`));
  return h("details.callout.recap", h("summary", h("strong", "Previously on your creature's life...")), lines);
}

function practiceBox(play, game, go, track) {
  if (!play.history.length) return null;
  return h(
    "section.practice-box",
    h("h3", icon("scroll", { size: 18 }), " Practice an earlier chapter"),
    h("p.note.tight", "Replay a chapter from its start and try different choices. Practice never changes your real game."),
    h(
      "div.row",
      play.history.map((s) =>
        h(
          "button.secondary",
          {
            type: "button",
            onclick: () => {
              const p = P.startPractice(game.save, s.chapter);
              if (!p) return;
              game.startPractice(p);
              track("practiceStart", { chapter: s.chapter });
              go("month");
            },
          },
          `Chapter ${s.chapter}: ${s.title}`
        )
      )
    )
  );
}
