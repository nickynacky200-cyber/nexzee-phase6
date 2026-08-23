import { Router } from "express";
import authRoutes from "./auth.routes";
import walletRoutes from "./wallet.routes";
import dataRoutes from "./data.routes";
import airtimeRoutes from "./airtime.routes";
import adminRoutes from "./admin.routes";
import paymentsRoutes from "./payments.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/data", dataRoutes);
router.use("/airtime", airtimeRoutes);
router.use("/admin", adminRoutes);
router.use("/payments", paymentsRoutes);

// Note: /webhooks/paystack is mounted directly in app.ts, not here — it
// needs raw body parsing applied before the global JSON parser runs.

export default router;
