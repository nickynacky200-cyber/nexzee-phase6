import { WalletTransactionType, TransactionStatus } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { createPaystackCustomer, createDedicatedAccount } from "../paystack/customer.service";
import { recordWalletMovement } from "./wallet.service";
import { generateReference } from "../../utils/reference";

/**
 * Returns the user's dedicated funding account, creating it with Paystack
 * on first request (lazy provisioning — most users never fund, no reason
 * to burn through Paystack's DVA account limit for accounts that won't use it).
 *
 * IMPORTANT: Dedicated Virtual Accounts require your Paystack business to
 * have completed go-live verification for a registered NG/GH business. If
 * your business category is Financial Services / Betting / General
 * Services, Paystack also requires customer identity validation (BVN)
 * before a DVA can be assigned — that flow is NOT implemented here (it's
 * a separate, sensitive KYC step). Confirm with Paystack support which
 * category NEXZEE falls under before relying on this in production; if
 * validation is required, createDedicatedAccount will fail with a Paystack
 * error rather than silently succeed.
 */
export async function ensureFundingAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { wallet: true } });
  if (!user || !user.wallet) throw new ApiError(404, "Wallet not found");

  if (user.wallet.virtualAccountNumber) {
    return {
      bankName: user.wallet.virtualAccountBankName!,
      accountNumber: user.wallet.virtualAccountNumber!,
      // NOTE: Phase 1's schema named this field `virtualAccountReference`
      // generically; it's used here to store Paystack's `account_name`
      // (e.g. "NEXZEE - YOUNGZEE") since that's what the Fund Wallet screen
      // needs to display. Not a transaction reference despite the name —
      // worth a migration to rename if this bites someone later.
      accountName: user.wallet.virtualAccountReference!,
    };
  }

  const [firstName, ...rest] = user.fullName.trim().split(" ");
  const lastName = rest.join(" ") || firstName;

  let customerCode = user.wallet.paystackCustomerCode;

  if (!customerCode) {
    const customer = await createPaystackCustomer({
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      phone: user.phone,
    });
    customerCode = customer.customer_code;
  }

  const account = await createDedicatedAccount(customerCode, env.PAYSTACK_PREFERRED_BANK);

  const updatedWallet = await prisma.wallet.update({
    where: { id: user.wallet.id },
    data: {
      paystackCustomerCode: customerCode,
      virtualAccountBankName: account.bank.name,
      virtualAccountNumber: account.account_number,
      virtualAccountReference: account.account_name,
    },
  });

  return {
    bankName: updatedWallet.virtualAccountBankName!,
    accountNumber: updatedWallet.virtualAccountNumber!,
    accountName: updatedWallet.virtualAccountReference!,
  };
}

/**
 * Credits a wallet for a confirmed Paystack payment. Used by both the
 * webhook handler and the manual /payments/verify fallback — always goes
 * through the same atomic, idempotency-safe path.
 *
 * Idempotent at the Payment level: if this payment was already marked
 * SUCCESSFUL, does nothing. Combined with the WebhookEvent uniqueness
 * check upstream, a duplicate webhook delivery or a race between the
 * webhook and the manual verify call can't double-credit.
 */
export async function creditWalletForConfirmedPayment(params: {
  userId: string;
  paymentId: string;
  amountNaira: number;
  paystackReference: string;
}) {
  const payment = await prisma.payment.findUnique({ where: { id: params.paymentId } });
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.status === TransactionStatus.SUCCESSFUL) {
    return { alreadyProcessed: true };
  }

  const deposit = await prisma.deposit.create({
  data: {
    wallet: { connect: { userId: params.userId } },
    payment: { connect: { id: payment.id } },
    amount: params.amountNaira,
    status: TransactionStatus.SUCCESSFUL,
    reference: generateReference("DEP"),
    },
  });

  await recordWalletMovement({
    userId: params.userId,
    amount: params.amountNaira,
    type: WalletTransactionType.DEPOSIT,
    reference: `${payment.reference}-CREDIT`,
    description: "Wallet funding",
    depositId: deposit.id,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: TransactionStatus.SUCCESSFUL },
  });

  return { alreadyProcessed: false };
}
