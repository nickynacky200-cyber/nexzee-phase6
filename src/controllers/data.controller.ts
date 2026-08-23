import { Request, Response } from "express";
import { PeyflexData } from "../services/peyflex";
import { purchaseData } from "../services/orders/dataPurchase.service";
import { DataPurchaseInput } from "../validators/purchase.validators";
import { ApiError } from "../utils/ApiError";

export async function getNetworks(_req: Request, res: Response) {
  const networks = await PeyflexData.getDataNetworks();
  res.json({ success: true, data: networks });
}

export async function getPlans(req: Request, res: Response) {
  const network = req.query.network as string | undefined;
  if (!network) {
    throw new ApiError(400, "network query parameter is required");
  }
  const plans = await PeyflexData.getDataPlans(network);
  res.json({ success: true, data: plans });
}

export async function purchase(req: Request<{}, {}, DataPurchaseInput>, res: Response) {
  const { network, mobile_number, plan_code } = req.body;

  const result = await purchaseData({
    userId: req.user!.userId,
    network,
    mobileNumber: mobile_number,
    planCode: plan_code,
  });

  const statusCode = result.outcome === "successful" ? 200 : result.outcome === "pending" ? 202 : 402;

  res.status(statusCode).json({
    success: result.outcome === "successful",
    outcome: result.outcome,
    message:
      result.outcome === "successful"
        ? "Data purchase successful"
        : (result as any).message,
    data: { orderId: result.orderId, reference: result.reference },
  });
}
