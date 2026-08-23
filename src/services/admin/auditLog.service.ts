import { prisma } from "../../config/db";

interface CreateAuditLogInput {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      metadata: input.metadata as any,
    },
  });
}

export async function listAuditLogs(page = 1, limit = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: { admin: { select: { fullName: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return {
    items,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}
