// Phish Tank (GAME-SPECS.md game 5): scams and real messages pile up on your
// phone. Trust, Block or Verify. Plain words, no em-dashes, no semicolons.
// Real company names (teacher request 2026-10-26), so the only odd thing about
// a scam is the scam itself: the look-alike link, the rush, the strange sender.
// The game never uses real logos. In text, {{type|words}} marks a red flag the student can
// tap after a correct Block. Types: link, urgency, giftcard, typo, sender, code, money.
// {a} is filled from the template's options, so each template makes several messages.
// Inside a link, {a} becomes a web-style slug: Bank of America -> bankofamerica.

export const PHISH_FLAG_LABEL = {
  link: "Look-alike link",
  urgency: "Rush and pressure",
  giftcard: "Gift card request",
  typo: "Typo or odd spelling",
  sender: "Unknown sender",
  code: "Asks for a code",
  money: "Asks for money first",
};

// loss: dollars lost if the wrong call is made (Trust a scam, Block a real one).
// credential: trusting it hands over your account (account takeover).
export const PHISH_TEMPLATES = [
  // ---- Scams ----
  { id: "dlv", scam: true, kind: "Fake delivery", sender: "{{sender|+1 (555) 013-8821}}", a: ["UPS", "FedEx", "Amazon"], text: "{a}: your package is on hold. Pay a $1.99 fee at {{link|{a}-redeliver.co}} {{urgency|within 1 hour}}.", loss: 25, truth: "The official {a} app shows no fee and no held package." },
  { id: "dlv2", scam: true, kind: "Fake delivery", sender: "{{sender|Unknown}}", a: ["UPS", "FedEx"], text: "Your {a} parcel could not be {{typo|deliverd}}. Update your address at {{link|{a}-track-help.info}}.", loss: 25, truth: "The {a} app shows nothing pending." },
  { id: "bank", scam: true, kind: "Fake bank alert", sender: "{{sender|+1 (555) 019-4402}}", a: ["Chase", "Bank of America"], text: "{a} ALERT: your account is locked. {{urgency|Act now}} or lose access. Log in at {{link|secure-{a}.co}}.", loss: 300, credential: true, truth: "Your {a} app shows your account is fine. Banks never text you a login link." },
  { id: "bank2", scam: true, kind: "Fake bank alert", sender: "{{sender|5551 ALRT}}", a: ["Chase", "Bank of America"], text: "Did you spend $842 at Best Buy? Reply NO and we'll call you to {{code|confirm your code}}.", loss: 300, credential: true, truth: "Your {a} app shows no Best Buy charge. A real bank won't ask for your code." },
  { id: "venmo", scam: true, kind: "Payment app request", sender: "{{sender|Ashlee W.}}", a: ["Venmo", "Cash App"], text: "Oops! I sent you $200 on {a} by mistake. {{money|Can you send it back}} {{urgency|right now}}? It's my rent!", loss: 200, truth: "Your {a} app shows no $200 came in. That's a refund scam." },
  { id: "venmo2", scam: true, kind: "Payment app request", sender: "{{sender|{a} Support}}", a: ["Venmo", "Cash App"], text: "You won a $500 {a} reward! {{money|Send a $5 fee}} to unlock it at {{link|{a}-rewards.net}}.", loss: 50, truth: "The real {a} app has no reward for you." },
  { id: "job", scam: true, kind: "Fake job offer", sender: "{{sender|HR Dept}}", a: ["Amazon", "Target", "Walmart"], text: "{a} is hiring! $45 an hour from home, no interview. Text back your Social Security number to start {{urgency|today}}.", loss: 150, credential: true, truth: "The real {a} careers site says it never hires by text." },
  { id: "job2", scam: true, kind: "Fake job offer", sender: "{{sender|Recruiter Jen}}", a: ["DoorDash", "Grubhub"], text: "Be a {a} secret shopper! We mail you a check, you buy {{giftcard|gift cards}} and keep $300.", loss: 400, truth: "{a}'s official app has no secret shopper job. Fake checks bounce days later." },
  { id: "prize", scam: true, kind: "Prize", sender: "{{sender|+1 (555) 017-0099}}", a: ["Target", "Netflix", "Walmart"], text: "Congrats! You won a $1,000 {a} gift card. Claim it at {{link|{a}-winners.club}} {{urgency|in 10 minutes}}.", loss: 40, truth: "{a} has no giveaway. You didn't enter anything." },
  { id: "prize2", scam: true, kind: "Prize", sender: "{{sender|Prize Center}}", a: ["Foot Locker", "GameStop"], text: "Your phone number was picked for a free {a} shopping spree! {{money|Pay $9.99 shipping}} to claim.", loss: 40, truth: "{a} says it never sends prizes by text." },
  { id: "friend", scam: true, kind: "Friend in trouble", sender: "{{sender|Unknown number}}", a: ["Mom", "Grandma", "Coach"], text: "It's me, I lost my phone. I'm stuck and need $150 in {{giftcard|gift cards}}. {{urgency|Please hurry}}, don't tell {a}.", loss: 150, truth: "You called your friend's real number. They're fine and never texted." },
  { id: "friend2", scam: true, kind: "Friend in trouble", sender: "{{sender|New number}}", a: ["Jordan", "Riley", "Sam"], text: "Hey it's {a}, new number. Can you {{money|Venmo me $80}}? I'll pay you back tmrw, {{urgency|really need it now}}.", loss: 80, truth: "You called {a}'s saved number. They didn't change numbers." },
  { id: "verify", scam: true, kind: "Account verification", sender: "{{sender|Security Team}}", a: ["Netflix", "Spotify", "Instagram"], text: "Your {a} account will be deleted. Verify your password at {{link|{a}-verify-login.co}} {{urgency|today}}.", loss: 60, credential: true, truth: "Your {a} app shows your account is fine." },
  { id: "verify2", scam: true, kind: "Account verification", sender: "{{sender|{a} Support}}", a: ["Instagram", "TikTok"], text: "Unusual login on your {a}. {{typo|Confirm youre}} identity at {{link|{a}-safe.help}}.", loss: 60, credential: true, truth: "The {a} app shows no strange logins." },
  { id: "code", scam: true, kind: "Code request", sender: "{{sender|Unknown}}", a: ["Venmo", "Instagram", "Chase"], text: "We sent you a {a} code by mistake. {{code|Can you read it back to us}}? Thanks!", loss: 0, credential: true, truth: "No one real ever needs your login code. It was someone trying to get into your account." },
  { id: "toll", scam: true, kind: "Fake toll bill", sender: "{{sender|+1 (555) 012-7710}}", a: ["E-ZPass", "SunPass", "Peach Pass"], text: "{a}: you owe $4.15 in unpaid tolls. Pay at {{link|{a}-tolls.co}} {{urgency|to avoid a $50 fine}}.", loss: 30, credential: true, truth: "The real toll website shows you owe nothing." },
  { id: "loan", scam: true, kind: "Loan offer", sender: "{{sender|QuickCash}}", a: ["$500", "$750", "$1,000"], text: "You're approved for a {a} loan! No credit check. {{money|Pay a $49 processing fee}} first.", loss: 49, truth: "Real lenders don't charge a fee before you get the money." },
  { id: "crypto", scam: true, kind: "Get rich quick", sender: "{{sender|Coin Coach}}", a: ["Hype coin", "MoonToken", "Dogecoin"], text: "I turned $100 into $9,000 with {a}! {{money|Send me $100}} and I'll invest it for you. {{urgency|Spots fill fast}}.", loss: 100, truth: "No one can promise that return. It's a scam." },
  // ---- Real messages ----
  { id: "appt", scam: false, kind: "Appointment reminder", sender: "{a}", a: ["Gaspen Dental", "Dr. Fernsby's Office", "Supercuts"], text: "Reminder: your appointment is tomorrow at 3:30. Reply C to confirm. Call the number on our website to change it.", loss: 50, truth: "Your {a} portal shows the same appointment." },
  { id: "appt2", scam: false, kind: "Appointment reminder", sender: "{a}", a: ["Coinhaven Clinic", "Bright Smile Dental"], text: "Your visit is today at 10:00 AM. Please arrive 10 minutes early.", loss: 50, truth: "The official {a} app shows this visit." },
  { id: "fraud", scam: false, kind: "Real fraud alert", sender: "{a}", a: ["Chase", "Bank of America"], text: "{a}: did you use your card for $64.20 at Trader Joe's? Reply YES or NO. We will never ask for your PIN.", loss: 300, urgent: true, truth: "Your {a} app shows the same alert. It's real." },
  { id: "fraud2", scam: false, kind: "Real fraud alert", sender: "{a}", a: ["Chase", "Bank of America"], text: "{a}: we blocked a $300 charge. If it wasn't you, no action needed. Questions? Call the number on your card.", loss: 300, urgent: true, truth: "Your {a} app shows the blocked charge. It's real." },
  { id: "school", scam: false, kind: "School notice", sender: "{a}", a: ["Coinhaven High", "Greer Middle College"], text: "{a}: early dismissal today at 12:30 due to weather. Buses run on the early schedule.", loss: 20, urgent: true, truth: "The school website posts the same notice." },
  { id: "club", scam: false, kind: "Club notice", sender: "{a}", a: ["Robotics Club", "Hilltop Soccer Club", "Drama Club"], text: "{a}: practice moved to Thursday at 4. Bring your permission slip.", loss: 20, truth: "The club's page says the same." },
  { id: "pkg", scam: false, kind: "Real delivery update", sender: "{a}", a: ["UPS", "FedEx", "Amazon"], text: "{a}: your package was delivered to your front door at 2:14 PM. Track it in the {a} app.", loss: 15, truth: "The official {a} app shows the delivery." },
  { id: "pkg2", scam: false, kind: "Real delivery update", sender: "{a}", a: ["UPS", "FedEx"], text: "{a}: your package arrives tomorrow between 1 and 5 PM. No action needed.", loss: 15, truth: "The {a} app shows the same window." },
  { id: "work", scam: false, kind: "Work schedule", sender: "{a}", a: ["Foot Locker", "Chick-fil-A", "Barnes & Noble"], text: "{a} schedule: you're on Saturday 9 to 3. Need to swap? Use the scheduling app.", loss: 60, urgent: true, truth: "Your {a} scheduling app shows the same shift." },
  { id: "pay", scam: false, kind: "Payday notice", sender: "{a}", a: ["Foot Locker Payroll", "Chick-fil-A Payroll", "Barnes & Noble Payroll"], text: "{a}: your direct deposit of $212.40 is scheduled for Friday.", loss: 20, truth: "Your bank app shows the pending deposit." },
  { id: "mom", scam: false, kind: "Family", sender: "{a}", a: ["Mom", "Dad", "Grandma"], text: "Can you grab milk on the way home? Thanks! Love you.", loss: 10, truth: "That's really {a}, from their saved number." },
  { id: "bill", scam: false, kind: "Bill reminder", sender: "{a}", a: ["Verizon", "Duke Energy", "Xfinity"], text: "{a}: your bill of $48.17 is due on the 15th. Pay in the {a} app or on our website.", loss: 25, truth: "The official {a} app shows the same bill." },
];

