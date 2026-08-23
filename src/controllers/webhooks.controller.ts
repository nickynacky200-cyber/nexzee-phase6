import { Request, Response } from "express";
import { handlePaystackWebhook } from "../services/webhooks/paystackWebhook.service";

export async function paystackWebhook(req: Request, res: Response) {
  // req.body is a raw Buffer here — see app.ts, which mounts this route
  // with express.raw() BEFORE the global express.json() middleware, since
  // signature verification needs the exact untouched bytes Paystack sent.
  const signature = req.headers["x-paystack-signature"] as string | undefined;

  const result = await handlePaystackWebhook(req.body as Buffer, signature);

  if (!result.accepted) {
    // Deliberately vague — don't help an attacker iterate on a forged signature.
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  // Always 200 quickly once accepted, per Paystack's guidance — a non-2xx
  // response causes them to retry hourly for up to 72 hours.
  res.status(200).json({ success: true });
}
