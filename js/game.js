// The signed-in student's game: profile, save and the onboarding step.
import { LIFE_VERSION } from "./engine/index.js";
import { track, flush } from "./telemetry.js";
import { toast } from "./ui/dom.js";
import { newPlay } from "./play.js";

// Onboarding steps in order (SPEC §5). After "done", students live in the hub.
export const STEPS = ["profile", "creature", "join", "teen", "tutorial", "skip", "networks", "design", "result", "done", "hub"];

// Screens open once the student reaches the hub. The router guards each one.
export const HUB_SCREENS = new Set(["hub", "month", "chapterEnd"]);

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
      return game.save.play;
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
        creatureName: game.save.creature?.name || "",
        step: game.step,
        score: life?.score ?? null,
        month: life?.month ?? -1,
        ageMonths: life?.ageMonths ?? 0,
        engineVersion: LIFE_VERSION,
      };
    },

    // Saves the game and sends telemetry in the same moment.
    async persist(reason = "save") {
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
      return ok;
    },
  };
  return game;
}
