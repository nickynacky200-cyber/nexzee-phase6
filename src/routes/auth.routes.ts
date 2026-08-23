import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/authLimiter";
import { registerSchema, loginSchema } from "../validators/auth.validators";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), asyncHandler(register));
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
