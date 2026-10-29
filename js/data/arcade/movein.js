// Move-In Day (GAME-SPECS.md game 14, Lease Life re-themed for standard E by
// the teacher, 2026-10-25): compare two schools' aid letters and pick the lower
// net cost, then find an apartment near campus before someone else grabs it.
// Parody school names only. No em-dashes, no semicolons.

// Aid types. kind: free (never paid back), earn (you work for it), borrow (paid back).
export const MI_AID = {
  pell: { name: "Federal Pell Grant", kind: "free" },
  state: { name: "State Grant", kind: "free" },
  merit: { name: "Merit Scholarship", kind: "free" },
  school: { name: "University Grant", kind: "free" },
  ws: { name: "Federal Work-Study", kind: "earn" },
  sub: { name: "Direct Subsidized Loan", kind: "borrow" },
  unsub: { name: "Direct Unsubsidized Loan", kind: "borrow" },
  plus: { name: "Parent PLUS Loan", kind: "borrow" },
  private: { name: "Private Student Loan", kind: "borrow" },
};
export const MI_KIND_LABEL = { free: "Free money", earn: "Earn it", borrow: "Pay it back" };

// School templates. cost: yearly cost of attendance lines. aid: [type, low, high].
// "flashy" letters pad the total with loans so the aid looks bigger.
export const MI_SCHOOLS = [
  { id: "cc", name: "Coinhaven Community College", note: "2 years, then transfer", cost: { tuition: [3800, 4500], housing: [9000, 10500], books: [1100, 1400], travel: [1500, 2000] }, aid: [["pell", 3000, 5000], ["state", 800, 1500], ["ws", 1500, 2500], ["sub", 2000, 3500]] },
  { id: "state", name: "Kingdom State University", note: "In-state public", cost: { tuition: [11000, 12800], housing: [12000, 13500], books: [1200, 1400], travel: [1200, 1800] }, aid: [["pell", 2500, 4500], ["state", 1500, 3000], ["merit", 1000, 3000], ["sub", 3500, 3500], ["unsub", 2000, 2000]] },
  { id: "far", name: "Northmarch State University", note: "Out-of-state public", cost: { tuition: [30000, 33000], housing: [12500, 14000], books: [1200, 1400], travel: [2000, 3000] }, flashy: true, aid: [["merit", 3000, 6000], ["sub", 3500, 3500], ["unsub", 2000, 2000], ["plus", 15000, 22000], ["ws", 2000, 2500]] },
  { id: "priv", name: "Goldleaf College", note: "Private", cost: { tuition: [44000, 47000], housing: [14500, 16000], books: [1100, 1300], travel: [1500, 2500] }, aid: [["school", 22000, 30000], ["merit", 4000, 8000], ["pell", 2000, 4000], ["ws", 2000, 3000], ["sub", 3500, 3500], ["unsub", 2000, 2000]] },
  { id: "glossy", name: "Brightspire Institute", note: "Private, glossy brochure", cost: { tuition: [39000, 43000], housing: [14000, 15500], books: [1200, 1400], travel: [1500, 2500] }, flashy: true, aid: [["merit", 5000, 9000], ["sub", 3500, 3500], ["unsub", 2000, 2000], ["plus", 18000, 26000], ["private", 6000, 10000]] },
];
export const MI_COST_LABEL = { tuition: "Tuition and fees", housing: "Housing and food", books: "Books and supplies", travel: "Travel and personal" };

// The 5 inspect spots on every floorplan.
export const MI_SPOTS = [
  { id: "kitchen", name: "Kitchen", icon: "home" },
  { id: "bath", name: "Bathroom", icon: "home" },
  { id: "windows", name: "Windows", icon: "search" },
  { id: "locks", name: "Door locks", icon: "key" },
  { id: "walls", name: "Walls and ceiling", icon: "home" },
];

