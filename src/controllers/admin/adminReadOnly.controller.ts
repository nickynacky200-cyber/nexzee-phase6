import { Request, Response } from "express";
import { TransactionStatus, WalletTransactionType, OrderType } from "@prisma/client";
import { listAllTransactions } from "../../services/admin/transactionAdmin.service";
import { listOrders } from "../../services/admin/orderAdmin.service";
import { listWallets } from "../../services/admin/walletAdmin.service";
import { listAuditLogs } from "../../services/admin/auditLog.service";

function parsePage(req: Request) {
  return {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  };
}

export async function getTransactions(req: Request, res: Response) {
  const { page, limit } = parsePage(req);
  const status = req.query.status as TransactionStatus | undefined;
  const type = req.query.type as WalletTransactionType | undefined;

  const result = await listAllTransactions({ page, limit, status, type });
  res.json({ success: true, data: result.items, pagination: result.pagination });
}

export async function getOrders(req: Request, res: Response) {
  const { page, limit } = parsePage(req);
  const type = req.query.type as OrderType | undefined;
  const status = req.query.status as TransactionStatus | undefined;

  const result = await listOrders({ page, limit, type, status });
  res.json({ success: true, data: result.items, pagination: result.pagination });
}

export async function getWallets(req: Request, res: Response) {
  const { page, limit } = parsePage(req);
  const search = req.query.search as string | undefined;

  const result = await listWallets(search, page, limit);
  res.json({ success: true, data: result.items, pagination: result.pagination });
}

export async function getAuditLogs(req: Request, res: Response) {
  const { page, limit } = parsePage(req);
  const result = await listAuditLogs(page, limit);
  res.json({ success: true, data: result.items, pagination: result.pagination });
}
