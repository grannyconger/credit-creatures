// App shell: sign-in, loading the save, and a hash router over the screens.
// Add ?local to a localhost URL to play with browser storage and no sign-in.
import { isConfigured, SCHOOL_DOMAIN } from "./firebase-config.js";
import { createGame, STEPS, EDITABLE, HUB_SCREENS } from "./game.js";
import { initTelemetry, captureErrors, screenView, track, flush, onSessionNudge, onTrack } from "./telemetry.js";
import { mountBugButton } from "./ui/bug-button.js";
import { sfx, setClassMuted, soundOn, classIsMuted } from "./ui/sound.js";
import { PLACES } from "./places.js";
import { hasFeature, prologueStep, PROLOGUE_STEPS, stageOf } from "./progression.js";
import { chapterInfo } from "./data/chapters.js";
import { CONFIG } from "./data/config.js";
import { canPlay } from "./play.js";
import { moneyChips, walletStrip } from "./ui/wallet.js";
import { creatureSvg } from "./ui/creature-art.js";
import { h, clear, ageLabel, money, toast } from "./ui/dom.js";
import { firstSettings, openSettings, saveSettings } from "./ui/settings-dialog.js";
import { applySettings, loadLocalSettings } from "./ui/settings.js";
import { icon, drawIconsFor } from "./ui/icons.js";
import { sealSvg, mossSvg, fernSvg } from "./ui/bestiary-art.js";
import * as settingsScreen from "./ui/screens/settings.js";
import * as profile from "./ui/screens/profile.js";
import * as creature from "./ui/screens/creature.js";
import * as join from "./ui/screens/join.js";
import * as networks from "./ui/screens/networks.js";
import * as design from "./ui/screens/design.js";
import * as result from "./ui/screens/result.js";
import * as hub from "./ui/screens/hub.js";
import * as month from "./ui/screens/month.js";
import * as chapterEnd from "./ui/screens/chapter-end.js";
import * as accounts from "./ui/screens/accounts.js";
import * as shop from "./ui/screens/shop.js";
import * as trophies from "./ui/screens/trophies.js";
import * as friends from "./ui/screens/friends.js";
import * as intro from "./ui/screens/intro.js";
import * as dream from "./ui/screens/dream.js";
import * as guild from "./ui/screens/guild.js";
import * as academy from "./ui/screens/academy.js";
import * as cottage from "./ui/screens/cottage.js";
import * as garage from "./ui/screens/garage.js";
import * as records from "./ui/screens/records.js";
import * as alley from "./ui/screens/alley.js";
import * as map from "./ui/screens/map.js";
import * as daily from "./ui/screens/daily.js";
import { initShell, paintShell } from "./ui/shell.js";
import { initDock, paintDockButton } from "./ui/dock.js";
import { claimLogin } from "./daily.js";
import { onEvent as challengeEvent } from "./challenges.js";
import { watchSentences } from "./ui/sentences.js";
import { publishSpringTokens, motionOn } from "./ui/motion/spring.js";
import { installBoops } from "./ui/motion/boop.js";
import { installSparkles } from "./ui/motion/sparkles.js";
import { installGaze } from "./ui/motion/gaze.js";

// The leaderboard opens straight from the top bar (teacher request 2026-10-22).
const leaderboard = { render: (root, ctx) => trophies.render(root, { ...ctx, startTab: "board" }) };
const SCREENS = { map, leaderboard, profile, creature, join, cardIntro: networks, cardDesign: design, cardResult: result, hub, month, chapterEnd, accounts, shop, trophies, friends, intro, dream, guild, academy, cottage, garage, records, alley, daily, settings: settingsScreen };

const LOCAL = new URLSearchParams(location.search).has("local") && ["localhost", "127.0.0.1"].includes(location.hostname);

