import { OrderType, TransactionStatus } from "@prisma/client";
import { prisma } from "../../config/db";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardStats() {
  const todayStart = startOfToday();
  const sevenDaysAgo = daysAgo(6); // includes today = 7 days total

  const [
    totalUsers,
    walletBalanceAgg,
    totalTransactions,
    totalSalesAgg,
    todaySalesAgg,
    todayProfitAgg,
    pendingTransactions,
    failedTransactions,
    recentTransactions,
    recentUsers,
    salesLast7Days,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.walletTransaction.count(),
    prisma.order.aggregate({
      where: { status: TransactionStatus.SUCCESSFUL },
      _sum: { sellingPrice: true },
    }),
    prisma.order.aggregate({
      where: { status: TransactionStatus.SUCCESSFUL, createdAt: { gte: todayStart } },
      _sum: { sellingPrice: true },
    }),
    prisma.order.aggregate({
      where: { status: TransactionStatus.SUCCESSFUL, createdAt: { gte: todayStart } },
      _sum: { profit: true },
    }),
    prisma.order.count({ where: { status: TransactionStatus.PENDING } }),
    prisma.order.count({ where: { status: TransactionStatus.FAILED } }),
    prisma.walletTransaction.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { wallet: { include: { user: { select: { fullName: true, email: true } } } } },
    }),
    prisma.user.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true, phone: true, createdAt: true, wallet: { select: { balance: true } } },
    }),
    prisma.order.findMany({
      where: { status: TransactionStatus.SUCCESSFUL, createdAt: { gte: sevenDaysAgo } },
      select: { sellingPrice: true, createdAt: true },
    }),
  ]);

  // Bucket last-7-days sales by day for the dashboard chart. Fine at
  // current scale — worth moving to a raw SQL date_trunc query if the
  // orders table grows large enough for this to matter.
  const chartBuckets: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const key = daysAgo(i).toISOString().slice(0, 10);
    chartBuckets[key] = 0;
  }
  for (const order of salesLast7Days) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (key in chartBuckets) {
      chartBuckets[key] += Number(order.sellingPrice);
    }
  }

  return {
    totalUsers,
    totalWalletBalance: Number(walletBalanceAgg._sum.balance ?? 0),
    totalTransactions,
    totalSales: Number(totalSalesAgg._sum.sellingPrice ?? 0),
    todaySales: Number(todaySalesAgg._sum.sellingPrice ?? 0),
    todayProfit: Number(todayProfitAgg._sum.profit ?? 0),
    pendingTransactions,
    failedTransactions,
    recentTransactions,
    recentUsers,
    salesChart: Object.entries(chartBuckets).map(([date, total]) => ({ date, total })),
  };
}
