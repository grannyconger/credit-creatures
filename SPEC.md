# Credit Creatures: Build Specification

(The game was called Credit Life until 2026-10-20.)

Version 1.0 · October 19, 2026 · Owner: Brian Weaver (bweaver@greermiddlecollege.org)

This file is the single source of truth for the build. It merges the original game plan with the teacher's feedback. Where the two disagree, the feedback wins. Read this whole file before planning any phase.

---

## 0. Rules for Claude Code

- Build one phase at a time (Section 21). Stop at the end of each phase and wait for approval.
- Keep `CLAUDE.md` short: project rules, current phase, how to run tests, how to deploy.
- The engine (Section 10) is pure JavaScript with no DOM access, so it can be tested in Node.
- Commit at the end of every phase with a clear message.
- Never put secrets in the repo. The Firebase web config is public by design and is fine to commit. Security comes from Firestore rules (Section 19).
- Do not touch the separate Credit Quest project or repo.
- Plain language in all student-facing text. Target reader: a 15-year-old with no credit knowledge.
- Writing style for all game text: no em-dashes, no semicolons.

---

## 1. Vision

A replayable game where students raise a fantasy creature through its credit life across the semester. They earn money in minigames, buy things with debit, credit or buy-now-pay-later, choose between kinds of credit, and watch the creature's credit report and score respond to how they actually manage accounts.

**The student's job (added 2026-10-20):** the student is the creature's **Guardian of Coin** in the Kingdom of Coinhaven. The creature can't manage money alone. Every money choice the student makes changes its life and decides whether its dream comes true.

**Key goal (SWBAT = Students Will Be Able To):** see and explain the relationship between life choices and the movement of the 5 score factors.

### Standards coverage

| Standard | Role | How the game covers it |
|---|---|---|
| 1. Types and sources of credit | Primary | Every credit type is a real account students can open |
| 3. Score components and credit profile | Primary | Score and report are computed live from their accounts |
| 5. High-risk strategies and pitfalls | Primary | BNPL stacking, maxed cards, cosigning, payday and title loan scenarios |
| 2. Costs of credit | Supporting | Interest, fees and terms cost real in-game money |

Left out (covered elsewhere in class): loan applications in depth, amortization schedules, consumer law (Std 4).

### Design principles

- **Experiential:** consequences come from account activity, not right/wrong buttons.
- **Different every session:** random events, varied numbers, rotating shop stock.
- **Clean save points:** every session can end at a save point without losing progress.
- **Real math allowed:** include calculations a young adult would realistically do (tips, interest, utilization, payoff time), even if a calculator is needed. The game still shows the math after each answer.
- **Teacher visibility:** a dashboard shows progress by standard.
- **Engagement priorities (from the teacher):** custom characters, naming the character, and competitive leaderboards matter most.

---

## 2. Classroom context

- Greer Middle College Charter High School, Taylors, SC
- Class size: 20 to 25 students
- Schedule: 90-minute periods, Tuesday and Thursday
- Devices: Windows or Mac laptops (desktop/laptop layout first, must still work at 1280px wide)
- Teachers with dashboard access: `bweaver@greermiddlecollege.org`, `brobinson@greermiddlecollege.org`
- Student email domain: `greermiddlecollege.org`
- District has approved Google Firebase for student data

---

## 3. Theme and characters

