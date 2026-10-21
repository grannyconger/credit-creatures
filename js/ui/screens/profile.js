// Profile: the student's real first and last name (teacher request
// 2026-10-21), filled in from Google and editable (SPEC §6). The teacher sorts
// the roster by them. They're kept in the save's onboarding fields, which the
// rules already allow, and joined into the display name.
import { h } from "../dom.js";

const PART_MAX = 20;
const NAME_MAX = 30;

// "Avery Lee Smith" -> ["Avery", "Lee Smith"].
export function splitName(full = "") {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return [parts[0] || "", parts.slice(1).join(" ")];
}

const clean = (s) => s.trim().replace(/\s+/g, " ").slice(0, PART_MAX);

export function render(root, { game, advance, back, editing, track }) {
  const ob = game.save.onboarding;
  const [gFirst, gLast] = splitName(game.user.displayName || game.profile.displayName);
  const field = (id, label, value, autocomplete) => {
    const input = h("input", { type: "text", maxlength: PART_MAX, value, autocomplete, id });
    return { input, el: h("div.name-field", h("label", { for: id }, label), input) };
  };
  const first = field("first-name", "First name", ob.firstName ?? gFirst, "given-name");
  const last = field("last-name", "Last name", ob.lastName ?? gLast, "family-name");
  const error = h("p.error", { role: "alert" });
  const btn = h("button", { type: "submit" }, editing ? "Save name" : "Next: make your creature");

  const form = h(
    "form.panel.narrow",
    h("p.step-label", "Getting started"),
    h("h1", "What's your name?"),
    h("p", "Use your real first and last name, not a gamer tag. We filled them in from your school account."),
    h("div.name-row", first.el, last.el),
    h("p.note", "Your teacher sees your name. Classmates may see it on the leaderboard and in Friends. You'll name your creature next."),
    error,
    h("div.row", editing ? h("button.secondary", { type: "button", onclick: back }, "Cancel") : null, btn)
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstName = clean(first.input.value);
    const lastName = clean(last.input.value);
    if (!firstName || !lastName) {
      error.textContent = !firstName ? "Please type your first name." : "Please type your last name.";
      (firstName ? last : first).input.focus();
      return;
    }
    const name = `${firstName} ${lastName}`.slice(0, NAME_MAX);
    btn.disabled = true;
    try {
      await game.db.saveProfileFields(game.user, { displayName: name });
      track("profileSaved", { changedFromGoogle: name !== (game.user.displayName || ""), editing });
      game.profile.displayName = name;
      Object.assign(ob, { firstName, lastName });
      if (editing) {
        await game.persist("name");
        back();
      } else await advance("creature");
    } catch (err) {
      console.error(err);
      error.textContent = "We couldn't save your name. Please try again.";
      btn.disabled = false;
    }
  });

  root.append(form);
  first.input.focus();
}
