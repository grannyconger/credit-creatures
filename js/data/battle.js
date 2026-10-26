// Battle content (docs/BATTLES.md): the moves students see, and which Practice
// Desk question types are quick enough to be a battle round. The numbers for each
// move live in CONFIG.battle.moves. Plain language for a 15-year-old.

// echo: the money idea the move is named after, shown on its card.
export const MOVES = [
  { id: "strike", name: "Coin Toss", icon: "coins", kind: "Attack", does: "A steady hit.", echo: "Small, steady choices add up." },
  { id: "guard", name: "Budget Guard", icon: "shield", kind: "Defend", does: "Take half the hit this turn, and your next hit is stronger.", echo: "A budget softens a bad month and sets up the next one." },
  { id: "fund", name: "Emergency Fund", icon: "piggy", kind: "Shield", does: "A cushion that soaks up hits until it runs out.", echo: "Savings cushion a surprise." },
  { id: "compound", name: "Compound Interest", icon: "chart", kind: "Over time", does: "A small hit each turn that grows for 3 turns.", echo: "Interest grows on itself." },
  { id: "payday", name: "Payday Loan", icon: "receipt", kind: "Big hit", does: "A big hit now, but you lose a little HP for the next 3 turns.", echo: "A quick fix that costs more later." },
  { id: "payfull", name: "Pay in Full", icon: "check", kind: "Heal", does: "Heal and wipe out anything still hurting you.", echo: "Paying in full means no interest." },
];
export const MOVE_BY_ID = Object.fromEntries(MOVES.map((m) => [m.id, m]));

// Practice Desk question types that make a fair, quick round: one clear right
// answer and new numbers from a seed (js/data/practice-questions.js). Report
// reading and Factor Check take too long to read for a timed round.
export const ROUND_TYPES = ["runningBalance", "utilization", "monthlyInterest", "tipMath", "debitVsCredit", "cardAccounting", "accountMatch"];

// What the computer opponents are called, by level (CONFIG.battle.bots).
export const BOT_NAMES = {
  sprout: { name: "Pip the Sprout", short: "Pip", species: "cloudBunny", palette: "sunny" },
  grove: { name: "Mossbeard", short: "Mossbeard", species: "mossDragon", palette: "royal" },
  elder: { name: "Old Ledgerhorn", short: "Ledgerhorn", species: "crystalOwl", palette: "midnight" },
};

// One line for the battle log, from what a side did on a turn.
export function turnLine(name, t) {
  const m = MOVE_BY_ID[t.move];
  const how = t.correct ? "" : " (a wrong answer, so it was weaker)";
  const parts = [`${name} used ${m.name}${how}.`];
  if (t.dealt) parts.push(`It hit for ${t.dealt}.`);
  if (t.blocked) parts.push(`${t.blocked} was blocked.`);
  if (t.shield) parts.push(`A ${t.shield} point cushion.`);
  if (t.healed) parts.push(`Healed ${t.healed}.`);
  return parts.join(" ");
}
