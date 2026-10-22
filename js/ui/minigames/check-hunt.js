// Check Anatomy Hunt (teacher request 2026-10-22, idea 5). A made-up check
// with every part as a spot to tap. "Tap the routing number", and so on, each
// with a one-line explanation. The last two checks ask "Is this check good to
// cash?" with a planted problem (no signature, numbers and words that don't
// match, or no date), or none. The bottom line reads routing, then account,
// then check number, like a real check.
import { h, fill } from "../dom.js";
import { sfx } from "../sound.js";
import { createRng } from "../../engine/index.js";
import { CONFIG } from "../../data/config.js";
import { CHECK_PARTS } from "../../data/minigames.js";
import { checkHuntRounds, fmt } from "./gen.js";

export function checkHunt({ seed, timed, onDone, track }) {
  const cfg = CONFIG.play.jobs.checkhunt;
  const rng = createRng(seed);
  const started = Date.now();
  const rounds = checkHuntRounds(rng);
  let k = 0;
  let right = 0;
  let wrong = 0;
  let over = false;
  let locked = false;
  let clockTimer = 0;
  const misses = [];

  const clock = h("span.mg-clock", { role: "timer" });
  const score = h("span.mg-score");
  const prompt = h("p.ch-prompt", { "aria-live": "polite" });
  const stage = h("div.ch-stage");
  const flash = h("p.mg-flash", { role: "status" });
  const el = h("div.minigame.checkhunt", h("div.mg-bar", clock, score), prompt, stage, flash);
  const paintScore = () => (score.textContent = `✓ ${right}   ✗ ${wrong}`);

  // One spot on the check. part names what it is, for grading.
  const spot = (part, cls, ...kids) => h(`button.ch-spot.${cls}`, { type: "button", "data-sound": "none", "data-boop": "none", "data-part": part, onclick: (e) => tap(part, e.currentTarget) }, ...kids);

  function checkFace(c, find) {
    const tag = (part, cls, ...kids) => (find ? spot(part, cls, ...kids) : h(`span.ch-spot.${cls}`, ...kids));
    return h(
      "div.check.ch-check",
      { role: "group", "aria-label": "A check" },
      h("div.check-top", h("span.check-owner", "Pip Thistlewood", h("br"), "12 Fern Row, Coinhaven"), tag("date", "ch-date", h("small", "Date "), c.date || h("span.ch-empty", "______")), tag("checkno", "ch-no", `No. ${c.checkno}`)),
      h("div.check-line", h("span", "Pay to the order of"), tag("payee", "ch-payee", c.payee), h("span.check-dollar", "$"), tag("amount", "ch-amount", (c.amount / 100).toFixed(2))),
      h("div.check-line", tag("words", "ch-words", c.words), h("span", "Dollars")),
      h("div.check-bank", "The Vault, Coinhaven"),
      h("div.check-bottom", h("span", "Memo "), tag("memo", "ch-memo", c.memo), h("div.check-sign", tag("signature", "ch-sig", c.signed ? h("span.sig-script", "Pip Thistlewood") : h("span.ch-empty", "")), h("small", "Signature"))),
      h("div.ch-micr", { "aria-label": "Bottom line of numbers" }, tag("routing", "ch-routing", c.routing), tag("account", "ch-account", c.account), tag("checkno", "ch-no2", c.checkno))
    );
  }

  function show() {
    locked = false;
    const r = rounds[k];
    flash.textContent = "";
    flash.className = "mg-flash";
    if (r.type === "find") {
      fill(prompt, h("small", `Check ${k + 1} of ${rounds.length}`), h("strong", `Tap ${CHECK_PARTS[r.part].ask}.`));
      fill(stage, checkFace(r.check, true));
    } else {
      fill(prompt, h("small", `Check ${k + 1} of ${rounds.length}`), h("strong", "Is this check good to cash?"));
      fill(
        stage,
        checkFace(r.check, false),
        h(
          "div.row.ch-judge",
          h("button", { type: "button", "data-sound": "none", "aria-keyshortcuts": "G", onclick: () => judge(true) }, "Good to cash"),
          h("button.secondary", { type: "button", "data-sound": "none", "aria-keyshortcuts": "W", onclick: () => judge(false) }, "Something's wrong")
        )
      );
    }
    paintScore();
  }

  function next() {
    k++;
    if (k >= rounds.length) return end();
    show();
  }

  function tap(part, btn) {
    const r = rounds[k];
    if (over || locked || r.type !== "find") return;
    locked = true;
    const ok = part === r.part;
    stage.querySelectorAll(`[data-part="${r.part}"]`).forEach((b) => b.classList.add("ch-answer"));
    if (ok) {
      right++;
      sfx.correct();
      btn.classList.add("ch-right");
      flash.className = "mg-flash good";
      flash.textContent = `✓ ${CHECK_PARTS[r.part].why}`;
    } else {
      wrong++;
      sfx.error();
      btn.classList.add("ch-wrong");
      flash.className = "mg-flash bad";
      flash.textContent = `✗ That's ${CHECK_PARTS[part].ask}. ${CHECK_PARTS[r.part].why}`;
      misses.push(`${CHECK_PARTS[r.part].ask}: ${CHECK_PARTS[r.part].why}`);
    }
    track("checkTap", { part: r.part, tapped: part, right: ok });
    paintScore();
    setTimeout(next, ok ? cfg.rightMs : cfg.wrongMs);
  }

  function judge(good) {
    const r = rounds[k];
    if (over || locked || r.type !== "judge") return;
    locked = true;
    const ok = good === (r.flaw === "ok");
    if (ok) right++;
    else {
      wrong++;
      misses.push(`Good to cash? ${r.why}`);
    }
    (ok ? sfx.correct : sfx.error)();
    flash.className = `mg-flash ${ok ? "good" : "bad"}`;
    flash.textContent = `${ok ? "✓" : "✗"} ${r.why}${r.flaw === "mismatch" ? ` The numbers say ${fmt(r.check.amount)}.` : ""}`;
    track("checkTap", { part: "judge", flaw: r.flaw, right: ok });
    paintScore();
    setTimeout(next, cfg.wrongMs);
  }

  function onKey(e) {
    if (over || locked || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, .calc, dialog")) return;
    if (rounds[k]?.type !== "judge") return;
    if (e.key === "g" || e.key === "G") judge(true);
    else if (e.key === "w" || e.key === "W") judge(false);
  }
  document.addEventListener("keydown", onKey);

  function end() {
    if (over) return;
    over = true;
    clearInterval(clockTimer);
    document.removeEventListener("keydown", onKey);
    sfx.questComplete();
    track("minigameEnd", { game: "checkhunt", right, wrong, timed });
    onDone({ right, wrong, total: rounds.length, seconds: Math.round((Date.now() - started) / 1000), misses });
  }

  if (timed) {
    const endAt = Date.now() + cfg.seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      clock.textContent = `⏱️ ${left}s`;
      if (left <= 0 && !over) {
        wrong += rounds.length - k;
        end();
      }
    };
    tick();
    clockTimer = setInterval(tick, 250);
  } else clock.textContent = `No timer: ${rounds.length} checks`;
  show();
  el.stop = () => {
    over = true;
    clearInterval(clockTimer);
    document.removeEventListener("keydown", onKey);
  };
  return el;
}
