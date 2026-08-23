import { Router } from "express";
import { paystackWebhook } from "../controllers/webhooks.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// No requireAuth here — Paystack isn't a logged-in user. Authenticity is
// established entirely by the signature check inside the controller, not
// by any session/token. Body parsing (raw, not JSON) is handled specially
// in app.ts for this exact path, ahead of the global JSON parser.
router.post("/paystack", asyncHandler(paystackWebhook));

export default router;
