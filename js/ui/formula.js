// A small "Formula" box shown beside a math question so students begin to learn how to work
// it out (teacher request 2026-10-29). lines is an array of short strings: the first is the
// formula itself, the rest are the simple steps. Static words only, so it never gives an answer.
import { h } from "./dom.js";
import { icon } from "./icons.js";

export function formulaBox(lines) {
  if (!lines?.length) return null;
  const [rule, ...steps] = lines;
  return h(
    "aside.formula-box",
    { "aria-label": "Formula" },
    h("strong.formula-title", icon("gauge", { size: 16 }), " Formula"),
    h("p.formula-rule", rule),
    steps.length ? h("ol.formula-steps", steps.map((s) => h("li", s))) : null
  );
}
