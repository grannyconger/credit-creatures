// Tiny DOM helpers. h("button.primary", { onclick }, "Go") builds elements.
export function h(tag, props = {}, ...children) {
  const [name, ...classes] = tag.split(".");
  const el = document.createElement(name || "div");
  if (classes.length) el.className = classes.join(" ");
  if (props == null || typeof props !== "object" || props instanceof Node || Array.isArray(props)) {
    children.unshift(props);
    props = {};
  }
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className += (el.className ? " " : "") + v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k in el && typeof v !== "string") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) {
  el.replaceChildren();
  return el;
}

export function money(x) {
  const v = Math.round(x * 100) / 100;
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
  return (v < 0 ? "-$" : "$") + s;
}

export function percent(x, digits = 0) {
  return (x * 100).toFixed(digits) + "%";
}

export function ageLabel(ageMonths) {
  const y = Math.floor(ageMonths / 12);
  const m = ageMonths % 12;
  return m ? `${y} years, ${m} month${m === 1 ? "" : "s"}` : `${y} years old`;
}

export function toast(message, kind = "info") {
  let box = document.getElementById("toasts");
  if (!box) {
    box = h("div.toasts", { id: "toasts", role: "status", "aria-live": "polite" });
    document.body.append(box);
  }
  const t = h("div.toast", { class: kind }, message);
  box.append(t);
  setTimeout(() => t.remove(), 4000);
}
