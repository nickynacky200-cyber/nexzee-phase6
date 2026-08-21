import { Request, Response } from "express";
import { prisma } from "../config/db";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { RegisterInput, LoginInput } from "../validators/auth.validators";

export async function register(req: Request<{}, {}, RegisterInput>, res: Response) {
  const { fullName, email, phone, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });

  if (existing) {
    throw new ApiError(409, "An account with this email or phone already exists");
  }

  const passwordHash = await hashPassword(password);

  // Create user + wallet together — a user must never exist without a wallet.
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      passwordHash,
      wallet: {
        create: { balance: 0 },
      },
    },
    include: { wallet: true },
  });

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
      wallet: { balance: user.wallet?.balance },
      token,
    },
  });
}

export async function login(req: Request<{}, {}, LoginInput>, res: Response) {
  const { identifier, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] },
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.isSuspended) {
    throw new ApiError(403, "Your account has been suspended. Contact support.");
  }

  const validPassword = await comparePassword(password, user.passwordHash);

  if (!validPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
      token,
    },
  });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { wallet: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      wallet: { balance: user.wallet?.balance ?? 0 },
    },
  });
}
