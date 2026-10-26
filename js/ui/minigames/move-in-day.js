// Move-In Day (GAME-SPECS.md game 14, Lease Life re-themed for standard E):
// sort two aid letters and pick the school with the lower net price, then tour
// two apartments near campus before other applicants grab them, read the lease,
// photograph move-in damage and live a year. Rules: js/arcade/movein.js.
import { h, fill, money } from "../dom.js";
import { icon } from "../icons.js";
import { CONFIG } from "../../data/config.js";
import * as M from "../../arcade/movein.js";
import { MI_COST_LABEL, MI_KIND_LABEL, MI_SPOTS, MI_BACKUP } from "../../data/arcade/movein.js";
import { eventCard, keyHelp, timerRing } from "../arcade/components.js";
import { sfx } from "../arcade-sound.js";

const KINDS = ["free", "earn", "borrow"];

export function start(ctx) {
  const { seed, settings, training } = ctx;
  const timed = settings.timer === "timed";
  const cfg = CONFIG.arcade.games.movein;
  const s = M.newState(M.newShift(seed));
  const root = h("div.minigame.movein");
  const ring = timed ? timerRing({ label: "Time left" }) : null;
  let tick = null;
  let over = false;
  let keys = null;
  let cur = 0;
  let skill = null;
  let warned = new Set();

  const bar = (label, right) => h("div.mg-bar", h("span.mg-clock", label), ring, h("span.mg-score", right));

  function clock(seconds, onEnd, onTick) {
    clearInterval(tick);
    if (!timed) return;
    const endAt = Date.now() + seconds * 1000;
    let last = Date.now();
    tick = setInterval(() => {
      const now = Date.now();
      onTick?.((now - last) / 1000);
      last = now;
      const left = (endAt - now) / 1000;
      ring.set(left, seconds);
      if (left <= 0) (clearInterval(tick), onEnd());
    }, 250);
  }

  // ---------- Part 1: the aid letters ----------
  function schools() {
    const allSorted = s.deal.schools.every((sc, k) => sc.aid.every((_, i) => s.sorts[`${k}:${i}`]));
    const letterEl = (sc, k) =>
      h(
        "article.mi-letter",
        h("header", h("h4", sc.name), h("small", sc.note)),
        h("h5", "Cost of attendance, one year"),
        h("ul.mi-lines", sc.cost.map((c) => h("li", h("span", MI_COST_LABEL[c.key]), h("strong", money(c.amount)))), h("li.total", h("span", "Total cost"), h("strong", money(sc.coa)))),
        h("h5", "Your aid package"),
        h(
          "ul.mi-aid",
          sc.aid.map((a, i) => {
            const got = s.sorts[`${k}:${i}`];
            return h(
              "li",
              h("div.mi-aid-name", h("span", a.name), h("strong", money(a.amount))),
              h(
                "div.mi-sort",
                { role: "group", "aria-label": `Sort ${a.name}` },
                KINDS.map((kind) => h("button", { type: "button", "aria-pressed": String(got === kind), onclick: () => ((s.sorts[`${k}:${i}`] = kind), ctx.track("moveinSort", { school: sc.id, aid: a.type, kind, right: kind === a.kind }), schools()) }, got === kind ? icon("check", { size: 12 }) : null, MI_KIND_LABEL[kind]))
              )
            );
          }),
          h("li.total", h("span", "Total aid offered"), h("strong", money(sc.totalAid)))
        ),
        allSorted ? h("p.mi-net", "Net price (cost minus free money): ", h("strong", money(sc.net)), h("small", ` Borrowed: ${money(sc.borrow)}. Work-study: ${money(sc.earn)}.`)) : null,
        h("button.big", { type: "button", onclick: () => (allSorted ? choose(k) : ctx.notice("Sort every aid line in both letters first.")) }, icon("check", { size: 16 }), ` Choose ${sc.name}`)
      );
    fill(
      root,
      bar("Two aid letters", "Part 1 of 2"),
      h("p.mi-lead", "Sort every aid line: Free money, Earn it (work-study), or Pay it back (loans). Then the real net prices appear and you pick a school."),
      h("div.mi-letters", s.deal.schools.map(letterEl)),
      keyHelp("Tab and Enter sort each line. Choose a school when both letters are sorted.")
    );
    keys = null;
  }

  function choose(k) {
    clearInterval(tick);
    const right = M.pickSchool(s, k);
    const sr = M.sortRight(s);
    ctx.track("moveinSchool", { school: s.deal.schools[k].id, cheaper: right, sorted: sr.right, of: sr.total });
    const other = s.deal.schools[1 - k];
    const mine = s.deal.schools[k];
    if (right) (sfx.correct(), ctx.echo(`${mine.name} costs ${money(other.net - mine.net)} less a year after free money.`, { kind: "good" }));
    else {
      sfx.error();
      ctx.echo(`${other.name} would cost ${money(mine.net - other.net)} less a year. Its aid total was smaller, but more of it was free money.`, { kind: "bad" });
      ctx.mistake({ type: "pricierSchool", cost: cfg.wrongSchool, label: "Picked the pricier school" });
    }
    ctx.notice(`You sorted ${sr.right} of ${sr.total} aid lines right.`);
    skillMoment();
  }

  // ---------- The skill moment ----------
  function skillMoment() {
    const input = h("input", { type: "text", inputmode: "decimal", "aria-label": "Move-in total, in dollars" });
    const out = h("div.mi-skill-out", { "aria-live": "polite" });
    const go = h("button.big", { type: "button", hidden: true, onclick: () => tour() }, icon("key", { size: 16 }), " Start the apartment tour");
    const check = () => {
      if (skill) return;
      const ok = Number(input.value.replace(/[$,\s]/g, "")) === 1850;
      skill = { ok };
      ctx.track("skillMoment", { game: "movein", right: ok });
      (ok ? sfx.correct : sfx.error)();
      fill(out, h("p.mg-flash", { class: ok ? "good" : "bad" }, icon(ok ? "check" : "alert", { size: 16 }), ok ? " Right. $900 + $900 + $50 = $1,850." : " It's $1,850: first month $900, deposit $900, fee $50."), h("small", "Every apartment now shows its move-in total."));
      go.hidden = false;
      go.focus();
    };
    input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), e.stopPropagation(), check()));
    fill(root, bar("Before the tour", "Part 2 of 2"), h("div.mi-skill", h("h4", "Quick check"), h("p", "Rent $900, security deposit $900, application fee $50. The first month is due at signing. How much do you need to move in?"), h("div.row", h("span", "$"), input, h("button", { type: "button", onclick: check }, "Check")), out, go), keyHelp("Type a number and press Enter."));
    input.focus();
    keys = null;
    clock(15, () => (skill || check(), tour()));
  }

  // ---------- The tour ----------
  function tour() {
    clearInterval(tick);
    M.view(s, cur);
    paintTour();
    if (training) ctx.coach(1, root.querySelector(".mi-plan"));
    clock(cfg.tourSeconds, () => (M.wait(s, 999), afterTour()), (dt) => {
      if (M.wait(s, dt)) return afterTour();
      tourTick();
    });
  }

  function tourTick() {
    const w = M.warning(s);
    const el = root.querySelector(".mi-warn");
    if (el) fill(el, w ? [icon("alert", { size: 14 }), ` Another applicant is arriving at unit ${w.i + 1} soon.`] : [icon("people", { size: 14 }), " Other applicants are touring too."]);
    if (el) el.classList.toggle("hot", Boolean(w));
    if (w && !warned.has(w.i)) (warned.add(w.i), sfx.error?.());
    s.deal.units.forEach((_, i) => {
      if (!M.available(s, i) && !warned.has(`gone${i}`)) {
        warned.add(`gone${i}`);
        ctx.echo(`Unit ${i + 1} was just taken by another applicant.`, { kind: "bad" });
        if (s.phase === "tour" && i === cur) {
          cur = 1 - cur;
          M.view(s, cur);
          paintTour();
        }
      }
    });
  }

  function paintTour() {
    if (s.phase !== "tour") return afterTour();
    const u = s.deal.units[cur];
    const found = s.inspected[cur];
    const plan = h(
      "div.mi-plan",
      { role: "group", "aria-label": "Floorplan. Inspect a spot." },
      MI_SPOTS.map((sp) => {
        const done = found.has(sp.id);
        const p = done ? u.problems.find((x) => x.spot === sp.id) : null;
        return h(
          "button.mi-spot",
          { type: "button", class: `spot-${sp.id}${done ? (p ? " bad" : " ok") : ""}`, disabled: done, onclick: () => look(sp.id) },
          icon(done ? (p ? "alert" : "check") : sp.icon, { size: 18 }),
          h("strong", sp.name),
          h("small", done ? (p ? p.found : "Looks fine") : `Inspect (${cfg.inspectSeconds} s)`)
        );
      })
    );
    const ok = M.incomeOk(s, u);
    const w = M.warning(s);
    const mate = s.deal.mate;
    const side = h(
      "aside.mi-side",
      h("h4", u.name),
      h("small", u.look),
      h("dl", h("dt", "Rent"), h("dd", `${money(u.rent)} a month`), h("dt", "Your share"), h("dd", `${money(M.yourRent(s, u))}${s.mate ? " (split)" : ""}`), h("dt", "Move-in total"), h("dd", skill ? money(M.moveInTotal(s, u)) : "?"), h("dt", "Commute"), h("dd", u.far ? `${money(u.far)} a month` : "Walk to class")),
      h("p.mi-income", { class: ok ? "ok" : "bad" }, icon(ok ? "check" : "x", { size: 14 }), ` Income 3x your rent: ${ok ? "Yes" : "No"} (${money(cfg.income)} a month)`),
      h(
        "fieldset.mi-mate",
        h("legend", "Live solo or with a roommate?"),
        h("div.row", h("button", { type: "button", "aria-pressed": String(!s.mate), onclick: () => (M.setMate(s, false), paintTour()) }, "Solo"), h("button", { type: "button", "aria-pressed": String(s.mate), onclick: () => (M.setMate(s, true), paintTour()) }, `With ${mate.name}`)),
        h("ul", mate.clues.map((c) => h("li", c))),
        h("small", "A roommate halves the rent, but both names go on the lease.")
      ),
      h("p.mi-warn", { class: w ? "hot" : "", role: "status" }, icon(w ? "alert" : "people", { size: 14 }), w ? ` Another applicant is arriving at unit ${w.i + 1} soon.` : " Other applicants are touring too."),
      h("div.row", h("button.big", { type: "button", "aria-keyshortcuts": "A", onclick: () => applyHere() }, "Apply (A)"), h("button.secondary", { type: "button", "aria-keyshortcuts": "N", disabled: !M.available(s, 1 - cur), onclick: () => next() }, "Next unit (N)"))
    );
    const tabs = h("div.mi-tabs", s.deal.units.map((x, i) => h("span", { class: `${i === cur ? "on" : ""} ${M.available(s, i) ? "" : "gone"}` }, `Unit ${i + 1}${M.available(s, i) ? "" : ": taken"}`)));
    fill(root, bar("The apartment tour", timed ? "Applicants arrive on the clock" : `${Math.round(s.clock)} s of looking`), tabs, h("div.mi-tour", plan, side), keyHelp("Tab and Enter inspect a spot. A applies, N goes to the next unit."));
    keys = (e) => {
      const k = e.key.toLowerCase();
      if (k === "a") (e.preventDefault(), applyHere());
      else if (k === "n") (e.preventDefault(), next());
    };
  }

  function look(spot) {
    const r = M.inspect(s, cur, spot);
    if (!r) return;
    (r.problem ? sfx.error : sfx.correct)();
    ctx.track("moveinInspect", { unit: cur, spot, found: Boolean(r.problem) });
    tourTick();
    paintTour();
    root.querySelector(".mi-spot:not([disabled])")?.focus();
  }

  function next() {
    if (!M.available(s, 1 - cur)) return;
    cur = 1 - cur;
    M.view(s, cur);
    tourTick();
    paintTour();
  }

  function applyHere() {
    const r = M.apply(s, cur);
    ctx.track("moveinApply", { unit: cur, ok: r.ok, mate: s.mate, inspected: s.inspected[cur].size });
    if (!r.ok) return (sfx.error(), ctx.notice(r.text));
    sfx.correct();
    afterTour();
  }

  function afterTour() {
    clearInterval(tick);
    if (s.phase === "lease") return lease();
    if (s.phase === "roommate" || s.backup) {
      s.phase = "year";
      ctx.echo("Both apartments were taken while you looked. You're stuck with the backup.", { kind: "bad" });
      const go = h("button.big", { type: "button", onclick: () => year() }, "Move in to the backup");
      fill(root, bar("No apartment", "The backup"), h("div.mi-card", h("h4", MI_BACKUP.name), h("p", `${MI_BACKUP.look}. ${money(MI_BACKUP.rent)} a month and ${money(MI_BACKUP.far)} a month to get to class.`), h("p", "Next time, check the key spots and apply before the other applicants."), go), keyHelp("Enter goes on."));
      go.focus();
      keys = (e) => e.key === "Enter" && !e.target.closest("button") && (e.preventDefault(), year());
    }
  }

  // ---------- The lease ----------
  function lease(note = null) {
    const u = M.unit(s);
    let sel = 0;
    const clauses = u.clauses.filter((c) => !(c.gotcha && !s.gotchaKept));
    const paint = () => {
      const signBtn = h("button.big", { type: "button", "aria-keyshortcuts": "Enter", onclick: () => doSign() }, icon("check", { size: 16 }), " Sign the lease (Enter)");
      fill(
        root,
        bar("Read the lease", u.name),
        h(
          "div.mi-lease",
          h(
            "ol.mi-doc",
            clauses.map((c, i) =>
              h(
                "li",
                { class: i === sel ? "sel" : "" },
                h("p", c.text),
                h("button.secondary", { type: "button", "aria-keyshortcuts": "F", onclick: () => ((sel = i), doFlag(c)) }, icon("flag", { size: 14 }), " Flag (F)")
              )
            )
          ),
          h("aside.mi-side", note ? h("p.mi-note", note) : null, h("p", `Your rent: ${money(M.yourRent(s, u))} a month for 12 months${s.mate ? " (your half)" : ""}. Deposit: ${money(u.deposit)}.`), u.problems.some((p) => s.found[s.applied].includes(p.id)) ? h("p", icon("check", { size: 14 }), " The landlord fixes the problems you found before move-in.") : null, signBtn)
        ),
        keyHelp("Up and Down pick a clause, F flags it, Enter signs.")
      );
      if (training) ctx.coach(2, root.querySelector(".mi-doc"));
    };
    const doFlag = (c) => {
      const r = M.flag(s, c.id);
      if (!r) return;
      ctx.track("moveinFlag", { gotcha: !r.standard, removed: r.removed });
      if (r.standard) return lease("The landlord shrugs. \"That one's standard.\" It's a fair clause.");
      if (r.removed) return (sfx.correct(), lease(`The landlord crossed it out. "${u.gotcha.why}" is gone.`));
      sfx.error();
      clearInterval(tick);
      const anyway = h("button.big", { type: "button", onclick: () => doSign() }, "Sign anyway");
      fill(root, bar("The landlord won't budge", u.name), h("div.mi-card", h("h4", "\"Take it or leave it.\""), h("p", `The landlord won't remove: ${u.gotcha.text}`), h("div.row", anyway, h("button.secondary", { type: "button", onclick: () => (M.walkToBackup(s), ctx.echo("You walked away to the backup.", { kind: "safe" }), year()) }, "Walk away to the backup"))), keyHelp("Pick one."));
      anyway.focus();
      keys = null;
    };
    const doSign = () => {
      clearInterval(tick);
      M.sign(s);
      ctx.track("moveinSign", { gotchaKept: s.gotchaKept, flagged: s.flagged });
      photos();
    };
    paint();
    keys = (e) => {
      const k = e.key.toLowerCase();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") (e.preventDefault(), (sel = (sel + (e.key === "ArrowDown" ? 1 : clauses.length - 1)) % clauses.length), paint());
      else if (k === "f") (e.preventDefault(), doFlag(clauses[sel]));
      else if (e.key === "Enter" && !e.target.closest("button, input")) (e.preventDefault(), doSign());
    };
    if (!note) clock(cfg.leaseSeconds, () => doSign());
  }

  // ---------- Move-in photos ----------
  function photos() {
    const paint = () => {
      const done = h("button.big", { type: "button", onclick: () => finishPhotos() }, icon("check", { size: 16 }), " Done, move in (Enter)");
      fill(
        root,
        bar("Move-in photos", `${s.photos.size} taken`),
        h("p.mi-lead", "Walk through and photograph anything already damaged. Photographed damage won't come out of your deposit."),
        h(
          "div.mi-photos",
          s.deal.spots.map((d) => {
            const on = s.photos.has(d.id);
            return h("button.mi-photo", { type: "button", "aria-pressed": String(on), onclick: () => (M.photo(s, d.id), sfx.correct(), paint(), root.querySelector(`[data-id="${d.id}"]`)?.focus()), "data-id": d.id }, icon("camera", { size: 20 }), h("strong", d.spot), h("small", d.text), h("span.mi-tag", on ? "Photographed" : "Tap to photograph"));
          })
        ),
        done,
        keyHelp("Tab and Enter take a photo. Enter on Done moves in.")
      );
    };
    paint();
    keys = (e) => e.key === "Enter" && !e.target.closest("button") && (e.preventDefault(), finishPhotos());
    clock(cfg.photoSeconds, () => finishPhotos());
  }

  function finishPhotos() {
    if (s.phase !== "photos") return;
    clearInterval(tick);
    M.donePhotos(s);
    ctx.track("moveinPhotos", { taken: s.photos.size, real: s.deal.spots.filter((d) => d.real && s.photos.has(d.id)).length });
    year();
  }

  // ---------- The year ----------
  function year() {
    clearInterval(tick);
    s.phase = "year";
    let k = 0;
    const nextCard = () => {
      if (k >= s.deal.events.length) return end();
      const e = s.deal.events[k];
      const at = k;
      const card = eventCard({
        title: e.title,
        text: e.text,
        tag: `Month ${Math.round(((at + 1) * 12) / (s.deal.events.length + 1))}`,
        choices: e.choices ? e.choices.map((c) => ({ label: c.label })) : [{ label: "Next" }],
        timer: timed ? cfg.cardSeconds : null,
        onPick: (i) => {
          if (e.choices) M.choose(s, at, i ?? 1);
          ctx.track("moveinEvent", { id: e.id, pick: i });
          k++;
          setTimeout(nextCard, 150);
        },
      });
      fill(root, bar("A year of renting", `Card ${at + 1} of ${s.deal.events.length}`), h("div.mi-year", card), keyHelp(e.choices ? "Left and Right arrows choose." : "Space goes on."));
      card.querySelector("button")?.focus();
    };
    keys = null;
    nextCard();
  }

  // ---------- The end ----------
  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
    const sc = M.score(s);
    const y = sc.y;
    const cap = (x) => Math.min(cfg.riskyCap, x);
    for (const p of y.problems) ctx.echo(`${p.text} ${money(p.amount)}. You didn't inspect that spot on the tour.`, { kind: "bad" });
    if (y.mateLeft) {
      ctx.echo(`${s.deal.mate.name} moved out in month ${cfg.leaveMonth}. On a joint lease, you owed the full rent: ${money(y.mateCost)} extra.`, { kind: "bad" });
      ctx.mistake({ type: "roommate", cost: cap(y.mateCost), label: "Roommate's unpaid half" });
    }
    if (y.gotcha && y.gotcha.triggers) {
      ctx.echo(`${y.gotcha.effect} ${y.nonRefund ? "" : money(y.gotchaCost)} From the clause you signed.`, { kind: "bad" });
      ctx.mistake({ type: "gotcha", cost: cap(y.nonRefund ? y.deposit : y.gotchaCost), label: y.gotcha.why });
    }
    for (const d of y.undocumented) ctx.mistake({ type: "noPhoto", cost: cap(d.amount), label: "Damage with no move-in photo", quiet: true });
    const reveal = h(
      "div.mi-reveal",
      h(
        "table.mi-sheet",
        h("caption", s.backup ? "The backup kept the deposit simple." : "Move-out deposit sheet"),
        h("tbody", h("tr", h("th", "Security deposit"), h("td", money(y.deposit))), y.nonRefund ? h("tr.bad", h("th", "Non-refundable, per your lease"), h("td", `-${money(y.deposit)}`)) : y.lines.map((l) => h("tr.bad", h("th", l.text), h("td", `-${money(l.amount)}`))), h("tr.total", h("th", "Returned to you"), h("td", money(y.back))))
      ),
      h("p", `Your year cost ${money(y.yearly)} in rent, commute, fees and fixes. The backup would have cost ${money(M.backupYearly())}. Surprises added ${money(y.surprise)}.`),
      h("p", `School part: ${sc.school} points (${sc.sorts.right} of ${sc.sorts.total} aid lines sorted right${s.school === s.deal.cheaper ? ", plus the lower net price" : ""}). Lease part: ${sc.lease} points.`)
    );
    ctx.finish({ score: sc.score, tie: y.back, payScore: sc.score, sub: { school: sc.school, lease: sc.lease, back: y.back, surprise: y.surprise }, perfect: s.school === s.deal.cheaper && sc.sorts.right === sc.sorts.total && y.back === y.deposit && !y.surprise, reveal, biggest: M.biggest(s), stats: { backup: s.backup, mate: s.mate } });
  }

  function onKey(e) {
    if (over || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, dialog, .arc-coach")) return;
    keys?.(e);
  }
  document.addEventListener("keydown", onKey);
  schools();
  if (training) ctx.coach(0, root.querySelector(".mi-aid"));
  clock(cfg.schoolSeconds, () => {
    for (const [k, sc] of s.deal.schools.entries()) sc.aid.forEach((_, i) => (s.sorts[`${k}:${i}`] ??= "none"));
    choose(0);
  });
  root.stop = () => {
    over = true;
    clearInterval(tick);
    document.removeEventListener("keydown", onKey);
  };
  return root;
}
