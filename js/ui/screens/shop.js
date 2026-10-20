// The Shop (SPEC §18): wants for the creature. Stock rotates each chapter.
// Checkout uses the "Pay with" picker: debit, a credit card, or BNPL.
import { h, add, fill, money, toast } from "../dom.js";
import { resolveChoice } from "../../engine/index.js";
import { SHOP_BY_ID, stockFor, BNPL_MIN } from "../../data/shop.js";
import { creatureSvg } from "../creature-art.js";
import { payWith, methodLabel } from "../pay-with.js";
import { moneyChips } from "../wallet.js";

const KIND = { head: "Head", neck: "Neck", face: "Face", background: "Background" };

export function render(root, { game, go, track }) {
  const run = game.run;
  const play = run.play;
  const panel = h("section.panel.shop");
  root.append(panel);
  const chapter = play.active?.chapter ?? play.chapter;
  const stock = stockFor(run.life.seed, chapter).map((id) => SHOP_BY_ID[id]);
  track("shopOpen", { chapter, items: stock.length });

  function paint(buying = null) {
    const c = game.save.creature;
    fill(
      panel,
      run.practice ? h("p.callout.warn.practice", "🔁 Practice mode. Purchases here are not saved.") : null,
      h(
        "header.acct-head",
        h("div", h("p.step-label", `Chapter ${chapter} stock`), h("h1", "🛍️ Shimmer Market"), h("p.muted.tight", "⏸️ Time is paused while you shop. New stock every chapter.")),
        h("button.secondary", { type: "button", onclick: () => go(play.active ? "month" : "hub") }, play.active ? "← Back to this month" : "← Back to hub")
      ),
      moneyChips(run.life, play.sparkle.total),
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
      h("h3", `${item.icon} ${item.name}`),
      h("p.muted.tight", KIND[item.kind]),
      h("p.shop-price", money(item.price)),
      owned
        ? h("p.good-text", "✓ You own this")
        : h("button", { type: "button", onclick: () => (track("shopView", { id: item.id }), paint(item)) }, "Buy")
    );
  }

  function checkout(item, c) {
    const methods = item.price >= BNPL_MIN ? ["debit", "card", "bnpl"] : ["debit", "card"];
    const box = h("div.checkout", h("h2", `${item.icon} ${item.name}: ${money(item.price)}`));
    if (item.big) add(box, h("p.callout.warn", "This is a big purchase. Putting it on a card can push your utilization way up, and BNPL payments come out of checking at the next End Months."));
    add(
      box,
      payWith({
        life: run.life,
        cost: { amount: item.price, item: item.name, methods, merchant: "Shimmer Market" },
        onBack: () => paint(),
        onPick: async (method) => {
          const r = resolveChoice(run.life, { cost: { amount: item.price, item: `shop: ${item.name}`, merchant: "Shimmer Market" } }, method);
          if (!r.ok) return toast(r.message, "bad");
          run.life = r.life;
          play.owned.push(item.id);
          track("shopBuy", { id: item.id, price: item.price, method: method.startsWith("card:") ? "card" : method, big: Boolean(item.big) });
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
    panel.querySelector(".shop-grid")?.before(h("div.callout.good.center", h("p", `🎉 The ${item.name.toLowerCase()} is yours!`), h("div.row", btn)));
  }

  paint();
}
