// The Kingdom of Coinhaven as the naturalist surveyed it (Mossy Bestiary,
// 2026-10-22): an ink-and-watercolor field map. Same contract as the old
// js/ui/kingdom-map.js. Every place (js/places.js) sits at its x/y percent,
// the art is one SVG, and the places are real buttons laid over it, so they
// work with a keyboard and a screen reader. Colors are the --m-* tokens in
// css/tokens.css, so dark mode turns it into the same map by lamplight.
// Every building is drawn twice: a watercolor wash a little off-register,
// then the ink line on top, the way a field sketch is painted.
import { h } from "./dom.js";
import { icon } from "./icons.js";
import { creatureSvg } from "./creature-art.js";
import { PLACES } from "../places.js";

const W = 1000;
const H = 600;
const at = (p) => ({ x: (p.x / 100) * W, y: (p.y / 100) * H });
const f = (n) => Number(n.toFixed(1));

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

// Drawing helpers. wash() is paint, ink() is the pen line, both() is both.
const R = (x, y, w, hgt) => `M${x} ${y}h${w}v${hgt}h${-w}Z`;
const ink = (d, w = 2) => `<path d="${d}" fill="none" stroke="var(--m-ink)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const wash = (d, c) => `<path class="m-w" d="${d}" fill="${c}" transform="translate(2.5 2)" filter="url(#m-wash)"/>`;
const both = (d, c, w = 2) => wash(d, c) + ink(d, w);
const hatch = (x1, y1, x2, y2, n, dx, dy) =>
  Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    return `M${f(x)} ${f(y)} l${dx} ${dy}`;
  }).join(" ");
const win = (x, y, w = 14, hgt = 16) => `<path class="m-win" d="${R(x, y, w, hgt)}" stroke="var(--m-ink)" stroke-width="1.6"/>` + ink(`M${x + w / 2} ${y} v${hgt} M${x} ${y + hgt / 2} h${w}`, 1);
const door = (x, y, w, hgt) => both(`M${x} ${y + hgt} v${-(hgt - w / 2)} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${hgt - w / 2}`, "var(--m-door)");

const BUILDINGS = {
  townhall: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${both(R(-78, -40, 156, 76), "var(--m-stone)")}
      ${both("M-90 -40 L0 -96 L90 -40 Z", "var(--m-roof-plum)")}
      ${ink(hatch(-70, -46, 70, -46, 14, 6, -10), 1)}
      ${both("M0 -76 a14 14 0 1 0 0.1 0", "var(--m-paper)")}
      ${ink("M0 -62 v-9 M0 -62 l7 4", 2)}
      ${ink("M0 -96 v-30", 2.2)}<g class="m-flag">${both("M0 -126 l26 7 -26 7z", "var(--m-roof-rust)", 1.6)}</g>
      ${ink([-58, -30, 30, 58].map((c) => `M${c - 4} -32 v62 M${c + 4} -32 v62`).join(" "), 1.4)}
      ${door(-14, 6, 28, 30)}
      ${ink("M-86 36 H86 M-80 42 H80", 2)}
    </g>`,
  vault: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${both(R(-64, -34, 128, 68), "var(--m-stone)")}
      ${both("M-72 -34 L0 -70 L72 -34 Z", "var(--m-paper)")}
      ${both("M-26 -70 a26 20 0 0 1 52 0 Z", "var(--m-gold)")}
      ${ink("M0 -90 v-8 M-14 -72 q14 -14 28 0", 1.4)}
      ${both("M0 -46 a8 8 0 1 0 0.1 0", "var(--m-gold)", 1.4)}
      <text x="0" y="-33" text-anchor="middle" font-size="11" fill="var(--m-ink)" style="font-family: var(--b-display)">$</text>
      ${ink([-48, -24, 24, 48].map((c) => `M${c - 4} -28 v58 M${c + 4} -28 v58`).join(" "), 1.4)}
      ${both(R(-13, 2, 26, 32), "var(--m-door)")}${ink("M0 18 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0", 1.6)}
      ${ink("M-72 34 H72 M-66 40 H66", 2)}
    </g>`,
  // The Arcade wears its own neon (css/arcade.css), inked like the rest of the map.
  guild: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${both(R(-64, -48, 128, 84), "var(--arc-floor-2)")}
      <path d="${R(-64, -48, 128, 84)}" fill="none" stroke="var(--arc-pink)" stroke-width="3" opacity=".9"/>
      ${both("M-72 -48 H72 L62 -72 H-62 Z", "var(--arc-panel)")}
      <path d="M-50 -63 H50" stroke="var(--arc-yellow)" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>
      <g class="m-neon"><rect x="-46" y="-44" width="92" height="22" rx="4" style="fill:var(--arc-dark-ink);stroke:var(--arc-pink);stroke-width:2.5"/><text x="0" y="-27" text-anchor="middle" font-size="16" font-weight="900" letter-spacing="3" font-family="Arial Black, Trebuchet MS, sans-serif" style="fill:var(--arc-pink)">ARCADE</text></g>
      <g transform="translate(-44 -10)"><rect x="0" y="0" width="22" height="46" rx="3" style="fill:var(--arc-cyan);stroke:var(--m-ink);stroke-width:1.6"/><rect x="3" y="4" width="16" height="14" style="fill:var(--arc-dark-ink)"/><circle cx="8" cy="26" r="2.4" style="fill:var(--arc-pink)"/><circle cx="15" cy="26" r="2.4" style="fill:var(--arc-yellow)"/></g>
      <g transform="translate(22 -10)"><rect x="0" y="0" width="22" height="46" rx="3" style="fill:var(--arc-orange);stroke:var(--m-ink);stroke-width:1.6"/><rect x="3" y="4" width="16" height="14" style="fill:var(--arc-dark-ink)"/><circle cx="8" cy="26" r="2.4" style="fill:var(--arc-green)"/><circle cx="15" cy="26" r="2.4" style="fill:var(--arc-pink)"/></g>
      ${door(-13, 4, 26, 32)}
      <path d="M-13 36 v-26 a13 13 0 0 1 26 0 v26" style="fill:var(--arc-dark-ink);opacity:.85"/>
      ${ink("M-76 36 H76", 2)}
    </g>`,
  market: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${[-46, 46]
        .map(
          (cx, i) => `
        ${both(R(cx - 38, -14, 76, 44), "var(--m-wall)")}
        ${ink(`M${cx - 32} 8 H${cx + 32}`, 1.6)}
        ${[0, 1, 2].map((k) => both(`M${cx - 18 + k * 18} -6 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0`, ["var(--m-roof-rust)", "var(--m-gold)", "var(--m-roof-moss)"][(k + i) % 3], 1.4)).join("")}
        ${both(`M${cx - 46} -14 L${cx - 38} -42 H${cx + 38} L${cx + 46} -14 Z`, i ? "var(--m-roof-slate)" : "var(--m-roof-rust)")}
        ${ink([0, 1, 2, 3].map((k) => `M${cx - 30 + k * 20} -42 l-4 28`).join(" "), 1.4)}`
        )
        .join("")}
      ${ink("M-92 30 H92", 2)}
    </g>`,
  // home: Cottage upgrades bought in Chapter 2 (js/data/garage.js) show here.
  cottage: ({ x, y }, home = []) => `
    <g transform="translate(${x} ${y})">
      ${home.includes("workshop") ? `<g transform="translate(-94 8)">${both(R(-26, -18, 52, 40), "var(--m-wall)")}${both("M-32 -16 L0 -38 L32 -16 Z", "var(--m-roof-rust)")}${both(R(-9, 2, 18, 20), "var(--m-door)")}${ink("M-20 -8 l6 -6 m0 6 l-6 -6", 1.6)}</g>` : ""}
      ${both(R(22, -74, 14, 30), "var(--m-stone)")}
      <path class="m-smoke" d="M29 -78 q-8 -8 0 -15 q8 -7 1 -15" fill="none" stroke="var(--m-smoke)" stroke-width="3.5" stroke-linecap="round"/>
      ${both(R(-50, -28, 100, 62), "var(--m-wall)")}
      ${both("M-62 -26 Q-40 -76 0 -80 Q40 -76 62 -26 Z", home.includes("roof") ? "var(--m-gold)" : "var(--m-roof-moss)")}
      ${ink("M-48 -36 Q0 -66 48 -36 M-40 -48 Q0 -74 40 -48", 1)}
      ${win(-38, -12, 18, 18)}${win(20, -12, 18, 18)}
      ${door(-12, 6, 24, 28)}
      ${home.includes("garden") ? `<g transform="translate(72 26)">${both(R(-22, -6, 44, 14), "var(--m-door)", 1.6)}${[-14, -4, 6, 16].map((cx, i) => both(`M${cx} -10 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0`, ["var(--m-roof-rust)", "var(--m-roof-moss)", "var(--m-roof-plum)", "var(--m-roof-moss)"][i], 1.2)).join("")}</g>` : ""}
      ${home.includes("rug") ? both("M-22 40 a22 5 0 1 0 44 0 a22 5 0 1 0 -44 0", "var(--m-roof-plum)", 1.4) : ""}
      ${[-42, -30, 30, 42].map((cx) => both(`M${cx} 38 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0`, cx < 0 ? "var(--m-roof-plum)" : "var(--m-gold)", 1.2)).join("")}
      ${ink("M-64 36 H64", 2)}
    </g>`,
  plaza: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${both("M-92 22 a92 22 0 1 0 184 0 a92 22 0 1 0 -184 0", "var(--m-stone)", 1.6)}
      ${both("M-46 12 a46 14 0 1 0 92 0 a46 14 0 1 0 -92 0", "var(--m-paper)")}
      ${wash("M-38 8 a38 9 0 1 0 76 0 a38 9 0 1 0 -76 0", "var(--m-water)")}
      ${both(R(-6, -30, 12, 38), "var(--m-stone)")}
      ${ink("M0 -30 q-18 -10 -26 10 M0 -30 q18 -10 26 10 M0 -32 v-12", 2.4)}
      ${ink("M-92 -54 Q0 -30 92 -54", 1.4)}
      ${[-70, -42, -14, 14, 42, 70].map((cx, i) => `<g class="m-pennant" style="animation-delay: ${-i * 0.35}s">${both(`M${cx - 8} ${f(-48 + Math.abs(cx) / 9)} l8 14 8 -14z`, ["var(--m-roof-rust)", "var(--m-gold)", "var(--m-roof-slate)", "var(--m-roof-moss)", "var(--m-roof-plum)", "var(--m-gold)"][i], 1.2)}</g>`).join("")}
      <g class="m-splash">${[-7, 0, 7].map((dx, i) => `<circle cx="${dx}" cy="-36" r="2.2" fill="var(--m-water)" stroke="var(--m-ink)" stroke-width="0.6" style="animation-delay: ${i * 0.4}s"/>`).join("")}</g>
      ${ink("M-86 12 h24 M62 12 h24", 3)}
    </g>`,
  garage: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${both(R(-54, -30, 108, 60), "var(--m-wall)")}
      ${both("M-62 -28 L0 -62 L62 -28 Z", "var(--m-roof-rust)")}
      ${both(R(-36, -14, 72, 44), "var(--m-stone)")}
      ${ink([-4, 6, 16].map((dy) => `M-34 ${dy} H34`).join(" "), 1.2)}
      <g transform="translate(0 -40)">${both("M0 -10 a10 10 0 1 0 0.1 0", "var(--m-gold)", 1.6)}${ink("M-6 3 h12 l-2 -5 h-8z", 1.4)}</g>
      ${ink("M-62 30 H62", 2)}
    </g>`,
  records: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${both(R(-46, -36, 92, 70), "var(--m-stone)")}
      ${both("M-50 -36 Q0 -86 50 -36 Z", "var(--m-roof-slate)")}
      ${ink("M-34 -44 Q0 -74 34 -44", 1)}
      ${ink([-32, -12, 12, 32].map((c) => `M${c - 3} -28 v56 M${c + 3} -28 v56`).join(" "), 1.3)}
      ${both("M-14 -58 q14 -8 14 0 q0 -8 14 0 v14 q-14 -8 -14 0 q0 -8 -14 0z", "var(--m-paper)", 1.6)}
      ${both(R(-11, 4, 22, 30), "var(--m-door)")}
      ${ink("M-54 34 H54", 2)}
    </g>`,
  // Lantern Alley (Chapter 5): two crooked, narrow shops with loud signs and
  // paper lanterns strung between them.
  alley: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      <g transform="rotate(-4)">${both(R(-58, -44, 46, 80), "var(--m-wall)")}${both("M-64 -42 L-35 -74 L-6 -42 Z", "var(--m-roof-plum)")}${win(-48, -30, 12, 14)}${both(R(-46, 6, 22, 30), "var(--m-door)")}</g>
      <g transform="rotate(5)">${both(R(12, -36, 46, 72), "var(--m-stone)")}${both("M6 -34 L35 -64 L64 -34 Z", "var(--m-roof-plum)")}${win(40, -24, 12, 14)}${both(R(22, 8, 22, 28), "var(--m-door)")}</g>
      <g transform="rotate(-8 -35 -7)">${both(R(-54, -14, 38, 14), "var(--m-gold)", 1.4)}<text x="-35" y="-3" text-anchor="middle" font-size="10" fill="var(--m-ink)" style="font-family: var(--b-display)">$$$!</text></g>
      ${both(R(14, -12, 40, 12), "var(--m-roof-rust)", 1.4)}<text x="34" y="-2" text-anchor="middle" font-size="9" fill="var(--m-paper)" style="font-family: var(--b-display)">0%*</text>
      ${ink("M-20 -50 Q0 -36 20 -46", 1.2)}
      ${[[-12, -44, "var(--m-gold)"], [0, -41, "var(--m-roof-rust)"], [12, -43, "var(--m-gold)"]].map(([cx, cy, c]) => `<g class="m-lantern">${ink(`M${cx} ${cy} v3`, 1)}${both(`M${cx - 5} ${cy + 9} a5 6.5 0 1 0 10 0 a5 6.5 0 1 0 -10 0`, c, 1.2)}</g>`).join("")}
    </g>`,
  // The Battle Arena (2026-10-26): a round stone ring with arches, a sand
  // floor inside and two pennants on poles.
  arena: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${both("M-62 6 a62 22 0 1 0 124 0 V-18 a62 22 0 1 0 -124 0 Z", "var(--m-stone)")}
      ${both("M-62 -18 a62 22 0 1 0 124 0 a62 22 0 1 0 -124 0", "var(--m-wall)", 1.6)}
      ${wash("M-44 -16 a44 13 0 1 0 88 0 a44 13 0 1 0 -88 0", "var(--m-gold)")}
      ${ink("M-44 -16 a44 13 0 1 0 88 0 a44 13 0 1 0 -88 0", 1.2)}
      ${[-46, -24, 0, 24, 46].map((cx) => both(`M${cx - 7} 22 v-14 a7 7 0 0 1 14 0 v14 Z`, "var(--m-door)", 1.3)).join("")}
      ${ink("M-14 -20 l10 6 M14 -20 l-10 6", 2)}
      ${[-58, 58].map((cx, i) => `${ink(`M${cx} -14 v-46`, 2)}<g class="m-flag">${both(`M${cx} -60 l${i ? -20 : 20} 6 ${i ? 20 : -20} 6z`, i ? "var(--m-roof-plum)" : "var(--m-roof-rust)", 1.3)}</g>`).join("")}
      ${ink("M-68 30 H68", 2)}
    </g>`,
  academy: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${both(R(-56, -30, 112, 66), "var(--m-stone)")}
      ${both(R(-20, -96, 40, 70), "var(--m-paper)")}
      ${both("M-28 -94 L0 -138 L28 -94 Z", "var(--m-roof-slate)")}
      ${ink(hatch(-20, -100, 20, -100, 6, 4, -12), 1)}
      ${win(-7, -78, 14, 20)}
      ${both("M-64 -28 L-30 -52 H30 L64 -28 Z", "var(--m-roof-slate)")}
      ${win(-46, -12)}${win(32, -12)}
      ${door(-12, 6, 24, 30)}
      ${ink("M0 -138 v-14", 1.6)}<g class="m-flag">${both("M0 -152 l16 5 -16 5z", "var(--m-roof-rust)", 1.2)}</g>
      ${ink("M-66 36 H66", 2)}
    </g>`,
};

// Little map trees and hill marks, scattered where nothing else is.
function terrain(paths, places) {
  const r = rng(41);
  const busy = [...places.map((p) => [p.x, p.y, 105]), [857, 485, 150], ...paths.flatMap((pts) => pts.map(([x, y]) => [x, y, 26]))];
  const free = (x, y, pad = 0) => busy.every(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 > (br + pad) ** 2);
  const trees = [];
  for (let i = 0; i < 400 && trees.length < 18; i++) {
    // Keep the middle of the map clear: trees grow near the edges only.
    const x = r() < 0.5 ? 20 + r() * 150 : 830 + r() * 150;
    const y = 120 + r() * 380;
    if (!free(x, y)) continue;
    busy.push([x, y, 14]);
    const s = 0.7 + r() * 0.5;
    trees.push(
      `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${ink("M0 4 v12", 1.6)}${both("M-11 4 q-4 -14 11 -20 q15 6 11 20 z", r() > 0.5 ? "var(--m-tree)" : "var(--m-tree-2)", 1.5)}</g>`
    );
  }
  // Hill marks along the top, the old cartographer's little humps.
  const hills = [];
  for (let x = 60; x < 980; x += 150 + r() * 40) {
    const y = 96 + r() * 26;
    if (!free(x + 20, y, -40)) continue;
    const w = 34 + r() * 18;
    hills.push(ink(`M${f(x)} ${f(y)} q${f(w / 2)} ${f(-w * 0.7)} ${f(w)} 0`, 1.3));
  }
  return hills.join("") + trees.join("");
}

// calm: the full-page map (teacher request 2026-10-22: "the map is too busy")
// leaves out the trees and hill marks so only the places and paths remain.
function scene(creature, ageMonths, status = {}, home = [], guardian = "", calm = false) {
  const locked = (id) => status[id]?.tone === "locked";
  const p = Object.fromEntries(PLACES.map((pl) => [pl.id, at(pl)]));
  const cot = p.cottage;
  const ctrl = (q) => [(cot.x + q.x) / 2, Math.max(cot.y, q.y) + 70];
  const pathTo = (q) => `M${cot.x} ${cot.y + 40} Q${ctrl(q)[0]} ${ctrl(q)[1]} ${q.x} ${q.y + 44}`;
  const samples = (q) => {
    const [cx, cy] = ctrl(q);
    return Array.from({ length: 18 }, (_, i) => {
      const t = i / 17;
      return [(1 - t) ** 2 * cot.x + 2 * (1 - t) * t * cx + t * t * q.x, (1 - t) ** 2 * (cot.y + 40) + 2 * (1 - t) * t * cy + t * t * (q.y + 44)];
    });
  };
  const others = PLACES.filter((pl) => pl.id !== "cottage");
  const critter = creatureSvg(creature, { size: 96, ageMonths, label: "" }).replace("<svg ", `<svg x="${cot.x + 50}" y="${cot.y - 52}" `);
  return `<svg class="bst-map-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <filter id="m-wash" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="6" result="warp"/>
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="5"/>
      </filter>
    </defs>
    <!-- The sea along the south edge, with inked banks and little wave marks. -->
    ${wash("M0 572 Q250 548 500 578 T1000 566 V600 H0 Z", "var(--m-water)")}
    ${ink("M0 572 Q250 548 500 578 T1000 566", 2)}
    <!-- Paths: dotted ink trails from the Cottage. Unopened ones are fainter. -->
    ${others.filter((pl) => !locked(pl.id)).map((pl) => `<path d="${pathTo(p[pl.id])}" fill="none" stroke="var(--m-path)" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 11" opacity="0.6"/>`).join("")}
    ${calm ? "" : terrain(others.map((pl) => samples(p[pl.id])), Object.values(p))}
    <!-- The title cartouche, in the open corner at the bottom right so it never
         sits on a building (2026-10-22). -->
    <g transform="translate(745 458) scale(0.88)">
      ${both("M0 6 Q0 0 8 0 H262 Q270 0 270 6 V60 Q270 66 262 66 H8 Q0 66 0 60 Z", "var(--m-paper)", 1.6)}
      ${ink("M6 6 H264 V60 H6 Z", 0.8)}
      <text x="135" y="32" text-anchor="middle" font-size="26" fill="var(--m-ink)" style="font-family: var(--b-display)">Coinhaven</text>
      <text x="135" y="52" text-anchor="middle" font-size="14" font-style="italic" fill="var(--m-ink)" style="font-family: var(--b-body)">${guardian ? `surveyed for the Guardian of ${guardian}` : "a map of the kingdom"}</text>
    </g>
    ${PLACES.filter((pl) => !locked(pl.id)).map((pl) => BUILDINGS[pl.id](p[pl.id], home)).join("")}
    ${critter}
  </svg>`;
}

// status: placeStatus() result. onOpen(place) runs when a place is chosen.
export function kingdomMap({ creature, ageMonths, status, onOpen, home = [], calm = false }) {
  // Places that haven't opened yet stay off the map entirely (teacher request
  // 2026-10-22). They appear, with Sage's lesson, when they unlock.
  const open = PLACES.filter((pl) => status[pl.id]?.tone !== "locked");
  const placeButton = (pl, inList) => {
    const st = status[pl.id] || { text: "", tone: "calm" };
    return h(
      inList ? "button.place-row" : "button.place",
      {
        type: "button",
        class: `tone-${st.tone}`,
        "data-place": pl.id,
        style: inList ? null : { left: `${pl.x}%`, top: `${pl.y}%` },
        "aria-label": `${pl.name}, ${pl.kind}. ${pl.does}. ${st.text}`,
        onclick: () => onOpen(pl),
      },
      h("span.place-name", icon(pl.icon, { size: 18 }), h("span.place-label", h("span", pl.name), h("small.place-kind", pl.kind))),
      st.text ? h("span.place-badge", { "data-sparkle": st.tone === "action" && !inList ? "" : null }, st.tone === "warn" ? icon("alert", { size: 14 }) : st.tone === "action" ? icon("sparkle", { size: 14 }) : st.tone === "locked" ? icon("lock", { size: 14 }) : null, ` ${st.text}`) : null,
      inList ? h("small.place-does", pl.does) : null
    );
  };
  return h(
    "section.kingdom.bst-map",
    { "aria-label": "The Kingdom of Coinhaven" },
    h("div.kingdom-stage.bst-map-stage", { html: scene(creature, ageMonths, status, home, creature?.name || "", calm) }, open.map((pl) => placeButton(pl, false))),
    h("div.kingdom-list", open.map((pl) => placeButton(pl, true)))
  );
}
