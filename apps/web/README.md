# NEXZEE — Customer Web App (Phase 2)

React + Vite + Tailwind, mobile-first, matching the NEXZEE reference design
(purple/indigo primary, white cards, rounded corners, bottom nav).

## Screens built

- **Splash** — onboarding with Get Started / Login
- **Login / Register** — wired to the real backend (`/api/auth/*` from Phase 1)
- **Dashboard** — wallet balance card, quick actions, recent transactions
- **Fund Wallet** — dedicated account display, copy-to-clipboard
- **Buy Data** — network selector, plan grid, purchase flow
- **Airtime** — network selector, quick amounts, custom amount
- **Transactions** — filterable list (All / Funding / Data / Airtime)
- **Wallet** — balance, quick links, support prompt
- **Profile** — account info, settings links, logout

## What's real vs. placeholder

- **Real:** Login and Register call the actual backend from Phase 1
  (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`).
  A logged-in session persists via JWT in `localStorage`.
- **Placeholder:** Wallet balance, transaction history, data plans, and the
  purchase flows in Buy Data / Airtime all use mock data from
  `src/lib/mockData.ts`. These are clearly marked with `TODO(Phase 4/5)`
  comments — the backend doesn't have wallet/transaction/purchase endpoints
  yet (that's the wallet-debit + Peyflex-call + refund-on-failure
  orchestration coming in Phase 4/5). The UI is built and ready to wire up
  once those routes exist.

## How to run

```bash
cd apps/web
npm install
cp .env.example .env   # points at your local backend, defaults to :4000
npm run dev             # starts on http://localhost:5173
```

Make sure the backend (`../../backend`) is running first so login/register
work — see the root README for backend setup.

## Design tokens

Defined in `tailwind.config.js`:

| Token | Value | Use |
|---|---|---|
| `nexzee` | `#5B2EBF` | Primary purple/indigo |
| `nexzee-dark` | `#3D1F8C` | Gradients, hover states |
| `nexzee-soft` | `#F1ECFB` | Tinted backgrounds, badges |
| `surface` | `#F7F7FB` | App background |
| `ink` / `ink-soft` / `ink-faint` | `#181528` / `#6B6580` / `#A29CB8` | Text hierarchy |

The app shell is capped at 480px wide (`.app-shell` in `index.css`) so it
reads as a phone screen even when viewed on desktop, matching how the
reference mockups were framed.

## Next step

Phase 3: Paystack integration (dedicated virtual accounts, webhook
verification) — the Fund Wallet screen's account details will switch from
mock data to a real Paystack-issued account per user.
