// One sentence per line (teacher request 2026-10-21): in paragraphs, list items,
// pop-ups and toasts, each new sentence starts on its own line. It's a plain
// line break, not a new paragraph, so pop-ups stay compact. It runs on
// whatever the game puts on screen, so new text gets it with no extra work.
// Buttons, headings, labels, the map and number chips are left alone.

const TEXT = "p, li, dd, .toast, .callout, .celebrate-text";
const SKIP = "button, label, select, option, input, textarea, h1, h2, h3, h4, svg, code, table, .kingdom, .money-chips, .step-label, .chip, .chip-group, .place-badge, .stage-text, .prologue-steps, .signin-title, .no-break, [contenteditable]";

// A sentence ends with . ! or ? (maybe a closing quote), then a space, then a
// capital letter, a digit or a dollar sign. Short abbreviations don't count.
const END = /([.!?]["”’')]*)\s+(?=["“‘(]?[A-Z0-9$])/g;
const ABBR = /(?:\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|No|Ch|e\.g|i\.e|a\.m|p\.m)|\b[A-Z])\.$/;

// The places in a string where a new sentence starts.
export function sentenceBreaks(text) {
  const cuts = [];
  for (const m of text.matchAll(END)) {
    const end = m.index + m[1].length;
    if (ABBR.test(text.slice(Math.max(0, end - 6), end))) continue;
    cuts.push([end, m.index + m[0].length]);
  }
  return cuts;
}

function splitNode(node) {
  const text = node.nodeValue;
  if (text.length < 8) return;
  const cuts = sentenceBreaks(text);
  if (!cuts.length) return;
  // A span keeps the pieces together, so this works inside flex rows too.
  const span = document.createElement("span");
  span.className = "sentences";
  let from = 0;
  for (const [end, next] of cuts) {
    span.append(text.slice(from, end), document.createElement("br"));
    from = next;
  }
  span.append(text.slice(from));
  node.replaceWith(span);
}

function textNodesIn(root) {
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n);
  return out;
}

function eligible(node) {
  const el = node.parentElement;
  if (!el || el.closest(SKIP) || !el.closest(TEXT)) return false;
  return !el.closest("span.sentences");
}

export function breakSentences(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (eligible(root)) splitNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  for (const n of textNodesIn(root)) if (eligible(n)) splitNode(n);
}

// Watches the page and breaks sentences in anything new.
export function watchSentences(target = document.body) {
  breakSentences(target);
  let pending = new Set();
  let queued = false;
  const flush = () => {
    queued = false;
    const roots = pending;
    pending = new Set();
    for (const r of roots) if (r.isConnected) breakSentences(r);
  };
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") pending.add(r.target);
      else for (const n of r.addedNodes) pending.add(n);
    }
    if (!queued && pending.size) {
      queued = true;
      queueMicrotask(flush);
    }
  });
  observer.observe(target, { childList: true, subtree: true, characterData: true });
  return observer;
}