const root = document.getElementById("app");
const topbar = document.getElementById("topbar");
const who = document.getElementById("who");
let game = null;
let cleanup = null;
initShell({ getGame: () => game, go: (step) => (location.hash = `#/${step}`), track });
// Daily challenges listen to play events (js/challenges.js).
onTrack((type, data) => {
  if (!game || game.step !== "hub" || game.practice || !game.run?.life) return;
  const r = challengeEvent(game.run.play, game.run.life, type, data);
  if (!r.finished.length) return;
  game.run.life = r.life;
  for (const c of r.finished) toast(`Challenge done: ${c.text}.`, "good");
  if (r.bonus) toast(`All three challenges done! You earned ${money(r.bonus)}.`, "good");
  game.run.persist("challenge");
  paintShell(game);
});

// The first time in the kingdom each visit: the login streak and its coins.
async function dailyLogin() {
  if (game.practice) return;
  const run = game.run;
  const r = claimLogin(run.play, run.life);
  if (!r) return;
  run.life = r.life;
  track("loginClaim", { streak: r.streak, coins: r.total, lost: r.lostStreak });
  await run.persist("login");
  updateWho();
  const start = r.lostStreak ? `Your ${r.lostStreak}-day streak ended, so a new one starts today. ` : "";
  toast(`${start}Day ${r.streak} streak! You earned ${money(r.coins)} for signing in${r.milestone ? `, plus a ${money(r.milestone)} streak bonus` : ""}.`, "good");
}

initDock({ getGame: () => game, go: (step) => (location.hash = `#/${step}`), track });
// Set once the student is in the game this tab, so a refresh skips the title.
const ENTERED = "credit-creatures:entered";
// Google's own "G", as on a standard Google sign-in button.
const GOOGLE_G = '<svg viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

captureErrors();
// Each sentence on its own line, everywhere in the game (js/ui/sentences.js).
watchSentences(document.body);
// Spring easings as CSS tokens, and boops on every button (js/ui/motion/).
publishSpringTokens();
installBoops();
// Phase 16: sparkles on anything marked data-sparkle (js/ui/motion/sparkles.js).
installSparkles();
// Phase 17: eyes that follow the pointer, blinks and reactions (js/ui/motion/gaze.js).
installGaze();

const { auth, db } = await loadBackends();
const bug = mountBugButton({
  getContext: () => ({ uid: game?.user.uid || "", classId: game?.profile.classId, teacherEmail: game?.classInfo?.teacherEmail || "", life: game?.life }),
  send: (report) => db.sendFeedback(report),
});
bug.hide();

if (!LOCAL && !isConfigured) {
  signedOut("Sign-in is not set up yet. Check back soon.");
} else {
  // Google remembers the student in this browser, so they sign in once
  // (teacher request 2026-10-21). After that the title's Begin button resumes
  // the game. A refresh mid-game goes straight back in.
  auth.onUser((user) => {
    if (!user) return signedOut();
    if (entered()) return enterGame(user);
    signedOut("", user);
  });
}

function entered() {
  try {
    return sessionStorage.getItem(ENTERED) === "1";
  } catch {
    return false;
  }
}

async function enterGame(user) {
  if (game) return;
  try {
    sessionStorage.setItem(ENTERED, "1");
  } catch {}
  root.replaceChildren(h("div.bestiary.bst-loading", h("p.bst-margin", { role: "status" }, "Finding your page in the field guide...")));
  game = createGame(user, db);
  game.local = LOCAL;
  try {
    await game.load();
  } catch (err) {
    console.error(err);
    try {
      sessionStorage.removeItem(ENTERED);
    } catch {}
    return signedOut("We couldn't load your game. Please refresh the page.");
  }
  initTelemetry({
    sink: (batch, rollup) => db.flushTelemetry(user.uid, batch, rollup),
    context: () => ({ step: game.step, chapter: game.save.play?.chapter ?? 1, month: game.life?.month ?? -1, practice: Boolean(game.practice) }),
  });
  track("sessionStart", { returning: game.returning, step: game.step, local: LOCAL });
  onSessionNudge(showNudge);
  topbar.hidden = false;
  bug.show();
  window.addEventListener("hashchange", route);
  route();
  // Look, reading and sound pop up once after signing in on this browser.
  firstSettings({ game, track });
}

