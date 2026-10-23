// Play telemetry (docs/FEEDBACK.md). Events wait in memory and go out in one
// write with each save. No personal info is ever logged here.
import { CONFIG } from "./data/config.js";

const MAX_QUEUE = 200;
const RECENT = 20;

const state = {
  queue: [],
  recent: [],
  sessionId: Math.random().toString(36).slice(2, 10),
  sessionStart: Date.now(),
  lastFlush: Date.now(),
  flushedOnce: false,
  errors: 0,
  screen: null,
  screenStart: Date.now(),
  sink: null,
  context: () => ({}),
};

// sink(batchDoc, rollup) writes to Firestore. context() adds month and chapter.
export function initTelemetry({ sink, context }) {
  state.sink = sink;
  if (context) state.context = context;
}

// Other parts of the game can listen to events, for example the daily
// challenges (js/challenges.js). A listener that throws never breaks play.
const listeners = [];
export function onTrack(fn) {
  listeners.push(fn);
}

export function track(type, data = {}) {
  // The event's own fields go last, so data can never overwrite its type.
  const e = { ...flat(data), t: Math.round((Date.now() - state.sessionStart) / 1000), type, screen: state.screen };
  state.queue.push(e);
  if (state.queue.length > MAX_QUEUE) state.queue.shift();
  state.recent.push(e);
  if (state.recent.length > RECENT) state.recent.shift();
  for (const fn of listeners) {
    try {
      fn(type, data);
    } catch (err) {
      console.warn("track listener", err);
    }
  }
}

// Logs how long the last screen was open, then starts timing the new one.
export function screenView(name) {
  if (state.screen === name) return;
  if (state.screen) track("screenTime", { name: state.screen, seconds: secondsOn() });
  state.screen = name;
  state.screenStart = Date.now();
  track("screenView", { name });
}

export function currentScreen() {
  return state.screen;
}

export function secondsOn() {
  return Math.round((Date.now() - state.screenStart) / 1000);
}

export function recentEvents() {
  return state.recent.slice();
}

export function sessionId() {
  return state.sessionId;
}

export async function flush(reason = "save") {
  if (!state.sink || state.queue.length === 0) return;
  const events = state.queue.splice(0);
  const now = Date.now();
  const rollup = {
    newSession: !state.flushedOnce,
    seconds: Math.round((now - state.lastFlush) / 1000),
    errors: events.filter((e) => e.type === "error").length,
    lastScreen: state.screen || "",
  };
  try {
    await state.sink({ sessionId: state.sessionId, reason, ...state.context(), events }, rollup);
    state.flushedOnce = true;
    state.lastFlush = now;
  } catch (err) {
    // Put them back so the next save tries again.
    state.queue.unshift(...events.slice(-(MAX_QUEUE - state.queue.length)));
    console.warn("Telemetry flush failed", err);
  }
}

// Calls back once the session reaches the length in config (SPEC §9).
export function onSessionNudge(callback) {
  const ms = CONFIG.pacing.sessionMinutes * 60 * 1000;
  setTimeout(() => {
    track("sessionNudge", { minutes: CONFIG.pacing.sessionMinutes });
    callback();
  }, ms);
}

export function captureErrors() {
  window.addEventListener("error", (e) => {
    track("error", { message: String(e.message).slice(0, 200), source: shortSource(e.filename), line: e.lineno || 0 });
  });
  window.addEventListener("unhandledrejection", (e) => {
    track("error", { message: String(e.reason?.message || e.reason).slice(0, 200), source: "promise" });
  });
}

function shortSource(url = "") {
  return String(url).split("/").slice(-2).join("/");
}

// Firestore-safe: flat scalars only, short strings.
function flat(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v == null) continue;
    if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else out[k] = String(typeof v === "object" ? JSON.stringify(v) : v).slice(0, 200);
  }
  return out;
}
