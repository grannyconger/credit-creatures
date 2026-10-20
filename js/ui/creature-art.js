// Original creature art as inline SVG, built from simple shapes and recolored
// by palette. Each species also gives anchor points for accessories.
import { SPECIES, PALETTES } from "../data/creatures.js";

const GOLD = "#f2c84b";
const GOLD_DARK = "#b98a17";
const INK = "#2b2340";

const SHAPES = {
  mossDragon: (p) => ({
    body: `
      <path d="M138 152 Q188 154 180 112 Q172 134 142 134 Z" fill="${p.body}"/>
      <path d="M72 108 Q34 66 54 124 Z" fill="${p.accent}"/>
      <path d="M128 108 Q166 66 146 124 Z" fill="${p.accent}"/>
      <ellipse cx="78" cy="181" rx="13" ry="7" fill="${p.accent}"/>
      <ellipse cx="122" cy="181" rx="13" ry="7" fill="${p.accent}"/>
      <ellipse cx="100" cy="142" rx="45" ry="41" fill="${p.body}"/>
      <ellipse cx="100" cy="152" rx="28" ry="27" fill="${p.belly}"/>
      <path d="M80 54 L74 32 L92 49 Z" fill="${p.accent}"/>
      <path d="M120 54 L126 32 L108 49 Z" fill="${p.accent}"/>
      <circle cx="100" cy="82" r="36" fill="${p.body}"/>
      <circle cx="86" cy="56" r="5" fill="${p.accent}"/>
      <circle cx="100" cy="51" r="4" fill="${p.accent}"/>
      <circle cx="114" cy="57" r="4.5" fill="${p.accent}"/>
      <ellipse cx="100" cy="98" rx="17" ry="11" fill="${p.belly}"/>
      <circle cx="94" cy="96" r="1.8" fill="${p.eye}"/>
      <circle cx="106" cy="96" r="1.8" fill="${p.eye}"/>
      <path d="M93 103 Q100 108 107 103" stroke="${p.eye}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    eyes: { lx: 86, rx: 114, y: 78, r: 6 },
    head: { x: 100, y: 48 },
    neck: { x: 100, y: 116, w: 52 },
    area: { cx: 100, cy: 142, rx: 45, ry: 41 },
    feet: [{ x: 78, y: 181 }, { x: 122, y: 181 }],
    noMouth: true,
  }),

  lanternFox: (p) => ({
    body: `
      <path d="M134 152 Q196 142 180 86 Q166 122 134 130 Z" fill="${p.body}"/>
      <circle cx="179" cy="82" r="20" fill="#ffd96a" opacity="0.35"/>
      <circle cx="179" cy="82" r="11" fill="#ffd96a"/>
      <ellipse cx="80" cy="181" rx="11" ry="7" fill="${p.accent}"/>
      <ellipse cx="120" cy="181" rx="11" ry="7" fill="${p.accent}"/>
      <ellipse cx="100" cy="146" rx="40" ry="38" fill="${p.body}"/>
      <ellipse cx="100" cy="154" rx="24" ry="26" fill="${p.belly}"/>
      <path d="M64 72 L70 26 L96 58 Z" fill="${p.body}"/>
      <path d="M136 72 L130 26 L104 58 Z" fill="${p.body}"/>
      <path d="M71 64 L74 38 L88 56 Z" fill="${p.accent}"/>
      <path d="M129 64 L126 38 L112 56 Z" fill="${p.accent}"/>
      <ellipse cx="100" cy="82" rx="38" ry="32" fill="${p.body}"/>
      <path d="M80 88 Q100 116 120 88 Q100 98 80 88 Z" fill="${p.belly}"/>
      <circle cx="100" cy="100" r="4" fill="${p.eye}"/>
      <path d="M94 106 Q100 110 106 106" stroke="${p.eye}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    eyes: { lx: 86, rx: 114, y: 79, r: 5.5 },
    head: { x: 100, y: 52 },
    neck: { x: 100, y: 112, w: 46 },
    area: { cx: 100, cy: 146, rx: 40, ry: 38 },
    feet: [{ x: 80, y: 181 }, { x: 120, y: 181 }],
    noMouth: true,
  }),

  crystalOwl: (p) => ({
    body: `
      <ellipse cx="88" cy="182" rx="8" ry="5" fill="#f2b84b"/>
      <ellipse cx="112" cy="182" rx="8" ry="5" fill="#f2b84b"/>
      <ellipse cx="100" cy="120" rx="52" ry="62" fill="${p.body}"/>
      <ellipse cx="52" cy="130" rx="14" ry="34" fill="${p.accent}" transform="rotate(12 52 130)"/>
      <ellipse cx="148" cy="130" rx="14" ry="34" fill="${p.accent}" transform="rotate(-12 148 130)"/>
      <path d="M62 74 L58 42 L86 64 Z" fill="${p.accent}"/>
      <path d="M138 74 L142 42 L114 64 Z" fill="${p.accent}"/>
      <circle cx="84" cy="92" r="20" fill="${p.belly}"/>
      <circle cx="116" cy="92" r="20" fill="${p.belly}"/>
      <ellipse cx="100" cy="146" rx="30" ry="32" fill="${p.belly}"/>
      <path d="M100 118 L110 134 L100 152 L90 134 Z" fill="#ffffff" opacity="0.7" stroke="${p.accent}" stroke-width="1.5"/>
      <path d="M80 140 L86 132 L92 142 L86 152 Z" fill="#ffffff" opacity="0.55" stroke="${p.accent}" stroke-width="1.2"/>
      <path d="M108 142 L114 134 L120 144 L114 154 Z" fill="#ffffff" opacity="0.55" stroke="${p.accent}" stroke-width="1.2"/>
      <path d="M94 104 L106 104 L100 115 Z" fill="#f2b84b"/>`,
    eyes: { lx: 84, rx: 116, y: 92, r: 8 },
    head: { x: 100, y: 62 },
    neck: { x: 100, y: 120, w: 50 },
    area: { cx: 100, cy: 128, rx: 50, ry: 54 },
    feet: [{ x: 88, y: 182 }, { x: 112, y: 182 }],
    noMouth: true,
  }),

  puddleGolem: (p) => ({
    body: `
      <ellipse cx="100" cy="178" rx="64" ry="10" fill="${p.accent}" opacity="0.45"/>
      <path d="M50 176 Q38 122 60 96 Q80 60 100 60 Q120 60 140 96 Q162 122 150 176 Z" fill="${p.body}"/>
      <path d="M52 150 Q44 160 50 168 Q58 162 52 150 Z" fill="${p.body}"/>
      <path d="M148 140 Q158 152 151 160 Q143 152 148 140 Z" fill="${p.body}"/>
      <ellipse cx="100" cy="144" rx="30" ry="25" fill="${p.belly}" opacity="0.9"/>
      <circle cx="74" cy="114" r="5" fill="${p.accent}"/>
      <circle cx="129" cy="126" r="4" fill="${p.accent}"/>
      <circle cx="116" cy="162" r="3" fill="${p.accent}"/>
      <ellipse cx="80" cy="84" rx="7" ry="13" fill="#ffffff" opacity="0.35" transform="rotate(25 80 84)"/>`,
    eyes: { lx: 88, rx: 112, y: 100, r: 6 },
    head: { x: 100, y: 64 },
    neck: { x: 100, y: 124, w: 64 },
    area: { cx: 100, cy: 128, rx: 48, ry: 46 },
    feet: [{ x: 76, y: 177 }, { x: 124, y: 177 }],
  }),

  cloudBunny: (p) => ({
    body: `
      <ellipse cx="80" cy="182" rx="12" ry="7" fill="${p.accent}"/>
      <ellipse cx="120" cy="182" rx="12" ry="7" fill="${p.accent}"/>
      <circle cx="146" cy="160" r="12" fill="${p.belly}"/>
      <ellipse cx="84" cy="42" rx="10" ry="30" fill="${p.body}" transform="rotate(-10 84 42)"/>
      <ellipse cx="116" cy="42" rx="10" ry="30" fill="${p.body}" transform="rotate(10 116 42)"/>
      <ellipse cx="84" cy="44" rx="5" ry="21" fill="${p.accent}" opacity="0.55" transform="rotate(-10 84 44)"/>
      <ellipse cx="116" cy="44" rx="5" ry="21" fill="${p.accent}" opacity="0.55" transform="rotate(10 116 44)"/>
      <ellipse cx="100" cy="146" rx="42" ry="38" fill="${p.body}"/>
      <ellipse cx="100" cy="154" rx="26" ry="25" fill="${p.belly}"/>
      <circle cx="100" cy="84" r="34" fill="${p.body}"/>
      <ellipse cx="100" cy="98" rx="14" ry="9" fill="${p.belly}"/>
      <path d="M96 93 L104 93 L100 98 Z" fill="${p.accent}"/>
      <path d="M94 101 Q100 106 106 101" stroke="${p.eye}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    eyes: { lx: 87, rx: 113, y: 80, r: 5.5 },
    head: { x: 100, y: 54 },
    neck: { x: 100, y: 116, w: 50 },
    area: { cx: 100, cy: 146, rx: 42, ry: 38 },
    feet: [{ x: 80, y: 182 }, { x: 120, y: 182 }],
    noMouth: true,
  }),

  shellTurtle: (p) => ({
    body: `
      <ellipse cx="72" cy="178" rx="13" ry="8" fill="${p.body}"/>
      <ellipse cx="128" cy="178" rx="13" ry="8" fill="${p.body}"/>
      <ellipse cx="100" cy="140" rx="58" ry="44" fill="${p.accent}"/>
      <path d="M100 104 L122 116 L122 140 L100 152 L78 140 L78 116 Z" fill="${p.body}" opacity="0.45"/>
      <path d="M56 124 L74 116 L74 142 L58 150 Z" fill="${p.body}" opacity="0.35"/>
      <path d="M144 124 L126 116 L126 142 L142 150 Z" fill="${p.body}" opacity="0.35"/>
      <ellipse cx="100" cy="162" rx="34" ry="17" fill="${p.belly}"/>
      <circle cx="100" cy="78" r="30" fill="${p.body}"/>
      <ellipse cx="100" cy="92" rx="13" ry="8" fill="${p.belly}"/>
      <path d="M94 92 Q100 97 106 92" stroke="${p.eye}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    eyes: { lx: 89, rx: 111, y: 74, r: 5.5 },
    head: { x: 100, y: 50 },
    neck: { x: 100, y: 106, w: 44 },
    area: { cx: 100, cy: 138, rx: 56, ry: 42 },
    feet: [{ x: 72, y: 178 }, { x: 128, y: 178 }],
    noMouth: true,
  }),
};

