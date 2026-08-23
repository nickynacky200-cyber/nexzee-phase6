import { Prisma, WalletTransactionType, OrderType } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { getWalletByUserId } from "./wallet.service";

// Maps the customer-facing filter categories from the Transactions screen
// (All / Funding / Data / Airtime / Refund / Other) onto the underlying
// ledger + order data. A wallet ledger entry alone doesn't know if a
// PURCHASE was for data or airtime — that lives on the linked Order — so
// "data"/"airtime" filters join through the order relation.
export type TransactionCategory = "all" | "funding" | "data" | "airtime" | "refund" | "other";

const VALID_CATEGORIES: TransactionCategory[] = ["all", "funding", "data", "airtime", "refund", "other"];

export function parseCategory(value: unknown): TransactionCategory {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as TransactionCategory)
    ? (value as TransactionCategory)
    : "all";
}

function categoryWhere(category: TransactionCategory): Prisma.WalletTransactionWhereInput {
  switch (category) {
    case "funding":
      return { type: WalletTransactionType.DEPOSIT };
    case "refund":
      return { type: WalletTransactionType.REFUND };
    case "data":
      return { type: WalletTransactionType.PURCHASE, order: { type: OrderType.DATA } };
    case "airtime":
      return { type: WalletTransactionType.PURCHASE, order: { type: OrderType.AIRTIME } };
    case "other":
      return {
        OR: [
          { type: WalletTransactionType.ADJUSTMENT },
          {
            type: WalletTransactionType.PURCHASE,
            order: { type: { notIn: [OrderType.DATA, OrderType.AIRTIME] } },
          },
        ],
      };
    case "all":
    default:
      return {};
  }
}

interface ListParams {
  userId: string;
  category?: TransactionCategory;
  page?: number;
  limit?: number;
}

export async function listTransactions({ userId, category = "all", page = 1, limit = 20 }: ListParams) {
  const wallet = await getWalletByUserId(userId);
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const where: Prisma.WalletTransactionWhereInput = {
    walletId: wallet.id,
    ...categoryWhere(category),
  };

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: { order: { select: { type: true, reference: true } } },
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/**
 * Full detail for a single ledger entry, scoped to reference + order items
 * (network, phone number, plan code, etc.) and the provider's own
 * reference/status. Deliberately excludes the raw Peyflex response body —
 * that's internal/audit-only, not something to hand back to a customer.
 */
export async function getTransactionDetail(userId: string, reference: string) {
  const wallet = await getWalletByUserId(userId);

  const tx = await prisma.walletTransaction.findFirst({
    where: { reference, walletId: wallet.id },
    include: {
      order: {
        include: {
          items: true,
          providerTx: { select: { providerReference: true, status: true } },
        },
      },
    },
  });

  if (!tx) {
    throw new ApiError(404, "Transaction not found");
  }

  return tx;
}
