import { Prisma, WalletTransactionType, TransactionStatus } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";

interface LedgerEntryInput {
  userId: string;
  amount: number; // always positive; direction is determined by `type`
  type: WalletTransactionType;
  reference: string;
  description?: string;
  orderId?: string;
  status?: TransactionStatus;
}

/**
 * The ONLY function in the codebase allowed to change a wallet balance.
 * Every call is atomic (single DB transaction) and uses `SELECT ... FOR UPDATE`
 * (via Prisma's transaction + row lock pattern) to prevent two simultaneous
 * requests from double-spending the same balance.
 *
 * DEPOSIT / REFUND  -> increases balance
 * PURCHASE          -> decreases balance (throws if insufficient funds)
 * ADJUSTMENT        -> can go either way; amount sign determines direction
 */
export async function recordWalletMovement({
  userId,
  amount,
  type,
  reference,
  description,
  orderId,
  status = TransactionStatus.SUCCESSFUL,
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
    const isCredit = type === "DEPOSIT" || type === "REFUND";
    const isDebit = type === "PURCHASE";

    let balanceAfter: Prisma.Decimal;

    if (isCredit) {
      balanceAfter = balanceBefore.plus(amount);
    } else if (isDebit) {
      if (balanceBefore.lessThan(amount)) {
        throw new ApiError(400, "Insufficient wallet balance");
      }
      balanceAfter = balanceBefore.minus(amount);
    } else {
      // ADJUSTMENT — caller is responsible for correctness; used by admin flows
      balanceAfter = balanceBefore.plus(amount);
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