- **Theme:** fantasy kingdom.
- **Players are not humans.** Each student adopts and names a fictional, fantastic creature (think Webkinz). The student makes credit decisions on the creature's behalf.
- **Creature creator:** pick a species from a starter list (original designs only, for example a moss dragon, a lantern fox, a crystal owl, a puddle golem), then a color palette and a few accessories. Name is required and editable later. An optional last name (added 2026-10-20) makes a full name, printed on the creature's bank cards and used for check writing and signatures.
- **Aging (later, not a priority):** the creature looks a little older as it ages, with small details only (for example a few gray whisker tufts, reading glasses, a slightly softer posture). Same species, palette and accessories. Planned after the pilot unless there is spare time in Phase 8.
- Accessories and backgrounds can be bought in the Shop (Section 15).
- All art is original. No Nintendo, Webkinz or other existing characters.
- **Story intro (2026-10-20):** 3 short panels after the first sign-in (the kingdom, you are the Guardian of Coin, every choice matters). Skippable, shown once. Text in `js/data/story.js`.
- **Dreams (2026-10-20):** right after the creature creator, the student picks one dream for the creature: a home of its own, its own shop, a grand adventure, or Scholar of Coinhaven. Each dream has a savings goal, a score target and two habits (nothing in collections, no late payments in the last 6 months). The hub, the Cottage and each chapter summary show 3 meters (savings, score, habits). When all three are met, the Cottage offers "Make the dream come true": it spends the savings goal, celebrates, and earns the Dream Come True achievement. Data in `js/data/dreams.js`.
- **The kingdom hub (2026-10-20):** an illustrated map of Coinhaven is home base. Every place opens from the map and has a "Back to the kingdom" button. Each building shows a badge with words (for example "2 decisions waiting"), never color alone.

  | Place | What it's for |
  |---|---|
  | Town Hall | This month's news, decisions and End Month |
  | Guild Hall | Work shifts to earn money |
  | The Gilded Vault | Bank: wallet, bills, statements, score, report, letters |
  | Shimmer Market | Spend money in the shop |
  | The Academy | Practice Desk for XP, trophies and ranks |
  | Friendship Plaza | Friends, groups and gifts |
  | Your Cottage | The creature, its dream, customizing and settings |

  The creature in the top-right corner opens the Cottage from any screen.
- Kingdom flavor appears in names and art (the bank is "The Gilded Vault," the town is a market village), but **all credit terms stay real** (APR, utilization, hard inquiry, etc.).

### Look and accessibility (2026-10-20)

- **Design tokens** in `css/tokens.css`: every screen uses them, so light, dark and dyslexia modes work everywhere.
- **Dark mode:** follows the computer, or the student picks Light or Dark. The kingdom map turns to night.
- **Dyslexia mode:** OpenDyslexic, more line spacing, left-aligned text, no italics.
- Settings live in the Cottage (and on the sign-in screen) and follow the student to any computer.
- **Color-blind-safe** colors for the 5 score factors, checked with a palette validator in both modes. States always carry an icon and words.
- **Custom icon set** (`js/ui/icons.js`) for buttons, tabs and places. Emoji stay in story text and shop items.
- **Fonts** (self-hosted, OFL): Fredoka for headings, OpenDyslexic, Dancing Script for signatures.
- **Shiny cards:** light sweep, holographic stripe on premium cards, embossed numbers and a gentle tilt. All motion stops under reduced-motion.

---

## 4. Real brands and icons

- Use real brand and product names in text: Visa, Mastercard, American Express, Discover, Capital One, Chase, two local credit unions (Greenville Federal Credit Union and Truliant Federal Credit Union, teacher request 2026-10-20), and product names such as Capital One Venture X or a credit-builder card.
- **Never use or approximate real logos.** Represent each brand with an original emoji or simple shape instead. Do not recreate signature marks (for example, no overlapping red and yellow circles, no blue-and-gold wordmark).
- Suggested icon mapping (adjust freely, keep it consistent):

