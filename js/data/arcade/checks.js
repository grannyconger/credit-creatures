// Check Writer (GAME-SPECS.md game 2, upgrade): write a careful rent check, deposit
// your paycheck from your phone, then judge checks at the Vault counter.
// Plain words, no em-dashes, no semicolons. Parody names only.

// Your landlord only takes checks. 30 landlords.
export const CW_LANDLORDS = [
  ["Maple Court Apartments", "Unit 4B rent"], ["Brickhouse Rentals", "Apt 12 rent"], ["Sunny Row Property Co.", "Unit 7 rent"], ["Ms. Okafor", "Garage apt rent"], ["Willow Bend Homes", "Unit 3C rent"],
  ["Gaspen Property Group", "Apt 201 rent"], ["Hilltop Lofts", "Loft 9 rent"], ["Mr. Delacroix", "Basement apt rent"], ["Riverside Rentals", "Unit 15 rent"], ["Old Mill Flats", "Flat 2 rent"],
  ["Pinecrest Living", "Apt 8D rent"], ["Cobblestone Court", "Unit 11 rent"], ["The Brambles", "Cottage rent"], ["Harbor View Apts", "Apt 304 rent"], ["Mrs. Lindqvist", "Room rent"],
  ["Copper Kettle Rentals", "Unit 5 rent"], ["Meadowlark Homes", "Unit 2A rent"], ["Granite Peak Property", "Apt 17 rent"], ["Foxglove Flats", "Flat 6 rent"], ["Mr. Abernathy", "Duplex rent"],
  ["Lantern Square Apts", "Apt 110 rent"], ["Bluebell Court", "Unit 1 rent"], ["Stonegate Rentals", "Unit 22 rent"], ["Ivy Lane Homes", "House rent"], ["Ms. Castellano", "Upstairs apt rent"],
  ["Orchard Park Apts", "Apt 3F rent"], ["Redwood Rentals", "Unit 9 rent"], ["Quarry Hill Lofts", "Loft 4 rent"], ["Nightingale Apts", "Apt 56 rent"], ["Mr. Featherstone", "Cabin rent"],
];