// The romance scam that builds across 3 messages, and a real friend's hacked number.
export const PHISH_CHAIN = [
  { id: "rom1", scam: true, kind: "Romance scam", sender: "{{sender|Alex (unknown)}}", text: "Hi! Sorry, {{sender|wrong number}}. You seem really nice though. Where are you from?", loss: 0, truth: "You don't know this person. Wrong-number chats are a classic opener." },
  { id: "rom2", scam: true, kind: "Romance scam", sender: "{{sender|Alex (unknown)}}", text: "I feel like we {{urgency|really connect already}}. I'm {{sender|overseas for work}}, but I'd love to visit you soon.", loss: 0, truth: "Still a stranger, now building trust fast." },
  { id: "rom3", scam: true, kind: "Romance scam", sender: "{{sender|Alex (unknown)}}", text: "I'm stuck at the airport. Can you send $300 in {{giftcard|gift cards}} so I can fly to you? {{urgency|Please, tonight}}.", loss: 300, truth: "There's no trip. Gift card requests from someone you've never met are always a scam." },
];
export const PHISH_HACKED = { id: "hacked", scam: true, kind: "Hacked friend", sender: "Maya (saved contact)", text: "hey!! i need a favor, can you {{code|send me the code}} that just came to your phone? {{urgency|quick}}", loss: 0, credential: true, truth: "You called Maya. Her account was hacked. Never share a code, even with a friend." };

