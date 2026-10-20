// Full-screen signature pad for Check Writer. Draw with a finger, pen or
// mouse, or tap "Type my signature" to use the full name in a cursive font.
// The drawing is shown on the check only and is never saved or sent.
import { h, add, fill } from "./dom.js";

// Resolves to { kind: "drawn" | "typed", image?: dataUrl, text?: string } or null if cancelled.
export function askSignature({ name, title = "Sign here" }) {
  return new Promise((resolve) => {
    const dialog = h("dialog.sig-dialog", { "aria-label": title });
    const canvas = h("canvas.sig-canvas", { "aria-label": "Signature area. Draw with your finger, pen or mouse." });
    const doneBtn = h("button.big", { type: "button", disabled: true }, "Done");
    let strokes = 0;
    let drawing = false;
    let ctx = null;

    const finish = (value) => {
      dialog.close();
      dialog.remove();
      resolve(value);
    };

    function size() {
      const r = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(r.width * scale);
      canvas.height = Math.round(r.height * scale);
      ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1d2b44";
      strokes = 0;
      doneBtn.disabled = true;
    }

    const point = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    canvas.addEventListener("pointerdown", (e) => {
      if (!canvas.width) size();
      drawing = true;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Some browsers refuse capture for pens or synthetic events. Drawing still works.
      }
      const [x, y] = point(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.1, y + 0.1);
      ctx.stroke();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const [x, y] = point(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    });
    const end = () => {
      if (!drawing) return;
      drawing = false;
      strokes++;
      doneBtn.disabled = false;
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);

    doneBtn.addEventListener("click", () => finish({ kind: "drawn", image: canvas.toDataURL("image/png") }));

    const drawPanel = h(
      "div.sig-draw",
      h("p.sig-help", "Draw your creature's signature on the line with your finger, a pen or the mouse."),
      h("div.sig-box", canvas, h("span.sig-line", { "aria-hidden": "true" }), h("span.sig-x", { "aria-hidden": "true" }, "✕")),
      h(
        "div.row",
        h("button.secondary", { type: "button", onclick: () => size() }, "Clear"),
        h("button.secondary", { type: "button", onclick: () => showTyped() }, "Type my signature instead"),
        doneBtn
      )
    );

    function showTyped() {
      fill(
        body,
        h("p.sig-help", "Your signature will be your creature's full name in script."),
        h("div.sig-typed", { "aria-label": `Signature: ${name}` }, name),
        h(
          "div.row",
          h("button.secondary", { type: "button", onclick: () => (fill(body, drawPanel), size()) }, "Draw it instead"),
          h("button.big", { type: "button", onclick: () => finish({ kind: "typed", text: name }) }, "Use this signature")
        )
      );
    }

    const body = h("div.sig-body", drawPanel);
    add(
      dialog,
      h("header.sig-head", h("h2", `✍️ ${title}`), h("button.secondary", { type: "button", onclick: () => finish(null) }, "Cancel")),
      body
    );
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      finish(null);
    });
    document.body.append(dialog);
    dialog.showModal();
    // Size the canvas after the dialog has its full-screen layout.
    requestAnimationFrame(() => size());
    window.addEventListener("resize", () => dialog.open && body.contains(canvas) && size(), { once: true });
  });
}

// What a signature looks like on the check.
export function signatureMark(sig) {
  if (!sig) return null;
  if (sig.kind === "drawn") return h("img.sig-img", { src: sig.image, alt: "Your signature" });
  return h("span.sig-script", sig.text);
}
