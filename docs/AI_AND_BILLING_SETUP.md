# Dime-X: backend, AI and subscriptions

## Product direction

Dime-X currently combines invoicing, clients, accounts, income and expenses, debts, recurring bills and reports. The strongest initial audience is freelancers and small service businesses who want to create invoices and see which clients need follow-up. Validate that audience before expanding to unrelated personal-finance features.

The paid promise should be less administrative work and faster follow-up on unpaid invoices. AI is useful inside those workflows: draft invoice line items from a description, and draft a reminder for an existing outstanding invoice. Those two features are implemented, with preview/edit steps. Neither sends messages, records payments, changes balances or makes financial decisions. Numeric payment facts are appended from the database rather than invented by the model.

Next product work, not implemented here: actual invoice delivery, scheduled reminders with opt-in and delivery tracking, receipt extraction with review, and a weekly receivables action list. Recurring bills currently track obligations; they do not execute payments. Subscription conversion will require a tested customer outcome, onboarding, support and a clear paid plan—not simply a chatbot.

## Account and data flow

1. Supabase Auth creates the identity. An Auth database trigger creates its profile, including for email-confirmation signups that have no session yet.
2. Email confirmation and sign-in establish a real session. Frontend-only identities cannot enter the signed-in workspace.
3. Tables enforce user ownership with row-level security. Every real-account write awaits the backend; failed cloud writes are reported rather than stored as a successful local fallback.
4. Ledger triggers update balances when transactions are inserted, edited, moved or removed. Invoice payments and paired transfers use atomic, retry-safe database functions. Backend invoice totals are recomputed from line items.
5. User profile, business details and preferences are scoped to that identity. Switching identities clears cached data. Guest mode remains a separate browser-only workspace.

The connected project is `hwmdicbhzxjdvwmvmuix`. Its existing data was retained, and the migrations and three Edge Functions in this repository were applied/deployed. The frontend uses the existing Vercel deployment linked to the GitHub repository's `main` branch; verify its deployment status after each release.

Legacy unscoped browser storage is left untouched and is not automatically imported into cloud accounts. Review/export any older browser-only records before clearing browser storage. Existing account balances are treated as the baseline during migration; existing transactions are not replayed into balances.

## Nemotron feedback

The requested model is `nvidia/nemotron-3-super-120b-a12b`: 120B total parameters with 12B active parameters, designed for reasoning and agent workloads. It is a reasonable candidate to evaluate, but short invoice/reminder drafts may work well with a smaller, cheaper model. This implementation uses an OpenAI-compatible chat-completions endpoint and keeps the provider and model configurable.

An open model does not mean a free production API. NVIDIA's hosted API Trial Terms restrict the trial to evaluation and require a separate agreement for production; they also restrict sensitive data. Do not launch the customer integration on evaluation credentials. Use a provider agreement permitting commercial production use and the intended data, or host the model under its applicable license. Hosting still has GPU, operations and availability costs.

