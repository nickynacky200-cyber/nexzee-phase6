import { Prisma, TransactionStatus, WalletTransactionType } from "@prisma/client";
import { prisma } from "../../config/db";

interface ListParams {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  type?: WalletTransactionType;
}

export async function listAllTransactions({ page = 1, limit = 20, status, type }: ListParams) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const where: Prisma.WalletTransactionWhereInput = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: {
        wallet: { include: { user: { select: { fullName: true, email: true, phone: true } } } },
        order: { select: { type: true, reference: true } },
      },
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    items,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}
