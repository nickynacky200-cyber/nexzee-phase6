import { TransactionStatus } from "@prisma/client";
import { prisma } from "../../config/db";
import { verifyPaystackSignature } from "../paystack/webhookSignature";
import { creditWalletForConfirmedPayment } from "../wallet/funding.service";
import { generateReference } from "../../utils/reference";

/**
 * Processes an incoming Paystack webhook. Returns quickly and does no
 * external calls — just DB writes — so we comfortably beat Paystack's
 * response-time expectations.
 *
 * Idempotency: a Prisma unique constraint on WebhookEvent.eventId is the
 * actual safety net here, not application logic. If two identical webhook
 * deliveries race each other, the database — not a race-prone read-then-
 * write check in JS — is what guarantees only one gets processed.
 */
export async function handlePaystackWebhook(rawBody: Buffer, signatureHeader: string | undefined) {
  if (!verifyPaystackSignature(rawBody, signatureHeader)) {
    return { accepted: false, reason: "invalid_signature" as const };
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const eventId = String(event?.data?.id ?? event?.data?.reference ?? generateReference("EVT"));

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "paystack",
        eventId,
        eventType: event.event,
        payload: event,
      },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      // Unique constraint violation — we've already seen and processed
      // this exact event. Acknowledge without reprocessing.
      return { accepted: true, duplicate: true as const };
    }
    throw err;
  }

  if (event.event === "charge.success") {
    await processChargeSuccess(event.data);
  }
  // Other event types (dedicatedaccount.assign.success, etc.) are recorded
  // above for audit purposes but don't need separate handling — our DVA
  // creation call is synchronous, so we don't rely on that event to know
  // when an account is ready.

  await prisma.webhookEvent.update({
    where: { eventId },
    data: { processedAt: new Date() },
  });

  return { accepted: true, duplicate: false as const };
}

async function processChargeSuccess(data: any) {
  if (data.status !== "success") return;

  const amountNaira = Number(data.amount) / 100; // Paystack amounts are in kobo
  const reference = data.reference as string;

  // Path 1: this reference matches a Payment we created via
  // POST /api/payments/initialize (card checkout flow).
  const existingPayment = await prisma.payment.findUnique({
    where: { reference },
    include: { user: true },
  });

  if (existingPayment) {
    await creditWalletForConfirmedPayment({
      userId: existingPayment.userId,
      paymentId: existingPayment.id,
      amountNaira,
      paystackReference: reference,
    });
    return;
  }

  // Path 2: no matching Payment record — this must be an inbound bank
  // transfer to a dedicated virtual account, which we never initiated a
  // Payment row for. Attribute it by Paystack customer_code, which every
  // wallet with a provisioned funding account has stored.
  const customerCode = data.customer?.customer_code;
  if (!customerCode) return; // can't safely attribute — skip rather than guess

  const wallet = await prisma.wallet.findFirst({ where: { paystackCustomerCode: customerCode } });
  if (!wallet) return;

  const payment = await prisma.payment.create({
    data: {
      userId: wallet.userId,
      provider: "paystack",
      reference,
      amount: amountNaira,
      status: TransactionStatus.PENDING, // creditWalletForConfirmedPayment flips this to SUCCESSFUL
      rawPayload: data,
    },
  });

  await creditWalletForConfirmedPayment({
    userId: wallet.userId,
    paymentId: payment.id,
    amountNaira,
    paystackReference: reference,
  });
}
