import axios from "axios";
import { env } from "../../config/env";

// Single configured axios instance for all Peyflex calls.
// PEYFLEX_API_KEY must only ever exist here (backend), never in frontend code.
export const peyflexClient = axios.create({
  baseURL: env.PEYFLEX_BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
  },
});

peyflexClient.interceptors.request.use((config) => {
  if (!env.PEYFLEX_API_KEY) {
    throw new Error("PEYFLEX_API_KEY is not configured");
  }
  config.headers.Authorization = `Token ${env.PEYFLEX_API_KEY}`;
  return config;
});
