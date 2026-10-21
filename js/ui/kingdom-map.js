// The Kingdom of Coinhaven: an illustrated village where every building is a
// place in the game (js/places.js). The art is one SVG. The places are real
// buttons laid over it, so they work with a keyboard and a screen reader.
// Colors come from CSS variables (.kingdom in css/app.css), so dark mode turns
// it into night with lit windows. On phones, a labeled list replaces the labels.
import { h } from "./dom.js";
import { icon } from "./icons.js";
import { creatureSvg } from "./creature-art.js";
import { PLACES } from "../places.js";

const W = 1000;
const H = 600;
const at = (p) => ({ x: (p.x / 100) * W, y: (p.y / 100) * H });

const tree = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-4" y="-6" width="8" height="22" rx="3" fill="var(--k-trunk)"/><circle cx="0" cy="-18" r="20" fill="var(--k-leaf)"/><circle cx="-12" cy="-8" r="13" fill="var(--k-leaf2)"/><circle cx="12" cy="-9" r="13" fill="var(--k-leaf2)"/></g>`;
const win = (x, y, w = 14, hgt = 16) => `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="3" class="k-win"/>`;

const BUILDINGS = {
  townhall: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      <rect x="-78" y="-40" width="156" height="78" rx="4" fill="var(--k-stone)"/>
      <path d="M-90 -40 L0 -96 L90 -40 Z" fill="var(--k-roof-royal)"/>
      <circle cx="0" cy="-62" r="15" fill="var(--k-stone-light)" stroke="var(--k-trim)" stroke-width="3"/>
      <path d="M0 -62 v-9 M0 -62 l7 4" stroke="var(--k-trim)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M0 -96 v-30" stroke="var(--k-trim)" stroke-width="3"/><path d="M0 -126 l26 7 -26 7z" fill="var(--k-flag)"/>
      ${[-58, -30, 30, 58].map((cx) => `<rect x="${cx - 6}" y="-32" width="12" height="62" rx="3" fill="var(--k-stone-light)"/>`).join("")}
      <path d="M-14 38 v-30 a14 14 0 0 1 28 0 v30z" fill="var(--k-door)"/>
      <rect x="-86" y="36" width="172" height="8" rx="3" fill="var(--k-trim)"/>
    </g>`,
  vault: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      <rect x="-64" y="-34" width="128" height="70" rx="4" fill="var(--k-stone)"/>
      <path d="M-72 -34 L0 -70 L72 -34 Z" fill="var(--k-stone-light)" stroke="var(--k-trim)" stroke-width="3"/>
      <ellipse cx="0" cy="-74" rx="26" ry="18" fill="var(--k-gold)"/><circle cx="0" cy="-94" r="5" fill="var(--k-gold)"/>
      <text x="0" y="-41" text-anchor="middle" font-size="16" font-weight="800" fill="var(--k-trim)">$</text>
      ${[-48, -24, 24, 48].map((cx) => `<rect x="${cx - 6}" y="-28" width="12" height="58" rx="3" fill="var(--k-stone-light)"/>`).join("")}
      <rect x="-13" y="2" width="26" height="34" rx="4" fill="var(--k-door)"/><circle cx="0" cy="18" r="6" fill="none" stroke="var(--k-gold)" stroke-width="2.5"/>
      <rect x="-72" y="34" width="144" height="8" rx="3" fill="var(--k-trim)"/>
    </g>`,
  guild: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      <rect x="38" y="-88" width="16" height="40" fill="var(--k-stone)"/>
      <circle cx="48" cy="-102" r="9" class="k-smoke"/><circle cx="58" cy="-118" r="12" class="k-smoke"/>
      <rect x="-62" y="-38" width="124" height="74" rx="4" fill="var(--k-wall)"/>
      <path d="M-74 -36 L0 -84 L74 -36 Z" fill="var(--k-roof-red)"/>
      <path d="M-62 -10 H62 M-30 -38 V36 M30 -38 V36" stroke="var(--k-beam)" stroke-width="5"/>
      ${win(-52, -2)}${win(38, -2)}
      <rect x="-14" y="4" width="28" height="32" rx="3" fill="var(--k-door)"/>
      <g transform="translate(-86 0)"><rect x="-2" y="-34" width="4" height="40" fill="var(--k-beam)"/><rect x="-22" y="-34" width="34" height="22" rx="4" fill="var(--k-sign)"/><path d="M-12 -18 l8 -8 4 4 -8 8z M-14 -14 l-4 4" stroke="var(--k-trim)" stroke-width="2.5" fill="none"/></g>
    </g>`,
  market: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      ${[-46, 46].map((cx, i) => `
        <rect x="${cx - 38}" y="-14" width="76" height="44" rx="3" fill="var(--k-wall)"/>
        <rect x="${cx - 32}" y="2" width="64" height="12" rx="2" fill="var(--k-beam)"/>
        ${[0, 1, 2].map((k) => `<circle cx="${cx - 18 + k * 18}" cy="-1" r="7" fill="${["#e05a7a", "#f2c84b", "#6fae5a"][(k + i) % 3]}"/>`).join("")}
        <path d="M${cx - 46} -14 L${cx - 38} -42 H${cx + 38} L${cx + 46} -14 Z" fill="${i ? "var(--k-awning2)" : "var(--k-awning)"}"/>
        ${[0, 1, 2, 3].map((k) => `<path d="M${cx - 38 + k * 23} -42 l-6 28 h12 l4 -28z" fill="var(--k-awning-stripe)"/>`).join("")}`).join("")}
    </g>`,
  cottage: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      <rect x="22" y="-74" width="14" height="30" fill="var(--k-stone)"/>
      <rect x="-50" y="-28" width="100" height="62" rx="5" fill="var(--k-wall)"/>
      <path d="M-62 -26 Q-40 -76 0 -80 Q40 -76 62 -26 Z" fill="var(--k-roof-green)"/>
      ${win(-38, -12, 18, 18)}${win(20, -12, 18, 18)}
      <path d="M-12 34 v-26 a12 12 0 0 1 24 0 v26z" fill="var(--k-door)"/><circle cx="6" cy="20" r="2" fill="var(--k-gold)"/>
      ${[-44, -30, 30, 44].map((cx) => `<circle cx="${cx}" cy="38" r="6" fill="${cx < 0 ? "#f48fb1" : "#ffd54f"}"/>`).join("")}
    </g>`,
  plaza: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      <ellipse cx="0" cy="22" rx="92" ry="22" fill="var(--k-paving)"/>
      <ellipse cx="0" cy="12" rx="46" ry="14" fill="var(--k-stone)"/>
      <ellipse cx="0" cy="8" rx="38" ry="9" fill="var(--k-water)"/>
      <rect x="-6" y="-30" width="12" height="38" rx="4" fill="var(--k-stone-light)"/>
      <path d="M0 -30 q-18 -10 -26 10 M0 -30 q18 -10 26 10 M0 -32 v-14" stroke="var(--k-water)" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M-92 -54 Q0 -30 92 -54" stroke="var(--k-trim)" stroke-width="1.5" fill="none"/>
      ${[-70, -42, -14, 14, 42, 70].map((cx, i) => `<path d="M${cx - 8} ${-48 + Math.abs(cx) / 9} l8 14 8 -14z" fill="${["#e05a7a", "#f2c84b", "#4fc3f7", "#8fd6b4", "#ce93d8", "#ffb347"][i]}"/>`).join("")}
      <rect x="-86" y="10" width="24" height="7" rx="2" fill="var(--k-beam)"/><rect x="62" y="10" width="24" height="7" rx="2" fill="var(--k-beam)"/>
    </g>`,
  academy: ({ x, y }) => `
    <g transform="translate(${x} ${y})">
      <rect x="-56" y="-30" width="112" height="66" rx="4" fill="var(--k-stone)"/>
      <rect x="-20" y="-96" width="40" height="70" rx="4" fill="var(--k-stone-light)"/>
      <path d="M-28 -94 L0 -138 L28 -94 Z" fill="var(--k-roof-blue)"/>
      ${win(-7, -78, 14, 20)}
      <path d="M-64 -28 L-30 -52 H30 L64 -28 Z" fill="var(--k-roof-blue)"/>
      ${win(-46, -12)}${win(32, -12)}
      <rect x="-12" y="6" width="24" height="30" rx="3" fill="var(--k-door)"/>
      <g transform="translate(-10 -46)"><path d="M0 0 h20 v12 l-10 -4 -10 4z" fill="var(--k-sign)"/></g>
    </g>`,
};

function scene(creature, ageMonths) {
  const p = Object.fromEntries(PLACES.map((pl) => [pl.id, at(pl)]));
  const cot = p.cottage;
  const pathTo = (q) => `M${cot.x} ${cot.y + 40} Q${(cot.x + q.x) / 2} ${Math.max(cot.y, q.y) + 70} ${q.x} ${q.y + 44}`;
  const critter = creatureSvg(creature, { size: 96, ageMonths, label: "" }).replace("<svg ", `<svg x="${cot.x + 50}" y="${cot.y - 52}" `);
  return `<svg class="kingdom-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs><linearGradient id="k-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--k-sky-top)"/><stop offset="1" stop-color="var(--k-sky-bot)"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#k-sky)"/>
    <g class="k-stars">${[[80, 40], [220, 70], [340, 30], [610, 50], [720, 24], [880, 60], [940, 30], [160, 110], [800, 110]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff4c2"/>`).join("")}</g>
    <circle cx="320" cy="66" r="32" fill="var(--k-sun)"/>
    <path d="M430 130 v-38 h14 v-14 h12 v14 h16 v-26 l14 -14 14 14 v26 h16 v-14 h12 v14 h14 v38z" fill="var(--k-castle)"/>
    <path d="M0 210 Q180 120 360 190 T720 170 T1000 190 V600 H0 Z" fill="var(--k-hill-back)"/>
    <path d="M0 290 Q240 220 500 270 T1000 260 V600 H0 Z" fill="var(--k-hill)"/>
    <path d="M0 560 Q250 520 500 560 T1000 540 V600 H0 Z" fill="var(--k-water)" opacity="0.8"/>
    ${PLACES.filter((pl) => pl.id !== "cottage").map((pl) => `<path d="${pathTo(p[pl.id])}" stroke="var(--k-path)" stroke-width="16" fill="none" stroke-linecap="round"/>`).join("")}
    ${tree(70, 250, 0.9)}${tree(300, 250, 0.8)}${tree(660, 240, 0.85)}${tree(930, 250, 0.9)}${tree(240, 470, 1)}${tree(760, 520, 0.9)}${tree(980, 470, 0.8)}${tree(40, 530, 1)}
    ${PLACES.map((pl) => BUILDINGS[pl.id](p[pl.id])).join("")}
    ${critter}
  </svg>`;
}

// status: placeStatus() result. onOpen(place) runs when a place is chosen.
export function kingdomMap({ creature, ageMonths, status, onOpen }) {
  const placeButton = (pl, inList) => {
    const st = status[pl.id] || { text: "", tone: "calm" };
    return h(
      inList ? "button.place-row" : "button.place",
      {
        type: "button",
        class: `tone-${st.tone}`,
        style: inList ? null : { left: `${pl.x}%`, top: `${pl.y}%` },
        "aria-label": `${pl.name}. ${pl.does}. ${st.text}`,
        onclick: () => onOpen(pl),
      },
      h("span.place-name", icon(pl.icon, { size: 18 }), ` ${pl.name}`),
      st.text ? h("span.place-badge", st.tone === "warn" ? icon("alert", { size: 14 }) : st.tone === "action" ? icon("sparkle", { size: 14 }) : null, ` ${st.text}`) : null,
      inList ? h("small.place-does", pl.does) : null
    );
  };
  return h(
    "section.kingdom",
    { "aria-label": "The Kingdom of Coinhaven" },
    h("div.kingdom-stage", { html: scene(creature, ageMonths) }, PLACES.map((pl) => placeButton(pl, false))),
    h("div.kingdom-list", PLACES.map((pl) => placeButton(pl, true)))
  );
}
