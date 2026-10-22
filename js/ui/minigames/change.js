// Change math for Cashier Rush. Pure, so it's tested in Node. Money is in cents.
import { DENOMINATIONS } from "../../data/minigames.js";

// The fewest bills and coins that make cents, biggest first.
export function changePieces(cents) {
  const out = [];
  let left = cents;
  for (const d of DENOMINATIONS) {
    while (left >= d) {
      out.push(d);
      left -= d;
    }
  }
  return out;
}

// How a cashier counts up from the price to what the customer paid: the
// smallest coins first, saying the new total after each one. Returns
// [{ piece, total }], so $6.48 from $10 is 1¢ to $6.49, 1¢ to $6.50, 25¢ to
// $6.75, 25¢ to $7.00, then $1 at a time to $10.00.
export function countUp(price, paid) {
  let total = price;
  return changePieces(paid - price)
    .reverse()
    .map((piece) => ({ piece, total: (total += piece) }));
}