| Brand | Icon |
|---|---|
| Visa | 🔷 |
| Mastercard | 🟠 |
| American Express | 🛡️ |
| Discover | 🧭 |
| Capital One | ⛵ |
| Chase | 🏛️ |
| Greenville Federal Credit Union | 🌲 (name badge in blue #1D61B1, cream text, gold #DFB50C ring) |
| Truliant Federal Credit Union | 🌟 (name badge in royal blue #0033a0 and gold #fdda24) |
| Venture X (product) | ✈️ |

- All APRs, fees and limits are **game values inspired by real offers**, not current real terms. Show a small note in the card shop: "Terms are simplified for the game."

---

## 5. Player journey and semester timeline

```
Google sign-in (school accounts only) -> story intro -> create creature -> pick its dream -> join class with a code
-> AGE 16: teen option (join a parent's card, or a teen debit card)
-> tutorial months: first work shift, first purchase, read your report
-> AGE 18: DESIGN YOUR CARD -> approved or denied, with reasons
-> KINGDOM HUB: Town Hall (time passes), Guild Hall (earn), Market (spend),
   Vault (account management, time paused), Academy (XP), Plaza, Cottage
-> chapter summary -> reflection -> saved
Next class: sign in -> "Previously on your credit life..." -> next released chapter
```

| Chapters | Age | What happens |
|---|---|---|
| 1 | 16 -> 18 | Onboarding, then Design Your Card |
| 2 to 4 | 18 to 19 | First card, first job, a car decision, student loan offers |
| 5 to 8 | 19 to 21 | College or work, emergencies, offers and temptations |
| 9+ | 21 to 22+ | Apartment, upgrading from a secured card, bigger decisions |

### Chapter release (teacher-controlled)

- Chapters release like modules from the teacher dashboard.
- Students can replay earlier chapters but **cannot play ahead** of the latest released chapter. This keeps the class together and stops students finishing outside class.
- Replaying an earlier chapter is practice mode: it does not change the live save, score or XP. Decide the exact replay rules in Phase 4 and confirm with the teacher.

---

## 6. Onboarding (age 16)

- **Profile:** display name from Google (editable), creature creator, class join code.
- **Join a parent's card (authorized user):** the game secretly picks a Responsible, Average or Maxed-out parent. The parent's history shows on the creature's report. A maxed-out parent drags the score down. Students can ask to be removed later.
- **Teen debit card:** builds no credit and carries no risk. Students may pick both options.
- **Tutorial months (about 5 minutes):** one guided work shift, one debit purchase, a "your report is thin" explainer, and a tour of the 5 score factors.

---

## 7. Design Your Card (age 18)

The centerpiece of Chapter 1. Goal: introduce **qualifications and applications** and show **tradeoffs**.

### Lesson moment: lenders vs payment networks

Before choosing, a short explainer (2 to 3 screens max):
- **Payment network** (Visa, Mastercard): the "roads" a payment travels on. They do not lend you money.
- **Issuer / lender** (Capital One, Chase, a credit union): the company that approves you, sets your limit and APR, and sends your bill.
- **Both** (American Express, Discover): some companies run the network and lend.
- Analogy for students: the network is the highway, the issuer is the car company that decided whether to sell you a car and on what terms.

### Choices (pick from lists, not fully custom)

| Choice | Options |
|---|---|
| Card product | Secured card · Student card · Credit-builder card · Premium travel card (for example Venture X) |
| Issuer | Capital One · Chase · Discover · Credit union (each offers a subset of products) |
| Network | Shown on the product, not chosen freely (realistic) |
| Requested limit | Slider |
| Design and material | Choose from a list of looks (plastic colors, metal, clear) and a card nickname |
| Secured deposit | Sets the limit, comes out of checking |

### Live tradeoff display

As the requested limit slider moves up, show in real time how the other variables change: **approval risk, APR, annual fee, required income, required score**. Metal and premium designs come with higher annual fees and stricter requirements.

### Approval

- Depends on score (or no score), months of history, income from work shifts, existing debt, and product.
- Secured: almost always approved. Student: needs some income. Credit-builder: easy approval. Premium travel card: almost always denied with no history (this denial is part of the lesson).
- Result screen: approved or denied, terms (APR, limit, fees), and plain-language reasons.
- Every application adds a hard inquiry. Students can redesign and reapply and watch inquiries pile up.

---

## 8. Simulation: the month loop

Time passes here, at Town Hall. Target 3 to 4 real minutes per game month. Shifts happen at the Guild Hall and bills are paid at the Vault, then the student comes back to Town Hall to end the month.

- **Life card (1 per month):** random event, for example a $400 car repair, broken phone, medical bill, raise, birthday money, lost hours, tax refund.
- **Decision cards (up to 5 per month):** credit choices drawn from the scenario pool (Section 13), only ones that fit the creature's situation. Note: 5 per month is the teacher's setting. Tune in the pilot if months run long.
- **Work shifts (up to 3 per month):** minigames that pay into checking.
- **Shop (optional):** pay with debit, credit card or buy-now-pay-later.
- **End Month:** statements close, interest and fees apply, payments are reported, the score updates with a reason, for example "Score +12: your utilization dropped from 45% to 18%."

---

## 9. Chapters and achievements

- **3 game months per chapter** (teacher setting, adjustable on the dashboard).
- Random chapter goals are **replaced by a large achievements system** (Section 16).
- **Chapter summary:** score change, best and worst decision, achievements earned this chapter, XP gained.
- **One-question reflection** (1 to 3 sentences), for example "What helped or hurt your score this chapter?" Saved for the teacher.
- **15-minute session timer** nudges students toward a save point. "Save and quit" is always available. (Periods are 90 minutes, so the teacher can run several sessions per class.)

---

## 10. Engine: how accounts update each month

At End Month the game runs these steps in this order, like a real bank and credit bureau:

1. Purchases post to accounts.
2. Statements close: interest on carried balances (APR ÷ 12) and any fees.
3. Minimum payment set: $25 or 2% of the balance plus interest, whichever is larger.
4. Missed due date: $30 late fee. 30+ days late is reported, then 60, 90, then the debt goes to collections (about 120 days unpaid).
5. Loan and BNPL payments come out of checking.
6. Everything is reported to the credit report.
7. Accounts age one month. Hard inquiries stop counting after 12 months.
8. Score is recalculated.

The engine must be deterministic given a random seed, so tests and bug reports can be replayed.

---

## 11. Credit score model

Simplified score with real FICO weights, calculated from the creature's actual report.

| Factor | Weight | What drives it |
|---|---|---|
| Payment history | 35% | On-time %, how recent and how late any misses are, collections |
| Amounts owed | 30% | Overall and per-card utilization, loan balance vs original amount |
| Length of history | 15% | Oldest account and average account age |
| Credit mix | 10% | Cards plus loans, number of account types |
| New credit | 10% | Hard inquiries in the last 12 months, newly opened accounts |

- No score until 6 months of reported history. Joining a parent's card can speed that up.
- Score range 300 to 850.

### Factor explainers tied to life choices (teacher priority)

The factor descriptions alone are too abstract. Every factor needs **"life choice -> factor movement"** examples written for a 15-year-old, shown in My Score and used in the Factor Check questions below. Examples:

| Life choice | Factor that moves | Why |
|---|---|---|
| Forgot to pay the phone-shop card while on a trip | Payment history ↓ | A late payment is on your record |
| Put a $450 laptop on a $500 limit card | Amounts owed ↓ | You are using 90% of your limit |
| Closed your first card because you got a new one | Length of history ↓ | Your oldest account disappears |
| Took a car loan while already having a card | Credit mix ↑ | You now handle two kinds of credit |
| Applied for 3 store cards for holiday discounts | New credit ↓ | 3 hard inquiries in one month |

### Factor Check (new mechanic)

Short scenario-based questions that reinforce how each life choice moves a factor, in context. Format: a 1 to 2 sentence situation, then "Which factor moves, and which way?" Use them:
- right after a Decision card resolves (one quick question, optional),
- inside the Practice Desk (Section 14),
- in the score-drop puzzle scenario.

---

## 12. Account types (pilot)

Simplicity and high playability come first. Other accounts can be added in later versions.

### Included in the pilot

| Type | Std | Default terms |
|---|---|---|
| Checking / debit | 1 | Not reported. Overdraft fee $35 |
| Authorized user | 1, 3 | Parent's history shows on the report |
| Secured card | 1 | Limit = deposit ($200 to $500), APR ~26% |
| Student card | 1 | Limit $500 to $1,000, APR ~22% |
| Credit-builder loan | 1 | $500 held in savings while you pay monthly |
| Buy now, pay later | 1, 5 | 4 payments over 6 weeks, late fees |
| Auto loan | 1, 2 | 36 to 72 months, APR depends on score |
| Federal student loan | 1 | Deferred while in school, fixed rate |
| Cosigned account | 1, 5 | A friend's missed payments hit your report |

### Not tracked as accounts in the pilot

Store card, standard/rewards card, auto lease, private student loan, payday loan, title loan, rent-to-own.

**Resolution for scenarios that mention these (see Section 22):** they still appear as one-time Decision cards. The game narrates the cost and consequence (money lost, fees, a report mark if relevant) without opening a persistent account. Collections is a **report status**, not an account the player opens, so it stays in the engine.

---

## 13. Scenario catalog

All of these stay in the catalog. Each appears only when it fits the creature's situation and is tagged with standards. The pilot ships with about 20 (pick a balanced mix across groups), and the rest are added in Phase 8.

**Types of credit (Std 1)**
- Store card at checkout: 20% off today vs 30% APR
- Car: credit union loan vs dealer financing vs lease
- Federal vs private student loan
- Credit-builder loan offer from a credit union
- Prescreened card offer in the mail (soft vs hard inquiry)
- Secured card upgrades to unsecured, deposit returned
- Credit limit increase offer
- Balance transfer: 0% for 12 months with a 3% fee
- Rewards card with a $95 fee: worth it for your spending?
- Becoming or staying an authorized user

**Costs (Std 2)**
- Minimum payment trap: see the 18-month payoff
- Deferred-interest "no interest if paid in 6 months" promo
- Annual fee renewal: keep, downgrade or close
- 60-month vs 72-month car loan
- Late fee and penalty APR after a missed payment
- Cash advance at an ATM

**Pitfalls (Std 5)**
- Payday loan vs credit union small loan vs emergency fund
- Payday rollover: can't pay in two weeks
- Title loan offer
- Rent-to-own gaming console
- BNPL stacking: four plans at once
- Cosign a friend's phone plan
- Maxing out a card for a trip
- Ignoring a medical bill until it goes to collections
- Debt "settlement" company ad
- Unknown account on your report: freeze your credit
- Closing your oldest card
- Applying for 3 cards in one week

**Credit profile (Std 3)**
- Checking your own report (soft inquiry, no penalty)
- Finding an error on your report
- Removing yourself from a parent's maxed-out card
- A landlord or employer pulls your report
- "Why did my score drop?" puzzle

Scenario data lives in its own data file(s), one object per scenario, so new ones can be added without touching engine code.

---

## 14. Account Management (time paused)

Students can visit any time without losing game time.

- **Wallet:** checking balance and every account's balance, limit, APR, minimum due, due date and a utilization bar.
- **Debit card and digital wallet (added 2026-10-20):** at 18 the checking account comes with a Gilded Vault debit card (the teen debit card upgrades to it). A phone digital wallet 📱 holds the debit card and every open credit card. Whenever something costs money (decision cards in Phase 4, the shop and BNPL checkout in Phase 6), a "Pay with" picker shows each option with its live numbers: checking balance for debit, available credit and the new utilization for each card. Debit is declined when checking is too low. The picker shows what each choice does ("spends your money now", "borrows, due next month, adds to utilization"). The Wallet screen shows the cards as card art with the creature's full name.
- **Statements:** purchases, payments, interest, fees, new balance and minimum due, month by month.
- **Pay bills:** pay in full, the minimum, or a custom amount. Payoff preview, for example "Minimum only -> 14 months, $86 interest. Pay $60/month -> 4 months, $19 interest."
- **AutoPay:** optional. If checking runs short, the payment bounces with a fee.
- **My Score:** 300 to 850 gauge, 5-factor breakdown with life-choice explainers (Section 11), and a history chart.
- **My Credit Report:** accounts, a 24-month on-time/late grid, inquiries, collections, authorized-user accounts, and "helping you / hurting you" callouts.
- **Practice Desk:** 5 quick questions per visit with new numbers each time, instant feedback, accuracy tracked by standard. Earns Unicorn Sparkle Points.
- **Notifications inbox (new):** fees, alerts, payment reminders, statement-ready notices, score changes, achievement unlocks, new chapter released. Each type has its own icon and color, for example:

| Type | Icon | Color |
|---|---|---|
| Fee charged | 💸 | red |
| Payment due soon | ⏰ | amber |
| Payment received | ✅ | green |
| Score change | 📈 / 📉 | blue |
| Achievement / XP | 🏆 | gold |
| Security / report alert | 🚨 | red |
| Teacher / chapter update | 📣 | purple |

  Unread count badge on the hub. Mark read, mark all read.
- **Customizable theme (new):** students choose a color theme for the Account Management screens (several preset palettes, all readable and high contrast).

### Practice Desk question types

Real math is allowed (Section 1). Show the worked math after each answer.

| Type | Example |
|---|---|
| Running balance | "$240 balance, buy $35, pay $100. New balance?" |
| Utilization | "$300 balance on a $1,000 limit is what percent?" |
| Monthly interest | "$600 at 24% APR, carried one month: about how much interest?" |
| Tip math | "Subtotal $38.50, add a 20% tip. Total?" |
| Debit vs credit | "Which one builds credit history?" |
| Card accounting | "Does a purchase raise or lower your card balance?" |
| Account match | "Which type of credit fits this situation?" |
| Report reading | A mini report: "What's hurting this score most?" |
| Factor Check | "You closed your oldest card. Which factor moves, and which way?" |

---

## 15. Unicorn Sparkle Points (formerly Coach Bonus)

- Correct Practice Desk and Factor Check answers nudge the displayed score up slightly: +1 per correct answer.
- Caps: **10 per chapter, 30 total** (teacher-adjustable).
- Always shown separately, for example "Score 702 + 6 ✨ Unicorn Sparkle Points," and labeled as a classroom bonus so students don't think real scores work this way.
- Sparkle Points are separate from XP (Section 16).

---

## 16. Achievements, XP and leaderboard (teacher priority)

This is a core engagement mechanic. Build it out fully.

- **Lots of achievements.** Aim for 40+ in the pilot across categories. Each awards XP. Some are hidden until earned.
- **XP** accumulates on the student's account and never decreases.
- **Class leaderboard ranks by XP**, so careful, consistent play wins, not having the most cash. Teacher can toggle the leaderboard on or off.
- Show levels or ranks derived from XP (for example kingdom ranks: Squire, Knight, Treasurer, Grand Vizier).

### Achievement categories and examples

| Category | Examples |
|---|---|
| Payment habits | First On-Time Payment · Perfect Payer (12 on-time months) · Never Paid a Late Fee (a full chapter) |
| Utilization | Utilization Ninja (under 10% for a chapter) · Under 30 Club · Paid in Full x5 |
| Building credit | Thin to Thick (first score) · Score 700 · Score 750 · Credit Mix Master |
| Debt | Debt Free · Payoff Sprint (pay off a balance in one month) |
| Smart choices | Said No to the Store Card · Payday Survivor · Spotted the Scam (settlement ad) · Report Detective (found an error) |
| Learning | Practice Desk streaks · 100% Factor Check chapter · Standard mastery badges |
| Minigames | High scores and streaks per minigame |
| Creature | Named Your Creature · Fully Dressed · Room Decorator (background collector) |
| Persistence | Chapters completed · Reflections submitted |

- Personal records: highest score, longest on-time streak, highest XP chapter.

---

## 17. Minigames (work shifts)

Quick (30 to 60 seconds), semi-related to the content. Pay depends on performance. Jobs unlock with age and pay rises with experience.

| Minigame | Job | Skill | Phase |
|---|---|---|---|
| **Ledger Sort** (Asset / Liability / Equity) | Bookkeeper | Sort items into ASSET, LIABILITY or EQUITY. Here equity means investments: owning a share of a business, like stock or an index fund (teacher decision 2026-10-20) | **Pilot, top priority** |
| Cashier Rush | Shopkeeper | Make correct change quickly | Pilot |
| **Check Writer** (added 2026-10-20) | Scribe at The Gilded Vault | Fill in a paper check from an order or bill: date, payee, amount in numbers, amount in words, memo, signature. Part 2 endorses the back of a paycheck before depositing it. Signatures use a full-screen signature pad (touch, pen or mouse) with a "type my signature" option that writes the creature's full name in a cursive font | Phase 6 |
| Check & Tip | Tavern server | Given a subtotal, add a 20% tip and give the total within 20 seconds | Later |
| Delivery Dash | Courier | Timing and dodging (Frogger-style) | Later |
| Lawn Pattern | Groundskeeper | Path-tracing puzzle | Later |
| Pet Sitter | Creature sitter | Memory and sequence | Later |
| Word of the Day | Scribe | Wordle-style guess using credit vocabulary | Later |
| Daily Crossword | Scribe | Basic crossword with credit terms, including some difficult ones | Later |

Tutor Time is cut.

---

## 18. Shop

- **Wants:** cosmetic items for the creature and **backgrounds** (no full room builder, keep it simple).
- **Needs:** occasional required costs such as textbooks or work shoes.
- **Checkout:** debit (needs enough in checking), credit card, or buy-now-pay-later. Store-card checkout offers appear only as the store-card Decision card (Section 12).
- Stock rotates each chapter, with limited-time items for variety.

---

## 19. Economy and pacing numbers (teacher settings)

| Setting | Value |
|---|---|
| Game months per chapter | 3 |
| Decision cards per month | 5 |
| Work shifts per month | 3 |
| Pay per shift | $40 to $120 |
| Session length | 15 minutes |
| Sparkle Points cap per chapter / total | 10 / 30 |

- From age 18: phone bill (about $45) and transportation (car payment, or a bus pass about $30).
- Target: a careful student can afford one $600 "want" every couple of chapters without debt, while carried balances visibly drain money.
- All numbers live in one config file and are tunable after the pilot.

---

## 20. Teacher dashboard and grading

Private page at `coachw.club/credit-creatures/teacher` (exact path set in Phase 1).

- Create classes and get a join code for each.
- **Chapter release controls** (Section 5).
- **Roster:** XP and rank, score, chapters played, reflections submitted, on-time %, utilization, account types, practice accuracy by standard, achievements count, and flags (payday or title loan taken, collections, maxed cards, many inquiries, numbers that don't match the activity log).
- **Student detail:** creature, credit report, score history, decisions, reflections, achievements.
- **Controls:** pause play, release chapters, set months per chapter, toggle leaderboard, reset a student.
- **CSV export** (comma-separated values file) for the gradebook.

**Grading note:** game state is saved from the browser, so a student who knows developer tools could try to edit money or score. Firestore rules (Section 21) and the activity-log check reduce this. Grade on things that are hard to fake: Practice Desk accuracy, chapters completed and reflections. Treat score and XP as motivation, not a grade.

---

## 21. Tech stack, hosting and privacy

### Hosting

- **Front end:** GitHub Pages from the repo `credit-creatures` (renamed from `credit-life` on 2026-10-20). The teacher's custom domain already maps repos to `coachw.club/<repo-name>`, so the game lives at **`coachw.club/credit-creatures`**.
- **Back end:** Firebase (free Spark plan only). Firebase Authentication for Google sign-in and Cloud Firestore for saves, classes, XP and leaderboards.
- Add `coachw.club` to Firebase Authentication > Authorized domains.

### Stack

- Plain HTML, CSS and JavaScript ES modules. No framework, no build step, so GitHub Pages serves files as-is.
- Firebase modular SDK loaded from the official CDN.
- Engine and scenario logic are pure JS modules tested with Node's built-in test runner (`node --test`).
- All relative paths must work under the `/credit-creatures/` subpath.

### Sign-in and access

- Google sign-in. Restrict to `@greermiddlecollege.org` in two places: the sign-in prompt hint and the Firestore security rules (rules are the real gate).
- Teacher access by the email allowlist in Section 2, enforced in rules.
- Students read and write only their own data. Teachers read only their own classes. Leaderboard exposes only creature name, display name and XP.

### Data stored

Name, school email and game data only. No other personal data.

### Saving

Automatic at every month's end and on Save and Quit, so the bell never loses progress.

---

## 22. Resolved conflicts in the feedback

Claude Code should follow these defaults and mention them at the start of the relevant phase so the teacher can override.

1. **Real calculations vs "no calculator needed":** real math is allowed. Keep the numbers realistic, and always show the worked math afterward.
2. **Premium/rewards cards unchecked as accounts, but wanted in Design Your Card:** premium products appear in the card shop as aspirational options that are almost always denied early. If one is ever approved, it behaves as a standard card in the engine.
3. **Payday, title loan, rent-to-own and store card unchecked as accounts, but their scenarios are kept:** handled as one-time Decision cards with narrated consequences (Section 12).
4. **Collections unchecked:** kept as a credit report status, since it is an outcome of unpaid debt, not an account a player opens.
5. **5 decision cards per month with a 15-minute session:** keep 5 as the setting, measure real play time in the pilot, and tune.

---

## 23. Build phases

The pilot is Phases 1 to 7. Stop and wait for approval at the end of each.

| Phase | What gets built |
|---|---|
| 1 | **Setup:** repo structure, `CLAUDE.md`, Firebase config wiring, a "hello" page live at `coachw.club/credit-creatures` with working school-only Google sign-in. Give the teacher click-by-click steps for anything done in the Firebase or GitHub web consoles. |
| 2 | **Engine:** accounts, month updates, score model, card approvals, collections status. Automated tests that simulate 1,000 creature lives with different play styles and print a score distribution sanity report. |
| 3 | **Onboarding:** profile, creature creator, class codes, age 16 options, tutorial, lenders-vs-networks explainer, Design Your Card with live tradeoff display, saving. |
| 4 | **Simulation:** hub, month loop, life events, first ~20 scenarios with a basic "Pay with" picker (debit card or a credit card, with live balances), adult debit card at 18, chapters, teacher chapter release, reflections. |
| 5 | **Account Management:** wallet with debit card and digital wallet, statements, pay bills, AutoPay, My Score with life-choice explainers, credit report, Practice Desk, Factor Check, notifications inbox, theme picker, Unicorn Sparkle Points. |
| 6 | **Economy and engagement:** Ledger Sort, Cashier Rush and Check Writer minigames, "Pay with" picker at checkout, shop with backgrounds and creature items, BNPL checkout, achievements (40+), XP, ranks, class leaderboard. |
| 7 | **Teacher:** dashboard, roster, controls, CSV export, Firestore security rules hardening, school-only sign-in verification. |
| 8 | **Social and customization (added 2026-10-20):** friend requests between classmates, friend groups, gifts of money or shop items (each student can send one gift every 40 hours), and a much bigger creature customizer. Teacher can turn social features off. |
| 9 | **Pilot:** one class plays. Tune numbers, add remaining scenarios, minigames and achievements. |

---

## 24. Definition of done (pilot)

- A student can sign in with a school account, create and name a creature, play Chapter 1 through Design Your Card, and play released chapters with saves surviving a closed browser.
- Score changes always come with a plain-language reason tied to a factor.
- Achievements, XP and the leaderboard update live.
- The teacher can release chapters, see the roster, read reflections and export CSV.
- Engine tests pass, and the 1,000-life simulation produces sensible scores (careful players mostly 700+, reckless players mostly under 600).
- Works in current Chrome on school laptops at 1280px wide and up.
