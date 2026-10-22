// The Vault: Account Management (SPEC §14). Time is paused here:
// nothing on these tabs ends a month. It opens from the kingdom and goes back there.
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { placeHeader } from "../place-header.js";
import * as P from "../../play.js";
import { hasFeature, prologueStep, openBankAccount } from "../../progression.js";
import { money } from "../dom.js";
import { CONFIG } from "../../data/config.js";
import { creatureSvg } from "../creature-art.js";
import { GUIDE } from "../../data/lessons.js";
import { walletTab } from "../accounts/wallet-tab.js";
import { sealSvg } from "../bestiary-art.js";
import { statementsTab } from "../accounts/statements-tab.js";
import { scoreTab } from "../accounts/score-tab.js";
import { reportTab } from "../accounts/report-tab.js";
import { inboxTab } from "../accounts/inbox-tab.js";

// [key, icon, label, tab, feature]. A tab shows once its feature is unlocked
// (js/progression.js). The score and the report moved to the Hall of Records.
const VAULT_TABS = [
  ["wallet", "wallet", "Wallet", walletTab, "vault"],
  ["statements", "statement", "Statements", statementsTab, "statements"],
  ["inbox", "inbox", "Inbox", inboxTab, "inbox"],
];
export const RECORDS_TABS = [
  ["score", "gauge", "My Score", scoreTab, "score"],
  ["report", "report", "My Report", reportTab, "report"],
];

export function render(root, ctx) {
  if (prologueStep(ctx.game.play)?.place === "vault") return bankOpening(root, ctx);
  return tabbedPlace(root, ctx, {
    tabs: VAULT_TABS,
    stateKey: "accountsTab",
    iconName: "vault",
    title: "The Vault",
    subtitle: "Your bank. Move money, pay bills and read your letters. Time is paused here.",
  });
}

// A place made of tabs (the Vault and the Hall of Records).
export function tabbedPlace(root, { game, go, track, refreshWho }, { tabs, stateKey, iconName, title, subtitle }) {
  const run = game.run;
  const play = run.play;
  const TABS = tabs.filter((t) => hasFeature(play, t[4], run.life));
  if (!TABS.some(([k]) => k === game[stateKey])) game[stateKey] = TABS[0][0];
  const shell = h("section.panel.accounts");
  const body = h("div.acct-body", { id: "acct-body", role: "tabpanel" });
  // A page of the Mossy Bestiary (2026-10-22): a bank passbook, with its
  // tabs as index tabs on the page's right edge.
  root.append(h(`div.bestiary.bst-book-place.${iconName === "vault" ? "bst-vault" : "bst-records"}`, shell));

  const ctx = {
    game,
    run,
    track,
    go,
    async save(reason) {
      refreshWho();
      await run.persist(reason);
    },
    repaint: () => paint(),
  };

  function paint() {
    const tab = game[stateKey];
    const unread = P.unreadCount(play);
    fill(
      shell,
      placeHeader({ go, iconName, title, subtitle, practice: run.practice }),
      TABS.length > 1
        ? h(
            "nav.acct-tabs",
            { "aria-label": title },
            TABS.map(([key, ico, label]) =>
              h(
                "button",
                {
                  type: "button",
                  "aria-current": key === tab ? "page" : null,
                  "aria-controls": "acct-body",
                  onclick: () => {
                    game[stateKey] = key;
                    track("accountsTab", { tab: key });
                    paint();
                  },
                },
                icon(ico),
                ` ${label}`,
                key === "inbox" && unread ? h("span.count-badge", { "aria-label": `${unread} unread`, "data-sparkle": "" }, String(unread)) : null
              )
            )
          )
        : null,
      fill(body, TABS.find(([k]) => k === tab)[3](ctx))
    );
  }

  paint();
}

// The end of the prologue: the piggy bank goes into a real bank account.
function bankOpening(root, { game, go, track, refreshWho }) {
  const play = game.play;
  const coins = game.life.checking;
  const options = [0, Math.floor(coins * 0.25), Math.floor(coins * 0.5)].filter((v, i, a) => a.indexOf(v) === i);
  let toSavings = options[1] ?? 0;
  const panel = h("section.panel.place-screen.bank-open");
  root.append(h("div.bestiary.bst-book-place.bst-vault", panel));
  track("bankOpenView", { coins });

  function paint() {
    const open = h(
      "button.big.bst-seal-btn",
      { type: "button", "data-sound": "none" },
      h("span.bst-seal-wax", { html: sealSvg({ seed: 43, size: 84, letter: "V" }) }),
      h("span.bst-seal-text", "Open my accounts")
    );
    open.addEventListener("click", async () => {
      open.disabled = true;
      const r = openBankAccount(play, game.life, { toSavings });
      game.life = r.life;
      track("bankOpened", { coins, toSavings });
      refreshWho();
      await game.persist("bankOpened");
      go("hub");
    });
    fill(
      panel,
      placeHeader({ go, iconName: "vault", title: "The Vault", subtitle: "Coinhaven's oldest bank. Your piggy bank is about to get an upgrade." }),
      h("div.bank-sage", h("span", { html: creatureSvg(GUIDE.look, { size: 80, label: "" }) }), h("p", `"A piggy bank can't pay bills, can't keep your coins safe, and can't help you save. The Vault can. Let's open your first accounts." `, h("strong", `${GUIDE.name}`))),
      h(
        "div.bank-accounts",
        h("article", h("h3", icon("vault", { size: 20 }), " Checking"), h("p", "For spending. Your debit card takes money straight from it, and bills come out of it at the end of each month.")),
        h("article", h("h3", icon("piggy", { size: 20 }), " Savings"), h("p", "For later. Money here is set aside for emergencies and your creature's dream.")),
        h("article", h("h3", icon("card", { size: 20 }), " Debit card"), h("p", "Pays from checking. You can only spend what you have, so it can't put you in debt."))
      ),
      h("h3", `Your piggy bank has ${money(coins)}. How much goes to savings?`),
      h(
        "div.chip-group",
        { role: "group", "aria-label": "Amount for savings" },
        options.map((v) => h("button.chip", { type: "button", "aria-pressed": String(v === toSavings), onclick: () => ((toSavings = v), paint()) }, v ? money(v) : "Nothing yet"))
      ),
      h("p.note.tight", `${money(coins - toSavings)} goes to checking and ${money(toSavings)} to savings. Your first bill is a ${money(CONFIG.bills.teenPhone)} phone plan, paid from checking each month.`),
      h("div.row", open)
    );
  }
  paint();
}
