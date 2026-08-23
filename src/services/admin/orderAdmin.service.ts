import { Prisma, OrderType, TransactionStatus } from "@prisma/client";
import { prisma } from "../../config/db";

interface ListParams {
  page?: number;
  limit?: number;
  type?: OrderType;
  status?: TransactionStatus;
}

export async function listOrders({ page = 1, limit = 20, type, status }: ListParams) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const where: Prisma.OrderWhereInput = {
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        items: true,
        providerTx: { select: { providerReference: true, status: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}
