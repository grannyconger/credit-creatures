// Credit Creatures icon set: matching line icons on a 24px grid with a 2px
// rounded stroke. They take the text color, so they work in every theme.
// icon(name) is decorative (hidden from screen readers). Pass { label } when
// the icon stands alone and needs a name.

const P = {
  castle: '<path d="M3 21h18M5 21V9l3 2V7l4-3 4 3v4l3-2v12"/><path d="M10 21v-5a2 2 0 0 1 4 0v5"/>',
  vault: '<path d="M3 10 12 4l9 6"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18"/>',
  coins: '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7"/><path d="M10 15.5c.9 1.2 3 2 5 2 2.8 0 5-1.1 5-2.5v-4c0-1.4-2.2-2.5-5-2.5"/>',
  guild: '<path d="m14 4 6 6-3 3-6-6z"/><path d="m11 7-7 7a2 2 0 0 0 3 3l7-7"/>',
  market: '<path d="M4 10h16l-1.5-5h-13z"/><path d="M5 10v10h14V10M10 20v-5h4v5"/><path d="M4 10a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/>',
  academy: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5M22 9v6"/>',
  townhall: '<path d="M3 21h18M5 21V11h14v10M4 11l8-6 8 6"/><path d="M12 2v3M10 21v-4h4v4M8 14v2M16 14v2"/>',
  plaza: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 19c0-3 2.2-5 5-5s5 2 5 5M11 19c0-3 2.2-5 5-5s5 2 5 5"/>',
  cottage: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/><path d="M16 6V3h2v4.5"/>',
  scroll: '<path d="M7 4h11a2 2 0 0 1 0 4H9"/><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M9 12h6M9 16h4"/>',
  flame: '<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
  chest: '<path d="M3 11a9 7 0 0 1 18 0v9H3z"/><path d="M3 13h18M12 12v4"/><rect x="10" y="14" width="4" height="4" rx="1"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  wallet: '<path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12"/><path d="M16 13.5h2"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/><circle cx="12" cy="17" r="1"/>',
  report: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
  statement: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  contactless: '<path d="M8 8a6 6 0 0 1 0 8M12 5a10 10 0 0 1 0 14M16 2.5a14 14 0 0 1 0 19"/>',
  energy: '<path d="M13 2 5 13.5h6L10 22l8-11.5h-6z"/>',
  sparkle: '<path d="M12 3c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.2.7 3.5 2.8 3.5 6"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18v3H3zM12 9v11"/><path d="M12 9C9 9 7 4 9.5 4S12 9 12 9s.5-5 2.5-5S15 9 12 9z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  shop: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  car: '<path d="M5 16h14M3 16v-3l2-5h14l2 5v3"/><path d="M5 8l1.5-3h11L19 8"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
  piggy: '<path d="M5 11a7 6 0 0 1 12-3h2l-1 3 2 1v3h-2l-2 3v2h-3v-2H9v2H6v-3a6 6 0 0 1-1-6z"/><circle cx="15" cy="11" r=".5"/><path d="M3 9.5c0 1 .8 1.5 2 1.5"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-.8-.5-1.2-.5-2s.7-1.5 1.5-1.5H17a4 4 0 0 0 4-4c0-5-4-9-9-9z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
  dream: '<path d="M12 3 9.5 9H3l5 4-2 7 6-4.5 6 4.5-2-7 5-4h-6.5z"/><path d="M12 3v13.5"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>',
  lantern: '<path d="M12 2v2M9 4h6"/><path d="M8 7h8l-1.2 11H9.2z"/><path d="M7 7h10M7 21h10M12 18v3"/><path d="M12 10.5c1 1 1 2.5 0 3.5-1-1-1-2.5 0-3.5z"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/>',
  bug: '<path d="M8 9a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0z"/><path d="M12 9v10M9 5.5 7.5 3.5M15 5.5l1.5-2M4 12h4M16 12h4M4.5 18l3.5-2M19.5 18 16 16M4.5 7l3.5 2M19.5 7 16 9"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  logout: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
};

export const ICON_NAMES = Object.keys(P);

// Every shape gets pathLength="1", so an icon can draw itself in with one
// stroke-dash animation (Phase 16), and data-ico names it for its own hover
// move in css/app.css (the gear spins, the lock shakes, and so on).
const drawable = (body) => body.replace(/<(path|circle|rect|line|polyline|polygon|ellipse)\b/g, '<$1 pathLength="1"');

export function iconSvg(name, { size = 20, label = "", draw = false } = {}) {
  const body = P[name];
  if (!body) throw new Error(`No icon named "${name}".`);
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, "&quot;")}"` : 'aria-hidden="true"';
  return `<svg class="ico${draw ? " ico-draw" : ""}" data-ico="${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" ${a11y}>${drawable(body)}</svg>`;
}

// Icons made in the moment after a screen opens draw themselves in
// (Phase 16). Repaints after that show them still, so nothing keeps flickering.
let drawUntil = 0;
export function drawIconsFor(ms = 700) {
  drawUntil = Date.now() + ms;
}

// For h(): icon("vault") gives a span holding the SVG.
export function icon(name, opts = {}) {
  const span = document.createElement("span");
  span.className = `ico-wrap${opts.className ? ` ${opts.className}` : ""}`;
  span.innerHTML = iconSvg(name, { draw: Date.now() < drawUntil, ...opts });
  return span;
}
