import { prisma } from '../config/database';

export type AuditDetails = Record<string, unknown>;

export async function logUserAudit(options: {
  userId: string;
  actorId?: string;
  action: string;
  details?: AuditDetails;
}) {
  const { userId, actorId, action, details } = options;
  await prisma.userAuditLog.create({
    data: {
      userId,
      actorId,
      action,
      details: details as any
    }
  });
}

export async function listAuditLogs(params: {
  take?: number;
  skip?: number;
  userId?: string;
  actorId?: string;
  action?: string;
}) {
  const { take = 50, skip = 0, userId, actorId, action } = params;

  const where: any = {};
  if (userId) where.userId = userId;
  if (actorId) where.actorId = actorId;
  if (action) where.action = action;

  const [items, total] = await Promise.all([
    prisma.userAuditLog.findMany({
      where,
      include: {
        user: true,
        actor: true
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip
    }),
    prisma.userAuditLog.count({ where })
  ]);

  return {
    total,
    items
  };
}