// People who bring checks to the Vault counter (40 templates across the problem
// types). writer: who wrote the check (their signature card is on file).
export const CW_JUDGE = [
  { kind: "clean", writer: "Rosa Delgado", payee: "Tomas Reyes", amount: [80, 400], push: "Just cashing my paycheck, thanks." },
  { kind: "clean", writer: "Pinecrest Living", payee: "Ana Sorensen", amount: [50, 300], push: "It's my deposit refund." },
  { kind: "clean", writer: "Hollis Grant", payee: "Mabel Ford", amount: [40, 220], push: "Birthday money from my uncle." },
  { kind: "clean", writer: "Gulligan Water Co.", payee: "Ike Watson", amount: [60, 180], push: "A refund for an overcharge." },
  { kind: "clean", writer: "Dr. Fernsby", payee: "Lupe Ortiz", amount: [120, 600], push: "My pay from the clinic." },
  { kind: "clean", writer: "Coach Briggs", payee: "Kit Morales", amount: [30, 90], push: "Refereeing money." },
  { kind: "signature", writer: "Delphine Moreau", payee: "Rocco Bell", amount: [200, 900], push: "I need this cash today. Rent's due.", forged: "Delphine Morau" },
  { kind: "signature", writer: "Ambrose Kettle", payee: "Saffron Lee", amount: [150, 700], push: "He told me to cash it fast.", forged: "Ambrose Kettel" },
  { kind: "signature", writer: "Winnie Park", payee: "Gus Tran", amount: [300, 1200], push: "Can you hurry? My ride's outside.", forged: "Winny Park" },
  { kind: "signature", writer: "Barnaby Quill", payee: "Nia Shaw", amount: [100, 500], push: "It's totally fine, he's my cousin.", forged: "B. Quil" },
  { kind: "signature", writer: "Ottilie Hart", payee: "Felix Ruiz", amount: [250, 800], push: "I've cashed checks from her before.", forged: "Otilie Hart" },
  { kind: "signature", writer: "Thaddeus Moon", payee: "Bea Klein", amount: [90, 450], push: "Please, it's for groceries.", forged: "Thadeus Mone" },
  { kind: "altered", writer: "Clementine Ash", payee: "Dante Cole", amount: [40, 90], push: "The amount is right, I swear.", add: 900 },
  { kind: "altered", writer: "Hilltop Soccer Club", payee: "Wren Adler", amount: [30, 80], push: "Coaching pay. They were generous!", add: 800 },
  { kind: "altered", writer: "Marisol Vega", payee: "Ezra Pike", amount: [20, 70], push: "Can I get it in twenties?", add: 500 },
  { kind: "altered", writer: "Old Mill Flats", payee: "Juniper Hale", amount: [50, 95], push: "A refund. A big one.", add: 1000 },
  { kind: "altered", writer: "Priya Shah", payee: "Hollis Dunn", amount: [25, 60], push: "Quick, please. I'm parked illegally.", add: 700 },
  { kind: "altered", writer: "Lantern Square Apts", payee: "Lark Rivera", amount: [35, 85], push: "It's my security deposit back.", add: 600 },
  { kind: "stale", writer: "Aurelio Cruz", payee: "Pip Hughes", amount: [60, 300], push: "I found this in a drawer. Still good, right?", monthsOld: [7, 14] },
  { kind: "stale", writer: "Brickhouse Rentals", payee: "Tamsin Gray", amount: [100, 400], push: "I forgot about it for a while.", monthsOld: [8, 12] },
  { kind: "stale", writer: "Mrs. Pennywhistle", payee: "Odessa King", amount: [20, 80], push: "Grandma's check from last year.", monthsOld: [10, 16] },
  { kind: "stale", writer: "Riverside Rentals", payee: "Hollis Grant", amount: [150, 500], push: "It was lost in the move.", monthsOld: [7, 11] },
  { kind: "stale", writer: "Coach Briggs", payee: "Mo Patel", amount: [40, 120], push: "Better late than never!", monthsOld: [9, 13] },
  { kind: "postdated", writer: "Felix Ruiz", payee: "Quill Adams", amount: [100, 600], push: "She said I could cash it early.", daysAhead: [5, 25] },
  { kind: "postdated", writer: "Sunny Row Property Co.", payee: "Juniper Moss", amount: [200, 700], push: "It's dated next week but I need it now.", daysAhead: [7, 20] },
  { kind: "postdated", writer: "Big Lou's Diner", payee: "Jojo Banks", amount: [80, 300], push: "Payday came early, right?", daysAhead: [3, 14] },
  { kind: "postdated", writer: "Ms. Okafor", payee: "Bartholomew Finch", amount: [150, 450], push: "It's basically today.", daysAhead: [2, 10] },
  { kind: "postdated", writer: "Gaspen Dental", payee: "Rosalind Park", amount: [60, 250], push: "A refund they post-dated. Weird, huh?", daysAhead: [4, 18] },
  { kind: "noEndorse", writer: "Hilltop Lofts", payee: "Auntie Fern", amount: [100, 500], push: "Do I really have to sign it?" },
  { kind: "noEndorse", writer: "Dr. Fernsby", payee: "Sir Reginald", amount: [200, 800], push: "I never sign the back. It's fine." },
  { kind: "noEndorse", writer: "Marisol Vega", payee: "Kit Ward", amount: [30, 150], push: "I forgot a pen." },
  { kind: "noEndorse", writer: "Copper Kettle Rentals", payee: "Ambrose Lin", amount: [80, 350], push: "Just cash it, please." },
  { kind: "noEndorse", writer: "Rosa Delgado", payee: "Winnie Cho", amount: [50, 200], push: "My hands are full." },
  { kind: "bigNew", writer: "Granite Peak Property", payee: "Dante Wolfe", amount: [2600, 4800], push: "I just opened my account. I need it all today.", newDays: [1, 6] },
  { kind: "bigNew", writer: "Harbor View Apts", payee: "Lupe Santos", amount: [3000, 6000], push: "It's from selling my car. Cash, please!", newDays: [2, 8] },
  { kind: "bigNew", writer: "Mr. Abernathy", payee: "Gus Kowalski", amount: [2500, 4500], push: "Big job, big check. New account though.", newDays: [1, 5] },
  { kind: "bigNew", writer: "Nightingale Apts", payee: "Saffron Diaz", amount: [2800, 5200], push: "I'll take hundreds.", newDays: [1, 4] },
  { kind: "bigNew", writer: "Meadowlark Homes", payee: "Rocco Silva", amount: [3200, 5800], push: "An overpayment refund. Can I get cash?", newDays: [2, 7] },
  { kind: "clean", writer: "Foxglove Flats", payee: "Ottilie Brand", amount: [70, 260], push: "My first paycheck ever!" },
  { kind: "clean", writer: "Pip Hughes", payee: "Ike Navarro", amount: [25, 95], push: "He paid me back for concert tickets." },
];

// The right call for each problem and its one-sentence why.
export const CW_CALLS = {
  clean: { call: "cash", why: "Everything matches, it's signed and endorsed, and it's recent. Good to cash." },
  signature: { call: "reject", why: "The signature doesn't match the card on file. That's a sign of a forged check." },
  altered: { call: "reject", why: "The numbers and words don't match, and something was added. Never cash an altered check." },
  stale: { call: "reject", why: "The check is more than 6 months old. That's a stale check, so banks can refuse it." },
  postdated: { call: "hold", why: "It's dated in the future. Hold it until that date comes." },
  noEndorse: { call: "reject", why: "The back isn't signed. Ask them to endorse it, then try again." },
  bigNew: { call: "hold", why: "A big check from a brand new account. Hold it until it clears so the bank isn't out the money." },
  washed: { call: "reject", why: "This is your check. Someone added to the empty space you left. Always draw a line." },
};

