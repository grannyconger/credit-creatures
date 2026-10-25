// Hints for the cards that ask students to work something out (teacher request
// 2026-10-25). A card with a hint gets a Hint button (the pop-up opens on hover or
// keyboard focus) and, when calc is true, a calculator it can toggle on. A hint
// says how to find the answer and how to use the calculator. It never gives the
// answer itself, and tests/cards-ask.test.js checks the quiz cards for that.
// Static words only, because the numbers on a card change from student to student.
// Plain language for a 15-year-old. No em-dashes, no semicolons.
export const HINTS = {
  budgetSplit: {
    calc: true,
    steps: ["The plan gives each part of your money a percent. Find the one for savings.", "To find a percent of an amount, turn the percent into a decimal (20% is 0.20), then multiply it by the amount."],
    calcTip: "On the calculator: type the amount you earn, press ×, type the decimal, then press =.",
  },
  loanLetter: {
    calc: true,
    steps: ["The monthly payment is what you pay one time each month. The loan lasts a number of months.", "What you pay in total is the monthly payment times the number of months. Compare that to the amount you borrowed. The extra is interest."],
    calcTip: "On the calculator: type the monthly payment, press ×, type the number of months, then press =.",
  },
  compareLenders: {
    calc: true,
    steps: ["Look at what is the same and what is different. The amount you borrow and the number of months are the same for both lenders.", "Only the APR changes. APR is the yearly cost of borrowing, as a percent. Think about what a bigger or smaller percent does to the total you pay back."],
    calcTip: "To check it, estimate the interest for one year: type the amount, press ×, type the APR as a decimal (18% is 0.18), then press =. Do it for each lender.",
  },
  scoreDrop: {
    calc: false,
    steps: ["Your credit score has 5 parts: payment history, amounts owed, length of history, credit mix and new credit.", "Think about what happened to your accounts last month. Did you miss a payment, open something new, or use more of a limit? Match what changed to the part of the score it belongs to."],
  },
  couchDeal: {
    calc: true,
    steps: ["Compare what you pay in total, not just the monthly payment.", "On a loan, the total you pay is the monthly payment times the number of months. Compare that to paying the price now."],
    calcTip: "On the calculator: type the monthly payment, press ×, type the number of months, then press =.",
  },
  saveOrBorrow: {
    calc: true,
    steps: ["A loan costs more than the price tag. Find out how much more.", "The total you pay is the monthly payment times the number of months. Subtract the price. What is left is the cost of borrowing."],
    calcTip: "On the calculator: payment, ×, months, =. Then press −, type the price, and press =.",
  },
  carDecision: {
    calc: true,
    steps: ["A car costs more than its payment. Add up everything you pay each month for each way of getting around.", "Remember the money you pay up front, too. Then compare each total to the bus."],
    calcTip: "On the calculator: type one cost, press +, type the next cost, and keep going. Press = for the total.",
  },
  studentLoan: {
    calc: true,
    steps: ["The rate is how much the loan costs each year as a percent of what you borrow.", "To see one year of interest, turn the rate into a decimal (5% is 0.05) and multiply by the amount. Do it for each loan, then compare."],
    calcTip: "On the calculator: type the amount, press ×, type the rate as a decimal, then press =.",
  },
  storeCard: {
    calc: true,
    steps: ["The discount saves you money once. A store card's interest can cost you money again and again if you carry a balance.", "To see one year of interest on the coat, turn the APR into a decimal and multiply it by the price. Compare that to the discount."],
    calcTip: "On the calculator: type the price, press ×, type the APR as a decimal, then press =.",
  },
  minimumTrap: {
    calc: true,
    steps: ["Interest grows on whatever you don't pay. Find what is left after each choice.", "Left over = balance minus what you pay. The bigger the leftover, the more interest you will be charged next month."],
    calcTip: "On the calculator: type the balance, press −, type your payment, then press =.",
  },
  balanceTransfer: {
    calc: true,
    steps: ["Compare two costs: the one-time transfer fee, and the interest you'd pay on the balance if you left it where it is.", "One year of interest is the balance times the APR as a decimal (24% is 0.24). Also remember a 0% deal lasts only for a set number of months."],
    calcTip: "On the calculator: type the balance, press ×, type the APR as a decimal, then press =.",
  },
  deferredInterest: {
    calc: true,
    steps: ["To clear the whole price inside the deal's time, your payments have to add up to the full price.", "Multiply your monthly payment by the number of months and compare that to the price. If it comes up short, deferred interest charges you for the whole time."],
    calcTip: "On the calculator: type the monthly payment, press ×, type the number of months, then press =.",
  },
  lifestyleCreep: {
    calc: true,
    steps: ["Find how much more the new plan costs each month, then how much that adds up to in a year.", "Subtract the old price from the new price. Multiply that by 12."],
    calcTip: "On the calculator: new price, −, old price, =. Then press ×, type 12, and press =.",
  },
  rewardsCard: {
    calc: true,
    steps: ["A rewards card only wins if the rewards you earn are bigger than the fee you pay.", "Yearly spending is monthly spending times 12. Rewards are that amount times the cash back rate as a decimal (2% is 0.02). Compare to the annual fee."],
    calcTip: "On the calculator: monthly spending, ×, 12, =. Then press ×, type the rate as a decimal, and press =.",
  },
  payoffOrSave: {
    calc: true,
    steps: ["Compare what the same money does in each place for one year.", "Paying the card saves you interest at the card's APR. Savings earns interest at the savings rate. Multiply the money by each rate (as a decimal) and see which number is bigger."],
    calcTip: "On the calculator: type the amount, press ×, type a rate as a decimal, then press =. Do it once for each rate.",
  },
  annualFee: {
    calc: true,
    steps: ["Break the fee down so it's easier to weigh.", "Divide the annual fee by 12 to see what the card costs you each month. Then ask what you get for it."],
    calcTip: "On the calculator: type the annual fee, press ÷, type 12, then press =.",
  },
  emergencyFund: {
    calc: true,
    steps: ["Experts suggest a safety net of about 3 months of bills.", "Multiply your monthly bills by 3 to find the goal. Then see how far your savings is from it."],
    calcTip: "On the calculator: type your monthly bills, press ×, type 3, then press =.",
  },
  retirementMatch: {
    calc: true,
    steps: ["A match is free money. Add what you put in and what your employer adds to see what goes in each month.", "Multiply by 12 to see the whole year."],
    calcTip: "On the calculator: your amount, +, the match amount, =. Then press ×, type 12, and press =.",
  },
  rentToOwn: {
    calc: true,
    steps: ["Find the total you would pay, then compare it to the price in a store.", "Total = the weekly payment times the number of weeks. The difference from the price is what the rent-to-own costs you extra."],
    calcTip: "On the calculator: weekly payment, ×, number of weeks, =. Then press −, type the price, and press =.",
  },
  paydayLoan: {
    calc: true,
    steps: ["Find what the loan costs, then what that is as a percent of what you borrowed.", "Fee = the amount you pay back minus the amount you borrowed. Divide the fee by the amount borrowed. That is the cost for just two weeks."],
    calcTip: "On the calculator: payback, −, borrowed, =. Then press ÷, type the borrowed amount, and press =.",
  },
  titleLoan: {
    calc: true,
    steps: ["Find the fee, then compare it to what you borrow.", "Fee = what you pay back minus what you get. Divide the fee by what you get to see the percent. Remember it's for one month."],
    calcTip: "On the calculator: payback, −, amount you get, =. Then press ÷, type the amount you get, and press =.",
  },
  bnplStack: {
    calc: true,
    steps: ["Each pay-later plan takes a part today and the rest at the next two End Months.", "Add up what every plan you pick asks for at each of those three times. That is what leaves your checking."],
    calcTip: "On the calculator: price, ×, 0.25 for the part due today. Add each plan's parts together with +.",
  },
  furnishPlace: {
    calc: true,
    steps: ["Financing costs more than the price. Find how much more.", "Total paid = the monthly payment times the number of months. Compare that to the cash prices."],
    calcTip: "On the calculator: monthly payment, ×, number of months, =.",
  },
};
