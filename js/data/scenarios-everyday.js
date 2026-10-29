// Everyday money cards: small, repeatable choices a teenager really faces, so the monthly
// deck doesn't keep dealing the same one (teacher request 2026-10-29). Each is once: false
// and fits Chapter 1. Prices move a little with the month so a repeat isn't identical.
// Their bold questions and Quality of Life points live here too and are merged into
// js/data/card-asks.js and js/data/card-qol.js. Plain language, no em-dashes, no semicolons.
import { dollars } from "../engine/index.js";

// Weekend plans rotate through these, so it isn't always bowling (js/data/scenarios.js).
export const WEEKEND_VARIANTS = [
  { story: "Friends are going to Bowl Hero Lanes for bowling and snacks.", base: 25, item: "bowling night", go: "Strike! A fun night out.", free: "Suggest a free movie night at home", freeOutcome: "Popcorn and a borrowed movie. Still fun, and free." },
  { story: "Your group wants to play a round at Putt Putt Palace, the mini golf course.", base: 20, item: "mini golf", go: "A hole in one on number 7. Everyone cheered.", free: "Suggest a backyard obstacle course", freeOutcome: "Pool noodles and cones made a pretty good course. It cost nothing." },
  { story: "Someone booked the Lock and Key escape room for Saturday.", base: 30, item: "escape room", go: "You got out with 40 seconds left. Great teamwork.", free: "Suggest a puzzle night at home", freeOutcome: "A jigsaw and snacks. Everyone got competitive, and it was free." },
  { story: "A few friends are heading to Sky High, the trampoline park.", base: 28, item: "trampoline park", go: "You were sore the next day and it was worth it.", free: "Suggest a pickup game at the park", freeOutcome: "Eight people showed up. No tickets needed." },
  { story: "The class is going ice skating at Frosty Rink.", base: 22, item: "ice skating", go: "You fell twice and laughed the whole time.", free: "Suggest a walk on the trails with hot chocolate from home", freeOutcome: "Cold hands, warm drinks, good talking. It cost almost nothing." },
  { story: "A friend invited you to laser tag at Laser Quest Zone.", base: 24, item: "laser tag", go: "Your team won two rounds out of three.", free: "Suggest a board game tournament", freeOutcome: "Someone brought snacks, and the game went on for hours. Free." },
  { story: "The high school football game is Friday night and the whole grade is going.", base: 12, item: "football game ticket", go: "The band played and the home team won.", free: "Suggest watching the highlights together at home", freeOutcome: "You saw the best plays and skipped the cold bleachers." },
  { story: "Your friends are planning a day at Splash Kingdom, the water park.", base: 35, item: "water park", go: "You went down the big slide four times.", free: "Suggest a sprinkler and water balloon day", freeOutcome: "A hose and a bag of balloons did the job. It cost almost nothing." },
  { story: "Two friends want to paint pottery at Clay and Company.", base: 26, item: "pottery painting", go: "Your mug came out lopsided and you love it.", free: "Suggest a drawing night with supplies you already have", freeOutcome: "Everyone made something to keep. It was free." },
  { story: "A night market with food trucks opens downtown this weekend.", base: 20, item: "night market", go: "The street tacos were worth the line.", free: "Suggest cooking a big dinner together at home", freeOutcome: "Tacos from the grocery store. Cheaper and just as fun." },
];

export function weekendVariant(life) {
  return WEEKEND_VARIANTS[life.month % WEEKEND_VARIANTS.length];
}
export const weekendCost = (life) => weekendVariant(life).base + (life.month % 4) * 5;

// Builds one everyday card from a plain description. pay(cost) is what the spending
// option charges. A free option has no cost.
function everyday({ id, icon, title, base, story, ask, options }) {
  const cost = (life) => base + (life.month % 3) * 5;
  return {
    card: {
      id,
      group: "costs",
      standards: [2],
      icon,
      title,
      once: false,
      minChapter: 1,
      fits: () => true,
      text: (life) => [story(dollars(cost(life)))],
      choices: (life) =>
        options.map((o) => {
          const amount = Math.round(cost(life) * (o.share ?? 0));
          return {
            key: o.key,
            label: o.label(dollars(amount)),
            ...(amount > 0 ? { cost: { amount, item: o.item } } : {}),
            outcome: o.outcome,
            quality: o.quality,
          };
        }),
    },
    ask,
    qol: Object.fromEntries(options.map((o) => [o.key, o.qol])),
  };
}

