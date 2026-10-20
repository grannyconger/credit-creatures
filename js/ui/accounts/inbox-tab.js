// Notifications inbox (SPEC §14): each type has its own icon and color.
import { h, ageLabel } from "../dom.js";
import * as P from "../../play.js";
import { INBOX_TYPES } from "../../data/explainers.js";

export function inboxTab({ run, track, save, repaint }) {
  const play = run.play;
  const life = run.life;
  if (!play.inbox.length) return h("p.callout", "📭 Nothing here yet. Notes about fees, payments, statements and your score show up after each End Month.");
  const unread = P.unreadCount(play);
  return h(
    "div",
    h(
      "div.inbox-head",
      h("p", unread ? `${unread} unread` : "All caught up ✓"),
      unread
        ? h(
            "button.secondary.small",
            {
              type: "button",
              onclick: async () => {
                P.markAllRead(play);
                track("inboxAllRead", { count: unread });
                repaint();
                await save("inbox");
              },
            },
            "Mark all read"
          )
        : null
    ),
    h(
      "ul.inbox",
      play.inbox.map((n) => {
        const t = INBOX_TYPES[n.type] || INBOX_TYPES.alert;
        return h(
          "li.note-item",
          { class: `tone-${t.tone} ${n.read ? "read" : "unread"}` },
          h("span.note-icon", { "aria-hidden": "true" }, t.icon),
          h(
            "div.note-text",
            h("small", t.label, n.month != null ? ` · ${ageLabel(life.start.ageMonths + n.month)}` : "", n.read ? "" : h("span.sr-only", " (unread)")),
            h("p", n.text)
          ),
          n.read
            ? null
            : h(
                "button.link",
                {
                  type: "button",
                  onclick: async () => {
                    P.markRead(play, n.id);
                    track("inboxRead", { type: n.type });
                    repaint();
                    await save("inbox");
                  },
                },
                "Mark read"
              )
        );
      })
    )
  );
}
