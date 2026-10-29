// The Battle Arena (docs/BATTLES.md, teacher request 2026-10-26). A naturalist's
// field record of two creatures squaring off. The lobby is a notice board:
// computer opponents to practice on, classmates to challenge, challenges waiting
// for you and your record. A battle is turn by turn: pick a move, answer one quick
// money question, then both moves play out at once. Right answers make moves
// strong, and the worked math shows after every round.
//
// Live battles listen to Firestore only while this screen is open, write once per
// turn and save the game only at the start and the end (docs/BATTLE-SCALING.md).
import { h, fill, money, toast } from "../dom.js";
import { icon } from "../icons.js";
import { placeHeader } from "../place-header.js";
import { creatureSvg } from "../creature-art.js";
import { sealSvg, inkStampSvg } from "../bestiary-art.js";
import { timerRing } from "../arcade/components.js";
import { calculator } from "../minigames/calculator.js";
import { formulaBox } from "../formula.js";
import { QUESTION_TYPES } from "../../data/practice-questions.js";
import { burstFrom, burst } from "../motion/particles.js";
import { react } from "../motion/gaze.js";
import { confetti } from "../fx.js";
import { openBoardTab } from "./trophies.js";
import { motionOn } from "../motion/spring.js";
import { sfx, music, BATTLE_TRACKS } from "../sound.js";
import { synth } from "../arcade-sound.js";
import { CONFIG } from "../../data/config.js";
import { movesFor, moveById, BOT_NAMES, turnLine } from "../../data/battle.js";
import { publicLook } from "../../data/looks.js";
import { newBattle, resolveTurn, replayBattle, availableMoves, botAction } from "../../engine/index.js";
import * as BT from "../../battle.js";

const B = CONFIG.battle;
const ms = (x) => (typeof x === "number" ? x : x?.toMillis?.() ?? 0);

