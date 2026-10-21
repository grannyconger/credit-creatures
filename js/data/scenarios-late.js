// Decision cards for the late game (Phase 13): Chapter 6 moving out, Chapter 7
// setbacks and comebacks, Chapter 8 building your future. Before this, the deck
// ran dry after Chapter 5. Same shape as js/data/scenarios.js.
// Plain language for a 15-year-old. No em-dashes, no semicolons.
import { dollars, amountOwed } from "../engine/index.js";

const hasBill = (life, name) => life.bills.some((b) => b.name === name);
const bill = (life, name) => life.bills.find((b) => b.name === name);
const rentBill = (life) => life.bills.find((b) => b.name.startsWith("Rent"));
const billTotal = (life) => life.bills.reduce((s, b) => s + b.amount, 0);
const own = (life) => life.accounts.filter((a) => a.owner === "self");
const hadLate = (life) => own(life).some((a) => a.history.some((h) => h.code !== "OK"));
const openAuto = (life) => own(life).find((a) => a.type === "autoLoan" && a.status === "open");
const notEnough = (life, amount) => (life.checking < amount ? `You need ${dollars(amount)} in checking.` : null);

export const LATE_SCENARIOS = [
  // ---------------- Chapter 6: moving out ----------------
  {
    id: "movingOut",
    replay: false,
    group: "costs",
    standards: [2],
    icon: "🏠",
    title: "A place of your own",
    minChapter: 6,
    priority: 2,
    fits: (life) => !rentBill(life),
    text: () => [
      "It's time to move out. Here are your choices, and rent comes out of checking every End Month.",
      "A studio by yourself: $240 a month. A two-bedroom with a roommate: $140 a month each. Or stay at home and pay your family $60 a month.",
      "The first month's rent is due when you move in.",
    ],
    choices: (life) => [
      { key: "alone", label: "Studio by myself ($240 a month)", disabled: notEnough(life, 240), steps: [["debitPurchase", 240, "first month's rent"], ["addBill", "Rent", 240]], outcome: "Your own place! It's quiet and all yours. It's also your biggest bill by far.", quality: "ok", math: "A common rule: keep rent under about 30% of what you earn. Rent that eats half your pay leaves nothing for savings." },
      { key: "roommate", label: "Share with a roommate ($140 a month)", disabled: notEnough(life, 140), steps: [["debitPurchase", 140, "first month's rent"], ["addBill", "Rent (shared)", 140]], outcome: "You and a friend split a two-bedroom. Sharing saves $100 every month compared to living alone.", quality: "good" },
      { key: "home", label: "Stay home and pay family ($60 a month)", steps: [["addBill", "Rent to family", 60]], outcome: "Less freedom, more savings. Lots of people stay home a little longer to build up their savings.", quality: "good" },
    ],
  },
  {
    id: "movingDay",
    group: "costs",
    standards: [2],
    icon: "🚚",
    title: "Moving day",
    minChapter: 6,
    priority: 1,
    fits: (life) => Boolean(rentBill(life)) && !hasBill(life, "Rent to family") && life.checking >= 30,
    text: () => ["Your stuff has to get to the new place. A moving company charges $150. A rental truck is $70. Or you could feed some friends pizza and borrow a truck for $30."],
    choices: (life) => [
      { key: "movers", label: "Hire movers ($150)", disabled: notEnough(life, 150), steps: [["debitPurchase", 150, "movers"]], outcome: "Easy, but pricey. That's more than half a month's rent.", quality: "ok" },
      { key: "truck", label: "Rent a truck ($70)", disabled: notEnough(life, 70), steps: [["debitPurchase", 70, "rental truck"]], outcome: "A long day of lifting, but you saved $80 over the movers.", quality: "good" },
      { key: "friends", label: "Pizza for friends ($30)", steps: [["debitPurchase", 30, "moving day pizza"]], outcome: "Your friends showed up and the pizza was gone in minutes. Cheapest move in Coinhaven.", quality: "good" },
    ],
  },
  {
    id: "powerDeposit",
    group: "profile",
    standards: [3],
    icon: "💡",
    title: "Turn on the lights",
    minChapter: 6,
    fits: (life) => Boolean(rentBill(life)) && !hasBill(life, "Rent to family") && !hasBill(life, "Power"),
    text: (life) => [
      "The power company checks your credit before it turns on your service. With a score of 650 or more, there's no deposit. Otherwise, it asks for a $100 deposit.",
      life.score == null ? "You don't have a score yet." : `Your score is ${life.score}.`,
      "Power costs about $30 a month.",
    ],
    choices: (life) => {
      const good = life.score != null && life.score >= 650;
      return [
        good
          ? { key: "noDeposit", label: "Sign up, no deposit", steps: [["recordInquiry", "Coinhaven Power", false], ["addBill", "Power", 30]], outcome: `Your ${life.score} score skipped the $100 deposit. Good credit saves money in places you might not expect.`, quality: "good", factor: { key: "payment", dir: "up" } }
          : { key: "deposit", label: "Pay the $100 deposit and sign up", disabled: notEnough(life, 100), steps: [["recordInquiry", "Coinhaven Power", false], ["debitPurchase", 100, "power deposit"], ["addBill", "Power", 30]], outcome: "The lights are on. A higher score would have skipped that $100 deposit. Many companies check credit, not just lenders.", quality: "ok" },
        { key: "roommate", label: "Put it in my roommate's name and pay them half", disabled: hasBill(life, "Rent (shared)") ? null : "You don't have a roommate.", steps: [["addBill", "Power (half)", 15]], outcome: "Your roommate signed up. You pay them $15 a month. If they miss a payment, it's their credit that takes the hit, so trust matters.", quality: "ok" },
      ];
    },
  },
  {
    id: "rentersInsurance",
    group: "costs",
    standards: [2],
    icon: "☂️",
    title: "Renter's insurance",
    minChapter: 6,
    fits: (life) => Boolean(rentBill(life)) && !hasBill(life, "Rent to family") && !hasBill(life, "Renter's insurance"),
    text: () => ["Your landlord's insurance covers the building, not your stuff. Renter's insurance covers your things if there's a fire, a flood or a break-in. It costs $10 a month."],
    choices: () => [
      { key: "buy", label: "Get renter's insurance ($10 a month)", steps: [["addBill", "Renter's insurance", 10]], outcome: "Covered. If something happens, you pay a small part (the deductible) and insurance pays the rest.", quality: "good" },
      { key: "skip", label: "Skip it", outcome: "$10 a month saved. If something happens, you'll pay to replace everything yourself.", quality: "ok" },
    ],
  },
  {
    id: "roommateShort",
    group: "pitfalls",
    standards: [5],
    icon: "🤝",
    title: "Your roommate is short",
    minChapter: 6,
    fits: (life) => hasBill(life, "Rent (shared)") && life.checking >= 70,
    text: () => ["Your roommate can't pay their $70 share of rent this month. Both of your names are on the lease, so the landlord can come after either of you for the full rent."],
    choices: () => [
      { key: "plan", label: "Cover it and write down a payback date", steps: [["debitPurchase", 70, "roommate's rent"], ["receiveCash", 70, "roommate paid you back"]], outcome: "You both signed a note with a date. Two weeks later, they paid you back. Writing it down kept it friendly.", quality: "good" },
      { key: "cover", label: "Just cover it", steps: [["debitPurchase", 70, "roommate's rent"]], outcome: "The rent was paid, but without a plan, the $70 never came back. Lending to friends works best with clear terms.", quality: "ok" },
      { key: "refuse", label: "Pay only my half", steps: [["debitPurchase", 30, "late rent fee"]], outcome: "The rent was late, and the landlord charged a $30 late fee to both of you. On a shared lease, their problem is your problem.", quality: "bad" },
    ],
  },
  {
    id: "furnishPlace",
    group: "types",
    standards: [1, 2],
    icon: "🛋️",
    title: "An empty apartment",
    minChapter: 6,
    fits: (life) => Boolean(rentBill(life)) && !hasBill(life, "Rent to family") && life.checking >= 60,
    text: () => [
      "Your new place echoes. The furniture store offers a whole room for $900 with store financing: 24% APR for 24 months, about $48 a month.",
      "The thrift store has a used couch, table and bed for $160 cash.",
    ],
    choices: (life) => [
      { key: "finance", label: "Finance the $900 room", steps: [["openPurchaseLoan", { item: "living room furniture", price: 900, termMonths: 24, apr: 0.24, lender: "store", type: "storeLoan", icon: "🛋️" }]], outcome: (r) => (r.ok && !r.denied ? "Brand new furniture, and a $48 payment for two years. You'll pay about $240 in interest." : "Denied. The payment is too big for your income right now. You'll have to start smaller."), quality: "ok", math: "24 payments of about $48 is about $1,140 for $900 of furniture." },
      { key: "thrift", label: "Thrift store ($160 cash)", disabled: notEnough(life, 160), steps: [["debitPurchase", 160, "thrift store furniture"]], outcome: "A little worn, a lot cheaper. No payments, no interest.", quality: "good" },
      { key: "floor", label: "Floor pillows for now ($25)", steps: [["debitPurchase", 25, "floor pillows"]], outcome: "Cozy, in a camping kind of way. You can save up and buy pieces as you go.", quality: "good" },
    ],
  },

  // ---------------- Chapter 7: setbacks and comebacks ----------------
  {
    id: "groceryGap",
    group: "costs",
    standards: [2],
    icon: "🛒",
    title: "Payday is a week away",
    minChapter: 7,
    priority: 2,
    fits: (life) => life.checking + life.savings >= 40,
    text: (life) => [
      "Payday is still a week away, and the fridge is empty. You need $80 of groceries.",
      `Your bills still come out at End Month: ${dollars(billTotal(life))} in all. How will you cover the groceries?`,
    ],
    choices: (life) => [
      { key: "savings", label: "Use my savings", disabled: life.savings < 80 ? `You only have ${dollars(life.savings)} in savings.` : null, steps: [["moveToChecking", 80], ["debitPurchase", 80, "groceries"]], outcome: "This is exactly what an emergency fund is for. No debt, no stress.", quality: "good" },
      { key: "card", label: "Pay with a card", cost: { amount: 80, item: "groceries" }, outcome: (r, after) => (own(after).some((a) => a.kind === "revolving" && amountOwed(a) > 0) ? "Groceries on the card. Pay the statement in full if you can, or the interest makes a tight week cost more." : "Groceries paid."), quality: "ok" },
      { key: "cheap", label: "Cook cheap meals and sell some old games", steps: [["receiveCash", 40, "sold old games"], ["debitPurchase", 40, "groceries on a budget"]], outcome: "Rice, beans and a garage sale. Cutting back and earning a little extra got you to payday.", quality: "good" },
    ],
  },
  {
    id: "brokenLaptop",
    group: "costs",
    standards: [2],
    icon: "💻",
    title: "Your laptop died",
    minChapter: 7,
    fits: (life) => life.checking + life.savings >= 50,
    text: (life) => [
      "Your laptop won't turn on, and you need it for work and school. A repair costs $180.",
      hasBill(life, "Renter's insurance") ? "It was knocked off the table in a storm leak, and your renter's insurance covers it after a $50 deductible." : "You don't have insurance that covers it.",
    ],
    choices: (life) => {
      const insured = hasBill(life, "Renter's insurance");
      const out = [];
      if (insured) out.push({ key: "claim", label: "File a claim ($50 deductible)", steps: [["debitPurchase", 50, "insurance deductible"]], outcome: "Insurance paid the other $130. Your $10 a month just paid for itself.", quality: "good" });
      out.push({ key: "repair", label: "Pay for the repair ($180)", cost: { amount: 180, item: "laptop repair" }, outcome: "Fixed. A surprise like this is why people keep an emergency fund.", quality: "ok" });
      out.push({ key: "library", label: "Use the library computers for now", effect: { shiftsCut: 1 }, outcome: "Free, but slower. You missed a shift waiting for a computer.", quality: "ok" });
      return out;
    },
  },
  {
    id: "hardshipCall",
    group: "costs",
    standards: [2, 3],
    icon: "☎️",
    title: "Call before you miss",
    minChapter: 7,
    fits: (life) => own(life).some((a) => a.status === "open" && (a.kind === "installment" || a.kind === "revolving") && amountOwed(a) > 0),
    text: () => [
      "Money is tight, and a payment is coming up. A friend says to just skip it and catch up later.",
      "Another friend says to call the lender first and ask about a hardship plan.",
    ],
    choices: () => [
      { key: "call", label: "Call the lender first", outcome: "The lender offered a lower payment for two months and waived the late fee. Lenders often help if you call before you miss, not after.", quality: "good", factor: { key: "payment", dir: "up" } },
      { key: "skip", label: "Skip it and hope it's fine", outcome: "You decided to wait. A payment 30 days late goes on your report for 7 years. Payment history is the biggest part of your score.", quality: "bad" },
    ],
  },
  {
    id: "goodwillLetter",
    group: "profile",
    standards: [3],
    icon: "✉️",
    title: "A late mark on your report",
    minChapter: 7,
    fits: (life) => hadLate(life),
    text: () => [
      "You have a late payment on your report, but you've paid on time since.",
      "A website offers to erase it for $99. A friend says you could write the lender a polite goodwill letter instead.",
    ],
    choices: (life) => [
      { key: "letter", label: "Write a goodwill letter", outcome: "The lender said no this time, but it was free to ask. Some lenders say yes. Either way, each on-time month makes that old mark matter less.", quality: "good" },
      { key: "pay", label: "Pay the website $99", disabled: notEnough(life, 99), steps: [["debitPurchase", 99, "credit repair website"]], outcome: "Nothing changed. Nobody can remove true information from your report. You can dispute real mistakes yourself for free.", quality: "bad" },
      { key: "wait", label: "Keep paying on time", outcome: "Good plan. A late mark fades as it gets older, especially when every month after it is on time.", quality: "good" },
    ],
  },
  {
    id: "collectorCall",
    group: "pitfalls",
    standards: [5],
    icon: "📞",
    title: "A debt collector calls",
    minChapter: 7,
    fits: (life) => life.checking >= 60,
    text: () => [
      'A caller says you owe $60 for an old gym membership. "Pay right now with your debit card or it goes on your credit report today!"',
      "You don't remember this gym.",
    ],
    choices: () => [
      { key: "validate", label: "Ask for it in writing first", outcome: "You asked for a validation letter, which collectors must send. The letter never came. It was a scam, and you lost nothing.", quality: "good" },
      { key: "pay", label: "Pay right now", steps: [["debitPurchase", 60, "paid a fake debt collector"]], outcome: "The $60 is gone, and the gym never existed. Real collectors have to prove the debt in writing. Never pay a surprise caller on the spot.", quality: "bad" },
      { key: "ignore", label: "Hang up and ignore it", outcome: "This one was a scam, so nothing happened. But with a real debt, ignoring it can lead to collections. Asking for proof is the safest move.", quality: "ok" },
    ],
  },
  {
    id: "carRepairOffer",
    group: "pitfalls",
    standards: [5],
    icon: "🔧",
    title: "Your ride needs a repair",
    minChapter: 7,
    fits: (life) => life.bills.some((b) => /gas and insurance/i.test(b.name)),
    text: () => [
      "Your ride needs a $300 repair to keep running. You need it for work.",
      "The shop next door has a sign: \"Car title loans! $300 today!\" The fee is 25% a month.",
    ],
    choices: (life) => [
      { key: "savings", label: "Pay from savings", disabled: life.savings < 300 ? `You only have ${dollars(life.savings)} in savings.` : null, steps: [["moveToChecking", 300], ["debitPurchase", 300, "ride repair"]], outcome: "Fixed, with no debt. Your emergency fund did its job.", quality: "good" },
      { key: "card", label: "Pay with a card or debit", cost: { amount: 300, item: "ride repair" }, outcome: "Fixed. If it's on a card, pay it down fast so the interest stays small.", quality: "ok" },
      { key: "title", label: "Take the title loan", steps: [["receiveCash", 300, "title loan"], ["debitPurchase", 300, "ride repair"], ["addBill", "Title loan payment", 75, 5]], outcome: "Fixed, but you'll pay $75 a month for 5 months: $375 for a $300 repair. And if you miss one, they take your ride.", quality: "bad", math: "25% a month is 300% a year. A credit card is closer to 25% a year." },
    ],
  },

  // ---------------- Chapter 8: building your future ----------------
  {
    id: "retirementMatch",
    replay: false,
    group: "costs",
    standards: [2],
    icon: "🌱",
    title: "Free money from your job",
    minChapter: 8,
    priority: 2,
    fits: (life) => !hasBill(life, "Retirement savings"),
    text: () => [
      "The Guild now offers a retirement plan. If you put in $20 a month, the Guild adds $20 too. That's called a match.",
      "Money in a retirement plan is invested, and it grows for decades.",
    ],
    choices: () => [
      { key: "join", label: "Join and put in $20 a month", steps: [["addBill", "Retirement savings", 20]], outcome: "You're in, and the Guild doubles every dollar. Starting young is the biggest advantage there is.", quality: "good", math: "$40 a month for 45 years, growing about 7% a year, could become about $150,000." },
      { key: "later", label: "Maybe later", outcome: "No match for now. Every year you wait is a year of free money and growth you don't get back.", quality: "ok" },
    ],
  },
  {
    id: "emergencyFund",
    group: "costs",
    standards: [2],
    icon: "🛟",
    title: "How big is your safety net?",
    minChapter: 8,
    fits: (life) => life.checking >= 60,
    text: (life) => [
      `Your bills add up to ${dollars(billTotal(life))} a month. You have ${dollars(life.savings)} in savings.`,
      "Experts say to save enough to cover about 3 months of bills, in case of a job loss or a big surprise.",
    ],
    choices: (life) => {
      const goal = Math.round(billTotal(life) * 3);
      return [
        { key: "big", label: "Move $100 to savings", disabled: notEnough(life, 100), steps: [["moveToSavings", 100]], outcome: (r, after) => (after.savings >= goal ? `Your savings cover 3 months of bills. That's a real safety net!` : `${dollars(after.savings)} saved toward a goal of ${dollars(goal)}. Keep going.`), quality: "good" },
        { key: "small", label: "Move $50 to savings", steps: [["moveToSavings", 50]], outcome: "Every bit counts. Small, regular amounts add up faster than you'd think.", quality: "good" },
        { key: "none", label: "Not this month", outcome: "That's okay sometimes. Try to save something every month, even $10.", quality: "ok" },
      ];
    },
  },
  {
    id: "lifestyleCreep",
    group: "costs",
    standards: [2],
    icon: "📱",
    title: "You got a raise",
    minChapter: 8,
    fits: (life) => hasBill(life, "Phone") && bill(life, "Phone").amount < 80,
    text: () => ["The Guild gave you a raise! Your phone company says you deserve the newest phone on the premium plan: $80 a month instead of your $45 plan."],
    choices: () => [
      { key: "upgrade", label: "Upgrade to the $80 plan", steps: [["addBill", "Phone", 80]], outcome: "Shiny phone, and $35 more out of checking every month. When spending rises with every raise, people call it lifestyle creep.", quality: "ok" },
      { key: "save", label: "Keep my plan and save the difference", steps: [["receiveCash", 35, "raise"], ["moveToSavings", 35]], outcome: "Same phone, bigger savings. Saving part of every raise is how people get ahead.", quality: "good" },
    ],
  },
  {
    id: "dataBreach",
    group: "profile",
    standards: [3, 5],
    icon: "🔐",
    title: "A data breach",
    minChapter: 8,
    fits: () => true,
    text: () => ["Shimmer Market was hacked, and your name, birthday and address may have been stolen. A thief could use them to open credit cards in your name."],
    choices: () => [
      { key: "freeze", label: "Freeze my credit at all three bureaus", outcome: "Done, and it's free. Nobody can open new credit in your name while it's frozen. You can unfreeze it any time you apply for something.", quality: "good" },
      { key: "watch", label: "Check my report for new accounts", outcome: "Good habit. You'll spot a fake account, but a freeze would stop one from being opened at all.", quality: "ok" },
      { key: "nothing", label: "Do nothing", outcome: "Nothing happened this time. Freezing is free, so there's little reason to skip it after a breach.", quality: "bad" },
    ],
  },
  {
    id: "insuranceShop",
    group: "costs",
    standards: [2],
    icon: "🧮",
    title: "Shop your insurance",
    minChapter: 8,
    fits: (life) => life.bills.some((b) => /gas and insurance/i.test(b.name) && b.amount >= 60),
    text: (life) => {
      const b = life.bills.find((x) => /gas and insurance/i.test(x.name));
      return [`You pay ${dollars(b.amount)} a month for gas and insurance. A friend saved money by comparing insurance companies, and your on-time history can earn a better rate.`];
    },
    choices: (life) => {
      const b = life.bills.find((x) => /gas and insurance/i.test(x.name));
      return [
        { key: "compare", label: "Compare three quotes", steps: [["addBill", b.name, b.amount - 15]], outcome: "Same coverage, $15 less a month. That's $180 a year for an hour of phone calls.", quality: "good" },
        { key: "stay", label: "Stay with my company", outcome: "Nothing changes. Prices change every year, so it's worth checking again next time.", quality: "ok" },
      ];
    },
  },
  {
    id: "mortgageReady",
    group: "profile",
    standards: [1, 3],
    icon: "🏡",
    title: "Someday, a house",
    minChapter: 8,
    fits: () => true,
    text: (life) => [
      "A mortgage is a loan to buy a home, usually paid back over 30 years. A lender explains what they look for:",
      "A score of 620 or more to get approved, and 740 or more for the best rate. A down payment saved. And total debt payments under about a third of your income.",
      life.score == null ? "You don't have a score yet." : `Your score is ${life.score}.`,
    ],
    choices: (life) => [
      {
        key: "prequal",
        label: "Get pre-qualified (a soft check)",
        steps: [["recordInquiry", "Coinhaven Home Loans pre-qualification", false]],
        outcome: life.score == null ? "No score yet, so no estimate. Keep building your history." : life.score >= 740 ? `With ${life.score}, you'd get the best rates. Save a down payment and you're ready.` : life.score >= 620 ? `With ${life.score}, you'd likely be approved, but at a higher rate. A higher score could save thousands.` : `At ${life.score}, lenders would say not yet. On-time payments and low balances will get you there.`,
        quality: "good",
        math: "On a $200,000 home loan, 6% costs about $1,200 a month. 8% costs about $1,470. That's about $97,000 more over 30 years.",
      },
      { key: "later", label: "Not yet", outcome: "A house is years away. Every on-time payment you make now counts toward it.", quality: "ok" },
    ],
  },
  {
    id: "payoffOrSave",
    group: "costs",
    standards: [2],
    icon: "⚖️",
    title: "Pay off debt or save?",
    minChapter: 8,
    fits: (life) => life.checking >= 200 && own(life).some((a) => a.kind === "revolving" && a.status === "open" && amountOwed(a) >= 100),
    text: (life) => {
      const c = own(life).find((a) => a.kind === "revolving" && a.status === "open" && amountOwed(a) >= 100);
      return [`You have an extra $100. Your card has a ${dollars(amountOwed(c))} balance at ${Math.round(c.apr * 100)}% APR. Your savings account earns about 4%.`];
    },
    choices: (life) => {
      const c = own(life).find((a) => a.kind === "revolving" && a.status === "open" && amountOwed(a) >= 100);
      return [
        { key: "pay", label: "Pay $100 on the card", steps: [["pay", c.id, 100]], outcome: `Paying down a ${Math.round(c.apr * 100)}% card is like earning ${Math.round(c.apr * 100)}% on your money. Your utilization drops too.`, quality: "good", factor: { key: "owed", dir: "up" } },
        { key: "save", label: "Put $100 in savings", steps: [["moveToSavings", 100]], outcome: "Saving is good, but the card costs far more than savings earns. High-interest debt usually comes first, once you have a small emergency fund.", quality: "ok" },
      ];
    },
  },
  {
    id: "autoRefinance",
    group: "types",
    standards: [1, 3],
    icon: "🔁",
    title: "A better rate on your loan",
    minChapter: 8,
    fits: (life) => Boolean(openAuto(life)) && life.score != null && life.score >= 680,
    text: (life) => {
      const a = openAuto(life);
      return [`Your score climbed to ${life.score}. A credit union says it could refinance your ${dollars(amountOwed(a))} auto loan at a lower rate than the ${(a.apr * 100).toFixed(1)}% you pay now.`, "Refinancing means a new loan pays off the old one. It's a hard inquiry."];
    },
    choices: () => [
      { key: "ask", label: "Ask for a quote", steps: [["recordInquiry", "Credit union auto refinance", true]], outcome: "The quote came in about 3 points lower. Over the rest of the loan, that's real money. Shopping for a better rate is what a good score is for.", quality: "good" },
      { key: "keep", label: "Keep my loan as it is", outcome: "No inquiry, no change. That's fine too, especially if the loan is almost paid off.", quality: "ok" },
    ],
  },
];
