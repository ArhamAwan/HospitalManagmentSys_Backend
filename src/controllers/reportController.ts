import type { Request, Response } from 'express';
import { getBillingSummary, getDailyVisits, getQueueStats } from '../services/reportService';
import { fail } from '../utils/response';

export async function dailyVisits(req: Request, res: Response) {
  const { date } = req.query as { date?: string };
  if (!date) {
    return fail(res, 400, 'VALIDATION_ERROR', 'date query param is required (YYYY-MM-DD)');
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Invalid date format');
  }
  const data = await getDailyVisits(d);
  return res.json(data);
}

export async function billingSummary(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) {
    return fail(res, 400, 'VALIDATION_ERROR', 'from and to query params are required (YYYY-MM-DD)');
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Invalid from/to date format');
  }
  const data = await getBillingSummary(fromDate, toDate);
  return res.json(data);
}

export async function queueStats(req: Request, res: Response) {
  const { date } = req.query as { date?: string };
  const base = date ? new Date(date) : new Date();
  if (date && Number.isNaN(base.getTime())) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Invalid date format');
  }
  const data = await getQueueStats(base);
  return res.json(data);
}

