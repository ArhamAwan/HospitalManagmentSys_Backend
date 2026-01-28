import type { Request, Response } from 'express';
import { listAuditLogs } from '../services/auditService';

export async function listLogs(req: Request, res: Response) {
  const { page = '1', pageSize = '50', userId, actorId, action } = req.query as {
    page?: string;
    pageSize?: string;
    userId?: string;
    actorId?: string;
    action?: string;
  };

  const take = Math.min(200, Math.max(1, Number(pageSize) || 50));
  const pageNum = Math.max(1, Number(page) || 1);
  const skip = (pageNum - 1) * take;

  const result = await listAuditLogs({
    take,
    skip,
    userId,
    actorId,
    action
  });

  return res.json({
    total: result.total,
    page: pageNum,
    pageSize: take,
    items: result.items.map((log) => ({
      id: log.id,
      userId: log.userId,
      userUsername: log.user.username,
      actorId: log.actorId,
      actorUsername: log.actor?.username ?? null,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt.toISOString()
    }))
  });
}

