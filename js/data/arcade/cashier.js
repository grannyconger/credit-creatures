// Cashier Rush (GAME-SPECS.md game 1, upgrade): make change fast, read your
// customers and close your drawer clean. Plain words, no em-dashes, no semicolons.

// 40 customer names (first names only, never a student's).
export const CR_NAMES = [
  "Mrs. Pennywhistle", "Bartholomew", "Juniper", "Old Man Tuck", "Rosalind", "Gus", "Pip", "Marisol", "Dante", "Wren",
  "Coach Briggs", "Odessa", "Felix", "Tamsin", "Big Lou", "Nia", "Ezra", "Clementine", "Hollis", "Priya",
  "Sir Reginald", "Mabel", "Jojo", "Aurelio", "Bea", "Thaddeus", "Lark", "Mo", "Delphine", "Quill",
  "Auntie Fern", "Rocco", "Saffron", "Ike", "Winnie", "Ambrose", "Kit", "Lupe", "Barnaby", "Ottilie",
];

export const CASHIER_META = {
  title: "Cashier Rush",
  pitch: "Your first job at a corner store. Make change fast, read your customers and close your drawer clean.",
  skill: "spending",
  standards: ["A3", "C2"],
  metric: "Rush Score",
  tie: { label: "fewer wrong sales", better: "low" },
  rankedHint: "only Speed rounds are ranked",
  ranked: (s) => s.round === "speed",
  board: (s) => `cashier:${s.difficulty}`,
  boardLabel: (s) => ({ easy: "Easy", medium: "Medium", hard: "Hard" })[s.difficulty],
  // The round picks the timer, so there's no separate timer setting.
  timer: false,
  settings: () => [
    {
      key: "difficulty",
      label: "Difficulty",
      def: "easy",
      options: [
        { value: "easy", label: "Easy", hint: "Whole dollars, bills only. A calculator (K)." },
        { value: "medium", label: "Medium", hint: "Cents in fives, bills and coins, no pennies." },
        { value: "hard", label: "Hard", hint: "Any cents, every coin." },
      ],
    },
    {
      key: "round",
      label: "Round",
      def: "speed",
      options: [
        { value: "speed", label: "Speed", hint: "As many customers as you can in 2:30. Double coins." },
        { value: "chill", label: "Chill", hint: "6 customers, no clock." },
      ],
    },
  ],
  mistakes: ["Each wrong change: the amount you were over or short (at least $1).", "Drawer over or short by more than $2 at closing: an extra $5."],
  beats: ["Read what they hand you and what they were charged.", "Stuck on the math? Open the calculator, then tap coins and bills to count out the change.", "Watch the patience bar. Faster service, bigger tip."],
  why: { weak: "I didn't want to lose my tips.", okay: "It was only a little money.", strong: "I had enough tips to cover it and still keep a cushion." },
  revealTitle: "The drawer count",
  unlock: 0,
};

export const CASHIER_BONUS = [
  { id: "c1", type: "number", q: "A snack costs $3.40. They hand you $5. How much change?", answer: 1.6, why: "$5.00 minus $3.40 is $1.60. Count up: 60 cents makes $4, then $1 makes $5." },
  { id: "c2", type: "number", q: "A $7.30 charge, and they hand you $20.05. How much change?", answer: 12.75, why: "$20.05 minus $7.30 is $12.75. The extra nickel saved a pile of pennies." },
  { id: "c3", type: "choice", q: "To count up change for $6.85 from $10, you start with...", choices: ["A nickel to make $6.90", "A $5 bill", "Three quarters"], answer: 0, why: "Small coins first to reach a round number, then bigger pieces." },
  { id: "c4", type: "number", q: "Your drawer started with $100 float. Sales were $246.50. How much should be in it?", answer: 346.5, why: "Float plus sales: $100 plus $246.50 is $346.50." },
  { id: "c5", type: "choice", q: "A drawer that has more money than it should is...", choices: ["Over", "Short", "Exact"], answer: 0, why: "Over means extra money. Short means money is missing." },
  { id: "c6", type: "number", q: "You gave $0.25 too much to one customer and $0.10 too little to another. How far off is the drawer?", answer: 0.15, why: "$0.25 out and $0.10 kept means the drawer is $0.15 short." },
  { id: "c7", type: "choice", q: "What's a float?", choices: ["The cash a drawer starts with to make change", "A soda", "A tip jar"], answer: 0, why: "The float is the starting cash so you can make change for the first customers." },
  { id: "c8", type: "number", q: "A $12.15 charge, they pay with a $20. How much change?", answer: 7.85, why: "$20.00 minus $12.15 is $7.85." },
  { id: "c9", type: "choice", q: "Fewest pieces for 40 cents with no pennies?", choices: ["A quarter, a dime and a nickel", "Four dimes", "Eight nickels"], answer: 0, why: "25 plus 10 plus 5 is 40, in just three coins." },
  { id: "c10", type: "number", q: "How many quarters are in $3.75?", answer: 15, why: "$3.75 divided by $0.25 is 15." },
  { id: "c11", type: "choice", q: "A customer hands you $10.30 for a $4.30 item. Why?", choices: ["So the change is an even $6", "They can't count", "They want a receipt"], answer: 0, why: "Adding 30 cents makes the change a clean $6.00." },
  { id: "c12", type: "number", q: "Change due is $13.42. Using the fewest pieces, how many coins do you hand over?", answer: 5, why: "42 cents is a quarter, a dime, a nickel and 2 pennies. That's 5 coins." },
  { id: "c13", type: "choice", q: "Counting change back out loud helps because...", choices: ["The customer can check it with you", "It's faster to skip", "Stores require singing"], answer: 0, why: "Saying it out loud catches mistakes before they leave the counter." },
  { id: "c14", type: "number", q: "A coffee is $2.65. They hand you $3. How much change?", answer: 0.35, why: "$3.00 minus $2.65 is 35 cents: a dime makes $2.75, a quarter makes $3." },
  { id: "c15", type: "choice", q: "Cash is about what share of US payments now?", choices: ["About 1 in 7", "About half", "Almost none"], answer: 0, why: "The Federal Reserve found cash was 14 percent of payments in 2024." },
  { id: "c16", type: "choice", q: "You gave one customer $1 too much and another $0.50 too little. How is the drawer?", choices: ["$0.50 short", "$0.50 over", "$1.50 short"], answer: 0, why: "$1 went out by mistake and $0.50 stayed in by mistake, so the drawer is $0.50 short." },
  { id: "c17", type: "choice", q: "A denomination is...", choices: ["The value of a bill or coin", "A type of receipt", "A bank fee"], answer: 0, why: "A $5 bill and a quarter are different denominations." },
  { id: "c18", type: "number", q: "Your tips: 4, 5, 2 and 3 points. Total?", answer: 14, why: "4 plus 5 plus 2 plus 3 is 14." },
  { id: "c19", type: "choice", q: "Which is a smart way to avoid a short drawer?", choices: ["Count change twice before handing it over", "Guess the coins", "Round everything up"], answer: 0, why: "A second count takes a second and saves real money." },
  { id: "c20", type: "number", q: "A $17.20 order. They hand you $20.20. How much change?", answer: 3, why: "$20.20 minus $17.20 is exactly $3." },
  { id: "c21", type: "choice", q: "Paying with cash can help you...", choices: ["Feel how much you're spending", "Build a credit score", "Earn card rewards"], answer: 0, why: "Handing over real bills makes spending feel real, which helps some people budget." },
];