Sources: [NVIDIA model overview](https://research.nvidia.com/labs/nemotron/Nemotron-3-Super/), [API reference](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b), [NVIDIA API Trial Terms](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf).

The backend disables Nemotron thinking for these short tasks using `chat_template_kwargs.enable_thinking=false`. Verify that your production provider supports that parameter. No live model evaluation has been run because no production credentials are configured.

Before choosing the final model, compare it with a smaller candidate on at least 30 synthetic invoice descriptions and reminders. Measure schema-valid responses, irrelevant/invented content, edit time, latency and cost. The success criterion is useful drafts that reduce work, not model size. Monthly inference cost is approximately calls × average billed input/output tokens × provider token rates, plus hosting if applicable. This version allows 10 requests/day for free accounts and 100/day for valid paid subscriptions, resetting at UTC midnight. Requests count before the provider call, including provider failures. These are provisional limits to revisit after evaluation.

## AI configuration

### Internal free-API prototype

The internal prototype defaults to NVIDIA `nvidia/nemotron-3.5-lightning-30b-a3b` and `https://integrate.api.nvidia.com/v1/chat/completions`. It works without asserting production approval. In Supabase Dashboard → Edge Functions → Secrets, set:

```text
AI_MODE=prototype
AI_API_KEY=<NVIDIA API key>
AI_PROTOTYPE_EMAILS=<your verified Dime-X sign-in email>
```

The email list may contain comma-separated internal testers. Only verified listed accounts can generate drafts. The UI checks availability before enabling Generate, identifies the selected model, and requires confirmation that inputs and invoice records are fictional test data. Never submit real client, bank or confidential information to the free trial endpoint. Status checks do not consume the daily quota. Backend defaults cover the model and endpoint, but either can be explicitly configured using `supabase/functions/.env.example` as a reference. Your API key belongs in Supabase secrets, not in this file or chat.

The prototype is not a customer launch. When changing providers, set the production endpoint, model and key, then set `AI_MODE=production` and `AI_PRODUCTION_APPROVED=true` after confirming suitable production terms. Production mode removes the internal tester restriction and the fictional-data checkbox; authentication, consent, output validation, quotas and manual draft review remain.

Live synthetic evaluation on October 11, 2026: the initial zero-shot prompt lost supplied prices. After adding explicit extraction instructions and an example, three requests preserved the expected quantities and rates: INR 25000 plus 3 × INR 1500; 2.5 × INR 1200 plus INR 3000; and 4 × USD 15 plus a missing-price item at 0. Responses took approximately 1.2–1.4 seconds. This is a small connection check, not a quality guarantee; users must still review every item. No real client records were sent during this evaluation.

### Production provider

Set secrets on Supabase Edge Functions, never in `VITE_*`, source control or chat:

```text
AI_API_URL=<production HTTPS chat-completions URL>
AI_API_KEY=<production provider secret>
AI_MODEL=<model offered by your production provider>
AI_MODE=production
AI_PRODUCTION_APPROVED=true
APP_ORIGINS=https://<actual-production-domain>,http://localhost:5173,http://127.0.0.1:5173
```

Only set `AI_PRODUCTION_APPROVED=true` after the provider's production terms and data handling are suitable. Until then, requests receive a clear unavailable response. The user must explicitly consent to sending draft text; remind users not to include bank details or other sensitive data. The reminder flow sends bounded instructions rather than the complete client or invoice record. Review retention and privacy obligations with the selected provider before launch.

Endpoints: `ai-assist`, `billing`, `billing-webhook`. User endpoints independently validate the bearer token with Supabase Auth and require a verified email. `verify_jwt=false` in the function config does not bypass that application check. The webhook instead authenticates the exact raw request body using Razorpay's HMAC signature.

## India subscriptions: Razorpay

There is no merchant account yet. Complete merchant registration and the provider's required verification yourself, then obtain test-mode credentials and create a recurring plan. Razorpay availability and activation depend on its merchant review. [Razorpay subscription integration](https://razorpay.com/docs/payments/subscriptions/integration-guide/).

Configure these backend secrets:

```text
RAZORPAY_KEY_ID=<test key ID first>
RAZORPAY_KEY_SECRET=<test key secret>
RAZORPAY_PLAN_ID=<test recurring plan ID>
RAZORPAY_WEBHOOK_SECRET=<separate webhook signing secret>
```

Webhook URL:

```text
https://hwmdicbhzxjdvwmvmuix.supabase.co/functions/v1/billing-webhook
```

Subscribe to the subscription lifecycle events supported by Razorpay, including authentication, activation, charging, pending/halted, cancellation and completion. Use the same environment for plan, keys and webhook. [Webhook validation and testing](https://razorpay.com/docs/webhooks/validate-test/).

The backend creates a hosted subscription checkout using the server's plan ID and links it to the authenticated user. It reserves checkout creation to prevent concurrent duplicate mandates. A browser redirect never grants Pro: signed webhook processing fetches the canonical subscription, verifies the plan, deduplicates events and stores status. Pro requires an active subscription, at least one paid charge and an unexpired period. Users can refresh status and cancel renewal at period end.

An uncertain provider failure during creation leaves the reservation locked rather than risking a second mandate. Reconcile the merchant dashboard with the user's subscription row before clearing it; do not blindly retry creation. Refunds, billing disputes, account deletion and entitlement policies after cancellation need an explicit support policy before public launch.

Before live mode, test: account creation and confirmation; checkout authentication; initial paid charge; renewal; failed charge/halted state; cancellation; webhook replay; out-of-order webhooks; wrong signatures; and concurrent checkout clicks. Confirm the database and displayed plan agree in each case. No end-to-end Razorpay test has run yet because merchant credentials are unavailable. Choose pricing and the plan interval before live activation; the UI reads the configured provider plan rather than inventing a price.

## Auth and launch checklist

- Set Supabase Auth's site URL and allowed redirect URLs to the actual frontend domain and development URLs. Verify confirmation, sign-in, logout and confirmation links with a new test account.
- Configure production email delivery and test it. Enable leaked-password protection where available: the security advisor currently flags it as disabled. [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Publish the frontend only after reviewing the changes. Ensure the host serves the public Supabase URL/key from environment variables; provider and service-role keys stay on the backend.
- Test the guest flow and real-account flow in a browser. This session had no browser connection, so visual and interactive browser verification remains outstanding.
- Decide subscription price, usage limits, privacy disclosure, terms, support and cancellation/refund policy. Measure real customer time saved before marketing the product as ready for paid use.

## Local development and verification

```sh
npm ci
cp .env.example .env.local
# Fill only public frontend Supabase values in .env.local
npm run dev
npm run lint
npm run build
npm test
```

`build` includes type checking of the frontend and Edge Functions. PDF and spreadsheet libraries load on demand; charts, Supabase and drag/drop code have separate bundles.

`tests/database-integrity.sql` runs ownership, ledger, retry, invoice, currency-history, subscription event and quota assertions inside a transaction that ends with rollback. Execute it with an administrative connection on a test database, or review before running against another database. It uses fixed synthetic UUIDs and performs no lasting writes. It has passed against the connected project.

The current live backend integration is deployed. Internal AI testing requires a provider key and configured tester emails; public AI and payments require their production provider setup. Tests verify deterministic logic and database protections; they do not establish model quality, provider delivery, checkout usability or production frontend behavior.
