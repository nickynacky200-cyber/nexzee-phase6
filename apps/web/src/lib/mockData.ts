// ── PLACEHOLDER DATA ──────────────────────────────────────────────────────
// As of Phase 4/5, wallet balance, transactions, data plans, and the
// data/airtime purchase flows are all wired to the real backend (see
// src/lib/useWallet.ts and the api.post() calls in BuyData.tsx / Airtime.tsx).
//
// The only thing still mocked is the dedicated funding account below —
// that's Paystack's virtual account feature, which is Phase 3 work and
// hasn't been built yet. Swap this out once Phase 3 wires up
// GET /api/wallet/funding-account.

export const mockWallet = {
  bankName: "Wema Bank",
  accountName: "NEXZEE - YOUNGZEE",
  accountNumber: "0123456789",
};
