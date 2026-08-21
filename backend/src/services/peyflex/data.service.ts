import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────

export interface PeyflexDataNetwork {
  identifier: string; // used for both plan lookups and purchases, per docs
  name: string;
}

export async function getDataNetworks(): Promise<PeyflexDataNetwork[]> {
  const { data } = await peyflexClient.get("/api/data/networks/");
  return data.networks;
}

export interface PeyflexDataPlan {
  plan_code: string; // e.g. "M110MBS"
  amount: number; // e.g. 150
  label: string; // e.g. "110MB = N150 (1DAY)"
}

export async function getDataPlans(network: string): Promise<PeyflexDataPlan[]> {
  const { data } = await peyflexClient.get("/api/data/plans/", {
    params: { network },
  });
  return data.plans;
}

export interface PeyflexDataPurchaseResponse {
  status: string; // "SUCCESS" | other — exact failure values unconfirmed
  reference: string;
  message: string;
  // Full shape beyond {status, reference, message} was cut off in the docs
  // screenshot — treat any other field as unconfirmed until verified live.
  [key: string]: unknown;
}

export async function purchaseData(params: {
  network: string;
  mobile_number: string;
  plan_code: string;
}): Promise<PeyflexDataPurchaseResponse> {
  const { data } = await peyflexClient.post("/api/data/purchase/", params);
  return data;
}
