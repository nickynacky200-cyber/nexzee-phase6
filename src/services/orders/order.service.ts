import { OrderType, TransactionStatus } from "@prisma/client";
import { prisma } from "../../config/db";

interface CreateOrderInput {
  userId: string;
  type: OrderType;
  sellingPrice: number;
  reference: string;
  items: Record<string, string>; // e.g. { network: "mtn", mobile_number: "0801..." }
}

export async function createPendingOrder({ userId, type, sellingPrice, reference, items }: CreateOrderInput) {
  return prisma.order.create({
    data: {
      userId,
      type,
      status: TransactionStatus.PENDING,
      sellingPrice,
      reference,
      items: {
        create: Object.entries(items).map(([key, value]) => ({ key, value: String(value) })),
      },
    },
  });
}

export async function markOrderStatus(
  orderId: string,
  status: TransactionStatus,
  extra?: { providerCost?: number; profit?: number }
) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(extra?.providerCost !== undefined ? { providerCost: extra.providerCost } : {}),
      ...(extra?.profit !== undefined ? { profit: extra.profit } : {}),
    },
  });
}

export async function attachProviderTransaction(
  orderId: string,
  data: {
    providerReference?: string;
    providerTxId?: string;
    status?: string;
    rawResponse: unknown;
  }
) {
  return prisma.providerTransaction.create({
    data: {
      orderId,
      provider: "peyflex",
      providerReference: data.providerReference,
      providerTxId: data.providerTxId,
      status: data.status,
      rawResponse: data.rawResponse as any,
    },
  });
}

export async function getOrderWithDetails(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, providerTx: true, walletTx: true },
  });
}
