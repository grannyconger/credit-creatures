// Drawings for the Creature Cottage room (docs/UI-REBUILD.md). Generated SVG
// only, so it goes through h(..., { html }). Every color is a Bestiary token
// (never a raw color), so light, dark and dyslexia modes keep working.
// One drawing per object, and a variant picks the palette. No student text here.
import { DECOR_BY_ID, DEFAULT_COTTAGE } from "../data/cottage.js";

const f = (c) => `style="fill:var(--b-${c})"`;
const s = (c, w = 2) => `style="fill:none;stroke:var(--b-${c});stroke-width:${w};stroke-linecap:round;stroke-linejoin:round"`;
const fs = (fill, stroke, w = 2) => `style="fill:var(--b-${fill});stroke:var(--b-${stroke});stroke-width:${w};stroke-linejoin:round"`;
const svg = (vb, body, cls = "") => `<svg class="room-art ${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${body}</svg>`;

function variantOf(cottage, slot) {
  return DECOR_BY_ID[cottage[slot]]?.variant || "none";
}

// ---- The room itself: wall, floor, and the slots that aren't buttons. ----
const WALL = { moss: "moss-3", cream: "paper-2", plum: "plum", dots: "paper-2", stripes: "paper-2" };
const FLOOR = { oak: "peg", slate: "ink-soft", moss: "moss-stalk", checker: "paper-edge" };

export function roomSvg(cottage, crop = null) {
  const wall = variantOf(cottage, "wallpaper");
  const floor = variantOf(cottage, "floor");
  const rug = variantOf(cottage, "rug");
  let body = `<rect width="800" height="360" ${f(WALL[wall])}/>`;
  if (wall === "dots") for (let y = 20; y < 340; y += 40) for (let x = (y / 40) % 2 ? 20 : 40; x < 800; x += 40) body += `<circle cx="${x}" cy="${y}" r="5" ${f("rust")} opacity=".45"/>`;
  if (wall === "stripes") for (let x = 0; x < 800; x += 64) body += `<rect x="${x}" width="32" height="360" ${f("moss-2")} opacity=".4"/>`;
  body += `<rect y="342" width="800" height="18" ${f("peg-line")}/>`;
  body += `<rect y="360" width="800" height="160" ${f(FLOOR[floor])}/>`;
  if (floor === "oak") for (let y = 390; y < 520; y += 32) body += `<path d="M0 ${y}H800" ${s("peg-line", 1.5)} opacity=".55"/>`;
  if (floor === "slate" || floor === "moss") for (let y = 360; y < 520; y += 40) for (let x = (y / 40) % 2 ? 0 : 50; x < 800; x += 100) body += `<rect x="${x}" y="${y}" width="100" height="40" ${fs(FLOOR[floor], "shadow-ink", 1.5)} opacity=".6"/>`;
  if (floor === "checker") for (let y = 360, r = 0; y < 520; y += 40, r++) for (let x = r % 2 ? 40 : 0; x < 800; x += 80) body += `<rect x="${x}" y="${y}" width="40" height="40" ${f("ink-soft")} opacity=".5"/>`;
  if (rug !== "none") {
    const col = { gold: "gold", rust: "rust", plum: "plum", fern: "fern" }[rug];
    const round = rug === "gold" || rug === "rust";
    body += `<ellipse cx="400" cy="450" rx="${round ? 120 : 170}" ry="${round ? 36 : 30}" ${fs(col, "ink-soft", 2)}/><ellipse cx="400" cy="450" rx="${round ? 90 : 135}" ry="${round ? 24 : 20}" ${s("paper", 2)} opacity=".7"/>`;
  }
  body += artSvg(variantOf(cottage, "art"));
  body += lampSvg(variantOf(cottage, "lamp"));
  body += plantSvg(variantOf(cottage, "plant"));
  if (crop) return svg(crop, body, "room-bg");
  return svg("0 0 800 520", body, "room-bg").replace('preserveAspectRatio="xMidYMid meet"', 'preserveAspectRatio="none"');
}

