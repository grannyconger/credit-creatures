// Sound effects: real CC0 audio files (sounds/, credits in sounds/CREDITS.md)
// played with Howler.js (js/vendor/howler.core.min.js). Off by default, since
// students may be in a quiet classroom. A student turns them on with the
// speaker in the top bar or in settings, and the teacher can mute the whole
// class (classes/{id}.sound).
//
// Every sound in the game goes through one named event:
//   sfx.tap()  sfx.coinGain()  sfx.coinLoss()  sfx.levelUp()  sfx.questComplete()
//   sfx.chestOpen()  sfx.purchase()  sfx.error()  sfx.creditScoreUp()
//   sfx.creditScoreDown()  sfx.cardFlip()  sfx.correct()  sfx.stamp()
//   sfx.tapToPay()
import { loadLocalSettings } from "./settings.js";

const FORMATS = ["ogg", "m4a"];

// Master volume. Reduced motion is taken as a hint to keep audio quieter too.
export const MASTER_VOLUME = 0.4;
export const CALM_VOLUME = 0.25;
// Each repeat plays up to 5% higher or lower so it doesn't get tiring.
export const PITCH_SPREAD = 0.05;

// file: in sounds/ (.ogg, with .m4a for older Safari, or the formats list for a sound
// that comes as an .mp3). volume: relative to
// the master. gap: the shortest time in ms between two plays of this event.
// calm: false skips it under Calm motion or reduce motion (small UI sounds).
export const EVENTS = {
  tap: { file: "tap", volume: 0.5, gap: 90, calm: false },
  coinGain: { file: "coin-gain", volume: 0.8, gap: 250 },
  coinLoss: { file: "coin-loss", volume: 0.7, gap: 250 },
  levelUp: { file: "level-up", volume: 0.9, gap: 1200 },
  questComplete: { file: "quest-complete", volume: 0.9, gap: 1000 },
  chestOpen: { file: "chest-open", volume: 0.8, gap: 800 },
  purchase: { file: "purchase", volume: 0.8, gap: 500 },
  error: { file: "error", volume: 0.6, gap: 400 },
  creditScoreUp: { file: "score-up", volume: 0.8, gap: 600 },
  creditScoreDown: { file: "score-down", volume: 0.8, gap: 600 },
  cardFlip: { file: "card-flip", volume: 0.6, gap: 200, calm: false },
  correct: { file: "correct", volume: 0.7, gap: 300 },
  stamp: { file: "stamp", volume: 0.7, gap: 300 },
  // The Apple Pay style chime after a tap to pay (sounds/apple-pay.mp3, supplied by the teacher).
  tapToPay: { file: "apple-pay", formats: ["mp3"], volume: 0.8, gap: 1600 },
  // The Battle Arena's sounds, supplied by the teacher on 2026-10-26.
  attackLanded: { file: "attack-landed", formats: ["m4a"], volume: 0.9, gap: 120 },
  attackLanded2: { file: "attack-landed-2", formats: ["m4a"], volume: 0.95, gap: 120 },
};

// Music loops (Battle Arena, 2026-10-26), streamed one at a time and only while
// sound is on: battleConfig in the Arena lobby, one of battleBg picked for each
// bout, and battleEnd played once when a bout ends.
export const MUSIC = {
  battleEnd: "battle-end",
  battleConfig: "battle-config",
  battleBg1: "battle-bg-1",
  battleBg2: "battle-bg-2",
  battleBg3: "battle-bg-3",
  battleBg4: "battle-bg-4",
  battleBg5: "battle-bg-5",
};
export const BATTLE_TRACKS = ["battleBg1", "battleBg2", "battleBg3", "battleBg4", "battleBg5"];
const MUSIC_VOLUME = 0.35;

export const SOUND_EVENTS = Object.keys(EVENTS);

let classMuted = false;

// The teacher's master switch. Called when the class doc loads.
export function setClassMuted(muted) {
  if (classMuted === Boolean(muted)) return;
  classMuted = Boolean(muted);
  globalThis.dispatchEvent?.(new CustomEvent("cc:settings"));
}

export function classIsMuted() {
  return classMuted;
}

export function soundOn() {
  return !classMuted && loadLocalSettings().sound === "on";
}

const calm = () =>
  loadLocalSettings().motion === "calm" || Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// A playback rate within the pitch spread. rand is in [0, 1).
export function pitchFor(rand = Math.random()) {
  return 1 + (rand * 2 - 1) * PITCH_SPREAD;
}

