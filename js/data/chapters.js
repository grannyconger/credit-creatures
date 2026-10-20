// Chapter titles, intros and reflection questions (SPEC §5, §9).
// Plain language for a 15-year-old. No em-dashes, no semicolons.

export const CHAPTERS = {
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

export function chapterInfo(n) {
  return (
    CHAPTERS[n] || {
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