// style: round | happy | sleepy | sparkle. scale makes teen eyes a bit bigger.
function eyes(e, p, style = "round", scale = 1) {
  const r = e.r * scale;
  const one = (x) => {
    if (style === "happy") return `<path d="M${x - r} ${e.y + 1} Q${x} ${e.y - r * 1.3} ${x + r} ${e.y + 1}" stroke="${p.eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    if (style === "sleepy")
      return `<path d="M${x - r} ${e.y} Q${x} ${e.y + r} ${x + r} ${e.y} Z" fill="${p.eye}"/><path d="M${x - r - 1} ${e.y} L${x + r + 1} ${e.y}" stroke="${p.eye}" stroke-width="2" stroke-linecap="round"/>`;
    const base = `<circle cx="${x}" cy="${e.y}" r="${r}" fill="${p.eye}"/><circle cx="${x + r * 0.35}" cy="${e.y - r * 0.35}" r="${r * 0.38}" fill="#ffffff"/>`;
    if (style === "sparkle") return base + `<circle cx="${x - r * 0.35}" cy="${e.y + r * 0.3}" r="${r * 0.18}" fill="#ffffff"/>`;
    return base;
  };
  return one(e.lx) + one(e.rx);
}

function markings(e, kind) {
  const cy = e.y + e.r + 6;
  const lx = e.lx - e.r - 2;
  const rx = e.rx + e.r + 2;
  if (kind === "blush") return `<ellipse cx="${lx}" cy="${cy}" rx="6" ry="3.5" fill="#f48fb1" opacity="0.7"/><ellipse cx="${rx}" cy="${cy}" rx="6" ry="3.5" fill="#f48fb1" opacity="0.7"/>`;
  if (kind === "freckles")
    return [[-3, 0], [2, -2], [3, 3]].map(([dx, dy]) => `<circle cx="${lx + dx}" cy="${cy + dy}" r="1.3" fill="#8a5a3c"/><circle cx="${rx - dx}" cy="${cy + dy}" r="1.3" fill="#8a5a3c"/>`).join("");
  if (kind === "star") {
    const cx = (e.lx + e.rx) / 2;
    const y = e.y - e.r - 12;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const rr = i % 2 ? 2.6 : 6;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      return `${cx + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
    });
    return `<polygon points="${pts.join(" ")}" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="1"/>`;
  }
  if (kind === "heart") return `<path d="M${rx} ${cy + 4} l-5 -5 a3 3 0 0 1 5 -3 a3 3 0 0 1 5 3 z" fill="#e05a7a"/>`;
  return "";
}

