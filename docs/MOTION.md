# Motion and living creatures (Phases 15 to 17)

Teacher request 2026-10-21: make the game captivating for Gen Z and Gen Alpha students.
- Whimsical animations in the style of Josh W. Comeau: spring physics, boops, sparkles, animated SVG icons with micro-interactions, and particles at moderate intensity.
- Much more detailed creatures, with eyes that follow the mouse.
- Brasika for headings.

## Decisions (teacher, 2026-10-21)

- **Font:** Fraunces for now (OFL, `fonts/Fraunces.woff2`). Brasika is free for personal use only, and the free file is a trial. When the teacher buys a Brasika **web** license and sends the file, add its `@font-face` in `css/tokens.css` and put it first in `--font-display`.
- **Creatures:** "rich storybook". Still drawn in code (`js/ui/creature-art.js`), so every palette, pattern, accessory, eye style and age detail keeps working. Not photo-realistic.
- **Motion:** Full by default. The Motion setting (Full or Calm) is in Account settings. Calm, or the computer's reduce-motion setting, turns everything off (`motionOn()` in `js/ui/motion/spring.js`).
- **Order:** Phase 15 motion, Phase 16 effects, Phase 17 creatures. Push and stop for review after each.
- **Design help:** the `design-taste-frontend` skill (installed globally for Claude Code) can guide the visual work.
- **Rules:** no build step and no npm runtime dependencies, so the motion code is written in-house. Use tokens only. Never use color alone. Telemetry for anything new. Must run well on school laptops at 1280px.

## Phase 15: done

- **`js/ui/motion/spring.js`:**
  - `stepSpring` and `springEasing` are pure (tested in `tests/motion.test.js`).
  - `animate()` runs springs on one shared animation loop.
  - `springStyle(el, {scale, rotate, x, y})` uses the individual CSS `scale`, `rotate` and `translate` properties, so it never fights layout transforms.
  - `publishSpringTokens()` sets `--ease-gentle`, `--ease-bouncy`, `--ease-snappy`, `--ease-wobbly` and the matching `--dur-*`.
- **`js/ui/motion/boop.js`:** hover boops and press squish on every button, chip and map place. `data-boop="rotate|scale|wiggle|none"` picks the style.
- **`js/ui/motion/ticker.js`:** `countTo()` makes the money chips roll to new values.
- **Elsewhere:**
  - View Transitions between screens (`show()` in `js/app.js`)
  - springy pop-ups
  - Motion setting (`js/ui/settings.js`)

## Phase 16: done (2026-10-22), built for the Mossy Bestiary

- `js/ui/motion/particles.js`: one pooled canvas system (MAX 80, pure `stepParticle` and `addTo`, tested in `tests/particles.test.js`). Presets: `coins` (hop up, then home into the Checking line, used by `coinsFly`), `leaves` (unlock and achievement pop-ups, drawn inside the open dialog), `dust` (shop purchase), `motes` (foxfire, right answers at the Practice Desk, Factor Checks and Lantern Alley), `hearts` (petting in the Cottage and the creator). Colors come from the bestiary tokens.
- `js/ui/motion/sparkles.js`: one timer twinkles gold stars around anything with `data-sparkle` (map notes that ask for something, Home's "Places that need you", unread letters, a dream stage that's ready, pop-up icons).
- Icons: every shape has `pathLength="1"`. Icons made in the 700ms after a screen opens draw themselves in (`drawIconsFor` in `js/ui/icons.js`). Each icon has its own hover move by `data-ico` in `css/app.css` (the gear spins, coins jingle, the lock shakes, the check redraws, and so on), and those skip the generic boop.
- Map (`js/ui/bestiary-map.js`): flags wave, pennants sway, the fountain splashes, windows glow at night (dark mode), plus the earlier smoke and lanterns.
- Calm and reduce-motion stop all of it. Telemetry: `creaturePet`.

### Original plan

1. **`js/ui/motion/particles.js`:** one full-screen `<canvas>` with a pooled particle system (gravity, drag, spin, fade), capped at about 80 live particles. Presets:
   - coin burst when earning
   - confetti on unlocks and achievements
   - heart puffs when petting a creature
   - dust when buying
   - stars for a right Lantern Alley call

   Replace the DOM-based `coinsFly` and `confetti` in `js/ui/fx.js` but keep those function names so callers keep working.
2. **`js/ui/motion/sparkles.js`:** Josh-style twinkling SVG stars around things that are new or need attention:
   - place badges with tone "action"
   - new letters
   - unlock pop-ups (`js/ui/celebrate.js`)
   - a dream stage that's ready
3. **Animated icons** (`js/ui/icons.js`):
   - **Draw on appear:** line icons draw themselves the first time they show up (stroke-dash).
   - **Hover micro-interactions** per icon, defined in a small map:
     - the gear spins
     - coins jingle
     - the inbox flap opens
     - the trophy shines
     - the lock shakes
     - the check draws in
     - the bell rings
     - the heart beats
4. **The kingdom map comes alive** (`js/ui/kingdom-map.js`):
   - chimney smoke rises
   - the flag waves
   - the fountain splashes
   - windows glow at night

## Phase 17: living creatures

1. **Eyes that follow the mouse:**
   - Each eye becomes white sclera, an iris and a pupil group (`.cc-pupil`) inside `eyes()` in `creature-art.js`.
   - A single global tracker, `js/ui/motion/gaze.js`, springs every visible creature's pupils toward the pointer, clamped inside the eye. It uses one IntersectionObserver for visibility.
   - On touch screens the eyes follow the last tap, then idly wander.
   - Happy and wink eyes stay as drawn shapes. Starry eyes track as a whole.
2. **Life:**
   - random blinks every 3 to 6 seconds
   - eyes widen when the pointer gets close
   - squash and stretch with hearts when clicked ("pet")
   - a happy hop on earning, a worried wobble on an overdraft or a late mark
3. **Richer art:**
   - radial-gradient shading
   - soft shadow under the head and limbs
   - rim light
   - texture by species: fur strokes (fox, bunny), scales (dragon), feather barbs (owl, phoenix), a glassy sheen (golem, jellycorn)
   - cheek blush and detailed paws

   Gradient ids must be deterministic per look, like the pattern clip ids today.
4. **Performance:** heavy detail only on big views (Cottage, creator, title). Small avatars (top bar, roster, friends) use a lite level through a `detail` option on `creatureSvg`.

## Verification for each phase

- `npm test` (add tests for any pure logic and for deterministic creature SVG output).
- Headless Chrome checks with the scratchpad `cdp.mjs` scripts:
  - no console errors
  - Calm mode stops the motion
  - pupils move toward a synthetic pointer (Phase 17)
- Screenshots at 1280px and 390px in light, dark and dyslexia modes.
- Re-run the full phased journey (the `p10.mjs` scratchpad script, or click through prologue to Chapter 4 by hand).