// Hidden problems, by spot. cost: what it costs you if it breaks during the year.
export const MI_PROBLEMS = [
  { id: "mold", spot: "kitchen", found: "Mold under the sink.", broke: "The mold under the sink spread. Ruined groceries and a cleaner.", cost: [180, 320] },
  { id: "outlets", spot: "kitchen", found: "Two dead outlets by the counter.", broke: "Dead outlets. You bought extension cords and a new toaster after a spark.", cost: [60, 140] },
  { id: "leak", spot: "bath", found: "The toilet base is leaking.", broke: "The toilet leak soaked the floor. You paid for towels, a plumber visit and a hotel night.", cost: [200, 380] },
  { id: "pests", spot: "bath", found: "Signs of pests behind the tub.", broke: "Roaches. Traps, a pest spray and tossed food.", cost: [120, 260] },
  { id: "latch", spot: "windows", found: "A window that won't latch.", broke: "The window wouldn't latch. Your heating bill jumped all winter.", cost: [150, 300] },
  { id: "ac", spot: "windows", found: "The window AC unit is broken.", broke: "Broken AC in August. You bought a fan and a portable unit.", cost: [180, 340] },
  { id: "lock", spot: "locks", found: "The front door lock barely catches.", broke: "The front lock failed. Your bike was stolen from the hallway.", cost: [250, 420] },
  { id: "stain", spot: "walls", found: "A water stain on the ceiling.", broke: "The ceiling stain was a roof leak. It dripped on your laptop.", cost: [220, 400] },
];

// 12 unit templates. rent is monthly. far adds commuting cost a month.
export const MI_UNITS = [
  { id: "u1", name: "Maple Court, unit 2B", rent: [780, 880], far: 20, problems: [0, 2], look: "Sunny, fresh paint" },
  { id: "u2", name: "The Lofts at Mill Street", rent: [950, 1080], far: 0, problems: [0, 2], look: "Exposed brick, new floors" },
  { id: "u3", name: "Hillside Duplex, upstairs", rent: [720, 820], far: 45, problems: [1, 2], look: "Big yard, older building" },
  { id: "u4", name: "Campus View 410", rent: [990, 1120], far: 0, problems: [0, 1], look: "Walk to class" },
  { id: "u5", name: "Willow Row, unit 5", rent: [760, 860], far: 30, problems: [1, 2], look: "Quiet street" },
  { id: "u6", name: "Brookside Apartments 12", rent: [840, 940], far: 15, problems: [0, 2], look: "Laundry in the building" },
  { id: "u7", name: "Old Mill Studio", rent: [690, 780], far: 25, problems: [1, 2], look: "Tiny but cheap" },
  { id: "u8", name: "Cedar Flats 3A", rent: [880, 980], far: 10, problems: [0, 1], look: "Balcony" },
  { id: "u9", name: "The Ivy, unit 7", rent: [920, 1040], far: 5, problems: [0, 2], look: "Gym downstairs" },
  { id: "u10", name: "Lantern House, garden unit", rent: [800, 900], far: 35, problems: [1, 2], look: "Private entrance" },
  { id: "u11", name: "Station Square 22", rent: [860, 960], far: 0, problems: [0, 2], look: "Next to the bus" },
  { id: "u12", name: "Pine Terrace 1C", rent: [740, 840], far: 40, problems: [0, 2], look: "Two closets" },
];
export const MI_BACKUP = { name: "The backup: Riverside Extended Stay", look: "Far from campus, week-to-week", rent: 1150, far: 90 };

