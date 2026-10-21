// App shell: sign-in, loading the save, and a hash router over the screens.
// Add ?local to a localhost URL to play with browser storage and no sign-in.
import { isConfigured } from "./firebase-config.js";
import { createGame, STEPS, EDITABLE, HUB_SCREENS } from "./game.js";
import { initTelemetry, captureErrors, screenView, track, flush, onSessionNudge } from "./telemetry.js";
import { mountBugButton } from "./ui/bug-button.js";
import { sound, setClassMuted } from "./ui/sound.js";
import { PLACES } from "./places.js";
import { hasFeature, prologueStep } from "./progression.js";
import { creatureSvg } from "./ui/creature-art.js";
import { h, clear, ageLabel } from "./ui/dom.js";
import { settingsControls } from "./ui/settings-controls.js";
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
import { watchSentences } from "./ui/sentences.js";

const SCREENS = { profile, creature, join, cardIntro: networks, cardDesign: design, cardResult: result, hub, month, chapterEnd, accounts, shop, trophies, friends, intro, dream, guild, academy, cottage, garage, records, alley };

const LOCAL = new URLSearchParams(location.search).has("local") && ["localhost", "127.0.0.1"].includes(location.hostname);

const root = document.getElementById("app");
const topbar = document.getElementById("topbar");
const who = document.getElementById("who");
let game = null;
let cleanup = null;
// Set once the student is in the game this tab, so a refresh skips the title.
const ENTERED = "credit-creatures:entered";

captureErrors();
// Each sentence on its own line, everywhere in the game (js/ui/sentences.js).
watchSentences(document.body);

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
  root.replaceChildren(h("section.panel.center", h("p", "Loading your creature...")));
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
  bug.hide();
  const err = h("p.error", { role: "alert" }, error);
  const btn = h("button.big", { type: "button", disabled: !auth }, "Sign in with your school Google account");
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
  const begin = h("button.big.signin-begin", { type: "button", hidden: skipTitle }, "Begin");
  begin.addEventListener("click", () => {
    if (user) {
      begin.disabled = true;
      begin.textContent = "Loading...";
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
    h(
      "section.signin-hero",
      h("div.signin-sky", { "aria-hidden": "true" }, h("span.shooting-star"), h("span.shooting-star.second")),
      h(
        "div.signin-inner",
        h("p.signin-kicker", "Welcome to the Kingdom of Coinhaven"),
        // Two stacked copies: an outline behind and the gold in front, so the
        // outline never draws over the letters.
        h("h1.signin-title", h("span.t-back", { "aria-hidden": "true" }, "Credit Creatures"), h("span.t-front", "Credit Creatures")),
        h("p.signin-tagline", "Raise a creature. Build its credit. Watch every choice add up."),
        begin,
        h(
          "div.signin-parade",
          { role: "img", "aria-label": "Eight creatures: a lantern fox, a cloud bunny, a shell turtle, a star jellycorn, an ember phoenix, a crystal owl, a moss dragon and a puddle golem" },
          parade.map((c, i) => h("span.signin-critter", { style: { "--i": i }, html: creatureSvg(c, { size: 160, label: "" }) }))
        ),
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
          err,
          settingsControls()
        )
      )
    )
  );
}

// Students can't skip ahead. Earlier steps open only if they are editable.
function route() {
  if (!game) return;
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

function show(name) {
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
    saveAndExit,
  };
  cleanup = SCREENS[name].render(root, ctx) || null;
  window.scrollTo(0, 0);
}

function updateWho() {
  if (!game) return;
  const c = game.save.creature;
  clear(who);
  who.hidden = !c;
  if (!c) return;
  who.append(
    h("span.who-art", { html: creatureSvg(c, { size: 40, ageMonths: game.life?.ageMonths || 0 }) }),
    h("span.who-text", h("strong", c.name || "Your creature"), h("small", game.life ? ageLabel(game.life.ageMonths) : "Not hatched yet"))
  );
}

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
// A soft click for buttons (only when sound is on). Buttons with their own
// sound (card flips, rewards) set data-sound="none".
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("button, a.brand");
  if (b && !b.disabled && b.dataset.sound !== "none") sound("click");
});
// The title always goes home: the kingdom once the student has one, otherwise
// the onboarding step they're on.
document.getElementById("brand").addEventListener("click", (e) => {
  e.preventDefault();
  if (!game) return;
  track("brandClick", { from: location.hash.replace(/^#\/?/, "") || game.step });
  location.hash = game.step === "hub" ? "#/hub" : `#/${game.step}`;
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && game) flush("hidden");
});
