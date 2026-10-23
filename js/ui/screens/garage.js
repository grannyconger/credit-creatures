// The Garage (Phase 10, Chapter 2): buy a ride with cash or an auto loan.
// Every loan shows the monthly payment, the APR, the interest and the total
// cost before you decide. A ride raises your pay per shift.
// A page of the Mossy Bestiary (2026-10-23): the lot is a row of parking bays
// with the rides drawn in ink and a painted price board on each. The three
// loan numbers hang on a brass plate, and the ride you own is a registration
// slip. The deal sheet itself is the shared loan picker.
import { h, add, fill, money, toast } from "../dom.js";
import { icon } from "../icons.js";
import { placeHeader } from "../place-header.js";
import { moneyChips } from "../wallet.js";
import { celebrate } from "../celebrate.js";
import { resolveChoice } from "../../engine/index.js";
import { VEHICLES, VEHICLE_BY_ID, vehicleQuote, vehicleSteps, sellSteps } from "../../data/garage.js";
import { loanPicker } from "../loan-picker.js";
import { rideSvg } from "../bestiary-art.js";

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const play = run.play;
  const panel = h("section.panel.place-screen.garage");
  root.append(h("div.bestiary.bst-garage", panel));
  track("garageOpen", { has: play.garage?.vehicle || "" });

  function paint() {
    const life = run.life;
    const mine = VEHICLE_BY_ID[play.garage?.vehicle];
    fill(
      panel,
      placeHeader({ go, iconName: "car", title: "The Garage", subtitle: "Buy a ride with cash or a loan. A ride gets you to better jobs, so every shift pays more.", practice: run.practice, aside: moneyChips(life, play) }),
      // The brass plate screwed to the garage wall.
      h(
        "section.gr-plate",
        { "aria-labelledby": "gr-plate-title" },
        h("h2", { id: "gr-plate-title" }, "Every loan has three numbers to check"),
        h(
          "dl.gr-plate-three",
          h("div", h("dt", "APR"), h("dd", "The yearly cost of borrowing.")),
          h("div", h("dt", "Term"), h("dd", "How many months you pay.")),
          h("div", h("dt", "Total cost"), h("dd", "Every payment added up, plus the down payment."))
        ),
        h("p.gr-plate-note", "A longer term means smaller payments but more interest in the end. A loan's payment comes out of checking at every End Month.")
      ),
      mine ? owned(mine) : null,
      h("h2.gr-lot-title", mine ? "The lot" : "Pick a ride"),
      h("div.gr-lot", VEHICLES.map((v) => rideCard(v, mine))),
      h("p.bst-margin.gr-margin", "The shiny new car goes to the same jobs as the used one. It just costs three times as much to get there.")
    );
  }

  function owned(v) {
    const loan = run.life.accounts.find((a) => a.type === "autoLoan" && a.status === "open");
    const sell = h("button.secondary.small", { type: "button" }, `Sell it for ${money(Math.round(v.price / 2))}`);
    sell.addEventListener("click", async () => {
      if (!confirm(`Sell your ${v.name.toLowerCase()} for ${money(Math.round(v.price / 2))}?${loan ? " Your auto loan keeps going until it's paid off." : ""}`)) return;
      const r = resolveChoice(run.life, { steps: sellSteps(run.life, v) });
      if (!r.ok) return toast(r.message, "bad");
      run.life = r.life;
      play.garage = null;
      track("garageSell", { vehicle: v.id, hadLoan: Boolean(loan) });
      refreshWho();
      await run.persist("garageSell");
      paint();
    });
    // The registration slip for the ride you own.
    return h(
      "section.gr-slip",
      h("span.gr-slip-art", { html: rideSvg(v.id, { width: 180 }) }),
      h(
        "div",
        h("p.gr-slip-kicker", "Registered to you"),
        h("h2", `Your ${v.name.toLowerCase()}`),
        h("p.tight", `+${money(v.bonus)} on every shift.${v.bill ? ` ${v.bill[0]}: ${money(v.bill[1])} a month.` : ""}`),
        loan ? h("p.tight", icon("receipt", { size: 14 }), ` Auto loan: ${money(loan.balance)} left, ${money(loan.payment)} a month.`) : h("p.tight.good-text", "Paid off. It's all yours."),
        h("div.row", sell)
      )
    );
  }

  function rideCard(v, mine) {
    // One parking bay: the ride in ink, its painted price board, and the deal sheet.
    const card = h(
      "article.gr-bay",
      { "data-ride": v.id, class: mine?.id === v.id ? "is-mine" : null },
      h("span.gr-board", money(v.price)),
      h("span.gr-art", { html: rideSvg(v.id) }),
      h("h3", v.name),
      h("p.gr-bonus", h("strong", `+${money(v.bonus)}`), " on every shift"),
      h("p.gr-about", v.about)
    );
    if (mine) return add(card, h("p.gr-taken", mine.id === v.id ? "You own this one." : "Sell your ride first to buy another."));
    const buy = async (plan) => {
      const r = resolveChoice(run.life, { steps: vehicleSteps(run.life, v, plan) });
      if (!r.ok) return toast(r.message, "bad");
      run.life = r.life;
      if (r.denied) {
        track("garageBuy", { vehicle: v.id, cash: Boolean(plan.cash), term: plan.term || 0, approved: false });
        await run.persist("garageDenied");
        toast(r.message, "bad");
        return paint();
      }
      play.garage = { vehicle: v.id, month: run.life.month, loan: !plan.cash };
      track("garageBuy", { vehicle: v.id, cash: Boolean(plan.cash), term: plan.term || 0, down: plan.down || 0, approved: true });
      celebrate({ kind: "ride", id: v.id, icon: v.icon, kicker: plan.cash ? "Paid in full!" : "Loan approved!", title: `Your new ${v.name.toLowerCase()}`, text: `Every shift now pays ${money(v.bonus)} more.${plan.cash ? "" : " Your first loan payment comes out at the next End Month."}` });
      refreshWho();
      await run.persist("garageBuy");
      paint();
    };
    return add(card, loanPicker({ life: run.life, item: v, quote: (plan) => vehicleQuote(run.life, v, plan), terms: v.loan?.terms, downs: v.loan?.downs, onBuy: buy, practice: run.practice }));
  }

  paint();
}