async function loadBackends() {
  if (LOCAL) {
    const db = await import("./db-local.js");
    const flag = "credit-life:signedIn";
    let listener = null;
    const auth = {
      onUser(cb) {
        listener = cb;
        cb(localStorage.getItem(flag) ? db.LOCAL_USER : null);
      },
      async signIn() {
        localStorage.setItem(flag, "1");
        listener?.(db.LOCAL_USER);
      },
      async signOut() {
        localStorage.removeItem(flag);
        location.hash = "";
        location.reload();
      },
    };
    return { auth, db };
  }
  if (!isConfigured) return { auth: null, db: null };
  const [auth, db] = await Promise.all([import("./auth.js"), import("./db.js")]);
  return { auth, db };
}

// The title screen. With a user (already signed in on this browser), Begin
// resumes the game. Without one, Begin opens the sign-in card.
function signedOut(error = "", user = null) {
  game = null;
  topbar.hidden = true;
  paintShell(null);
  paintDockButton(null);
  bug.hide();
  const err = h("p.error", { role: "alert" }, error);
  // Looks like a standard Google sign-in button (teacher request 2026-10-21).
  const btn = h("button.google-btn", { type: "button", disabled: !auth }, h("span.google-g", { "aria-hidden": "true", html: GOOGLE_G }), h("span", `Sign in with your ${SCHOOL_DOMAIN} account`));
  btn.addEventListener("click", async () => {
    err.textContent = "";
    btn.disabled = true;
    try {
      // Signing in goes straight into the game, not back to the title.
      try {
        sessionStorage.setItem(ENTERED, "1");
      } catch {}
      await auth.signIn();
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") {
        err.textContent = e.code ? "Sign-in did not work. Please try again." : e.message;
        console.error(e);
      }
    } finally {
      btn.disabled = false;
    }
  });
  let saved = "";
  try {
    saved = sessionStorage.getItem("credit-creatures:justSaved") || "";
    sessionStorage.removeItem("credit-creatures:justSaved");
  } catch {}
  // The grand entrance (teacher request 2026-10-20): every creature on a hill
  // under a big title. Each gets its own colors and one accessory.
  const parade = [
    { species: "lanternFox", palette: "ember", accessories: { neck: "scarf" } },
    { species: "cloudBunny", palette: "cottonCandy", accessories: { head: "flower" } },
    { species: "shellTurtle", palette: "seafoam", accessories: { face: "glasses" } },
    { species: "starJellycorn", palette: "galaxy", eyes: "starry", accessories: {} },
    { species: "emberPhoenix", palette: "fireAndTide", accessories: {} },
    { species: "crystalOwl", palette: "frost", accessories: { head: "wizardHat" } },
    { species: "mossDragon", palette: "moss", accessories: { head: "crown" } },
    { species: "puddleGolem", palette: "lavender", accessories: { held: "balloon" } },
  ];
  // Two parts (teacher request 2026-10-20): the title and a Begin button, then
  // the sign-in card. Coming back from signing out or an error skips the title.
  const skipTitle = !user && Boolean(saved || error);
  const begin = h(
    "button.big.signin-begin.bst-seal-btn",
    { type: "button", hidden: skipTitle },
    h("span.bst-seal-wax", { html: sealSvg({ seed: 41, size: 92, letter: "C" }) }),
    h("span.bst-seal-text", "Begin")
  );
  begin.addEventListener("click", () => {
    if (user) {
      begin.disabled = true;
      begin.querySelector(".bst-seal-text").textContent = "Loading...";
      return enterGame(user);
    }
    const card = root.querySelector(".signin-card");
    begin.hidden = true;
    card.hidden = false;
    card.classList.add("reveal");
    card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    btn.focus({ preventScroll: true });
  });
  root.replaceChildren(
    // The cover of the Mossy Bestiary (2026-10-22): a leather-bound field guide
    // with the title stamped in gold and the eight creatures on its plate.
    h(
      "section.signin-hero.bestiary.bst-title",
      h("div.signin-sky", { "aria-hidden": "true" }, h("span.shooting-star"), h("span.shooting-star.second")),
      h("div.bst-decor", { "aria-hidden": "true" },
        h("span.bst-fern-left", { html: fernSvg({ seed: 51, curl: 0.4, width: 170, height: 310 }) }),
        h("span.bst-fern-right", { html: fernSvg({ seed: 57, curl: -0.34, leaves: 12, width: 150, height: 280 }) })
      ),
      h(
        "div.signin-inner",
        h("span.bst-cover-spine", { "aria-hidden": "true" }),
        // Two stacked copies: an outline behind and the gold in front, so the
        // outline never draws over the letters.
        h("h1.signin-title", h("span.t-back", { "aria-hidden": "true" }, "Credit Creatures"), h("span.t-front", "Credit Creatures")),
        h("p.signin-kicker", "A field guide to the creatures of the Kingdom of Coinhaven"),
        h("p.signin-tagline", "Raise a creature. Build its credit."),
        h(
          "div.signin-parade",
          { role: "img", "aria-label": "Eight creatures: a lantern fox, a cloud bunny, a shell turtle, a star jellycorn, an ember phoenix, a crystal owl, a moss dragon and a puddle golem" },
          parade.map((c, i) => h("span.signin-critter", { style: `--i: ${i}`, html: creatureSvg(c, { size: 160, label: "" }) })),
          h("span.bst-plate-moss", { "aria-hidden": "true", html: mossSvg({ seed: 61, width: 900, height: 54 }) })
        ),
        // Begin sits below the creatures, at the bottom center (teacher request 2026-10-21).
        begin,
        h(
          "div.signin-card",
          { hidden: !skipTitle && !user },
          saved ? h("p.callout.good", "✓ Saved. ", saved !== "1" ? `${saved} will be right here next time.` : "Your game will be right here next time.") : null,
          user
            ? h(
                "p.signin-who",
                `Signed in as ${user.displayName || user.email}. `,
                h("button.link", { type: "button", onclick: () => auth.signOut() }, "Not you? Sign out")
              )
            : btn,
          LOCAL ? h("p.note", "Local test mode. Your game saves in this browser only.") : null,
          err
        )
      )
    )
  );
}