// Small signs of growing up (SPEC §3): eyebrows from 20, gray whisker tufts from 22.
function ageDetails(e, ageMonths, p) {
  if (!ageMonths) return "";
  let out = "";
  if (ageMonths >= 240) {
    out += [e.lx, e.rx].map((x, i) => `<path d="M${x - e.r} ${e.y - e.r - 5 + (i ? 0 : 1)} Q${x} ${e.y - e.r - 9} ${x + e.r} ${e.y - e.r - 5 + (i ? 1 : 0)}" stroke="${p.eye}" stroke-width="2" fill="none" stroke-linecap="round"/>`).join("");
  }
  if (ageMonths >= 264) {
    const y = e.y + e.r + 10;
    out += [[e.lx - e.r - 6, -1], [e.rx + e.r + 6, 1]].map(([x, d]) => [0, 4].map((dy) => `<path d="M${x} ${y + dy} l${d * 9} ${dy ? 2 : -1}" stroke="#b9b9c2" stroke-width="1.6" stroke-linecap="round"/>`).join("")).join("");
  }
  return out;
}

function mouth(e, p) {
  const cx = (e.lx + e.rx) / 2;
  const y = e.y + 13;
  return `<path d="M${cx - 6} ${y} Q${cx} ${y + 5} ${cx + 6} ${y}" stroke="${p.eye}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

const HEAD = {
  none: () => "",
  crown: ({ x, y }) => `
    <path d="M${x - 18} ${y + 4} L${x - 18} ${y - 12} L${x - 9} ${y - 3} L${x} ${y - 17} L${x + 9} ${y - 3} L${x + 18} ${y - 12} L${x + 18} ${y + 4} Z"
      fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${x}" cy="${y - 2}" r="3" fill="#d9534f"/>`,
  wizardHat: ({ x, y }) => `
    <path d="M${x - 24} ${y + 6} L${x + 6} ${y - 46} L${x + 24} ${y + 6} Z" fill="#4b3f9e"/>
    <ellipse cx="${x}" cy="${y + 6}" rx="32" ry="7" fill="#3a3080"/>
    <circle cx="${x - 4}" cy="${y - 14}" r="3" fill="${GOLD}"/>
    <circle cx="${x + 7}" cy="${y - 28}" r="2.2" fill="${GOLD}"/>`,
  flower: ({ x, y }) => {
    const cx = x + 20;
    const cy = y + 6;
    const petals = [0, 72, 144, 216, 288]
      .map((a) => {
        const r = (a * Math.PI) / 180;
        return `<circle cx="${cx + 7 * Math.cos(r)}" cy="${cy + 7 * Math.sin(r)}" r="5.5" fill="#f48fb1"/>`;
      })
      .join("");
    return petals + `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${GOLD}"/>`;
  },
  beanie: ({ x, y }) => `
    <path d="M${x - 27} ${y + 12} Q${x} ${y - 34} ${x + 27} ${y + 12} Z" fill="#d9534f"/>
    <rect x="${x - 29}" y="${y + 6}" width="58" height="10" rx="5" fill="#b33d39"/>
    <circle cx="${x}" cy="${y - 20}" r="7" fill="#fff4e0"/>`,
  // Shop items (js/data/shop.js)
  topHat: ({ x, y }) => `
    <rect x="${x - 16}" y="${y - 34}" width="32" height="36" rx="3" fill="#2b2340"/>
    <rect x="${x - 16}" y="${y - 10}" width="32" height="7" fill="#d9534f"/>
    <ellipse cx="${x}" cy="${y + 3}" rx="28" ry="6" fill="#2b2340"/>`,
  pirateHat: ({ x, y }) => `
    <path d="M${x - 34} ${y + 6} Q${x} ${y - 40} ${x + 34} ${y + 6} Q${x} ${y - 6} ${x - 34} ${y + 6} Z" fill="#2b2340"/>
    <circle cx="${x}" cy="${y - 12}" r="6" fill="#f6f1e7"/>
    <path d="M${x - 4} ${y - 4} L${x + 4} ${y - 4}" stroke="#f6f1e7" stroke-width="2"/>`,
  flowerCrown: ({ x, y }) =>
    [-24, -12, 0, 12, 24]
      .map((dx, i) => `<circle cx="${x + dx}" cy="${y + 4 - Math.abs(dx) / 6}" r="6" fill="${["#f48fb1", "#ffd54f", "#ce93d8", "#ffd54f", "#f48fb1"][i]}"/><circle cx="${x + dx}" cy="${y + 4 - Math.abs(dx) / 6}" r="2" fill="#fff4e0"/>`)
      .join(""),
  partyHat: ({ x, y }) => `
    <path d="M${x - 15} ${y + 6} L${x} ${y - 32} L${x + 15} ${y + 6} Z" fill="#4fc3f7"/>
    <path d="M${x - 9} ${y - 8} L${x + 9} ${y - 8} M${x - 12} ${y} L${x + 12} ${y}" stroke="#f48fb1" stroke-width="3"/>
    <circle cx="${x}" cy="${y - 33}" r="5" fill="${GOLD}"/>`,
  headphones: ({ x, y }) => `
    <path d="M${x - 30} ${y + 22} Q${x - 30} ${y - 12} ${x} ${y - 12} Q${x + 30} ${y - 12} ${x + 30} ${y + 22}" stroke="${INK}" stroke-width="5" fill="none"/>
    <rect x="${x - 38}" y="${y + 14}" width="14" height="22" rx="6" fill="#d9534f"/>
    <rect x="${x + 24}" y="${y + 14}" width="14" height="22" rx="6" fill="#d9534f"/>`,
  halo: ({ x, y }) => `<ellipse cx="${x}" cy="${y - 14}" rx="22" ry="6" fill="none" stroke="${GOLD}" stroke-width="5"/><ellipse cx="${x}" cy="${y - 14}" rx="26" ry="9" fill="${GOLD}" opacity="0.18"/>`,
  vikingHelmet: ({ x, y }) => `
    <path d="M${x - 26} ${y + 10} Q${x} ${y - 30} ${x + 26} ${y + 10} Z" fill="#9aa3b5"/>
    <rect x="${x - 28}" y="${y + 4}" width="56" height="8" rx="3" fill="#7a5a3c"/>
    <path d="M${x - 26} ${y} Q${x - 46} ${y - 6} ${x - 42} ${y - 28} Q${x - 36} ${y - 12} ${x - 22} ${y - 8} Z" fill="#fff4e0"/>
    <path d="M${x + 26} ${y} Q${x + 46} ${y - 6} ${x + 42} ${y - 28} Q${x + 36} ${y - 12} ${x + 22} ${y - 8} Z" fill="#fff4e0"/>`,
  graduationCap: ({ x, y }) => `
    <rect x="${x - 16}" y="${y - 6}" width="32" height="12" rx="3" fill="${INK}"/>
    <path d="M${x - 32} ${y - 8} L${x} ${y - 20} L${x + 32} ${y - 8} L${x} ${y + 4} Z" fill="${INK}"/>
    <path d="M${x + 4} ${y - 8} L${x + 26} ${y} L${x + 26} ${y + 14}" stroke="${GOLD}" stroke-width="2" fill="none"/>
    <circle cx="${x + 26}" cy="${y + 16}" r="3" fill="${GOLD}"/>`,
  chefHat: ({ x, y }) => `
    <rect x="${x - 18}" y="${y - 6}" width="36" height="14" rx="3" fill="#fbf7f0" stroke="#d8cfc0"/>
    <circle cx="${x - 12}" cy="${y - 14}" r="11" fill="#fbf7f0" stroke="#d8cfc0"/>
    <circle cx="${x + 12}" cy="${y - 14}" r="11" fill="#fbf7f0" stroke="#d8cfc0"/>
    <circle cx="${x}" cy="${y - 22}" r="12" fill="#fbf7f0" stroke="#d8cfc0"/>`,
  bow: ({ x, y }) => `
    <path d="M${x + 14} ${y + 4} L${x - 2} ${y - 8} L${x - 2} ${y + 16} Z" fill="#e05a7a"/>
    <path d="M${x + 14} ${y + 4} L${x + 30} ${y - 8} L${x + 30} ${y + 16} Z" fill="#e05a7a"/>
    <circle cx="${x + 14}" cy="${y + 4}" r="4.5" fill="#b4506f"/>`,
  antlers: ({ x, y }) => `
    <path d="M${x - 14} ${y + 6} L${x - 24} ${y - 20} M${x - 21} ${y - 12} L${x - 32} ${y - 16} M${x - 23} ${y - 18} L${x - 18} ${y - 30}" stroke="#8a5a3c" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M${x + 14} ${y + 6} L${x + 24} ${y - 20} M${x + 21} ${y - 12} L${x + 32} ${y - 16} M${x + 23} ${y - 18} L${x + 18} ${y - 30}" stroke="#8a5a3c" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  royalCrown: ({ x, y }) => `
    <path d="M${x - 26} ${y + 6} L${x - 26} ${y - 18} L${x - 13} ${y - 4} L${x} ${y - 26} L${x + 13} ${y - 4} L${x + 26} ${y - 18} L${x + 26} ${y + 6} Z"
      fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="${x - 26}" y="${y}" width="52" height="7" fill="#a8431f"/>
    <circle cx="${x}" cy="${y - 8}" r="4.5" fill="#d9534f"/>
    <circle cx="${x - 14}" cy="${y - 2}" r="3.5" fill="#2b6cb0"/>
    <circle cx="${x + 14}" cy="${y - 2}" r="3.5" fill="#3f8f4f"/>`,
};

const NECK = {
  none: () => "",
  scarf: ({ x, y, w }) => `
    <rect x="${x - w / 2}" y="${y - 6}" width="${w}" height="13" rx="6.5" fill="#d9534f"/>
    <rect x="${x + w / 6}" y="${y + 2}" width="11" height="26" rx="4" fill="#b33d39" transform="rotate(-8 ${x + w / 6} ${y})"/>`,
  bowtie: ({ x, y }) => `
    <path d="M${x} ${y} L${x - 15} ${y - 9} L${x - 15} ${y + 9} Z" fill="#2b6cb0"/>
    <path d="M${x} ${y} L${x + 15} ${y - 9} L${x + 15} ${y + 9} Z" fill="#2b6cb0"/>
    <circle cx="${x}" cy="${y}" r="4" fill="#1d4f86"/>`,
  medal: ({ x, y }) => `
    <path d="M${x - 12} ${y - 6} L${x} ${y + 12} L${x + 12} ${y - 6}" stroke="#2b6cb0" stroke-width="5" fill="none"/>
    <circle cx="${x}" cy="${y + 17}" r="8" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2"/>`,
  pearls: ({ x, y, w }) =>
    Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      return `<circle cx="${x - w / 2 + 4 + t * (w - 8)}" cy="${y + 6 * Math.sin(Math.PI * t)}" r="4" fill="#fbf7f0" stroke="#d8cfc0" stroke-width="1"/>`;
    }).join(""),
  bandana: ({ x, y, w }) => `
    <path d="M${x - w / 2} ${y - 4} L${x + w / 2} ${y - 4} L${x} ${y + 18} Z" fill="#2b6cb0"/>
    <circle cx="${x - 6}" cy="${y + 2}" r="2" fill="#fff"/><circle cx="${x + 6}" cy="${y + 2}" r="2" fill="#fff"/><circle cx="${x}" cy="${y + 9}" r="2" fill="#fff"/>`,
  lei: ({ x, y, w }) =>
    Array.from({ length: 7 }, (_, i) => {
      const t = i / 6;
      return `<circle cx="${x - w / 2 + 2 + t * (w - 4)}" cy="${y + 2 + 8 * Math.sin(Math.PI * t)}" r="5.5" fill="${["#f48fb1", "#ffd54f", "#ce93d8"][i % 3]}"/>`;
    }).join(""),
  starNecklace: ({ x, y }) => `
    <path d="M${x - 16} ${y - 4} Q${x} ${y + 10} ${x + 16} ${y - 4}" stroke="${GOLD_DARK}" stroke-width="2" fill="none"/>
    <polygon points="${x},${y + 4} ${x + 3},${y + 11} ${x + 10},${y + 11} ${x + 4},${y + 15} ${x + 6},${y + 22} ${x},${y + 18} ${x - 6},${y + 22} ${x - 4},${y + 15} ${x - 10},${y + 11} ${x - 3},${y + 11}" fill="${GOLD}" stroke="${GOLD_DARK}"/>`,
  royalSash: ({ x, y, w }) => `<path d="M${x - w / 2 + 4} ${y - 4} L${x - w / 2 + 16} ${y - 6} L${x + w / 2} ${y + 46} L${x + w / 2 - 12} ${y + 50} Z" fill="#6a4fc2"/><circle cx="${x + 6}" cy="${y + 22}" r="5" fill="${GOLD}"/>`,
  tie: ({ x, y }) => `<path d="M${x - 5} ${y - 4} L${x + 5} ${y - 4} L${x + 3} ${y + 2} L${x + 7} ${y + 26} L${x} ${y + 32} L${x - 7} ${y + 26} L${x - 3} ${y + 2} Z" fill="#2b6cb0"/>`,
  // The cape itself hangs behind the body (BEHIND below). This is the clasp.
  dragonCape: ({ x, y, w }) => `
    <path d="M${x - w / 2 + 2} ${y - 3} Q${x} ${y + 6} ${x + w / 2 - 2} ${y - 3}" stroke="#2f6b3f" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="${x}" cy="${y + 2}" r="6" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2"/>`,
};

