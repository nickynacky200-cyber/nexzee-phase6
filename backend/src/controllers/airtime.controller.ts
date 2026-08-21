import { Request, Response } from "express";
import { PeyflexAirtime } from "../services/peyflex";
import { purchaseAirtime } from "../services/orders/airtimePurchase.service";
import { AirtimePurchaseInput } from "../validators/purchase.validators";

export async function getNetworks(_req: Request, res: Response) {
  const networks = await PeyflexAirtime.getAirtimeNetworks();
  res.json({ success: true, data: networks });
}

export async function purchase(req: Request<{}, {}, AirtimePurchaseInput>, res: Response) {
  const { network, mobile_number, amount } = req.body;

  const result = await purchaseAirtime({
    userId: req.user!.userId,
    network,
    mobileNumber: mobile_number,
    amount,
  });

  const statusCode = result.outcome === "successful" ? 200 : result.outcome === "pending" ? 202 : 402;

  res.status(statusCode).json({
    success: result.outcome === "successful",
    outcome: result.outcome,
    message:
      result.outcome === "successful"
        ? "Airtime top-up successful"
        : (result as any).message,
    data: { orderId: result.orderId, reference: result.reference },
  });
}
