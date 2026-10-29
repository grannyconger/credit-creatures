// A near full-screen pop-up for a gift from CONFIG.grants (popup: { text, image }).
// Resolves when the student closes it.
import { h, money } from "./dom.js";
import { sfx } from "./sound.js";

export function showGiftPopup(popup, total) {
  return new Promise((resolve) => {
    const ok = h("button.big", { type: "button" }, "Thank you!");
    const dialog = h(
      "dialog.gift-popup.bst-scope",
      { role: "alertdialog", "aria-labelledby": "gift-title" },
      h("img", { src: popup.image, alt: "" }),
      h("div.gift-words", h("h2", { id: "gift-title" }, popup.text), h("p", `${money(total)} went into your checking.`), h("div.row", ok))
    );
    const close = () => (dialog.close(), dialog.remove(), resolve());
    ok.addEventListener("click", close);
    dialog.addEventListener("cancel", (e) => (e.preventDefault(), close()));
    document.body.append(dialog);
    dialog.showModal();
    sfx.chestOpen?.();
    ok.focus();
  });
}
