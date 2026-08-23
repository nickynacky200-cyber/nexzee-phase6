import { Request, Response } from "express";
import { TransactionStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { initializeTransaction, verifyTransaction } from "../services/paystack/transaction.service";
import { creditWalletForConfirmedPayment } from "../services/wallet/funding.service";
import { generateReference } from "../utils/reference";
import { ApiError } from "../utils/ApiError";
import { InitializePaymentInput } from "../validators/payment.validators";

export async function initialize(req: Request<{}, {}, InitializePaymentInput>, res: Response) {
  const { amount } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new ApiError(404, "User not found");

  const reference = generateReference("PAY");

  await prisma.payment.create({
    data: {
      userId: user.id,
      provider: "paystack",
      reference,
      amount,
      status: TransactionStatus.PENDING,
    },
  });

  const result = await initializeTransaction({
    email: user.email,
    amountKobo: Math.round(amount * 100),
    reference,
    callback_url: env.PAYSTACK_CALLBACK_URL,
  });

  res.json({
    success: true,
    data: {
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    },
  });
}

/**
 * Manual fallback for immediate UI feedback when the user's browser
 * completes the Paystack redirect. The webhook remains the source of
 * truth — this just lets the frontend show "funded" without waiting on
 * webhook delivery latency. Goes through the same idempotent credit path,
 * so whichever of the two (webhook or this) arrives first wins; the second
 * is a safe no-op.
 */
export async function verify(req: Request, res: Response) {
  const reference = req.query.reference as string | undefined;
  if (!reference) throw new ApiError(400, "reference query parameter is required");

  const payment = await prisma.payment.findFirst({
    where: { reference, userId: req.user!.userId },
  });
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.status === TransactionStatus.SUCCESSFUL) {
    return res.json({ success: true, data: { status: "successful", alreadyProcessed: true } });
  }

  const result = await verifyTransaction(reference);
  const paystackData = result.data;

  if (paystackData.status !== "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: TransactionStatus.FAILED },
    });
    return res.json({ success: false, data: { status: paystackData.status } });
  }

  // Never trust the stored amount alone — cross-check against what
  // Paystack actually confirms was paid before crediting.
  const paidNaira = paystackData.amount / 100;
  if (Math.abs(paidNaira - Number(payment.amount)) > 0.01) {
    throw new ApiError(409, "Payment amount mismatch — contact support");
  }

  await creditWalletForConfirmedPayment({
    userId: req.user!.userId,
    paymentId: payment.id,
    amountNaira: paidNaira,
    paystackReference: reference,
  });

  res.json({ success: true, data: { status: "successful", alreadyProcessed: false } });
}
