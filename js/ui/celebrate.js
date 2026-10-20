// Full-screen "you unlocked something" pop-ups, one at a time, each dismissed
// with Continue or Escape. Used for achievements, rank-ups and new chapters.
import { h } from "./dom.js";
import { track } from "../telemetry.js";

const queue = [];
let open = false;

// More than this many at once (like a student's first trip to the hub) folds
// the rest into one summary pop-up.
const MAX_IN_A_ROW = 3;

// item = { kind, icon, kicker, title, text, xp }
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
  const cont = h("button.big", { type: "button" }, "Continue");
  const dialog = h(
    "dialog.celebrate",
    { "aria-labelledby": "celebrate-title", "aria-describedby": "celebrate-text" },
    h("div.celebrate-rays", { "aria-hidden": "true" }),
    h(
      "div.celebrate-body",
      h("div.celebrate-icon", { "aria-hidden": "true" }, item.icon),
      h("p.celebrate-kicker", item.kicker),
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
  cont.focus();
  track("celebrateShown", { kind: item.kind, id: item.id || "" });
}
