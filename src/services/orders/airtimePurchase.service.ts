import axios from "axios";
import { OrderType, TransactionStatus, WalletTransactionType } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { generateReference } from "../../utils/reference";
import { recordWalletMovement } from "../wallet/wallet.service";
import { createPendingOrder, markOrderStatus, attachProviderTransaction } from "./order.service";
import { PeyflexAirtime } from "../peyflex";
import { PurchaseOutcome } from "./dataPurchase.service";

const MIN_AIRTIME_AMOUNT = 50;
const MAX_AIRTIME_AMOUNT = 50_000;

interface PurchaseAirtimeInput {
  userId: string;
  network: string;
  mobileNumber: string;
  amount: number;
}

export async function purchaseAirtime({
  userId,
  network,
  mobileNumber,
  amount,
}: PurchaseAirtimeInput): Promise<PurchaseOutcome> {
  // Airtime amount is inherently user-chosen (unlike data plan pricing,
  // there's no catalog to validate against), but we still bound it
  // server-side rather than trusting an arbitrary client value outright.
  if (!Number.isFinite(amount) || amount < MIN_AIRTIME_AMOUNT || amount > MAX_AIRTIME_AMOUNT) {
    throw new ApiError(400, `Amount must be between ₦${MIN_AIRTIME_AMOUNT} and ₦${MAX_AIRTIME_AMOUNT}`);
  }

  const sellingPrice = amount;
  const reference = generateReference("AT");

  const order = await createPendingOrder({
    userId,
    type: OrderType.AIRTIME,
    sellingPrice,
    reference,
    items: { network, mobile_number: mobileNumber, amount: String(amount) },
  });

  try {
    await recordWalletMovement({
      userId,
      amount: sellingPrice,
      type: WalletTransactionType.PURCHASE,
      reference: `${reference}-DEBIT`,
      description: `Airtime top-up — ${network.toUpperCase()}`,
      orderId: order.id,
    });
  } catch (err) {
    await markOrderStatus(order.id, TransactionStatus.FAILED);
    throw err;
  }

  try {
    const response = await PeyflexAirtime.purchaseAirtime({
      network,
      amount,
      mobile_number: mobileNumber,
    });

    await attachProviderTransaction(order.id, {
      providerReference: response.reference,
      providerTxId: String(response.transaction_id),
      status: response.status,
      rawResponse: response,
    });

    if (response.status === "SUCCESS") {
      // `charged` is what Peyflex actually deducted from NEXZEE's own
      // Peyflex balance (their cost to us); the difference from the face
      // value the customer paid is our margin.
      const providerCost = Number(response.charged);
      const profit = Number.isFinite(providerCost) ? sellingPrice - providerCost : undefined;

      await markOrderStatus(order.id, TransactionStatus.SUCCESSFUL, {
        providerCost: Number.isFinite(providerCost) ? providerCost : undefined,
        profit,
      });
      return { outcome: "successful", orderId: order.id, reference };
    }

    await refundOrder(userId, order.id, reference, sellingPrice, "Airtime top-up failed");
    return {
      outcome: "failed",
      orderId: order.id,
      reference,
      message: response.message ?? "Airtime top-up failed. Your wallet has been refunded.",
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      await attachProviderTransaction(order.id, {
        status: "ERROR",
        rawResponse: err.response.data,
      });
      await refundOrder(userId, order.id, reference, sellingPrice, "Airtime top-up failed");
      return {
        outcome: "failed",
        orderId: order.id,
        reference,
        message: "Airtime top-up failed. Your wallet has been refunded.",
      };
    }

    await markOrderStatus(order.id, TransactionStatus.PENDING);
    return {
      outcome: "pending",
      orderId: order.id,
      reference,
      message:
        "We couldn't confirm this top-up due to a network issue. It's being processed — check your transaction history shortly before retrying.",
    };
  }
}

async function refundOrder(
  userId: string,
  orderId: string,
  reference: string,
  amount: number,
  description: string
) {
  await recordWalletMovement({
    userId,
    amount,
    type: WalletTransactionType.REFUND,
    reference: `${reference}-REFUND`,
    description,
    orderId,
  });
  await markOrderStatus(orderId, TransactionStatus.FAILED);
}
