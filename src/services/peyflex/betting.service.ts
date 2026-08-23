import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────

export interface PeyflexBettingCompany {
  label: string; // e.g. "1xBet"
  code: string; // e.g. "1xbet"
}

/** No authentication required per docs */
export async function getBettingCompanies(): Promise<PeyflexBettingCompany[]> {
  const { data } = await peyflexClient.get("/api/v1/bet/companies/");
  return data.companies;
}

export interface PeyflexBettingVerifyResponse {
  success: boolean;
  message: string;
  data: {
    code: number;
    name: string;
    username: string | null;
    reference: string | null;
    type: string;
    accountNumber: string;
    customerId: string;
    [key: string]: unknown;
  };
}

export async function verifyBettingAccount(params: {
  betting_company: string; // code from getBettingCompanies()
  customer_id: string;
}): Promise<PeyflexBettingVerifyResponse> {
  const { data } = await peyflexClient.post("/api/v1/bet/verify/", params);
  return data;
}

export interface PeyflexBettingFundResponse {
  status: string;
  message: string;
  transaction_id: string;
  amount_charged: string;
  discount_percent: string;
  discount_saved: string;
  [key: string]: unknown;
}

export async function fundBettingAccount(params: {
  betting_company: string;
  customer_id: string;
  amount: number;
  reference: string; // caller-generated unique reference
  customer_name: string; // from verifyBettingAccount()'s data.name
}): Promise<PeyflexBettingFundResponse> {
  const { data } = await peyflexClient.post("/api/v1/bet/fund/", params);
  return data;
}
