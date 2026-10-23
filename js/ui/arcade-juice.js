// A little life for every Arcade game (teacher request 2026-10-23). The games
// all show a result line (.mg-flash) that turns good or bad. This watches it and
// pulses the cabinet on a right answer and shakes it on a wrong one, with no
// change to the games themselves. Stops under Calm motion.
export function watchJuice(frame) {
  if (!frame || typeof MutationObserver === "undefined") return;
  const flash = frame.querySelector(".mg-flash");
  if (!flash) return;
  let last = "";
  const react = () => {
    const kind = flash.classList.contains("good") ? "good" : flash.classList.contains("bad") ? "bad" : "";
    const text = flash.textContent;
    if (!kind || !text || text === last) return;
    last = text;
    frame.classList.remove("hit-good", "hit-bad");
    void frame.offsetWidth;
    frame.classList.add(`hit-${kind}`);
    setTimeout(() => frame.classList.remove(`hit-${kind}`), 600);
  };
  new MutationObserver(react).observe(flash, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
}
