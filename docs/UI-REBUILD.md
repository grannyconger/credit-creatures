# Plan: Persistent shell, Creature Cottage home, and Webkinz-inspired UX (Credit Creatures)

## Context
The teacher loved the simple, persistent UI of Classic Webkinz (research saved at `docs/WEBKINZ-RESEARCH.md`) and wants to build from it, not copy it. Keep the Mossy Bestiary look (tokens, drawn pieces), change layout and navigation. Stay on Firebase Spark, client-side economy, no pet needs/chores, no free tile grid. Desktop first, with phone-reflow foundations only (no phone work without explicit OK).

Decisions already made (teacher, 2026-10-23):
- Rename student-facing "Shimmer Market" to **Market**, and "Guild Hall" to **Arcade**. Keep route ids, feature ids, lesson ids and CSS class names (`shop`, `guild`, `.guild-*`, `id:"market"`).
- Home becomes the **Creature Cottage**, a customizable room where the creature lives. Hovering a clickable object makes it glow. Objects navigate (bills table, mailbox, desk, etc.).
- The kingdom map is demoted to one tile in **Things To Do**. Home and the map stop being the primary nav.
- **Daily Pick** (resets at local midnight): a randomized luck reward that differs per student and day.
- **Login streak** with rewards.
- Adopt all 8 earlier items: persistent shell, Things To Do launcher, creature at home, return loops, one route registry plus result contract, Dock, notification types, keyboard-first.
- Customization is economical: a few named **slots** in the room (wallpaper, floor, rug, wall art, shelf item, window view, lamp, plant), not a tile grid.
- Build order, stop for approval after each slice: (1) shell, (2) Home room with clickable objects, (3) Dock and Market tie-in, (4) daily loops and visible challenges, (5) Cottage decorating.

## What exists (from exploration)
- `index.html:21-40`: `#topbar` (brand, `#who`, chapter chip, `#topnav` with hub/map/wallet/leaderboard, actions), `#wallet-pop`, `#nudge`, `<main id="app">`.
- `js/app.js`: hash router `route()` (273), `show()` (317) with View Transition and per-screen cleanup, `updateWho()` (352), `paintNav` (shown only when `game.step === "hub"`), wallet popover (436-461). `HUB_SCREENS` in `js/game.js:22`.
- Home: `js/ui/screens/hub.js` (creature card, "Places that need you", money chips). Map: `js/ui/bestiary-map.js:242` `kingdomMap()`, `js/places.js` `PLACES` (10 entries), `placeStatus()`. `js/ui/kingdom-map.js` looks like an older duplicate (check imports, delete if unused).
- Cottage: `js/ui/screens/cottage.js` (rooms dream/wardrobe/home), `HOME_UPGRADES` in `js/data/garage.js`. Saved in `play.owned[]` (shop cosmetics) and `play.home[]` (upgrades), defaults in `ensurePlay` (`js/play.js:28-62`).
- Shop: `js/ui/screens/shop.js`, `js/data/shop.js` (`SHOP_ITEMS`, seeded `stockFor`).
- No daily or login streak exists. No Energy field yet. Seeded RNG: `js/engine/rng.js` (`createRng`, `seedFrom`), already used by `stockFor`.
- Tests touching this: `e2e/helpers.js:38` (waits for `#topbar:not([hidden])`), `e2e/game.spec.js:36-45` (opens 15 routes, expects non-empty `main#app`), `tests/places.test.js:77` (asserts `/Guild Hall/`), `tests/progression.test.js:158`.

## Shell layout (desktop, 1440 wide)
```
+--------------------------------------------------------------------------------+
| [Coinhaven]  Ch.2 chip      Coins 1,240   Energy 3/5   XP 340     |
|                                  Streak 4 days            [Friends][Mail][Opts]|
+--------------------------------------------------------------------------------+
|                                                                                |
|   CENTER VIEWPORT  (#app)   screens render here                                |
|   Home = the Cottage room: creature stands in a drawn room with glowing        |
|   clickable objects (bills table, mailbox, desk, window, jar, shelf)           |
|                                                                                |
|                                                    +----------------------+    |
|   Challenges (collapsible)                         | Daily Pick ready!    |    |
|   [ ] Pay 3 bills  [ ] Play 1 side quest           +----------------------+    |
+--------------------------------------------------------------------------------+
| [Portrait] Maple the fox         DOCK: [All][Gifts][Cosmetics][Home]  < > items |
| mood: Content  dream: 62%                                  [Home][Arcade][Market]|
|                                                             [ Things To Do ]    |
+--------------------------------------------------------------------------------+
```
Things To Do opens a dialog grid of big illustrated tiles: Cottage, Arcade, Market, Daily Pick, Town Hall, Bank/Accounts, Academy, Garage, Lantern Alley, Plaza, Records, Map, Trophies. Home, Arcade and Market are permanent shortcuts.

Phone foundations (no phone work yet): shell is a CSS grid with named areas, status chips collapse via container/clamp sizing, Dock and Things To Do are `<dialog>`/drawer-ready, all controls real buttons with tokens-only styling.

