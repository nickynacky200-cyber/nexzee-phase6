import { Router } from "express";
import { getNetworks, purchase } from "../controllers/airtime.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { purchaseLimiter } from "../middleware/purchaseLimiter";
import { airtimePurchaseSchema } from "../validators/purchase.validators";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/networks", requireAuth, asyncHandler(getNetworks));
router.post(
  "/purchase",
  requireAuth,
  purchaseLimiter,
  validate(airtimePurchaseSchema),
  asyncHandler(purchase)
);

export default router;
