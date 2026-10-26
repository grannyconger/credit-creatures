// Bill Drop (GAME-SPECS.md game 3): a 30-day month of bills arriving by text,
// email, app and paper mail. Log them, pick pay days, keep the balance line
// above $0. The rules live in js/arcade/billdrop.js. This draws them.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import { createRng } from "../../engine/index.js";
import * as B from "../../arcade/billdrop.js";
import { TYPE_LABEL, CHANNEL_LABEL, NOTICE_TEXT } from "../../data/arcade/billdrop.js";
import { cashTimeline, eventCard, keyHelp, simplified } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const CHANNEL_ICON = { text: "phone", email: "mail", mail: "scroll", app: "inbox" };
const noticeText = (b) => NOTICE_TEXT[b.channel].replace("{name}", b.company).replace("{amount}", money(b.type === "card" ? b.amount : b.amount)).replace("{due}", String(b.due));

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const difficulty = training ? "easy" : settings.difficulty;
  const timed = settings.timer === "timed";
  const month = B.newMonth(seed, difficulty);
  const s = B.newState(month);
  const cfg = CONFIG.arcade.games.billdrop;
  let selected = null;
  let pendingDay = null;
  let mailboxOpen = false;
  let mailSeen = new Set();
  let tick = null;
  let paused = false;
  let over = false;
  let blocking = 0;
  let fixMenu = false;
  const coached = new Set();

  const root = h("div.minigame.billdrop");
  const timeline = cashTimeline({ unit: "Day", title: "Your balance this month" });
  const tray = h("section.bd-tray", { "aria-label": "Notifications" });
  const desk = h("section.bd-desk", { "aria-label": "Selected bill" });
  const cal = h("section.bd-cal", { "aria-label": "Your calendar" });
  const side = h("section.bd-side");
  const overlay = h("div.bd-overlay");

  // ---------- Skill moment ----------
  function skillMoment() {
    const rng = createRng(`${seed}:skill`);
    const bal = rng.int(30, 45) * 10;
    const rent = rng.int(75, 90) * 10;
    const pay = rng.int(60, 70) * 10;
    const short = rent - bal;
    const box = h("div.bd-skill");
    const step2 = () => {
      const input = h("input.bd-skill-num", { type: "text", inputmode: "decimal", "aria-label": "How much short, in dollars", "data-autofocus": "" });
      const check = h("button", { type: "button" }, "Check");
      const go = () => {
        const n = Number(input.value.replace(/[$,\s]/g, ""));
        const right = Math.abs(n - short) < 0.01;
        ctx.track("skillMoment", { game: "billdrop", step: "short", right });
        right ? sfx.correct() : sfx.error();
        fill(box, h("p.mg-flash", { class: right ? "good" : "bad" }, icon(right ? "check" : "alert", { size: 18 }), right ? ` Right. $${rent} minus $${bal} is $${short} short.` : ` It's $${short}. Rent $${rent} minus your $${bal} balance.`), h("p", "From here on, your balance line does this math for you."), h("button.big", { type: "button", "data-autofocus": "", onclick: begin }, "Start the month"));
        box.querySelector("button").focus();
      };
      check.addEventListener("click", go);
      input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), go()));
      fill(box, h("p.bd-skill-q", `How much short would you be on day 3?`), h("div.row", h("span.bd-dollar", "$"), input, check));
      input.focus();
    };
    const answer = (yes) => {
      ctx.track("skillMoment", { game: "billdrop", step: "yesno", right: !yes });
      (!yes ? sfx.correct : sfx.error)();
      fill(box, h("p.mg-flash", { class: !yes ? "good" : "bad" }, icon(!yes ? "check" : "alert", { size: 18 }), !yes ? " Right. The paycheck comes two days too late." : " Not quite. Rent is due before the paycheck lands."));
      setTimeout(step2, 900);
    };
    fill(box, h("h4", "Before the month starts"), h("p.bd-skill-q", `Balance $${bal}. Rent $${rent} is due day 3. Paycheck $${pay} lands day 5. Can you pay rent on time?`), h("div.row", h("button.big", { type: "button", "data-autofocus": "", onclick: () => answer(true) }, "Yes"), h("button.big", { type: "button", onclick: () => answer(false) }, "No")));
    fill(root, box);
  }

  // ---------- The month ----------
  function begin() {
    fill(
      root,
      h("div.bd-top", timeline),
      h("div.bd-main", tray, h("div.bd-mid", desk, cal), side),
      keyHelp(`N next notice, M mailbox, A add to calendar, Left and Right pick a pay day, Enter confirms, T autopay, F fix menu, K bank app, ${timed ? "P pause" : "Space next day"}.`),
      overlay
    );
    paint();
    document.addEventListener("keydown", onKey);
    if (timed) run();
    else root.querySelector(".bd-next")?.focus();
  }

  function run() {
    clearInterval(tick);
    tick = setInterval(() => !paused && !blocking && nextDay(), cfg.dayMs);
  }

  async function nextDay() {
    if (over || blocking) return;
    const r = B.advance(s);
    for (const x of r.happened) {
      if (x.type === "fee") {
        sfx.error();
        ctx.echo(x.fee.text);
        ctx.mistake({ type: x.fee.kind, cost: x.fee.amount, label: x.fee.kind === "late" ? "Late fee" : "Overdraft fee", quiet: true });
      } else if (x.type === "paid" && x.surprise) {
        ctx.echo(s.echoes.at(-1).text);
      } else if (x.type === "paid") sfx.correct();
    }
    paint();
    const chaos = r.happened.filter((x) => x.type === "chaos");
    for (const c of chaos) await showChaos(c.card);
    // Coach beat 1: the first bill arrives.
    if (training && !coached.has(0) && B.arrived(s).length) {
      coached.add(0);
      await hold(ctx.coach(0, tray));
    }
    if (r.done) end();
  }

  function hold(p) {
    blocking++;
    return p.finally(() => blocking--);
  }

  function showChaos(card) {
    const amount = card.amount ? (card.kind === "income" ? ` +${money(card.amount)}` : card.kind === "expense" ? ` -${money(card.amount)}` : ` +${money(card.amount)} on the bill`) : "";
    return hold(
      new Promise((resolve) => {
        const ev = eventCard({
          title: card.title + amount,
          text: card.text,
          tag: `Day ${card.day}`,
          choices: [{ label: "Got it" }],
          onPick: () => {
            fill(overlay);
            resolve();
          },
        });
        fill(overlay, ev);
        ev.querySelector("button").focus();
      })
    );
  }

  function select(id) {
    selected = id;
    const b = B.billOf(s, id);
    pendingDay = b ? b.payDay ?? b.due : null;
    if (b && b.channel !== "mail") b.seen = true;
    paint();
  }

  async function add() {
    const b = selected && B.billOf(s, selected);
    if (!b || b.logged) return;
    B.logBill(s, b.id);
    pendingDay = b.due;
    ctx.track("billLog", { game: "billdrop", bill: b.type, day: s.day });
    paint();
    if (training && !coached.has(1)) {
      coached.add(1);
      await hold(ctx.coach(1, timeline));
      await hold(ctx.coach(2, desk.querySelector(".bd-plan") || desk));
    }
  }

  function confirmDay() {
    const b = selected && B.billOf(s, selected);
    if (!b || !b.logged || b.paid) return;
    B.schedule(s, b.id, pendingDay);
    ctx.track("billSchedule", { game: "billdrop", bill: b.type, day: b.payDay, due: b.due, today: s.day });
    paint();
  }

  function toggleAuto() {
    const b = selected && B.billOf(s, selected);
    if (!b || !b.logged || b.paid) return;
    B.setAutopay(s, b.id, !b.autopay);
    paint();
  }

  function moveDay(d) {
    const b = selected && B.billOf(s, selected);
    if (!b || !b.logged || b.paid) return;
    pendingDay = Math.max(s.day + 1, Math.min(B.DAYS, (pendingDay ?? b.due) + d));
    paint();
  }

  function useFix(kind) {
    const r = B.applyFix(s, kind, kind === "shift" ? s.day : selected);
    ctx.track("billFix", { game: "billdrop", kind, ok: r.ok });
    if (!r.ok) ctx.echo(r.message, { kind: "safe" });
    else ctx.echo(kind === "move" ? "Due date moved 5 days later." : kind === "cancel" ? "Subscription canceled. No charge this month." : "Extra shift booked. The pay lands in 7 days.", { kind: "good" });
    fixMenu = false;
    paint();
  }

  function checkBank() {
    const found = B.checkBank(s);
    ctx.track("billBankCheck", { game: "billdrop", found: found.length, day: s.day });
    ctx.echo(found.length ? `Your bank app shows ${found.length} autopay${found.length === 1 ? "" : "s"} you forgot: ${found.map((b) => b.company).join(", ")}.` : "Your bank app shows no surprise autopays.", { kind: found.length ? "bad" : "good" });
    paint();
  }

  // ---------- Drawing ----------
  function paint() {
    const fc = B.forecast(s);
    const chips = [];
    for (const p of s.paychecks) chips.push({ at: p.day - 1, kind: "pay", text: `Paycheck +${money(p.amount)}`, short: `+${money(p.amount)}` });
    for (const x of s.extra) chips.push({ at: x.day - 1, kind: "pay", text: `Extra shift +${money(x.amount)}`, short: `+${money(x.amount)}` });
    for (const b of s.bills) if ((b.logged || b.paid) && !b.canceled) chips.push({ at: (b.paidDay ?? (b.autopay ? b.due : b.payDay ?? b.due)) - 1, kind: b.late ? "fee" : "bill", text: `${b.company} ${money(b.paid || b.amount)}${b.paid ? " paid" : b.autopay ? " autopay" : b.payDay ? " scheduled" : " due"}`, short: TYPE_LABEL[b.type] });
    timeline.update({ balances: fc, chips: dedupe(chips), today: s.day > 0 ? s.day - 1 : null, forecastFrom: s.day - 1 });

    // The tray: notices that arrived and aren't logged. Paper mail waits in the mailbox.
    const notices = B.arrived(s).filter((b) => !b.logged && (b.channel !== "mail" || mailSeen.has(b.id)));
    const newMail = B.arrived(s).filter((b) => b.channel === "mail" && !mailSeen.has(b.id) && !b.logged);
    fill(
      tray,
      h("h4", icon("inbox", { size: 18 }), " Notifications"),
      h("button.bd-mailbox", { type: "button", "aria-keyshortcuts": "M", onclick: openMail }, icon("mail", { size: 18 }), " Mailbox", newMail.length ? h("span.bd-badge", `${newMail.length} new`) : h("small", " empty")),
      notices.length
        ? h(
            "ul.bd-notices",
            notices.map((b) =>
              h("li", h("button.bd-notice", { type: "button", class: `ch-${b.channel}`, "aria-pressed": String(selected === b.id), onclick: () => select(b.id) }, h("span.bd-ch", icon(CHANNEL_ICON[b.channel], { size: 16 }), ` ${CHANNEL_LABEL[b.channel]}`), h("strong", b.company), h("small", `${money(b.amount)}, due day ${b.due}`)))
            )
          )
        : h("p.bd-empty", s.day === 0 ? "Bills will show up here as the month goes." : "Nothing new. Check the mailbox now and then.")
    );

    // The desk: the selected bill.
    const b = selected && B.billOf(s, selected);
    if (!b) fill(desk, h("p.bd-empty", "Pick a notice to read it."));
    else {
      const status = b.canceled ? "Canceled" : b.paid ? `Paid ${money(b.paid)} on day ${b.paidDay}${b.paidDay > b.due ? " (late)" : ""}` : b.late ? "Late! Pay it as soon as you can." : b.autopay ? `Autopay on day ${b.due}` : b.payDay ? `Scheduled for day ${b.payDay}` : b.logged ? "On your calendar. Pick a pay day." : "Not on your calendar yet.";
      fill(
        desk,
        h("div.bd-letter", { class: `ch-${b.channel}` }, h("span.bd-ch", icon(CHANNEL_ICON[b.channel], { size: 16 }), ` ${CHANNEL_LABEL[b.channel]}`), h("p", noticeText(b))),
        h("p.bd-status", { class: b.late ? "bad" : b.paid ? "good" : "" }, icon(b.late ? "alert" : b.paid ? "check" : "calendar", { size: 16 }), ` ${status}`),
        !b.logged ? h("button.big.bd-add", { type: "button", "aria-keyshortcuts": "A", onclick: add }, icon("calendar", { size: 18 }), " Add to calendar") : null,
        b.logged && !b.paid && !b.canceled
          ? h(
              "div.bd-plan",
              h("div.bd-day", h("button.secondary", { type: "button", "aria-label": "One day earlier", onclick: () => moveDay(-1) }, icon("back", { size: 16 })), h("span", { "aria-live": "polite" }, `Pay on day ${pendingDay ?? b.due}`, (pendingDay ?? b.due) > b.due ? h("em.bad", " late") : null), h("button.secondary", { type: "button", "aria-label": "One day later", onclick: () => moveDay(1) }, icon("next", { size: 16 })), h("button", { type: "button", "aria-keyshortcuts": "Enter", onclick: confirmDay }, "Set pay day")),
              h("label.bd-auto", h("input", { type: "checkbox", checked: b.autopay, onchange: toggleAuto }), ` Autopay on the due date (T)`),
              b.type === "card"
                ? h("div.bd-part", { role: "group", "aria-label": "How much to pay" }, ["min", "full"].map((p) => h("button.secondary", { type: "button", "aria-pressed": String(b.part === p), onclick: () => (B.setPart(s, b.id, p), paint()) }, p === "min" ? `Minimum ${money(b.minimum)}` : `Full ${money(b.amount)}`)))
                : null
            )
          : null
      );
    }

    // The calendar list: every logged bill by due date.
    const logged = s.bills.filter((x) => x.logged && !x.canceled).sort((x, y) => x.due - y.due);
    fill(
      cal,
      h("h4", icon("calendar", { size: 16 }), ` Calendar (${logged.length} bill${logged.length === 1 ? "" : "s"})`),
      logged.length
        ? h(
            "ul.bd-cal-list",
            logged.map((x) =>
              h(
                "li",
                h(
                  "button.bd-cal-item",
                  { type: "button", "aria-pressed": String(selected === x.id), onclick: () => select(x.id) },
                  h("strong", x.company),
                  h("span", `${money(x.amount)} due ${x.due}`),
                  h("small", { class: x.late ? "bad" : x.paid ? "good" : !x.autopay && !x.payDay ? "warn" : "" }, x.paid ? `paid day ${x.paidDay}` : x.late ? "LATE" : x.autopay ? "autopay" : x.payDay ? `pay day ${x.payDay}` : "no pay day")
                )
              )
            )
          )
        : h("p.bd-empty", "Nothing logged yet.")
    );

    // The side: today, the fix menu and the bank app.
    const sel = selected && B.billOf(s, selected);
    fill(
      side,
      h("div.bd-today", h("small", s.day === 0 ? "Before day 1" : `Day ${s.day} of ${B.DAYS}`), h("strong.bd-bal", { class: s.balance < 0 ? "neg" : "" }, money(s.balance)), s.balance < 0 ? h("small.bad", icon("alert", { size: 14 }), " Below $0") : h("small", "Balance")),
      timed ? h("button.secondary", { type: "button", "aria-keyshortcuts": "P", onclick: () => ((paused = !paused), paint()) }, icon(paused ? "play" : "pause", { size: 16 }), paused ? " Resume" : " Pause") : h("button.big.bd-next", { type: "button", "aria-keyshortcuts": "Space", onclick: nextDay }, `Next day`, icon("next", { size: 18 })),
      h("button.secondary.bd-fixbtn", { type: "button", "aria-expanded": String(fixMenu), "aria-keyshortcuts": "F", onclick: () => ((fixMenu = !fixMenu), paint()) }, icon("gear", { size: 16 }), ` Fix menu (${s.fixesLeft} left)`),
      fixMenu
        ? h(
            "div.bd-fixes",
            h("button", { type: "button", disabled: !s.fixesLeft || !sel?.movable || sel.paid, onclick: () => useFix("move") }, "Call to move the due date 5 days", h("small", sel?.movable ? sel.company : "Pick a utility or phone bill first")),
            h("button", { type: "button", disabled: !s.fixesLeft || !sel?.cancelable || sel.paid, onclick: () => useFix("cancel") }, "Cancel the subscription", h("small", sel?.cancelable ? sel.company : "Pick a subscription first")),
            h("button", { type: "button", disabled: !s.fixesLeft || s.day + cfg.shiftDelay > B.DAYS, onclick: () => useFix("shift") }, "Pick up an extra shift", h("small", `About $${cfg.extraShift[0]} to $${cfg.extraShift[1]}, paid in 7 days`))
          )
        : null,
      difficulty !== "easy" ? h("button.secondary", { type: "button", disabled: s.checkedBank, "aria-keyshortcuts": "K", onclick: checkBank }, icon("phone", { size: 16 }), s.checkedBank ? " Bank app checked" : " Check your bank app") : null,
      simplified("fees and dates")
    );
  }

  function dedupe(chips) {
    const seen = new Set();
    return chips.filter((c) => {
      const k = `${c.at}:${c.short}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function openMail() {
    const fresh = B.arrived(s).filter((b) => b.channel === "mail" && !mailSeen.has(b.id) && !b.logged);
    for (const b of fresh) mailSeen.add(b.id);
    mailboxOpen = true;
    ctx.track("billMailbox", { game: "billdrop", found: fresh.length, day: s.day });
    if (fresh[0]) select(fresh[0].id);
    else paint();
  }

  function nextNotice() {
    const list = B.arrived(s).filter((b) => !b.logged && (b.channel !== "mail" || mailSeen.has(b.id)));
    if (!list.length) return;
    const i = list.findIndex((b) => b.id === selected);
    select(list[(i + 1) % list.length].id);
  }

  function onKey(e) {
    if (over || blocking || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const act = { n: nextNotice, m: openMail, a: add, t: toggleAuto, f: () => ((fixMenu = !fixMenu), paint()), k: () => difficulty !== "easy" && checkBank(), ArrowLeft: () => moveDay(-1), ArrowRight: () => moveDay(1) }[k];
    if (act) return e.preventDefault(), act();
    if (k === "Enter" && !e.target.closest("button")) return e.preventDefault(), confirmDay();
    if (k === "p" && timed) return e.preventDefault(), (paused = !paused), paint();
    if (k === " " && !timed && !e.target.closest("button")) return e.preventDefault(), nextDay();
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = B.score(s);
    for (const b of s.bills.filter((x) => !x.paid && !x.canceled)) ctx.mistake({ type: "unpaid", cost: b.amount, label: `Never paid ${b.company}` });
    if (sc.interest > 0) ctx.echo(`Next month's cost: ${money(sc.interest)} interest on the ${money(sc.cardLeft)} you left on the card.`);
    const reveal = cashTimeline({ unit: "Day", title: "The month, day by day" });
    const chips = [
      ...s.paychecks.map((p) => ({ at: p.day - 1, kind: "pay", text: `Paycheck +${money(p.amount)}`, short: "Pay" })),
      ...s.fees.map((f) => ({ at: f.day - 1, kind: "fee", text: f.text, short: `Fee ${money(f.amount)}` })),
    ];
    reveal.update({ balances: s.balances, chips: dedupe(chips) });
    const summary = h(
      "ul.bd-reveal-list",
      h("li", icon("check", { size: 14 }), ` ${sc.onTime} of ${sc.bills} bills paid on time`),
      h("li", icon(sc.fees ? "alert" : "check", { size: 14 }), ` Fees: ${money(sc.fees)}`),
      sc.never ? h("li", icon("alert", { size: 14 }), ` ${sc.never} bill${sc.never === 1 ? "" : "s"} never paid`) : null,
      h("li", icon("coins", { size: 14 }), ` Ending balance: ${money(sc.end)}`),
      sc.interest ? h("li", icon("card", { size: 14 }), ` Card interest next month: ${money(sc.interest)}`) : null
    );
    ctx.finish({
      score: sc.score,
      tie: sc.fees,
      tier: difficulty,
      sub: { onTime: sc.onTime, fees: sc.fees, never: sc.never, end: sc.end },
      perfect: !sc.fees && !sc.never && sc.onTime === sc.bills,
      reveal: h("div", reveal, summary),
      biggest: B.biggest(s),
      stats: { difficulty, fixes: s.fixesUsed.length, checkedBank: s.checkedBank, loggedAll: s.bills.every((b) => b.logged || b.canceled) },
    });
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
