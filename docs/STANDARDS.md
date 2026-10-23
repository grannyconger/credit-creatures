# Course standards: SC Personal Finance (code 5141)

The teacher's course standards (South Carolina, December 2022), copied from `SCPersonalFinance.pdf` on 2026-10-23. One half unit (0.5), grades 9 to 12, no prerequisite, one computer per student.

**How the game refers to them:** a letter and a number, for example **D3**. The game's older "Std 1, 2, 3, 5" (Practice Desk, teacher page, `STANDARD_LABELS` in `js/data/practice-questions.js`) are **D1, D2, D3 and D5**. SPEC §2 says the credit unit leaves out D4 (consumer law), D6 (loan applications and amortization in depth) and D7, since those are covered elsewhere in class.

**Course description:** helps students develop skills to make informed financial decisions, manage financial resources, and plan for future financial success. Using experiential activities, students learn the basic principles of personal finance and how to manage money in a global economy: budgeting, banking, insurance, mortgages, savings, investments, inheritance, retirement, tax, and estate planning. Students also learn about consumer protection laws, internet safety, and cyber security, so they can safeguard financial information against technology-based attacks.

**Objective:** given the necessary equipment, supplies, and facilities, the student will be able to successfully complete all of the following core standards.

## A. Managing personal finances
The student will analyze how human behaviors impact financial decisions.
1. Explain the importance of taking responsibility for personal financial decisions.
2. Apply decision-making skills to make personal financial choices (e.g., needs and wants, cost-benefit analysis, SMART goals).
3. Apply strategies for making informed purchasing decisions.
4. Describe the importance of budgeting.
5. Analyze how social media marketing is designed to encourage spending.
6. Investigate methods to safeguard financial information against technology-based attacks (e.g., privacy infringement, identity theft, fraud).

