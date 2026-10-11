# Research review and implementation plan

Reviewed October 11, 2026. Input: local `Dime-X_Market_Research_Report.md`,
including its revised Section 11, alongside `Dime-X_Strategy_Report.md`.
No research/report/document table or matching report object was found in the
connected Dime-X Supabase project. This review does not independently verify
all of the report's competitor and market claims.

## Product direction

Focus on freelancers, creators and consultants with irregular income. The
secondary audience is people with a salary and a side income. The promise is
an understandable spending estimate supported by easy, accurate logging.
Invoicing and personal commitments complement each other in this product.

Quick-add is the right first step: trustworthy forecasts require current data.
Keep calculations deterministic and use AI for drafting or extraction with
human confirmation. Validate willingness to pay through repeated usage and
customer conversations; adding AI alone does not establish paid value.

## Corrections to the proposed design

- Safe to Spend must subtract existing goal earmarks as well as upcoming
  unfunded contributions, without counting the same reserved money twice.
  Investment balances are not spendable cash. Unpaid invoices stay separate.
- A universal 25% tax assumption can mislead. Make the percentage a confirmed
  planning preference, track the reserve over time and allow releases when tax
  is paid. This is a cash reserve estimate, not a tax calculation.
- Show when balances were last reconciled. Recent transaction entry is not
  proof that a manually entered account balance agrees with its bank balance.
- Recurring schedules are predictions, not evidence that a payment occurred.
  Suggest due entries and require confirmation before posting them. Otherwise
  forecasts and balances drift silently.
- Goals need ownership checks, same-currency account associations and limits
  against over-allocation. The sample SQL in the report is a sketch rather
  than a deployable integrity design.
- Credit-card purchases and repayments need a consistent liability ledger.
  EMI payments need a principal/interest split. Do not approximate these as
  ordinary expense rows or count them twice in a forecast.
- Browser speech recognition may use a browser/vendor speech service. If
  added, explain that processing accurately; “Dime-X does not store audio”
  does not mean all speech processing is on the device.
- Images need a separately supported vision provider and explicit retention
  terms. The current NVIDIA endpoint remains restricted to fictional internal
  testing; existing workspace metadata must not be exported to that trial.

## First increment: text quick-add

Implemented:
- Dashboard text bar and floating-action entry point.
- Small on-device parser for expenses/income, rupees, decimals, k/lakh and
  multiple entries. Unclear clauses stay visible and require correction.
- Optional authenticated `quick-add` AI task, existing allowlist, consent,
  fictional-test confirmation, quota and timeout handling. Only entered text
  goes to the model, never stored accounts, category rules or history.
- Editable review rows with amount, description, category, date and account.
  Relative dates resolve on the client; unresolved dates require selection.
- Owned categories/rules, longest merchant match first, and historical account
  defaults restricted to the stated currency. Category corrections can be
  remembered with a visible checkbox; rules stay local for guests and in the
  database for signed-in users.
- Save all as a single database request / guest snapshot, ledger-triggered
  balances and stable row IDs for retry. Optional rule failures never turn a
  successful money save into a retry invitation.
- Transaction source tracking (`manual` for local drafts, `ai` for AI drafts).

Current scope is ordinary income and expenses. Transfers, card/EMI payments,
invoice payments and goal allocations remain in their dedicated flows; the
quick-add draft marks these unsupported. Voice and images are not implemented.

Validation: Node regression suite, lint, frontend/Edge Function typechecking
and production build; rolled-back database assertions for category ownership,
cross-user references, atomic batch failure and idempotent retries. Existing
ledger regression suite is also run after the additive migration. A signed-in
browser walkthrough and live model quality evaluation of this new task remain
manual checks; mock provider tests establish protocol behavior, not model
accuracy.

## Second increment: implemented dashboard and language fixes

- Replaced the old widget grid with Safe to Spend, this month's expense donut,
  upcoming commitments, a 30-day cash forecast and five recent transactions.
  Removed duplicate cash-flow cards, prime-space quick actions and Income
  Sources from the dashboard.
- Safe to Spend uses cash/bank balances, scheduled bills, monthly EMIs, full
  card balances and configured reserves. Investment balances and unpaid
  invoices are excluded. The horizon stays 30 days rather than stopping at an
  uncertain expected payment date. The dashed forecast includes expected
  invoices only as a separate scenario.
- Tax, savings/other reserves and a safety buffer are explicit amounts in the
  user's chosen currency, persisted in owned profile preferences (guest
  browser storage). No default tax liability is invented and no money moves
  when reserves change. Goals and automatic tax-reserve accumulation remain
  separate future work.
- Local date recurrence preserves month-end anchors, carries an overdue
  commitment visibly and never manufactures a backlog of paid/unpaid months.
  Schedules remain predictions requiring users to keep balances/dates current.
- The primary quick-add action understands broader conversational numerical
  phrases. When consent and prototype eligibility are satisfied, it falls back
  to AI for unclear wording or unknown categories. Explicit named accounts,
  currencies and dates are retained through local context checks even if the
  model omits them. Editable review and confirmed saving remain mandatory.
- Income and Expenses now expose quick-add with their respective page context;
  explicit transaction meaning always overrides that default.
- Live NVIDIA evaluation extracted English word amounts, mixed income/expense
  text and Hinglish amounts correctly in three synthetic examples, about five
  seconds each. One omitted account reference motivated the local context
  repair; category suggestions still require review. The temporary synthetic
  test hook was immediately removed and the normal authenticated handler was
  verified after restoration. No user records were used for this evaluation.
- Regression coverage includes mixed-currency normalization, reserve
  persistence, overdue and month-end schedules, cleared/paid records,
  transfer exclusion, natural phrasing and retained account context. No
  connected browser was available for a signed-in visual walkthrough.

## Next increments

1. Voice feeding the same text review, with supported-browser fallback and
   clear consent/processing notice.
2. Goals with earmarks, reserve enforcement and compact dashboard progress;
   replace manually entered savings reserves with actual goal allocations
   without double-counting either.
3. Group navigation around spending, earning, planning and accounts.
4. Image reading once a suitable vision provider and retention terms are
   configured. Then CSV imports, balance history and holdings as justified by
   actual usage.

Dime-X subscriptions remain separate from clients paying users' invoices.
Razorpay activation still requires a merchant account and server secrets.
