import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────

export interface PeyflexAirtimeNetwork {
  id: string; // e.g. "mtn", "glo", "airtel"
  name: string; // e.g. "MTN"
}

export async function getAirtimeNetworks(): Promise<PeyflexAirtimeNetwork[]> {
  // No auth required for this endpoint per docs.
  const { data } = await peyflexClient.get("/api/airtime/networks/");
  return data.networks;
}

export interface PeyflexAirtimeTopupResponse {
  status: "SUCCESS" | "FAILED" | "PENDING";
  reference: string;
  amount: string;
  charged: string;
  discount: string;
  balance: string; // Peyflex's own wallet balance, NOT the NEXZEE user's wallet
  id: string;
  network: string;
  mobile_number: string;
  timestamp: string;
  message: string;
  transaction_id: number;
}

export async function purchaseAirtime(params: {
  network: string; // network id from getAirtimeNetworks(), e.g. "mtn"
  amount: number;
  mobile_number: string;
}): Promise<PeyflexAirtimeTopupResponse> {
  const { data } = await peyflexClient.post("/api/airtime/topup/", params);
  return data;
}