// After an account takeover: friends reply to scams sent "from you". The right call is Trust (reply to warn them).
export const PHISH_FALLOUT = [
  { id: "fall1", scam: false, kind: "Confused friend", sender: "Maya", text: "why did you send me a weird link to win free sneakers??", loss: 10, truth: "Maya is real. Your account sent her the scam." },
  { id: "fall2", scam: false, kind: "Confused friend", sender: "Jordan", text: "did you really just ask me for $50 in gift cards? are you ok", loss: 10, truth: "Jordan is real. Tell them your account was hacked." },
];

export const PHISH_SAMPLE = { text: "Chase: your card is frozen. Unlock it now at chase-secure-login.co", flag: "chase-secure-login.co", why: "That link isn't Chase's real website. Look-alike links are the number one tell." };

export const PHISH_META = {
  title: "Phish Tank",
  pitch: "Your phone is blowing up. Some messages are scams, some are real. Trust, Block or Verify before they pile up.",
  skill: "consumer smarts",
  standards: ["A6", "C6", "C8"],
  metric: "Safety Score",
  tie: { label: "more red flags found", better: "high" },
  rankedHint: "only Timed shifts are ranked",
  ranked: (s) => s.timer === "timed",
  board: () => "phish",
  timer: { timed: "2:30 of messages that expire.", none: "The next message comes after each decision." },
  settings: () => [],
  mistakes: ["Trusting a scam: what it steals.", "Blocking a real message: what you miss.", "An account takeover: an extra $20."],
  beats: ["Trust it, Block it or Verify it.", "Verify takes time, but it's always safe if you use the official app.", "Ignored messages expire. Missing a real one costs you too."],
  why: { weak: "It looked real.", okay: "The link looked weird.", strong: "I opened the official app instead of the link, so I knew for sure." },
  revealTitle: "Scams you caught, scams that caught you",
  unlock: 1,
};