// Parts of a neck item drawn before the body, so they sit behind it.
const BEHIND = {
  dragonCape: ({ x, y, w }) => `
    <path d="M${x - w / 2 - 4} ${y - 4} L${x + w / 2 + 4} ${y - 4} L${x + w / 2 + 34} ${y + 72} Q${x} ${y + 84} ${x - w / 2 - 34} ${y + 72} Z" fill="#3f8f4f"/>
    <path d="M${x - w / 2 - 22} ${y + 48} q12 10 24 0 q12 10 24 0 q12 10 24 0" stroke="#2f6b3f" stroke-width="3" fill="none"/>`,
};

// Body patterns, clipped to the body so they never spill off it.
const SPOTS = [[-0.55, -0.3], [0.5, -0.45], [-0.2, 0.5], [0.6, 0.35], [0.05, -0.65], [-0.65, 0.4]];
function starPath(cx, cy, r) {
  return Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");
}
const PATTERNS = {
  spots: (a, p) => SPOTS.map(([dx, dy], i) => `<circle cx="${a.cx + dx * a.rx}" cy="${a.cy + dy * a.ry}" r="${5 + (i % 3) * 2}" fill="${p.accent}" opacity="0.5"/>`).join(""),
  stripes: (a, p) => [-0.6, -0.2, 0.2, 0.6].map((dy) => `<rect x="${a.cx - a.rx}" y="${a.cy + dy * a.ry - 3}" width="${a.rx * 2}" height="7" fill="${p.accent}" opacity="0.4" transform="rotate(-12 ${a.cx} ${a.cy})"/>`).join(""),
  stars: (a) => SPOTS.map(([dx, dy]) => `<polygon points="${starPath(a.cx + dx * a.rx, a.cy + dy * a.ry, 6)}" fill="${GOLD}" opacity="0.85"/>`).join(""),
  hearts: (a) => SPOTS.map(([dx, dy]) => `<path d="M${a.cx + dx * a.rx} ${a.cy + dy * a.ry + 4} l-5 -5 a2.6 2.6 0 0 1 5 -3 a2.6 2.6 0 0 1 5 3 z" fill="#e05a7a" opacity="0.75"/>`).join(""),
  sparkles: (a) => SPOTS.map(([dx, dy]) => {
    const x = a.cx + dx * a.rx;
    const y = a.cy + dy * a.ry;
    return `<path d="M${x} ${y - 6} Q${x} ${y} ${x + 6} ${y} Q${x} ${y} ${x} ${y + 6} Q${x} ${y} ${x - 6} ${y} Q${x} ${y} ${x} ${y - 6} Z" fill="#fff4c2" opacity="0.95"/>`;
  }).join(""),
};