const BUILT = [
  everyday({
    id: "friendBirthday",
    icon: "🎁",
    title: "A friend's birthday",
    base: 20,
    story: (c) => `Your friend's birthday party is Saturday. A gift from the store would run about ${c}.`,
    ask: "What will you give your friend?",
    options: [
      { key: "buy", label: (c) => `Buy a gift (${c})`, share: 1, item: "birthday gift", outcome: "They loved it.", quality: "ok", qol: 3 },
      { key: "make", label: () => "Make something by hand", outcome: "A framed photo collage. It meant more than anything from a store.", quality: "good", qol: 3 },
      { key: "card", label: (c) => `A card and a small treat (${c})`, share: 0.3, item: "card and treat", outcome: "Simple and thoughtful.", quality: "good", qol: 2 },
    ],
  }),
  everyday({
    id: "fundraiser",
    icon: "🍪",
    title: "Club fundraiser",
    base: 15,
    story: (c) => `A teammate is selling cookie dough tubs to fund the spring trip. One tub is ${c}.`,
    ask: "Will you support the fundraiser?",
    options: [
      { key: "buy", label: (c) => `Buy a tub (${c})`, share: 1, item: "cookie dough tub", outcome: "Dinner dessert is handled for a week.", quality: "ok", qol: 2 },
      { key: "donate", label: (c) => `Give a small donation (${c})`, share: 0.35, item: "club donation", outcome: "Every bit helps the team get there.", quality: "good", qol: 2 },
      { key: "skip", label: () => "Say no thanks", outcome: "Your teammate said that is fine and moved on to the next house.", quality: "good", qol: 0 },
    ],
  }),
  everyday({
    id: "newSneakers",
    icon: "👟",
    title: "Worn-out sneakers",
    base: 60,
    story: (c) => `Your sneakers have a hole in the toe. The pair you like costs ${c} new.`,
    ask: "How will you replace your shoes?",
    options: [
      { key: "new", label: (c) => `Buy the new pair (${c})`, share: 1, item: "new sneakers", outcome: "Fresh shoes, fresh feeling.", quality: "ok", qol: 4 },
      { key: "thrift", label: (c) => `Check the thrift store (${c})`, share: 0.3, item: "thrift sneakers", outcome: "Nearly new, and you saved most of the price.", quality: "good", qol: 3 },
      { key: "patch", label: () => "Patch the old ones for now", outcome: "Some shoe glue bought you another month.", quality: "ok", qol: -1 },
    ],
  }),
  everyday({
    id: "schoolDance",
    icon: "🪩",
    title: "The school dance",
    base: 25,
    story: (c) => `The dance is next Friday. A ticket and a snack at the door come to about ${c}.`,
    ask: "Will you go to the dance?",
    options: [
      { key: "go", label: (c) => `Go (${c})`, share: 1, item: "school dance", outcome: "The music was loud and you stayed until the last song.", quality: "ok", qol: 4 },
      { key: "closet", label: (c) => `Go and wear something you already own (${c})`, share: 1, item: "school dance", outcome: "Nobody noticed, and you spent nothing on an outfit.", quality: "good", qol: 4 },
      { key: "skip", label: () => "Hang out at a friend's house instead", outcome: "A quiet night with good company.", quality: "good", qol: 1 },
    ],
  }),
  everyday({
    id: "crackedScreen",
    icon: "📱",
    title: "A cracked phone screen",
    base: 45,
    story: (c) => `Your phone fell and the screen cracked. The mall kiosk will fix it for ${c}.`,
    ask: "What will you do about the screen?",
    options: [
      { key: "repair", label: (c) => `Get it repaired (${c})`, share: 1, item: "phone screen repair", outcome: "Good as new.", quality: "ok", qol: 3 },
      { key: "tape", label: (c) => `Buy a screen protector (${c})`, share: 0.15, item: "screen protector", outcome: "The cracks are covered, and your fingers stay safe.", quality: "good", qol: 1 },
      { key: "live", label: () => "Live with the crack for now", outcome: "It still works. You will fix it when you have extra.", quality: "ok", qol: -1 },
    ],
  }),
  everyday({
    id: "lunchOut",
    icon: "🌮",
    title: "Lunch with the group",
    base: 12,
    story: (c) => `Your whole lunch table is walking to the taco truck today. A meal there costs about ${c}.`,
    ask: "What will you eat for lunch?",
    options: [
      { key: "truck", label: (c) => `Join them (${c})`, share: 1, item: "taco truck lunch", outcome: "Crunchy, loud, and fun.", quality: "ok", qol: 3 },
      { key: "pack", label: () => "Pack a lunch and sit with them anyway", outcome: "You still got the company, and the lunch cost almost nothing.", quality: "good", qol: 2 },
    ],
  }),
  everyday({
    id: "gameSale",
    icon: "🎮",
    title: "A game goes on sale",
    base: 30,
    story: (c) => `A game you have wanted for months is on sale this weekend for ${c}. The sale ends Sunday.`,
    ask: "What will you do about the sale?",
    options: [
      { key: "buy", label: (c) => `Buy it now (${c})`, share: 1, item: "video game", outcome: "You played until midnight.", quality: "ok", qol: 4 },
      { key: "wait", label: () => "Add it to your wish list and wait", outcome: "Sales come around again. Your wallet stayed full.", quality: "good", qol: 0 },
      { key: "library", label: () => "Borrow it from a friend or the library", outcome: "Two weeks of play, for free.", quality: "good", qol: 2 },
    ],
  }),
  everyday({
    id: "guitarLessons",
    icon: "🎸",
    title: "A new hobby",
    base: 30,
    story: (c) => `You want to learn guitar. A month of lessons at the music shop costs ${c}.`,
    ask: "How will you learn guitar?",
    options: [
      { key: "lessons", label: (c) => `Sign up for lessons (${c})`, share: 1, item: "guitar lessons", outcome: "Your teacher showed you three chords on day one.", quality: "ok", qol: 4 },
      { key: "videos", label: () => "Learn from free videos online", outcome: "Slower, but it works, and it is free.", quality: "good", qol: 2 },
      { key: "later", label: () => "Wait until you have more saved", outcome: "The guitar will still be there next month.", quality: "ok", qol: -1 },
    ],
  }),
  everyday({
    id: "groupRide",
    icon: "🚌",
    title: "A ride to the game",
    base: 14,
    story: (c) => `The game across town starts at six. A ride share would cost ${c} each way, and a friend's older sister might be going too.`,
    ask: "How will you get to the game?",
    options: [
      { key: "ride", label: (c) => `Take a ride share (${c})`, share: 1, item: "ride share", outcome: "Quick and easy.", quality: "ok", qol: 2 },
      { key: "bus", label: (c) => `Take the city bus (${c})`, share: 0.25, item: "bus fare", outcome: "It took longer, and cost a fraction of the price.", quality: "good", qol: 1 },
      { key: "carpool", label: () => "Ask to join the carpool", outcome: "You split the gas with two friends. It cost you nothing.", quality: "good", qol: 2 },
    ],
  }),
  everyday({
    id: "petSupplies",
    icon: "🐕",
    title: "The dog needs supplies",
    base: 25,
    story: (c) => `Your family dog is almost out of food, and its leash is fraying. The pet store wants ${c} for both.`,
    ask: "Will you cover the dog's supplies?",
    options: [
      { key: "all", label: (c) => `Buy the food and a new leash (${c})`, share: 1, item: "dog supplies", outcome: "A happy, well-fed dog.", quality: "ok", qol: 3 },
      { key: "food", label: (c) => `Buy only the food (${c})`, share: 0.6, item: "dog food", outcome: "The leash can wait. The dog cannot.", quality: "good", qol: 2 },
      { key: "ask", label: () => "Ask your family to cover it this time", outcome: "They said yes and thanked you for asking.", quality: "good", qol: 1 },
    ],
  }),
];

export const EVERYDAY_SCENARIOS = BUILT.map((b) => b.card);
export const EVERYDAY_ASKS = Object.fromEntries(BUILT.map((b) => [b.card.id, b.ask]));
export const EVERYDAY_QOL = Object.fromEntries(BUILT.map((b) => [b.card.id, b.qol]));
