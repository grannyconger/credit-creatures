// The "Something's wrong" button on every screen (docs/FEEDBACK.md).
// It sends the screen, seed and recent actions so the bug can be replayed.
import { h, toast } from "./dom.js";
import { currentScreen, recentEvents, sessionId, track } from "../telemetry.js";
import { LIFE_VERSION } from "../engine/index.js";

const NOTE_MAX = 500;

// getContext() returns { uid, classId, life }. send(report) saves it.
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
    const { uid, classId, life } = getContext();
    try {
      await send({
        uid,
        classId: classId || "",
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

  const button = h("button.bug-button", { type: "button", title: "Report a problem", onclick: () => dialog.showModal() }, "🐞 Something's wrong");
  document.body.append(button, dialog);
  return { show: () => (button.hidden = false), hide: () => (button.hidden = true) };
}
