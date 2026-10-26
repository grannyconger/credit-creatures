// Feed Frenzy (GAME-SPECS.md game 6): scroll a month of posts while saving for a
// goal. Spot the marketing tricks, buy what you need, and see what you used.
// Plain words, no em-dashes, no semicolons. Parody names only.

export const FF_TRICKS = {
  countdown: { label: "Countdown timer", chip: "ENDS IN 00:14:59", truth: "The deal comes back. This timer resets every day." },
  onlyX: { label: "Only a few left", chip: "ONLY 3 LEFT!", truth: "Plenty in stock. The warehouse has hundreds." },
  hiddenAd: { label: "Hidden ad", chip: "#ad", truth: "The creator is paid to post this. It's an ad." },
  wasNow: { label: "Fake was price", chip: "WAS {was}", truth: "It was never the higher price. That number is made up to make this look like a deal." },
  freeTrial: { label: "Free trial", chip: "FREE TRIAL!", truth: "It turns into a monthly charge unless you cancel." },
};

// Things a persona might really need this month. price: the normal price range.
export const FF_NEEDS = {
  workShoes: { name: "Black non-slip work shoes", price: [38, 52] },
  busPass: { name: "Monthly bus pass", price: [30, 40] },
  calculator: { name: "Graphing calculator for math class", price: [70, 90] },
  charger: { name: "Phone charger (yours broke)", price: [14, 22] },
  coat: { name: "Winter coat", price: [45, 70] },
  textbook: { name: "Used textbook for history", price: [25, 40] },
  interviewShirt: { name: "Button-down shirt for an interview", price: [20, 32] },
  bikeLock: { name: "Bike lock", price: [18, 28] },
  laptopCharger: { name: "Laptop charger", price: [30, 45] },
  gymShoes: { name: "Sneakers for gym class", price: [35, 50] },
  supplies: { name: "School supplies bundle", price: [18, 30] },
  uniform: { name: "Team uniform fee", price: [40, 55] },
  glasses: { name: "Glasses repair kit and case", price: [12, 18] },
  backpack: { name: "Backpack (the zipper died)", price: [25, 40] },
};

// 15 personas.
export const FF_PERSONAS = [
  { name: "Maya", situation: "New job at a cafe, needs black work shoes.", needs: ["workShoes", "busPass"], interests: ["music", "art"], goal: ["Concert tickets", 300], cash: [380, 440] },
  { name: "Theo", situation: "Starting high school math with a new calculator rule.", needs: ["calculator", "supplies"], interests: ["gaming", "tech"], goal: ["A new game console", 400], cash: [420, 480] },
  { name: "Ava", situation: "Phone charger died and an interview is next week.", needs: ["charger", "interviewShirt"], interests: ["fashion", "beauty"], goal: ["Summer camp deposit", 250], cash: [330, 400] },
  { name: "Leo", situation: "Bikes to school every day. His lock got stolen.", needs: ["bikeLock", "backpack"], interests: ["sports", "outdoors"], goal: ["A new bike", 350], cash: [360, 420] },
  { name: "Zoe", situation: "Cold winter coming and the old coat is too small.", needs: ["coat", "glasses"], interests: ["books", "art"], goal: ["A drawing tablet", 300], cash: [380, 440] },
  { name: "Sam", situation: "Joined the soccer team and needs gym sneakers.", needs: ["uniform", "gymShoes"], interests: ["sports", "gaming"], goal: ["Soccer camp", 300], cash: [400, 460] },
  { name: "Riley", situation: "Laptop charger frayed. Online classes start Monday.", needs: ["laptopCharger", "textbook"], interests: ["tech", "music"], goal: ["Headphones for music production", 250], cash: [340, 400] },
  { name: "Jordan", situation: "Takes the bus to a new after-school job.", needs: ["busPass", "workShoes", "charger"], interests: ["fashion", "music"], goal: ["Prom tickets and outfit", 300], cash: [420, 480] },
  { name: "Priya", situation: "AP history needs a textbook and supplies.", needs: ["textbook", "supplies"], interests: ["books", "cooking"], goal: ["A cooking class", 200], cash: [300, 360] },
  { name: "Marcus", situation: "First job interview, then a bike commute.", needs: ["interviewShirt", "bikeLock"], interests: ["sports", "tech"], goal: ["A used laptop", 400], cash: [420, 480] },
  { name: "Lily", situation: "Glasses keep breaking and her backpack ripped.", needs: ["glasses", "backpack"], interests: ["art", "beauty"], goal: ["Art supplies for a contest", 200], cash: [300, 360] },
  { name: "Noah", situation: "Started a delivery job by bike. Winter is coming.", needs: ["coat", "bikeLock", "charger"], interests: ["outdoors", "gaming"], goal: ["A camping trip", 300], cash: [420, 480] },
  { name: "Isabel", situation: "Joined the dance team, and uniforms are due.", needs: ["uniform", "gymShoes"], interests: ["music", "fashion"], goal: ["Dance intensive", 300], cash: [400, 460] },
  { name: "Ethan", situation: "New calculator rule in physics, and his charger died.", needs: ["calculator", "charger"], interests: ["tech", "books"], goal: ["Robotics club fee", 250], cash: [380, 440] },
  { name: "Grace", situation: "Starting a library job and taking the bus.", needs: ["busPass", "interviewShirt", "textbook"], interests: ["books", "cooking"], goal: ["A trip to see family", 350], cash: [420, 480] },
];