function pattern(s, kind, p, id) {
  const draw = PATTERNS[kind];
  if (!draw) return "";
  const a = s.area;
  return `<clipPath id="${id}"><ellipse cx="${a.cx}" cy="${a.cy}" rx="${a.rx}" ry="${a.ry}"/></clipPath><g clip-path="url(#${id})">${draw(a, p)}</g>`;
}

// Shoes go on both feet.
const FEET = {
  none: () => "",
  sneakers: (f) => `<ellipse cx="${f.x}" cy="${f.y}" rx="15" ry="8" fill="#ffffff" stroke="#9aa3b5" stroke-width="1.5"/><path d="M${f.x - 9} ${f.y - 1} L${f.x + 7} ${f.y - 1}" stroke="#d9534f" stroke-width="3"/>`,
  slippers: (f) => `<ellipse cx="${f.x}" cy="${f.y}" rx="15" ry="8" fill="#f8bbd0"/><circle cx="${f.x}" cy="${f.y - 6}" r="5" fill="#fce4ec"/>`,
  boots: (f) => `<rect x="${f.x - 13}" y="${f.y - 14}" width="26" height="20" rx="6" fill="#8a5a3c"/><rect x="${f.x - 14}" y="${f.y + 2}" width="28" height="6" rx="3" fill="#5a3a20"/>`,
  rainBoots: (f) => `<rect x="${f.x - 13}" y="${f.y - 14}" width="26" height="20" rx="6" fill="#f2c84b"/><rect x="${f.x - 14}" y="${f.y + 2}" width="28" height="6" rx="3" fill="#c0901a"/>`,
  goldBoots: (f) => `<rect x="${f.x - 13}" y="${f.y - 14}" width="26" height="20" rx="6" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2"/><circle cx="${f.x}" cy="${f.y - 5}" r="3" fill="#d9534f"/>`,
  rocketSneakers: (f) => `<path d="M${f.x - 10} ${f.y + 4} l-10 4 l4 -8 z" fill="#ffb347"/><ellipse cx="${f.x}" cy="${f.y}" rx="15" ry="8" fill="#d9534f"/><path d="M${f.x - 8} ${f.y - 2} L${f.x + 8} ${f.y - 2}" stroke="#fff" stroke-width="2.5"/>`,
};

