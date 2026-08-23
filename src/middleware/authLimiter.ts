import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError";

// Applies to both login and register. Keyed by IP (pre-auth, no user
// identity to key on yet). Tighter than the global limiter since credential
// stuffing/brute-force specifically targets these two routes.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new ApiError(429, "Too many attempts. Please wait a few minutes and try again.");
  },
});