// 12 lease gotchas. cost: what it costs if it triggers. odds: chance it triggers.
export const MI_GOTCHAS = [
  { id: "renew", text: "This lease renews on its own for another year unless you give written notice 60 days before it ends. Renewal rent may go up.", why: "Auto-renew with a long notice window", effect: "The lease auto-renewed at a higher rent and you had to pay to break it.", cost: [300, 500], odds: 0.6 },
  { id: "break", text: "Ending this lease early costs a fee equal to two months' rent.", why: "A huge early termination fee", effect: "You moved closer to class mid-year and paid the early termination fee.", cost: "twoMonths", odds: 0.35 },
  { id: "pet", text: "Pet rent of $45 a month applies to any animal on the property, including visiting animals.", why: "Pet rent, even for visiting pets", effect: "Your roommate's cousin's dog visited. Pet rent for the rest of the year.", cost: [270, 405], odds: 0.5 },
  { id: "repairs", text: "Tenant is responsible for all repairs, including appliances and plumbing.", why: "You pay every repair", effect: "The fridge died. Under your lease, the repair was yours.", cost: [250, 450], odds: 0.65 },
  { id: "enter", text: "Landlord may enter the unit at any time without notice.", why: "Entry without notice", effect: "The landlord walked in during a party and wrote you up for 'noise'. A $150 fine.", cost: [150, 150], odds: 0.45 },
  { id: "carpet", text: "Tenant pays for professional carpet cleaning at move-out, at a price the landlord chooses.", why: "Move-out cleaning at their price", effect: "The landlord's carpet cleaning bill was steep.", cost: [220, 300], odds: 0.9 },
  { id: "late", text: "Rent paid after the 1st at 5 PM has a $100 late fee, plus $15 a day.", why: "Harsh late fees", effect: "A paycheck landed late once. The late fees added up.", cost: [160, 250], odds: 0.5 },
  { id: "guests", text: "Guests staying more than 2 nights in a month must be added to the lease for a $75 fee each.", why: "Fees for guests", effect: "Your sister stayed a weekend twice. Guest fees.", cost: [75, 150], odds: 0.55 },
  { id: "utilities", text: "Tenant pays a flat $90 a month utility fee, not based on actual use.", why: "A flat utility fee", effect: "The flat utility fee cost more than your actual use would have.", cost: [240, 360], odds: 0.8 },
  { id: "parking", text: "Parking is $60 a month and required for all tenants, car or not.", why: "Forced parking fees", effect: "You paid for a parking spot you never used.", cost: [600, 720], odds: 0.9 },
  { id: "paint", text: "Any nail hole found at move-out is charged at $50 per hole.", why: "Fees per nail hole", effect: "Five posters, ten nail holes, $500 asked. You argued it down a little.", cost: [250, 400], odds: 0.6 },
  { id: "deposit", text: "The security deposit is non-refundable.", why: "A deposit you never get back", effect: "None of your deposit came back, no matter how clean you left it.", cost: "deposit", odds: 1 },
];
// Plain clauses that are fine to sign.
export const MI_FINE = [
  "Rent is due on the 1st of each month.",
  "Tenant must keep the unit reasonably clean.",
  "Landlord will give 24 hours' notice before entering, except in emergencies.",
  "Security deposit is returned within 30 days of move-out, minus itemized damage.",
  "Smoking is not allowed inside the unit.",
  "Tenant must report needed repairs in writing.",
];

// 10 roommate profiles. reliable: chance they stay all year.
export const MI_ROOMMATES = [
  { name: "Priya", clues: ["Has paid every phone bill on time for two years.", "Works 15 hours a week at the library."], stay: 0.95 },
  { name: "Marcus", clues: ["Asks to Venmo you for 'his half' of last month already.", "Says he'll 'figure out a job soon'."], stay: 0.4 },
  { name: "Jun", clues: ["Shares a budget spreadsheet with you on day one.", "Has a work-study job lined up."], stay: 0.92 },
  { name: "Tasha", clues: ["Her last two roommates 'didn't work out'.", "Just bought concert tickets for every weekend."], stay: 0.45 },
  { name: "Leo", clues: ["Has a reference from his old landlord.", "Saving for a car, very careful with money."], stay: 0.9 },
  { name: "Brynn", clues: ["Might transfer schools in January.", "Isn't sure about her classes yet."], stay: 0.35 },
  { name: "Omar", clues: ["Splits bills with an app and pays first.", "Has the same class schedule as you."], stay: 0.9 },
  { name: "Kit", clues: ["Borrowed money from you during the tour.", "Plans to 'mostly stay at a friend's place'."], stay: 0.35 },
  { name: "Ava", clues: ["Has a part-time job with steady hours.", "Asked good questions about the lease."], stay: 0.88 },
  { name: "Dex", clues: ["Owes his last landlord a month's rent.", "Wants to bring a large dog."], stay: 0.3 },
];

