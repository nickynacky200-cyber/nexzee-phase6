import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────

export interface PeyflexEducationProvider {
  identifier: string; // e.g. "education" — docs show this is generic, WAEC is the example
  name?: string;
  plans?: { plan_id: string; name?: string; [key: string]: unknown }[];
  [key: string]: unknown;
}

/** No authentication required per docs */
export async function getEducationProviders(): Promise<PeyflexEducationProvider[]> {
  const { data } = await peyflexClient.get("/api/education/providers/");
  return data.providers ?? data;
}

export interface PeyflexEducationPurchaseResponse {
  status: string;
  reference: string;
  amount: string;
  [key: string]: unknown; // response was cut off after `amount` in the docs screenshot
}

export async function purchaseEducationPin(params: {
  identifier: string; // e.g. "education"
  plan_id: string; // e.g. "waecdirect", from getEducationProviders()
  quantity: string;
  phone: string;
}): Promise<PeyflexEducationPurchaseResponse> {
  const { data } = await peyflexClient.post("/api/education/purchase/", params);
  return data;
}
