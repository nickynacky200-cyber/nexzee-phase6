import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────
// This is PEYFLEX's own account balance/profile (the account NEXZEE uses to
// fund purchases upstream) — NOT a NEXZEE customer's wallet. Useful for an
// admin dashboard widget to monitor float balance, not for customer-facing use.

export interface PeyflexWalletBalance {
  user_id: number;
  email: string;
  wallet_credit: string;
}

export async function getPeyflexWalletBalance(): Promise<PeyflexWalletBalance> {
  const { data } = await peyflexClient.get("/api/wallet/balance/");
  return data;
}

/** TODO: confirm full response shape — docs only showed the endpoint + auth header, no example body */
export async function getPeyflexProfile(): Promise<unknown> {
  const { data } = await peyflexClient.get("/api/user/profile/");
  return data;
}
