import { Router } from "express";
import authRoutes from "./auth.routes";
import walletRoutes from "./wallet.routes";
import dataRoutes from "./data.routes";
import airtimeRoutes from "./airtime.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/data", dataRoutes);
router.use("/airtime", airtimeRoutes);

// Phase 3: Paystack webhooks
// Phase 7: admin routes

export default router;
