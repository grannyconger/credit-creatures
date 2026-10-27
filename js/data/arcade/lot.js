// The Lot (GAME-SPECS.md game 8): a slick salesman, three cars and a deal that
// sounds great every month. Find the real cost and drive off without getting
// taken. Parody names only. No em-dashes, no semicolons.

// 9 cars, 3 of each type. price range, ride stars, reliability, monthly insurance,
// yearly repair odds and cost, and how much value it keeps after 2 years.
export const LOT_CARS = [
  { type: "flashy", name: "Fjord Mustang GT", price: [29000, 33000], ride: 5, reliability: "So-so (fancy parts)", insurance: 185, repairs: { odds: 0.45, cost: [700, 1800] }, keep: 0.68 },
  { type: "flashy", name: "Shevvy Camaro SS", price: [30000, 34000], ride: 5, reliability: "So-so (fancy parts)", insurance: 190, repairs: { odds: 0.5, cost: [700, 1900] }, keep: 0.66 },
  { type: "flashy", name: "Dodgy Charger R/T", price: [28000, 32000], ride: 5, reliability: "Shaky", insurance: 180, repairs: { odds: 0.55, cost: [600, 1700] }, keep: 0.65 },
  { type: "certified", name: "Toyoda Corola, certified", price: [17000, 20000], ride: 4, reliability: "Great", insurance: 120, repairs: { odds: 0.15, cost: [200, 600] }, keep: 0.8 },
  { type: "certified", name: "Hondo Civil, certified", price: [17500, 20500], ride: 4, reliability: "Great", insurance: 125, repairs: { odds: 0.15, cost: [200, 600] }, keep: 0.81 },
  { type: "certified", name: "Mazdo 3, certified", price: [16500, 19500], ride: 4, reliability: "Good", insurance: 118, repairs: { odds: 0.2, cost: [250, 700] }, keep: 0.79 },
  { type: "older", name: "2012 Hondo Fit", price: [6500, 8500], ride: 2, reliability: "Older but steady", insurance: 85, repairs: { odds: 0.5, cost: [300, 900] }, keep: 0.85 },
  { type: "older", name: "2011 Toyoda Camry", price: [7500, 9500], ride: 3, reliability: "Older but steady", insurance: 90, repairs: { odds: 0.5, cost: [300, 1000] }, keep: 0.85 },
  { type: "older", name: "2010 Fjord Focus", price: [5500, 7500], ride: 2, reliability: "Needs some love", insurance: 80, repairs: { odds: 0.65, cost: [300, 1100] }, keep: 0.83 },
];

export const LOT_TYPE_LABEL = { flashy: "New and flashy", certified: "Certified used", older: "Older and reliable" };

// Contract add-ons the salesman slips in. Tap to strike them.
export const LOT_ADDONS = [
  { id: "warranty", name: "Extended warranty", price: [1200, 2200] },
  { id: "paint", name: "Paint protection", price: [400, 900] },
  { id: "vin", name: "VIN etching (engraving the vehicle ID number on the windows)", price: [200, 400] },
  { id: "fabric", name: "Fabric protection", price: [250, 500] },
];

export const LOT_LINES = ["This price is only good today.", "What monthly payment works for you?", "Let me talk to my manager.", "I'm practically losing money on this one.", "Everybody's buying this model.", "We can get you in it for just a little a month."];

export const LOT_EVENTS = {
  repair: ["Brakes squealing. New pads and rotors.", "Check engine light. A sensor and an afternoon.", "Battery died in the parking lot.", "A cracked radiator hose.", "Strange clunk. Suspension work."],
  quiet: ["A smooth stretch. Gas, oil, done.", "Road trip with friends. Zero problems.", "Tires rotated, all good."],
};