// A small picture of one piece, for the Dock and the Market. Window and shelf
// pieces use their own drawings. The rest show a crop of the room.
const CROP = { wallpaper: "0 0 800 520", floor: "0 0 800 520", rug: "180 360 440 160", art: "430 150 110 100", lamp: "556 200 90 170", plant: "670 335 110 120" };
export function decorThumb(decor) {
  const cottage = { ...DEFAULT_COTTAGE, [decor.slot]: decor.id };
  if (decor.slot === "window" || decor.slot === "shelf") return OBJECT_ART[decor.slot](cottage);
  return roomSvg(cottage, CROP[decor.slot]);
}

function artSvg(v) {
  if (v === "none") return "";
  const frame = (inner) => `<g transform="translate(448 166)"><rect width="80" height="73" ${fs("paper", "peg-line", 4)}/><rect x="8" y="8" width="64" height="57" ${f("paper-insert")}/>${inner}</g>`;
  if (v === "fern") return frame(`<path d="M40 60V16M40 24c-10 0-16 4-18 10M40 24c10 0 16 4 18 10M40 36c-9 0-14 3-16 9M40 36c9 0 14 3 16 9M40 48c-7 0-11 3-13 7M40 48c7 0 11 3 13 7" ${s("fern", 2.5)}/>`);
  if (v === "moon") return frame(`<path d="M52 38a14 14 0 1 1-14-18 11 11 0 0 0 14 18z" ${fs("gold", "gold-ink", 2)}/><circle cx="24" cy="24" r="1.8" ${f("plum")}/><circle cx="56" cy="22" r="1.5" ${f("plum")}/>`);
  if (v === "coin") return frame(`<circle cx="40" cy="36" r="18" ${fs("gold", "gold-ink", 3)}/><path d="M40 26v20M34 31c0-4 12-4 12 0s-12 5-12 9 12 4 12 0" ${s("gold-ink", 2.5)}/>`);
  return `<g transform="translate(448 166)"><path d="M6 0h68L40 73z" ${fs("rust", "seal-deep", 3)}/><path d="M40 14l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" ${f("gold")}/></g>`;
}

function lampSvg(v) {
  if (v === "none") return "";
  const shade = v === "rust" ? "rust" : "gold";
  if (v === "lantern") return `<g transform="translate(576 208)"><path d="M24 0v10M14 10h20" ${s("ink", 3)}/><path d="M12 18h24l-3 70H15z" ${fs("paper-insert", "ink", 3)}/><path d="M24 40c8 8 8 20 0 28-8-8-8-20 0-28z" ${f("foxfire")}/><path d="M10 88h28v8H10zM24 96v52M10 148h28" ${s("ink", 4)}/></g>`;
  return `<g transform="translate(576 208)"><path d="M8 0h32l8 44H0z" ${fs(shade, "ink", 3)}/><path d="M24 44v104M8 148h32" ${s("ink", 4)}/></g>`;
}

function plantSvg(v) {
  if (v === "none") return "";
  const pot = `<path d="M18 74h44l-6 30H24z" ${fs("rust", "seal-deep", 3)}/>`;
  const bodies = {
    fern: `<path d="M40 74V18M40 30c-14 0-22 6-26 16M40 30c14 0 22 6 26 16M40 48c-12 0-19 5-22 13M40 48c12 0 19 5 22 13" ${s("fern", 5)}/>`,
    cactus: `<rect x="30" y="26" width="20" height="50" rx="10" ${fs("moss-1", "moss-3", 3)}/><path d="M30 46h-8V34M50 54h8V42" ${s("moss-1", 6)}/><circle cx="40" cy="22" r="4" ${f("rust")}/>`,
    sprout: `<path d="M40 74V40" ${s("fern", 5)}/><circle cx="30" cy="36" r="12" ${fs("bill", "bill-edge", 3)}/><circle cx="50" cy="30" r="12" ${fs("bill", "bill-edge", 3)}/><path d="M30 32v8M50 26v8" ${s("bill-edge", 2)}/>`,
    bonsai: `<path d="M40 74c0-14 6-18 6-30" ${s("peg-line", 6)}/><circle cx="30" cy="38" r="14" ${f("moss-2")}/><circle cx="52" cy="32" r="16" ${f("moss-1")}/><circle cx="42" cy="22" r="11" ${f("moss-3")}/>`,
  };
  return `<g transform="translate(688 343)">${bodies[v]}${pot}</g>`;
}