export const CW_ENDORSE = [
  { id: "sig", label: "Signature only", why: "A check with just a signature on the back can be cashed by anyone who holds it, like cash on the sidewalk." },
  { id: "mobile", label: "For mobile deposit only, plus your signature", why: "Right. This is what banks ask for when you deposit with your phone, and nobody else can cash it.", right: true },
  { id: "friend", label: "Pay to the order of a friend, plus your signature", why: "That signs your paycheck over to your friend. Now it's their money." },
];

// The word tiles under the check.
export const CW_TILES = [
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
  "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  "hundred", "thousand", "and",
];

export const CHECKS_META = {
  title: "Check Writer",
  pitch: "Write a check carefully, deposit your paycheck, then judge checks at the Vault. One of them might be yours, altered.",
  skill: "banking",
  standards: ["C2", "C7", "A6"],
  metric: "Vault Score",
  tie: { label: "fastest time", better: "low" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: () => "checks",
  timer: { timed: "3:30 for the whole shift.", none: "Take your time." },
  settings: () => [],
  mistakes: ["Cashing a bad check: $50.", "Your own check gets washed: $25.", "A wrong endorsement: $5."],
  beats: ["Write the payee exactly as the bill says.", "Build the amount in words from these tiles.", "Draw a line through empty space so no one can add to it."],
  why: { weak: "It looked fine.", okay: "The customer seemed honest.", strong: "The bank can wait for it to clear before giving cash." },
  revealTitle: "Your check, and the calls you made",
  unlock: 0,
};

export const CHECKS_BONUS = [
  { id: "w1", type: "choice", q: "On a check, the official amount is...", choices: ["The amount in words", "The amount in numbers", "The memo"], answer: 0, why: "If the words and numbers disagree, banks usually go by the words." },
  { id: "w2", type: "choice", q: "Why draw a line after the payee and the written amount?", choices: ["So no one can add words or numbers", "It looks fancy", "Banks charge less"], answer: 0, why: "Empty space invites check washing and altering." },
  { id: "w3", type: "choice", q: "To endorse a check means to...", choices: ["Sign the back", "Write the memo", "Date it"], answer: 0, why: "Endorsing is signing the back so it can be cashed or deposited." },
  { id: "w4", type: "choice", q: "A stale check is one that's...", choices: ["More than 6 months old", "Torn", "Written in pencil"], answer: 0, why: "Banks don't have to accept checks older than six months." },
  { id: "w5", type: "choice", q: "A postdated check has...", choices: ["A date in the future", "No date", "Two dates"], answer: 0, why: "It shouldn't be cashed before that date." },
  { id: "w6", type: "choice", q: "Check washing is...", choices: ["Erasing and rewriting a stolen check", "Cleaning a dirty check", "A bank fee"], answer: 0, why: "Thieves use chemicals to remove ink, then write in a new payee or amount." },
  { id: "w7", type: "choice", q: "The routing number tells...", choices: ["Which bank the check is from", "Your account balance", "The check number"], answer: 0, why: "The 9-digit routing number identifies the bank." },
  { id: "w8", type: "choice", q: "The payee is...", choices: ["Who the check is made out to", "Who writes the check", "The bank"], answer: 0, why: "Pay to the order of names the payee." },
  { id: "w9", type: "choice", q: "What should you write on the back for a phone deposit?", choices: ["For mobile deposit only, plus your signature", "Nothing", "Your password"], answer: 0, why: "Banks require it, and nobody else can cash the check." },
  { id: "w10", type: "choice", q: "A hold on a deposited check means...", choices: ["The bank waits for it to clear before you can use all of it", "The check is fake", "You owe a fee"], answer: 0, why: "Holds protect the bank, and you, from bad checks." },
  { id: "w11", type: "choice", q: "How do you write $742.17 in words on a check?", choices: ["Seven hundred forty-two and 17/100", "Seven forty-two point seventeen", "742 and 17 cents"], answer: 0, why: "Dollars in words, then the cents as a fraction of 100." },
  { id: "w12", type: "choice", q: "The memo line is...", choices: ["Optional, a note about what it's for", "Required by law", "Where you sign"], answer: 0, why: "It's a helpful note, like an account number or 'March rent'." },
  { id: "w13", type: "choice", q: "If a check's signature doesn't match the card on file, the teller should...", choices: ["Reject it", "Cash it", "Hold it for a year"], answer: 0, why: "A mismatched signature is a red flag for forgery." },
  { id: "w14", type: "choice", q: "Who signs the front of a check?", choices: ["The person writing it", "The person cashing it", "The bank"], answer: 0, why: "The writer signs the front. Whoever cashes it signs the back." },
  { id: "w15", type: "choice", q: "Writing a check for more than you have in the account is called...", choices: ["Bouncing a check", "Endorsing", "A memo"], answer: 0, why: "A bounced check comes back unpaid, usually with fees." },
  { id: "w16", type: "number", q: "Rent is $850 and you leave $0.00 in the cents. What goes after 'and' in the words?", answer: 0, why: "It's 00/100, so type 0. Every check shows the cents, even zero." },
  { id: "w17", type: "choice", q: "A safer pen for writing checks uses...", choices: ["Gel ink that soaks into the paper", "Pencil", "Erasable ink"], answer: 0, why: "Gel ink is harder to wash off than some ballpoint ink." },
  { id: "w18", type: "choice", q: "Why might a bank hold a big check from a brand new account?", choices: ["New accounts have no track record yet", "Big checks are always fake", "To charge interest"], answer: 0, why: "The bank waits to make sure the money is really there." },
  { id: "w19", type: "choice", q: "Mobile deposit means...", choices: ["Snapping a photo of a check in your bank app", "Mailing a check", "Driving to an ATM"], answer: 0, why: "Then keep the paper check a few days in case there's a problem." },
  { id: "w20", type: "choice", q: "Signing a check over to someone else is...", choices: ["Writing 'Pay to the order of' their name, then signing", "Tearing it in half", "Writing VOID"], answer: 0, why: "It's legal, but then it's their money, not yours." },
  { id: "w21", type: "choice", q: "VOID written across a check means...", choices: ["It can't be used", "Pay double", "It's a gift"], answer: 0, why: "People void checks they made a mistake on, or to set up direct deposit." },
];

export const CHECKS_GUIDE = {
  how: {
    goal: "Write your rent check with no mistakes, deposit your paycheck safely, then make the right call on three checks at the Vault.",
    steps: [
      "Copy the [[payee]] exactly from the bill, and the date and amount in numbers.",
      "Build the amount in words from the tiles: dollars in words, AND, then the cents tile.",
      "Draw a line (L) through the empty space after the payee and after the words. Empty space invites [[check washing]].",
      "Sign the front (S). Then [[endorse]] your paycheck for a phone deposit.",
      "At the Vault, each check gets Cash (C), [[Hold]] (H) or Reject (R). Check the signature card, the date, the back, and whether the words match the numbers.",
      "Watch for a [[stale check]] (more than 6 months old) and a [[postdated]] one (dated in the future).",
    ],
    example: "A check for $42.00 with no line after the words. A thief adds NINE HUNDRED in front and a 9 before the 42. Now it reads $942. A line would have stopped it.",
  },
  vocab: [
    { term: "payee", def: "The person or business a check is made out to.", example: "The payee on her rent check was Maple Court Apartments." },
    { term: "endorse", def: "Sign the back of a check to cash or deposit it.", example: "He endorsed his paycheck for mobile deposit only." },
    { term: "memo", def: "An optional note on a check about what it's for.", example: "She wrote Unit 4B rent in the memo." },
    { term: "routing number", def: "The 9-digit number at the bottom left that names the bank.", example: "The routing number showed the check was from the Vault." },
    { term: "Hold", def: "The bank waits for a check to clear before you can use all the money.", example: "The bank put a hold on the big check from the new account." },
    { term: "stale check", def: "A check more than six months old. Banks can refuse it.", example: "Grandma's check from last year was stale." },
    { term: "postdated", def: "Dated in the future, so it shouldn't be cashed yet.", example: "The check was postdated to the 30th." },
    { term: "check washing", def: "Erasing the ink on a stolen check and writing in a new payee or amount.", example: "Check washing turned a $42 check into $942." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "Fewer people write checks, but check fraud is still a big deal.",
    facts: [
      { stat: "Banks filed over 680,000 reports of possible check fraud in 2022, nearly double the over 350,000 filed in 2021.", source: "FinCEN alert on mail theft-related check fraud", year: 2023, url: "https://www.fincen.gov/news/news-releases/fincen-alert-nationwide-surge-mail-theft-related-check-fraud-schemes-targeting" },
      { stat: "In just six months after that alert, banks sent 15,417 reports about check fraud tied to stolen mail, worth more than $688 million in suspicious activity.", source: "FinCEN Financial Trend Analysis", year: 2024, url: "https://www.fincen.gov/news/news-releases/fincen-issues-depth-analysis-check-fraud-related-mail-theft" },
    ],
  },
};
