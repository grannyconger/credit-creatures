// Card applications for Design Your Card (SPEC §7).
// quoteApplication is pure and drives the live tradeoff display.
// applyForCard adds a hard inquiry and rolls the seeded dice.
import { CONFIG } from "../data/config.js";
import { PRODUCTS, ISSUERS, NETWORKS, DESIGNS, findOffer } from "../data/products.js";
import { copyLife, logAction, monthlyIncome } from "./life.js";
import { rngOn } from "./rng.js";
import { addInquiry, amountOwed, openCard } from "./accounts.js";
import { buildReport } from "./report.js";
import { clamp, dollars } from "./util.js";

const A = CONFIG.approval;

function riskLabel(odds) {
  if (odds >= A.lowRiskOdds) return "Low";
  if (odds >= A.mediumRiskOdds) return "Medium";
  if (odds >= A.highRiskOdds) return "High";
  return "Very high";
}

// app = { issuer, product, requestedLimit, design, nickname }
// For a secured card, requestedLimit is the deposit.
export function quoteApplication(life, app) {
  const offer = findOffer(app.issuer, app.product);
  const p = PRODUCTS[app.product];
  if (!offer || !p) return { valid: false, reasons: ["That issuer does not offer this card."] };
  const design = DESIGNS[app.design] || DESIGNS.plasticBlue;

  const limit = Math.round(clamp(app.requestedLimit ?? p.minLimit, p.minLimit, p.maxLimit));
  const t = p.maxLimit > p.minLimit ? (limit - p.minLimit) / (p.maxLimit - p.minLimit) : 0;

  const apr = Math.round((p.apr + t * p.aprSpread) * 10000) / 10000;
  const annualFee = Math.round(p.annualFee + t * p.feeSpread + design.feeBump);
  const requiredIncome = Math.round(p.requiredIncome + t * p.incomeSpread + design.incomeBump);
  const requiredScore = p.requiredScore == null ? (design.scoreBump ? 600 + design.scoreBump : null) : Math.round(p.requiredScore + t * p.scoreSpread + design.scoreBump);

  const score = life.score;
  const income = monthlyIncome(life);
  const report = buildReport(life);
  const historyMonths = report.reportedMonths;
  const debt = life.accounts.filter((a) => a.owner === "self").reduce((s, a) => s + amountOwed(a), 0);
  const recentInquiries = report.inquiries.filter((q) => q.counts).length;
  const openCollections = report.collections.filter((c) => !c.paid).length;

  const reasons = [];
  let odds = score == null ? p.noScoreOdds : p.baseOdds;

  if (p.secured) {
    reasons.push(`Your ${dollars(limit)} deposit backs this card, so approval is easy.`);
    if (life.checking < limit) {
      odds = 0;
      reasons.push(`You need ${dollars(limit)} in checking for the deposit. You have ${dollars(life.checking)}.`);
    }
  }

  if (score == null) {
    if (p.noScoreOdds === 0) reasons.push("You don't have a credit score yet. This card needs a long, strong history.");
    else if (!p.secured) reasons.push("You don't have a credit score yet. This card is made for beginners.");
    if (requiredScore != null && p.noScoreOdds > 0) {
      odds *= 0.6;
      reasons.push(`The ${design.label.toLowerCase()} design looks for a score of ${requiredScore}. Without a score, approval is harder.`);
    }
  } else if (requiredScore != null && score < requiredScore) {
    odds *= Math.max(0.05, 1 - (requiredScore - score) / 100);
    reasons.push(`Your score of ${score} is below the ${requiredScore} this card looks for.`);
  } else if (requiredScore != null) {
    reasons.push(`Your score of ${score} meets the ${requiredScore} this card looks for.`);
  }

  if (p.minHistoryMonths && historyMonths < p.minHistoryMonths) {
    odds = Math.min(odds, score == null ? 0 : 0.05);
    reasons.push(`You have ${historyMonths} months of history. This card wants at least ${p.minHistoryMonths}.`);
  }

  if (requiredIncome > 0) {
    if (income < requiredIncome) {
      odds *= Math.pow(income / requiredIncome, 2);
      reasons.push(`You earn about ${dollars(income)} a month. This card wants ${dollars(requiredIncome)}.`);
    } else {
      reasons.push(`Your income of about ${dollars(income)} a month is enough.`);
    }
  }

  if (debt > 0 && debt > A.debtToIncomeLimit * Math.max(income, 1)) {
    odds *= A.debtPenalty;
    reasons.push(`You already owe ${dollars(debt)}, which is a lot compared to your income.`);
  }
  if (recentInquiries >= A.inquiryPenaltyFrom) {
    odds *= A.inquiryPenalty;
    reasons.push(`You applied for credit ${recentInquiries} times in the last year. Lenders see that as risky.`);
  }
  if (openCollections > 0) {
    odds *= A.collectionsPenalty;
    reasons.push("You have an account in collections.");
  }

  odds = odds <= 0 ? 0 : clamp(odds, A.minOdds, A.maxOdds);
  return {
    valid: true,
    name: offer.name,
    issuer: app.issuer,
    issuerName: ISSUERS[app.issuer].name,
    network: offer.network,
    networkName: NETWORKS[offer.network].name,
    icon: offer.icon || ISSUERS[app.issuer].icon,
    product: app.product,
    secured: Boolean(p.secured),
    design: app.design || "plasticBlue",
    nickname: app.nickname || "",
    limit,
    apr,
    annualFee,
    requiredIncome,
    requiredScore,
    odds: Math.round(odds * 1000) / 1000,
    risk: riskLabel(odds),
    reasons,
  };
}

export function applyForCard(life, app) {
  const quote = quoteApplication(life, app);
  if (!quote.valid) return { life, ok: false, approved: false, quote, reasons: quote.reasons };
  const next = copyLife(life);
  addInquiry(next, quote.name);
  const approved = rngOn(next).next() < quote.odds;
  let accountId = null;
  if (approved) {
    accountId = openCard(next, quote).id;
  }
  logAction(next, "apply", { product: quote.name, approved, limit: quote.limit });
  const terms = { limit: quote.limit, apr: quote.apr, annualFee: quote.annualFee };
  const headline = approved
    ? `Approved! ${quote.name}: ${dollars(quote.limit)} limit, ${(quote.apr * 100).toFixed(1)}% APR, ${dollars(quote.annualFee)} annual fee.`
    : `Denied. ${quote.name} said no this time.`;
  return {
    life: next,
    ok: true,
    approved,
    accountId,
    terms,
    quote,
    reasons: quote.reasons,
    message: headline + " This application added a hard inquiry to your report.",
  };
}

