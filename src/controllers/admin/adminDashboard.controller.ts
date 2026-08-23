import { Request, Response } from "express";
import { getDashboardStats } from "../../services/admin/dashboardStats.service";

export async function getDashboard(_req: Request, res: Response) {
  const stats = await getDashboardStats();
  res.json({ success: true, data: stats });
}
