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

export function openSettings({ game, track, first = false }) {
  const current = { ...loadLocalSettings(), ...(game.save.play?.settings || {}) };
  const dialog = h("dialog.settings-dialog", { "aria-labelledby": "settings-title" });
  const close = () => {
    dialog.close();
    dialog.remove();
  };
  dialog.append(
    h("h2", { id: "settings-title" }, icon("gear", { size: 22 }), first ? " Set up your game" : " Settings"),
    h("p.muted", first ? "Pick how the game looks and sounds. You can change these any time with the gear at the top." : "These follow you to any computer."),
    settingsControls({ current, onChange: (s) => saveSettings(game, track, s) }),
    h("div.row", h("button", { type: "button", onclick: close }, first ? "Let's play" : "Done"))
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
