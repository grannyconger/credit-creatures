// Appearance, reading and sound switches. Used on the sign-in screen and in the Cottage.
// onChange(settings) runs after a change (the Cottage saves it to the game).
import { h, fill } from "./dom.js";
import { applySettings, loadLocalSettings, APPEARANCE_LABELS, READING_LABELS, SOUND_LABELS } from "./settings.js";
import { sound, classIsMuted } from "./sound.js";

export function settingsControls({ current = loadLocalSettings(), onChange = () => {} } = {}) {
  const box = h("div.settings-row");
  let s = { ...current };
  const group = (key, label, labels) =>
    h(
      "div.chip-group",
      { role: "group", "aria-label": label },
      h("span.chip-label", label),
      Object.entries(labels).map(([v, text]) =>
        h(
          "button.chip",
          {
            type: "button",
            "aria-pressed": String(s[key] === v),
            onclick: () => {
              s = applySettings({ ...s, [key]: v });
              paint();
              onChange(s);
              if (key === "sound" && v === "on") sound("coin");
            },
          },
          text
        )
      )
    );
  const paint = () =>
    fill(
      box,
      group("appearance", "Look", APPEARANCE_LABELS),
      group("reading", "Reading", READING_LABELS),
      classIsMuted() ? h("p.note.tight", "🔇 Your teacher turned sound off for the class.") : group("sound", "Sound", SOUND_LABELS)
    );
  paint();
  return box;
}
