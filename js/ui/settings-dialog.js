// Look, reading and sound in a pop-up (teacher request 2026-10-21): once right
// after signing in on a browser, and from the gear before the kingdom exists.
// The Account settings page (js/ui/screens/settings.js) has the same switches.
import { h } from "./dom.js";
import { icon } from "./icons.js";
import { settingsControls } from "./settings-controls.js";
import { loadLocalSettings } from "./settings.js";

const ASKED = "credit-creatures:settingsAsked:";

// Saves a change to the game too, so the settings follow the student.
export async function saveSettings(game, track, s) {
  track("settingsChanged", s);
  if (game.save.play) {
    game.save.play.settings = s;
    await game.persist("settings");
  }
}

// account: { go, saveAndExit, saveAndSignOut } adds the account section, so the
// gear opens everything in one pop-up on top of the current screen.
export function openSettings({ game, track, first = false, account = null }) {
  const current = { ...loadLocalSettings(), ...(game.save.play?.settings || {}) };
  const dialog = h("dialog.settings-dialog.bst-scope", { "aria-labelledby": "settings-title" });
  const close = () => {
    dialog.close();
    dialog.remove();
  };
  const user = game.user || {};
  const accountSection = account
    ? [
        h("h3", icon("people", { size: 18 }), " Your account"),
        game.local ? h("p", "Local test mode. Your game saves in this browser only.") : h("p", "Signed in as ", h("strong", user.displayName || user.email || "you"), user.email && user.displayName ? ` (${user.email})` : "", "."),
        h("p", "Your name: ", h("strong", [game.save.onboarding?.firstName, game.save.onboarding?.lastName].filter(Boolean).join(" ") || game.profile?.displayName || "not set"), " ", h("button.link", { type: "button", onclick: () => (close(), account.go("profile")) }, "Change my name")),
        h("p.note.tight", "Your game saves by itself as you play. On a shared computer, sign out instead of Save and exit."),
        h("div.row", h("button", { type: "button", onclick: () => (close(), account.saveAndExit()) }, icon("save", { size: 18 }), " Save and exit"), h("button.secondary", { type: "button", onclick: () => (close(), account.saveAndSignOut()) }, icon("logout", { size: 18 }), " Save and sign out"))
      ]
    : [];
  dialog.append(
    h("h2", { id: "settings-title" }, icon("gear", { size: 22 }), first ? " Set up your game" : " Settings"),
    h("p.muted", first ? "Pick how the game looks and sounds. You can change these any time with the gear at the top." : "Changes happen right away, and you stay on your page. These follow you to any computer."),
    settingsControls({ current, onChange: (s) => saveSettings(game, track, s) }),
    ...accountSection,
    h("div.row.settings-done", h("button", { type: "button", "data-autofocus": "", onclick: close }, first ? "Let's play" : "Done"))
  );
  dialog.addEventListener("cancel", close);
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}

// The first time a student signs in on this browser.
export function firstSettings({ game, track }) {
  const key = ASKED + (game.user?.uid || "local");
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    return;
  }
  track("settingsFirst", {});
  openSettings({ game, track, first: true });
}
