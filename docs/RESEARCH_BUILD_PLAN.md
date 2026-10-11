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

## Next increments

1. Safe-to-Spend calculation and visible breakdown, 30-day obligations and
   expected invoices, expense donut and deterministic status sentence. Define
   tax reserve persistence and reconciliation before presenting a confident
   spending number.
2. Voice feeding the same text review, with supported-browser fallback and
   clear consent/processing notice.
3. Goals with earmarks, reserve enforcement and compact dashboard progress.
4. Group navigation around spending, earning, planning and accounts.
5. Image reading once a suitable vision provider and retention terms are
   configured. Then CSV imports, balance history and holdings as justified by
   actual usage.

Dime-X subscriptions remain separate from clients paying users' invoices.
Razorpay activation still requires a merchant account and server secrets.
