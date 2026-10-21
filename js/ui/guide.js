// Runs a lesson (js/data/lessons.js) on the real screens: it opens each place,
// spotlights one part and explains it in a speech bubble from Sage. A
// full-screen layer catches every click, so a lesson never changes the game.
// It only clicks tabs itself to show them.
import { h, fill } from "./dom.js";
import { icon } from "./icons.js";
import { creatureSvg } from "./creature-art.js";
import { sfx } from "./sound.js";
import { LESSONS, GUIDE } from "../data/lessons.js";
import { isLegacy } from "../progression.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const visible = (el) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

// The first matching element that's on screen. { sel, text } also checks text.
function find(target) {
  for (const t of [].concat(target || [])) {
    const sel = typeof t === "string" ? t : t.sel;
    const els = [...document.querySelectorAll(sel)].filter((el) => typeof t === "string" || el.textContent.includes(t.text));
    const el = els.find(visible);
    if (el) return el;
  }
  return null;
}

async function waitFor(target, ms = 1500) {
  for (let t = 0; t < ms; t += 80) {
    const el = find(target);
    if (el) return el;
    await sleep(80);
  }
  return null;
}

// onFinish(done): done is true when the student reached the end.
export function startGuide({ steps: STEPS, id, track, onFinish, returnTo = null }) {
  if (document.querySelector(".tour")) return;
  const startHash = location.hash;
  const spot = h("div.tour-spot", { "aria-hidden": "true" });
  const bubble = h("div.tour-bubble", { role: "dialog", "aria-modal": "true", "aria-labelledby": "tour-title" });
  const layer = h("div.tour", spot, bubble);
  // The layer swallows clicks on the page, so nothing underneath changes.
  layer.addEventListener("click", (e) => {
    if (!bubble.contains(e.target)) e.stopPropagation();
  });
  document.body.append(layer);
  document.body.classList.add("touring");
  let i = 0;
  let current = null;
  let token = 0;
  const started = Date.now();
  track("lessonStart", { lesson: id });

  const place = () => {
    const el = current;
    const vw = innerWidth;
    const vh = innerHeight;
    bubble.style.removeProperty("left");
    bubble.style.removeProperty("top");
    if (!el || !visible(el)) {
      spot.hidden = true;
      bubble.classList.add("centered");
      return;
    }
    bubble.classList.remove("centered");
    const r = el.getBoundingClientRect();
    const pad = 8;
    spot.hidden = false;
    Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    if (vw < 700) return; // Phones: the bubble sits at the bottom (CSS).
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    // A big area (like the bills panel): keep the bubble in the corner so it
    // doesn't cover what it's talking about.
    if (r.height > vh * 0.5) {
      bubble.style.left = `${vw - bw - 16}px`;
      bubble.style.top = `${vh - bh - 16}px`;
      return;
    }
    let top = r.bottom + 16;
    if (top + bh > vh - 12) top = r.top - bh - 16;
    if (top < 12) top = Math.max(12, Math.min(vh - bh - 12, r.top + r.height / 2 - bh / 2));
    const left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  };

  async function show(n) {
    const my = ++token;
    i = n;
    const step = STEPS[i];
    bubble.classList.add("loading");
    let route = step.route;
    let target = step.target;
    let usedFallback = false;
    if (route && location.hash !== `#/${route}`) {
      location.hash = `#/${route}`;
      await sleep(350);
      // The router sent us somewhere else (the place isn't open right now).
      if (location.hash !== `#/${route}` && step.fallback) {
        route = step.fallback.route;
        target = step.fallback.target;
        usedFallback = true;
        if (location.hash !== `#/${route}`) {
          location.hash = `#/${route}`;
          await sleep(350);
        }
      }
    }
    if (my !== token) return;
    if (step.click) (await waitFor(step.click, 1200))?.click();
    current = target ? await waitFor(target) : null;
    if (my !== token) return;
    // Phones keep the bubble at the bottom, so the spotlight goes near the top.
    if (current && innerWidth < 700) scrollTo({ top: current.getBoundingClientRect().top + scrollY - 96, behavior: "instant" });
    else current?.scrollIntoView({ block: "center", behavior: "instant" });
    paint(step, usedFallback);
    bubble.classList.remove("loading");
    requestAnimationFrame(place);
    track("lessonStep", { lesson: id, step: i + 1, found: Boolean(current) || !target });
  }

  function paint(step, usedFallback = false) {
    const last = i === STEPS.length - 1;
    let answered = !step.quiz;
    const next = h("button", { type: "button", disabled: !answered, onclick: () => (last ? finish(true) : show(i + 1)) }, last ? "Got it!" : "Next");
    const quiz = step.quiz ? quizBox(step.quiz, () => ((answered = true), (next.disabled = false), next.focus())) : null;
    fill(
      bubble,
      h(
        "div.tour-scroll",
        h(
        "div.tour-head",
        h("span.tour-guide", { html: creatureSvg(GUIDE.look, { size: 64, label: "" }) }),
        h("div", h("p.tour-kicker", `${GUIDE.name}, ${GUIDE.role}`), h("h2", { id: "tour-title" }, step.title))
      ),
      step.big ? h("div.guide-big", { "aria-hidden": "true" }, step.big) : null,
      step.text.map((t) => h("p", t)),
      usedFallback ? h("p.note.tight", "This place opens while a chapter is going, so here's where to find it on the map.") : null,
      quiz
      ),
      h(
        "div.tour-foot",
        h("span.tour-count", `${i + 1} of ${STEPS.length}`),
        h("progress", { max: STEPS.length, value: i + 1, "aria-hidden": "true" }),
        h(
          "span.tour-buttons",
          last ? null : h("button.link", { type: "button", onclick: () => finish(false) }, "Skip"),
          i > 0 ? h("button.secondary", { type: "button", onclick: () => show(i - 1) }, icon("back", { size: 16 }), " Back") : null,
          next
        )
      )
    );
    (answered ? next : bubble.querySelector(".tour-quiz button"))?.focus();
  }

  function quizBox(qz, onRight) {
    const result = h("p.tour-result", { role: "status" });
    const buttons = qz.choices.map((c, k) =>
      h(
        "button.chip",
        {
          type: "button",
          "data-sound": "none",
          onclick: (e) => {
            const right = k === qz.answer;
            track("lessonQuiz", { lesson: id, step: i + 1, right });
            if (right) {
              sfx.correct();
              buttons.forEach((b) => (b.disabled = true));
              e.currentTarget.classList.add("right");
              fill(result, h("strong", "Right! "), qz.why);
              onRight();
            } else {
              sfx.error();
              e.currentTarget.classList.add("wrong");
              e.currentTarget.disabled = true;
              fill(result, "Not quite. Try another answer.");
            }
          },
        },
        c
      )
    );
    return h("div.tour-quiz", h("p", h("strong", "Quick check: "), qz.q), h("div.chip-group", buttons), result);
  }

  function finish(done) {
    token++;
    track(done ? "lessonDone" : "lessonSkip", { lesson: id, step: i + 1, seconds: Math.round((Date.now() - started) / 1000) });
    removeEventListener("resize", place);
    removeEventListener("scroll", place, true);
    removeEventListener("keydown", keys, true);
    layer.remove();
    document.body.classList.remove("touring");
    if (done) sfx.questComplete();
    location.hash = returnTo ? `#/${returnTo}` : startHash || "#/hub";
    onFinish?.(done);
  }

  // Escape skips. Tab stays inside the bubble.
  function keys(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    } else if (e.key === "Tab") {
      const f = [...bubble.querySelectorAll("button:not([disabled])")];
      if (!f.length) return;
      const at = f.indexOf(document.activeElement);
      if (e.shiftKey && at <= 0) (e.preventDefault(), f.at(-1).focus());
      else if (!e.shiftKey && at === f.length - 1) (e.preventDefault(), f[0].focus());
      else if (at === -1) (e.preventDefault(), f[0].focus());
    }
  }

  addEventListener("resize", place);
  addEventListener("scroll", place, true);
  addEventListener("keydown", keys, true);
  show(0);
}

// Runs one lesson and remembers it in the real save (never a practice copy).
// Lessons can be replayed from the Academy.
export function runLesson({ game, track, id, onFinish, returnTo }) {
  const steps = LESSONS[id]?.steps;
  if (!steps) return onFinish?.(false);
  startGuide({
    steps,
    id,
    track,
    returnTo,
    onFinish: async (done) => {
      const play = game.save.play;
      play.lessonsSeen ??= [];
      if (!play.lessonsSeen.includes(id)) play.lessonsSeen.push(id);
      await game.persist(`lesson:${id}`);
      onFinish?.(done);
    },
  });
}

// The first visit to a place plays its lesson (new games only, never in practice).
export function firstVisitLesson({ game, track, id, route }) {
  const play = game.save.play;
  if (game.practice || isLegacy(play) || play.lessonsSeen?.includes(id) || document.querySelector(".tour")) return;
  setTimeout(() => runLesson({ game, track, id, returnTo: route }), 250);
}