// Magic effects: a glow behind the creature and/or sparkles in front.
const EFFECT_BEHIND = {
  goldGlow: () => `<circle cx="100" cy="112" r="86" fill="${GOLD}" opacity="0.28"/><circle cx="100" cy="112" r="64" fill="#fff4c2" opacity="0.4"/>`,
  royalAura: () => `<circle cx="100" cy="112" r="86" fill="#8a6fd1" opacity="0.25"/><circle cx="100" cy="112" r="66" fill="#e8defb" opacity="0.4"/>`,
};
const EFFECT_FRONT = {
  sparkles: () => [[22, 64], [178, 52], [28, 150], [176, 158], [150, 22]].map(([x, y]) => `<path d="M${x} ${y - 8} Q${x} ${y} ${x + 8} ${y} Q${x} ${y} ${x} ${y + 8} Q${x} ${y} ${x - 8} ${y} Q${x} ${y} ${x} ${y - 8} Z" fill="${GOLD}"/>`).join(""),
  hearts: () => [[26, 70], [172, 60], [160, 26], [40, 30]].map(([x, y]) => `<path d="M${x} ${y + 6} l-7 -7 a3.8 3.8 0 0 1 7 -4.5 a3.8 3.8 0 0 1 7 4.5 z" fill="#e05a7a" opacity="0.85"/>`).join(""),
  royalAura: () => [[30, 60], [170, 60]].map(([x, y]) => `<polygon points="${starPath(x, y, 8)}" fill="${GOLD}"/>`).join(""),
  confetti: () => [[24, 40, "#e05a7a"], [60, 20, "#4fc3f7"], [150, 26, "#ffd54f"], [178, 70, "#8fd6b4"], [20, 120, "#ce93d8"], [182, 130, "#ffb347"], [36, 172, "#4fc3f7"]].map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="7" height="4" fill="${c}" transform="rotate(${i * 37} ${x} ${y})"/>`).join(""),
};

export const EYE_COLORS = { default: null, blue: "#2b6cb0", green: "#2f7d4a", amber: "#b45f06", violet: "#6a4fc2", pink: "#b4506f" };

// Held in the paw, to the creature's right.
const HELD_AT = { x: 150, y: 132 };
const HELD = {
  none: () => "",
  balloon: ({ x, y }) => `<path d="M${x} ${y} Q${x + 6} ${y - 30} ${x + 2} ${y - 52}" stroke="#7a7a8a" stroke-width="1.5" fill="none"/><ellipse cx="${x + 2}" cy="${y - 68}" rx="14" ry="17" fill="#e05a7a"/><path d="M${x - 2} ${y - 51} l4 0 l-2 4 z" fill="#b33d39"/><ellipse cx="${x - 3}" cy="${y - 74}" rx="4" ry="6" fill="#fff" opacity="0.5"/>`,
  book: ({ x, y }) => `<rect x="${x - 12}" y="${y - 12}" width="24" height="30" rx="3" fill="#2b6cb0"/><rect x="${x - 9}" y="${y - 9}" width="18" height="24" rx="2" fill="#fbf7f0"/><line x1="${x - 5}" y1="${y - 3}" x2="${x + 5}" y2="${y - 3}" stroke="#9aa3b5" stroke-width="1.5"/><line x1="${x - 5}" y1="${y + 2}" x2="${x + 5}" y2="${y + 2}" stroke="#9aa3b5" stroke-width="1.5"/>`,
  lantern: ({ x, y }) => `<path d="M${x} ${y - 22} q0 -8 0 -8" stroke="${INK}" stroke-width="2"/><rect x="${x - 10}" y="${y - 22}" width="20" height="26" rx="5" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2"/><circle cx="${x}" cy="${y - 9}" r="5" fill="#fff4c2"/><circle cx="${x}" cy="${y - 9}" r="12" fill="#ffd96a" opacity="0.25"/>`,
  wand: ({ x, y }) => `<line x1="${x - 8}" y1="${y + 14}" x2="${x + 10}" y2="${y - 26}" stroke="#5a3a20" stroke-width="4" stroke-linecap="round"/><polygon points="${x + 11},${y - 38} ${x + 14},${y - 30} ${x + 22},${y - 30} ${x + 16},${y - 25} ${x + 18},${y - 17} ${x + 11},${y - 22} ${x + 4},${y - 17} ${x + 6},${y - 25} ${x},${y - 30} ${x + 8},${y - 30}" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="1"/>`,
  shield: ({ x, y }) => `<path d="M${x - 14} ${y - 18} L${x + 14} ${y - 18} L${x + 14} ${y} Q${x + 14} ${y + 14} ${x} ${y + 22} Q${x - 14} ${y + 14} ${x - 14} ${y} Z" fill="#2b6cb0" stroke="${GOLD}" stroke-width="3"/><path d="M${x} ${y - 12} L${x} ${y + 14} M${x - 9} ${y} L${x + 9} ${y}" stroke="${GOLD}" stroke-width="3"/>`,
  trophy: ({ x, y }) => `<path d="M${x - 12} ${y - 20} L${x + 12} ${y - 20} L${x + 9} ${y - 2} Q${x} ${y + 6} ${x - 9} ${y - 2} Z" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="1.5"/><rect x="${x - 3}" y="${y + 2}" width="6" height="8" fill="${GOLD_DARK}"/><rect x="${x - 10}" y="${y + 10}" width="20" height="6" rx="2" fill="#7a5a3c"/>`,
  plant: ({ x, y }) => `<path d="M${x - 10} ${y} L${x + 10} ${y} L${x + 7} ${y + 18} L${x - 7} ${y + 18} Z" fill="#b8733d"/><path d="M${x} ${y} Q${x - 14} ${y - 12} ${x - 6} ${y - 24} Q${x + 2} ${y - 12} ${x} ${y} Q${x + 14} ${y - 16} ${x + 10} ${y - 28} Q${x + 2} ${y - 16} ${x} ${y}" fill="#3f8f4f"/>`,
  goldCoin: ({ x, y }) => `<circle cx="${x}" cy="${y}" r="13" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2.5"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="${GOLD_DARK}">$</text>`,
  mug: ({ x, y }) => `<rect x="${x - 10}" y="${y - 12}" width="20" height="22" rx="3" fill="#d9534f"/><path d="M${x + 10} ${y - 6} q8 0 8 6 q0 6 -8 6" stroke="#d9534f" stroke-width="3" fill="none"/><path d="M${x - 4} ${y - 18} q3 -4 0 -8 M${x + 3} ${y - 18} q3 -4 0 -8" stroke="#b9b9c2" stroke-width="1.5" fill="none"/>`,
};

