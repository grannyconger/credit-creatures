// The Vault: Account Management (SPEC §14). Time is paused here:
// nothing on these tabs ends a month. It opens from the kingdom and goes back there.
// Reorganised 2026-10-25 around the jobs a person does with money, with sub-tabs
// where a tab holds several views (js/vault.js has the layout).
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import { placeHeader } from "../place-header.js";
import * as P from "../../play.js";
import { prologueStep, openBankAccount } from "../../progression.js";
import { money } from "../dom.js";
import { CONFIG } from "../../data/config.js";
import { creatureSvg } from "../creature-art.js";
import { GUIDE } from "../../data/lessons.js";
import { sealSvg } from "../bestiary-art.js";
import { vaultTabs, pickVaultTab, legacyVaultTab } from "../../vault.js";
import { overviewTab } from "../accounts/overview-tab.js";
import { payBillsTab } from "../accounts/paybills-tab.js";
import { saveTab } from "../accounts/save-tab.js";
import { debtTab } from "../accounts/debt-tab.js";
import { cardsTab } from "../accounts/credit-tab.js";
import { statementsTab } from "../accounts/statements-tab.js";
import { scoreTab } from "../accounts/score-tab.js";
import { reportTab } from "../accounts/report-tab.js";
import { protectTab } from "../accounts/protect-tab.js";
import { inboxTab } from "../accounts/inbox-tab.js";

// Which function draws each tab, or each sub-tab of Build Credit.
const VIEWS = {
  overview: overviewTab,
  paybills: payBillsTab,
  save: saveTab,
  debt: debtTab,
  protect: protectTab,
  messages: inboxTab,
  "credit:cards": cardsTab,
  "credit:statements": statementsTab,
  "credit:score": scoreTab,
  "credit:report": reportTab,
};

export function render(root, ctx) {
  if (prologueStep(ctx.game.play)?.place === "vault") return bankOpening(root, ctx);
  return vaultScreen(root, ctx);
}

// Opens the Vault on a tab (and a sub-tab) from anywhere. Old tab names still work.
export function openVaultTab(game, key, sub = null) {
  const t = legacyVaultTab(key);
  game.accountsTab = t.tab;
  game.accountsSub = { ...(game.accountsSub || {}), ...(t.sub || sub ? { [t.tab]: t.sub || sub } : {}) };
}

function vaultScreen(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const play = run.play;
  const shell = h("section.panel.accounts");
  const body = h("div.acct-body", { id: "acct-body", role: "tabpanel" });
  // A page of the Mossy Bestiary (2026-10-22): a bank passbook, with its
  // tabs as index tabs on the page's right edge.
  root.append(h("div.bestiary.bst-book-place.bst-vault", shell));

  // The tab and sub-tab showing, kept on the game so a repaint or a return visit keeps the place.
  function current() {
    const tabs = vaultTabs(play, run.life);
    const legacy = legacyVaultTab(game.accountsTab);
    const sub = game.accountsSub?.[legacy.tab] ?? legacy.sub;
    const at = pickVaultTab(tabs, legacy.tab, sub);
    game.accountsTab = at.tab;
    game.accountsSub = { ...(game.accountsSub || {}), ...(at.sub ? { [at.tab]: at.sub } : {}) };
    return { tabs, ...at };
  }

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
    // Jump to another tab (the Overview's "Go there" buttons).
    openTab(tab, sub = null) {
      openVaultTab(game, tab, sub);
      const at = current();
      track("accountsTab", { tab: at.tab, sub: at.sub || "" });
      paint();
    },
  };

  function paint() {
    const { tabs, tab, sub } = current();
    const unread = P.unreadCount(play);
    const here = tabs.find((t) => t.key === tab);
    const view = VIEWS[sub ? `${tab}:${sub}` : tab];
    fill(
      shell,
      placeHeader({ go, iconName: "vault", title: "The Vault", subtitle: "Your bank. See where you stand, pay bills, save and build credit. Time is paused here.", practice: run.practice }),
      tabs.length > 1
        ? h(
            "nav.acct-tabs",
            { "aria-label": "The Vault" },
            tabs.map((t) =>
              h(
                "button",
                {
                  type: "button",
                  "aria-current": t.key === tab ? "page" : null,
                  "aria-controls": "acct-body",
                  onclick: () => ctx.openTab(t.key),
                },
                icon(t.icon),
                ` ${t.label}`,
                t.key === "messages" && unread ? h("span.count-badge", { "aria-label": `${unread} unread`, "data-sparkle": "" }, String(unread)) : null
              )
            )
          )
        : null,
      // Sub-tabs: the views inside one tab, as a row of chips on the page.
      here?.subs.length > 1
        ? h(
            "nav.acct-subtabs",
            { "aria-label": here.label },
            here.subs.map((s) => h("button.chip", { type: "button", "aria-pressed": String(s.key === sub), onclick: () => ctx.openTab(tab, s.key) }, s.label))
          )
        : null,
      fill(body, view(ctx))
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
