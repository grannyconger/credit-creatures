// npm run tuning-report -- pilot-data/<export>.json
// Reads the dashboard's tuning export and prints suggested config changes.
import { readFileSync } from "node:fs";
import { suggest } from "./tuning-lib.js";

const file = process.argv[2];
if (!file) {
  console.log("Usage: npm run tuning-report -- pilot-data/<export>.json");
  process.exit(1);
}
const data = JSON.parse(readFileSync(file, "utf8"));
const { lines, changes, economy } = suggest(data);
console.log(`Tuning report: ${data.class || "class"}, exported ${data.exportedAt || "?"}`);
console.log(`${(data.roster || []).length} students, ${(data.lives || []).length} game logs, ${data.tuning?.events ?? 0} play events.\n`);
for (const l of lines) console.log(`• ${l}`);
console.log("\nSuggested changes to js/data/config.js:");
if (!changes.length) console.log("  None. The numbers look on target.");
for (const c of changes) console.log(`  ${c.setting}: ${c.current} → ${c.suggested}\n    Why: ${c.reason}`);
if (economy.length) {
  console.log("\nPer student (saved per month after 18):");
  for (const e of economy) console.log(`  ${e.student}: $${e.savedPerMonth}/month over ${e.months} months, shop $${e.shopSpent}, score ${e.score ?? "none"}`);
}
console.log("\nCheck engine changes against real play first: npm run replay -- <file> --set <setting>=<value>");
