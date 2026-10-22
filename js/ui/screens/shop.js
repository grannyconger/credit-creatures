// The Shop (SPEC §18): wants for the creature. Stock rotates each chapter.
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
  const stock = stockFor(run.life.seed, chapter).map((id) => SHOP_BY_ID[id]);
  track("shopOpen", { chapter, items: stock.length });
  if (play.prologue && !play.prologue.marketVisited && !run.practice) {
    play.prologue.marketVisited = true;
    game.persist("prologueMarket");
  }

  function paint(buying = null) {
    const c = game.save.creature;
    fill(
      panel,
      placeHeader({ go, iconName: "market", kicker: play.prologue && !play.prologue.done ? "Opening day stock" : `Chapter ${chapter} stock`, title: "Shimmer Market", subtitle: "Spend money on things for your creature. Time is paused while you shop. New stock every chapter.", practice: run.practice }),
      moneyChips(run.life, play),
      buying ? checkout(buying, c) : h("div.shop-grid", stock.map((item) => card(item, c))),
      h("p.note.center", "Wants are fun, but check your bills first. Things you buy show up in the creature editor and on your hub.")
    );
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
      h("p.shop-price", h("span.bst-tag-hole", { "aria-hidden": "true" }), money(item.price)),
      owned
        ? h("p.good-text", "✓ You own this")
        : h("button", { type: "button", onclick: () => (track("shopView", { id: item.id }), paint(item)) }, "Buy")
    );
  }

  function checkout(item, c) {
    const methods = item.price >= BNPL_MIN ? ["debit", "card", "bnpl"] : ["debit", "card"];
    const box = h("div.checkout", h("h2", `${item.name}: ${money(item.price)}`));
    if (item.big) add(box, h("p.callout.warn", "This is a big purchase. Putting it on a card can push your utilization way up, and BNPL payments come out of checking at the next End Months."));
    add(
      box,
      payWith({
        life: run.life,
        cost: { amount: item.price, item: item.name, methods, merchant: "Shimmer Market" },
        allowed: payMethods(play, run.life),
        piggy: !hasFeature(play, "debit"),
        onBack: () => paint(),
        onPick: async (method) => {
          const r = resolveChoice(run.life, { cost: { amount: item.price, item: `shop: ${item.name}`, merchant: "Shimmer Market" } }, method);
          if (!r.ok) {
            toast(r.message, "bad");
            return paint(item);
          }
          run.life = r.life;
          burstFrom(document.querySelector(".checkout") , "dust", { n: 18 });
          play.owned.push(item.id);
          track("shopBuy", { id: item.id, price: item.price, method: method.startsWith("card:") ? "card" : method, big: Boolean(item.big) });
          sfx.purchase();
          toast(`You bought the ${item.name.toLowerCase()} with ${methodLabel(method, run.life)}.`, "good");
          await run.persist("shop");
          paint();
          if (!run.practice) wear(item);
        },
      })
    );
    return box;
  }

  // Offer to put it on right away.
  function wear(item) {
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
