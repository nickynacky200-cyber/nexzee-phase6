import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────

export interface PeyflexCableProvider {
  identifier: string; // e.g. "dstv", "gotv", "startimes"
  name: string;
}

export async function getCableProviders(): Promise<PeyflexCableProvider[]> {
  const { data } = await peyflexClient.get("/api/cable/providers/");
  return data.providers;
}

export interface PeyflexCablePlan {
  plan: string; // e.g. "nova"
  amount: string; // e.g. "2100"
  display: string; // e.g. "nova"
  description: string; // e.g. "(Dish) =N2100 (1 month)"
  [key: string]: unknown;
}

export async function getCablePlans(identifier: string): Promise<PeyflexCablePlan[]> {
  const { data } = await peyflexClient.get(`/api/cable/plans/${identifier}/`);
  return data.plans ?? data;
}

export interface PeyflexCableVerifyResponse {
  status: string;
  customer_name: string;
  message?: string;
  [key: string]: unknown;
}

export async function verifyCableIuc(params: {
  iuc: string;
  identifier: string; // provider identifier from getCableProviders()
}): Promise<PeyflexCableVerifyResponse> {
  const { data } = await peyflexClient.post("/api/cable/verify/", params);
  return data;
}

export interface PeyflexCableSubscribeResponse {
  status: string;
  message?: string;
  reference?: string;
  [key: string]: unknown;
}

export async function subscribeCable(params: {
  identifier: string; // provider, e.g. "startimes"
  plan: string; // plan code from getCablePlans()
  iuc: string;
  phone: string;
  amount: string;
}): Promise<PeyflexCableSubscribeResponse> {
  const { data } = await peyflexClient.post("/api/cable/subscribe/", params);
  return data;
}
