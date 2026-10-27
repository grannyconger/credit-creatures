// Keeps a one-line bar (the top bar, the bottom bar) from running into itself.
// Dyslexia mode makes text and chips much wider, and laptops differ, so a fixed
// breakpoint can't know when the bar is full. This measures the bar instead and
// sets data-fit from 0 (everything shows) up to `levels`, one step at a time,
// until nothing overflows. The CSS for each step hides the least useful words
// first (layout audit, 2026-10-26).
export function fitBar(bar, levels = 3) {
  let queued = false;
  // Full means a child runs past the bar's padding (the browser doesn't count
  // that as overflow) or a child's own words spill out of it.
  const full = () => {
    if (bar.scrollWidth > bar.clientWidth + 1) return true;
    const cs = getComputedStyle(bar);
    const box = bar.getBoundingClientRect();
    const left = box.left + (parseFloat(cs.paddingLeft) || 0) - 1;
    const right = box.right - (parseFloat(cs.paddingRight) || 0) + 1;
    return [...bar.children].some((c) => {
      if (c.hidden || ["absolute", "fixed"].includes(getComputedStyle(c).position)) return false;
      const r = c.getBoundingClientRect();
      return r.width > 0 && (r.right > right || r.left < left || c.scrollWidth > c.clientWidth + 1);
    });
  };
  const fit = () => {
    queued = false;
    if (bar.hidden) return;
    let level = 0;
    bar.dataset.fit = "0";
    while (level < levels && full()) bar.dataset.fit = String(++level);
  };
  const later = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(fit);
  };
  new ResizeObserver(later).observe(bar);
  // New chips or words (a new chapter, a streak) can make it wider.
  new MutationObserver(later).observe(bar, { childList: true, subtree: true, characterData: true });
  addEventListener("cc:settings", later);
  document.fonts?.ready.then(later);
  later();
  return later;
}
