import { z } from "zod";

export const initializePaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero").max(1_000_000, "Amount too large"),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;
