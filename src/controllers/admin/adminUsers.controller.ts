import { Request, Response } from "express";
import {
  listUsers,
  getUserDetail,
  setUserSuspension,
  adjustUserWallet,
} from "../../services/admin/userAdmin.service";
import { SuspendUserInput, AdjustWalletInput } from "../../validators/adminUsers.validators";

export async function list(req: Request, res: Response) {
  const search = req.query.search as string | undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const result = await listUsers(search, page, limit);
  res.json({ success: true, data: result.items, pagination: result.pagination });
}

export async function detail(req: Request, res: Response) {
  const user = await getUserDetail(req.params.id);
  res.json({ success: true, data: user });
}

export async function suspend(req: Request<{ id: string }, {}, SuspendUserInput>, res: Response) {
  const { suspend: shouldSuspend, reason } = req.body;
  const user = await setUserSuspension(req.admin!.adminId, req.params.id, shouldSuspend, reason);
  res.json({ success: true, data: user });
}

export async function adjustWallet(req: Request<{ id: string }, {}, AdjustWalletInput>, res: Response) {
  const { amount, direction, reason } = req.body;

  const movement = await adjustUserWallet({
    adminId: req.admin!.adminId,
    userId: req.params.id,
    amount,
    direction,
    reason,
  });

  res.json({ success: true, data: movement });
}
