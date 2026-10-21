// The places in the kingdom hub and what's waiting at each (teacher request
// 2026-10-20: everything starts and ends at the hub). Pure, so it runs in Node.
import { upcomingPayments } from "./engine/index.js";
import { DREAMS, dreamProgress } from "./data/dreams.js";
import * as P from "./play.js";

// route: the screen it opens. x, y: where it sits on the map (percent).
export const PLACES = [
  { id: "townhall", name: "Town Hall", icon: "townhall", route: "month", does: "This month's news, decisions and End Month", x: 50, y: 30 },
  { id: "vault", name: "The Gilded Vault", icon: "vault", route: "accounts", does: "Your bank: cards, bills, statements, score and letters", x: 18, y: 36 },
  { id: "guild", name: "Guild Hall", icon: "guild", route: "guild", does: "Work a shift to earn money", x: 82, y: 36 },
  { id: "market", name: "Shimmer Market", icon: "market", route: "shop", does: "Spend money on things for your creature", x: 14, y: 74 },
  { id: "cottage", name: "Your Cottage", icon: "cottage", route: "cottage", does: "Your creature, its dream and your settings", x: 37, y: 66 },
  { id: "plaza", name: "Friendship Plaza", icon: "plaza", route: "friends", does: "Friends, groups and gifts", x: 63, y: 74 },
  { id: "academy", name: "The Academy", icon: "academy", route: "academy", does: "Practice to earn XP, see trophies and ranks", x: 86, y: 77 },
];

// { [placeId]: { text, tone: "action" | "warn" | "calm" | "off", count } }
export function placeStatus({ life, play, creature, classInfo }) {
  const out = {};
  const released = classInfo?.releasedChapter || 1;
  const paused = Boolean(classInfo?.paused);
  const a = play.active;

  if (paused && !a) out.townhall = { text: "Play is paused", tone: "off" };
  else if (a) {
    const open = [...(a.month.life && !a.month.life.done ? [1] : []), ...a.month.cards.filter((c) => !c.done)].length;
    out.townhall = open ? { text: `${open} decision${open === 1 ? "" : "s"} waiting`, tone: "action", count: open } : { text: "Ready for End Month", tone: "action" };
  } else if (play.summary) out.townhall = { text: "Chapter summary waiting", tone: "action" };
  else if (P.canPlay(play, released)) out.townhall = { text: `Chapter ${play.chapter} is open`, tone: "action" };
  else out.townhall = { text: "Waiting for your teacher", tone: "calm" };

  if (a) {
    const left = P.shiftsLeft(play);
    out.guild = left ? { text: `${left} shift${left === 1 ? "" : "s"} left`, tone: "action", count: left } : { text: "Done for this month", tone: "calm" };
  } else out.guild = { text: "Opens with the chapter", tone: "off" };

  const up = upcomingPayments(life);
  const unread = P.unreadCount(play);
  if (up.cardsDue.length) out.vault = { text: "A bill is due", tone: "warn", count: up.cardsDue.length };
  else if (up.short > 0) out.vault = { text: "Checking is short", tone: "warn" };
  else if (unread) out.vault = { text: `${unread} new letter${unread === 1 ? "" : "s"}`, tone: "calm", count: unread };
  else out.vault = { text: "All caught up", tone: "calm" };

  out.market = { text: "New stock each chapter", tone: "calm" };
  const xpLeft = P.answerXpLeft(play);
  out.academy = xpLeft ? { text: `${xpLeft} XP to earn`, tone: "action" } : { text: "All answer XP earned", tone: "calm" };
  out.plaza = classInfo?.social === false ? { text: "Closed by your teacher", tone: "off" } : { text: "Friends and gifts", tone: "calm" };

  const dream = creature?.dream ? dreamProgress(life, creature.dream, play) : null;
  if (!creature?.dream) out.cottage = { text: "Pick your creature's dream", tone: "action" };
  else if (play.dreamDone) out.cottage = { text: `${DREAMS[creature.dream].title}: done!`, tone: "calm" };
  else if (dream?.ready) out.cottage = { text: `Dream stage ${dream.stageIndex + 1} is ready!`, tone: "action" };
  else out.cottage = { text: `Dream ${Math.round((dream?.overall || 0) * 100)}% there`, tone: "calm" };
  return out;
}

// One plain sentence telling the student what to do next.
export function nextStep({ play, classInfo, status }) {
  if (classInfo?.paused) return "Play is paused. You can still visit the Vault, the Market and the Academy.";
  if (!play.active) {
    if (play.summary) return "Visit Town Hall to wrap up the chapter.";
    if (P.canPlay(play, classInfo?.releasedChapter || 1)) return `Chapter ${play.chapter} is open. Start it at Town Hall.`;
    return "Your teacher opens the next chapter soon. Meanwhile, practice at the Academy or check your Vault.";
  }
  if (status.townhall.count) return "Start at Town Hall: this month's decisions are waiting.";
  if (status.guild.count) return `Earn money at the Guild Hall (${status.guild.text.toLowerCase()}), then check the Vault.`;
  if (status.vault.tone === "warn") return "Visit the Vault: pay your bill before End Month.";
  return "Everything's done. End the month at Town Hall.";
}
