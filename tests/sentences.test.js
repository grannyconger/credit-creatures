import { test } from "node:test";
import assert from "node:assert/strict";
import { sentenceBreaks } from "../js/ui/sentences.js";

const split = (t) => {
  const out = [];
  let from = 0;
  for (const [end, next] of sentenceBreaks(t)) {
    out.push(t.slice(from, end));
    from = next;
  }
  return [...out, t.slice(from)];
};

test("each sentence gets its own line, but numbers and abbreviations stay whole", () => {
  assert.deepEqual(split("You did it! Your creature is proud. Keep going?"), ["You did it!", "Your creature is proud.", "Keep going?"]);
  assert.deepEqual(split("A fee of $1.50 a month. That adds up."), ["A fee of $1.50 a month.", "That adds up."]);
  assert.deepEqual(split("Cost: $0. Spotting errors helps."), ["Cost: $0.", "Spotting errors helps."]);
  assert.deepEqual(split("Visit Dr. Hoot at St. Coin Lane today."), ["Visit Dr. Hoot at St. Coin Lane today."]);
  assert.deepEqual(split("She said \"Pay on time.\" Then she left."), ["She said \"Pay on time.\"", "Then she left."]);
  assert.deepEqual(split("Saved at 10:55 AM. 3 left."), ["Saved at 10:55 AM.", "3 left."]);
  assert.deepEqual(split("one. two"), ["one. two"], "a lowercase word after a period isn't a new sentence");
});
