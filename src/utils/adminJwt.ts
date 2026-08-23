import jwt from "jsonwebtoken";
import { AdminRole } from "@prisma/client";
import { env } from "../config/env";

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  scope: "admin"; // discriminator — a customer token will never have this
}

export function signAdminToken(payload: Omit<AdminJwtPayload, "scope">): string {
  return jwt.sign({ ...payload, scope: "admin" }, env.JWT_SECRET, { expiresIn: "12h" });
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
  if (decoded.scope !== "admin" || !decoded.adminId) {
    throw new Error("Not an admin token");
  }
  return decoded;
}
