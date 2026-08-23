import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError";

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new ApiError(429, "Too many login attempts. Please try again later.");
  },
});
