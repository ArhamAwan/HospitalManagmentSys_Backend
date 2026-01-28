import type { Request, Response } from 'express';
import { fail } from '../utils/response';
import * as paymentService from '../services/paymentService';

export async function recordPayment(req: Request, res: Response) {
  const result = await paymentService.recordPayment(req.body);
  if ('error' in result) {
    if (result.error === 'VISIT_NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Visit not found');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to record payment');
  }
  return res.status(201).json({
    ...result.payment,
    createdAt: result.payment.createdAt.toISOString()
  });
}

export async function getPayment(req: Request, res: Response) {
  const { visitId } = req.params;
  const payment = await paymentService.getPaymentByVisitId(visitId);
  if (!payment) return fail(res, 404, 'NOT_FOUND', 'Payment not found');
  return res.json({
    ...payment,
    createdAt: payment.createdAt.toISOString()
  });
}

