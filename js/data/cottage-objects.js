// The things in the Cottage room a student can click (docs/UI-REBUILD.md).
// x, y, w, h are percents of the room. Each one goes to a place or opens
// something, and its glow and name tag show on hover and keyboard focus.
// place: a PLACES id (js/places.js), so locked places and badges come for free.
// act: "wallet" opens the wallet, "things" opens Things To Do.
// route: a screen to open (the closet opens the Wardrobe).
export const ROOM_OBJECTS = [
  { id: "window", label: "Window to the map", hint: "See the whole kingdom", art: "window", route: "map", x: 8, y: 8, w: 20, h: 30 },
  { id: "poster", label: "Dream poster", hint: "Your creature's dream", art: "poster", place: "cottage", route: "cottage", x: 36, y: 8, w: 12, h: 24 },
  { id: "shelf", label: "Trophy shelf", hint: "Ranks and achievements", art: "shelf", place: "academy", route: "trophies", x: 52, y: 5, w: 16, h: 22 },
  { id: "mailbox", label: "Mailbox", hint: "Letters from the bank", art: "mailbox", place: "vault", tab: "messages", x: 62, y: 26, w: 7, h: 13 },
  { id: "door", label: "Front door", hint: "Things To Do", art: "door", act: "things", x: 70, y: 8, w: 13, h: 55 },
  // The closet, far right (teacher request 2026-10-27).
  { id: "closet", label: "Closet", hint: "Change your creature's look", art: "closet", route: "creature", x: 85, y: 6, w: 13, h: 60 },
  { id: "arcade", label: "Arcade cabinet", hint: "Work a shift for coins", art: "arcade", place: "guild", x: 3, y: 44, w: 12, h: 36 },
  { id: "desk", label: "Study desk", hint: "Lessons and practice", art: "desk", place: "academy", x: 17, y: 52, w: 20, h: 28 },
  { id: "jar", label: "Coin jar", hint: "Open your wallet", art: "jar", act: "wallet", x: 21, y: 44, w: 6, h: 10 },
  { id: "chest", label: "Daily Pick chest", hint: "Free prizes, new every day", art: "chest", status: "daily", route: "daily", x: 45, y: 76, w: 12, h: 16 },
  { id: "bills", label: "Bills table", hint: "Pay bills and move money", art: "bills", place: "vault", tab: "paybills", x: 64, y: 62, w: 16, h: 22 },
];

// Where the creature stands (percent of the room).
export const CREATURE_SPOT = { x: 40, y: 38, w: 22 };
