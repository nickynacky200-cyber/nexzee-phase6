import { z } from "zod";

const nigerianPhone = z
  .string()
  .trim()
  .regex(/^0[789][01]\d{8}$/, "Enter a valid Nigerian phone number");

export const dataPurchaseSchema = z.object({
  network: z.string().trim().min(1, "Network is required"),
  mobile_number: nigerianPhone,
  plan_code: z.string().trim().min(1, "Plan is required"),
});

export const airtimePurchaseSchema = z.object({
  network: z.string().trim().min(1, "Network is required"),
  mobile_number: nigerianPhone,
  amount: z.coerce.number().positive("Amount must be greater than zero"),
});

export type DataPurchaseInput = z.infer<typeof dataPurchaseSchema>;
export type AirtimePurchaseInput = z.infer<typeof airtimePurchaseSchema>;
