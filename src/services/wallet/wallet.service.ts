import { Prisma, WalletTransactionType, TransactionStatus } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";

interface LedgerEntryInput {
  userId: string;
  amount: number; // always positive
  type: WalletTransactionType;
  reference: string;
  description?: string;
  orderId?: string;
  depositId?: string;
  status?: TransactionStatus;
  /** Only consulted for ADJUSTMENT — DEPOSIT/REFUND always credit, PURCHASE always debits. */
  direction?: "credit" | "debit";
}

/**
 * The ONLY function in the codebase allowed to change a wallet balance.
 * Every call is atomic (single DB transaction) and uses `SELECT ... FOR UPDATE`
 * (via Prisma's transaction + row lock pattern) to prevent two simultaneous
 * requests from double-spending the same balance.
 *
 * DEPOSIT / REFUND  -> increases balance
 * PURCHASE          -> decreases balance (throws if insufficient funds)
 * ADJUSTMENT        -> direction param decides credit vs debit; used by admin
 *                       manual corrections. Debit adjustments still check
 *                       for sufficient balance, same as a purchase.
 */
export async function recordWalletMovement({
  userId,
  amount,
  type,
  reference,
  description,
  orderId,
  depositId,
  status = TransactionStatus.SUCCESSFUL,
  direction = "credit",
}: LedgerEntryInput) {
  if (amount <= 0) {
    throw new ApiError(400, "Wallet movement amount must be positive");
  }

  return prisma.$transaction(async (tx) => {
    // Lock the wallet row for the duration of this transaction so concurrent
    // requests (e.g. two purchases firing at once) can't both read the same
    // stale balance.
    const wallet = await tx.$queryRaw<
      { id: string; balance: Prisma.Decimal }[]
    >`SELECT id, balance FROM wallets WHERE "userId" = ${userId} FOR UPDATE`;

    const walletRow = wallet[0];
    if (!walletRow) {
      throw new ApiError(404, "Wallet not found");
    }

    const balanceBefore = new Prisma.Decimal(walletRow.balance);
    const isCredit = type === "DEPOSIT" || type === "REFUND" || (type === "ADJUSTMENT" && direction === "credit");
    const isDebit = type === "PURCHASE" || (type === "ADJUSTMENT" && direction === "debit");

    let balanceAfter: Prisma.Decimal;

    if (isDebit) {
      if (balanceBefore.lessThan(amount)) {
        throw new ApiError(400, "Insufficient wallet balance");
      }
      balanceAfter = balanceBefore.minus(amount);
    } else if (isCredit) {
      balanceAfter = balanceBefore.plus(amount);
    } else {
      // Should be unreachable given the enum, but fail loudly rather than
      // silently picking a direction for a money-moving operation.
      throw new ApiError(500, "Could not determine wallet movement direction");
    }

    await tx.wallet.update({
      where: { id: walletRow.id },
      data: { balance: balanceAfter },
    });

    const ledgerEntry = await tx.walletTransaction.create({
      data: {
        walletId: walletRow.id,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        reference,
        status,
        description,
        orderId,
        depositId,
      },
    });

    return ledgerEntry;
  });
}

export async function getWalletByUserId(userId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new ApiError(404, "Wallet not found");
  return wallet;
}

export async function getWalletTransactions(userId: string, limit = 50) {
  const wallet = await getWalletByUserId(userId);
  return prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
