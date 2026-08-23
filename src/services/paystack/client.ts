import axios from "axios";
import { env } from "../../config/env";

export const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

paystackClient.interceptors.request.use((config) => {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }
  config.headers.Authorization = `Bearer ${env.PAYSTACK_SECRET_KEY}`;
  return config;
});
