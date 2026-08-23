import { Request, Response } from "express";
import { getWalletByUserId } from "../services/wallet/wallet.service";
import { ensureFundingAccount } from "../services/wallet/funding.service";
import {
  listTransactions,
  getTransactionDetail,
  parseCategory,
} from "../services/wallet/transactionHistory.service";

export async function getWallet(req: Request, res: Response) {
  const wallet = await getWalletByUserId(req.user!.userId);
  res.json({
    success: true,
    data: {
      balance: wallet.balance,
      virtualAccountBankName: wallet.virtualAccountBankName,
      virtualAccountNumber: wallet.virtualAccountNumber,
    },
  });
}

/**
 * GET /api/wallet/funding-account
 * Lazily provisions a Paystack dedicated virtual account on first call.
 */
export async function getFundingAccount(req: Request, res: Response) {
  const account = await ensureFundingAccount(req.user!.userId);
  res.json({ success: true, data: account });
}

/**
 * GET /api/wallet/transactions?type=all|funding|data|airtime|refund|other&page=1&limit=20
 * Backs the Transactions screen's filter tabs + pagination.
 */
export async function getTransactions(req: Request, res: Response) {
  const category = parseCategory(req.query.type);
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const result = await listTransactions({
    userId: req.user!.userId,
    category,
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 20,
  });

  res.json({ success: true, data: result.items, pagination: result.pagination });
}

/** GET /api/wallet/transactions/:reference */
export async function getTransactionByReference(req: Request, res: Response) {
  const tx = await getTransactionDetail(req.user!.userId, req.params.reference);
  res.json({ success: true, data: tx });
}