## B. Understanding insurance and risk
Students will demonstrate knowledge of insurance and the basics of risk management.
1. Define the principles of insurance and fundamental insurance terminology (e.g., claim, beneficiary, deductible, policy, premium, insured).
2. Describe risk management methods: risk avoidance, reduction, assumption, and transfer.
3. Explain personal auto policy terms and features (e.g., liability, deductible, comprehensive, collision, underinsured, uninsured).
4. Analyze how risk and other factors affect insurance premiums (e.g., driving record, driver's age, type of vehicle, coverage limits).
5. Identify the purpose and features of health insurance (e.g., copay, covered and non-covered expenses, deductible, medical expenses, out-of-pocket costs, pre-existing condition).
6. Compare different types of life insurance products (e.g., term, whole life, variable life).
7. Investigate the features and benefits of other insurance products, including renters, long-term disability, and liability.

## C. Utilizing banking services
The students will demonstrate knowledge of banking services and procedures.
1. Evaluate the services offered at various financial institutions.
2. Explain methods used for opening and managing checking and savings accounts.
3. Identify the components of a bank statement.
4. Reconcile a checking account.
5. Describe different fees and incentives that may be associated with online, mobile, and traditional banking.
6. Explain how Internet access and technology have impacted banking services.
7. Differentiate among types and regulations of electronic monetary transactions (e.g., e-checks, EFT).
8. Compare modern payment services between parties (e.g., peer to peer, digital wallet).

## D. Managing credit
Students will demonstrate an understanding of the various types of debt and methods of managing personal credit.
1. Identify types and sources of credit and debt (e.g., credit card, auto loans and leases, mortgages, student loans).
2. Evaluate the costs and benefits of using credit, including interest rates, terms, fees and their effect on credit scores.
3. Explain how the components of a credit score and a credit profile are determined.
4. Explain consumers' rights and responsibilities and the process for disputing billing errors using various consumer protection laws (e.g., Fair Credit Reporting Act, bankruptcy, Equal Credit Opportunity Act).
5. Identify high-risk strategies for repayment and ways to avoid financial pitfalls (e.g., payday loans, over-extended credit, and bankruptcy).
6. Complete a loan application and evaluate an amortization schedule.
7. Calculate payment schedules for a loan using spreadsheets, calculators, and/or online tools.

## E. Financing education and training
Students will demonstrate knowledge of how to financially prepare for post-secondary education and training.
1. Compare the various costs associated with post-secondary education or training.
2. Identify sources of financial aid.
3. Explain how to apply for financial aid for post-secondary education and training.
4. Compare the impact of various education funding options (e.g., scholarships, grants, loans, work-study) on net cost.
5. Analyze the FAFSA (Free Application for Federal Student Aid) process and its impact on student financial aid.
6. Evaluate the characteristics of different types of student loans and their various repayment options.
7. Describe investment options to pay for post-secondary education costs (e.g., 529 plan, Coverdell).

## F. Understanding taxes
Students will examine the impact of taxes on personal finances.
1. Define basic tax terminology (e.g., taxable income, tax credits, exemptions, deductions, itemized deductions, inheritance and estate, withholdings).
2. Explain the purposes and types of taxes at various levels of government in the United States.
3. Compute local taxes on products and services.
4. Analyze tax forms and their purpose, to include W-2, 1099, W-4, and I-9 forms.
5. Evaluate how taxes, government transfer payments, and employee benefits relate to disposable income.
6. Compute gross earnings, payroll deductions, and net pay.
7. Demonstrate how to fill out and file a federal and/or state individual income tax return.

## G. Building financial security
Students will develop skills to build financial security.
1. Define basic investment concepts (e.g., stocks, bonds, mutual funds, Rule of 72, simple and compound interest).
2. Explain the relationship between risk and the rate of return and the importance of risk management.
3. Identify funding requirements for different stages of life (e.g., post-secondary, parenthood, housing, retirement).
4. Analyze the impact of Social Security benefits on retirement planning.
5. Differentiate types of long-term retirement investments (e.g., Roth and traditional IRAs, 403(b), 401(k), defined-benefit plans, annuities, and target date funds).
6. Describe types and purposes of estate planning (wills, trusts, gifts, and charitable contributions).
7. Develop a personal investment portfolio.
8. Explain the roles of insurance in financial planning.

## Where the game touches each standard (first pass, 2026-10-23)

A rough map from reading the code, for planning minigames and Skill Paths. Not yet tagged in the data or confirmed by the teacher.

| Standard | Covered by now | Strength |
|---|---|---|
| A2, A3 | Decision cards, Shimmer Market, Unit Price Showdown, Cashier Rush, BNPL checkout | Some |
| A4 | Bills, AutoPay, emergency fund card (Ch 8), lifestyle creep card | Some |
| A6 | Data breach and credit freeze card, fake debt collector card | Light |
| B7 | Renter's insurance card, broken laptop card, shopping for insurance card | Light |
| C2 | Bank opening day, checking and savings, Check Writer, Check Anatomy Hunt, Spot the Overdraft | Strong |
| C3 | Statements in the Gilded Vault | Some |
| C4 | Register Balancer (a running balance, not a full reconcile) | Light |
| C5 | Overdraft fees, card fees | Light |
| D1 | Every credit type is a real account | Strong (primary) |
| D2 | Interest, fees and terms cost real money, the Garage deal sheet, loan cards | Strong |
| D3 | Live score, the 5 parts, credit report, Practice Desk | Strong (primary) |
| D4 | Goodwill letter card, fake debt collector card | Light (left out on purpose) |
| D5 | Payday and title loans, BNPL stacking, Lantern Alley | Strong (primary) |
| D6, D7 | Loan quotes show payment, APR, interest and total | Light (left out on purpose) |
| E6 | Federal and private student loans | Light |
| G1 | Ledger Sort (equity as investments) | Light |
| G3, G5 | Retirement match card, mortgage readiness card | Light |
| B1 to B6, C1, C6 to C8, E1 to E5, E7, F1 to F7, G2, G4, G6 to G8 | Not covered yet | None |

**Unbuilt minigame specs that fit uncovered or light standards:**
- Fee Detective: C3, C5
- Bank Reconciliation Match: C3, C4
- Deposit Slip Filler: C2

These specs survive from the teacher's Oct 22 document. Only games 1 to 7 and 11 were pasted. The others (13, 15, 17 to 22, 24, 28, 30, 39 to 42, 45 to 47, 49) still need their specs.
