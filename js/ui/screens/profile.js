// Profile: the student's real first and last name (teacher request
// 2026-10-21), filled in from Google and editable (SPEC §6). The teacher sorts
// the roster by them. They're kept in the save's onboarding fields, which the
// rules already allow, and joined into the display name.
// A page of the Mossy Bestiary (2026-10-23): the student writes their name on
// the field guide's bookplate, the way a book says who it belongs to.
import { h } from "../dom.js";
import { icon } from "../icons.js";
import { sealSvg, tapeSvg, fernSvg } from "../bestiary-art.js";

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
  // Each name is written on a ruled line of the bookplate, with its label underneath.
  const field = (id, label, value, autocomplete) => {
    const input = h("input.bst-name-input", { type: "text", maxlength: PART_MAX, value, autocomplete, id, spellcheck: "false" });
    return { input, el: h("div.bst-name-field", input, h("label", { for: id }, label)) };
  };
  const first = field("first-name", "First name", ob.firstName ?? gFirst, "given-name");
  const last = field("last-name", "Last name", ob.lastName ?? gLast, "family-name");
  const error = h("p.bst-error", { role: "alert" });
  const btn = h(
    "button.bst-seal-btn",
    { type: "submit" },
    h("span.bst-seal-wax", { html: sealSvg({ seed: 29, size: 84, letter: (ob.firstName || gFirst || "G").charAt(0).toUpperCase() }) }),
    h("span.bst-seal-text", editing ? "Save name" : "Write my name in")
  );

  const form = h(
    "form.bst-bookplate",
    { novalidate: true, "aria-labelledby": "bst-name-title" },
    h("span.bst-bookplate-fern", { "aria-hidden": "true", html: fernSvg({ seed: 91, curl: 0.3, leaves: 10, width: 90, height: 170 }) }),
    h("p.bst-bookplate-belongs", "This field guide belongs to"),
    h("h1", { id: "bst-name-title" }, "What's your name?"),
    h("p.bst-bookplate-sub", "Use your real first and last name, not a gamer tag. We filled them in from your school account."),
    h("div.bst-name-row", first.el, last.el),
    error,
    h(
      "div.bst-actions",
      editing ? h("button.secondary", { type: "button", onclick: back }, "Cancel") : null,
      btn,
      editing ? null : h("p.bst-next", "Next you'll meet your creature.")
    )
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
      error.textContent = "We couldn't save your name. Check your internet, then press the seal again.";
      btn.disabled = false;
    }
  });

  for (const f of [first, last]) f.input.addEventListener("input", () => (error.textContent = ""));

  root.append(
    h(
      "div.bestiary.bst-name",
      h("div.bst-decor", { "aria-hidden": "true" },
        h("span.bst-fern-left", { html: fernSvg({ seed: 95, curl: 0.42, width: 150, height: 280 }) }),
        h("span.bst-fern-right", { html: fernSvg({ seed: 99, curl: -0.3, leaves: 12, width: 130, height: 250 }) })
      ),
      h(
        "div.bst-name-spread",
        form,
        // Who sees the name, on a slip tucked beside the bookplate.
        h(
          "aside.bst-name-slip",
          h("span.bst-name-tape", { "aria-hidden": "true", html: tapeSvg(7) }),
          h("h2", icon("people", { size: 22 }), "Who sees your name"),
          h("ul", h("li", "Your teacher."), h("li", "Classmates, on the leaderboard and in Friends.")),
          h("p", "You'll name your creature next.")
        ),
        h("p.bst-margin.bst-name-margin", { "aria-hidden": "true" }, "Sir Snacks-a-Lot is a fine name. It just belongs to a creature, not you.")
      )
    )
  );
  first.input.focus();
}
