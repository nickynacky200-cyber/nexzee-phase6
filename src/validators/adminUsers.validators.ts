import { z } from "zod";

export const suspendUserSchema = z.object({
  suspend: z.boolean(),
  reason: z.string().trim().min(3, "A reason of at least 3 characters is required"),
});

export const adjustWalletSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero").max(10_000_000, "Amount too large"),
  direction: z.enum(["credit", "debit"]),
  reason: z.string().trim().min(3, "A reason of at least 3 characters is required"),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type AdjustWalletInput = z.infer<typeof adjustWalletSchema>;
