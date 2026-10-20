// Profile: the student's display name, from Google and editable (SPEC §6).
import { h } from "../dom.js";

const NAME_MAX = 30;

export function render(root, { game, advance, back, editing, track }) {
  const input = h("input", { type: "text", maxlength: NAME_MAX, value: game.profile.displayName, autocomplete: "off", id: "display-name" });
  const error = h("p.error", { role: "alert" });
  const btn = h("button", { type: "submit" }, editing ? "Save name" : "Next: make your creature");

  const form = h(
    "form.panel.narrow",
    h("p.step-label", "Getting started"),
    h("h1", "What should we call you?"),
    h("p", "We filled in the name from your school account. You can change it."),
    h("label", { for: "display-name" }, "Your name in the game"),
    input,
    h("p.note", "Your teacher sees this name. Classmates may see it on the leaderboard. A first name or nickname works great."),
    error,
    h("div.row", editing ? h("button.secondary", { type: "button", onclick: back }, "Cancel") : null, btn)
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = input.value.trim().replace(/\s+/g, " ");
    if (!name) {
      error.textContent = "Please type a name.";
      return;
    }
    btn.disabled = true;
    try {
      await game.db.saveProfileFields(game.user, { displayName: name });
      track("profileSaved", { changedFromGoogle: name !== (game.user.displayName || ""), editing });
      game.profile.displayName = name;
      if (editing) back();
      else await advance("creature");
    } catch (err) {
      console.error(err);
      error.textContent = "We couldn't save your name. Please try again.";
      btn.disabled = false;
    }
  });

  root.append(form);
  input.focus();
}
