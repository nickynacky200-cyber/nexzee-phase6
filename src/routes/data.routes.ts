import { Router } from "express";
import { getNetworks, getPlans, purchase } from "../controllers/data.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { purchaseLimiter } from "../middleware/purchaseLimiter";
import { dataPurchaseSchema } from "../validators/purchase.validators";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/networks", requireAuth, asyncHandler(getNetworks));
router.get("/plans", requireAuth, asyncHandler(getPlans));
router.post(
  "/purchase",
  requireAuth,
  purchaseLimiter,
  validate(dataPurchaseSchema),
  asyncHandler(purchase)
);

export default router;
