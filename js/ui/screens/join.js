// Join a class with the code from the teacher (SPEC §6).
// A page of the Mossy Bestiary (2026-10-22): the creature waits by the
// sanctuary gate while the student writes the class code on a visitor's pass
// and seals it.
import { h } from "../dom.js";
import { icon } from "../icons.js";
import { creatureSvg } from "../creature-art.js";
import { sealSvg, stringSvg, fernSvg, mossSvg } from "../bestiary-art.js";

const CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function render(root, { game, advance, track }) {
  const c = game.save.creature || {};
  // Phase 10: joining a class starts the prologue in the kingdom.
  const start = async () => {
    game.beginPrologue();
    track("prologueStart", {});
    await advance("hub");
  };
  const input = h("input.bst-code", { type: "text", maxlength: 6, autocomplete: "off", id: "class-code", placeholder: "ABC234", spellcheck: "false", autocapitalize: "characters" });
  const error = h("p.bst-error", { role: "alert" });
  const letter = (c.name || "C").charAt(0).toUpperCase();
  const seal = (label, attrs = {}) =>
    h("button.bst-seal-btn", attrs, h("span.bst-seal-wax", { html: sealSvg({ seed: 17, size: 84, letter }) }), h("span.bst-seal-text", label));
  const btn = seal("Join the class", { type: "submit" });

  const joined = game.classInfo
    ? h(
        "div.bst-joined",
        h("p", icon("check", { size: 18 }), h("span", "You're already in ", h("strong", game.classInfo.name), ".")),
        seal("Enter the kingdom", { type: "button", onclick: () => start() })
      )
    : null;

  const pass = h(
    "form.bst-pass",
    { novalidate: true, "aria-labelledby": "bst-join-title" },
    h("span.bst-pass-string", { "aria-hidden": "true", html: stringSvg() }),
    h("h1", { id: "bst-join-title" }, "Join your class"),
    h("p.bst-pass-sub", `Visitor's pass for ${c.name || "your creature"} and its Guardian`),
    joined,
    h("label.bst-pass-label", { for: "class-code" }, joined ? "Or write a different code" : "Write the 6-letter code your teacher gave you"),
    input,
    error,
    h("div.bst-actions", btn)
  );

  root.append(
    h(
      "div.bestiary.bst-join",
      h("div.bst-decor", { "aria-hidden": "true" },
        h("span.bst-fern-left", { html: fernSvg({ seed: 31, curl: 0.4, width: 150, height: 280 }) }),
        h("span.bst-fern-right", { html: fernSvg({ seed: 37, curl: -0.32, leaves: 12, width: 130, height: 250 }) })
      ),
      h(
        "div.bst-gate",
        h(
          "figure.bst-gate-creature",
          { "aria-hidden": "true" },
          h("span.bst-gate-art", { html: creatureSvg(c, { size: 280, label: "", ageMonths: game.life?.ageMonths || 0 }) }),
          h("span.bst-gate-moss", { html: mossSvg({ seed: 22, width: 300, height: 56 }) }),
          h("figcaption.bst-margin", "Your teacher has the code. Teachers always have the code.")
        ),
        pass
      )
    )
  );

  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (error.textContent) error.textContent = "";
  });

  pass.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = input.value.trim().toUpperCase();
    error.textContent = "";
    if (!CODE_PATTERN.test(code)) {
      error.textContent = "Class codes have 6 letters and numbers. Count them on your fingers if it helps.";
      return;
    }
    btn.disabled = true;
    try {
      const found = await game.db.findClassByCode(code);
      track("joinAttempt", { found: Boolean(found) });
      if (!found) {
        error.textContent = "We couldn't find that code. Check it with your teacher.";
        btn.disabled = false;
        return;
      }
      await game.db.saveProfileFields(game.user, { classId: found.classId, joinedClassAt: Date.now() });
      game.profile.classId = found.classId;
      // The full class doc has teacherEmail, which every save carries for the teacher's roster.
      game.classInfo = (await game.db.getClass(found.classId).catch(() => null)) || { id: found.classId, name: found.name };
      btn.classList.add("pressed");
      await start();
    } catch (err) {
      console.error(err);
      error.textContent = "Joining did not work. Please try again.";
      btn.disabled = false;
    }
  });

  input.focus();
}
