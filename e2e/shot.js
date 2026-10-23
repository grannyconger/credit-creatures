// One-off screenshots for visual checks, without writing a new script each
// time. Needs the local server running (python3 -m http.server 8000).
//
//   node e2e/shot.js garage                      -> a student at #/garage, 1440 light
//   node e2e/shot.js garage --dark --width 1280  -> dark mode, 1280 wide
//   node e2e/shot.js settings --dyslexia --full  -> dyslexia mode, full page
//   node e2e/shot.js teacher                     -> the teacher page (?local)
//   node e2e/shot.js admin                       -> the admin page (?local)
//
// Screenshots go to test-results/shots/ (gitignored). Page errors are printed.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { seededStudent, open, watchErrors } from "./helpers.js";

const args = process.argv.slice(2);
const route = args.find((a) => !a.startsWith("--")) || "hub";
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const width = Number(value("width", 1440));
const height = Number(value("height", 900));

// The installed Google Chrome, so no Playwright browser download is needed.
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width, height }, baseURL: "http://localhost:8000", colorScheme: flag("dark") ? "dark" : "light" });
const errors = watchErrors(page);
try {
  await seededStudent(page);
  if (flag("dyslexia")) await page.evaluate(() => (document.documentElement.dataset.reading = "dyslexia"));
  if (route === "teacher" || route === "admin") {
    await page.goto(`/${route}/?local`);
    await page.waitForTimeout(1500);
  } else await open(page, route);
  mkdirSync("test-results/shots", { recursive: true });
  const out = `test-results/shots/${route}-${width}${flag("dark") ? "-dark" : ""}${flag("dyslexia") ? "-dys" : ""}.png`;
  await page.screenshot({ path: out, fullPage: flag("full") });
  console.log(out);
  console.log(errors.length ? errors.join("\n") : "no page errors");
} finally {
  await browser.close();
}
