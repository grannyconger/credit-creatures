// The Mossy Bestiary's small drawn pieces (2026-10-21 redesign, adoption
// screen first): pins, tape, string tags, fern fronds, moss, a wax seal and an
// ink stamp. All inline SVG colored with the --b-* tokens in css/tokens.css,
// so light, dark and dyslexia modes keep working. Shapes come from a fixed
// seed, so every drawing is the same on every visit.

// Small seeded random numbers (mulberry32), so moss clumps don't jump around.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => n.toFixed(1);

// A brass dressmaker's pin seen from above, with its shadow.
export function pinSvg() {
  return `<svg class="bst-pin" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <ellipse cx="13.5" cy="15" rx="6" ry="3.4" fill="var(--b-shadow-ink)" opacity="0.35"/>
    <circle cx="11" cy="11" r="6.5" fill="var(--b-pin)"/>
    <circle cx="11" cy="11" r="6.5" fill="none" stroke="var(--b-pin-edge)" stroke-width="1.2"/>
    <circle cx="8.8" cy="8.6" r="2" fill="var(--b-pin-shine)" opacity="0.85"/>
  </svg>`;
}

// A torn strip of paper tape.
export function tapeSvg(seed = 1) {
  const r = rng(seed);
  const teeth = (x, dir) =>
    Array.from({ length: 6 }, (_, i) => `${f(x + dir * (r() * 2.2))},${f((i / 5) * 18)}`).join(" ");
  return `<svg class="bst-tape" viewBox="0 0 64 18" width="64" height="18" aria-hidden="true" focusable="false" preserveAspectRatio="none">
    <polygon points="${teeth(1.5, 1)} ${teeth(62.5, -1).split(" ").reverse().join(" ")}" fill="var(--b-tape)"/>
  </svg>`;
}

// The punched hole and loop of string on a luggage-style specimen tag.
export function stringSvg() {
  return `<svg class="bst-string" viewBox="0 0 40 46" width="40" height="46" aria-hidden="true" focusable="false">
    <path d="M20 44 C8 30 6 14 18 4 C30 -4 34 18 22 32" fill="none" stroke="var(--b-string)" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="20" cy="40" r="4.5" fill="var(--b-ground-deep)" stroke="var(--b-paper-edge)" stroke-width="1.5"/>
  </svg>`;
}

// One fern frond: leaflets along a curved stem, smaller toward the tip.
// curl bends the stem. Drawn in currentColor so CSS picks the green.
export function fernSvg({ seed = 3, leaves = 13, curl = 0.35, width = 120, height = 220, className = "" } = {}) {
  const r = rng(seed);
  const pt = (t) => {
    // Quadratic stem from the base (bottom middle) up and over.
    const x0 = 60, y0 = 218, x1 = 60 - 60 * curl, y1 = 110, x2 = 60 + 46 * curl, y2 = 8;
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
    const dx = 2 * (1 - t) * (x1 - x0) + 2 * t * (x2 - x1);
    const dy = 2 * (1 - t) * (y1 - y0) + 2 * t * (y2 - y1);
    return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI };
  };
  let stem = "M60 218";
  for (let i = 1; i <= 24; i++) {
    const p = pt(i / 24);
    stem += ` L${f(p.x)} ${f(p.y)}`;
  }
  const leaflets = [];
  for (let i = 0; i < leaves; i++) {
    const t = 0.12 + (i / leaves) * 0.84;
    const p = pt(t);
    const len = 34 * (1 - t * 0.78) + r() * 4;
    for (const side of [-1, 1]) {
      const ang = p.a + side * (62 + r() * 10);
      leaflets.push(
        `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(len / 2)}" ry="${f(len / 6.5)}" transform="rotate(${f(ang)} ${f(p.x)} ${f(p.y)}) translate(${f(len / 2)} 0)"/>`
      );
    }
  }
  return `<svg class="bst-fern ${className}" viewBox="0 0 120 220" width="${width}" height="${height}" aria-hidden="true" focusable="false">
    <g fill="currentColor">${leaflets.join("")}</g>
    <path d="${stem}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

// A low clump of moss: overlapping cushions in three greens, with a few
// fruiting stalks (the little lollipops moss actually grows).
export function mossSvg({ seed = 7, width = 320, height = 60, className = "" } = {}) {
  const r = rng(seed);
  const blobs = [];
  const n = Math.round(width / 9);
  for (let i = 0; i < n; i++) {
    const x = (i / n) * width + r() * 8;
    const rad = 6 + r() * 12;
    const y = height - rad * 0.55 + r() * 4;
    const tone = ["var(--b-moss-1)", "var(--b-moss-2)", "var(--b-moss-3)"][Math.floor(r() * 3)];
    blobs.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rad)}" ry="${f(rad * 0.72)}" fill="${tone}"/>`);
  }
  const stalks = [];
  for (let i = 0; i < Math.round(width / 40); i++) {
    const x = 10 + r() * (width - 20);
    const h = 12 + r() * 16;
    const lean = (r() - 0.5) * 8;
    stalks.push(
      `<path d="M${f(x)} ${height - 6} q${f(lean / 2)} ${f(-h / 2)} ${f(lean)} ${f(-h)}" stroke="var(--b-moss-stalk)" stroke-width="1.2" fill="none"/><ellipse cx="${f(x + lean)}" cy="${f(height - 6 - h)}" rx="1.6" ry="2.4" fill="var(--b-moss-stalk)"/>`
    );
  }
  return `<svg class="bst-moss ${className}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${stalks.join("")}${blobs.join("")}</svg>`;
}

