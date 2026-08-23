import { WalletTransactionType } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { recordWalletMovement } from "../wallet/wallet.service";
import { createAuditLog } from "./auditLog.service";
import { generateReference } from "../../utils/reference";

export async function listUsers(search: string | undefined, page = 1, limit = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        isSuspended: true,
        createdAt: true,
        wallet: { select: { balance: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      orders: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!user) throw new ApiError(404, "User not found");

  const transactions = user.wallet
    ? await prisma.walletTransaction.findMany({
        where: { walletId: user.wallet.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return { ...user, recentTransactions: transactions };
}

export async function setUserSuspension(
  adminId: string,
  userId: string,
  suspend: boolean,
  reason: string
) {
  if (!reason || reason.trim().length < 3) {
    throw new ApiError(400, "A reason is required for this action");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: suspend },
  });

  await createAuditLog({
    adminId,
    action: suspend ? "SUSPEND_USER" : "ACTIVATE_USER",
    targetType: "User",
    targetId: userId,
    reason,
  });

  return user;
}

interface AdjustWalletInput {
  adminId: string;
  userId: string;
  amount: number;
  direction: "credit" | "debit";
  reason: string;
}

export async function adjustUserWallet({ adminId, userId, amount, direction, reason }: AdjustWalletInput) {
  if (!reason || reason.trim().length < 3) {
    throw new ApiError(400, "A reason is required for wallet adjustments");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, "Amount must be a positive number");
  }

  const reference = generateReference("ADJ");

  const movement = await recordWalletMovement({
    userId,
    amount,
    type: WalletTransactionType.ADJUSTMENT,
    direction,
    reference,
    description: `Admin ${direction === "credit" ? "credit" : "debit"} adjustment: ${reason}`,
  });

  await createAuditLog({
    adminId,
    action: direction === "credit" ? "WALLET_CREDIT_ADJUSTMENT" : "WALLET_DEBIT_ADJUSTMENT",
    targetType: "Wallet",
    targetId: userId,
    reason,
    metadata: { amount, reference, direction },
  });

  return movement;
}
