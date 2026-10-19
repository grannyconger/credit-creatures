// npm run sim: prints the 1,000-life score distribution sanity report.
import { simulateLives, summarize } from "../tests/sim/simulate.js";

const n = Number(process.argv[2]) || 1000;
const months = Number(process.argv[3]) || 48;
const t0 = Date.now();
const summary = summarize(simulateLives({ n, months }));
const secs = ((Date.now() - t0) / 1000).toFixed(1);

const pct = (x) => (x * 100).toFixed(0).padStart(3) + "%";
const BUCKETS = [300, 400, 500, 550, 600, 650, 700, 750, 800, 851];

console.log(`\nCredit Life simulation: ${n} lives, ${months} months each (age 18 to ${18 + months / 12}), ${secs}s\n`);
for (const [name, s] of Object.entries(summary)) {
  console.log(`${name}  (${s.count} lives, ${s.scored} with a score)`);
  console.log(`  min ${s.min}  p10 ${s.p10}  median ${s.median}  p90 ${s.p90}  max ${s.max}`);
  console.log(`  700+ ${pct(s.share700plus)}   under 600 ${pct(s.shareUnder600)}   on-time ${pct(s.onTimePct)}   avg utilization ${pct(s.utilization)}`);
  console.log(`  collections ${pct(s.collectionsRate)}   avg inquiries (12 mo) ${s.inquiries.toFixed(1)}`);
  for (let i = 0; i < BUCKETS.length - 1; i++) {
    const lo = BUCKETS[i];
    const hi = BUCKETS[i + 1];
    const c = s.scores.filter((x) => x >= lo && x < hi).length;
    const label = `${lo}-${hi === 851 ? 850 : hi - 1}`.padStart(8);
    console.log(`  ${label} ${"#".repeat(Math.round((c / s.count) * 60)).padEnd(60)} ${c}`);
  }
  console.log("");
}