// Wants, tagged by interest. 60 posts.
export const FF_WANTS = [
  ["Wireless earbuds", "music", [45, 80]], ["Vinyl record of the week", "music", [25, 35]], ["Guitar pedal", "music", [40, 70]], ["Concert tee", "music", [25, 35]], ["Bluetooth speaker", "music", [30, 60]], ["Karaoke mic", "music", [20, 35]],
  ["Marker set, 72 colors", "art", [30, 45]], ["Sketchbook bundle", "art", [15, 25]], ["Clay sculpting kit", "art", [25, 40]], ["Watercolor set", "art", [20, 35]], ["Art print poster", "art", [15, 25]], ["Desk lamp for drawing", "art", [25, 40]],
  ["New game, deluxe edition", "gaming", [60, 90]], ["RGB keyboard", "gaming", [40, 70]], ["Game skin bundle", "gaming", [15, 25]], ["Controller grips", "gaming", [12, 20]], ["Gaming chair cushion", "gaming", [25, 35]], ["Streaming webcam", "gaming", [35, 60]],
  ["Phone ring light", "tech", [20, 30]], ["Smart watch band", "tech", [15, 25]], ["Portable charger, huge", "tech", [30, 50]], ["Mechanical pencil set", "tech", [12, 18]], ["Mini drone", "tech", [45, 80]], ["Phone case, glitter", "tech", [15, 25]],
  ["Running shorts", "sports", [20, 30]], ["Team jersey", "sports", [60, 90]], ["Water bottle, 40 oz", "sports", [25, 40]], ["Resistance bands", "sports", [15, 25]], ["Basketball", "sports", [20, 35]], ["Protein bar box", "sports", [20, 30]],
  ["Hiking socks 3-pack", "outdoors", [15, 25]], ["Camping hammock", "outdoors", [30, 50]], ["Trail headlamp", "outdoors", [20, 35]], ["Pocket knife multitool", "outdoors", [25, 40]], ["Fishing lure kit", "outdoors", [15, 30]], ["Rain jacket", "outdoors", [45, 70]],
  ["Platform sneakers", "fashion", [60, 95]], ["Bucket hat", "fashion", [20, 30]], ["Chunky rings set", "fashion", [15, 25]], ["Vintage denim jacket", "fashion", [45, 70]], ["Mini backpack", "fashion", [30, 45]], ["Sunglasses", "fashion", [20, 40]],
  ["Lip gloss trio", "beauty", [15, 25]], ["Skincare starter kit", "beauty", [30, 50]], ["Hair curler", "beauty", [35, 55]], ["Nail art kit", "beauty", [15, 25]], ["Perfume mini", "beauty", [25, 40]], ["Makeup brush set", "beauty", [20, 35]],
  ["Book box set", "books", [30, 50]], ["Fancy bookmarks", "books", [10, 15]], ["E-reader cover", "books", [20, 30]], ["Graphic novel", "books", [15, 25]], ["Reading pillow", "books", [25, 40]], ["Book light", "books", [12, 20]],
  ["Air fryer, mini", "cooking", [40, 65]], ["Chef knife", "cooking", [30, 50]], ["Cookie cutter set", "cooking", [12, 20]], ["Spice sampler", "cooking", [20, 30]], ["Waffle maker", "cooking", [25, 40]], ["Apron with pockets", "cooking", [15, 25]],
];