export const LOT_META = {
  title: "The Lot",
  pitch: "A slick salesman, three cars and a deal that sounds great every month. Find the real cost and drive off without getting taken.",
  skill: "credit",
  standards: ["D2", "D6", "D7", "B4"],
  metric: "Deal Score",
  tie: { label: "a lower 2-year cost", better: "low" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: () => "lot",
  timer: { timed: "2:30 for the whole deal.", none: "Take your time." },
  settings: () => [],
  mistakes: ["Signing with an add-on left in: its price.", "Signing at a rate above your preapproval: the extra interest, added as debt (up to $500 in this game)."],
  beats: ["He talks about monthly payments. Turn on Total cost to see the real price.", "Counter, accept or walk away. Walking away is a gamble.", "Read the contract. Strike add-ons you don't want."],
  why: { weak: "The monthly payment was low.", okay: "I liked the car.", strong: "The shorter term cost more each month but saved over $2,000 in total." },
  revealTitle: "Monthly payment vs. total cost",
  unlock: 2,
};

export const LOT_BONUS = [
  { id: "l1", type: "number", q: "$389 a month for 72 months, plus $1,000 down. What's the total you pay?", answer: 29008, why: "389 times 72 is $28,008, plus $1,000 down is $29,008." },
  { id: "l2", type: "choice", q: "APR stands for...", choices: ["Annual Percentage Rate", "Auto Payment Rule", "Average Price Rating"], answer: 0, why: "The yearly cost of borrowing, including some fees." },
  { id: "l3", type: "choice", q: "A longer loan term usually means...", choices: ["Lower monthly payments but more total interest", "Less interest", "No interest"], answer: 0, why: "Stretching payments out costs more in the end." },
  { id: "l4", type: "choice", q: "Getting preapproved at a credit union before the dealer helps because...", choices: ["You know your rate and can ask the dealer to beat it", "It's required", "It lowers the car's price"], answer: 0, why: "A rate in your pocket is leverage." },
  { id: "l5", type: "number", q: "$10,000 at 6 percent for 36 months is about $304.22 a month. What's the total paid? (Round to the dollar.)", answer: 10952, tolerance: 1, why: "$304.22 times 36 is about $10,952. The extra $952 is interest." },
  { id: "l6", type: "choice", q: "\"What monthly payment works for you?\" is a sales trick because...", choices: ["They can stretch the term to hit any payment and hide the total", "It's rude", "It lowers your score"], answer: 0, why: "Always negotiate the price and look at the total cost." },
  { id: "l7", type: "choice", q: "Depreciation means...", choices: ["A car losing value over time", "A loan fee", "A tax"], answer: 0, why: "New cars often lose a big chunk of value in the first few years." },
  { id: "l8", type: "choice", q: "A down payment...", choices: ["Lowers how much you borrow", "Raises your APR", "Is a monthly fee"], answer: 0, why: "Borrow less, pay less interest." },
  { id: "l9", type: "number", q: "A $1,500 extended warranty rolled into a 6-year loan adds about $394 of interest. What does the warranty really cost?", answer: 1894, why: "$1,500 plus $394 of interest is $1,894. Add-ons in a loan cost more than their sticker." },
  { id: "l10", type: "choice", q: "VIN etching is...", choices: ["Engraving the car's ID number on the windows, often overpriced", "A required safety test", "Free"], answer: 0, why: "Many people can do it with a cheap kit, or skip it." },
  { id: "l11", type: "choice", q: "Walking away from a deal can...", choices: ["Get you a better offer, or lose you the car", "Never work", "Hurt your credit score"], answer: 0, why: "It's leverage, but it's a gamble." },
  { id: "l12", type: "choice", q: "Why compare total cost and not just monthly payment?", choices: ["Two loans with the same payment can cost thousands apart", "Monthly is always right", "Total cost is a guess"], answer: 0, why: "Term and APR change the total a lot." },
  { id: "l13", type: "choice", q: "Car insurance usually costs more for...", choices: ["Fast, expensive cars", "Older reliable cars", "Every car the same"], answer: 0, why: "Pricier, faster cars cost more to fix and to insure." },
  { id: "l14", type: "number", q: "Insurance is $185 a month. How much over 2 years?", answer: 4440, why: "$185 times 24 is $4,440." },
  { id: "l15", type: "choice", q: "An amortization schedule shows...", choices: ["How each payment splits into interest and principal", "Your credit score", "The car's value"], answer: 0, why: "Early payments are mostly interest." },
  { id: "l16", type: "choice", q: "A certified used car is...", choices: ["A used car inspected and backed by a warranty", "A brand new car", "A salvage car"], answer: 0, why: "Often a good middle ground between new and old." },
  { id: "l17", type: "number", q: "A $20,000 car keeps 80 percent of its value after 2 years. What's it worth?", answer: 16000, why: "80 percent of $20,000 is $16,000." },
  { id: "l18", type: "choice", q: "Signing a contract means...", choices: ["You agree to everything on it, add-ons too", "You can change it later for free", "It's just a draft"], answer: 0, why: "Read every line before you sign." },
  { id: "l19", type: "choice", q: "A dealer offers 0.9 percent APR but only if you pay $2,000 more for the car. You should...", choices: ["Compare the total cost both ways", "Take it, low APR is always best", "Leave"], answer: 0, why: "A low rate on a padded price can cost more." },
  { id: "l20", type: "number", q: "Loan payment $450 for 48 months. Total of payments?", answer: 21600, why: "$450 times 48 is $21,600." },
  { id: "l21", type: "choice", q: "Being upside down on a car loan means...", choices: ["You owe more than the car is worth", "The car flipped", "You paid it off"], answer: 0, why: "Long loans and fast depreciation can leave you upside down." },
];

export const LOT_GUIDE = {
  how: {
    goal: "Drive off in a car you like for the lowest real cost, not the lowest monthly payment.",
    steps: [
      "First, choose whether to visit the credit union. [[Preapproval]] gives you a rate card to bring to the dealer.",
      "Pick one of three cars. Each shows its price, ride stars, reliability and insurance.",
      "The salesman offers a monthly payment with a long [[loan term]]. Work out the [[total cost]], then turn on Total cost (T).",
      "Accept (A), Counter (C) or Walk away (W). Counters: a lower price (works once), a shorter term, or beat your credit union [[APR]] (only if you're preapproved).",
      "In the contract, strike every [[add-on]] you don't want before you sign (Enter).",
      "Two years go by. Repairs, insurance and [[depreciation]] show what the car really cost. A bigger [[down payment]] means less to borrow.",
    ],
    example: "$389 a month for 72 months with $1,000 down is $29,008. The same car at $512 a month for 48 months is $25,576. The higher payment saves $3,432.",
  },
  vocab: [
    { term: "APR", def: "Annual Percentage Rate: the yearly cost of borrowing.", example: "The credit union offered 6.5 percent APR, the dealer 9.9." },
    { term: "loan term", def: "How many months you have to pay the loan back.", example: "A 72-month term means six years of payments." },
    { term: "down payment", def: "Money you pay up front so you borrow less.", example: "She put $2,000 down on the car." },
    { term: "total cost", def: "Everything you'll pay over the whole loan, not just one month.", example: "The low monthly payment had a high total cost." },
    { term: "preapproval", def: "A lender's offer of a rate and amount before you shop.", example: "His preapproval made the dealer beat its rate." },
    { term: "add-on", def: "An extra product sold with the car, often with a big markup.", example: "Paint protection was a $700 add-on." },
    { term: "depreciation", def: "How much value a car loses over time.", example: "The new car lost a third of its value in two years." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "Car loans keep getting longer and bigger.",
    facts: [
      { stat: "In the second quarter of 2026, new car loan payments averaged $765 a month.", source: "Experian, Average Car Payment", year: 2026, url: "https://www.experian.com/blogs/ask-experian/average-car-payment/" },
      { stat: "Average loan terms were about 69 months for new cars and 68 months for used cars. That's almost six years of payments.", source: "Experian, Average Car Payment", year: 2026, url: "https://www.experian.com/blogs/ask-experian/average-car-payment/" },
      { stat: "New car buyers borrowed an average of $43,610. Used car buyers borrowed an average of $27,852.", source: "Experian, Average Car Payment", year: 2026, url: "https://www.experian.com/blogs/ask-experian/average-car-payment/" },
    ],
  },
};