## Slice 1: Persistent shell (first build)
- Add `#shell` grid in `index.html`: top status bar (extend `#topbar`), `#app` as the center viewport (stays the scroll container so existing screens keep working), new bottom bar `#bottombar` with creature strip, shortcuts and Things To Do button. Keep `#topbar` id and `hidden` behavior (e2e depends on it).
- New `js/ui/shell.js`: `paintShell(game)` called from `updateWho()` and `showNow()` in `js/app.js` and on `cc:saved`. Hide shell in prologue/onboarding as `paintNav` does now.
- New `js/ui/things-to-do.js`: dialog grid built from `PLACES` plus extras (Daily Pick, Records, Trophies), using `placeStatus()` for badges. Opens via the bottom button and the `T` key.
- Route registry: keep `SCREENS` and `HUB_SCREENS`; add one small `routes` metadata table (label, icon, tile art, tab group) so Things To Do, shortcuts and the nav read from one place.
- Remove Home and Map from the primary `#topnav`; keep Wallet and Leaderboard in the status bar.
- Rename student-facing strings: Shimmer Market to Market (`places.js`, `shop.js` title, `creature.js`, `data/scenarios*.js`, `lessons.js`, `minigames.js`, `alley.js`, `bestiary.css` content), Guild Hall to Arcade (`places.js`, `progression.js`, `guild.js`, `lessons.js`, `month.js`, `pay-with.js`, `cottage.js`, `app.js`, `dreams.js`, `bestiary.css`). Check whether `merchant: "Shimmer Market"` in `shop.js` is compared anywhere before changing (it is stored in transactions). Update `tests/places.test.js:77`, docs (`SPEC.md`, `docs/*`, CLAUDE.md if named). Keep ids.
- Notifications: add a small toast/badge/modal convention in the shell (`js/ui/toast.js` if none exists; reuse `celebrate.js` for milestone modals) and an `aria-live` announcer.
- Telemetry: log `thingsToDoOpen`, `thingsToDoPick`, shortcut clicks via `js/telemetry.js`.
- Verify: `npm test`, `npm run e2e`, `node e2e/shot.js hub` and a few routes at 1440 light/dark/dyslexia. Show the teacher screenshots; stop for approval.

## Slice 2: Home = Creature Cottage room
- Replace `hub.js` body with a drawn SVG room (new `js/ui/cottage-room.js`, using `creatureSvg` and Bestiary drawn pieces). Objects are `<button>`s over/inside the SVG with `aria-label`, focus ring, and a **glow on hover and focus** (CSS filter/drop-shadow with tokens, no color alone: also a name tag label appears).
- Objects, each a data row in `js/data/cottage-objects.js` (route, label, badge source): bills table to Accounts/Bills, mailbox to Plaza gifts, desk to Practice/Academy, window to Map, jar to Wallet, shelf to Trophies, door to Things To Do, dream poster to Dream.
- Slots (not a grid): data-defined anchor points per slot with fixed SVG positions.
- Verify: keyboard tab order, hover glow, every object routes, no console errors.

## Slice 3: Dock and Market tie-in
- `js/ui/dock.js`: tabbed (All, Gifts, Cosmetics, Home), paged (not all DOM at once), reading `play.owned`, `play.home`, gifts. Click to use/place; no drag required.
- Market purchases show "Added to your Dock" and flash the Dock. Items get catalog entries with `slot` for home pieces. Extend `data/shop.js` with home pieces; purchases still go through existing engine actions.

## Slice 4: Daily Pick, streak, challenges
- State in `ensurePlay` (`js/play.js`): `daily: { lastPickDay, lastLoginDay, streak, bestStreak }`. Day key = local date `YYYY-MM-DD`; midnight reset is local midnight (client clock, accepted risk on Spark; the teacher page can flag implausible streaks later).
- New pure `js/engine/daily.js`: `dailyKey(date)`, `streakAfter(daily, today)`, `rollDailyPick(seed, dayKey)` using `createRng(\`${seed}:daily:${dayKey}\`)` and a weighted table in `CONFIG.daily` (config.js). Different students get different outcomes via their seed. Reward kinds: coins (small/medium/big), Energy, a Market coupon, a cosmetic or home piece. Money goes through an engine action so `replayLife` stays correct; streak bonuses scale in config (for example day 3, 7, 14 milestones).
- Choice theater: pick 1 of 3 closed boxes (all seeded, order shuffled), reveal animation, then locked until midnight with a countdown.
- Login streak: claimed automatically on first load of the day, toast + streak chip in the status bar.
- Challenges: collapsible stack in the shell fed by quests/dream goals; event-driven counters (`events.emit`-style helper) so screens never poll.
- Add Energy to `play` (needed for the Arcade reward split) only if it is not already planned; confirm during the slice.
- Tests: `tests/daily.test.js` (streak edge cases, midnight boundary, same seed same pick, different seeds differ, distribution within config odds).

## Slice 5: Cottage decorating
- Slot-based customization: each slot holds one owned item id (`play.cottage = { wallpaper, floor, rug, art, shelf, lamp, plant, window }`), edited in an Edit mode with a picker from owned items (keyboard friendly, no drag). Clever and cheap: recolor variants via CSS custom properties on one SVG per item (palette swaps), so one drawing yields several shop items.
- Market sells home pieces in tiers; Daily Pick can award one.
- Persisted in `play`, saved with the game (no rules change).

## Out of scope / guardrails
- No pet needs, no premium currency, no trading, no free-text chat, no phone layout work, no Blaze/Cloud Functions, no Firebase rules changes.
- Keep CLAUDE.md rules: tokens only, `icon()` not emoji, no em-dashes or semicolons in student text, telemetry on every new screen and choice, config for all numbers, engine stays pure.

## Documentation to update at each slice
`docs/PROGRESS.md` (checklist, decisions, next step), a new `docs/UI-REBUILD.md` holding this plan, `docs/MINIGAMES.md` (Arcade and Market names), and `SPEC.md` renames. Side quest builds (Fee Detective and the rest) move after the shell slices and are built into the new shell.

## Verification (every slice)
`npm test`; `npm run e2e` (route list and topbar waits may need updating for the new shell); `node e2e/shot.js <route> [--dark] [--dyslexia]` at 1440 and 1280; no console errors; commit and push; stop for teacher approval.
