// The places in the kingdom hub and what's waiting at each (teacher request
// 2026-10-20: everything starts and ends at the hub). Pure, so it runs in Node.
import { upcomingPayments } from "./engine/index.js";
import { DREAMS, dreamProgress } from "./data/dreams.js";
import * as P from "./play.js";
import { hasFeature, opensText, prologueStep, stageOf } from "./progression.js";
import { alleyProgress } from "./data/alley.js";

// The one next thing to do in the prologue (coach panel and chapter box).
export const PROLOGUE_TEXT = {
  welcome: "Say hi to Sage, then head to the Guild Hall.",
  firstShift: "Work your first shift at the Guild Hall to earn coins.",
  moreShifts: "Work 3 shifts in all. Your piggy bank is filling up!",
  market: "Visit the Shimmer Market. Will you spend or save?",
  cottage: "Check on your creature and its dream at your Cottage.",
  bank: "Take your coins to the Vault and open a bank account.",
};

// route: the screen it opens. x, y: where it sits on the map (percent).
// kind: what it is in plain words, shown under its name on the map (teacher
// request 2026-10-22: make it really clear what each place is).
// feature: what unlocks it (js/progression.js). Locked places are hidden on
// the map until they open (teacher request 2026-10-22). The places sit in three
// staggered rows so no name tag lands on another building.
export const PLACES = [
  { id: "townhall", kind: "Monthly choices", name: "Town Hall", icon: "townhall", route: "month", feature: "townhall", does: "This month's news, decisions and End Month", x: 37, y: 26 },
  { id: "vault", kind: "Your bank", name: "The Vault", icon: "vault", route: "accounts", feature: "vault", does: "Your bank: checking, savings, bills and letters", x: 12, y: 26 },
  { id: "guild", kind: "Jobs and pay", name: "Guild Hall", icon: "guild", route: "guild", feature: "guild", does: "Work a shift to earn money", x: 63, y: 26 },
  { id: "records", kind: "Your credit score", name: "Hall of Records", icon: "scroll", route: "records", feature: "records", does: "Your credit report and credit score", x: 50, y: 55 },
  { id: "garage", kind: "Cars and loans", name: "The Garage", icon: "car", route: "garage", feature: "garage", does: "Buy a ride with cash or a loan", x: 75, y: 55 },
  { id: "market", kind: "The shop", name: "Shimmer Market", icon: "market", route: "shop", feature: "market", does: "Spend money on things for your creature", x: 12, y: 81 },
  { id: "cottage", kind: "Your creature's home", name: "Your Cottage", icon: "cottage", route: "cottage", feature: "cottage", does: "Your creature, its dream, its home and your settings", x: 37, y: 81 },
  { id: "plaza", kind: "Friends and gifts", name: "Friendship Plaza", icon: "plaza", route: "friends", feature: "plaza", does: "Friends, groups and gifts", x: 63, y: 81 },
  { id: "alley", kind: "Tricky offers", name: "Lantern Alley", icon: "lantern", route: "alley", feature: "pitfalls", does: "Read the fine print on tricky offers", x: 25, y: 55 },
  { id: "academy", kind: "Lessons and trophies", name: "The Academy", icon: "academy", route: "academy", feature: "academy", does: "Lessons and practice to earn XP, trophies and ranks", x: 88, y: 26 },
];

// { [placeId]: { text, tone: "action" | "warn" | "calm" | "off", count } }
export function placeStatus({ life, play, creature, classInfo }) {
  const out = {};
  const prologue = stageOf(play) === 0;
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

  out.garage = { text: play.garage?.vehicle ? "Your ride is here" : "Rides for sale", tone: "calm" };
  out.records = { text: life?.score == null ? "No score yet" : `Score ${life.score}`, tone: "calm" };
  const alley = alleyProgress(play);
  const stallsLeft = alley.total - alley.checked;
  out.alley = stallsLeft ? { text: `${stallsLeft} offer${stallsLeft === 1 ? "" : "s"} to check`, tone: "action", count: stallsLeft } : { text: `${alley.right} of ${alley.total} called right`, tone: "calm" };

  // The prologue: Sage's current step lights up its place.
  if (prologue) {
    const step = prologueStep(play);
    out.guild = { text: play.prologue.shifts ? `${play.prologue.shifts} shift${play.prologue.shifts === 1 ? "" : "s"} worked` : "Earn your first coins", tone: step?.place === "guild" ? "action" : "calm" };
    out.market = { text: "Spend or save?", tone: step?.place === "market" ? "action" : "calm" };
    if (step?.place === "vault") out.vault = { text: "Open your first bank account", tone: "action" };
  }

  // Anything not unlocked yet says when it opens.
  for (const pl of PLACES) {
    const open = hasFeature(play, pl.feature, life) || (pl.id === "vault" && prologueStep(play)?.place === "vault");
    if (!open) out[pl.id] = { text: opensText(pl.feature), tone: "locked" };
  }

  const dream = creature?.dream ? dreamProgress(life, creature.dream, play) : null;
  if (!creature?.dream) out.cottage = { text: "Pick your creature's dream", tone: "action" };
  else if (play.dreamDone) out.cottage = { text: `${DREAMS[creature.dream].title}: done!`, tone: "calm" };
  else if (dream?.ready) out.cottage = { text: `Dream stage ${dream.stageIndex + 1} is ready!`, tone: "action" };
  else out.cottage = { text: `Dream ${Math.round((dream?.overall || 0) * 100)}% there`, tone: "calm" };
  return out;
}

// One plain sentence telling the student what to do next.
export function nextStep({ play, classInfo, status }) {
  if (stageOf(play) === 0) return PROLOGUE_TEXT[prologueStep(play)?.id] || "Explore the kingdom.";
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
