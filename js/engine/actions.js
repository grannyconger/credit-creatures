// Every logged engine action by name. Replay and the Decision card runner
// both call actions through this map, so a card can only do what replay can redo.
import * as accounts from "./accounts.js";
import { applyForCard } from "./approval.js";
import { endMonth } from "./month.js";
import { getTeenDebitCard } from "./onboarding.js";
import { arcadeCharge, freshStart } from "./arcade.js";

export const ACTIONS = {
  earn: accounts.earn,
  receiveCash: accounts.receiveCash,
  addBill: accounts.addBill,
  removeBill: accounts.removeBill,
  recordInquiry: accounts.recordInquiry,
  moveToSavings: accounts.moveToSavings,
  moveToChecking: accounts.moveToChecking,
  debitPurchase: accounts.debitPurchase,
  cardPurchase: accounts.cardPurchase,
  pay: accounts.pay,
  setAutopay: accounts.setAutopay,
  closeAccount: accounts.closeAccount,
  upgradeSecured: accounts.upgradeSecured,
  raiseLimit: accounts.raiseLimit,
  joinAsAuthorizedUser: accounts.joinAsAuthorizedUser,
  removeAuthorizedUser: accounts.removeAuthorizedUser,
  openCreditBuilderLoan: accounts.openCreditBuilderLoan,
  openAutoLoan: accounts.openAutoLoan,
  openPurchaseLoan: accounts.openPurchaseLoan,
  openFederalStudentLoan: accounts.openFederalStudentLoan,
  openPrivateStudentLoan: accounts.openPrivateStudentLoan,
  startSchool: accounts.startSchool,
  leaveSchool: accounts.leaveSchool,
  cosign: accounts.cosign,
  buyWithBnpl: accounts.buyWithBnpl,
  addCollection: accounts.addCollection,
  applyForCard,
  endMonth,
  getTeenDebitCard,
  arcadeCharge,
  freshStart,
};
