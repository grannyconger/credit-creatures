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
  }),
};

function eyes(e, p) {
  const one = (x) => `
    <circle cx="${x}" cy="${e.y}" r="${e.r}" fill="${p.eye}"/>
    <circle cx="${x + e.r * 0.35}" cy="${e.y - e.r * 0.35}" r="${e.r * 0.38}" fill="#ffffff"/>`;
  return one(e.lx) + one(e.rx);
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
};

export function creatureSvg(creature, { size = 200, label } = {}) {
  const species = SHAPES[creature.species] ? creature.species : "mossDragon";
  const p = PALETTES[creature.palette] || PALETTES.moss;
  const s = SHAPES[species](p);
  const acc = creature.accessories || {};
  const name = label ?? (creature.name ? `${creature.name}, a ${SPECIES[species].label.toLowerCase()}` : SPECIES[species].label);
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${escapeAttr(name)}">
    ${s.body}
    ${(NECK[acc.neck] || NECK.none)(s.neck)}
    ${eyes(s.eyes, p)}
    ${s.noMouth ? "" : mouth(s.eyes, p)}
    ${(FACE[acc.face] || FACE.none)(s.eyes)}
    ${(HEAD[acc.head] || HEAD.none)(s.head)}
  </svg>`;
}

function escapeAttr(s) {
  return String(s).replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]);
}
