// The Shop (SPEC §18): wants for the creature. Stock changes every day.
// Checkout uses the "Pay with" picker: debit, a credit card, or BNPL.
import { payMethods, hasFeature } from "../../progression.js";
import { burstFrom } from "../motion/particles.js";
import { h, add, fill, money, toast } from "../dom.js";
import { placeHeader } from "../place-header.js";
import { resolveChoice } from "../../engine/index.js";
import { SHOP_BY_ID, stockFor, BNPL_MIN } from "../../data/shop.js";
import { creatureSvg } from "../creature-art.js";
import { payWith, methodLabel } from "../pay-with.js";
import { moneyChips } from "../wallet.js";
import { firstVisitLesson } from "../guide.js";
import { sfx } from "../sound.js";
import { DECOR, SLOTS, ownedDecor, cottageOf } from "../../data/cottage.js";
import { decorThumb } from "../cottage-art.js";
import { couponPrice } from "../../daily.js";
import { dayKey } from "../../engine/daily.js";
import { icon } from "../icons.js";

const KIND = { head: "Head", neck: "Neck", face: "Face", held: "Held in paw", feet: "Feet", effect: "Magic effect", background: "Background" };

export function render(root, { game, go, track }) {
  const run = game.run;
  const play = run.play;
  const panel = h("section.panel.shop");
  // A page of the Mossy Bestiary (2026-10-22): a market stall, with goods on
  // shelves under a striped awning and a string price tag on each.
  root.append(h("div.bestiary.bst-shop", h("div.bst-awning", { "aria-hidden": "true" }), panel));
  const chapter = play.active?.chapter ?? play.chapter;
  const stock = stockFor(run.life.seed, chapter, dayKey()).map((id) => SHOP_BY_ID[id]);
  track("shopOpen", { chapter, items: stock.length });
  if (play.prologue && !play.prologue.marketVisited && !run.practice) {
    play.prologue.marketVisited = true;
    game.persist("prologueMarket");
  }

  // Two shelves: things for the creature (new stock every day) and things
  // for the Cottage room (always on sale).
  let tab = "creature";
  const tabs = () =>
    h(
      "div.shop-tabs",
      { role: "tablist", "aria-label": "Market shelves" },
      [["creature", "For your creature"], ["home", "For your Cottage"]].map(([id, label]) =>
        h("button", { type: "button", role: "tab", "aria-selected": id === tab ? "true" : "false", onclick: () => ((tab = id), track("shopTab", { tab: id }), paint()) }, label)
      )
    );

  function paint(buying = null) {
    const c = game.save.creature;
    fill(
      panel,
      placeHeader({ go, iconName: "market", kicker: play.prologue && !play.prologue.done ? "Opening day stock" : `New stock today`, title: "Market", subtitle: "Spend money on things for your creature and your Cottage. Time is paused while you shop.", practice: run.practice, aside: moneyChips(run.life, play) }),
      buying ? null : tabs(),
      buying ? checkout(buying, c) : tab === "home" ? homeShelf() : h("div.shop-grid", stock.map((item) => card(item, c))),
      h("p.note.center", "Wants are fun, but check your bills first. Clothes you buy go in the closet at home. Room pieces go in Decorate your room.")
    );
  }

  // The price tag. A Daily Pick coupon crosses out the old price.
  function priceTag(price) {
    const now = couponPrice(play, price);
    return h("p.shop-price", h("span.bst-tag-hole", { "aria-hidden": "true" }), now < price ? [h("s", { "aria-label": `was ${money(price)}` }, money(price)), " ", h("strong", money(now)), h("small", ` ${play.coupon.pct}% off`)] : money(price));
  }

  function card(item, c) {
    const owned = play.owned.includes(item.id);
    const preview = item.kind === "background" ? h("div.shop-bg", { class: `bg-${item.id}` }, h("span", { html: creatureSvg(c, { size: 90 }) })) : h("span", { html: creatureSvg({ ...c, accessories: { ...c.accessories, [item.kind]: item.id } }, { size: 110 }) });
    return h(
      "article.shop-item",
      { class: item.big ? "big" : item.limited ? "limited" : "" },
      item.limited ? h("span.ribbon", "Only this chapter") : item.big ? h("span.ribbon.gold", "Big purchase") : null,
      h("div.shop-preview", preview),
      h("h3", item.name),
      h("p.muted.tight", KIND[item.kind]),
      priceTag(item.price),
      owned
        ? h("p.good-text", "✓ You own this")
        : h("button", { type: "button", onclick: () => (track("shopView", { id: item.id }), paint(item)) }, "Buy")
    );
  }

  // Cottage pieces by slot. Free starters aren't for sale.
  function homeShelf() {
    const own = ownedDecor(play);
    const placed = cottageOf(play);
    return h(
      "div.shop-home",
      SLOTS.map((slot) =>
        h(
          "section.shop-slot",
          h("h2", icon(slot.icon, { size: 18 }), ` ${slot.label}`),
          h(
            "div.shop-grid",
            DECOR.filter((d) => d.slot === slot.id && d.price > 0).map((d) =>
              h(
                "article.shop-item",
                h("div.shop-preview", h("span.shop-decor", { html: decorThumb(d) })),
                h("h3", d.name),
                priceTag(d.price),
                own.has(d.id)
                  ? h("p.good-text", placed[d.slot] === d.id ? "✓ In your room" : "✓ You own this. Place it with Decorate your room")
                  : h("button", { type: "button", onclick: () => (track("shopView", { id: d.id }), paint(d)) }, "Buy")
              )
            )
          )
        )
      )
    );
  }

  function checkout(item, c) {
    const price = couponPrice(play, item.price);
    const methods = price >= BNPL_MIN ? ["debit", "card", "bnpl"] : ["debit", "card"];
    const box = h("div.checkout", h("h2", `${item.name}: ${money(price)}${price < item.price ? ` (was ${money(item.price)})` : ""}`));
    if (item.big) add(box, h("p.callout.warn", "This is a big purchase. Putting it on a card can push your utilization way up, and BNPL payments come out of checking at the next End Months."));
    add(
      box,
      payWith({
        life: run.life,
        cost: { amount: price, item: item.name, methods, merchant: "Market" },
        allowed: payMethods(play, run.life),
        piggy: !hasFeature(play, "debit"),
        onBack: () => paint(),
        onPick: async (method) => {
          const r = resolveChoice(run.life, { cost: { amount: price, item: `shop: ${item.name}`, merchant: "Market" } }, method);
          if (!r.ok) {
            toast(r.message, "bad");
            return paint(item);
          }
          run.life = r.life;
          burstFrom(document.querySelector(".checkout") , "dust", { n: 18 });
          if (price < item.price) play.coupon = null;
          if (item.slot) (play.decorOwned ||= []).push(item.id);
          else play.owned.push(item.id);
          track("shopBuy", { id: item.id, price, method: method.startsWith("card:") ? "card" : method, big: Boolean(item.big) });
          sfx.purchase();
          toast(`You bought the ${item.name.toLowerCase()} with ${methodLabel(method, run.life)}.`, "good");
          await run.persist("shop");
          dispatchEvent(new CustomEvent("cc:decor"));
          paint();
          if (!run.practice) wear(item);
        },
      })
    );
    return box;
  }

  // Offer to put it on right away.
  function wear(item) {
    if (item.slot) {
      const put = h("button", { type: "button" }, "Put it in my room");
      put.addEventListener("click", async () => {
        play.cottage = { ...(play.cottage || {}), [item.slot]: item.id };
        track("shopPlace", { id: item.id });
        await game.persist("place");
        dispatchEvent(new CustomEvent("cc:decor"));
        paint();
      });
      panel.querySelector(".shop-home")?.before(h("div.callout.good.center", h("p", icon("sparkle", { size: 18 }), ` The ${item.name.toLowerCase()} is yours. You can move it any time with Decorate your room.`), h("div.row", put)));
      return;
    }
    const c = game.save.creature;
    const slot = item.kind === "background" ? "background" : item.kind;
    const btn = h("button", { type: "button" }, item.kind === "background" ? "Use it on my hub" : "Wear it now");
    btn.addEventListener("click", async () => {
      if (slot === "background") c.background = item.id;
      else c.accessories = { ...c.accessories, [slot]: item.id };
      track("shopWear", { id: item.id });
      await game.persist("wear");
      paint();
    });
    panel.querySelector(".shop-grid")?.before(h("div.callout.good.center", h("p", icon("sparkle", { size: 18 }), ` The ${item.name.toLowerCase()} is yours!`), h("div.row", btn)));
  }

  paint();
  firstVisitLesson({ game, track, id: "market", route: "shop" });
}
