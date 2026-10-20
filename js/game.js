// The signed-in student's game: profile, save and the onboarding step.
import { LIFE_VERSION } from "./engine/index.js";
import { track, flush } from "./telemetry.js";
import { toast } from "./ui/dom.js";

// Onboarding steps in order (SPEC §5). Phase 4 adds the hub after "done".
export const STEPS = ["profile", "creature", "join", "teen", "tutorial", "skip", "networks", "design", "result", "done"];

// Steps a student can go back to after moving past them.
export const EDITABLE = new Set(["profile", "creature"]);

export function createGame(user, db) {
  const game = {
    user,
    db,
    profile: { displayName: "", classId: "" },
    classInfo: null,
    save: { creature: null, onboarding: { step: "profile" }, chapter: 1, life: null },
    returning: false,

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
        game.save = { creature: save.creature || null, onboarding: save.onboarding || { step: "profile" }, chapter: save.chapter || 1, life: save.life || null };
        game.returning = true;
      }
      if (game.profile.classId) game.classInfo = await db.getClass(game.profile.classId).catch(() => null);
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
