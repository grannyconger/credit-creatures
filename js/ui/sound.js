// Sound effects (SPEC visual plan item 9), made with the Web Audio API so there
// are no audio files to download. Off by default. A student turns them on in
// settings, and the teacher can mute the whole class (classes/{id}.sound).
//   sound("click" | "coin" | "fanfare" | "stamp" | "flip" | "whoosh" | "oops")
import { loadLocalSettings } from "./settings.js";

let ctx = null;
let classMuted = false;

// The teacher's master switch. Called when the class doc loads.
export function setClassMuted(muted) {
  classMuted = Boolean(muted);
}

export function classIsMuted() {
  return classMuted;
}

export function soundOn() {
  return !classMuted && loadLocalSettings().sound === "on";
}

function audio() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// One soft note: frequency in Hz, start offset and length in seconds.
function tone(a, { freq, start = 0, dur = 0.15, type = "sine", gain = 0.12, slide = 0 }) {
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// A short burst of filtered noise (paper and stamps).
function noise(a, { start = 0, dur = 0.12, gain = 0.15, freq = 900 }) {
  const t = a.currentTime + start;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(t);
}

const SOUNDS = {
  click: (a) => tone(a, { freq: 660, dur: 0.05, type: "triangle", gain: 0.05 }),
  coin: (a) => {
    tone(a, { freq: 988, dur: 0.12, type: "square", gain: 0.05 });
    tone(a, { freq: 1319, start: 0.08, dur: 0.3, type: "square", gain: 0.05 });
  },
  fanfare: (a) => {
    [523, 659, 784].forEach((f, i) => tone(a, { freq: f, start: i * 0.11, dur: 0.16, type: "triangle", gain: 0.1 }));
    tone(a, { freq: 1047, start: 0.33, dur: 0.5, type: "triangle", gain: 0.12 });
    tone(a, { freq: 784, start: 0.33, dur: 0.5, type: "sine", gain: 0.06 });
  },
  stamp: (a) => {
    noise(a, { dur: 0.09, gain: 0.35, freq: 500 });
    tone(a, { freq: 140, dur: 0.12, type: "sine", gain: 0.18, slide: -60 });
  },
  flip: (a) => noise(a, { dur: 0.16, gain: 0.12, freq: 2400 }),
  whoosh: (a) => tone(a, { freq: 300, dur: 0.25, type: "sine", gain: 0.06, slide: 500 }),
  oops: (a) => {
    tone(a, { freq: 392, dur: 0.14, type: "triangle", gain: 0.08 });
    tone(a, { freq: 330, start: 0.12, dur: 0.22, type: "triangle", gain: 0.08 });
  },
};

export function sound(name) {
  if (!soundOn()) return;
  const a = audio();
  if (!a || !SOUNDS[name]) return;
  try {
    SOUNDS[name](a);
  } catch {
    // Sound is a nice extra. Never let it break the game.
  }
}

export const SOUND_NAMES = Object.keys(SOUNDS);
