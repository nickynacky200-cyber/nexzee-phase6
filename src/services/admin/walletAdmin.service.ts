import { WalletTransactionType } from "@prisma/client";
import { prisma } from "../../config/db";

export async function listWallets(search: string | undefined, page = 1, limit = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const where = search
    ? {
        user: {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        },
      }
    : {};

  const [wallets, total] = await Promise.all([
    prisma.wallet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: { user: { select: { fullName: true, email: true, phone: true } } },
    }),
    prisma.wallet.count({ where }),
  ]);

  // Single grouped query for deposits/spending across this page of wallets,
  // rather than N+1 per-wallet queries.
  const walletIds = wallets.map((w) => w.id);
  const grouped = walletIds.length
    ? await prisma.walletTransaction.groupBy({
        by: ["walletId", "type"],
        where: { walletId: { in: walletIds } },
        _sum: { amount: true },
      })
    : [];

  const totalsByWallet: Record<string, { deposits: number; spending: number }> = {};
  for (const id of walletIds) totalsByWallet[id] = { deposits: 0, spending: 0 };

  for (const row of grouped) {
    const sum = Number(row._sum.amount ?? 0);
    if (row.type === WalletTransactionType.DEPOSIT) {
      totalsByWallet[row.walletId].deposits += sum;
    } else if (row.type === WalletTransactionType.PURCHASE) {
      totalsByWallet[row.walletId].spending += sum;
    }
  }

  const items = wallets.map((w) => ({
    id: w.id,
    balance: w.balance,
    user: w.user,
    totalDeposits: totalsByWallet[w.id]?.deposits ?? 0,
    totalSpending: totalsByWallet[w.id]?.spending ?? 0,
    // wallet.updatedAt changes on every balance-affecting movement, so it's
    // an accurate proxy for "last activity" without an extra per-wallet query.
    lastActivity: w.updatedAt,
  }));

  return {
    items,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}