// The shared watercolor filter: a ragged pigment edge with a little bloom.
// Put this once on the page, and watercolorSvg() drawings use it.
export function watercolorDefs() {
  return `<svg class="bst-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
    <filter id="bst-wc" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="4" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="7" result="edge"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.45 1.08" result="speckle"/>
      <feComposite in="edge" in2="speckle" operator="in"/>
    </filter>
  </svg>`;
}

// Three dabs of paint from one palette: body, belly and markings. Each dab is
// pale in the middle with a darker rim where the pigment dried, like a
// real watercolor sample card.
export function watercolorSvg(p, seed = 1) {
  const r = rng(seed);
  const blob = (cx, cy, rad) => {
    const N = 10;
    const pts = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2;
      const k = rad * (0.82 + r() * 0.3);
      return [cx + Math.cos(a) * k, cy + Math.sin(a) * k * 0.9];
    });
    const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
    let d = `M${f(mid(pts[N - 1], pts[0])[0])} ${f(mid(pts[N - 1], pts[0])[1])}`;
    for (let i = 0; i < N; i++) {
      const m = mid(pts[i], pts[(i + 1) % N]);
      d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
    }
    return d + " Z";
  };
  const dab = (color, cx, cy, rad) => {
    const d = blob(cx, cy, rad);
    return `<path d="${d}" fill="${color}" fill-opacity="0.82"/><path d="${d}" fill="${color}" fill-opacity="0.35" transform="translate(${f(cx * 0.06)} ${f(cy * 0.06)}) scale(0.94)"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.6"/>`;
  };
  return `<svg class="bst-wc" viewBox="0 0 64 60" width="64" height="60" aria-hidden="true" focusable="false"><g filter="url(#bst-wc)">
    ${dab(p.body, 24, 30, 19)}${dab(p.belly, 40, 40, 11)}${dab(p.accent, 43, 17, 8)}
  </g></svg>`;
}

// A wax seal: a lumpy disc, a pressed ring and a leaf, or a letter, in the middle.
export function sealSvg({ seed = 11, size = 84, letter = "" } = {}) {
  const r = rng(seed);
  const pts = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rad = 40 + (r() - 0.5) * 7;
    pts.push([50 + Math.cos(a) * rad, 50 + Math.sin(a) * rad]);
  }
  // Smooth the outline with quadratic curves through the midpoints.
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = `M${f(mid(pts[N - 1], pts[0])[0])} ${f(mid(pts[N - 1], pts[0])[1])}`;
  for (let i = 0; i < N; i++) {
    const m = mid(pts[i], pts[(i + 1) % N]);
    d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `<svg class="bst-seal" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">
    <path d="${d}" fill="var(--b-shadow-ink)" transform="translate(2 3)" opacity="0.35"/>
    <path d="${d}" fill="var(--b-rust)"/>
    <circle cx="50" cy="50" r="27" fill="none" stroke="var(--b-seal-deep)" stroke-width="3"/>
    <circle cx="50" cy="50" r="27" fill="none" stroke="var(--b-seal-shine)" stroke-width="1" transform="translate(-1 -1)" opacity="0.6"/>
    ${letter
      ? `<text x="50" y="62" text-anchor="middle" style="font-family: var(--b-display)" font-size="36" fill="var(--b-seal-deep)">${letter}</text><text x="49" y="61" text-anchor="middle" style="font-family: var(--b-display)" font-size="36" fill="var(--b-seal-shine)" opacity="0.35">${letter}</text>`
      : `<path d="M36 64 C34 46 46 34 64 34 C66 52 54 64 36 64 Z" fill="none" stroke="var(--b-seal-deep)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 68 L58 40 M44 56 l-1 -8 M44 56 l8 1 M51 48 l-1 -7 M51 48 l7 1" fill="none" stroke="var(--b-seal-deep)" stroke-width="2.4" stroke-linecap="round"/>`}
    <ellipse cx="38" cy="30" rx="9" ry="4" fill="var(--b-seal-shine)" opacity="0.35" transform="rotate(-30 38 30)"/>
  </svg>`;
}