// Free trials: $0 today, then monthly.
export const FF_TRIALS = [["Streamflix Premium", 15], ["MusicBox Unlimited", 12], ["Glow Beauty Box", 25], ["GamePass Ultra-ish", 17], ["Snack Crate Monthly", 20], ["Fit Coach App", 14]];

export const FF_CREATORS = ["@glowwithgabi", "@techtalkty", "@sneakerqueen", "@chefmateo", "@coachkayla", "@artbyrin", "@gamerjojo", "@outdoorsoren", "@stylebymo", "@booknook.bea"];

export const FEED_META = {
  title: "Feed Frenzy",
  pitch: "Scroll your feed for a month while saving for a goal. Spot the marketing tricks, buy what you need, and see what still matters a week later.",
  skill: "spending",
  standards: ["A2", "A4", "A5"],
  metric: "Feed Score",
  tie: { label: "more tricks spotted", better: "high" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: () => "feed",
  timer: { timed: "2:30 of scrolling.", none: "Scroll at your own pace." },
  settings: () => [],
  mistakes: ["Each regret: its price.", "Each subscription charge you didn't cancel: its price."],
  beats: ["This is your situation. These are your real needs this month.", "Tap the trick in a post to see the truth.", "Wishlist it to decide later."],
  why: { weak: "I wanted it.", okay: "It was on sale.", strong: "I waited a week and still needed it for my job." },
  revealTitle: "Your wishlist and your purchases, a week later",
  unlock: 2,
};

export const FEED_BONUS = [
  { id: "ff1", type: "choice", q: "A need is...", choices: ["Something you must have to live, work or learn", "Something everyone has", "Anything on sale"], answer: 0, why: "Needs keep life running. Wants make it nicer." },
  { id: "ff2", type: "choice", q: "#ad on a post means...", choices: ["The creator was paid to post it", "It's a great deal", "It's free"], answer: 0, why: "The FTC says paid posts must say so clearly." },
  { id: "ff3", type: "choice", q: "A countdown timer on a sale is usually there to...", choices: ["Rush you before you think", "Help you save", "Show shipping time"], answer: 0, why: "Pressure makes people skip the thinking step." },
  { id: "ff4", type: "choice", q: "A was price that was never real is called...", choices: ["Price anchoring", "A coupon", "Sales tax"], answer: 0, why: "A big fake number makes the real price look like a steal." },
  { id: "ff5", type: "number", q: "A $12 a month free trial you forget to cancel for 6 months costs how much?", answer: 72, why: "$12 times 6 months is $72." },
  { id: "ff6", type: "choice", q: "An impulse buy is...", choices: ["Buying on the spot without planning", "A planned purchase", "A refund"], answer: 0, why: "Waiting a day or a week kills a lot of impulse buys." },
  { id: "ff7", type: "choice", q: "Why put something on a wishlist instead of buying now?", choices: ["To see if you still want it after the hype fades", "It gets cheaper automatically", "Stores require it"], answer: 0, why: "If you still want it a week later, it might be worth it." },
  { id: "ff8", type: "number", q: "You save $25 a week toward a $300 goal. How many weeks?", answer: 12, why: "$300 divided by $25 is 12 weeks." },
  { id: "ff9", type: "choice", q: "Only 3 left! usually means...", choices: ["They want you to hurry", "It's almost gone forever", "It's a rare item"], answer: 0, why: "Scarcity messages are often not true." },
  { id: "ff10", type: "choice", q: "A sponsored post is...", choices: ["Paid advertising", "A friend's honest review", "A news story"], answer: 0, why: "Someone paid for it to show up in your feed." },
  { id: "ff11", type: "number", q: "Shoes were $90, now $54. What percent off is that?", answer: 40, tolerance: 0.5, why: "$36 off a $90 price is 40 percent, if $90 was ever real." },
  { id: "ff12", type: "choice", q: "The best time to buy a need that's on a fake sale is...", choices: ["When it's at its normal price or lower", "Right now, before the timer ends", "Never"], answer: 0, why: "A trick doesn't make the product bad. It means slow down and compare." },
  { id: "ff13", type: "choice", q: "Influencers must disclose ads because of...", choices: ["FTC endorsement rules", "School rules", "Phone settings"], answer: 0, why: "The FTC's endorsement guides require clear disclosure." },
  { id: "ff14", type: "number", q: "You bought $40, $25 and $35 of things you never used. How much was wasted?", answer: 100, why: "$40 plus $25 plus $35 is $100." },
  { id: "ff15", type: "choice", q: "A SMART goal is...", choices: ["Specific, measurable, achievable, relevant and time-bound", "Any goal you think about", "A goal set by your phone"], answer: 0, why: "Saving $300 for concert tickets by June is a SMART goal." },
  { id: "ff16", type: "choice", q: "Social media marketing is designed to...", choices: ["Make you want to buy", "Help you save", "Teach math"], answer: 0, why: "Feeds are built to keep you scrolling and spending." },
  { id: "ff17", type: "number", q: "Your goal is $300 and you have $180. What percent of the way are you?", answer: 60, tolerance: 0.5, why: "$180 divided by $300 is 60 percent." },
  { id: "ff18", type: "choice", q: "A cost-benefit choice means...", choices: ["Comparing what you give up with what you get", "Buying the cheapest thing", "Buying the most expensive thing"], answer: 0, why: "Every purchase costs you something else you could have had." },
  { id: "ff19", type: "choice", q: "Unfollowing accounts that make you want to buy things can...", choices: ["Cut down impulse spending", "Hurt your credit", "Cost money"], answer: 0, why: "Fewer triggers, fewer impulse buys." },
  { id: "ff20", type: "choice", q: "Before a free trial, you should...", choices: ["Set a reminder to cancel before it charges", "Give your card and forget it", "Use a fake name"], answer: 0, why: "A reminder makes free actually free." },
  { id: "ff21", type: "choice", q: "Buyer's remorse is...", choices: ["Regret after buying something", "A store discount", "A type of receipt"], answer: 0, why: "It's a sign the purchase didn't match what you value." },
];

export const FEED_GUIDE = {
  how: {
    goal: "Get through a month of posts with every real need met, money saved for your goal, and no regrets.",
    steps: [
      "Read your persona card first: your situation, your real needs, your interests and your goal.",
      "Each post has 0 to 2 tricks. Tap a trick to see the truth for +10. Tapping the photo or the caption is -5.",
      "Buy (B), Skip (S) or Wishlist (W). A wishlisted item comes back next week with the tricks stripped away.",
      "Some needs first show up at a fake sale price. The same need comes back later at its normal price or lower.",
      "A [[free trial]] becomes a monthly charge. Cancel it in Subscriptions (C) before it hits.",
      "At the end, every want you bought gets a stamp: Used it, or Never used. Never used is an [[impulse buy]] you regret.",
    ],
    example: "A [[sponsored post]] for work shoes says WAS $90, NOW $54, ONLY 3 LEFT. That's [[price anchoring]] plus fake scarcity. The same shoes come back in week 3 for $45. You still need them, so you buy them then.",
  },
  vocab: [
    { term: "need", def: "Something you must have to live, work or learn.", example: "Work shoes are a need for a cafe job." },
    { term: "want", def: "Something nice to have that you could live without.", example: "A third hoodie is a want." },
    { term: "impulse buy", def: "Buying on the spot without planning.", example: "The flash sale earbuds were an impulse buy." },
    { term: "sponsored post", def: "A post a creator is paid to make. It's an ad.", example: "The tiny #ad meant it was a sponsored post." },
    { term: "free trial", def: "Free for a while, then a monthly charge unless you cancel.", example: "The free trial turned into $15 a month." },
    { term: "price anchoring", def: "Showing a big number first so the real price looks like a deal.", example: "WAS $120 is an anchor if it never cost $120." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "Ads in your feed don't always look like ads.",
    facts: [
      { stat: "The FTC says creators must disclose any money, family, job or personal connection to a brand, and that free or discounted products count too.", source: "Federal Trade Commission, Disclosures 101 for Social Media Influencers", year: 2019, url: "https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers" },
      { stat: "The disclosure has to be with the post itself and hard to miss, not buried at the end or mixed into a pile of hashtags. A hashtag like #ad is fine as long as people can see it.", source: "Federal Trade Commission, Disclosures 101 for Social Media Influencers", year: 2019, url: "https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers" },
    ],
  },
};
