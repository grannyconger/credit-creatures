// Join a class with the code from the teacher (SPEC §6).
import { h } from "../dom.js";

const CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function render(root, { game, advance, track }) {
  // Phase 10: joining a class starts the prologue in the kingdom.
  const start = async () => {
    game.beginPrologue();
    track("prologueStart", {});
    await advance("hub");
  };
  const input = h("input.code-input", { type: "text", maxlength: 6, autocomplete: "off", id: "class-code", placeholder: "ABC234" });
  const error = h("p.error", { role: "alert" });
  const btn = h("button", { type: "submit" }, "Join class");

  const joined = game.classInfo
    ? h(
        "div.callout.good",
        h("p", "You are in ", h("strong", game.classInfo.name), "."),
        h("button", { type: "button", onclick: () => start() }, "Enter the kingdom")
      )
    : null;

  const form = h(
    "form.panel.narrow",
    h("p.step-label", "Step 3: your class"),
    h("h1", "Join your class"),
    joined,
    h("label", { for: "class-code" }, joined ? "Or type a different code" : "Type the 6-letter code your teacher gave you"),
    input,
    error,
    h("div.row", btn)
  );

  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = input.value.trim().toUpperCase();
    error.textContent = "";
    if (!CODE_PATTERN.test(code)) {
      error.textContent = "Class codes have 6 letters and numbers.";
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
      await start();
    } catch (err) {
      console.error(err);
      error.textContent = "Joining did not work. Please try again.";
      btn.disabled = false;
    }
  });

  root.append(form);
  input.focus();
}
