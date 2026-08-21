import { Router } from "express";
import {
  getWallet,
  getTransactions,
  getTransactionByReference,
} from "../controllers/wallet.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(getWallet));
router.get("/transactions", requireAuth, asyncHandler(getTransactions));
router.get("/transactions/:reference", requireAuth, asyncHandler(getTransactionByReference));

export default router;
