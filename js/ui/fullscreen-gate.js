// Desktop students play in fullscreen (teacher request 2026-10-29). When the page isn't
// fullscreen, a pop-up covers the game and blocks it until a button puts it back. Phones
// and tablets are left alone, and so is a browser with no fullscreen support. Pressing F11
// counts too. The local test mode (?local) and ?nofs skip it so tests and screenshots run.
import { h } from "./dom.js";
import { icon } from "./icons.js";

const MIN_WIDTH = 900;

export function isFullscreen() {
  if (document.fullscreenElement) return true;
  // F11 in the browser: the page fills the whole screen.
  return Math.abs(innerWidth - screen.width) <= 2 && Math.abs(innerHeight - screen.height) <= 2;
}

// A real computer: a mouse, a wide window and a browser that can do fullscreen.
function applies() {
  return Boolean(document.documentElement.requestFullscreen) && matchMedia("(pointer: fine)").matches && screen.width >= MIN_WIDTH;
}

export function initFullscreenGate({ skip = false, track = () => {} } = {}) {
  if (skip || !applies()) return { active: false };
  let gate = null;
  const button = h("button.big", { type: "button" }, icon("play", { size: 20 }), " Go fullscreen");
  const build = () =>
    h(
      "dialog.fs-gate.bst-scope",
      { "aria-labelledby": "fs-title" },
      h("h2", { id: "fs-title" }, "Play in fullscreen"),
      h("p", "Credit Creatures plays in fullscreen so the whole game fits on your screen and you can stay focused."),
      h("p.note.tight", "If you leave fullscreen, the game stops until you come back."),
      h("div.row", button)
    );
  const show = () => {
    if (gate?.open) return;
    gate = gate || build();
    if (!gate.isConnected) document.body.append(gate);
    // Escape closes a dialog by default. Here it must not.
    gate.oncancel = (e) => e.preventDefault();
    gate.showModal();
    button.focus();
    track("fullscreenGate", { shown: true });
  };
  const check = () => (isFullscreen() ? gate?.open && (gate.close(), track("fullscreenGate", { shown: false })) : show());
  button.addEventListener("click", () => document.documentElement.requestFullscreen().catch(() => {}));
  document.addEventListener("fullscreenchange", check);
  addEventListener("resize", check);
  // Anything that opens a pop-up after this one sits above it, so keep checking.
  setInterval(check, 1500);
  check();
  return { active: true };
}
