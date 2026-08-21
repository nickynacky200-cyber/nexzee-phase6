import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError";

// Purchases move real money — tighter limit than the global one, and keyed
// per authenticated user rather than per IP where possible so users behind
// shared IPs (offices, campuses) aren't penalized for each other's traffic.
export const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6, // 6 purchase attempts per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? "unknown",
  handler: () => {
    throw new ApiError(429, "Too many purchase attempts. Please wait a moment and try again.");
  },
});