export function render(root, { game, go, track }) {
  const run = game.run;
  const me = game.user.uid;
  const classId = game.profile.classId;
  const creature = game.save.creature;
  const myName = creature?.name || "Your creature";
  const panel = h("section.panel.arena");
  root.append(h("div.bestiary.bst-arena", panel));

  const st = { directory: [], mine: [], loaded: false, liveError: "", match: null, timer: null, waitTimer: null, unsubMine: null, unsubMatch: null, gone: false };
  const rec = BT.ensureBattle(run.play);
  track("arenaOpen", { energy: run.play.energy || 0, wins: rec.wins });

  const header = () =>
    placeHeader({
      go,
      iconName: "shield",
      kicker: "Creatures in the field",
      title: "Battle Arena",
      subtitle: "Pick a move, answer a money question, and watch it play out. Right answers hit harder.",
      practice: run.practice,
      aside: purse(),
    });

  const purse = () =>
    h(
      "div.arena-purse",
      h("span.arena-purse-line", icon("energy", { size: 20 }), h("strong", `${run.play.energy || 0}/${CONFIG.pacing.rewards.energy.max}`), " Energy"),
      h("span.arena-purse-line", icon("coins", { size: 20 }), h("strong", money(run.life.checking)), " in checking"),
      h("small", `Each battle: ${B.energy} Energy and a ${money(B.fee)} entry fee.`)
    );

  // ---------- Lobby ----------

  function paintLobby() {
    if (st.gone || st.match) return;
    music.play("battleConfig");
    const can = BT.canEnter(run.life, run.play);
    const left = BT.botPrizesLeft(run.play);
    fill(
      panel,
      header(),
      run.practice ? h("p.callout", "Battles are closed in practice mode. Leave practice to battle.") : null,
      !run.practice && !can.ok ? h("p.callout.warn.arena-cant", icon("alert", { size: 18 }), " ", can.why) : null,
      h(
        "div.arena-board",
        h(
          "section.arena-note.arena-bots",
          h("h2", "Practice bouts"),
          h("p.arena-hand", left ? `Computer wins pay a prize ${left} more time${left === 1 ? "" : "s"} today.` : "No more computer prizes today. Bouts still count on your record."),
          h(
            "div.arena-bot-list",
            Object.entries(B.bots).map(([level, cfg]) => {
              const who = BOT_NAMES[level];
              return h(
                "article.arena-bot",
                h("span.arena-bot-art", { "aria-hidden": "true", html: creatureSvg({ species: who.species, palette: who.palette, accessories: {} }, { size: 96, label: "" }) }),
                h("div.arena-bot-words", h("strong", who.name), h("small", `${cfg.label}: answers right about ${Math.round(cfg.right * 100)}% of the time`)),
                h("button.small", { type: "button", disabled: run.practice || !can.ok, onclick: () => startBot(level) }, `Battle ${who.short}`)
              );
            })
          )
        ),
        h("section.arena-note.arena-live", h("h2", "Challenge a classmate"), liveBlock(can)),
        h("section.arena-note.arena-record", h("h2", "Your record"), recordBlock()),
        h("details.arena-how", h("summary", icon("scroll", { size: 18 }), " How battles work"), howBlock())
      )
    );
  }

  function liveBlock(can) {
    if (run.practice) return h("p", "Not in practice mode.");
    if (!classId) return h("p", "Join a class to battle classmates.");
    if (game.classInfo?.battles === false) return h("p", "Your teacher has classmate battles turned off right now. Practice bouts still work.");
    if (st.liveError) return h("p.callout.warn", st.liveError);
    if (!st.loaded) return h("p.arena-hand", "Looking around the class...");
    const incoming = st.mine.filter((b) => b.status === "invited" && b.players[1] === me && fresh(b));
    const outgoing = st.mine.filter((b) => b.status === "invited" && b.players[0] === me);
    const active = st.mine.filter((b) => b.status === "active");
    const busy = new Set(st.mine.flatMap((b) => b.players));
    const recent = (e) => Date.now() - ms(e.updatedAt) < 15 * 60000;
    const mates = st.directory.filter((e) => e.uid !== me).sort((a, b) => recent(b) - recent(a) || (b.xp || 0) - (a.xp || 0));
    return h(
      "div.arena-live-body",
      active.map((b) => h("div.arena-slip.active", icon("flag", { size: 18 }), h("span", `Your battle with ${otherName(b)} is still going.`), h("button.small", { type: "button", onclick: () => openLive(b) }, "Back to the battle"))),
      incoming.map((b) =>
        h(
          "div.arena-slip.incoming",
          icon("mail", { size: 18 }),
          h("span", h("strong", b.names[0]), " challenged you!"),
          h("button.small", { type: "button", disabled: !can.ok, onclick: () => accept(b) }, "Accept"),
          h("button.small.secondary", { type: "button", onclick: () => answer(b, "declined") }, "No thanks")
        )
      ),
      outgoing.map((b) =>
        h("div.arena-slip.outgoing", icon("clock", { size: 18 }), h("span", `Waiting for ${b.names[1]} to accept.`), h("button.small.secondary", { type: "button", onclick: () => answer(b, "cancelled") }, "Cancel"))
      ),
      mates.length
        ? h(
            "ul.arena-mates",
            mates.map((e) =>
              h(
                "li",
                h("span.arena-mate-art", { "aria-hidden": "true", html: creatureSvg(e.look || { species: e.species, palette: e.palette, accessories: {} }, { size: 48, label: "" }) }),
                h("span.arena-mate-words", h("strong", e.creatureName || "A classmate"), h("small", recent(e) ? "Here in the last 15 minutes" : "Not here lately")),
                h("button.small", { type: "button", disabled: !can.ok || busy.has(e.uid) || outgoing.length > 0 || active.length > 0, onclick: () => challenge(e) }, busy.has(e.uid) ? "Busy" : "Challenge")
              )
            )
          )
        : h("p", "No classmates on the board yet.")
    );
  }

  function recordBlock() {
    const r = BT.ensureBattle(run.play);
    const total = r.wins + r.losses + r.draws;
    return h(
      "div",
      h(
        "p.arena-tally",
        h("span", h("strong", String(r.wins)), " won"),
        h("span", h("strong", String(r.losses)), " lost"),
        h("span", h("strong", String(r.draws)), " tied"),
        h("span", h("strong", String(r.best)), " best streak")
      ),
      game.classInfo?.leaderboard === false || !classId ? null : h("button.small.secondary.arena-board-link", { type: "button", onclick: () => (openBoardTab("battles"), go("leaderboard")) }, icon("trophy", { size: 16 }), " See the class Battle wins board"),
      total
        ? h(
            "ol.arena-log",
            r.log.slice(0, 5).map((x) => h("li", h("span.arena-log-result", { class: x.result }, icon(x.result === "win" ? "trophy" : x.result === "loss" ? "x" : "minus", { size: 14 }), ` ${RESULT_WORD[x.result]}`), ` vs ${x.vs}, ${x.hp[0]} to ${x.hp[1]} HP`, x.prize ? `, +${money(x.prize)}` : ""))
          )
        : h("p.arena-hand", "No battles yet. Every champion started with zero.")
    );
  }

  function howBlock() {
    return h(
      "div.arena-how-body",
      h(
        "ol",
        h("li", "Both creatures start with ", h("strong", `${B.hp} HP`), `. A battle lasts up to ${B.maxTurns} rounds.`),
        h("li", "Each round, pick a move, then answer one money question. You have ", h("strong", `${B.roundSeconds} seconds`), "."),
        h("li", "A right answer plays your move at full power, and a fast one can land a critical hit. A wrong answer makes it much weaker."),
        h("li", "Both moves happen at the same time. Knock the other creature to 0 HP to win, or have more HP when time runs out."),
        h("li", `Prizes: ${money(B.prize.win)} for a win, ${money(B.prize.draw)} for a tie, and ${money(B.prize.loss)} for playing a classmate even if you lose. Computer prizes stop after ${B.botPrizesPerDay} a day.`)
      ),
      h("div.arena-move-key", movesFor().map((m) => h("div.arena-key", icon(m.icon, { size: 20 }), h("strong", m.name), h("span", m.does), h("small", m.echo))))
    );
  }

  const RESULT_WORD = { win: "Won", loss: "Lost", draw: "Tied" };
  const fresh = (b) => Date.now() - ms(b.createdAt) < B.inviteMinutes * 60000;
  const otherName = (b) => b.names[b.players[0] === me ? 1 : 0];

  // ---------- Live lobby actions ----------

  async function challenge(e) {
    const can = BT.canEnter(run.life, run.play);
    if (!can.ok) return toast(can.why, "warn");
    try {
      await game.db.createBattle({ classId, players: [me, e.uid], live: [me, e.uid], names: [myName.slice(0, 40), (e.creatureName || "A classmate").slice(0, 40)], seed: newSeed() });
      track("battleInvite", {});
      toast(`Challenge sent to ${e.creatureName}. It stays open for ${B.inviteMinutes} minutes.`);
    } catch (err) {
      liveFailed(err);
    }
  }

  async function answer(b, status) {
    try {
      await game.db.setBattleStatus(b.id, status);
      track(status === "declined" ? "battleDecline" : "battleCancel", {});
    } catch (err) {
      liveFailed(err);
    }
  }

  async function accept(b) {
    const can = BT.canEnter(run.life, run.play);
    if (!can.ok) return toast(can.why, "warn");
    try {
      await game.db.setBattleStatus(b.id, "active");
      track("battleAccept", {});
      openLive({ ...b, status: "active" });
    } catch (err) {
      liveFailed(err);
    }
  }

  function liveFailed(err) {
    console.warn("Battle", err);
    st.liveError = err?.code === "permission-denied" ? "Classmate battles aren't switched on yet. Your teacher needs to finish one setup step. Practice bouts work now." : "We couldn't reach the class right now. Try again in a moment.";
    track("battleError", { code: err?.code || "" });
    paintLobby();
  }

  const newSeed = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;

  // ---------- Matches ----------

  function baseMatch({ kind, slot, seed, names, vs }) {
    const players = [0, 1].map((i) => ({ uid: String(i), name: names[i] }));
    const start = { seed, players, ruleset: B.ruleset };
    return { kind, slot, seed, start, vs, battle: newBattle(start), turns: [], phase: "pick", move: null, round: null, shown: 0, myLast: null, finished: false, startedAt: Date.now(), right: 0, moves: "" };
  }

  async function startBot(level) {
    const paid = BT.payEntry(run.life, run.play);
    if (!paid.ok) return toast(paid.message, "warn");
    run.life = paid.life;
    const who = BOT_NAMES[level];
    st.match = baseMatch({ kind: "bot", slot: 0, seed: `${run.life.seed}:bout:${newSeed()}`, names: [myName, who.name], vs: { name: who.name, kind: "bot", level, look: { species: who.species, palette: who.palette, accessories: {} }, paid: true } });
    track("battleStart", { kind: "bot", level });
    battleMusic();
    await run.persist("battleStart");
    paintMatch();
  }

  async function openLive(b) {
    const slot = b.players.indexOf(me);
    if (slot < 0) return;
    const r = BT.ensureBattle(run.play);
    let paid = r.current?.id === b.id ? r.current.paid : null;
    if (paid == null) {
      const p = BT.payEntry(run.life, run.play);
      paid = p.ok;
      if (p.ok) run.life = p.life;
      r.current = { id: b.id, paid };
      track("battleStart", { kind: "live", paid });
      await run.persist("battleStart");
    }
    const other = st.directory.find((e) => e.uid === b.players[1 - slot]);
    st.match = baseMatch({ kind: "live", slot, seed: b.seed, names: b.names, vs: { name: b.names[1 - slot], kind: "live", look: other?.look || null, paid } });
    st.match.id = b.id;
    st.unsubMatch?.();
    st.unsubMatch = game.db.watchBattle(b.id, onLiveDoc, (err) => liveFailed(err));
    battleMusic();
    paintMatch();
  }

  // Every change to the live battle doc: rebuild the battle from both sides' answers.
  function onLiveDoc(doc) {
    const m = st.match;
    if (!m || m.kind !== "live" || !doc || st.gone) return;
    m.doc = doc;
    let battle = replayBattle(m.start, BT.turnsFrom(m.seed, doc.p0, doc.p1));
    if (doc.status === "abandoned" && !battle.over) return endNoContest(doc.endedBy === me);
    if (doc.status === "done" && !battle.over) battle = { ...battle, over: true, winner: doc.winner === -1 || doc.winner == null ? null : doc.winner };
    if (doc.status === "declined" || doc.status === "cancelled") return leaveMatch("That battle was called off.");
    const before = m.battle.turn;
    m.battle = battle;
    // Back after a refresh with this round already answered: wait for the other side.
    if (m.phase === "pick" && doc[`p${m.slot}`]?.[battle.turn]) {
      m.phase = "waiting";
      m.waitingSince ??= Date.now();
    }
    if (battle.turn > before && m.phase === "waiting") {
      clearInterval(st.waitTimer);
      m.phase = "reveal";
      paintMatch();
    } else if (battle.over && m.phase !== "reveal" && m.phase !== "over") {
      finish();
    } else if (m.phase === "waiting" || (m.phase === "pick" && battle.turn !== before)) paintMatch();
  }

  function paintMatch() {
    const m = st.match;
    if (!m || st.gone) return;
    const b = m.battle;
    const mine = b.sides[m.slot];
    const theirs = b.sides[1 - m.slot];
    fill(
      panel,
      h(
        "div.arena-match",
        h(
          "div.arena-top",
          h("span.arena-round", m.phase === "over" ? "Battle over" : `Round ${Math.min(b.turn + 1, B.maxTurns)} of ${B.maxTurns}`),
          m.phase !== "over" ? h("button.small.secondary.arena-giveup", { type: "button", onclick: giveUp }, "Give up") : null
        ),
        h("div.arena-field", side(mine, creature ? publicLook(creature) : null, "you", m.slot), h("div.arena-stage", stage()), side(theirs, m.vs.look, "them", 1 - m.slot))
      )
    );
    if (m.phase === "question") startClock();
    if (m.phase === "reveal" && m.fxTurn !== b.turn) {
      m.fxTurn = b.turn;
      playTurnFx();
    }
  }

  // ---------- Battle effects (teacher request 2026-10-26) ----------
  // A turn plays out in beats: each attacker lunges, the hit lands with a
  // shake, a flash and a damage number, shields flare, heals sparkle, and HP
  // bars drain with a ghost bar behind. A knockout topples the loser under a
  // K.O. stamp. The words in the turn log always say the same thing.

  function battleMusic() {
    music.play(BATTLE_TRACKS[Math.floor(Math.random() * BATTLE_TRACKS.length)]);
  }

  function playTurnFx() {
    const m = st.match;
    const b = m.battle;
    const t = b.log[b.turn - 1];
    const field = panel.querySelector(".arena-field");
    if (!field || !t) return;
    const sideEl = (slot) => field.querySelector(`.arena-side[data-slot="${slot}"]`);
    const beat = motionOn() ? 650 : 120;
    const later = (ms, fn) => setTimeout(() => !st.gone && st.match === m && m.phase === "reveal" && fn(), ms);
    const next = panel.querySelector(".arena-next");
    if (next) next.disabled = true;
    // Mine first, then theirs, then the HP bars catch up.
    const order = [m.slot, 1 - m.slot];
    order.forEach((i, k) => {
      const x = t[i];
      const me = sideEl(i);
      const them = sideEl(1 - i);
      later(k * beat, () => {
        if (x.move === "heal" || x.healed) {
          flash(me, "fx-heal");
          burstFrom(me.querySelector(".arena-art"), "hearts", { n: 12 });
          synth("heal");
          if (x.healed) floater(me, `+${x.healed}`, "heal");
          return;
        }
        if (x.move === "shield" || x.move === "guard" || x.move === "fund") {
          flash(me, "fx-shield");
          if (!t[1 - i].dealt && !x.blocked) synth("block");
          if (x.healed) floater(me, `Banked +${x.healed}`, "heal");
          return;
        }
        flash(me, "fx-lunge");
        synth("whoosh");
        later(180, () => {
          if (t[1 - i].blocked) {
            flash(them, "fx-block");
            synth("block");
            floater(them, `Blocked ${t[1 - i].blocked}`, "block");
          }
          if (x.dealt) {
            flash(them, x.crit ? "fx-crit" : "fx-hit");
            shake(x.crit ? "big" : "small");
            if (x.crit) sfx.attackLanded2();
            else sfx.attackLanded();
            burstFrom(them.querySelector(".arena-art"), "dust", { n: x.crit ? 24 : 12 });
            floater(them, `-${x.dealt}${x.crit ? " CRIT!" : ""}`, x.crit ? "crit" : "hit");
          } else if (!t[1 - i].blocked) {
            synth("miss");
            floater(them, "Miss", "miss");
          }
          if (t[1 - i].countered) later(260, () => (flash(me, "fx-hit"), floater(me, `-${t[1 - i].countered}`, "hit")));
        });
      });
    });
    later(2 * beat + 200, () => {
      [0, 1].forEach((i) => setHp(sideEl(i), b.sides[i].hp));
      const kos = [0, 1].filter((i) => b.sides[i].hp <= 0);
      if (b.over && kos.length) later(400, () => knockout(field, kos.map(sideEl)));
      later(b.over && kos.length && motionOn() ? 1700 : 300, () => {
        if (next) {
          next.disabled = false;
          next.focus();
        }
      });
    });
  }

  // A side's HP before the newest turn, rebuilt from the turns so far.
  function replayHp(slot) {
    const m = st.match;
    const turns = m.kind === "bot" ? m.turns : BT.turnsFrom(m.seed, m.doc?.p0, m.doc?.p1);
    return replayBattle(m.start, turns.slice(0, m.battle.turn - 1)).sides[slot].hp;
  }

  function flash(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 900);
  }

  function shake(size) {
    const box = panel.querySelector(".arena-match");
    if (box && motionOn()) flash(box, size === "big" ? "fx-shake-big" : "fx-shake");
  }

  function floater(el, text, kind) {
    if (!el) return;
    const f = h("span.arena-float", { class: kind, "aria-hidden": "true" }, text);
    el.append(f);
    setTimeout(() => f.remove(), 1400);
  }

  function setHp(el, hp) {
    if (!el) return;
    const pct = Math.max(0, Math.round((hp / B.hp) * 100));
    const meter = el.querySelector(".arena-hp");
    meter.style.setProperty("--hp", `${pct}%`);
    meter.setAttribute("aria-valuenow", String(hp));
    meter.classList.toggle("low", pct <= 30);
    el.classList.toggle("low", pct <= 30);
    el.querySelector(".arena-hp-num").textContent = `${hp} / ${B.hp} HP${pct <= 30 ? " (low)" : ""}`;
  }

  function knockout(field, losers) {
    field.append(h("span.arena-ko", { "aria-hidden": "true" }, "K.O.!"));
    shake("big");
    synth("ko");
    for (const el of losers) {
      if (!el) continue;
      el.classList.add("fx-ko");
      const r = el.getBoundingClientRect();
      burst("leaves", { x: r.left + r.width / 2, y: r.top + r.height / 3, n: 24 });
    }
  }

  function side(s, look, who, slot) {
    const m = st.match;
    // During a reveal the bars start at last turn's HP and drain in playTurnFx.
    const prev = m.phase === "reveal" && m.fxTurn !== m.battle.turn ? (m.battle.turn > 1 ? replayHp(slot) : B.hp) : s.hp;
    const pct = Math.max(0, Math.round((prev / B.hp) * 100));
    const low = pct <= 30;
    const effects = [
      s.shield ? h("li", icon("piggy", { size: 14 }), ` Cushion ${s.shield}`) : null,
      s.boost > 1 ? h("li", icon("up", { size: 14 }), " Next hit stronger") : null,
      ...s.dots.map((d) => h("li.bad", icon(d.kind === "compound" ? "chart" : "receipt", { size: 14 }), d.kind === "compound" ? ` Interest: ${d.ticks.join(", ")} more` : ` Loan payback: ${d.ticks.join(", ")} more`)),
    ].filter(Boolean);
    return h(
      "div.arena-side",
      { class: `${who}${low ? " low" : ""}${m.phase === "over" && s.hp <= 0 ? " ko-down" : ""}`, "data-slot": String(slot) },
      h("span.arena-art", { "aria-hidden": "true", html: look ? creatureSvg(look, { size: 170, label: "" }) : "" }),
      h("strong.arena-name", s.name, who === "you" ? h("small", " (you)") : null),
      h(
        "div.arena-hp",
        { role: "meter", "aria-label": `${s.name} health`, "aria-valuemin": "0", "aria-valuemax": String(B.hp), "aria-valuenow": String(prev), class: low ? "low" : "", style: `--hp: ${pct}%` },
        h("span.arena-hp-bar", h("span.arena-hp-ghost"), h("span.arena-hp-fill")),
        h("span.arena-hp-num", `${prev} / ${B.hp} HP${prev <= 0 && m.phase === "over" ? " (knocked out)" : low ? " (low)" : ""}`)
      ),
      effects.length ? h("ul.arena-effects", effects) : null
    );
  }

  function stage() {
    const m = st.match;
    if (m.phase === "pick") return pickStage();
    if (m.phase === "question") return questionStage();
    if (m.phase === "waiting") return waitingStage();
    if (m.phase === "reveal") return revealStage();
    return overStage();
  }

  function pickStage() {
    const m = st.match;
    const can = new Set(availableMoves(m.battle, m.slot));
    const cd = m.battle.sides[m.slot].cd;
    return h(
      "div.arena-pick",
      h("h2", "Pick a move"),
      h(
        "div.arena-moves",
        movesFor(m.battle.ruleset).map((mv, i) =>
          h(
            "button.arena-move",
            {
              type: "button",
              disabled: !can.has(mv.id),
              style: `--tilt: ${(i % 3) - 1}deg`,
              onclick: () => {
                m.move = mv.id;
                synth("whoosh");
                m.round = BT.roundFor(m.seed, m.battle.turn, m.slot);
                m.phase = "question";
                m.askedAt = Date.now();
                paintMatch();
              },
            },
            h("span.arena-move-head", icon(mv.icon, { size: 22 }), h("strong", mv.name)),
            h("small.arena-move-kind", mv.kind),
            h("span.arena-move-does", mv.does),
            can.has(mv.id) ? h("small.arena-move-echo", mv.echo) : h("small.arena-move-wait", icon("lock", { size: 12 }), ` Ready in ${cd[mv.id] + 1} round${cd[mv.id] + 1 === 1 ? "" : "s"}`)
          )
        )
      )
    );
  }

  function questionStage() {
    const m = st.match;
    const q = m.round;
    m.ring = timerRing({ size: 52, label: "Time left to answer" });
    // A fresh calculator for every question (teacher request 2026-10-27). It
    // stays open from round to round once a student opens it.
    const calcSlot = h("div.arena-calc-slot");
    const toggle = h("button.calc-toggle", { type: "button", "aria-expanded": "false", "data-sound": "none" }, "Calculator");
    const box = h(
      "div.arena-question",
      h("div.arena-q-head", h("span.arena-chosen", icon(moveById(m.move, m.battle.ruleset).icon, { size: 18 }), ` ${moveById(m.move, m.battle.ruleset).name}`), h("span.arena-q-tools", toggle, m.ring)),
      h(
        "div.arena-q-body",
        h(
          "div.arena-q-main",
          h("div.arena-q-prompt", q.prompt.map((line) => h("p", line))),
          formulaBox(QUESTION_TYPES[q.type]?.formula),
          h(
            "div.arena-choices",
            q.choices.map((c, i) => h("button.arena-choice", { type: "button", onclick: (e) => submit(i, e.currentTarget) }, h("span.arena-choice-letter", "ABCD"[i]), h("span", c)))
          )
        ),
        calcSlot
      )
    );
    const showCalc = (open, focus) => {
      st.calcOpen = open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Hide calculator" : "Calculator";
      box.classList.toggle("has-calc", open);
      calcSlot.replaceChildren(...(open ? [calculator({ onUse: () => track("calcUse", { game: "arena", kind: m.kind }) })] : []));
      if (open && focus) calcSlot.querySelector(".calc")?.focus({ preventScroll: true });
    };
    toggle.addEventListener("click", () => {
      showCalc(!st.calcOpen, true);
      if (st.calcOpen) track("calcOpen", { game: "arena" });
    });
    if (st.calcOpen) showCalc(true, false);
    return box;
  }

  function startClock() {
    const m = st.match;
    clearInterval(st.timer);
    const total = B.roundSeconds;
    const tick = () => {
      const left = total - (Date.now() - m.askedAt) / 1000;
      m.ring?.set(left, total);
      if (left <= 0) submit(-1, null);
    };
    tick();
    st.timer = setInterval(tick, 250);
  }

  async function submit(choice, el) {
    const m = st.match;
    if (!m || m.phase !== "question") return;
    clearInterval(st.timer);
    const frac = Math.max(0, 1 - (Date.now() - m.askedAt) / 1000 / B.roundSeconds);
    const stored = { m: m.move, c: choice, f: Math.round(frac * 100) / 100 };
    const turn = m.battle.turn;
    const mineAct = BT.actionFrom(m.seed, turn, m.slot, stored);
    m.myLast = { ...mineAct, round: m.round, choice, timedOut: choice < 0 };
    if (mineAct.correct) {
      m.right++;
      if (el) burstFrom(el, "motes");
      sfx.correct();
    }
    m.moves += m.move.charAt(0);
    if (m.kind === "bot") {
      const them = botAction(m.battle, 1 - m.slot, m.vs.level, m.seed);
      const acts = m.slot === 0 ? [mineAct, them] : [them, mineAct];
      m.turns.push(acts);
      m.battle = resolveTurn(m.battle, acts);
      m.phase = "reveal";
      return paintMatch();
    }
    m.phase = "waiting";
    m.waitingSince = Date.now();
    paintMatch();
    try {
      await game.db.submitTurn(m.id, m.slot, turn, stored);
    } catch (err) {
      liveFailed(err);
    }
    clearInterval(st.waitTimer);
    st.waitTimer = setInterval(() => st.match?.phase === "waiting" && paintMatch(), 5000);
  }

  function waitingStage() {
    const m = st.match;
    const waited = (Date.now() - m.waitingSince) / 1000;
    return h(
      "div.arena-waiting",
      yourAnswer(),
      h("p.arena-hand", `Waiting for ${m.vs.name} to answer...`),
      waited > B.waitSeconds
        ? h("div.arena-slip", h("span", `${m.vs.name} may have left. You can end the battle with no winner, and your Energy and fee come back.`), h("button.small", { type: "button", onclick: abandon }, "End with no winner"))
        : null
    );
  }

  function yourAnswer() {
    const m = st.match;
    const a = m.myLast;
    if (!a) return null;
    return h(
      "div.arena-answer",
      { class: a.correct ? "right" : "wrong" },
      h("p.arena-verdict", icon(a.correct ? "check" : "x", { size: 18 }), h("span", a.correct ? "Right! Full power." : a.timedOut ? `Time ran out. It was ${a.round.choices[a.round.answer]}.` : `Not quite. It was ${a.round.choices[a.round.answer]}.`)),
      h("p.arena-math", a.round.math)
    );
  }

  function revealStage() {
    const m = st.match;
    const b = m.battle;
    const t = b.log[b.turn - 1];
    const names = b.sides.map((s) => s.name);
    const lines = [m.slot, 1 - m.slot].map((i) => {
      const x = t[i];
      const tick = x.ticked ? ` ${names[i]} lost ${x.ticked} more to what's still hurting it.` : "";
      return h("li", { class: i === m.slot ? "mine" : "theirs" }, icon(moveById(x.move, b.ruleset).icon, { size: 18 }), ` ${turnLine(names[i], x, b.ruleset)}${tick}`);
    });
    return h(
      "div.arena-reveal",
      yourAnswer(),
      h("ul.arena-turn", lines),
      h("button.arena-next", { type: "button", onclick: () => (b.over ? finish() : nextRound()) }, b.over ? "See how it ended" : "Next round", icon("next", { size: 18 }))
    );
  }

  function nextRound() {
    const m = st.match;
    m.phase = "pick";
    m.move = null;
    m.myLast = null;
    paintMatch();
  }

  async function finish() {
    const m = st.match;
    if (!m || m.finished) return;
    m.finished = true;
    m.phase = "over";
    clearInterval(st.timer);
    clearInterval(st.waitTimer);
    const r = BT.finishBattle(run.life, run.play, m.battle, m.slot, { name: m.vs.name, kind: m.kind, level: m.vs.level, unpaid: !m.vs.paid });
    run.life = r.life;
    m.result = r;
    const rec = BT.ensureBattle(run.play);
    if (m.kind === "live") {
      rec.current = null;
      if (m.doc?.status === "active") game.db.endBattle(m.id, { status: "done", winner: m.battle.winner ?? -1 }).catch(() => {});
    }
    track("battleEnd", { kind: m.kind, level: m.vs.level || "", result: r.result, prize: r.prize, turns: m.battle.turn, right: m.right, hp: m.battle.sides.map((s) => s.hp).join("-"), moves: m.moves, seconds: Math.round((Date.now() - m.startedAt) / 1000) });
    music.once("battleEnd");
    paintMatch();
    // The big moment (teacher request 2026-10-26): a full-screen end card with
    // the summary, then the battle report underneath. Saving waits until it
    // closes, so new achievements pop up after it, not on top of it.
    await endScreen(m, r);
    m.saved = true;
    await run.persist("battleEnd");
  }

  // Victory gets falling leaves in waves, the creature hopping and a huge
  // stamp. A loss or a tie gets a calmer card. Both show the summary.
  function endScreen(m, r) {
    const b = m.battle;
    const mine = b.log.map((t) => t[m.slot]);
    const stats = [
      ["Rounds", String(b.turn)],
      ["Right answers", `${m.right} of ${b.turn}`],
      ["Damage dealt", String(mine.reduce((s, t) => s + (t.dealt || 0), 0))],
      ["Critical hits", String(mine.filter((t) => t.crit).length)],
      ["Healed", String(mine.reduce((s, t) => s + (t.healed || 0), 0))],
    ];
    const ko = b.sides[1 - m.slot].hp <= 0;
    const win = r.result === "win";
    const title = { win: "VICTORY!", loss: "Defeated", draw: "A tie!" }[r.result] || "Battle over";
    const line = {
      win: `${b.sides[m.slot].name} beat ${m.vs.name}${ko ? " by knockout" : ""}! What a battle.`,
      loss: `${m.vs.name} won this one. ${b.sides[m.slot].name} is already planning a rematch.`,
      draw: "Nobody gave an inch. It's dead even.",
    }[r.result];
    const prize = r.prize ? `+${money(r.prize)} prize went into checking.` : r.capped ? "No prize. Computer prizes are used up for today." : !m.vs.paid ? "No prize, since the entry fee wasn't paid." : "No prize this time.";
    const cont = h("button.bst-seal-btn", { type: "button" }, h("span.bst-seal-wax", { html: sealSvg({ seed: 77, size: 80, letter: win ? "V" : "A" }) }), h("span.bst-seal-text", "See the battle report"));
    const critter = h("div.be-creature", { "aria-hidden": "true", html: creature ? creatureSvg(publicLook(creature), { size: win ? 230 : 170, label: "" }) : "" });
    const dialog = h(
      "dialog.celebrate.bst-scope.bst-celebrate.battle-end",
      { class: r.result, "aria-labelledby": "be-title", "aria-describedby": "be-text" },
      h("div.be-glow", { "aria-hidden": "true" }),
      h(
        "div.celebrate-body.be-body",
        h("p.be-stamp", { id: "be-title" }, title),
        critter,
        h("p", { id: "be-text" }, line),
        h("p.celebrate-xp.be-prize", icon("coins", { size: 22 }), ` ${prize}`),
        h("dl.be-stats", stats.map(([k, v]) => h("div", h("dt", k), h("dd", v)))),
        h("div.row", cont)
      )
    );
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(() => dialog.open && fn(), ms));
    document.body.append(dialog);
    dialog.showModal();
    cont.focus();
    track("battleEndScreen", { result: r.result, ko });
    if (win) {
      [0, 600, 1200, 1900, 2700].forEach((ms) => later(ms, () => dialog.prepend(confetti(80))));
      later(200, () => burstFrom(critter, "leaves", { n: 40 }));
      later(500, () => burstFrom(dialog.querySelector(".be-prize"), "coins", { n: 20 }));
      later(1300, () => burstFrom(critter, "motes", { n: 30 }));
      later(300, () => react("happy"));
      later(1400, () => react("happy"));
    }
    return new Promise((done) => {
      const close = () => {
        timers.forEach(clearTimeout);
        if (dialog.open) dialog.close();
        dialog.remove();
        done();
      };
      cont.addEventListener("click", close);
      dialog.addEventListener("cancel", (e) => (e.preventDefault(), close()));
      m.closeEnd = close;
    });
  }

  function overStage() {
    const m = st.match;
    const r = m.result || {};
    const b = m.battle;
    const stamp = { win: "WON", loss: "LOST", draw: "TIED" }[r.result] || "OVER";
    const title = { win: "You won!", loss: "You lost this one", draw: "A tie" }[r.result] || "Over";
    const noPrize = r.capped ? " No prize. Computer prizes are used up for today." : !m.vs.paid ? " No prize, since the entry fee wasn't paid." : " No prize for losing to the computer. The fee paid for the practice.";
    const words = {
      win: `${b.sides[m.slot].name} stands tall. The field notes call it a clean win.`,
      loss: `${b.sides[m.slot].name} takes a seat on a mossy log to think it over. Next time.`,
      draw: "Both creatures run out of steam at the same moment. It's a tie.",
    }[r.result];
    return h(
      "div.arena-over",
      h("span.arena-stamp", { "aria-hidden": "true", html: inkStampSvg(stamp, { seed: 9 }) }),
      h("h2", title),
      h("p", words),
      h("p.arena-prize", icon("coins", { size: 18 }), r.prize ? ` +${money(r.prize)} prize went into checking.` : noPrize),
      h("button.bst-seal-btn", { type: "button", onclick: () => leaveMatch() }, h("span.bst-seal-wax", { html: sealSvg({ seed: 41, size: 72, letter: "A" }) }), h("span.bst-seal-text", "Back to the Arena"))
    );
  }

  async function giveUp() {
    const m = st.match;
    if (!m || m.finished) return;
    if (!confirm("Give up this battle? It counts as a loss.")) return;
    clearInterval(st.timer);
    m.battle = { ...m.battle, over: true, winner: 1 - m.slot };
    if (m.kind === "live") game.db.endBattle(m.id, { status: "done", winner: 1 - m.slot, endedBy: me }).catch(() => {});
    track("battleGiveUp", { kind: m.kind, turn: m.battle.turn });
    await finish();
  }

  async function abandon() {
    const m = st.match;
    try {
      await game.db.endBattle(m.id, { status: "abandoned", endedBy: me });
    } catch (err) {
      return liveFailed(err);
    }
    endNoContest(true);
  }

  // A live battle that ended with no winner. Whoever stayed gets the entry back.
  async function endNoContest(stayed) {
    const m = st.match;
    if (!m || m.finished) return;
    m.finished = true;
    const rec = BT.ensureBattle(run.play);
    rec.current = null;
    if (stayed && m.vs.paid) run.life = BT.refundEntry(run.life, run.play).life;
    track("battleAbandoned", { stayed, turn: m.battle.turn });
    await run.persist("battleAbandoned");
    leaveMatch(stayed ? "The battle ended with no winner. Your Energy and fee came back." : "The battle ended with no winner.");
  }

  function leaveMatch(message = "") {
    clearInterval(st.timer);
    clearInterval(st.waitTimer);
    st.unsubMatch?.();
    st.unsubMatch = null;
    st.match = null;
    if (message) toast(message);
    paintLobby();
  }

  // ---------- Live listeners, only while the Arena is open ----------

  async function loadLive() {
    if (run.practice || !classId || game.classInfo?.battles === false || !game.db?.watchMyBattles) return;
    try {
      st.directory = await game.db.readLeaderboard(classId);
    } catch (err) {
      console.warn("Arena roster", err);
    }
    st.unsubMine = game.db.watchMyBattles(
      me,
      (list) => {
        const wasWaiting = new Set(st.mine.filter((b) => b.status === "invited" && b.players[0] === me).map((b) => b.id));
        st.mine = list;
        st.loaded = true;
        // Old invites I sent close themselves.
        for (const b of list) if (b.status === "invited" && b.players[0] === me && !fresh(b)) game.db.setBattleStatus(b.id, "cancelled").catch(() => {});
        // My challenge was accepted: jump in.
        const started = list.find((b) => b.status === "active" && wasWaiting.has(b.id));
        if (started && !st.match) {
          toast(`${started.names[1]} accepted! The battle starts now.`);
          return openLive(started);
        }
        paintLobby();
      },
      (err) => liveFailed(err)
    );
  }

  paintLobby();
  loadLive();

  return () => {
    st.gone = true;
    music.stop();
    st.match?.closeEnd?.();
    if (st.match?.result && !st.match.saved) run.persist("battleEnd");
    clearInterval(st.timer);
    clearInterval(st.waitTimer);
    st.unsubMine?.();
    st.unsubMatch?.();
    // Walking out of a computer bout counts as giving up, so it can't be restarted for a better result.
    const m = st.match;
    if (m && m.kind === "bot" && !m.finished) {
      m.finished = true;
      const r = BT.finishBattle(run.life, run.play, { ...m.battle, over: true, winner: 1 - m.slot }, m.slot, { name: m.vs.name, kind: "bot", level: m.vs.level, unpaid: true });
      run.life = r.life;
      track("battleEnd", { kind: "bot", level: m.vs.level, result: "loss", prize: 0, turns: m.battle.turn, right: m.right, left: true });
      run.persist("battleLeft");
    }
  };
}
