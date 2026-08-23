import "dotenv/config";
import { z } from "zod";

// Fails fast on boot if required secrets are missing — better than a silent
// undefined leaking into a Paystack/Peyflex call at runtime.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Paystack — Phase 3
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  // NOTE: Paystack's classic webhook signature scheme uses your SECRET KEY
  // for the HMAC (see services/paystack/webhookSignature.ts) — there is no
  // separate webhook-specific secret in their current API. This var is kept
  // for forward-compatibility but isn't consulted by the signature check.
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  // Bank slug for the dedicated virtual account (e.g. "wema-bank",
  // "titan-paystack"). Call GET /dedicated_account/available_providers on
  // your Paystack account to see what's actually available to you.
  PAYSTACK_PREFERRED_BANK: z.string().default("wema-bank"),
  // Where Paystack redirects the browser after a card payment completes.
  PAYSTACK_CALLBACK_URL: z.string().default("http://localhost:5173/fund-wallet"),

  // Peyflex — wired up in Phase 4
  PEYFLEX_API_KEY: z.string().optional(),
  PEYFLEX_BASE_URL: z.string().default("https://client.peyflex.com.ng"),

  CORS_ORIGIN: z.string().default("http://localhost:5173,http://localhost:5174"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
