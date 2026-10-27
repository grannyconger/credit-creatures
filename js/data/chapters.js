// Chapter titles and intros (SPEC §5, §9).
// Plain language for a 15-year-old. No em-dashes, no semicolons.

// Phase 10 (docs/PROGRESSION.md): one new kind of account per chapter.
export const CHAPTERS = {
  1: {
    title: "Your first bank account",
    intro: "You're 16 with a checking account and a debit card. Your phone bill comes out of checking at the end of every month. Keep enough in there, and start saving.",
  },
  2: {
    title: "Borrow and pay back",
    intro: "You're 18. A loan lets you buy something big now and pay it back each month, plus interest. Every on-time payment starts building your credit history.",
  },
  3: {
    title: "Your first credit card",
    intro: "A credit card is borrowed money with a limit. Use it a little, pay the statement in full, and keep the balance low.",
  },
  4: {
    title: "Your credit score",
    intro: "Your score is here. It changes the offers you get and the interest you pay. Every choice moves it.",
  },
  5: {
    title: "Rainy days",
    intro: "Emergencies and quick-cash offers. Having savings, or a plan, decides whether a bad day becomes bad debt.",
  },
  // Phase 13: the late game.
  6: {
    title: "Moving out",
    intro: "Your own place! Rent, power, roommates and furniture all cost money, and your credit shows up in places you didn't expect.",
  },
  7: {
    title: "Setbacks and comebacks",
    intro: "Hours get cut, things break and old mistakes follow you. Every setback has a smart next step.",
  },
  8: {
    title: "Building your future",
    intro: "Raises, retirement plans and big dreams like a home. The habits you've built start to pay off.",
  },
};

// Saves from before Phase 10 keep the chapter names they started with.
export const LEGACY_CHAPTERS = {
  2: {
    title: "First card, first job",
    intro: "You're 18 and working shifts at the Vault. Bills come out of checking every month. Time to see how you handle money that's really yours.",
  },
  3: {
    title: "Wheels and wishes",
    intro: "Offers start showing up. A car, store cards, quick cash. Every offer has a cost. Some are easy to see and some are hidden.",
  },
  4: {
    title: "School or work",
    intro: "Classes, loans and a growing list of bills. Keep an eye on what comes out of checking at the end of each month.",
  },
  5: {
    title: "Rainy days",
    intro: "Emergencies happen. Having savings, or a plan, decides whether a bad day becomes bad debt.",
  },
};

// play: the student's play state, so old saves get their old chapter names.
export function chapterInfo(n, play = null) {
  const book = play && play.progression !== 2 ? LEGACY_CHAPTERS : CHAPTERS;
  return (
    book[n] ||
    CHAPTERS[n] || {
      title: `Chapter ${n}`,
      intro: "More months, more choices. Keep paying on time and keep your balances low.",
    }
  );
}