// A rubber stamp mark with uneven ink (a displacement filter roughs it up).
export function inkStampSvg(text, { seed = 5 } = {}) {
  const id = `bst-rough-${seed}`;
  return `<svg class="bst-stamp" viewBox="0 0 220 90" width="220" height="90" aria-hidden="true" focusable="false">
    <defs><filter id="${id}" x="-5%" y="-10%" width="110%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5"/>
      <feComponentTransfer><feFuncA type="discrete" tableValues="0 1 1 1 0.85 1"/></feComponentTransfer>
    </filter></defs>
    <g filter="url(#${id})" fill="none" stroke="currentColor">
      <rect x="6" y="6" width="208" height="78" rx="8" stroke-width="4"/>
      <rect x="13" y="13" width="194" height="64" rx="5" stroke-width="1.6"/>
      <text x="110" y="58" text-anchor="middle" fill="currentColor" stroke="none" font-family="var(--b-display)" font-size="36" letter-spacing="2">${text}</text>
    </g>
  </svg>`;
}

// A hand-drawn ring, used to circle the chosen option the way a naturalist
// circles an answer in the margin.
export function inkRingSvg(seed = 2) {
  const r = rng(seed);
  const wob = () => f((r() - 0.5) * 6);
  return `<svg class="bst-ring" viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M14 ${24 + +wob()} C12 6 ${100 + +wob()} 2 110 18 C118 34 ${70 + +wob()} 44 30 40 C10 38 4 28 20 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
}

// A wooden clothes peg, for things hung on a string line.
export function pegSvg() {
  return `<svg class="bst-peg" viewBox="0 0 16 40" width="16" height="40" aria-hidden="true" focusable="false">
    <rect x="3" y="1" width="10" height="38" rx="3" fill="var(--b-peg)"/>
    <path d="M8 4v32" stroke="var(--b-peg-line)" stroke-width="1.2"/>
    <rect x="2" y="14" width="12" height="5" rx="1.5" fill="var(--b-pin)" stroke="var(--b-pin-edge)" stroke-width="0.8"/>
  </svg>`;
}

// The string line itself, with a little sag.
export function lineSvg() {
  return `<svg class="bst-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M0 8 Q500 44 1000 8" fill="none" stroke="var(--b-string)" stroke-width="2.2" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

// The Garage's rides, drawn in ink (2026-10-23), in place of emoji. Lines in
// currentColor, with the wheels filled in the paper color so they read as
// solid. id is a ride id from js/data/garage.js.
const RIDES = {
  bike: '<circle class="wheel" cx="38" cy="62" r="20"/><circle class="wheel" cx="122" cy="62" r="20"/><path d="M38 62 L76 62 L66 30 Z M76 62 L108 32 L66 30 M108 32 L122 62"/><path d="M58 26 h16 M108 32 L104 20 M98 20 h12"/><circle cx="76" cy="62" r="4"/>',
  moped: '<circle class="wheel" cx="36" cy="66" r="14"/><circle class="wheel" cx="126" cy="66" r="14"/><path d="M18 60 C18 46 34 40 54 44 L96 46 C100 40 104 34 108 28 M52 66 H98 C98 56 100 50 104 44 M108 28 L126 66"/><path d="M50 40 C56 32 72 32 78 40 M102 20 h14 M108 28 L106 20"/><circle cx="114" cy="34" r="3"/>',
  car: '<path d="M14 64 V52 C14 46 20 44 28 44 L46 42 L62 26 H104 L122 42 L140 46 C146 47 148 52 148 58 V64 M14 64 H30 M60 64 H104 M132 64 H148"/><path d="M58 42 L68 30 H84 V42 Z M90 30 H102 L114 42 H90 Z M88 46 V60"/><circle class="wheel" cx="45" cy="66" r="13"/><circle class="wheel" cx="118" cy="66" r="13"/>',
  newCar: '<path d="M8 62 V54 C8 50 14 48 22 48 L56 44 C66 34 80 30 96 30 C112 30 124 36 132 44 L150 48 C154 49 156 53 156 58 V62 M8 62 H28 M58 62 H110 M140 62 H156"/><path d="M64 44 C72 36 84 34 96 34 C106 34 114 38 120 44 Z M8 48 L4 40 H18"/><path class="shine" d="M122 10 v10 M117 15 h10 M142 20 v7 M138.5 23.5 h7"/><circle class="wheel" cx="43" cy="64" r="13"/><circle class="wheel" cx="125" cy="64" r="13"/>',
};
export function rideSvg(id, { width = 160 } = {}) {
  const body = RIDES[id] || RIDES.car;
  return `<svg class="bst-ride" viewBox="0 0 160 90" width="${width}" height="${Math.round((width * 90) / 160)}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
