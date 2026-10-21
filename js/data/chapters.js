// Chapter titles, intros and reflection questions (SPEC §5, §9).
// Plain language for a 15-year-old. No em-dashes, no semicolons.

// Phase 10 (docs/PROGRESSION.md): one new kind of account per chapter.
export const CHAPTERS = {
  1: {
    title: "Your first bank account",
    intro: "You're 16 with a checking account and a debit card. Your phone bill comes out of checking at the end of every month. Keep enough in there, and start saving.",
    reflect: "What did you learn about keeping money in checking?",
  },
  2: {
    title: "Borrow and pay back",
    intro: "You're 18. A loan lets you buy something big now and pay it back each month, plus interest. Every on-time payment starts building your credit history.",
    reflect: "Was borrowing worth it for you? What did your loan cost in the end?",
  },
  3: {
    title: "Your first credit card",
    intro: "A credit card is borrowed money with a limit. Use it a little, pay the statement in full, and keep the balance low.",
    reflect: "How did you use your credit card this chapter? What would you do differently?",
  },
  4: {
    title: "Your credit score",
    intro: "Your score is here. It changes the offers you get and the interest you pay. Every choice moves it.",
    reflect: "If a friend asked you how to keep their score healthy, what would you tell them?",
  },
  5: {
    title: "Rainy days",
    intro: "Emergencies and quick-cash offers. Having savings, or a plan, decides whether a bad day becomes bad debt.",
    reflect: "What would you do differently if an emergency hit you next month?",
  },
};

// Saves from before Phase 10 keep the chapter names they started with.
export const LEGACY_CHAPTERS = {
  2: {
    title: "First card, first job",
    intro: "You're 18 and working shifts at The Gilded Vault. Bills come out of checking every month. Time to see how you handle money that's really yours.",
    reflect: "What helped or hurt your score this chapter?",
  },
  3: {
    title: "Wheels and wishes",
    intro: "Offers start showing up. A car, store cards, quick cash. Every offer has a cost. Some are easy to see and some are hidden.",
    reflect: "Which offer this chapter was the hardest to say yes or no to? Why?",
  },
  4: {
    title: "School or work",
    intro: "Classes, loans and a growing list of bills. Keep an eye on what comes out of checking at the end of each month.",
    reflect: "If a friend asked you how to keep their score healthy, what would you tell them?",
  },
  5: {
    title: "Rainy days",
    intro: "Emergencies happen. Having savings, or a plan, decides whether a bad day becomes bad debt.",
    reflect: "What would you do differently if an emergency hit you next month?",
  },
};

// play: the student's play state, so old saves get their old chapter names.
export function chapterInfo(n, play = null) {
  const book = play && play.progression !== 2 ? LEGACY_CHAPTERS : CHAPTERS;
  return (
    book[n] || {
      title: `Chapter ${n}`,
      intro: "More months, more choices. Keep paying on time and keep your balances low.",
      reflect: "What is one money habit you want to keep, and one you want to change?",
    }
  );
}

export const RATING_LABELS = {
  fun: ["Not fun", "A little fun", "Okay", "Fun", "Really fun"],
  clear: ["Very confusing", "A bit confusing", "Okay", "Clear", "Very clear"],
};

export const REFLECTION_MAX = 600;
