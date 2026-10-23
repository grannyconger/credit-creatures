---
name: test-game
description: Verify a change to Credit Creatures with tests proportional to its size. Use after editing game logic, a screen, CSS or the teacher pages, before committing, or when the user types /test-game. Runs Node unit tests, targeted Playwright checks, screenshots and console-error checks.
---

# Test the game (proportionally)

Pick the **smallest** level that covers what changed. Don't run the browser for a pure-logic change, and don't run the full suite for a one-screen CSS tweak.

| What changed | Run |
|---|---|
| Docs or comments only | Nothing |
| `js/engine/`, `js/data/`, `js/play.js`, `js/teacher/analyze.js`, any pure JS | `npm test` |
| One screen's JS or CSS | `npm test`, then one screenshot of that screen (below) |
| Visual or design work | Screenshots at 1440 light, 1440 dark, 1280 dyslexia, then look at them |
| Navigation, onboarding, saving, routing, `js/app.js`, `js/game.js`, `js/db*.js` | `npm test` and `npm run e2e` |
| Teacher page or /admin | `npm test` and `npx playwright test e2e/teacher.spec.js` |
| Before a big push (several screens, a new side quest) | `npm test` and `npm run e2e` |

## Commands
- **Unit tests:** `npm test 2>&1 | grep -E "^ℹ (pass|fail)|not ok"`. Under 1 second. Any `not ok` means stop and fix.
- **Browser tests:** `npm run e2e 2>&1 | tail -15`. Playwright starts the local server itself (`playwright.config.js`). One file: `npx playwright test e2e/game.spec.js`. One test: add `-g "every screen"`.
- **A screenshot:** start the server if needed (`python3 -m http.server 8000`, in the background), then `node e2e/shot.js <route> [--dark] [--dyslexia] [--width 1280] [--full]`. Routes are the hash names (`hub`, `map`, `garage`, `alley`, `settings` and so on), plus `teacher` and `admin`. It prints the PNG path and any page errors. Read the PNG to look at it.
- Every e2e test fails on any page error or `console.error`, so a green run also means a clean console.

## Game states worth checking when relevant
- **A new student:** the title, the story, the name, the creature, the dream, join with `TEST01`, then Home (`e2e/game.spec.js`).
- **Everything unlocked:** `seededStudent()` in `e2e/helpers.js` gives an old-style save with every place open.
- **Mid-chapter or end of chapter:** start a chapter from Home ("Start Chapter 1"). For the chapter report, put a `play.summary` into the local save (see how `seededStudent` edits the save in `e2e/helpers.js`).
- **Side quests (minigames):** they need an active chapter. Check the right-answer and wrong-answer paths, the No timer toggle, and the Shift over screen.
- **Win and loss:** for anything scored, check a perfect run, an all-wrong run (wrong answers never end a game early), and the result screen.

## Writing a new e2e test
Add it to `e2e/*.spec.js`. Use the helpers (`watchErrors`, `freshStart`, `enterGame`, `seededStudent`, `open`, `closePopups`) and end with `expect(errors).toEqual([])`. Prefer role and text selectors (`getByRole("button", { name: ... })`). Keep each test focused, since the suite runs on every push.

## When something fails
1. Read the first error line, not the whole log (`tail` or `grep`).
2. For a failed e2e test, the trace is saved: `npx playwright show-trace test-results/<test>/trace.zip` (or read the error context file next to it).
3. Fix, then rerun only the failing test (`-g "<name>"`), then the level from the table above.
4. Report briefly: what ran, what passed, what was fixed.

## Performance (only when needed)
Use Claude in Chrome (the browser extension tools) or Chrome's Performance panel only for a real performance question (a slow screen, jank, memory). Don't profile by default.
