// Account Management (SPEC §14). Time is paused here: nothing on these tabs
// ends a month. Opens from the hub or the month screen and goes back there.
import { h, fill } from "../dom.js";
import * as P from "../../play.js";
import { THEMES } from "../../data/explainers.js";
import { walletTab } from "../accounts/wallet-tab.js";
import { statementsTab } from "../accounts/statements-tab.js";
import { scoreTab } from "../accounts/score-tab.js";
import { reportTab } from "../accounts/report-tab.js";
import { deskTab } from "../accounts/desk-tab.js";
import { inboxTab } from "../accounts/inbox-tab.js";

const TABS = [
  ["wallet", "💳", "Wallet", walletTab],
  ["statements", "🧾", "Statements", statementsTab],
  ["score", "⭐", "My Score", scoreTab],
  ["report", "📄", "My Report", reportTab],
  ["desk", "🧮", "Practice Desk", deskTab],
  ["inbox", "📬", "Inbox", inboxTab],
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
    shell.dataset.theme = play.theme;
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
        TABS.map(([key, icon, label]) =>
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
            h("span", { "aria-hidden": "true" }, icon),
            ` ${label}`,
            key === "inbox" && unread ? h("span.count-badge", { "aria-label": `${unread} unread` }, String(unread)) : null
          )
        )
      ),
      fill(body, TABS.find(([k]) => k === tab)[3](ctx)),
      themePicker(play, ctx)
    );
  }

  paint();
}

function themePicker(play, ctx) {
  return h(
    "footer.theme-picker",
    h("span", "🎨 Theme"),
    h(
      "div.chip-group",
      { role: "group", "aria-label": "Color theme for these screens" },
      Object.entries(THEMES).map(([key, t]) =>
        h(
          "button.chip",
          {
            type: "button",
            "aria-pressed": String(play.theme === key),
            onclick: async () => {
              play.theme = key;
              ctx.track("themeSet", { theme: key });
              ctx.repaint();
              await ctx.save("theme");
            },
          },
          h("span.design-dot", { style: { background: t.swatch } }),
          t.label
        )
      )
    )
  );
}