export const PHISH_BONUS = [
  { id: "f1", type: "choice", q: "Phishing means...", choices: ["Tricking you into giving up info or money", "A fishing trip", "A phone upgrade"], answer: 0, why: "Scammers fish for your passwords, codes and money." },
  { id: "f2", type: "choice", q: "Smishing is phishing by...", choices: ["Text message", "Email", "Mail"], answer: 0, why: "SMS plus phishing. Texts are a favorite tool." },
  { id: "f3", type: "choice", q: "Which link is most likely fake?", choices: ["chase-secure-login.co", "The link inside your bank's official app", "Typing your bank's address yourself"], answer: 0, why: "Extra words and odd endings like .co are look-alike tricks." },
  { id: "f4", type: "choice", q: "Someone asks for the code that was just texted to you. You should...", choices: ["Never share it", "Share it if they sound nice", "Share half"], answer: 0, why: "That code unlocks your account. No real company asks for it." },
  { id: "f5", type: "choice", q: "Who asks to be paid in gift cards?", choices: ["Scammers", "Real banks", "Your school"], answer: 0, why: "Gift cards are fast, hard to trace and can't be refunded. Real businesses don't ask for them." },
  { id: "f6", type: "choice", q: "Two-step login means...", choices: ["A second check, like a code, after your password", "Two passwords", "Logging in twice a day"], answer: 0, why: "Even if a scammer steals your password, they still need the second step." },
  { id: "f7", type: "choice", q: "The safest way to verify a message from your bank is to...", choices: ["Open the bank's official app yourself", "Call the number in the text", "Click the link"], answer: 0, why: "Go to the source on your own, not through the message." },
  { id: "f8", type: "choice", q: "An urgent message is...", choices: ["Not automatically a scam, but a reason to slow down", "Always a scam", "Always real"], answer: 0, why: "Real alerts can be urgent too. Urgency is a pressure trick scammers love." },
  { id: "f9", type: "choice", q: "Account takeover means...", choices: ["Someone gets into your account and acts as you", "You change banks", "Your account grows"], answer: 0, why: "Then they message your friends as you." },
  { id: "f10", type: "choice", q: "A friend's number texts asking for money in a weird way. Best move?", choices: ["Call them on their saved number", "Send it fast", "Reply with your password"], answer: 0, why: "Their account may be hacked. A quick call checks." },
  { id: "f11", type: "choice", q: "You trusted a scam link and typed your password. First thing to do?", choices: ["Change that password and turn on two-step login", "Wait and see", "Delete the app"], answer: 0, why: "Lock the door before they walk through it." },
  { id: "f12", type: "choice", q: "A job that pays $45 an hour from home and needs no interview is...", choices: ["Probably a scam", "A great find", "Normal"], answer: 0, why: "Too good to be true usually is." },
  { id: "f13", type: "choice", q: "A text says you owe $4 in tolls. You don't drive. What is it?", choices: ["A toll scam", "A real bill", "A coupon"], answer: 0, why: "Fake toll notices were one of the most common text scams the FTC flagged." },
  { id: "f14", type: "choice", q: "Someone 'accidentally' sends you $200 and asks for it back. The money may...", choices: ["Disappear later, leaving you out $200", "Stay forever", "Earn interest"], answer: 0, why: "They often use stolen cards. When it reverses, your $200 is gone." },
  { id: "f15", type: "choice", q: "A red flag is...", choices: ["A warning sign that something's off", "A sale tag", "A bank logo"], answer: 0, why: "Look-alike links, typos, rush and gift cards are all red flags." },
  { id: "f16", type: "choice", q: "Verifying through the link in the message is...", choices: ["Not verifying at all", "The safest way", "Required"], answer: 0, why: "The link goes wherever the scammer wants." },
  { id: "f17", type: "choice", q: "Blocking a real fraud alert from your bank could...", choices: ["Let a fraudulent charge go through", "Protect you", "Lower your bill"], answer: 0, why: "That's why blocking everything doesn't work either." },
  { id: "f18", type: "choice", q: "Where should you report a scam text?", choices: ["Forward it to 7726 (SPAM) and report it to the FTC", "Reply STOP to the scammer", "Post it online"], answer: 0, why: "Carriers use 7726 reports to block scammers, and the FTC tracks fraud." },
  { id: "f19", type: "choice", q: "A romance scam usually ends with...", choices: ["A request for money", "A real visit", "A gift for you"], answer: 0, why: "They build trust first, then need money for an emergency." },
  { id: "f20", type: "number", q: "You lose $25, $150 and $40 to three scams. How much in total?", answer: 215, why: "$25 plus $150 plus $40 is $215." },
  { id: "f21", type: "choice", q: "Strong passwords are...", choices: ["Long and different for every account", "Your pet's name", "The same everywhere"], answer: 0, why: "One leaked password shouldn't open every door." },
];

