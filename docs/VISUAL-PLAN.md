# Visual quality: options to plan later

The teacher's note (2026-10-20): "the whole visual aesthetic is mid quality. I want to plan later on different ways we can improve this." Nothing here is built yet. It's a menu to choose from together. They're grouped by effort, with what each would change.

## Where it stands now

- Creatures are flat SVG shapes built in code (`js/ui/creature-art.js`). They're consistent and cheap to extend, but simple: no shading, outlines or poses.
- The UI is clean but generic: system fonts, one purple accent, rounded cards, and emoji for most icons.
- Screens are mostly text and buttons on a beige page. There's little sense of place (the "fantasy kingdom" lives mostly in names).
- Motion: only the unlock pop-ups and a few small transitions.

## Quick wins (a day or two each)

1. **Typography:** one display font for headings and numbers (a rounded, friendly face), plus a tighter type scale. Self-hosted like Dancing Script.
2. **Creature art polish:** a soft outline, a belly highlight and a ground shadow on every species, plus a gentle idle "breathing" animation on the hub (with reduced motion respected).
3. **A custom icon set:** swap emoji for a small set of matching SVG icons (wallet, score, shop, trophy, inbox, friends). Emoji look different on every computer, and an icon set looks designed.
4. **Color system:** a deeper palette with a warm "kingdom" accent next to the purple, and consistent good, warning and danger colors. Dark mode for the whole game, not just Account Management.
5. **Card polish:** subtle shine and texture on the card art, and a little tilt on hover.

## Medium projects (a few days each)

6. **A hub "room" or kingdom scene:** the creature stands in an illustrated scene (its background), with buildings for the Bank, Shop, Practice Desk and Friends instead of a row of buttons.
7. **Month board redesign:** a calendar or quest-board look for the month's tasks, with cards that flip over when chosen.
8. **Micro-animations:** coins flying into checking after a shift, the score gauge needle sweeping, a stamp landing on statements, confetti on achievements.
9. **Sound (optional, off by default):** soft clicks, a coin chime and an achievement fanfare, with a mute switch.

## Bigger moves (a week or more)

10. **Professional creature illustrations:** commission or license a consistent illustrated style for the 6 species. Accessories need to be redrawn to match, or drawn as layered PNG or SVG art. This is the biggest jump in quality, and it costs money and time.
11. **A full art direction pass:** a mood board, picked reference games (for example Webkinz, Neopets, Duolingo or Animal Crossing UI), and a style guide that every screen follows.
12. **Character animation:** poses and expressions that react to events (happy after paying in full, worried at a late fee), using a sprite sheet or a small animation library.

## How we'd decide

- The teacher picks 2 or 3 reference looks they love (screenshots are fine).
- We try one quick win end to end (for example typography plus creature polish) on the hub and the month screen, and compare before and after with students in the pilot.
- Ask students in the chapter ratings which screen they'd most like to look better.
