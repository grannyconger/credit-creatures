// Appearance (light, dark or system) and reading (standard or dyslexia-friendly).
// Kept in this browser so it applies before sign-in finishes, and in the save
// (play.settings) so it follows the student to another computer.
const KEY = "credit-creatures:settings";
export const DEFAULT_SETTINGS = { appearance: "system", reading: "standard" };

export function loadLocalSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function applySettings(settings) {
  const s = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const root = document.documentElement;
  if (s.appearance === "system") delete root.dataset.appearance;
  else root.dataset.appearance = s.appearance;
  if (s.reading === "dyslexia") root.dataset.reading = "dyslexia";
  else delete root.dataset.reading;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private windows can refuse storage. The setting still applies for now.
  }
  return s;
}

export const APPEARANCE_LABELS = { system: "Match my computer", light: "Light", dark: "Dark" };
export const READING_LABELS = { standard: "Standard", dyslexia: "Dyslexia-friendly" };
