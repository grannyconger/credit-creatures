// npm run replay -- pilot-data/<export>.json --set fees.late=40 --set score.lengthCurvePower=0.9
// Re-runs every student's real game with the new values and prints the shift.
import { readFileSync } from "node:fs";
import { compare, parseSets } from "./replay-lib.js";

const [file, ...rest] = process.argv.slice(2);
if (!file) {
  console.log("Usage: npm run replay -- pilot-data/<export>.json --set <setting>=<value> [--set ...]");
  process.exit(1);
}
const data = JSON.parse(readFileSync(file, "utf8"));
const sets = parseSets(rest);
if (!Object.keys(sets).length) console.log("No --set values given. Showing each student's current numbers.\n");
const r = compare(data.lives || [], sets);
console.log(`Replayed ${r.rows.length} students with ${JSON.stringify(sets)}\n`);
for (const [k, v] of Object.entries(r.medians)) console.log(`  median ${k.padEnd(8)} ${String(v.before).padStart(6)} → ${v.after}`);
console.log(`\n  ${r.scoreMoved10} of ${r.rows.length} students' scores moved 10+ points.\n`);
for (const row of r.rows) console.log(`  ${row.student}: score ${row.base.score ?? "none"} → ${row.cand.score ?? "none"}, fees $${row.base.fees} → $${row.cand.fees}, interest $${row.base.interest} → $${row.cand.interest}`);