// 15 fast-forward events. A choice event offers a cheap fix now or a bigger
// deposit hit later. damage: deducted from the deposit if not fixed.
export const MI_EVENTS = [
  { id: "e1", title: "Spilled pasta sauce on the carpet", text: "It's soaking in fast.", choices: [{ label: "Rent a carpet cleaner ($35)", cost: 35 }, { label: "Leave it", damage: 140 }] },
  { id: "e2", title: "A nail hole in the wall", text: "You hung a mirror. It fell.", choices: [{ label: "Patch kit ($8)", cost: 8 }, { label: "Leave it", damage: 60 }] },
  { id: "e3", title: "The blinds snapped", text: "One slat, then three.", choices: [{ label: "Replace them ($25)", cost: 25 }, { label: "Leave it", damage: 90 }] },
  { id: "e4", title: "Burn mark on the counter", text: "Hot pan, no trivet.", choices: [{ label: "Report it and pay the fix ($60)", cost: 60 }, { label: "Hide it with a toaster", damage: 200 }] },
  { id: "e5", title: "A quiet month", text: "Classes, work, sleep. Nothing broke." },
  { id: "e6", title: "Your bike scuffed the hallway", text: "Long black marks.", choices: [{ label: "Magic eraser ($5)", cost: 5 }, { label: "Leave it", damage: 50 }] },
  { id: "e7", title: "Clogged sink", text: "Hair, mostly.", choices: [{ label: "Buy a drain snake ($12)", cost: 12 }, { label: "Pour stuff in and hope", damage: 120 }] },
  { id: "e8", title: "A friend's party", text: "Someone leaned on the closet door.", choices: [{ label: "Fix the hinge ($20)", cost: 20 }, { label: "Leave it", damage: 110 }] },
  { id: "e9", title: "Finals week", text: "You barely left your desk. The place survived." },
  { id: "e10", title: "Fridge left open overnight", text: "Water on the floor.", choices: [{ label: "Dry it and tell the landlord ($0)", cost: 0 }, { label: "Ignore the soft spot", damage: 150 }] },
  { id: "e11", title: "Paint scrape from moving a desk", text: "Bare drywall shows.", choices: [{ label: "Touch-up paint ($15)", cost: 15 }, { label: "Leave it", damage: 75 }] },
  { id: "e12", title: "Smoke detector chirping", text: "It's 3 AM.", choices: [{ label: "New battery ($6)", cost: 6 }, { label: "Pull it off the ceiling", damage: 80 }] },
  { id: "e13", title: "Spring break", text: "You went home. The apartment was fine." },
  { id: "e14", title: "Shower grout turning black", text: "Mildew.", choices: [{ label: "Scrub and spray ($10)", cost: 10 }, { label: "Leave it", damage: 100 }] },
  { id: "e15", title: "A cracked window", text: "A snowball, allegedly.", choices: [{ label: "Report it now ($70)", cost: 70 }, { label: "Tape it", damage: 220 }] },
];

// Damage already there at move-in (photograph it) and decoys (nothing wrong).
export const MI_DAMAGE = [
  { id: "d1", spot: "Living room carpet", text: "A dark stain near the couch", cost: 150 },
  { id: "d2", spot: "Bedroom wall", text: "Three nail holes and a scuff", cost: 90 },
  { id: "d3", spot: "Kitchen counter", text: "A long knife scratch", cost: 180 },
  { id: "d4", spot: "Bathroom door", text: "A crack near the handle", cost: 120 },
  { id: "d5", spot: "Closet", text: "A bent sliding door track", cost: 80 },
  { id: "d6", spot: "Window screen", text: "A torn screen", cost: 60 },
];
export const MI_DECOYS = [
  { id: "x1", spot: "Ceiling fan", text: "Works fine" },
  { id: "x2", spot: "Hallway light", text: "Works fine" },
  { id: "x3", spot: "Oven", text: "Clean and working" },
  { id: "x4", spot: "Front closet", text: "Nothing wrong" },
];

