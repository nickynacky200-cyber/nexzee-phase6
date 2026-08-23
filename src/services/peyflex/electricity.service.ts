import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────

export interface PeyflexElectricityVerifyResponse {
  status: string;
  customer_name: string;
  message?: string;
  [key: string]: unknown;
}

/** No authentication required per docs */
export async function verifyElectricityMeter(params: {
  meter: string;
  plan: string; // disco plan code, e.g. "kaduna-electric"
  type: "prepaid" | "postpaid";
}): Promise<PeyflexElectricityVerifyResponse> {
  const { data } = await peyflexClient.get("/api/electricity/verify/", {
    params: { identifier: "electricity", ...params },
  });
  return data;
}

export interface PeyflexElectricityPlan {
  plan: string; // e.g. "benin-electric", "kaduna-electric"
  name?: string;
  [key: string]: unknown;
}

/** No token required per docs */
export async function getElectricityPlans(): Promise<PeyflexElectricityPlan[]> {
  const { data } = await peyflexClient.get("/api/electricity/plans/", {
    params: { identifier: "electricity" },
  });
  return data.plans ?? data;
}

export interface PeyflexElectricitySubscribeResponse {
  status: string;
  message?: string;
  reference?: string;
  token?: string; // prepaid meter token, if present
  [key: string]: unknown;
}

export async function subscribeElectricity(params: {
  meter: string;
  plan: string;
  amount: string;
  type: "prepaid" | "postpaid";
  phone: string;
}): Promise<PeyflexElectricitySubscribeResponse> {
  const { data } = await peyflexClient.post("/api/electricity/subscribe/", {
    identifier: "electricity",
    ...params,
  });
  return data;
}
