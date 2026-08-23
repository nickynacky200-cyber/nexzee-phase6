import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────

export interface PeyflexRechargeCardDenomination {
  amount: number;
  sell?: number; // selling price, if different from face value — field was cut off in docs
  [key: string]: unknown;
}

export interface PeyflexRechargeCardNetworkOption {
  network: string; // e.g. "9MOBILE"
  network_label: string; // e.g. "9mobile"
  denominations: PeyflexRechargeCardDenomination[];
}

export async function getRechargeCardOptions(): Promise<PeyflexRechargeCardNetworkOption[]> {
  const { data } = await peyflexClient.get("/api/rc/options/");
  return data.networks;
}

export interface PeyflexRechargeCardOrder {
  id: string;
  reference: string;
  status: string;
  network: string;
  amount: number;
  quantity_ordered: number;
  quantity_delivered: number;
  price_per_card: number;
  total_charged: number;
  brand_name: string;
  created_at: string;
}

export interface PeyflexRechargeCardPin {
  pin: string;
  serial: string;
}

export interface PeyflexRechargeCardPurchaseResponse {
  success: boolean;
  order: PeyflexRechargeCardOrder;
  cards: PeyflexRechargeCardPin[];
}

export async function purchaseRechargeCard(params: {
  network: string; // e.g. "MTN"
  amount: number;
  quantity: number;
  pin: string; // your own security PIN, per docs example "1234"
  brand_name: string; // printed on the card, e.g. your shop name
}): Promise<PeyflexRechargeCardPurchaseResponse> {
  const { data } = await peyflexClient.post("/api/rc/purchase/", params);
  return data;
}

/** Fetch a previous batch order by its id, with optional filters (network, status, page, per_page) */
export async function getRechargeCardOrder(
  orderId: string,
  filters?: { network?: string; status?: string; page?: number; per_page?: number }
): Promise<PeyflexRechargeCardPurchaseResponse> {
  const { data } = await peyflexClient.get(`/api/rc/orders/${orderId}/`, {
    params: filters,
  });
  return data;
}
