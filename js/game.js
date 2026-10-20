// The signed-in student's game: profile, save and the onboarding step.
import { LIFE_VERSION } from "./engine/index.js";
import { track, flush } from "./telemetry.js";
import { toast } from "./ui/dom.js";
import { newPlay, ensurePlay } from "./play.js";
import { evaluate, rankFor } from "./progress.js";
import { celebrate } from "./ui/celebrate.js";
import { fullName } from "./data/creatures.js";

// Onboarding steps in order (SPEC §5). After "done", students live in the hub.
export const STEPS = ["profile", "creature", "join", "teen", "tutorial", "skip", "networks", "design", "result", "done", "hub"];

// Screens open once the student reaches the hub. The router guards each one.
export const HUB_SCREENS = new Set(["hub", "month", "chapterEnd", "accounts", "shop", "trophies"]);

// Steps a student can go back to after moving past them.
export const EDITABLE = new Set(["profile", "creature"]);

export function createGame(user, db) {
  const game = {
    user,
    db,
    profile: { displayName: "", classId: "" },
    classInfo: null,
    save: { creature: null, onboarding: { step: "profile" }, chapter: 1, life: null, play: null },
    returning: false,
    // Practice mode (SPEC §5): { practice: true, life, play } kept in memory only.
    practice: null,

    get life() {
      return game.save.life;
    },
    set life(life) {
      game.save.life = life;
    },
    get step() {
      return game.save.onboarding.step;
    },
    get ob() {
      return game.save.onboarding;
    },

    async load() {
      const [profile, save] = await Promise.all([db.loadProfile(user.uid), db.loadSave(user.uid)]);
      game.profile = { displayName: profile?.displayName || user.displayName || "", classId: profile?.classId || "" };
      if (save) {
        game.save = {
          creature: save.creature || null,
          onboarding: save.onboarding || { step: "profile" },
          chapter: save.chapter || 1,
          life: save.life || null,
          play: save.play || null,
        };
        game.returning = true;
      }
      if (game.profile.classId) game.classInfo = await db.getClass(game.profile.classId).catch(() => null);
    },

    get play() {
      if (!game.save.play) game.save.play = newPlay();
      return ensurePlay(game.save.play);
    },

    // What the month and chapter screens play on: the real save, or a
    // practice copy that is never written.
    get run() {
      if (game.practice) return game.practice;
      return {
        practice: false,
        get life() {
          return game.life;
        },
        set life(v) {
          game.life = v;
        },
        get play() {
          return game.play;
        },
        persist: (reason) => game.persist(reason),
      };
    },

    startPractice(practice) {
      game.practice = {
        practice: true,
        chapter: practice.play.chapter,
        life: practice.life,
        play: practice.play,
        persist: async (reason) => flush(reason),
      };
    },

    summary() {
      const life = game.life;
      return {
        classId: game.profile.classId || "",
        // Lets the class's teacher find this save (firestore.rules checks it).
        teacherEmail: game.classInfo?.teacherEmail || "",
        studentEmail: (user.email || "").toLowerCase(),
        studentName: (user.displayName || "").slice(0, 100),
        displayName: (game.profile.displayName || "").slice(0, 30),
        xp: game.save.play?.xp ?? 0,
        creatureName: game.save.creature?.name || "",
        step: game.step,
        score: life?.score ?? null,
        month: life?.month ?? -1,
        ageMonths: life?.ageMonths ?? 0,
        engineVersion: LIFE_VERSION,
      };
    },

    // Saves the game and sends telemetry in the same moment. New achievements
    // are checked first, so their XP is in the same save.
    async persist(reason = "save") {
      if (game.step === "hub" && game.save.life) {
        const earned = evaluate(game.save);
        for (const a of earned) track("achievement", { id: a.id, xp: a.xp, reason });
        const after = rankFor(game.play.xp);
        const pops = earned.map((a) => ({ kind: "achievement", id: a.id, icon: a.icon, kicker: "Achievement unlocked!", title: a.title, text: a.how, xp: a.xp }));
        // XP also comes from answers and shifts between saves, so compare with the last rank shown.
        if (after.level > game.play.rankSeen) {
          game.play.rankSeen = after.level;
          pops.push({ kind: "rank", id: after.title, icon: after.icon, kicker: "New rank!", title: `You're a ${after.title} now`, text: after.next ? `Next up: ${after.next.icon} ${after.next.title} at ${after.next.xp} XP.` : "That's the top rank in the kingdom." });
        }
        if (pops.length) celebrate(pops);
      }
      let ok = true;
      try {
        await db.writeSave(user.uid, game.save, game.summary());
      } catch (err) {
        ok = false;
        console.error(err);
        track("saveFailed", { reason, code: err.code || "" });
        toast("We couldn't save just now. Check your internet. We will try again at the next save.", "bad");
      }
      flush(reason);
      if (ok) game.syncLeaderboard();
      return ok;
    },

    // One small write when XP changes, so classmates see it (SPEC §16).
    boardXp: null,
    async syncLeaderboard() {
      const play = game.save.play;
      const c = game.save.creature;
      if (!play || !c || !game.profile.classId || play.xp === game.boardXp) return;
      try {
        await db.writeLeaderboard(game.profile.classId, user.uid, {
          creatureName: (fullName(c) || "Creature").slice(0, 41),
          displayName: (game.profile.displayName || "").slice(0, 30),
          xp: play.xp,
          rank: rankFor(play.xp).title,
          species: c.species,
          palette: c.palette,
        });
        game.boardXp = play.xp;
      } catch (err) {
        console.warn("Leaderboard update failed", err);
        track("leaderboardFailed", { code: err.code || "" });
      }
    },
  };
  return game;
}
