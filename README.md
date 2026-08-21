# NEXZEE — Phase 1: Foundation

Nigerian digital services platform. Wallet-based data/airtime/bills purchases,
Paystack for funding, Peyflex for fulfillment.

## What's in Phase 1

- Monorepo structure (`backend/`, `apps/web/`, `apps/admin/` placeholders)
- PostgreSQL schema (Prisma) covering: User, Admin, Wallet, WalletTransaction
  (immutable ledger), Deposit, Payment, WebhookEvent, Order, OrderItem,
  ProviderTransaction, DataPlan, Notification, AuditLog
- Auth: register / login / me, JWT-based, bcrypt password hashing
- Core wallet service (`src/services/wallet/wallet.service.ts`) — the **only**
  code path allowed to change a wallet balance. Uses row-level locking
  (`SELECT ... FOR UPDATE`) inside a DB transaction so concurrent requests
  can't double-spend the same balance.
- Peyflex service layer — **full API surface implemented**, built only
  against confirmed docs:
  - ✅ Airtime: networks list, top-up
  - ✅ Data: networks, plans (by network), purchase
  - ✅ Cable TV: providers, plans (by provider), IUC verify, subscribe
  - ✅ Electricity: verify meter, plans, subscribe (prepaid/postpaid)
  - ✅ Fund Betting: companies list, verify account, fund account
  - ✅ Education: providers, purchase PIN
  - ✅ Recharge Card: options, purchase, order/batch lookup with filters
  - ✅ Virtual Number (OTP): services, countries, price, purchase, status,
    cancel, history
  - ✅ Peyflex account: wallet balance (confirmed), profile (endpoint
    confirmed, response body never captured — treat as `unknown`)

  A few response shapes are only partially confirmed (docs screenshots cut
  off mid-JSON in a handful of spots) — each is marked inline with a comment
  in the relevant service file. These don't block building against the API,
  just double-check field names against a live response before shipping
  anything that reads an unconfirmed field.
- Security baseline: helmet, CORS allowlist, rate limiting, centralized error
  handler that never leaks stack traces, zod input validation

## Files created

```
nexzee/
├── docker-compose.yml          # local Postgres for dev
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── config/
│       │   ├── env.ts
│       │   └── db.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   ├── validate.ts
│       │   └── errorHandler.ts
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── routes/
│       │   ├── index.ts
│       │   └── auth.routes.ts
│       ├── validators/
│       │   └── auth.validators.ts
│       ├── services/
│       │   ├── wallet/wallet.service.ts
│       │   └── peyflex/
│       │       ├── client.ts
│       │       ├── airtime.service.ts
│       │       ├── data.service.ts
│       │       ├── cable.service.ts
│       │       ├── electricity.service.ts
│       │       ├── betting.service.ts
│       │       ├── education.service.ts
│       │       ├── rechargeCard.service.ts
│       │       ├── virtualNumber.service.ts  (OTP endpoints)
│       │       ├── account.service.ts
│       │       └── index.ts
│       └── utils/
│           ├── password.ts
│           ├── jwt.ts
│           ├── ApiError.ts
│           └── asyncHandler.ts
├── apps/web/        (empty — Phase 2)
└── apps/admin/       (empty — Phase 7)
```

## How to run (on your VPS)

1. **Install Postgres** (or use the included `docker-compose.yml` for local dev):
   ```bash
   docker compose up -d
   ```