export const PHISH_GUIDE = {
  how: {
    goal: "Make the right call on every message before it expires, and find the red flags in the scams you block.",
    steps: [
      "Messages arrive in a queue. Up and Down pick one. Each one expires in 20 seconds in timed mode.",
      "Trust (T) a real message. Block (B) a scam. Not sure? Verify (V).",
      "Verify takes 5 seconds. Open the official app (2) to learn the truth for sure. Calling the number in the message (1) is risky, because a scammer picks up.",
      "After a right Block, tap the [[red flag]] parts for bonus points: a [[look-alike link]], rush, gift cards, typos.",
      "Trusting a scam that asks for your password or a code means [[account takeover]]. Lock it down fast with [[two-step login]].",
      "Some real messages are urgent too. Urgency alone isn't the tell. That's what makes [[phishing]] and [[smishing]] hard.",
    ],
    example: "A text from an unknown number says your Chase account is locked, act now, log in at secure-chase.co. Block it. The red flags are the unknown sender, the rush and the look-alike link.",
  },
  vocab: [
    { term: "phishing", def: "Tricking people into giving up passwords, codes or money.", example: "The fake bank email was phishing for her password." },
    { term: "smishing", def: "Phishing by text message.", example: "A text about a fake toll bill is smishing." },
    { term: "red flag", def: "A warning sign that a message may be a scam.", example: "Asking for gift cards is a huge red flag." },
    { term: "two-step login", def: "A second check, like a code, after your password.", example: "Two-step login stopped the hacker even with her password." },
    { term: "account takeover", def: "When a scammer gets into your account and acts as you.", example: "After the account takeover, his friends got scam links from him." },
    { term: "look-alike link", def: "A web address made to look like a real company's, but isn't.", example: "venmo-secure.co is a look-alike link." },
  ],
  irl: {
    checked: "2026-10-25",
    intro: "Scam texts and posts are real money for real people.",
    facts: [
      { stat: "In 2024, people reported losing $470 million to scams that started with a text, more than five times what was reported in 2020.", source: "Federal Trade Commission", year: 2025, url: "https://www.ftc.gov/business-guidance/blog/2025/04/new-ftc-data-spotlight-highlights-text-scams-may-target-your-business" },
      { stat: "Some of the most common scam texts were fake fraud alerts, fake unpaid toll notices and phony job offers.", source: "Federal Trade Commission", year: 2025, url: "https://www.ftc.gov/business-guidance/blog/2025/04/new-ftc-data-spotlight-highlights-text-scams-may-target-your-business" },
      { stat: "Nearly 30 percent of people who reported losing money to a scam in 2025 said it started on social media, with $2.1 billion in reported losses.", source: "Federal Trade Commission", year: 2026, url: "https://www.ftc.gov/news-events/news/press-releases/2026/04/new-ftc-data-show-people-have-lost-billions-social-media-scams" },
    ],
  },
};
