// Daily Pick (docs/UI-REBUILD.md slice 4): three closed boxes, pick one. The
// boxes come from the student's seed and the date, so every student's luck is
// their own and a refresh can't re-roll it. It resets at the student's midnight.
import { h, fill, money, toast } from "../dom.js";
import { icon } from "../icons.js";
import { placeHeader } from "../place-header.js";
import { burstFrom } from "../motion/particles.js";
import { sfx } from "../sound.js";
import { CONFIG } from "../../data/config.js";
import { DECOR_BY_ID } from "../../data/cottage.js";
import { msUntilMidnight } from "../../engine/daily.js";
import { claimPick, pickState, todaysBoxes, ensureDaily } from "../../daily.js";
import { progress } from "../../challenges.js";

// One line for a prize, whether it's opened, passed over or still a surprise.
export function prizeText(p) {
  if (p.kind === "coins") return `${money(p.amount)} in coins`;
  if (p.kind === "sparkle") return `${p.amount} Sparkle Point`;
  if (p.kind === "coupon") return `${p.pct}% off your next Market buy`;
  return `${p.name || DECOR_BY_ID[p.id]?.name || "A Cottage piece"} for your Cottage`;
}
const PRIZE_ICON = { coins: "coins", sparkle: "sparkle", coupon: "receipt", decor: "cottage" };

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
};

export function render(root, { game, go, track }) {
  const run = game.run;
  const panel = h("section.panel.daily");
  root.append(h("div.bestiary.bst-daily", panel));
  track("dailyOpen", { streak: ensureDaily(run.play).streak });
  let timer = null;
  let opened = null; // { index, boxes } right after a pick

  function streakCard() {
    const d = ensureDaily(run.play);
    const week = d.streak ? ((d.streak - 1) % 7) + 1 : 0;
    const next = Object.keys(CONFIG.daily.login.milestones).map(Number).sort((a, b) => a - b).find((n) => n > d.streak);
    return h(
      "section.daily-streak",
      h("h2", icon("flame", { size: 24 }), d.streak ? ` Day ${d.streak} streak` : " No streak yet"),
      h("ol.streak-pips", { "aria-label": `${week} of 7 days this week` }, Array.from({ length: 7 }, (_, i) => h("li", { class: i < week ? "done" : "" }, i < week ? icon("check", { size: 14 }) : String(i + 1)))),
      h("p.muted.tight", `Best streak: ${d.best || 0} day${d.best === 1 ? "" : "s"}. ${next ? `Day ${next} pays a bonus of ${money(CONFIG.daily.login.milestones[next])}.` : "You've passed every bonus day."} Miss a day and it starts over.`)
    );
  }

  function challengeCard() {
    const p = progress(run.play, run.life);
    return h(
      "section.daily-tasks",
      h("h2", icon("check", { size: 20 }), ` Today's challenges: ${p.done} of ${p.total}`),
      h("ul", p.rows.map((r) => h("li", { class: r.done ? "done" : "" }, icon(r.done ? "check" : "next", { size: 14 }), ` ${r.text}`, r.done ? h("span.sr-only", " (done)") : null))),
      h("p.muted.tight", p.bonus ? `All done. You earned ${money(CONFIG.daily.challengeBonus)}.` : `Finish all three for ${money(CONFIG.daily.challengeBonus)}.`)
    );
  }

  function boxes() {
    const state = pickState(run.play);
    const all = state.done ? todaysBoxes(run.life) : null;
    return h(
      "div.daily-boxes",
      Array.from({ length: CONFIG.daily.boxes }, (_, i) => {
        if (!state.done) {
          return h("button.daily-box", { type: "button", "aria-label": `Box ${i + 1}, closed. Open it.`, onclick: (e) => pick(i, e.currentTarget) }, icon("chest", { size: 64 }), h("strong", `Box ${i + 1}`), h("small", "Tap to open"));
        }
        const mine = state.pick.index === i;
        const prize = mine ? state.pick : all[i];
        return h(
          "div.daily-box.open",
          { class: mine ? "mine" : "", "aria-label": `Box ${i + 1}, ${mine ? "yours" : "not picked"}: ${prizeText(prize)}` },
          icon(PRIZE_ICON[prize.kind], { size: 56 }),
          h("strong", `Box ${i + 1}`),
          h("span.daily-prize", prizeText(prize)),
          h("small", mine ? "You picked this one" : "Not picked")
        );
      })
    );
  }

  async function pick(i, el) {
    if (run.practice) return toast("Daily Pick isn't part of practice.", "info");
    const r = claimPick(run.play, run.life, i);
    if (!r) return paint();
    run.life = r.life;
    sfx.chestOpen();
    burstFrom(el, "dust", { n: 24 });
    track("dailyPick", { kind: r.prize.kind, tier: r.boxes[i].tier || null, amount: r.prize.amount ?? r.prize.pct ?? null });
    await run.persist("dailyPick");
    if (r.prize.kind === "decor") dispatchEvent(new CustomEvent("cc:decor"));
    toast(`You won ${prizeText(r.prize)}.${r.note ? ` ${r.note}` : ""}`, "good");
    paint();
  }

  function paint() {
    const state = pickState(run.play);
    fill(
      panel,
      placeHeader({ go, iconName: "chest", kicker: "Resets at midnight", title: "Daily Pick", subtitle: state.done ? "You've picked today. Come back tomorrow for new boxes." : "Pick one box. Your boxes are different from your classmates' boxes.", practice: run.practice }),
      h("div.daily-layout", h("div.daily-main", boxes(), h("p.daily-clock", { "aria-live": "off" }, "New boxes in ", h("strong", { id: "daily-clock" }, clock(msUntilMidnight())))), h("div.daily-side", streakCard(), challengeCard()))
    );
  }

  paint();
  timer = setInterval(() => {
    const el = document.getElementById("daily-clock");
    if (!el) return;
    const left = msUntilMidnight();
    el.textContent = clock(left);
    if (left < 1500) paint();
  }, 1000);
  return () => clearInterval(timer);
}
