// The Dock (docs/UI-REBUILD.md slice 3): everything the student owns, in one
// strip above the bottom bar. Tabs: All, Wear (creature items) and Home (Cottage
// pieces). Click a piece to use it, click again to take it off. No dragging,
// so keyboard users do everything mouse users do. Shows a page at a time.
import { h, clear } from "./dom.js";
import { icon } from "./icons.js";
import { creatureSvg } from "./creature-art.js";
import { decorThumb } from "./cottage-art.js";
import { SHOP_BY_ID } from "../data/shop.js";
import { DECOR_BY_ID, DEFAULT_COTTAGE, cottageOf } from "../data/cottage.js";

const PAGE = 6;
const TABS = [
  ["all", "All"],
  ["wear", "Wear"],
  ["home", "Home"],
];

const dock = document.getElementById("dock");
const button = document.getElementById("dock-btn");
let api = null;
let tab = "all";
let page = 0;

export function initDock({ getGame, go, track }) {
  api = { getGame, go, track };
  button.addEventListener("click", toggleDock);
  addEventListener("hashchange", closeDock);
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dock.hidden) closeDock();
  });
}

export function closeDock() {
  dock.hidden = true;
  button.setAttribute("aria-expanded", "false");
}

function toggleDock() {
  if (!dock.hidden) return closeDock();
  dock.hidden = false;
  button.setAttribute("aria-expanded", "true");
  api.track("dockOpen", { tab });
  paintDock();
}

// What the student owns, as one list.
function itemsOf(game) {
  const play = game.run.play;
  const c = game.save.creature;
  const worn = (i) => (i.kind === "background" ? c.background === i.id : c.accessories?.[i.kind] === i.id);
  const placed = cottageOf(play);
  const wear = (play.owned || []).map((id) => SHOP_BY_ID[id]).filter(Boolean).map((i) => ({ key: `w:${i.id}`, group: "wear", name: i.name, sub: i.kind === "background" ? "Background" : "Wear", on: worn(i), item: i }));
  const home = (play.decorOwned || []).map((id) => DECOR_BY_ID[id]).filter(Boolean).map((d) => ({ key: `h:${d.id}`, group: "home", name: d.name, sub: d.slot, on: placed[d.slot] === d.id, decor: d }));
  return [...wear, ...home];
}

// The little red number on the Dock button and the repaint after any change.
export function paintDockButton(game) {
  const inKingdom = game?.step === "hub";
  button.hidden = !inKingdom;
  if (!inKingdom) return closeDock();
  const n = itemsOf(game).length;
  button.querySelector(".dock-count").textContent = n ? String(n) : "";
  button.setAttribute("aria-label", n ? `Dock, ${n} things` : "Dock, empty");
  if (!dock.hidden) paintDock();
}

// A short wiggle when something new arrives from the Market.
export function flashDock() {
  button.classList.remove("flash");
  void button.offsetWidth;
  button.classList.add("flash");
}

function paintDock() {
  const game = api.getGame();
  if (!game?.run) return;
  const all = itemsOf(game);
  const list = tab === "all" ? all : all.filter((i) => i.group === tab);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  page = Math.min(page, pages - 1);
  const shown = list.slice(page * PAGE, page * PAGE + PAGE);

  const tabs = h(
    "div.dock-tabs",
    { role: "tablist", "aria-label": "Dock categories" },
    TABS.map(([id, label]) =>
      h("button", { type: "button", role: "tab", "aria-selected": id === tab ? "true" : "false", onclick: () => ((tab = id), (page = 0), paintDock()) }, label, h("small", ` ${id === "all" ? all.length : all.filter((i) => i.group === id).length}`))
    )
  );
  const row = shown.length
    ? shown.map((e) => entry(game, e))
    : [h("p.dock-empty", tab === "home" ? "No Cottage pieces yet. The Market sells wallpaper, rugs, lamps and more." : "Nothing here yet. Things you buy at the Market show up in your Dock.", h("button.small", { type: "button", onclick: () => (closeDock(), api.go("shop")) }, icon("market", { size: 16 }), " Go to the Market"))];
  clear(dock);
  dock.append(
    tabs,
    h(
      "div.dock-row",
      h("button.dock-page", { type: "button", "aria-label": "Earlier things", disabled: page === 0, onclick: () => (page--, paintDock()) }, icon("back", { size: 20 })),
      h("ul.dock-items", row.map((r) => (r.tagName === "P" ? r : h("li", r)))),
      h("button.dock-page", { type: "button", "aria-label": "Later things", disabled: page >= pages - 1, onclick: () => (page++, paintDock()) }, icon("next", { size: 20 }))
    ),
    h("button.dock-close", { type: "button", "aria-label": "Close the Dock", onclick: closeDock }, icon("down", { size: 18 }))
  );
}

function entry(game, e) {
  const c = game.save.creature;
  const art = e.item
    ? e.item.kind === "background"
      ? h("span.dock-bg", { class: `bg-${e.item.id}` }, h("span", { html: creatureSvg(c, { size: 44 }) }))
      : h("span", { html: creatureSvg({ ...c, accessories: { ...c.accessories, [e.item.kind]: e.item.id } }, { size: 64 }) })
    : h("span.dock-decor", { html: decorThumb(e.decor) });
  return h(
    "button.dock-item",
    { type: "button", "aria-pressed": e.on ? "true" : "false", onclick: () => use(game, e) },
    art,
    h("strong", e.name),
    h("small", e.on ? "In use. Click to take off" : e.group === "home" ? "Click to put in your room" : "Click to wear")
  );
}

async function use(game, e) {
  const c = game.save.creature;
  const play = game.run.play;
  if (e.item) {
    const i = e.item;
    if (i.kind === "background") c.background = e.on ? "none" : i.id;
    else {
      c.accessories = { ...c.accessories };
      if (e.on) delete c.accessories[i.kind];
      else c.accessories[i.kind] = i.id;
    }
  } else {
    play.cottage = { ...(play.cottage || {}), [e.decor.slot]: e.on ? DEFAULT_COTTAGE[e.decor.slot] : e.decor.id };
  }
  api.track("dockUse", { id: e.item?.id || e.decor.id, on: !e.on });
  await game.persist("dock");
  dispatchEvent(new CustomEvent("cc:decor"));
  paintDockButton(game);
}
