// Check Writer (GAME-SPECS.md game 2, upgraded 2026-10-25): write a rent check
// with word tiles and the line tool, endorse a paycheck for mobile deposit, then
// judge three checks at the Vault counter. Skip a line and one of them is your
// own check, washed. Rules: js/arcade/checks.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { createRng } from "../../engine/index.js";
import { CW_TILE_GROUPS, CW_ENDORSE } from "../../data/arcade/checks.js";
import { CHECK_FIELDS, amountInWords } from "../../data/minigames.js";
import { fullName } from "../../data/creatures.js";
import * as K from "../../arcade/checks.js";
import { askSignature, signatureMark } from "../signature-pad.js";
import { keyHelp, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const FIELD_LABELS = { ...CHECK_FIELDS, lines: "Lines through the empty space" };

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const cfg = CONFIG.arcade.games.checks;
  const timed = settings.timer === "timed";
  const name = (ctx.creature && (fullName(ctx.creature) || ctx.creature.name)) || "You";
  const deal = K.newShift(seed, { writer: name });
  const autoDate = !training && (ctx.play?.arcade?.log || []).some((e) => e.g === "checks");
  const rng = createRng(`${seed}:cents`);
  const started = Date.now();
  let over = false;
  let tick = null;
  let frontSig = null;
  let endorse = null;
  const calls = [];
  const w = { date: autoDate ? deal.bill.date : "", payee: "", amount: "", tiles: [], cents: "", signed: false, lines: { payee: false, words: false } };
  const root = h("div.minigame.checks2");
  const bar = h("div.mg-bar");
  const body = h("div.cw2-body");
  const ring = timed ? timerRing({ label: "Time left this shift" }) : null;
  fill(root, bar, body);

  function paintBar(step) {
    window.scrollTo(0, 0);
    fill(bar, h("span.mg-clock", step), ring, h("span.mg-score", `Today is ${K.dateText(deal.today)}`));
  }

  // ---------- Phase 1: write the check ----------
  const right = deal.bill.cents % 100;
  // Smallest first, so the order gives nothing away and is easy to scan.
  const centsTiles = [right, (right + 10) % 100, (right + 37) % 100, (right + 71) % 100].sort((a, b) => a - b).map((c) => `${String(c).padStart(2, "0")}/100`);

  function phaseWrite() {
    paintBar("Part 1 of 3: write your rent check");
    const input = (key, label, attrs = {}) => {
      const el = h("input", { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": label, value: w[key], ...attrs });
      el.addEventListener("input", () => (w[key] = el.value));
      return el;
    };
    const dateIn = autoDate ? h("span.cw2-fill", deal.bill.date) : input("date", "Date", { placeholder: "Month day, year" });
    const payeeIn = input("payee", "Pay to the order of", { "data-line": "payee" });
    const amountIn = input("amount", "Amount in numbers", { inputmode: "decimal", placeholder: "0.00" });
    const memoIn = h("input", { type: "text", "aria-label": "Memo (optional)", placeholder: "Memo (optional)" });
    const wordsBox = h("div.cw2-words", { tabindex: "0", role: "group", "aria-label": "Amount in words. Add tiles below. Backspace removes the last one.", "data-line": "words" });
    const lineBtn = (key) => h("button.cw2-linebtn", { type: "button", "aria-pressed": String(w.lines[key]), onclick: () => drawLine(key) }, w.lines[key] ? "Line drawn" : "Draw a line (L)");
    const payeeLine = h("span.cw2-line", { class: "payee" });
    const wordsLine = h("span.cw2-line", { class: "words" });
    const payeeLineBtn = lineBtn("payee");
    const wordsLineBtn = lineBtn("words");
    const sigSlot = h("button.sig-slot", { type: "button", "aria-keyshortcuts": "S", onclick: () => sign() }, frontSig ? signatureMark(frontSig) : "Sign here (S)");
    const paintWords = () => {
      fill(wordsBox, w.tiles.length || w.cents ? [...w.tiles.map((t, i) => h("span.cw2-tile.placed", { title: "Remove", onclick: () => ((w.tiles = w.tiles.filter((_, k) => k !== i)), paintWords()) }, t.toUpperCase())), w.cents ? h("span.cw2-tile.placed.cents", { onclick: () => ((w.cents = ""), paintWords()) }, w.cents) : null] : h("span.cw2-hint", "Tap tiles to build the amount in words"));
      wordsBox.append(wordsLine);
      wordsLine.classList.toggle("on", w.lines.words);
    };
    const drawLine = (key) => {
      w.lines[key] = !w.lines[key];
      ctx.track("checkLine", { field: key, on: w.lines[key] });
      (key === "payee" ? payeeLine : wordsLine).classList.toggle("on", w.lines[key]);
      const btn = key === "payee" ? payeeLineBtn : wordsLineBtn;
      btn.setAttribute("aria-pressed", String(w.lines[key]));
      btn.textContent = w.lines[key] ? "Line drawn" : "Draw a line (L)";
      if (w.lines[key]) sfx.correct();
    };
    async function sign() {
      const sig = await askSignature({ name, title: "Sign the front of your check" });
      if (!sig) return;
      frontSig = sig;
      w.signed = true;
      ctx.track("checkSigned", { side: "front", kind: sig.kind });
      fill(sigSlot, signatureMark(sig));
    }
    // Number words in labeled rows on the left. Joining words, cents and the
    // undo buttons on the right.
    const row = (label, tiles, cls = "") => h("div.cw2-row", { role: "group", "aria-label": label }, h("span.cw2-rowlabel", label), h("div.cw2-rowtiles", { class: cls }, tiles));
    const wordTile = (t) => h("button.cw2-tile", { type: "button", onclick: () => (w.tiles.push(t), paintWords()) }, t.toUpperCase());
    const [big, ...numbers] = [CW_TILE_GROUPS.at(-1), ...CW_TILE_GROUPS.slice(0, -1)];
    const undo = () => (w.cents ? (w.cents = "") : w.tiles.pop(), paintWords());
    const tray = h(
      "div.cw2-tray",
      { role: "group", "aria-label": "Word tiles" },
      h("div.cw2-traycol.numbers", numbers.map((g) => row(g.label, g.tiles.map(wordTile), "grid"))),
      h(
        "div.cw2-traycol.extras",
        row(big.label, big.tiles.map(wordTile)),
        row("Cents", centsTiles.map((c) => h("button.cw2-tile.cents", { type: "button", onclick: () => ((w.cents = c), paintWords()) }, c))),
        h("div.cw2-trayedit", h("button.cw2-edit", { type: "button", onclick: undo }, icon("back", { size: 14 }), " Undo last tile"), h("button.cw2-edit", { type: "button", onclick: () => ((w.tiles = []), (w.cents = ""), paintWords()) }, icon("x", { size: 14 }), " Clear words"))
      )
    );
    const check = h(
      "div.check.cw2-check",
      { role: "group", "aria-label": "Your check" },
      h("div.check-top", h("span.check-owner", name, h("br"), "Coinhaven"), h("label.check-date", "Date ", dateIn), h("span.check-no", "No. 101")),
      h("div.check-line", h("label", "Pay to the order of"), h("span.cw2-field", payeeIn, payeeLine), payeeLineBtn, h("span.check-dollar", "$"), amountIn),
      h("div.check-line.cw2-wordsrow", wordsBox, wordsLineBtn, h("span", "Dollars")),
      h("div.check-bank", "The Vault"),
      h("div.check-bottom", h("label", "Memo"), memoIn, h("div.check-sign", sigSlot, h("small", "Signature"))),
      h("p.cw2-micr", "⑆071000013⑆ 448210377⑈ 101")
    );
    const send = h("button.big.cw2-send", { type: "button", onclick: () => sendCheck() }, "Send the check");
    fill(
      body,
      h(
        "div.cw2-desk",
        h("div.cw2-left", h("aside.bill-paper.cw2-bill", h("p.bill-from", h("strong", deal.bill.payee)), h("p", "Your landlord only takes checks."), h("p.bill-due", "Rent due ", h("strong", money(deal.bill.cents / 100))), h("p", "Memo: ", h("strong", deal.bill.memo)), h("p", "Today: ", h("strong", deal.bill.date)), autoDate ? h("p.muted", "The date fills itself in now.") : null), send),
        check
      ),
      tray,
      keyHelp("Tab moves between fields and tiles, Enter places a tile, Backspace removes the last tile, L draws a line (outside a text box), S signs.")
    );
    paintWords();
    payeeLine.classList.toggle("on", w.lines.payee);
    keys = (e) => {
      // Letters type normally inside a text box. L and S work everywhere else.
      if (e.target.matches?.("input")) return;
      const k = e.key.toLowerCase();
      if (k === "l") {
        const field = document.activeElement?.closest?.("[data-line]")?.dataset.line || (document.activeElement === wordsBox ? "words" : null);
        e.preventDefault();
        drawLine(field || (w.lines.payee ? "words" : "payee"));
      } else if (k === "s") (e.preventDefault(), sign());
      else if (e.key === "Backspace" && (w.tiles.length || w.cents)) (e.preventDefault(), undo());
    };
    if (training) {
      (async () => {
        await ctx.coach(0, payeeIn);
        await ctx.coach(1, tray);
        await ctx.coach(2, payeeLineBtn);
      })();
    }
    (autoDate ? payeeIn : dateIn).focus?.();
  }

  function sendCheck() {
    const g = K.gradeWrite(deal, w);
    const n = Object.values(g).filter(Boolean).length;
    ctx.track("checkGraded", { right: n, ...Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v ? 1 : 0])) });
    (n === 6 ? sfx.correct : sfx.error)();
    const correct = { date: deal.bill.date, payee: deal.bill.payee, amount: (deal.bill.cents / 100).toFixed(2), words: amountInWords(deal.bill.cents), signature: "Your signature on the front", lines: "A line after the payee and after the words" };
    paintBar("Part 1 of 3: how did your check do?");
    fill(
      body,
      h("ul.check-grade.cw2-grade", Object.keys(g).map((k) => h("li", { class: g[k] ? "good" : "bad" }, h("strong", `${g[k] ? "✓" : "✗"} ${FIELD_LABELS[k]}`), g[k] ? null : h("span", ` should be: ${correct[k]}`)))),
      !g.lines ? h("p.cw2-warn", icon("alert", { size: 18 }), " You left empty space on your check. Keep an eye out at the Vault later...") : null,
      h("div.cw2-actions", h("button.big", { type: "button", "data-autofocus": "", onclick: phaseEndorse }, "Get my paycheck"))
    );
    keys = (e) => e.key === "Enter" && !e.target.closest("button") && (e.preventDefault(), phaseEndorse());
    body.querySelector("button").focus();
  }

  // ---------- Phase 2: mobile deposit ----------
  function phaseEndorse() {
    paintBar("Part 2 of 3: deposit your paycheck with your phone");
    const pay = 180 + Math.floor(rng.next() * 120);
    const pick = async (opt) => {
      if (endorse) return;
      if (!frontSig) {
        const sig = await askSignature({ name, title: "Sign the back of your paycheck" });
        if (!sig) return;
        frontSig = sig;
      }
      endorse = opt.id;
      ctx.track("checkEndorse", { pick: opt.id, right: Boolean(opt.right) });
      (opt.right ? sfx.correct : sfx.error)();
      if (!opt.right) ctx.mistake({ type: "endorse", cost: cfg.badEndorse, label: "Wrong endorsement" });
      fill(choices, h("p.mg-flash", { class: opt.right ? "good" : "bad" }, icon(opt.right ? "check" : "alert", { size: 18 }), ` ${opt.why}`), h("button.big", { type: "button", "data-autofocus": "", onclick: phaseJudge }, "Go to the Vault counter"));
      choices.querySelector("button").focus();
      keys = (e) => e.key === "Enter" && !e.target.closest("button") && (e.preventDefault(), phaseJudge());
    };
    const choices = h("div.cw2-endorse", CW_ENDORSE.map((o, i) => h("button.cw2-opt", { type: "button", onclick: () => pick(o) }, h("kbd", String(i + 1)), ` ${o.label}`)));
    fill(
      body,
      h("p.cw-note", "Your boss paid you by check. Snap a photo in your bank app. What do you write on the back?"),
      h(
        "div.cw-pair",
        h("figure", h("figcaption", "Front"), h("div.check.paycheck", h("div.check-top", h("span.check-owner", "Sneaker Hut", h("br"), "Payroll"), h("span.check-date", deal.bill.date), h("span.check-no", `No. ${deal.payNo}`)), h("div.check-line", h("span", "Pay to the order of"), h("strong.check-fill", name), h("span.check-dollar", "$"), h("strong.check-fill", `${pay}.00`)), h("div.check-line", h("strong.check-fill", amountInWords(pay * 100)), h("span", "Dollars")))),
        h("figure", h("figcaption", "Back"), h("div.check.check-back", h("p.endorse-title", "ENDORSE HERE"), h("p.endorse-note", "DO NOT WRITE BELOW THIS LINE")))
      ),
      choices
    );
    keys = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 3) (e.preventDefault(), pick(CW_ENDORSE[n - 1]));
    };
  }

  // ---------- Phase 3: the Vault counter ----------
  let checks = [];
  let at = 0;
  function phaseJudge() {
    checks = K.counterChecks(deal, w);
    at = 0;
    showCheck();
  }

  function checkView(k) {
    const numbers = k.altered ? h("strong.check-fill.cw2-altered", h("span.cw2-added", { title: "The ink looks different here" }, k.own ? "1," : String(k.altered.added).charAt(0)), k.own ? k.numbers.replace(/^1/, "") : k.numbers.slice(1)) : h("strong.check-fill", k.numbers);
    const words = k.own ? h("strong.check-fill", h("span.cw2-added", "One thousand "), k.words.replace(/^One thousand /, "")) : h("strong.check-fill", k.words);
    return h(
      "div.cw2-pair",
      h(
        "div.check.cw2-judge",
        h("div.check-top", h("span.check-owner", k.writer, h("br"), "Coinhaven"), h("span.check-date", k.date), h("span.check-no", `No. ${k.checkno}`)),
        h("div.check-line", h("span", "Pay to the order of"), h("strong.check-fill", k.payee), h("span.check-dollar", "$"), numbers),
        h("div.check-line", words, h("span", "Dollars")),
        h("div.check-bottom", h("span", "Memo"), h("div.check-sign", h("span.cw2-sig", k.signedAs), h("small", "Signature"))),
        h("p.cw2-micr", `⑆${k.routing}⑆ ${k.account}⑈ ${k.checkno}`)
      ),
      h("div.check.check-back.cw2-back", h("p.endorse-title", "BACK: ENDORSE HERE"), k.endorsed ? h("span.cw2-sig", k.payee) : h("p.cw2-blank", "(blank)"))
    );
  }

  function showCheck() {
    if (at >= checks.length) return end();
    const k = checks[at];
    paintBar(`Part 3 of 3: the Vault counter, check ${at + 1} of ${checks.length}`);
    const call = (c) => judge(c);
    fill(
      body,
      h(
        "div.cw2-counter",
        h("div.cw2-main", h("p.cw2-push", icon("plaza", { size: 18 }), ` ${k.payee}: "${k.push}"`), checkView(k)),
        h(
          "aside.cw2-card",
          h("h5", "Signature card on file"),
          h("p", "Account holder: ", h("strong", k.card)),
          h("span.cw2-sig.big", k.card),
          h("p", k.newDays ? `${k.payee}'s account was opened ${k.newDays} day${k.newDays === 1 ? "" : "s"} ago.` : `${k.payee} has banked here for years.`),
          h("p.muted", `Today is ${K.dateText(deal.today)}.`)
        )
      ),
      h("div.cw2-calls", h("button.big.cash", { type: "button", onclick: () => call("cash") }, h("kbd", "C"), " Cash"), h("button.big.hold", { type: "button", onclick: () => call("hold") }, h("kbd", "H"), " Hold"), h("button.big.reject", { type: "button", onclick: () => call("reject") }, h("kbd", "R"), " Reject"))
    );
    keys = (e) => {
      const c = { c: "cash", h: "hold", r: "reject" }[e.key.toLowerCase()];
      if (c) (e.preventDefault(), call(c));
    };
  }

  function judge(c) {
    const k = checks[at];
    calls[at] = c;
    const ok = K.callRight(k, c);
    ctx.track("checkJudge", { kind: k.kind, call: c, right: ok });
    (ok ? sfx.correct : sfx.error)();
    if (c === "cash" && k.call !== "cash") ctx.mistake({ type: "badCash", cost: cfg.badCash, label: `Cashed a bad check for ${k.payee}` });
    if (k.own) ctx.echo("This is your check. Someone added to the empty space. From: your rent check, part 1.");
    const next = h("button.big", { type: "button", "data-autofocus": "", onclick: () => ((at += 1), showCheck()) }, at + 1 < checks.length ? "Next customer" : "Close the counter");
    body.querySelector(".cw2-calls").replaceWith(h("div.cw2-verdict", h("p.mg-flash", { class: ok ? "good" : "bad" }, icon(ok ? "check" : "alert", { size: 18 }), ok ? ` Right call: ${c}. ` : ` The right call was ${k.call}. `, k.why), next));
    next.focus();
    keys = (e) => e.key === "Enter" && !e.target.closest("button") && (e.preventDefault(), next.click());
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = K.score(deal, w, endorse, calls);
    if (sc.washed) ctx.mistake({ type: "washed", cost: cfg.washedCost, label: "Your own check got washed" });
    const seconds = Math.round((Date.now() - started) / 1000);
    const reveal = h(
      "div.cw2-reveal",
      h("ul.bd-reveal-list", h("li", icon(sc.fields === 6 ? "check" : "alert", { size: 14 }), ` ${sc.fields} of 6 check fields right`), h("li", icon(sc.endorse ? "check" : "alert", { size: 14 }), sc.endorse ? " Endorsed for mobile deposit" : " Wrong endorsement"), h("li", icon("vault", { size: 14 }), ` ${sc.right} of ${sc.checks.length} right calls`), h("li", icon(sc.washed ? "alert" : "check", { size: 14 }), sc.washed ? " Your check got washed" : " No washing")),
      h("ol.cw2-calls-list", sc.checks.map((k, i) => h("li", `${k.own ? "Your own check" : `${k.payee}'s check`}: you said ${calls[i] || "nothing"}, the right call was ${k.call}.`)))
    );
    ctx.finish({ score: sc.score, tie: seconds, sub: { fields: sc.fields, endorse: sc.endorse, right: sc.right, washed: sc.washed }, perfect: sc.score === 150, reveal, biggest: K.biggest(deal, w, calls), stats: { autoDate } });
  }

  let keys = null;
  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("dialog, .arc-coach")) return;
    keys?.(e);
  }
  document.addEventListener("keydown", onKey);
  if (timed) {
    const endAt = Date.now() + cfg.seconds * 1000;
    tick = setInterval(() => {
      const left = (endAt - Date.now()) / 1000;
      ring.set(left, cfg.seconds);
      if (left <= 0) {
        if (!checks.length) checks = K.counterChecks(deal, w);
        end();
      }
    }, 250);
  }
  phaseWrite();
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
