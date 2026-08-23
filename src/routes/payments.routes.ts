import { Router } from "express";
import { initialize, verify } from "../controllers/payments.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { purchaseLimiter } from "../middleware/purchaseLimiter";
import { initializePaymentSchema } from "../validators/payment.validators";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/initialize",
  requireAuth,
  purchaseLimiter,
  validate(initializePaymentSchema),
  asyncHandler(initialize)
);
router.get("/verify", requireAuth, asyncHandler(verify));

export default router;