// Throttle: false when this event played less than its gap ago.
const lastPlayed = new Map();
export function allowPlay(name, now = Date.now()) {
  const ev = EVENTS[name];
  if (!ev) return false;
  const last = lastPlayed.get(name);
  if (last != null && now - last < ev.gap) return false;
  lastPlayed.set(name, now);
  return true;
}

// Howler loads only after the student's first tap or key press, and only when
// sound is on, so browsers never block it (autoplay rules) and a muted game
// downloads nothing.
let loading = null;
let howls = null;

function load() {
  if (loading) return loading;
  loading = import("../vendor/howler.core.min.js")
    .then(() => {
      const { Howl, Howler } = globalThis;
      if (!Howl) throw new Error("Howler did not load");
      Howler.volume(calm() ? CALM_VOLUME : MASTER_VOLUME);
      howls = {};
      for (const [name, ev] of Object.entries(EVENTS)) {
        const base = new URL(`../../sounds/${ev.file}`, import.meta.url).href;
        howls[name] = new Howl({ src: (ev.formats || FORMATS).map((ext) => `${base}.${ext}`), volume: ev.volume, preload: true });
      }
      return howls;
    })
    .catch((err) => {
      // Sound is a nice extra. Never let it break the game.
      console.warn("Sound effects unavailable", err);
      loading = null;
      return null;
    });
  return loading;
}

// Call after the sound or motion setting changes.
export function refreshSound() {
  if (!soundOn()) {
    if (howls) Object.values(howls).forEach((s) => s.stop());
    dropTune();
    return;
  }
  if (howls) globalThis.Howler?.volume(calm() ? CALM_VOLUME : MASTER_VOLUME);
  else load();
  if (wanted && !tune) startTune(wanted);
}

// ---------- Music ----------

let wanted = null;
let tune = null;

function dropTune(fade = 400) {
  const t = tune;
  tune = null;
  if (!t) return;
  try {
    t.fade(t.volume(), 0, fade);
    setTimeout(() => t.unload(), fade + 50);
  } catch {
    // Sound is a nice extra. Never let it break the game.
  }
}

function startTune(name, loop = true) {
  if (!soundOn() || !MUSIC[name]) return;
  load().then((hs) => {
    if (!hs || wanted !== name || tune || !soundOn()) return;
    try {
      const src = new URL(`../../sounds/${MUSIC[name]}.m4a`, import.meta.url).href;
      tune = new globalThis.Howl({ src: [src], loop, html5: true, volume: 0 });
      if (!loop) tune.once("end", () => wanted === name && (wanted = null));
      tune.play();
      tune.fade(0, MUSIC_VOLUME, 800);
    } catch {
      tune = null;
    }
  });
}

// music.play("battleConfig") swaps to that loop (a no-op if it's already on).
// music.stop() fades it out. Both are safe to call with sound off.
export const music = {
  play(name) {
    if (wanted === name && tune) return;
    dropTune();
    wanted = name;
    startTune(name);
  },
  // Plays a track once (battleEnd), cutting off whatever loop was on.
  once(name) {
    dropTune(200);
    wanted = name;
    startTune(name, false);
  },
  stop(fade) {
    wanted = null;
    dropTune(fade);
  },
};

function unlock() {
  if (soundOn()) load();
  if (soundOn() && wanted && !tune) startTune(wanted);
}
if (typeof document !== "undefined") {
  for (const type of ["pointerdown", "keydown"]) document.addEventListener(type, unlock, { capture: true, passive: true });
  // applySettings (js/ui/settings.js) announces every change.
  globalThis.addEventListener("cc:settings", refreshSound);
}

function play(name) {
  if (!soundOn()) return;
  const ev = EVENTS[name];
  if (!ev || (ev.calm === false && calm())) return;
  if (!allowPlay(name)) return;
  // Not loaded yet (the very first tap, or sound just turned on): play once it is.
  if (howls) playNow(name);
  else load().then((hs) => hs && playNow(name));
}

function playNow(name) {
  try {
    const s = howls[name];
    // Never stack the same sound: a new play cuts off the one still ringing.
    s.stop();
    const id = s.play();
    s.rate(pitchFor(), id);
  } catch {
    // Sound is a nice extra. Never let it break the game.
  }
}

export const sfx = Object.fromEntries(SOUND_EVENTS.map((name) => [name, () => play(name)]));
