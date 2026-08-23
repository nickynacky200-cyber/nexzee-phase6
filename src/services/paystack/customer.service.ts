import { paystackClient } from "./client";

// ── CONFIRMED against current Paystack docs ──────────────────────────────

export interface PaystackCustomer {
  email: string;
  customer_code: string;
  id: number;
  [key: string]: unknown;
}

export async function createPaystackCustomer(params: {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}): Promise<PaystackCustomer> {
  const { data } = await paystackClient.post("/customer", params);
  return data.data;
}

// ── Dedicated Virtual Accounts ────────────────────────────────────────────
// IMPORTANT: this feature requires your Paystack business to have completed
// the "go-live" verification process (registered NG/GH business). Calling
// this before that's done will fail — that's expected, not a bug. Currently
// only Wema Bank and Titan-Paystack are supported as preferred_bank values.
// Default limit is 1,000 DVAs per integration unless Paystack raises it.

export interface PaystackDedicatedAccount {
  bank: { name: string; id: number; slug: string };
  account_name: string;
  account_number: string;
  assigned: boolean;
  currency: string;
  active: boolean;
  customer: { id: number; first_name: string; last_name: string; [key: string]: unknown };
  [key: string]: unknown;
}

export async function createDedicatedAccount(
  customerCode: string,
  preferredBank: string = "wema-bank"
): Promise<PaystackDedicatedAccount> {
  const { data } = await paystackClient.post("/dedicated_account", {
    customer: customerCode,
    preferred_bank: preferredBank,
  });
  return data.data;
}

export interface PaystackDvaProvider {
  provider_slug: string;
  bank_id: number;
  bank_name: string;
  id: number;
}

/** Confirms which banks are actually available on YOUR Paystack account — don't hard-code assumptions. */
export async function getDvaProviders(): Promise<PaystackDvaProvider[]> {
  const { data } = await paystackClient.get("/dedicated_account/available_providers");
  return data.data;
}
