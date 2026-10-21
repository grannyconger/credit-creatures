// Account Management (SPEC §14). Time is paused here: nothing on these tabs
// ends a month. Opens from the hub or the month screen and goes back there.
import { h, fill } from "../dom.js";
import { icon } from "../icons.js";
import * as P from "../../play.js";
import { walletTab } from "../accounts/wallet-tab.js";
import { statementsTab } from "../accounts/statements-tab.js";
import { scoreTab } from "../accounts/score-tab.js";
import { reportTab } from "../accounts/report-tab.js";
import { deskTab } from "../accounts/desk-tab.js";
import { inboxTab } from "../accounts/inbox-tab.js";

const TABS = [
  ["wallet", "wallet", "Wallet", walletTab],
  ["statements", "statement", "Statements", statementsTab],
  ["score", "gauge", "My Score", scoreTab],
  ["report", "report", "My Report", reportTab],
  ["desk", "academy", "Practice Desk", deskTab],
  ["inbox", "inbox", "Inbox", inboxTab],
];

export function render(root, { game, go, track, refreshWho }) {
  const run = game.run;
  const play = run.play;
  if (!TABS.some(([k]) => k === game.accountsTab)) game.accountsTab = "wallet";
  const shell = h("section.panel.accounts");
  const body = h("div.acct-body", { id: "acct-body", role: "tabpanel" });
  root.append(shell);

  const ctx = {
    game,
    run,
    track,
    async save(reason) {
      refreshWho();
      await run.persist(reason);
    },
    repaint: () => paint(),
  };

  function paint() {
    const tab = game.accountsTab;
    const unread = P.unreadCount(play);
    fill(
      shell,
      run.practice ? h("p.callout.warn.practice", "🔁 Practice mode. Nothing here is saved.") : null,
      h(
        "header.acct-head",
        h("div", h("p.step-label", "Account Management"), h("h1", "🏦 Your accounts"), h("p.muted.tight", "⏸️ Time is paused here. Look around as long as you like.")),
        h("button.secondary", { type: "button", onclick: () => go(play.active ? "month" : "hub") }, play.active ? "← Back to this month" : "← Back to hub")
      ),
      h(
        "nav.acct-tabs",
        { "aria-label": "Account Management" },
        TABS.map(([key, ico, label]) =>
          h(
            "button",
            {
              type: "button",
              "aria-current": key === tab ? "page" : null,
              "aria-controls": "acct-body",
              onclick: () => {
                game.accountsTab = key;
                track("accountsTab", { tab: key });
                paint();
              },
            },
            icon(ico),
            ` ${label}`,
            key === "inbox" && unread ? h("span.count-badge", { "aria-label": `${unread} unread` }, String(unread)) : null
          )
        )
      ),
      fill(body, TABS.find(([k]) => k === tab)[3](ctx))
    );
  }

  paint();
}