const FACE = {
  none: () => "",
  glasses: (e) => `
    <circle cx="${e.lx}" cy="${e.y}" r="${e.r + 5}" stroke="${INK}" stroke-width="2.5" fill="#ffffff" fill-opacity="0.15"/>
    <circle cx="${e.rx}" cy="${e.y}" r="${e.r + 5}" stroke="${INK}" stroke-width="2.5" fill="#ffffff" fill-opacity="0.15"/>
    <line x1="${e.lx + e.r + 5}" y1="${e.y}" x2="${e.rx - e.r - 5}" y2="${e.y}" stroke="${INK}" stroke-width="2.5"/>`,
  monocle: (e) => `
    <circle cx="${e.rx}" cy="${e.y}" r="${e.r + 6}" stroke="${GOLD_DARK}" stroke-width="2.5" fill="#ffffff" fill-opacity="0.15"/>
    <path d="M${e.rx + e.r + 4} ${e.y + 4} Q${e.rx + e.r + 12} ${e.y + 24} ${e.rx + 2} ${e.y + 34}" stroke="${GOLD_DARK}" stroke-width="1.5" fill="none"/>`,
  eyePatch: (e) => `<line x1="${e.lx - e.r - 10}" y1="${e.y - e.r - 8}" x2="${e.rx + e.r + 10}" y2="${e.y - 2}" stroke="${INK}" stroke-width="2"/><ellipse cx="${e.rx}" cy="${e.y}" rx="${e.r + 4}" ry="${e.r + 3}" fill="${INK}"/>`,
  heartGlasses: (e) =>
    [e.lx, e.rx].map((x) => `<path d="M${x} ${e.y + e.r + 4} l-${e.r + 5} -${e.r + 4} a${(e.r + 5) / 2} ${(e.r + 5) / 2} 0 0 1 ${e.r + 5} -${e.r - 1} a${(e.r + 5) / 2} ${(e.r + 5) / 2} 0 0 1 ${e.r + 5} ${e.r - 1} z" fill="#e05a7a" fill-opacity="0.8" stroke="#b4506f" stroke-width="1.5"/>`).join("") +
    `<line x1="${e.lx + e.r + 4}" y1="${e.y - 2}" x2="${e.rx - e.r - 4}" y2="${e.y - 2}" stroke="#b4506f" stroke-width="2"/>`,
  sunglasses: (e) => `
    <rect x="${e.lx - e.r - 6}" y="${e.y - e.r - 3}" width="${2 * e.r + 12}" height="${2 * e.r + 6}" rx="5" fill="${INK}"/>
    <rect x="${e.rx - e.r - 6}" y="${e.y - e.r - 3}" width="${2 * e.r + 12}" height="${2 * e.r + 6}" rx="5" fill="${INK}"/>
    <line x1="${e.lx + e.r + 6}" y1="${e.y}" x2="${e.rx - e.r - 6}" y2="${e.y}" stroke="${INK}" stroke-width="3"/>`,
  starGlasses: (e) => {
    const star = (cx) => {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? (e.r + 4) * 0.5 : e.r + 8;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${e.y + r * Math.sin(a)}`;
      });
      return `<polygon points="${pts.join(" ")}" fill="#f48fb1" fill-opacity="0.85" stroke="#b4506f" stroke-width="2"/>`;
    };
    return star(e.lx) + star(e.rx) + `<line x1="${e.lx + e.r + 4}" y1="${e.y}" x2="${e.rx - e.r - 4}" y2="${e.y}" stroke="#b4506f" stroke-width="2.5"/>`;
  },
};

// ageMonths (optional) adds small signs of growing up.
export function creatureSvg(creature, { size = 200, label, ageMonths = 0 } = {}) {
  const species = SHAPES[creature.species] ? creature.species : "mossDragon";
  const p = PALETTES[creature.palette] || PALETTES.moss;
  const s = SHAPES[species](p);
  const acc = creature.accessories || {};
  const eyeP = EYE_COLORS[creature.eyeColor] ? { ...p, eye: EYE_COLORS[creature.eyeColor] } : p;
  // Same look, same id, so repeated drawings stay identical.
  const clipId = `pat-${species}-${creature.pattern || "none"}`;
  const name = label ?? (creature.name ? `${creature.name}, a ${SPECIES[species].label.toLowerCase()}` : SPECIES[species].label);
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${escapeAttr(name)}">
    ${EFFECT_BEHIND[acc.effect] ? EFFECT_BEHIND[acc.effect]() : ""}
    ${BEHIND[acc.neck] ? BEHIND[acc.neck](s.neck) : ""}
    ${s.body}
    ${pattern(s, creature.pattern, p, clipId)}
    ${FEET[acc.feet] ? s.feet.map((f) => FEET[acc.feet](f)).join("") : ""}
    ${(NECK[acc.neck] || NECK.none)(s.neck)}
    ${eyes(s.eyes, eyeP, creature.eyes, ageMonths && ageMonths < 216 ? 1.15 : 1)}
    ${markings(s.eyes, creature.markings)}
    ${ageDetails(s.eyes, ageMonths, p)}
    ${s.noMouth ? "" : mouth(s.eyes, p)}
    ${(FACE[acc.face] || FACE.none)(s.eyes)}
    ${(HEAD[acc.head] || HEAD.none)(s.head)}
    ${(HELD[acc.held] || HELD.none)(HELD_AT)}
    ${EFFECT_FRONT[acc.effect] ? EFFECT_FRONT[acc.effect]() : ""}
  </svg>`;
}

function escapeAttr(s) {
  return String(s).replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]);
}
