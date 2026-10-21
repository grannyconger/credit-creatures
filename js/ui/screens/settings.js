// Account settings (teacher request 2026-10-21: settings were hard to find).
// Opened from the gear in the top bar. Look, reading and sound, who's signed
// in, and the ways to leave.
import { h } from "../dom.js";
import { icon } from "../icons.js";
import { placeHeader } from "../place-header.js";
import { settingsControls } from "../settings-controls.js";
import { loadLocalSettings } from "../settings.js";
import { saveSettings } from "../settings-dialog.js";

export function render(root, { game, go, track, saveAndExit, saveAndSignOut }) {
  const user = game.user || {};
  track("settingsPage", {});
  root.append(
    h(
      "section.panel.place-screen.account-settings",
      placeHeader({ go, iconName: "gear", kicker: "Your account", title: "Account settings", subtitle: "How the game looks and sounds, and your sign-in." }),
      h(
        "section.settings-section",
        h("h2", icon("palette", { size: 20 }), " Look, reading and sound"),
        h("p.note.tight", "These follow you to any computer."),
        settingsControls({ current: { ...loadLocalSettings(), ...(game.save.play?.settings || {}) }, onChange: (s) => saveSettings(game, track, s) })
      ),
      h(
        "section.settings-section",
        h("h2", icon("people", { size: 20 }), " Your account"),
        game.local ? h("p", "Local test mode. Your game saves in this browser only.") : h("p", "Signed in as ", h("strong", user.displayName || user.email || "you"), user.email && user.displayName ? ` (${user.email})` : "", "."),
        h("p.note.tight", "Your game saves by itself as you play. Save and exit keeps you signed in on this computer. On a shared computer, sign out instead."),
        h(
          "div.row",
          h("button", { type: "button", onclick: () => saveAndExit() }, icon("save", { size: 18 }), " Save and exit"),
          h("button.secondary", { type: "button", onclick: () => saveAndSignOut() }, icon("logout", { size: 18 }), " Save and sign out")
        )
      ),
      h(
        "section.settings-section",
        h("h2", icon("cottage", { size: 20 }), " Your creature"),
        h("p.note.tight", "Change your creature's look and see its dream at your Cottage."),
        h("div.row", h("button.secondary", { type: "button", onclick: () => go("cottage") }, "Go to your Cottage"))
      )
    )
  );
}