export const MI_META = {
  title: "Move-In Day",
  pitch: "Pick a school by what it really costs, then find your first apartment near campus before someone else grabs it.",
  skill: "spending",
  standards: ["E1", "E2", "E4", "E6", "A2"],
  metric: "Move-In Score",
  tie: { label: "more deposit back", better: "high" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: () => "movein",
  timer: { timed: "Timed tours. Other applicants arrive by the clock.", none: "No clock. Other applicants arrive after a set number of looks." },
  settings: () => [],
  mistakes: ["Picking the school that costs more to attend: $50.", "Each damage you didn't photograph and got charged for: its amount.", "A roommate's unpaid half: added as debt.", "A lease gotcha you signed that triggers: its cost.", "Each one is capped at $500 in this game."],
  beats: ["Sort each line of the aid letter: free money, money you earn, or money you pay back.", "Inspect spots to find problems. Each look takes time. Another applicant is coming.", "Photograph damage at move-in so you don't pay for it later."],
  why: { weak: "It looked nice.", okay: "It was cheaper.", strong: "I compared net cost without the loans, checked the locks and the sink first, and the move-in total fit my savings." },
  revealTitle: "Your move-out deposit sheet",
  unlock: 6,
};

export const MI_BONUS = [
  { id: "m1", type: "number", q: "Rent $900, deposit $900, application fee $50, first month due at signing. How much to move in?", answer: 1850, why: "$900 + $900 + $50 = $1,850." },
  { id: "m2", type: "choice", q: "A grant is...", choices: ["Free money you don't pay back", "A loan with low interest", "A job on campus"], answer: 0, why: "Grants are usually based on financial need." },
  { id: "m3", type: "choice", q: "Net price means...", choices: ["Cost of attendance minus grants and scholarships", "Tuition only", "What the brochure says"], answer: 0, why: "Loans don't lower the price. They just delay it." },
  { id: "m4", type: "choice", q: "The FAFSA is...", choices: ["The free form for federal student aid", "A private loan", "A college entrance exam"], answer: 0, why: "Free Application for Federal Student Aid. File it every year you're in school." },
  { id: "m5", type: "choice", q: "A subsidized federal loan...", choices: ["Doesn't build interest while you're in school at least half time", "Never has to be repaid", "Is from a private bank"], answer: 0, why: "The government pays the interest during school for subsidized loans." },
  { id: "m6", type: "choice", q: "An unsubsidized loan...", choices: ["Builds interest from the day it's paid out", "Is free", "Only goes to parents"], answer: 0, why: "Interest starts right away, even in school." },
  { id: "m7", type: "choice", q: "Federal Work-Study is...", choices: ["A part-time job that helps pay for school", "A grant", "A loan"], answer: 0, why: "You earn it by working, often on campus." },
  { id: "m8", type: "choice", q: "A Parent PLUS loan is borrowed by...", choices: ["Your parent", "You", "The school"], answer: 0, why: "Your parent owes it, even though it pays for your school." },
  { id: "m9", type: "number", q: "Cost of attendance $26,000. Grants and scholarships $9,500. Net price?", answer: 16500, why: "$26,000 minus $9,500 is $16,500." },
  { id: "m10", type: "choice", q: "Which should you usually use first?", choices: ["Grants and scholarships", "Private loans", "Credit cards"], answer: 0, why: "Free money first, then earned money, then federal loans, then private loans last." },
  { id: "m11", type: "choice", q: "Compared to private loans, federal student loans usually have...", choices: ["Fixed rates and flexible repayment plans", "No interest", "Higher fees always"], answer: 0, why: "Federal loans offer income-driven repayment and other protections." },
  { id: "m12", type: "choice", q: "A security deposit is...", choices: ["Money the landlord holds to cover damage, returned at move-out", "The first month's rent", "A fee you never get back"], answer: 0, why: "Document damage at move-in to protect it." },
  { id: "m13", type: "choice", q: "A joint lease with a roommate means...", choices: ["Each of you can owe the full rent if the other leaves", "You only owe your half no matter what", "The landlord pays half"], answer: 0, why: "Both names on the lease means both are responsible." },
  { id: "m14", type: "choice", q: "Landlords often want your income to be about...", choices: ["3 times the rent", "Equal to the rent", "10 times the rent"], answer: 0, why: "A common rule of thumb to show you can afford it." },
  { id: "m15", type: "choice", q: "Auto-renew in a lease means...", choices: ["It renews unless you give notice in time", "It ends on its own", "Rent goes down"], answer: 0, why: "Mark the notice date on your calendar." },
  { id: "m16", type: "choice", q: "Why take photos at move-in?", choices: ["To prove damage was already there", "For social media", "The landlord requires it"], answer: 0, why: "Dated photos protect your deposit." },
  { id: "m17", type: "number", q: "Community college tuition $4,000 a year for 2 years, then a state school at $12,000 a year for 2 years. Total tuition?", answer: 32000, why: "$8,000 + $24,000 = $32,000. Four years at the state school would be $48,000." },
  { id: "m18", type: "choice", q: "A 529 plan is...", choices: ["A savings account for education with tax benefits", "A student loan", "A grant"], answer: 0, why: "Money grows tax-free when used for school costs." },
  { id: "m19", type: "choice", q: "A scholarship is...", choices: ["Free money, often for grades, talent or need", "A loan from the school", "A work program"], answer: 0, why: "Apply to many. Small ones add up." },
  { id: "m20", type: "number", q: "Rent is $850 and a roommate splits it. Your half for a 12-month lease?", answer: 5100, why: "$425 a month times 12 is $5,100." },
  { id: "m21", type: "choice", q: "Cost of attendance includes...", choices: ["Tuition, housing, food, books and travel", "Only tuition", "Only housing"], answer: 0, why: "Compare the whole cost, not just tuition." },
];

export const MI_GUIDE = {
  how: {
    goal: "Pick the school that really costs less, then rent a safe apartment and get your deposit back.",
    steps: [
      "Read both aid letters. Sort each line: [[grant]]s and scholarships are free money, work-study you earn, [[student loan]]s you pay back.",
      "Compare the [[net price]]: cost of attendance minus free money. Loans don't make a school cheaper. Then pick a school.",
      "Work out the move-in total: first month's rent, the [[security deposit]] and the application fee.",
      "Tour two apartments. Inspect spots to find problems, but each look takes time, and another applicant is coming. Apply (A) or go to the Next unit (N).",
      "Pick solo or a roommate. A [[joint lease]] means you can owe the full rent if they leave.",
      "Read the [[lease]]. Flag (F) a bad clause. Then photograph damage at move-in so it isn't taken from your deposit.",
    ],
    example: "A $30,000 aid package sounds great. But if $22,000 of it is a Parent PLUS loan, the family still pays it back, with interest.",
  },
  vocab: [
    { term: "grant", def: "Money for school you don't pay back, usually based on need.", example: "Her Pell Grant covered most of her tuition." },
    { term: "student loan", def: "Money for school you must pay back with interest.", example: "His student loan built interest while he was in school." },
    { term: "net price", def: "The cost of attendance minus grants and scholarships.", example: "The net price was lower at the state school." },
    { term: "security deposit", def: "Money a landlord holds to cover damage, returned at move-out.", example: "She got her whole security deposit back." },
    { term: "lease", def: "A contract to rent a place for a set time.", example: "He read the whole lease before signing." },
    { term: "joint lease", def: "One lease with two or more tenants who are all responsible for the rent.", example: "On a joint lease, he owed the full rent when his roommate left." },
    { term: "tenant", def: "A person who rents a home from someone else.", example: "As the tenant, she paid rent on the first of the month." },
    { term: "landlord", def: "The person or company that owns a place you rent.", example: "The landlord fixed the leak in two days." },
    { term: "rent", def: "The money you pay each month to live in a place.", example: "Rent was $850, about a third of his pay." },
    { term: "utilities", def: "Services like electricity, water and internet.", example: "The utilities added $120 to the monthly cost." },
  ],
  irl: {
    checked: "2026-10-26",
    intro: "What college really costs.",
    facts: [
      { stat: "In 2025-26, average published tuition and fees were $4,150 at public two-year colleges, $11,950 at in-state public four-year colleges and $45,000 at private nonprofit four-year colleges.", source: "College Board, Trends in College Pricing and Student Aid 2025", year: 2025, url: "https://newsroom.collegeboard.org/trends-college-pricing-and-student-aid-report-published-tuition-prices-public-institutions-and" },
      { stat: "After grant aid, the average in-state student at a public four-year college paid about $2,300 in tuition and fees in 2025-26. The sticker price isn't the real price.", source: "College Board, Trends in College Pricing and Student Aid 2025", year: 2025, url: "https://newsroom.collegeboard.org/trends-college-pricing-and-student-aid-report-published-tuition-prices-public-institutions-and" },
      { stat: "Students and parents borrowed $102.6 billion for college in 2024-25, the first yearly increase in 14 years.", source: "College Board, Trends in College Pricing and Student Aid 2025", year: 2025, url: "https://newsroom.collegeboard.org/trends-college-pricing-and-student-aid-report-published-tuition-prices-public-institutions-and" },
    ],
  },
};
