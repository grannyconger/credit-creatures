// Each creature's dream (teacher request 2026-10-20). The student picks one at
// the start. Savings, a good score and good habits make it possible.
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const DREAMS = {
  home: {
    icon: "🏡",
    title: "A home of its own",
    story: "Move out and rent a cozy cottage on Maple Lane.",
    why: "Landlords check your credit and want a deposit. A good score means a yes and a smaller deposit.",
    savings: 1500,
    score: 700,
    finish: "You paid the deposit and got the keys. Your creature has a home of its own!",
  },
  shop: {
    icon: "🏪",
    title: "Its own shop",
    story: "Open a little shop in the Market Village.",
    why: "Lenders look at your credit before a business loan. Savings show you can handle the start-up costs.",
    savings: 1200,
    score: 680,
    finish: "The sign is up and the doors are open. Your creature runs its own shop!",
  },
  adventure: {
    icon: "🗺️",
    title: "A grand adventure",
    story: "Travel to the far islands of the kingdom.",
    why: "Trips cost a lot up front. Paying cash from savings means no debt waiting at home.",
    savings: 1000,
    score: 650,
    finish: "Bags packed, tickets paid in full. Your creature sets sail with no debt behind it!",
  },
  scholar: {
    icon: "🎓",
    title: "Scholar of Coinhaven",
    story: "Study at the Royal Academy across the river.",
    why: "Schools and student lenders like a clean record, and savings cover books and fees.",
    savings: 800,
    score: 650,
    finish: "Enrolled and ready. Your creature is off to the Royal Academy!",
  },
};

// Progress toward a dream: savings, credit score and habits (no collections
// and no late marks in the last 6 months). ready means all three are met.
export function dreamProgress(life, dreamId) {
  const d = DREAMS[dreamId];
  if (!d || !life) return null;
  const savings = Math.min(1, (life.savings || 0) / d.savings);
  const score = life.score == null ? 0 : Math.min(1, Math.max(0, (life.score - 300) / (d.score - 300)));
  const recent = life.month - 6;
  const collections = life.accounts.some((a) => a.status === "collections");
  const lateRecently = life.accounts.some((a) => a.owner !== "authorized" && a.history.some((h) => h.month >= recent && h.code !== "OK"));
  const habits = [
    { label: "No accounts in collections", ok: !collections },
    { label: "No late payments in the last 6 months", ok: !lateRecently },
  ];
  const habitShare = habits.filter((x) => x.ok).length / habits.length;
  return {
    dream: d,
    savings: { value: life.savings || 0, goal: d.savings, share: savings, ok: (life.savings || 0) >= d.savings },
    score: { value: life.score, goal: d.score, share: score, ok: life.score != null && life.score >= d.score },
    habits: { list: habits, share: habitShare, ok: habitShare === 1 },
    overall: (savings + score + habitShare) / 3,
    ready: (life.savings || 0) >= d.savings && life.score != null && life.score >= d.score && habitShare === 1,
  };
}
