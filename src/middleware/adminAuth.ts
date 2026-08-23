import { NextFunction, Request, Response } from "express";
import { AdminRole } from "@prisma/client";
import { verifyAdminToken, AdminJwtPayload } from "../utils/adminJwt";
import { ApiError } from "../utils/ApiError";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Admin authentication required");
  }

  const token = header.split(" ")[1];

  try {
    req.admin = verifyAdminToken(token);
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired admin session");
  }
}

/** Gate sensitive actions (suspend, wallet adjustments) behind specific roles. */
export function requireAdminRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      throw new ApiError(403, "You don't have permission to perform this action");
    }
    next();
  };
}
