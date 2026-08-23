import { paystackClient } from "./client";

// ── CONFIRMED against current Paystack docs (docs-v2.paystack.com) ───────
// Amount is ALWAYS in the smallest currency unit — kobo for NGN.
// 1 Naira = 100 kobo. Every function here takes/returns kobo; callers
// convert to/from Naira at the boundary.

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeResponse> {
  const { data } = await paystackClient.post("/transaction/initialize", {
    email: params.email,
    amount: params.amountKobo,
    reference: params.reference,
    callback_url: params.callback_url,
    metadata: params.metadata,
  });
  return data;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: "success" | "failed" | "abandoned" | string;
    reference: string;
    amount: number; // kobo
    currency: string;
    channel: string;
    paid_at: string | null;
    customer: { email: string; customer_code: string };
    [key: string]: unknown;
  };
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const { data } = await paystackClient.get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data;
}