export const CASHIER_GUIDE = {
  how: {
    goal: "Give exact [[change]] to as many customers as you can, earn tips for speed, and close your drawer clean.",
    steps: [
      "Read the ticket: what they were charged, and what they hand you.",
      "[[Count up]] from the charge to what they handed you, using the smallest coins first, then bills.",
      "Tap bills and coins (keys 1 to 7) to build the change in the tray, then press Give change (Enter). Each bill or coin is a [[denomination]].",
      "Customers wait in line with a patience bar. Faster service means a bigger tip.",
      "Wrong change stays in the drawer. At closing, guess if the drawer is [[over]], [[short]] or exact for a bonus.",
      "On Medium and Hard, one customer may come up short. Press Y to cover it from your tips, or N to turn them away.",
    ],
    example: "A $7.30 charge paid with $10. Count up: 20 cents makes $7.50, 50 cents makes $8, then $2 makes $10. The change is $2.70.",
  },
  vocab: [
    { term: "change", def: "The money you give back when someone pays more than the price.", example: "A $3 snack paid with a $5 bill means $2 in change." },
    { term: "denomination", def: "The value of a bill or coin.", example: "Quarters and $10 bills are two denominations." },
    { term: "count up", def: "Start at the price and add pieces until you reach what they paid.", example: "From $8.75, a quarter makes $9, a $1 makes $10." },
    { term: "float", def: "The cash a drawer starts with so you can make change.", example: "The morning float was $100 in small bills and coins." },
    { term: "over", def: "The drawer has more money than it should.", example: "The drawer was $0.40 over because a customer got too little change." },
    { term: "short", def: "The drawer has less money than it should.", example: "Giving an extra $1 left the drawer $1 short." },
    { term: "subtotal", def: "The total of the items before tax or discounts.", example: "The subtotal was $18 and the tax made it $19.26." },
    { term: "discount", def: "A lower price, often a percent off.", example: "A 20% discount cut the $30 jacket to $24." },
    { term: "sales tax", def: "A small percent added at the register.", example: "With 6% sales tax, a $10 item costs $10.60." },
    { term: "tip", def: "Extra money you give for good service.", example: "He left a $3 tip on the $15 meal." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "Most payments are cards now, but cash is still a steady part of how people pay.",
    facts: [
      { stat: "Cash was 14 percent of US consumer payments in 2024. Credit cards were 35 percent and debit cards 30 percent.", source: "Federal Reserve, Diary of Consumer Payment Choice", year: 2025, url: "https://www.frbservices.org/news/press-releases/051325-findings-from-2025-diary-of-consumer-payment-choice/" },
      { stat: "People made about seven cash payments a month, the same as every year since 2020.", source: "Federal Reserve, Diary of Consumer Payment Choice", year: 2025, url: "https://www.frbservices.org/news/press-releases/051325-findings-from-2025-diary-of-consumer-payment-choice/" },
      { stat: "Adults 18 to 24 paid with a phone for 45 percent of all their payments.", source: "Federal Reserve, Diary of Consumer Payment Choice", year: 2025, url: "https://www.frbservices.org/news/press-releases/051325-findings-from-2025-diary-of-consumer-payment-choice/" },
    ],
  },
};
