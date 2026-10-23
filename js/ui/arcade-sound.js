// Each Arcade game has its own sound effects (teacher request 2026-10-23),
// made with the Web Audio API so there are no files to download. A game plays
// the same three moments as before (right, wrong, shift done) and this file
// decides how they sound: a typewriter in Ledger Sort, a ka-ching in Cashier
// Rush, an ATM beep in Spot the Overdraft, and so on. Everything else (taps,
// rewards) still uses sfx from sound.js. Off unless the student turned sound
// on, quieter under Calm motion, and never able to break the game.
import { sfx as base, soundOn } from "./sound.js";
import { loadLocalSettings } from "./settings.js";

let ctx = null;
let voice = null;
let master = null;

export function setArcadeVoice(key) {
  voice = key;
}

const calm = () => loadLocalSettings().motion === "calm" || Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

function audio() {
  try {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    master.gain.value = calm() ? 0.25 : 0.5;
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// A tone. slide moves the pitch to another frequency over its length.
function tone(freq, dur, { type = "sine", vol = 0.25, slide = null, at = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

// A burst of noise through a filter: clicks, paper, static, shutters.
function noise(dur, { vol = 0.2, at = 0, filter = "highpass", freq = 2000 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const n = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, n, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

const arp = (notes, step, opts) => notes.forEach((n, i) => tone(n, 0.18, { ...opts, at: i * step }));

// right, wrong and done for each game.
export const VOICES = {
  // A typewriter clack, then a margin bell.
  ledger: {
    right: () => (noise(0.04, { vol: 0.3, freq: 2500 }), tone(190, 0.05, { type: "square", vol: 0.12 }), tone(1568, 0.25, { vol: 0.14, at: 0.05 })),
    wrong: () => (tone(110, 0.18, { type: "triangle", vol: 0.3 }), noise(0.08, { filter: "lowpass", freq: 600, vol: 0.3 })),
    done: () => arp([1046, 1318, 1568, 2093], 0.09, { vol: 0.14 }),
  },
  // Ka-ching, and a coin cascade at the end.
  cashier: {
    right: () => (tone(1318, 0.09, { vol: 0.2 }), tone(1976, 0.3, { vol: 0.2, at: 0.09 }), noise(0.03, { vol: 0.15, at: 0 })),
    wrong: () => tone(140, 0.25, { type: "sawtooth", vol: 0.2 }),
    done: () => arp([1568, 1760, 1976, 2349, 2637, 3136], 0.06, { type: "triangle", vol: 0.12 }),
  },
  // A pen stroke and a stamp.
  checks: {
    right: () => (tone(90, 0.14, { slide: 60, vol: 0.4 }), noise(0.08, { filter: "lowpass", freq: 700, vol: 0.25 })),
    wrong: () => [0, 0.05, 0.1].forEach((at) => noise(0.05, { at, filter: "bandpass", freq: 2200, vol: 0.2 })),
    done: () => tone(400, 0.5, { slide: 1300, type: "triangle", vol: 0.16 }),
  },
  // ATM beeps and an alarm.
  overdraft: {
    right: () => tone(880, 0.07, { type: "square", vol: 0.1 }),
    wrong: () => [440, 330, 440, 330].forEach((f, i) => tone(f, 0.11, { type: "square", vol: 0.12, at: i * 0.11 })),
    done: () => arp([660, 880, 1320], 0.1, { type: "square", vol: 0.1 }),
  },
  // The chunk of an adding machine.
  register: {
    right: () => (noise(0.04, { vol: 0.3, freq: 1800 }), tone(220, 0.05, { type: "square", vol: 0.1 }), tone(330, 0.06, { type: "square", vol: 0.1, at: 0.05 })),
    wrong: () => [0, 0.14].forEach((at) => tone(300, 0.1, { type: "sawtooth", vol: 0.15, at })),
    done: () => Array.from({ length: 8 }, (_, i) => noise(0.025, { at: i * 0.05, vol: 0.2, freq: 1500 + i * 250 })),
  },
  // A radar ping and a burst of static.
  checkhunt: {
    right: () => tone(1200, 0.35, { slide: 800, vol: 0.2 }),
    wrong: () => noise(0.14, { vol: 0.25, freq: 800 }),
    done: () => [0, 0.15, 0.3].forEach((at, i) => tone(900 + i * 200, 0.3, { slide: 600 + i * 150, vol: 0.14, at })),
  },
  // Tumblers clicking, a heavy clunk, a vault opening.
  drawer: {
    right: () => (noise(0.02, { vol: 0.35, freq: 3000 }), noise(0.02, { at: 0.07, vol: 0.35, freq: 3000 }), tone(600, 0.04, { type: "triangle", vol: 0.1, at: 0.07 })),
    wrong: () => (tone(70, 0.25, { vol: 0.45 }), noise(0.1, { filter: "lowpass", freq: 500, vol: 0.3 })),
    done: () => (tone(80, 0.6, { slide: 200, vol: 0.3 }), tone(880, 0.6, { type: "triangle", vol: 0.12, at: 0.3 })),
  },
  // A store scanner beep and a buzzer.
  unitprice: {
    right: () => (tone(1500, 0.06, { vol: 0.15 }), tone(1500, 0.06, { vol: 0.15, at: 0.09 })),
    wrong: () => tone(200, 0.28, { type: "square", vol: 0.14 }),
    done: () => arp([523, 659, 784, 1046], 0.08, { type: "square", vol: 0.09 }),
  },
  // A camera shutter, a DENIED stamp, a noir sting.
  fees: {
    right: () => (noise(0.03, { vol: 0.3, freq: 3000, filter: "bandpass" }), noise(0.05, { at: 0.07, vol: 0.25, freq: 3000, filter: "bandpass" })),
    wrong: () => (tone(70, 0.16, { vol: 0.4 }), noise(0.1, { filter: "lowpass", freq: 600, vol: 0.3 })),
    done: () => arp([262, 311, 392], 0.22, { vol: 0.18 }),
  },
};

const MOMENT = { correct: "right", error: "wrong", questComplete: "done" };

function play(name) {
  const v = voice && VOICES[voice];
  const moment = MOMENT[name];
  if (v && moment && soundOn()) {
    try {
      v[moment]();
    } catch {
      // Sound is a nice extra. Never let it break the game.
    }
    return;
  }
  base[name]?.();
}

// Same names as sound.js, so a game only changes its import.
export const sfx = new Proxy(base, { get: (_, name) => () => play(name) });
