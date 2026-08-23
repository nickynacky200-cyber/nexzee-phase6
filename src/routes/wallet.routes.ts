import { Router } from "express";
import {
  getWallet,
  getFundingAccount,
  getTransactions,
  getTransactionByReference,
} from "../controllers/wallet.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(getWallet));
router.get("/funding-account", requireAuth, asyncHandler(getFundingAccount));
router.get("/transactions", requireAuth, asyncHandler(getTransactions));
router.get("/transactions/:reference", requireAuth, asyncHandler(getTransactionByReference));

export default router;
