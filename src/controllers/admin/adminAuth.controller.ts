import { Request, Response } from "express";
import { prisma } from "../../config/db";
import { comparePassword } from "../../utils/password";
import { signAdminToken } from "../../utils/adminJwt";
import { ApiError } from "../../utils/ApiError";
import { AdminLoginInput } from "../../validators/adminAuth.validators";

export async function adminLogin(req: Request<{}, {}, AdminLoginInput>, res: Response) {
  const { email, password } = req.body;

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !admin.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const validPassword = await comparePassword(password, admin.passwordHash);
  if (!validPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signAdminToken({ adminId: admin.id, email: admin.email, role: admin.role });

  res.json({
    success: true,
    data: {
      admin: { id: admin.id, fullName: admin.fullName, email: admin.email, role: admin.role },
      token,
    },
  });
}

export async function adminMe(req: Request, res: Response) {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin!.adminId } });
  if (!admin) throw new ApiError(404, "Admin not found");

  res.json({
    success: true,
    data: { id: admin.id, fullName: admin.fullName, email: admin.email, role: admin.role },
  });
}