// Students can't skip ahead. Earlier steps open only if they are editable.
// Settings is a pop-up on top of whatever the student is doing (teacher request
// 2026-10-23: going to a settings page lost the progress in an Arcade game).
function openAccountSettings() {
  if (!game) return;
  openSettings({ game, track, account: game.step === "hub" ? { go: (step) => (location.hash = `#/${step}`), saveAndExit, saveAndSignOut } : null });
}

function route() {
  if (!game) return;
  // A link to #/settings opens the pop-up and leaves the screen exactly as it was.
  if (location.hash.replace(/^#\/?/, "") === "settings" && game.step === "hub") {
    history.replaceState(null, "", `#/${shownName || "hub"}`);
    track("settingsOpen", { from: shownName || "hub" });
    return openAccountSettings();
  }
  setClassMuted(game.classInfo?.sound === false);
  const want = location.hash.replace(/^#\/?/, "");
  const current = STEPS.indexOf(game.step);
  let target = want;
  if (game.step === "hub" && HUB_SCREENS.has(want)) target = want;
  else if (!STEPS.includes(want)) target = game.step;
  else if (want !== game.step && !(EDITABLE.has(want) && STEPS.indexOf(want) < current)) target = game.step;
  if (target === "result" && !game.ob.lastResult) target = "design";
  if (game.step === "hub" && HUB_SCREENS.has(target)) target = hubTarget(target);
  if (target !== want) {
    history.replaceState(null, "", `#/${target}`);
  }
  show(target);
}

// A finished chapter waits for its reflection. A month needs a chapter in
// progress. Practice mode lasts until the student leaves it from the hub.
// Places open as they unlock (js/progression.js). A typed-in link to a
// locked place goes back to the kingdom.
const ROUTE_FEATURE = { ...Object.fromEntries(PLACES.map((p) => [p.route, p.feature])), trophies: "academy", cardIntro: "card", cardDesign: "card", cardResult: "card" };


function hubTarget(want) {
  const play = game.run.play;
  const feature = ROUTE_FEATURE[want];
  const bankStep = want === "accounts" && prologueStep(play)?.place === "vault";
  if (feature && !hasFeature(play, feature, game.run.life) && !bankStep) return "hub";
  if (play.summary) return "chapterEnd";
  if (want === "chapterEnd") return play.active ? "month" : "hub";
  if (want === "month" && !play.active) return "hub";
  return want;
}

// Screens morph into each other with a spring (View Transitions API). Going
// home zooms out, going to a place zooms in. Plain swap where unsupported.
let shownName = null;
function show(name) {
  const swap = () => showNow(name);
  const moving = shownName && shownName !== name;
  shownName = name;
  if (!moving || !document.startViewTransition || !motionOn()) return swap();
  document.documentElement.dataset.nav = name === "hub" ? "back" : "forward";
  // A second move that starts before this one finishes skips it, and the browser then rejects
  // the transition's promises. Skipping is fine, so those rejections are quietly ignored.
  const t = document.startViewTransition(swap);
  for (const p of [t.ready, t.finished, t.updateCallbackDone]) p.catch(() => {});
}

function showNow(name) {
  if (cleanup) cleanup();
  cleanup = null;
  clear(root);
  screenView(name);
  updateWho();
  const editing = name !== game.step && EDITABLE.has(name);
  const ctx = {
    game,
    editing,
    track,
    go: (step) => (location.hash = `#/${step}`),
    back: () => (location.hash = `#/${game.step}`),
    // Moves the student to the next step and saves.
    advance: async (step) => {
      game.save.onboarding.step = step;
      await game.persist(`step:${step}`);
      location.hash = `#/${step}`;
    },
    refreshWho: updateWho,
    openWallet,
    saveAndExit,
    saveAndSignOut,
  };
  // Icons made as the screen opens draw themselves in (Phase 16).
  drawIconsFor(700);
  cleanup = SCREENS[name].render(root, ctx) || null;
  window.scrollTo(0, 0);
}

function updateWho() {
  if (!game) return;
  paintChapter();
  paintNav();
  paintShell(game);
  paintDockButton(game);
  if (game.step === "hub" && !game.dailyChecked) {
    game.dailyChecked = true;
    dailyLogin();
  }
  const c = game.save.creature;
  clear(who);
  who.hidden = !c;
  if (!c) return;
  who.append(
    h("span.who-art", { html: creatureSvg(c, { size: 40, ageMonths: game.life?.ageMonths || 0 }) }),
    h("span.who-text", h("strong", c.name || "Your creature"), h("small", game.life ? ageLabel(game.life.ageMonths) : "Not hatched yet"))
  );
}

// The chapter's progress, always in the top bar (teacher request 2026-10-22).
// The pips are backed by words, so progress is never shown by color alone.
const chapterChip = document.getElementById("chapter-chip");
function paintChapter() {
  const inKingdom = game?.step === "hub";
  chapterChip.hidden = !inKingdom;
  if (!inKingdom) return;
  const play = game.run.play;
  let title;
  let sub;
  let total = 0;
  let done = 0;
  if (stageOf(play) === 0) {
    done = Math.max(0, PROLOGUE_STEPS.indexOf(prologueStep(play)));
    total = PROLOGUE_STEPS.length;
    title = "Prologue";
    sub = `Step ${done + 1} of ${total}`;
  } else if (play.active) {
    const a = play.active;
    total = a.months || CONFIG.pacing.monthsPerChapter;
    done = a.monthIndex;
    title = `Chapter ${a.chapter}: ${chapterInfo(a.chapter, play).title}`;
    sub = `Month ${a.monthIndex + 1} of ${total}`;
  } else {
    title = `Chapter ${play.chapter}: ${chapterInfo(play.chapter, play).title}`;
    sub = play.summary ? "Done. Wrap it up at Town Hall" : game.classInfo?.paused ? "Paused by your teacher" : canPlay(play, game.classInfo?.releasedChapter || 1) ? "Ready to start" : "Waiting for your teacher";
  }
  chapterChip.replaceChildren(
    ...[
      icon("scroll", { size: 20 }),
      h("span.chip-text", h("strong", title), h("small", sub)),
      total ? h("span.chip-pips", { "aria-hidden": "true" }, Array.from({ length: total }, (_, k) => h("span", { class: k < done ? "done" : k === done ? "current" : "" }))) : null,
    ].filter(Boolean)
  );
  chapterChip.setAttribute("aria-label", `${title}. ${sub}.`);
  chapterChip.title = play.active || play.summary ? "Go to Town Hall" : "Go Home";
}
chapterChip.addEventListener("click", () => {
  if (!game) return;
  const play = game.run.play;
  track("chapterChipClick", { from: location.hash.replace(/^#\/?/, "") || game.step });
  location.hash = play.active || play.summary ? "#/month" : "#/hub";
});
addEventListener("cc:decor", () => updateWho());
addEventListener("cc:saved", () => {
  paintChapter();
  paintShell(game);
});

// Home, Map, Wallet and Leaderboard in the top bar (teacher request
// 2026-10-22: the map, the wallet and the leaderboard were hard to find).
const topnav = document.getElementById("topnav");
const NAV = { wallet: ["wallet", "Wallet"], leaderboard: ["trophy", "Leaderboard"] };
function paintNav() {
  const inKingdom = game?.step === "hub";
  topnav.hidden = !inKingdom;
  if (!inKingdom) return;
  const here = location.hash.replace(/^#\/?/, "") || "hub";
  for (const b of topnav.querySelectorAll("button")) {
    const key = b.dataset.nav;
    const [ico, label] = NAV[key];
    b.replaceChildren(icon(ico, { size: 20 }), h("span", label));
    if (key === "leaderboard") b.hidden = game.classInfo?.leaderboard === false;
    if (key !== "wallet") b.setAttribute("aria-current", key === here ? "page" : "false");
  }
}
topnav.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || !game) return;
  track("topnavClick", { to: b.dataset.nav, from: location.hash.replace(/^#\/?/, "") || game.step });
  if (b.dataset.nav !== "wallet") location.hash = `#/${b.dataset.nav}`;
});

// The wallet pops open over any screen: money right now, the cards in it, and
// the way to the bank. In the prologue it's just the piggy bank.
const walletPop = document.getElementById("wallet-pop");
function openWallet() {
  if (!walletPop.matches(":popover-open")) walletPop.showPopover();
}
walletPop.addEventListener("beforetoggle", (e) => {
  if (e.newState !== "open" || !game?.run) return;
  const { play, life } = game.run;
  const bank = hasFeature(play, "vault", life) || prologueStep(play)?.place === "vault";
  const goBank = (tab) => () => {
    walletPop.hidePopover();
    game.accountsTab = tab;
    location.hash = "#/accounts";
  };
  walletPop.replaceChildren(...[
    h("div.wallet-pop-head", h("h2", icon("wallet", { size: 22 }), " Your wallet"), h("button.wallet-pop-close", { type: "button", "aria-label": "Close the wallet", onclick: () => walletPop.hidePopover() }, "✕")),
    moneyChips(life, play),
    stageOf(play) === 0
      ? h("p.note.tight", bank ? "Your coins are in a piggy bank. Take them to the Vault to open a bank account." : "Your coins are in a piggy bank for now. Work shifts at the Arcade to fill it.")
      : walletStrip(life, game.save.creature),
    bank && stageOf(play) > 0
      ? h("div.row", h("button", { type: "button", onclick: goBank("wallet") }, icon("vault", { size: 18 }), " Pay bills and move money"), h("button.secondary", { type: "button", onclick: goBank("inbox") }, icon("inbox", { size: 18 }), " Letters"))
      : bank
        ? h("div.row", h("button", { type: "button", onclick: goBank("wallet") }, icon("vault", { size: 18 }), " Go to the Vault"))
        : null
  ].filter(Boolean));
  track("walletOpen", { from: location.hash.replace(/^#\/?/, "") || game.step });
});

// The creature in the top bar opens its Cottage from anywhere (teacher request
// 2026-10-20). Before the hub it opens the creature editor instead.
who.addEventListener("click", () => {
  if (!game?.save.creature) return;
  track("whoClick", { from: location.hash.replace(/^#\/?/, "") || game.step });
  location.hash = game.step === "hub" ? "#/cottage" : STEPS.indexOf(game.step) > STEPS.indexOf("creature") ? "#/creature" : `#/${game.step}`;
});

// One button for leaving (teacher request 2026-10-20: "Save and quit" next to
// "Sign out" looked like the same thing twice). The game saves as students
// play, so this saves once more and goes back to the title. Students stay
// signed in (teacher request 2026-10-21), and the title has "Not you? Sign out"
// for a shared laptop.
async function saveAndExit() {
  if (game) {
    track("saveAndExit", { step: game.step });
    await game.persist("signOut");
    try {
      sessionStorage.setItem("credit-creatures:justSaved", game.save.creature?.name || "1");
    } catch {}
  }
  try {
    sessionStorage.removeItem(ENTERED);
  } catch {}
  location.hash = "";
  location.reload();
}

// Settings page: leave and sign out, for a shared laptop.
async function saveAndSignOut() {
  if (game) {
    track("saveAndSignOut", { step: game.step });
    await game.persist("signOut");
  }
  try {
    sessionStorage.removeItem(ENTERED);
  } catch {}
  await auth.signOut();
  location.hash = "";
  location.reload();
}

function showNudge() {
  const bar = document.getElementById("nudge");
  bar.replaceChildren(
    h("span", "⏳ You've played for a while. This is a good time to save."),
    h("button", { type: "button", onclick: () => ((bar.hidden = true), saveAndExit()) }, "Save and exit"),
    h("button.secondary", { type: "button", onclick: () => ((bar.hidden = true), track("nudgeDismissed")) }, "Keep playing")
  );
  bar.hidden = false;
}

document.getElementById("sign-out").addEventListener("click", saveAndExit);
// The gear opens Account settings (teacher request 2026-10-21). Before the
// kingdom exists, the same settings open in a pop-up.
document.getElementById("settings-btn").addEventListener("click", () => {
  if (!game) return;
  track("settingsOpen", { from: location.hash.replace(/^#\/?/, "") || game.step });
  openAccountSettings();
});
// The speaker in the top bar turns sound on or off in one tap. Off until the
// student turns it on, since they may be in a quiet classroom.
const soundBtn = document.getElementById("sound-btn");
function paintSoundBtn() {
  const on = soundOn();
  soundBtn.disabled = classIsMuted();
  soundBtn.setAttribute("aria-pressed", String(on));
  soundBtn.title = classIsMuted() ? "Your teacher turned sound off for the class" : on ? "Sound is on. Tap to mute it." : "Sound is off. Tap to turn it on.";
  soundBtn.replaceChildren(icon(on ? "volume" : "mute", { size: 22 }), h("span.sr-only", on ? "Sound on" : "Sound off"));
}
soundBtn.addEventListener("click", () => {
  const s = applySettings({ ...loadLocalSettings(), sound: soundOn() ? "off" : "on" });
  if (s.sound === "on") sfx.coinGain();
  if (game) saveSettings(game, track, s);
});
addEventListener("cc:settings", paintSoundBtn);
paintSoundBtn();
// A soft click for buttons (only when sound is on). Buttons with their own
// sound (card flips, rewards) set data-sound="none".
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("button");
  if (b && !b.disabled && b.dataset.sound !== "none") sfx.tap();
});
// A backup save when the tab is hidden, closed or refreshed (bug fix
// 2026-10-22: progress was lost when a student clicked out). The game also
// saves after every choice. persist() flushes telemetry too. pagehide often
// follows visibilitychange, so one save covers both.
let lastBackup = 0;
function backupSave(reason) {
  if (!game || Date.now() - lastBackup < 2000) return;
  // Before there's a creature there's nothing to save, only play data to send.
  if (!game.save.creature) return flush(reason);
  lastBackup = Date.now();
  game.persist(reason);
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") backupSave("hidden");
  else checkReset();
});

// A tab left open when the teacher sent the student back to the start
// reloads when the student comes back to it, so it can't keep the old game.
let resetCheckedAt = 0;
async function checkReset() {
  if (!game || Date.now() - resetCheckedAt < 20000) return;
  resetCheckedAt = Date.now();
  const at = await db.getReset(game.user.email || "").catch(() => null);
  if (at && game.save.resetSeen !== at) location.reload();
}
addEventListener("pagehide", () => backupSave("pagehide"));