// ---- Objects the student can click. Each has its own small drawing. ----
const SKY = { day: ["paper-insert", "foxfire"], dusk: ["seal-shine", "rust"], night: ["ink", "gold"], hills: ["paper-2", "moss-2"] };

export const OBJECT_ART = {
  window: (cottage) => {
    const v = variantOf(cottage, "window");
    const [sky, accent] = SKY[v];
    const extra =
      v === "night"
        ? `<circle cx="30" cy="30" r="2" ${f("paper")}/><circle cx="68" cy="24" r="1.6" ${f("paper")}/><circle cx="52" cy="46" r="1.4" ${f("paper")}/><path d="M64 60a9 9 0 1 1-9-12 7 7 0 0 0 9 12z" ${f(accent)}/>`
        : v === "hills"
          ? `<path d="M6 80c14-24 28-24 40-8 14-18 30-20 48 4v14H6z" ${f(accent)}/>`
          : v === "dusk"
            ? `<circle cx="50" cy="70" r="16" ${f("gold")}/><rect x="6" y="76" width="88" height="18" ${f(accent)} opacity=".6"/>`
            : `<circle cx="70" cy="30" r="12" ${f("gold")}/><path d="M6 86c18-10 34-10 88 0v8H6z" ${f(accent)}/>`;
    return svg("0 0 100 100", `<rect x="3" y="3" width="94" height="94" rx="3" ${fs("peg", "peg-line", 4)}/><rect x="9" y="9" width="82" height="82" ${f(sky)}/>${extra}<path d="M50 9v82M9 50h82" ${s("peg-line", 4)}/>`);
  },
  poster: () => svg("0 0 60 78", `<rect x="2" y="2" width="56" height="74" ${fs("paper-insert", "ink-soft", 3)}/><path d="M30 14l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" ${f("gold")}/><path d="M14 56h32M18 64h24" ${s("ink-soft", 3)}/><circle cx="6" cy="6" r="3" ${f("rust")}/><circle cx="54" cy="6" r="3" ${f("rust")}/>`),
  shelf: (cottage) => {
    const v = variantOf(cottage, "shelf");
    const item = {
      none: "",
      books: `<rect x="66" y="40" width="26" height="7" ${fs("plum", "ink", 1.5)}/><rect x="68" y="33" width="22" height="7" ${fs("rust", "ink", 1.5)}/><rect x="66" y="26" width="26" height="7" ${fs("moss-2", "ink", 1.5)}/>`,
      coins: `<ellipse cx="78" cy="45" rx="10" ry="3.5" ${fs("gold", "gold-ink", 1.5)}/><ellipse cx="78" cy="40" rx="10" ry="3.5" ${fs("gold", "gold-ink", 1.5)}/><ellipse cx="78" cy="35" rx="10" ry="3.5" ${fs("gold", "gold-ink", 1.5)}/><ellipse cx="78" cy="30" rx="10" ry="3.5" ${fs("gold", "gold-ink", 1.5)}/>`,
      clock: `<circle cx="78" cy="34" r="12" ${fs("paper", "ink", 2)}/><path d="M78 34V26M78 34l6 3" ${s("ink", 2)}/>`,
      teapot: `<path d="M68 44c-4-14 4-20 12-20s14 6 10 20z" ${fs("plum", "ink", 2)}/><path d="M90 32c8-2 8 8 0 8M68 34l-7-4" ${s("ink", 2)}/>`,
    }[v];
    return svg("0 0 100 66", `<path d="M10 48h54l-4-24c-2-8-8-10-12-10h-2c-4 0-10 2-12 10z" ${fs("gold", "gold-ink", 2.5)}/><path d="M37 48v-8M28 48h18" ${s("gold-ink", 2.5)}/>${item}<rect x="2" y="48" width="96" height="9" ${fs("peg", "peg-line", 2.5)}/><path d="M12 57v8M88 57v8" ${s("peg-line", 3)}/>`);
  },
  mailbox: () => svg("0 0 50 57", `<path d="M25 44v12" ${s("peg-line", 4)}/><path d="M6 44V22a19 19 0 0 1 38 0v22z" ${fs("rust", "seal-deep", 3)}/><path d="M12 28h26" ${s("seal-deep", 2.5)}/><path d="M44 18V6h-9v12" ${fs("gold", "gold-ink", 2)}/>`),
  door: () => svg("0 0 50 128", `<path d="M4 126V30C4 10 14 3 25 3s21 7 21 27v96z" ${fs("peg", "peg-line", 3.5)}/><path d="M10 120V32c0-14 6-22 15-22s15 8 15 22v88z" ${fs("peg", "peg-line", 1.5)} opacity=".7"/><circle cx="37" cy="72" r="3.5" ${f("gold")}/><circle cx="25" cy="34" r="8" ${fs("paper-insert", "peg-line", 2)}/><path d="m27.5 31.5-2 5-5 2 2-5z" ${f("rust")}/>`),
  arcade: () => svg("0 0 50 97", `<path d="M5 95V12c0-6 4-9 9-9h22c5 0 9 3 9 9v83z" ${fs("plum", "ink", 3)}/><rect x="11" y="10" width="28" height="26" rx="3" ${fs("ink", "ink-soft", 2)}/><path d="M18 26l6-10 6 10" ${s("foxfire", 2.5)}/><rect x="9" y="50" width="32" height="10" ${fs("ink-soft", "ink", 2)}/><circle cx="19" cy="48" r="4" ${f("rust")}/><circle cx="32" cy="48" r="3" ${f("gold")}/><path d="M25 62v10M16 76h18v19H16z" ${s("ink", 2)}/>`),
  desk: () => svg("0 0 100 91", `<rect x="4" y="34" width="92" height="9" ${fs("peg", "peg-line", 3)}/><path d="M10 43v46M90 43v46M10 62h24v27" ${s("peg-line", 4)}/><path d="M26 34l-2-12 24 3 24-3-2 12z" ${fs("paper", "ink-soft", 2.5)}/><path d="M48 25v9M32 28l12 1M64 28l-12 1" ${s("ink-soft", 1.5)}/><path d="M74 34l6-20 4 20" ${fs("gold", "gold-ink", 2)}/>`),
  jar: () => svg("0 0 30 33", `<rect x="7" y="2" width="16" height="5" rx="1.5" ${fs("peg", "peg-line", 1.5)}/><path d="M6 8h18v19a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" ${fs("paper-insert", "ink-soft", 1.8)} opacity=".95"/><circle cx="12" cy="25" r="3.5" ${fs("gold", "gold-ink", 1.2)}/><circle cx="19" cy="26" r="3.5" ${fs("coin-silver", "coin-edge", 1.2)}/><circle cx="15" cy="20" r="3.5" ${fs("coin-copper", "coin-edge", 1.2)}/>`),
  bills: () => svg("0 0 100 89", `<ellipse cx="50" cy="44" rx="44" ry="11" ${fs("peg", "peg-line", 3)}/><path d="M48 54v30M30 86h40" ${s("peg-line", 4)}/><rect x="22" y="24" width="30" height="20" ${fs("paper", "ink-soft", 2)} transform="rotate(-8 37 34)"/><path d="m22 26 15 10 15-10" ${s("ink-soft", 1.5)} transform="rotate(-8 37 34)"/><rect x="50" y="22" width="30" height="20" ${fs("paper-insert", "rust", 2)} transform="rotate(7 65 32)"/><path d="M56 30h18M56 36h12" ${s("rust", 2)} transform="rotate(7 65 32)"/>`),
};
