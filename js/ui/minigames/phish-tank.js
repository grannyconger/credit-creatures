// Phish Tank (GAME-SPECS.md game 5): a phone that won't stop buzzing. Trust,
// Block or Verify each message before it expires. Rules: js/arcade/phish.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import * as F from "../../arcade/phish.js";
import { PHISH_FLAG_LABEL, PHISH_SAMPLE } from "../../data/arcade/phish.js";
import { keyHelp, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

// The sender's name without a trailing period, so sentences don't end in "..".
const senderText = (m) => m.sender.map((p) => p.text).join("").replace(/\.$/, "");
const bodyText = (m) => m.text.map((p) => p.text).join("");

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.phish;
  const s = F.newState(F.newShift(seed, { timed }));
  let t0 = 0;
  let paused = 0;
  let pauseAt = 0;
  let sel = null;
  let busy = null; // "verify" | "flags"
  let over = false;
  let tick = null;
  const coached = new Set();
  const now = () => (pauseAt ? pauseAt : Date.now()) - t0 - paused;

  const root = h("div.minigame.phish");
  const phone = h("section.ph-phone", { "aria-label": "Your phone" });
  const side = h("section.ph-side");
  const ring = timed ? timerRing({ label: "Time left in the shift" }) : null;

  // ---------- Skill moment ----------
  function skillMoment() {
    const chunks = ["Chase:", "your card is frozen.", "Unlock it now at", PHISH_SAMPLE.flag];
    const box = h("div.ph-skill");
    const pick = (i) => {
      const right = chunks[i] === PHISH_SAMPLE.flag;
      ctx.track("skillMoment", { game: "phish", right });
      (right ? sfx.correct : sfx.error)();
      fill(box, h("p.mg-flash", { class: right ? "good" : "bad" }, icon(right ? "check" : "alert", { size: 18 }), right ? " Right. " : " Look again at the link. ", PHISH_SAMPLE.why), h("p", "From here on, you'll find the red flags yourself, after you block a scam."), h("button.big", { type: "button", "data-autofocus": "", onclick: begin }, "Open my phone"));
      box.querySelector("button").focus();
    };
    fill(box, h("h4", "Tap what looks wrong"), h("div.ph-sample", chunks.map((c, i) => h("button.ph-chunk", { type: "button", onclick: () => pick(i) }, c))));
    fill(root, box);
    box.querySelector("button").focus();
  }

  function begin() {
    fill(root, h("div.ph-grid", phone, side), keyHelp("Up and Down pick a message, T trust, B block, V verify (then 1 call or 2 app). After a right Block, Tab and Enter tap the red flags."));
    t0 = Date.now();
    document.addEventListener("keydown", onKey);
    step();
    tick = setInterval(step, 200);
    if (training) coachStart();
  }

  async function coachStart() {
    await pause(ctx.coach(0, phone.querySelector(".ph-actions") || phone));
  }

  async function pause(p) {
    pauseAt = Date.now();
    await p;
    paused += Date.now() - pauseAt;
    pauseAt = 0;
  }

  // ---------- The clock ----------
  function step() {
    if (over) return;
    if (pauseAt) return;
    const t = now();
    const r = F.advance(s, t);
    if (r.arrived.length) sfx.correct?.();
    for (const m of r.expired) {
      if (!m.scam) {
        ctx.echo(`Missed: a real message from ${senderText(m)} expired.`);
        ctx.mistake({ type: "expired", cost: m.loss, label: `Missed a real ${m.kind.toLowerCase()}`, quiet: true });
      }
      if (sel === m.uid) sel = null;
    }
    const lost = sel && !F.find(s, sel);
    if (!sel || lost) sel = s.queue[0]?.uid || null;
    if ((timed && t >= cfg.seconds * 1000) || (F.isOver(s) && !s.lock && !busy)) return end();
    // Repaint only when something changed, so keyboard focus stays put. Rings tick every time.
    if (r.arrived.length || r.expired.length || lost) paint();
    else paintRings();
  }

  const rings = new Map();
  function paintRings() {
    for (const [uid, r] of rings) {
      const m = s.queue.find((x) => x.uid === uid);
      if (m) r.set(Math.max(0, cfg.expiryMs - (now() - m.shownAt)) / 1000, cfg.expiryMs / 1000);
    }
    if (ring) ring.set(cfg.seconds - now() / 1000, cfg.seconds);
  }

  // ---------- Actions ----------
  function act(action) {
    if (busy || s.lock || !sel) return;
    const m = F.find(s, sel);
    if (!m) return;
    if (action === "verify") return verify(m);
    resolve(m, action);
  }

  function resolve(m, action) {
    const rec = F.act(s, m.uid, action, now());
    if (!rec) return;
    ctx.track("phishCall", { kind: m.kind, scam: m.scam, action, correct: rec.correct });
    (rec.correct ? sfx.correct : sfx.error)();
    if (!rec.correct) {
      const label = m.scam ? `Trusted a ${m.kind.toLowerCase()}` : `Blocked a real ${m.kind.toLowerCase()}`;
      ctx.echo(m.scam ? `${m.kind}: you lost ${money(rec.loss)}. From: ${senderText(m)}.` : `${m.kind} blocked by mistake. That cost ${money(rec.loss)}.`);
      if (rec.loss) ctx.mistake({ type: m.scam ? "trustedScam" : "blockedReal", cost: rec.loss, label, quiet: true });
    }
    if (rec.note) ctx.notice(rec.note);
    if (rec.takeover) {
      ctx.echo(`Account takeover! The scam got your login. From: ${senderText(m)}.`);
      ctx.mistake({ type: "takeover", cost: cfg.takeoverCost, label: "Account takeover" });
    }
    sel = null;
    if (rec.correct && rec.action === "block" && m.flags.length) return flagBonus(m);
    after();
  }

  function after() {
    if (!timed) F.advance(s, now());
    if (!sel) sel = s.queue[0]?.uid || null;
    paint();
    if (training && !coached.has(2) && s.correct + s.wrong >= 2) {
      coached.add(2);
      pause(ctx.coach(2, phone.querySelector(".ph-list") || phone));
    }
  }

  function verify(m) {
    busy = "verify";
    ctx.track("phishVerify", { kind: m.kind });
    paint();
    if (training && !coached.has(1)) {
      coached.add(1);
      pause(ctx.coach(1, phone.querySelector(".ph-verify") || phone));
    }
    // Verify takes 5 seconds of game time (it pauses with the game).
    const started = now();
    const bar = () => phone.querySelector(".ph-verify-bar span");
    const wait = setInterval(() => {
      if (over) return clearInterval(wait);
      const f = Math.min(1, (now() - started) / cfg.verifyMs);
      if (bar()) bar().style.width = `${Math.round(f * 100)}%`;
      if (f >= 1) {
        clearInterval(wait);
        busy = "verifyPick";
        paint();
      }
    }, 100);
    verifyTarget = m;
  }
  let verifyTarget = null;
  function verifyPick(how) {
    if (busy !== "verifyPick" || !verifyTarget) return;
    busy = null;
    const m = verifyTarget;
    verifyTarget = null;
    if (!F.find(s, m.uid)) return after();
    resolve(m, how === "app" ? "verifyApp" : "verifyCall");
  }

  // After a right Block: the message stays 3 seconds with its red flags tappable.
  function flagBonus(m) {
    busy = "flags";
    flagMsg = m;
    paint();
    phone.querySelector(".ph-flag")?.focus();
    setTimeout(() => {
      busy = null;
      flagMsg = null;
      after();
    }, cfg.flagShowMs);
  }
  let flagMsg = null;
  function tapFlag(i) {
    if (!flagMsg) return;
    if (F.flagTap(s, flagMsg.uid, i)) {
      sfx.correct();
      ctx.track("phishFlag", { type: flagMsg.flags[i].type });
      paint();
    }
  }

  function lockTap() {
    if (!s.lock) return;
    F.lockTap(s);
    sfx.correct();
    if (!s.lock) ctx.echo("Account locked down: new password and two-step login on.", { kind: "good" });
    paint();
  }

  // ---------- Drawing ----------
  function msgRow(m) {
    const left = timed ? Math.max(0, cfg.expiryMs - (now() - m.shownAt)) / 1000 : null;
    const r = timed ? timerRing({ size: 34, label: "Time before it expires" }) : null;
    r?.set(left, cfg.expiryMs / 1000);
    if (r) rings.set(m.uid, r);
    return h("li", h("button.ph-msg", { type: "button", "aria-pressed": String(sel === m.uid), onclick: () => ((sel = m.uid), paint()) }, h("strong", senderText(m)), h("span", bodyText(m).split(" ").slice(0, 7).join(" ") + "..."), r));
  }

  function paint() {
    rings.clear();
    const visible = s.queue.slice(0, 4);
    const m = sel && F.find(s, sel);
    let view;
    if (s.lock) {
      view = h("div.ph-lock", { role: "alertdialog", "aria-label": "Lock down your account" }, h("h4", icon("lock", { size: 20 }), " Your account was taken over"), h("p", "Lock it down before more damage is done."), h("button.big", { type: "button", "data-autofocus": "", onclick: lockTap }, s.lock.taps < 2 ? `Change your password (${s.lock.taps + 1} of 2)` : `Turn on two-step login (${s.lock.taps - 1} of 2)`));
    } else if (busy === "verify") {
      view = h("div.ph-verify", h("p", icon("search", { size: 18 }), " Checking..."), h("div.ph-verify-bar", h("span")));
    } else if (busy === "verifyPick") {
      view = h("div.ph-verify", h("p", "How do you check?"), h("button.big", { type: "button", "data-autofocus": "", onclick: () => verifyPick("call") }, h("kbd", "1"), " Call the number in the message"), h("button.big", { type: "button", onclick: () => verifyPick("app") }, h("kbd", "2"), " Open the official app"));
    } else if (busy === "flags" && flagMsg) {
      view = h(
        "div.ph-open.flags",
        h("p.ph-bonus", icon("star", { size: 16 }), " Blocked! Tap the red flags for +10 each."),
        h("p.ph-from", "From: ", partsView(flagMsg.sender, flagMsg)),
        h("p.ph-text", partsView(flagMsg.text, flagMsg))
      );
    } else if (m) {
      view = h(
        "div.ph-open",
        h("p.ph-from", "From: ", h("strong", senderText(m))),
        h("p.ph-text", m.text.map((p) => (p.flag === "link" ? h("u.ph-link", p.text) : p.text))),
        h("div.ph-actions", h("button.big.trust", { type: "button", onclick: () => act("trust") }, h("kbd", "T"), " Trust"), h("button.big.block", { type: "button", onclick: () => act("block") }, h("kbd", "B"), " Block"), h("button.big.verify", { type: "button", onclick: () => act("verify") }, h("kbd", "V"), " Verify"))
      );
    } else view = h("p.ph-empty", timed ? "Quiet for a second..." : "No new messages.");
    fill(
      phone,
      h("div.ph-status", h("span", "9:41"), h("span", icon("phone", { size: 14 }), ` ${s.queue.length} new`)),
      h("ul.ph-list", visible.map(msgRow), s.queue.length > 4 ? h("li.ph-more", `+${s.queue.length - 4} more waiting`) : null),
      h("div.ph-view", view)
    );
    const sc = F.score(s);
    fill(side, ring ? h("div.ph-clock", ring, h("small", "Shift time")) : null, h("div.ph-stat", h("small", "Safety Score"), h("strong", String(sc.score))), h("div.ph-stat", h("small", "Lost to scams"), h("strong.neg", money(sc.lost))), h("div.ph-stat", h("small", "Saved"), h("strong", money(sc.saved))), h("p", icon("star", { size: 14 }), ` Red flags found: ${sc.flags}`), h("p", icon("check", { size: 14 }), ` Right: ${sc.correct}  `, icon("x", { size: 14 }), ` Wrong: ${sc.wrong}`));
    if (ring) ring.set(cfg.seconds - now() / 1000, cfg.seconds);
    if (busy === "verifyPick" || s.lock) phone.querySelector("[data-autofocus]")?.focus();
  }

  function partsView(list, m) {
    let idx = -1;
    return list.map((p) => {
      if (!p.flag) return p.text;
      idx = m.flags.findIndex((f, i) => i > idx && f.text === p.text && f.type === p.flag);
      const i = idx;
      const found = s.flagTaps[`${m.uid}:${i}`];
      return h("button.ph-flag", { type: "button", "aria-pressed": String(Boolean(found)), title: PHISH_FLAG_LABEL[p.flag], onclick: () => tapFlag(i) }, p.text, found ? h("small", ` ${PHISH_FLAG_LABEL[p.flag]}`) : null);
    });
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    const k = e.key.toLowerCase();
    if (s.lock) {
      if (k === "enter" && !e.target.closest("button")) (e.preventDefault(), lockTap());
      return;
    }
    if (busy === "verifyPick" && (k === "1" || k === "2")) return e.preventDefault(), verifyPick(k === "2" ? "app" : "call");
    if (busy) return;
    if (k === "arrowdown" || k === "arrowup") {
      e.preventDefault();
      const i = s.queue.findIndex((m) => m.uid === sel);
      const n = s.queue.length;
      if (n) sel = s.queue[(i + (k === "arrowdown" ? 1 : n - 1)) % n].uid;
      return paint();
    }
    const a = { t: "trust", b: "block", v: "verify" }[k];
    if (a) (e.preventDefault(), act(a));
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = F.score(s);
    const caught = s.log.filter((r) => r.m.scam && r.correct);
    const got = s.log.filter((r) => r.m.scam && !r.correct);
    const reveal = h(
      "div.ph-reveal",
      h("p.ph-totals", icon("shield", { size: 18 }), ` You kept ${money(sc.saved)} safe and lost ${money(sc.lost)}.`),
      h("div.ph-cols", h("div", h("h5", icon("check", { size: 14 }), ` Scams you caught (${caught.length})`), h("ul", caught.slice(0, 8).map((r) => h("li", r.m.loss ? `${r.m.kind}: ${money(r.m.loss)} saved` : `${r.m.kind}: caught early`)))), h("div", h("h5", icon("alert", { size: 14 }), ` Scams that caught you (${got.length})`), got.length ? h("ul", got.map((r) => h("li", `${r.m.kind}: ${money(r.loss)} lost${r.takeover ? ", plus a takeover" : ""}`))) : h("p", "None. Nice."))),
      sc.missed ? h("p", icon("clock", { size: 14 }), ` ${sc.missed} real message${sc.missed === 1 ? "" : "s"} expired before you got to ${sc.missed === 1 ? "it" : "them"}.`) : null
    );
    ctx.finish({ score: sc.score, tie: sc.flags, sub: { correct: sc.correct, wrong: sc.wrong, flags: sc.flags, missed: sc.missed, lost: sc.lost, saved: sc.saved }, perfect: !sc.wrong && !sc.missed, reveal, biggest: F.biggest(s), stats: { takeovers: sc.takeovers } });
  }

  if (training) begin();
  else skillMoment();
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
