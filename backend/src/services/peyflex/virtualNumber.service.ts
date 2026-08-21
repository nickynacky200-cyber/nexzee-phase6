import { peyflexClient } from "./client";

// ── CONFIRMED against Peyflex docs ──────────────────────────────────────
// Docs sidebar calls this section "Virtual Number" but the actual endpoints
// are all under /api/otp/* — this is a virtual-number-for-OTP-verification
// service (rent a number, receive an SMS/OTP on it), not a virtual bank
// account number. Naming kept as "OTP" to match the real endpoint paths.

export interface PeyflexOtpService {
  id: number;
  name: string;
  [key: string]: unknown;
}

export async function getOtpServices(): Promise<PeyflexOtpService[]> {
  const { data } = await peyflexClient.get("/api/otp/services/");
  return data.services ?? data;
}

export interface PeyflexOtpCountry {
  id: number;
  name: string;
  [key: string]: unknown;
}

export async function getOtpCountries(serviceId: number): Promise<PeyflexOtpCountry[]> {
  const { data } = await peyflexClient.get("/api/otp/countries/", {
    params: { service_id: serviceId },
  });
  return data.countries ?? data;
}

export interface PeyflexOtpPrice {
  price: string;
  [key: string]: unknown;
}

export async function getOtpPrice(serviceId: number, countryId: number): Promise<PeyflexOtpPrice> {
  const { data } = await peyflexClient.get("/api/otp/price/", {
    params: { service_id: serviceId, country_id: countryId },
  });
  return data;
}

export interface PeyflexOtpPurchaseResponse {
  reference: string; // e.g. "OTP-AB12CD34EF56" — used in status/cancel calls
  number: string;
  status: string;
  [key: string]: unknown;
}

export async function purchaseOtpNumber(params: {
  service_id: number;
  country_id: number;
}): Promise<PeyflexOtpPurchaseResponse> {
  const { data } = await peyflexClient.post("/api/otp/purchase/", params);
  return data;
}

export interface PeyflexOtpStatusResponse {
  status: string; // e.g. "WAITING", "RECEIVED", "CANCELLED"
  code?: string; // the received OTP code, once available
  [key: string]: unknown;
}

export async function getOtpStatus(reference: string): Promise<PeyflexOtpStatusResponse> {
  const { data } = await peyflexClient.get(`/api/otp/status/${reference}/`);
  return data;
}

export async function cancelOtpActivation(reference: string): Promise<unknown> {
  const { data } = await peyflexClient.post(`/api/otp/cancel/${reference}/`, {});
  return data;
}

export interface PeyflexOtpHistoryItem {
  reference: string;
  status: string;
  [key: string]: unknown;
}

export async function getOtpHistory(
  page = 1,
  pageSize = 20
): Promise<{ results: PeyflexOtpHistoryItem[]; [key: string]: unknown }> {
  const { data } = await peyflexClient.get("/api/otp/history/", {
    params: { page, page_size: pageSize },
  });
  return data;
}