2. **Backend setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env: set a real JWT_SECRET (openssl rand -base64 48)
   npm run prisma:migrate   # creates tables from schema.prisma
   npm run dev               # starts on http://localhost:4000
   ```

3. **Test it:**
   ```bash
   curl http://localhost:4000/health
   # {"status":"ok"}

   curl -X POST http://localhost:4000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"fullName":"Test User","email":"test@nexzee.com","phone":"08012345678","password":"testpass123"}'
   ```

## Required environment variables (Phase 1)

| Variable | Required now? | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | Postgres connection string |
| `JWT_SECRET` | ✅ Yes | 32+ char random string |
| `PORT` | No | Defaults to 4000 |
| `CORS_ORIGIN` | No | Set to your frontend URL once built |
| `PAYSTACK_*` | Not yet | Phase 3 |
| `PEYFLEX_API_KEY` | Not yet | Phase 4 — **rotate every token seen in your docs screenshots before going live.** Several distinct tokens showed up across sections (starting `7301f73b...`, `79c1e84b...`, `35fb84b7...`, `1ef782d6...`, `9f4bb911...`) — treat all of them as compromised, not just the first one. |

## What's NOT done yet (by design — see phasing)

- No frontend (Phase 2)
- No Paystack integration/webhooks (Phase 3)
- No Peyflex purchase flow wired to wallet — services exist but nothing
  calls them yet, since wallet debit + provider call + refund-on-failure
  needs to be orchestrated per Order (Phase 4/5)
- No admin dashboard (Phase 7)

## Peyflex service layer — status

Every section of the docs is implemented: Airtime, Data, Cable TV,
Electricity, Fund Betting, Education, Recharge Card, and Virtual Number
(OTP). A handful of response shapes are only partially confirmed because the
docs screenshots cut off mid-JSON — each spot is marked with a comment in
the relevant `*.service.ts` file. Verify those specific fields against a
live response before relying on them.

## Phase 4/5 — Peyflex orchestration & purchase flows

Data and airtime purchases are now fully wired end-to-end: frontend →
backend → Peyflex → wallet ledger, with real money-safety logic:

- **Data plan pricing is never trusted from the client.** The purchase
  endpoint re-fetches live plans from Peyflex server-side and looks up the
  price by `plan_code` — a tampered or stale client price is never used.
- **Wallet is debited before Peyflex is called**, inside the same atomic,
  row-locked operation from Phase 1's wallet service. If the debit fails
  (insufficient balance), Peyflex is never contacted.
- **Three distinct outcomes are handled differently:**
  - Peyflex confirms success → order marked `SUCCESSFUL`, debit stands.
  - Peyflex returns a definite failure (any HTTP response, success or
    error) → wallet is refunded immediately, order marked `FAILED`.
  - Peyflex times out / network error (no response at all) → **no refund**.
    The order is left `PENDING` because we genuinely don't know if the
    provider delivered. This still needs a reconciliation mechanism (a
    status-check job polling Peyflex, or a manual admin review flow) — that
    doesn't exist yet and is worth prioritizing before this goes live with
    real money.
- **Purchase endpoints are rate-limited** per user (6/minute) separately
  from the global rate limit, to blunt double-submit spam.
- New read endpoints: `GET /api/wallet`, `GET /api/wallet/transactions` —
  the frontend now shows real balance and transaction history instead of
  mock data.

New backend files: `services/orders/` (order lifecycle, data purchase
orchestration, airtime purchase orchestration), `controllers/data.controller.ts`,
`controllers/airtime.controller.ts`, `controllers/wallet.controller.ts`,
`middleware/purchaseLimiter.ts`, `validators/purchase.validators.ts`,
`utils/reference.ts`.

Frontend: Buy Data and Airtime pages now fetch live networks/plans and call
the real purchase endpoints. Dashboard, Wallet, and Transactions pages fetch
real balance/history via the new `useWallet` hook. Only the dedicated
funding account display (Fund Wallet screen) is still mock — that's
Paystack, Phase 3.

**Correction to Phase 1 docs:** the confirmed data plan field names are
`plan_code` / `amount` / `label` (not `price` / `name` as originally
guessed before the plan-list screenshot came in) — `data.service.ts` has
been corrected to match.

## Next step

Phase 3 (Paystack) is next — that's what will make the Fund Wallet screen
show a real dedicated account instead of mock data, and is also the
prerequisite for the reconciliation job mentioned above (Peyflex `PENDING`
orders and Paystack webhook idempotency share the same "don't trust a single
response, verify" pattern).

## Phase 6 — Transactions & wallet ledger

The ledger itself was already atomic and immutable from Phase 1. This phase
turns that raw ledger into the actual Transactions screen from your spec:

- `GET /api/wallet/transactions` now accepts `type` (`all` / `funding` /
  `data` / `airtime` / `refund` / `other`), `page`, and `limit` — matching
  the filter tabs from your design ("All, Funding, Data, Airtime, Refund,
  Other"). A `WalletTransaction` row alone doesn't know if a `PURCHASE` was
  for data or airtime — that lives on the linked `Order` — so `data`/`airtime`
  filters join through that relation.
- New `GET /api/wallet/transactions/:reference` — full detail for a single
  ledger entry: order items (network, phone, plan code), provider reference,
  balance before/after. Deliberately excludes the raw Peyflex response body —
  that's audit-only, not customer-facing.
- Frontend: transaction rows are now tappable, routing to a detail screen.
  The Transactions page has all 6 filter tabs (was 4, using wrong category
  names) and a "Load More" button backed by real pagination instead of a
  flat unfiltered list.

**Design note:** the original API list separately mentions `GET
/api/transactions` and `GET /api/wallet/transactions`. They'd return
identical data for this app (every transaction is a wallet ledger entry), so
rather than maintain two endpoints with the same shape, everything lives
under `/api/wallet/transactions` with filtering. Worth knowing if you were
expecting two distinct routes.

New/changed backend files: `services/wallet/transactionHistory.service.ts`,
`controllers/wallet.controller.ts` (rewritten), `routes/wallet.routes.ts`
(new detail route). New frontend files: `lib/useTransactions.ts`,
`pages/TransactionDetail.tsx`.

## Next step

Phase 7 (admin dashboard) is the next unbuilt customer-facing-adjacent piece,
though Phase 3 (Paystack) is still open too — whichever you'd rather tackle
next.
