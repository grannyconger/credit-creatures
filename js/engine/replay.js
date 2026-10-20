// Rebuilds a life from how it began plus its action log. Bug reports and the
// Phase 8 tuning replay depend on this giving back the exact same life.
import { createLife } from "./life.js";
import * as accounts from "./accounts.js";
import { applyForCard } from "./approval.js";
import { endMonth } from "./month.js";
import { getTeenDebitCard } from "./onboarding.js";

const ACTIONS = {
  earn: accounts.earn,
  addBill: accounts.addBill,
  removeBill: accounts.removeBill,
  moveToSavings: accounts.moveToSavings,
  moveToChecking: accounts.moveToChecking,
  debitPurchase: accounts.debitPurchase,
  cardPurchase: accounts.cardPurchase,
  pay: accounts.pay,
  setAutopay: accounts.setAutopay,
  closeAccount: accounts.closeAccount,
  upgradeSecured: accounts.upgradeSecured,
  joinAsAuthorizedUser: accounts.joinAsAuthorizedUser,
  removeAuthorizedUser: accounts.removeAuthorizedUser,
  openCreditBuilderLoan: accounts.openCreditBuilderLoan,
  openAutoLoan: accounts.openAutoLoan,
  openFederalStudentLoan: accounts.openFederalStudentLoan,
  startSchool: accounts.startSchool,
  leaveSchool: accounts.leaveSchool,
  cosign: accounts.cosign,
  buyWithBnpl: accounts.buyWithBnpl,
  applyForCard,
  endMonth,
  getTeenDebitCard,
};

// upTo: replay only the first n log entries (to look at the life mid-game).
export function replayLife(start, log, upTo = log.length) {
  let life = createLife(start);
  for (const entry of log.slice(0, upTo)) {
    const fn = ACTIONS[entry.action];
    if (!fn) throw new Error(`Replay does not know the action "${entry.action}".`);
    life = fn(life, ...entry.args).life;
  }
  return life;
}
