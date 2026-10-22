// Full-screen "you unlocked something" pop-ups, one at a time, each dismissed
// with Continue or Escape. Used for achievements, rank-ups and new chapters.
import { h } from "./dom.js";
import { track } from "../telemetry.js";
import { sfx } from "./sound.js";
import { confetti } from "./fx.js";
import { burstFrom } from "./motion/particles.js";
import { sealSvg, pinSvg } from "./bestiary-art.js";

const queue = [];
let open = false;

// More than this many at once (like a student's first trip to the hub) folds
// the rest into one summary pop-up.
const MAX_IN_A_ROW = 3;

// item = { kind, icon, kicker, title, text, xp }

// A new rank or a dream come true levels up, a bought Cottage upgrade or ride rings up the sale,
// and everything else (achievements, chapters, unlocks) is a quest complete.
const SOUND_FOR = { rank: "levelUp", dream: "levelUp", home: "purchase", ride: "purchase" };

export function celebrate(items) {
  const list = [].concat(items);
  if (list.length > MAX_IN_A_ROW) {
    const rest = list.slice(MAX_IN_A_ROW - 1);
    list.length = MAX_IN_A_ROW - 1;
    list.push({
      kind: "summary",
      icon: "🎉",
      kicker: "And there's more",
      title: `${rest.length} more unlocked!`,
      text: rest.map((r) => `${r.icon} ${r.title}`).join("  ·  "),
      xp: rest.reduce((s, r) => s + (r.xp || 0), 0),
    });
  }
  queue.push(...list);
  if (!open) next();
}

function next() {
  const item = queue.shift();
  if (!item) {
    open = false;
    return;
  }
  open = true;
  // A page of the Mossy Bestiary (2026-10-22): a record pinned on the moss,
  // the kicker thumps on as an ink stamp, and leaves fall instead of confetti.
  const cont = h("button.bst-seal-btn", { type: "button" }, h("span.bst-seal-wax", { html: sealSvg({ seed: 29, size: 76 }) }), h("span.bst-seal-text", "Continue"));
  const dialog = h(
    "dialog.celebrate.bst-scope.bst-celebrate",
    { "aria-labelledby": "celebrate-title", "aria-describedby": "celebrate-text" },
    h("div.celebrate-rays", { "aria-hidden": "true" }),
    confetti(),
    h(
      "div.celebrate-body",
      h("span.bst-attach", { "aria-hidden": "true", html: pinSvg() }),
      h("div.celebrate-icon", { "aria-hidden": "true", "data-sparkle": "" }, item.icon),
      h("p.celebrate-kicker.bst-stamp-word", item.kicker),
      h("h2", { id: "celebrate-title" }, item.title),
      item.text ? h("p", { id: "celebrate-text" }, item.text) : null,
      item.xp ? h("p.celebrate-xp", `+${item.xp} XP`) : null,
      h("div.row", cont)
    )
  );
  const close = () => {
    if (!dialog.open) return;
    dialog.close();
    dialog.remove();
    next();
  };
  cont.addEventListener("click", close);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  document.body.append(dialog);
  dialog.showModal();
  // Phase 16: leaves and seeds burst from the icon once the pop-up has sprung open.
  setTimeout(() => dialog.open && burstFrom(dialog.querySelector(".celebrate-icon"), "leaves"), 220);
  sfx[SOUND_FOR[item.kind] || "questComplete"]();
  cont.focus();
  track("celebrateShown", { kind: item.kind, id: item.id || "" });
}
