import { Router } from "express";
import { AdminRole } from "@prisma/client";
import { adminLogin, adminMe } from "../controllers/admin/adminAuth.controller";
import { getDashboard } from "../controllers/admin/adminDashboard.controller";
import {
  list as listUsers,
  detail as userDetail,
  suspend as suspendUser,
  adjustWallet,
} from "../controllers/admin/adminUsers.controller";
import {
  getTransactions,
  getOrders,
  getWallets,
  getAuditLogs,
} from "../controllers/admin/adminReadOnly.controller";
import { requireAdminAuth, requireAdminRole } from "../middleware/adminAuth";
import { adminLoginLimiter } from "../middleware/adminLoginLimiter";
import { validate } from "../middleware/validate";
import { adminLoginSchema } from "../validators/adminAuth.validators";
import { suspendUserSchema, adjustWalletSchema } from "../validators/adminUsers.validators";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Auth — login is the only public admin route. There is no public admin
// registration; the first SUPER_ADMIN is created via `npm run prisma:seed`.
router.post("/auth/login", adminLoginLimiter, validate(adminLoginSchema), asyncHandler(adminLogin));
router.get("/auth/me", requireAdminAuth, asyncHandler(adminMe));

// Everything below requires a valid admin session.
router.use(requireAdminAuth);

router.get("/dashboard", asyncHandler(getDashboard));

router.get("/users", asyncHandler(listUsers));
router.get("/users/:id", asyncHandler(userDetail));
// Suspending accounts and moving money manually are gated to
// SUPER_ADMIN/ADMIN — SUPPORT role is read-only.
router.patch(
  "/users/:id/suspend",
  requireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN),
  validate(suspendUserSchema),
  asyncHandler(suspendUser)
);
router.post(
  "/users/:id/adjust-wallet",
  requireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN),
  validate(adjustWalletSchema),
  asyncHandler(adjustWallet)
);

router.get("/transactions", asyncHandler(getTransactions));
router.get("/orders", asyncHandler(getOrders)); // "Data Sales" screen
router.get("/wallets", asyncHandler(getWallets));
router.get("/audit-logs", asyncHandler(getAuditLogs));

export default router;
