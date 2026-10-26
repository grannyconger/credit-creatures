// Guides for the side quests (docs/MINIGAMES.md: every game gets How to play,
// Vocab and IRL). One entry per game key in JOBS. Plain words for a
// 15-year-old, a wry line or two, no em-dashes, no semicolons.
// In how.steps and how.example, [[word]] is a vocab term: it gets a tooltip
// on hover and on keyboard focus, from the vocab list.
// IRL facts are real. Each names its source, year and link, and was checked
// against that source on the date in `checked`. Never invent one.

import { BILLDROP_GUIDE } from "./arcade/billdrop.js";

export const GUIDES = {
  billdrop: BILLDROP_GUIDE,
  fees: {
    how: {
      goal: "Find every fee on a bank statement, then say how you could avoid each one.",
      steps: [
        "Read each line of the statement. A [[fee]] is money the bank takes out for a service or a mistake.",
        "Tap a line to mark it as a fee. Tap it again to take the mark off.",
        "Press the button when you're done. If a statement has no fees, say so. That happens, and it's good news.",
        "For each fee you found, pick the best way to avoid it.",
      ],
      example: "You see OVERDRAFT FEE for $35. That's a fee. A purchase at Starducks isn't, because you chose it. Interest earned isn't either, because the bank pays you.",
    },
    vocab: [
      { term: "fee", def: "Money a bank charges you for a service or a slip-up.", example: "The bank charged a $3 fee for using another bank's ATM." },
      { term: "statement", def: "A monthly list of everything that went in and out of your account.", example: "Check your statement every month, like a receipt for your whole bank account." },
      { term: "overdraft", def: "Spending more than you have in the account.", example: "Her balance was $10, so the $25 purchase was an overdraft." },
      { term: "maintenance fee", def: "A monthly charge some banks add just for having the account.", example: "Many banks skip the maintenance fee if you set up direct deposit." },
      { term: "direct deposit", def: "Your pay goes straight into your account, with no paper check.", example: "With direct deposit, the money shows up on payday by itself." },
      { term: "minimum balance", def: "The least money a bank wants you to keep in the account to avoid a fee.", example: "Keep $300 in checking and the fee goes away." },
      { term: "waive", def: "To cancel a fee. Banks waive some fees when you meet their rules.", example: "The bank waived the fee because her balance stayed above the minimum." },
    ],
    irl: {
      checked: "2026-10-23",
      intro: "Fees are quiet. Most people don't notice them until they add up.",
      facts: [
        { stat: "Banks that report their fees still collected $5.8 billion in overdraft and non-sufficient funds fees in 2023.", source: "Consumer Financial Protection Bureau, Data Spotlight", year: 2024, url: "https://files.consumerfinance.gov/f/documents/cfpb_overdraft-nsf_data-spotlight_2024-04.pdf" },
        { stat: "That was down by more than half from before the pandemic, because many banks changed their rules. Fees are a choice the bank makes, and they can change.", source: "Consumer Financial Protection Bureau, Data Spotlight", year: 2024, url: "https://files.consumerfinance.gov/f/documents/cfpb_overdraft-nsf_data-spotlight_2024-04.pdf" },
        { stat: "The typical purchase that causes an overdraft is only $50, and it is usually paid back about three days later. A small slip can cost a lot.", source: "Consumer Financial Protection Bureau, overdraft report", year: 2024, url: "https://files.consumerfinance.gov/f/documents/cfpb_overdraft-nsf-practices-very-large-financial-institutions_2024-01.pdf" },
      ],
    },
  },
};
