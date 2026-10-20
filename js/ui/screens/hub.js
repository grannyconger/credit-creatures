// The hub (SPEC §5): home base after Chapter 1. The creature, the digital
// wallet, the next chapter (if the teacher released it), a recap and practice.
import { h, add, fill, money, ageLabel } from "../dom.js";
import { creatureSvg } from "../creature-art.js";
import { fullName } from "../../data/creatures.js";
import { chapterInfo } from "../../data/chapters.js";
import { CONFIG } from "../../data/config.js";
import * as P from "../../play.js";
import { moneyChips, walletStrip } from "../wallet.js";

export function render(root, { game, go, track, saveAndQuit }) {
  game.practice = null;
  const play = game.play;
  const life = game.life;
  const c = game.save.creature;
  const chapterBox = h("section.chapter-box", { "aria-live": "polite" });

  function paintChapter(checking = false) {
    fill(chapterBox);
    const n = play.chapter;
    const info = chapterInfo(n);
    if (play.active) {
      add(
        chapterBox,
        h("p.step-label", `Chapter ${n}`),
        h("h2", info.title),
        h("p", `Month ${play.active.monthIndex + 1} of ${CONFIG.pacing.monthsPerChapter} is waiting for you.`),
        h("div.row", h("button.big", { type: "button", onclick: () => go("month") }, `Continue Chapter ${n}`))
      );
      return;
    }
    const released = game.classInfo?.releasedChapter || 1;
    if (P.canPlay(play, released)) {
      const btn = h("button.big", { type: "button" }, `Start Chapter ${n}`);
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        P.startChapter(play, game.life);
        track("chapterStart", { chapter: n });
        await game.persist("chapterStart");
        go("month");
      });
      add(chapterBox, h("p.step-label", `Chapter ${n} is open`), h("h2", info.title), h("p", info.intro), h("div.row", btn));
    } else {
      const again = h("button.secondary", { type: "button", disabled: checking }, checking ? "Checking..." : "Check again");
      again.addEventListener("click", () => refreshRelease(true));
      add(
        chapterBox,
        h("p.step-label", `Chapter ${n}`),
        h("h2", "⏳ Waiting for your teacher"),
        h("p", `Chapter ${n} opens when your teacher releases it. Everyone in your class moves forward together.`),
        h("div.row", again),
        game.local ? localRelease(n) : null
      );
    }
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
    if (play.active || !game.profile.classId) return paintChapter();
    if (manual) paintChapter(true);
    try {
      const cls = await game.db.getClass(game.profile.classId);
      if (cls) game.classInfo = cls;
    } catch (err) {
      console.warn("Could not check the class", err);
    }
    track("releaseCheck", { released: game.classInfo?.releasedChapter || 1, chapter: play.chapter, manual });
    paintChapter();
  }

  root.append(
    h(
      "section.panel.hub",
      h(
        "div.hero",
        h("div.hero-art", { html: creatureSvg(c, { size: 150 }) }),
        h("div", h("p.step-label", "Your hub"), h("h1", fullName(c)), h("p.muted", `${ageLabel(life.ageMonths)}. Chapter ${play.chapter}.`))
      ),
      moneyChips(life),
      chapterBox,
      recapBox(play, track),
      walletStrip(life, c),
      practiceBox(play, game, go, track),
      h(
        "div.row",
        h("button.secondary", { type: "button", onclick: () => go("creature") }, "Edit my creature"),
        h("button.secondary", { type: "button", onclick: () => go("profile") }, "Edit my name"),
        h("button", { type: "button", onclick: saveAndQuit }, "Save and quit")
      )
    )
  );
  paintChapter();
  refreshRelease();
}

let recapTracked = false;

// "Previously on your credit life..." (decision #3): built from saved month
// records and the last chapter summary, no extra storage.
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
  if (last) lines.push(h("p", `🌙 Last End Month: ${last.change}`));
  return h("section.callout.recap", h("h3", "📜 Previously on your credit life..."), lines);
}

function practiceBox(play, game, go, track) {
  if (!play.history.length) return null;
  return h(
    "section.practice-box",
    h("h3", "🔁 Practice an earlier chapter"),
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
