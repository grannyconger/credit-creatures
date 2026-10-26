// Feed Frenzy (GAME-SPECS.md game 6): scroll a month of posts with a persona's
// needs, interests and goal. Tap the tricks, Buy, Skip or Wishlist, cancel the
// free trial in time. Rules: js/arcade/feed.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { createRng } from "../../engine/index.js";
import * as F from "../../arcade/feed.js";
import { FF_TRICKS, FF_NEEDS, FF_WANTS } from "../../data/arcade/feed.js";
import { keyHelp, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const ICON_FOR = { music: "volume", art: "palette", gaming: "star", tech: "phone", sports: "trophy", outdoors: "tree", fashion: "heart", beauty: "sparkle", books: "scroll", cooking: "home" };

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.feed;
  const deal = F.newShift(seed);
  const s = F.newState(deal);
  const per = deal.persona;
  const root = h("div.minigame.feed");
  const personaBox = h("section.ff-persona");
  const stage = h("section.ff-stage");
  const side = h("section.ff-side");
  const ring = timed ? timerRing({ label: "Time left on this post" }) : null;
  let over = false;
  let tick = null;
  let postEnd = 0;
  let subsOpen = false;
  let pausedAt = 0;
  const coached = new Set();

  // ---------- Skill moment: read the persona ----------
  function skillMoment() {
    const rng = createRng(`${seed}:skill`);
    const need = FF_NEEDS[per.needs[0]].name;
    const wants = FF_WANTS.filter((w) => per.interests.includes(w[1])).slice(0, 2).map((w) => w[0]);
    const opts = [need, ...wants];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    const box = h("div.ff-skill");
    const pick = (o) => {
      const ok = o === need;
      ctx.track("skillMoment", { game: "feed", right: ok });
      (ok ? sfx.correct : sfx.error)();
      fill(box, personaCard(true), h("p.mg-flash", { class: ok ? "good" : "bad" }, icon(ok ? "check" : "alert", { size: 18 }), ok ? ` Right. ${need} is a real need for ${per.name}.` : ` It's ${need}. The others are wants, even if they match ${per.name}'s interests.`), h("button.big", { type: "button", "data-autofocus": "", onclick: begin }, "Start scrolling"));
      box.querySelector("button.big").focus();
    };
    fill(box, personaCard(true), h("p.ff-skill-q", `Which of these is a need for ${per.name} this month?`), h("div.ff-skill-opts", opts.map((o) => h("button", { type: "button", onclick: () => pick(o) }, o))));
    fill(root, box);
    box.querySelector(".ff-skill-opts button").focus();
  }

  function personaCard(full) {
    const pct = Math.max(0, Math.min(1, s.cash / per.goal[1]));
    return h(
      "div.ff-card",
      { class: full ? "full" : "" },
      h("div.ff-card-head", h("strong", per.name), h("span", per.situation)),
      h("ul.ff-needs", per.needs.map((k) => h("li", { class: s.bought.some((p) => p.need === k) ? "met" : "" }, icon(s.bought.some((p) => p.need === k) ? "check" : "info", { size: 14 }), ` Need: ${FF_NEEDS[k].name}`))),
      full ? h("p", `Interests: ${per.interests.join(" and ")}.`) : null,
      h("div.ff-goal", h("small", `Goal: ${per.goal[0]}, ${money(per.goal[1])}`), h("div.ff-goalbar", { role: "img", "aria-label": `${Math.round(pct * 100)} percent of the goal` }, h("span", { style: `width: ${Math.round(pct * 100)}%` })), h("small", `${money(s.cash)} saved so far`))
    );
  }

  // ---------- The feed ----------
  function begin() {
    fill(root, h("div.ff-grid", personaBox, stage, side), keyHelp("B buy, S skip, W wishlist, Down next post, Tab and Enter tap a trick, C subscriptions."));
    document.addEventListener("keydown", onKey);
    if (timed) tick = setInterval(loop, 200);
    showPost();
    if (training) (async () => (pause(ctx.coach(0, personaBox)), coached.add(0)))();
  }

  async function pause(p) {
    pausedAt = Date.now();
    await p;
    postEnd += Date.now() - pausedAt;
    pausedAt = 0;
  }

  function loop() {
    if (over || pausedAt) return;
    const left = (postEnd - Date.now()) / 1000;
    ring?.set(left, cfg.postSeconds);
    if (left <= 0) act("skip", true);
  }

  function showPost() {
    if (over) return;
    if (!F.current(s)) return weekEnd();
    postEnd = Date.now() + cfg.postSeconds * 1000;
    paint();
    if (training && !coached.has(1) && F.current(s).tricks.length) {
      coached.add(1);
      pause(ctx.coach(1, stage.querySelector(".ff-trick") || stage));
    }
  }

  function trickChip(p, t) {
    const spotted = s.spotted[p.id]?.includes(t);
    const label = t === "wasNow" ? FF_TRICKS.wasNow.chip.replace("{was}", money(p.was || p.price)) : FF_TRICKS[t].chip;
    return h("button.ff-trick", { type: "button", class: `t-${t}${spotted ? " spotted" : ""}`, "aria-pressed": String(Boolean(spotted)), onclick: () => tap(p, t) }, spotted ? [icon("check", { size: 14 }), ` ${FF_TRICKS[t].truth}`] : label);
  }

  function tap(p, t) {
    const r = F.tapTrick(s, p.id, t);
    if (!r) return;
    if (!r.ok) {
      sfx.error();
      ctx.notice("That's just the product. -5");
    } else if (!r.again) {
      sfx.correct();
      ctx.track("feedTrick", { trick: t });
    }
    paint();
    stage.querySelector(`.ff-trick.t-${t}`)?.focus();
  }

  function paint() {
    const p = F.current(s);
    fill(personaBox, personaCard(false));
    if (p) {
      const tricks = p.tricks;
      fill(
        stage,
        h(
          "article.ff-post",
          { class: p.returned ? "returned" : "" },
          h("header.ff-post-head", h("span.ff-avatar", { "aria-hidden": "true" }, p.creator.charAt(1).toUpperCase()), h("strong", p.creator), tricks.includes("hiddenAd") ? h("span.ff-ad-slot", trickChip(p, "hiddenAd")) : null, ring),
          p.returned ? h("p.ff-back", icon("heart", { size: 14 }), " Back from your wishlist. No tricks this time.") : null,
          h("button.ff-photo", { type: "button", "aria-label": `Photo of ${p.name}`, onclick: () => tap(p, null) }, icon(p.kind === "need" ? "shop" : p.kind === "trial" ? "play" : ICON_FOR[p.interest] || "star", { size: 64 }), h("span", p.name)),
          h("p.ff-caption", h("strong", p.price ? money(p.price) : "Free today"), ` ${p.kind === "trial" ? `then ${money(p.monthly)} a month.` : ""} ${p.kind === "need" ? "Grab yours." : "Link in bio!"}`),
          h("div.ff-tricks", tricks.filter((t) => t !== "hiddenAd").map((t) => trickChip(p, t)))
        ),
        h("div.ff-btns", h("button.big.buy", { type: "button", onclick: () => act("buy") }, h("kbd", "B"), " Buy"), h("button.big.skip", { type: "button", onclick: () => act("skip") }, h("kbd", "S"), " Skip"), p.returned ? null : h("button.big.wish", { type: "button", onclick: () => act("wish") }, h("kbd", "W"), " Wishlist"))
      );
    }
    const subs = s.subs;
    fill(
      side,
      h("div.ff-stat", h("small", "Cash"), h("strong", money(s.cash))),
      h("div.ff-stat", h("small", "Week"), h("strong", `${s.week + 1} of ${F.WEEKS}`), h("small", `Post ${Math.min(s.i + 1, s.queue.length)} of ${s.queue.length}`)),
      h("div.ff-stat", h("small", "Tricks spotted"), h("strong", String(s.spots))),
      h("button.secondary.ff-subs-btn", { type: "button", "aria-expanded": String(subsOpen), "aria-keyshortcuts": "C", onclick: () => ((subsOpen = !subsOpen), paint()) }, icon("calendar", { size: 16 }), ` Subscriptions (${subs.filter((x) => !x.canceled).length})`),
      subsOpen ? h("div.ff-subs", subs.length ? subs.map((x) => h("div.ff-sub", h("span", `${x.name}: ${money(x.monthly)} a month, charges week ${x.chargeWeek + 1}`), x.canceled ? h("small", icon("check", { size: 12 }), " Canceled") : h("button.small", { type: "button", onclick: () => (F.cancelSub(s, x.id), ctx.track("feedCancel", {}), paint()) }, "Cancel"))) : h("p", "No subscriptions.")) : null
    );
  }

  function act(how, timedOut = false) {
    if (over || pausedAt) return;
    const p = F.current(s);
    if (!p) return;
    const r = F.decide(s, how);
    if (r?.fail) return ctx.notice(r.fail);
    ctx.track("feedDecide", { kind: p.kind, how: r.how, price: p.price, timedOut });
    if (how === "buy") sfx.correct();
    if (how === "wish" && training && !coached.has(2)) {
      coached.add(2);
      pause(ctx.coach(2, stage));
    }
    showPost();
  }

  function weekEnd() {
    const ev = F.nextWeek(s);
    for (const e of ev) {
      if (e.type === "charge") {
        ctx.echo(`${e.sub.name} charged ${money(e.sub.monthly)}. From: the free trial you started.`);
        ctx.mistake({ type: "subscription", cost: e.sub.monthly, label: `${e.sub.name} charge`, quiet: true });
      } else if (e.type === "surprise") ctx.echo(`Surprise expense: ${money(deal.surprise.amount)} for a field trip.`);
      else if (e.type === "wishlist") ctx.echo(e.text, { kind: "good" });
      else if (e.type === "restock") ctx.notice(e.text);
    }
    if (s.done) return end();
    showPost();
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    const k = e.key.toLowerCase();
    const map = { b: "buy", s: "skip", w: "wish", arrowdown: "skip" };
    if (map[k]) (e.preventDefault(), act(map[k]));
    else if (k === "c") (e.preventDefault(), (subsOpen = !subsOpen), paint());
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = F.score(s);
    for (const r of sc.regrets) ctx.mistake({ type: "regret", cost: r.p.price, label: `Never used: ${r.p.name}`, quiet: true });
    if (sc.unmet) ctx.echo(`${sc.unmet} need${sc.unmet === 1 ? "" : "s"} never bought. ${per.name} had to go without.`);
    const reveal = h(
      "div.ff-reveal",
      h("div", h("h5", icon("heart", { size: 14 }), " Your wishlist"), s.wished.length ? h("ul", s.wished.map((p) => h("li", `${p.name}: came back with no tricks, and you ${s.bought.some((b) => b.from === p.id) ? "bought it" : "skipped it"}.`))) : h("p", "You didn't wishlist anything.")),
      h("div", h("h5", icon("receipt", { size: 14 }), " A week later"), sc.stamps.length ? h("ul.ff-stamps", sc.stamps.map((x) => h("li", { class: x.used ? "used" : "never" }, h("span.ff-stamp", x.used ? "USED IT" : "NEVER USED"), ` ${x.p.name}, ${money(x.p.price)}`))) : h("p", "No wants bought.")),
      h("p", `Needs met: ${sc.met} of ${per.needs.length}. Saved for ${per.goal[0]}: ${money(sc.savings)} of ${money(per.goal[1])}.`)
    );
    ctx.finish({ score: sc.score, tie: sc.spots, sub: { met: sc.met, unmet: sc.unmet, spots: sc.spots, regrets: sc.regrets.length, savings: sc.savings }, perfect: !sc.unmet && !sc.regrets.length && !sc.subCharges, reveal, biggest: F.biggest(s), stats: { persona: per.name } });
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
