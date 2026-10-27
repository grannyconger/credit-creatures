// The "Something's wrong" button on every screen (docs/FEEDBACK.md).
// It sends the screen, seed and recent actions so the bug can be replayed.
import { h, toast } from "./dom.js";
import { currentScreen, recentEvents, sessionId, track } from "../telemetry.js";
import { LIFE_VERSION } from "../engine/index.js";

const NOTE_MAX = 500;

// getContext() returns { uid, classId, teacherEmail, life }. send(report) saves it.
export function mountBugButton({ getContext, send }) {
  const note = h("textarea", { rows: 4, maxlength: NOTE_MAX, placeholder: "What happened? What did you expect?" });
  const status = h("p.error");
  const sendBtn = h("button", { type: "button" }, "Send report");
  const dialog = h(
    "dialog.bug-dialog",
    h("h2", "🐞 Something's wrong?"),
    h("p", "Tell us what happened. We also send the screen you are on and your last few moves, so we can find the bug."),
    h("p.note", "Please don't type your name, phone number or other personal info."),
    note,
    status,
    h("div.row", h("button.secondary", { type: "button", onclick: () => dialog.close() }, "Cancel"), sendBtn)
  );

  sendBtn.addEventListener("click", async () => {
    sendBtn.disabled = true;
    status.textContent = "";
    const { uid, classId, teacherEmail, life } = getContext();
    try {
      await send({
        uid,
        classId: classId || "",
        teacherEmail: teacherEmail || "",
        screen: currentScreen() || "",
        note: note.value.trim().slice(0, NOTE_MAX),
        seed: life?.seed || "",
        month: life?.month ?? -1,
        engineVersion: LIFE_VERSION,
        sessionId: sessionId(),
        actionsJson: JSON.stringify(life ? life.log.slice(-20) : []),
        eventsJson: JSON.stringify(recentEvents()),
        userAgent: navigator.userAgent.slice(0, 200),
      });
      track("bugReport", { hasNote: note.value.trim().length > 0 });
      note.value = "";
      dialog.close();
      toast("Thanks! Your report was sent.", "good");
    } catch (err) {
      console.error(err);
      status.textContent = "The report did not send. Please try again.";
    } finally {
      sendBtn.disabled = false;
    }
  });

  // A small drawn ladybug (the bestiary draws its icons, no emoji).
  const bug = '<svg class="bst-bug" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="10" cy="5.5" r="3.2" fill="var(--b-ink, #1b2420)"/><ellipse cx="10" cy="12" rx="6.5" ry="6.2" fill="var(--b-rust, #b5532e)"/><path d="M10 6 V18" stroke="var(--b-ink, #1b2420)" stroke-width="1.2"/><circle cx="7" cy="10.5" r="1.3" fill="var(--b-ink, #1b2420)"/><circle cx="13" cy="10.5" r="1.3" fill="var(--b-ink, #1b2420)"/><circle cx="7.6" cy="14.6" r="1.1" fill="var(--b-ink, #1b2420)"/><circle cx="12.4" cy="14.6" r="1.1" fill="var(--b-ink, #1b2420)"/></svg>';
  const button = h("button.bug-button.bst-scope.bst-bug-button", { type: "button", title: "Report a problem", "aria-label": "Report a problem (Bugs?)", onclick: () => dialog.showModal() }, h("span", { "aria-hidden": "true" }, "🐞"), h("span.bug-word", " Bugs?"));
  document.body.append(button, dialog);
  // While the bottom bar shows, the tag sits in it, beside Things To Do, so it
  // never covers the page (layout audit 2026-10-26). Elsewhere it floats.
  const bar = document.getElementById("bottombar");
  if (bar) {
    const dock = () => {
      if (!bar.hidden && button.parentElement !== bar) bar.insertBefore(button, document.getElementById("things-btn"));
      else if (bar.hidden && button.parentElement !== document.body) document.body.insertBefore(button, dialog);
    };
    new MutationObserver(dock).observe(bar, { attributes: true, attributeFilter: ["hidden"] });
    dock();
  }
  return { show: () => (button.hidden = false), hide: () => (button.hidden = true) };
}
