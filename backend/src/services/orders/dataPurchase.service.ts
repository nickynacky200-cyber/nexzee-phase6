import axios from "axios";
import { OrderType, TransactionStatus, WalletTransactionType } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { generateReference } from "../../utils/reference";
import { recordWalletMovement } from "../wallet/wallet.service";
import { createPendingOrder, markOrderStatus, attachProviderTransaction } from "./order.service";
import { PeyflexData } from "../peyflex";

interface PurchaseDataInput {
  userId: string;
  network: string; // network identifier from getDataNetworks()
  mobileNumber: string;
  planCode: string;
}

export type PurchaseOutcome =
  | { outcome: "successful"; orderId: string; reference: string }
  | { outcome: "failed"; orderId: string; reference: string; message: string }
  | { outcome: "pending"; orderId: string; reference: string; message: string };

export async function purchaseData({
  userId,
  network,
  mobileNumber,
  planCode,
}: PurchaseDataInput): Promise<PurchaseOutcome> {
  // 1. NEVER trust a client-sent price. Look up the real plan price from
  //    Peyflex right now, server-side, and use that as the selling price.
  const plans = await PeyflexData.getDataPlans(network);
  const plan = plans.find((p) => p.plan_code === planCode);

  if (!plan) {
    throw new ApiError(400, "Selected data plan is no longer available. Please refresh and try again.");
  }

  const sellingPrice = Number(plan.amount);
  if (!sellingPrice || sellingPrice <= 0) {
    throw new ApiError(500, "Could not determine plan price. Please try again shortly.");
  }

  const reference = generateReference("DA");

  const order = await createPendingOrder({
    userId,
    type: OrderType.DATA,
    sellingPrice,
    reference,
    items: { network, mobile_number: mobileNumber, plan_code: planCode },
  });

  // 2. Reserve funds BEFORE calling the provider. If this throws
  //    (insufficient balance), the order is marked FAILED and nothing is
  //    ever sent to Peyflex — money is never at risk of being spent twice.
  try {
    await recordWalletMovement({
      userId,
      amount: sellingPrice,
      type: WalletTransactionType.PURCHASE,
      reference: `${reference}-DEBIT`,
      description: `Data purchase — ${network.toUpperCase()} ${plan.label ?? planCode}`,
      orderId: order.id,
    });
  } catch (err) {
    await markOrderStatus(order.id, TransactionStatus.FAILED);
    throw err; // bubbles up as the ApiError thrown by recordWalletMovement (e.g. insufficient balance)
  }

  // 3. Call Peyflex. Three distinct outcomes matter here:
  //      - definite success  -> keep the debit, mark order successful
  //      - definite failure  -> refund immediately, mark order failed
  //      - no response at all (timeout/network error) -> DO NOT refund.
  //        We genuinely don't know if Peyflex delivered the data. Leave
  //        the order PENDING for manual/automated reconciliation.
  try {
    const response = await PeyflexData.purchaseData({
      network,
      mobile_number: mobileNumber,
      plan_code: planCode,
    });

    await attachProviderTransaction(order.id, {
      providerReference: response.reference,
      status: response.status,
      rawResponse: response,
    });

    if (response.status === "SUCCESS") {
      await markOrderStatus(order.id, TransactionStatus.SUCCESSFUL);
      return { outcome: "successful", orderId: order.id, reference };
    }

    // Peyflex responded, but not with success — refund now.
    await refundOrder(userId, order.id, reference, sellingPrice, "Data purchase failed");
    return {
      outcome: "failed",
      orderId: order.id,
      reference,
      message: response.message ?? "Data purchase failed. Your wallet has been refunded.",
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      // Peyflex returned an error response (4xx/5xx) — definite failure, refund.
      await attachProviderTransaction(order.id, {
        status: "ERROR",
        rawResponse: err.response.data,
      });
      await refundOrder(userId, order.id, reference, sellingPrice, "Data purchase failed");
      return {
        outcome: "failed",
        orderId: order.id,
        reference,
        message: "Data purchase failed. Your wallet has been refunded.",
      };
    }

    // Network/timeout error — no response from Peyflex at all. Don't refund.
    await markOrderStatus(order.id, TransactionStatus.PENDING);
    return {
      outcome: "pending",
      orderId: order.id,
      reference,
      message:
        "We couldn't confirm this purchase due to a network issue. It's being processed — check your transaction history shortly before retrying.",
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
