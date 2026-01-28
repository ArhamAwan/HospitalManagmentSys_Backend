import type { Request, Response } from 'express';
import { fail } from '../utils/response';
import * as procedureOrderService from '../services/procedureOrderService';

export async function createProcedureOrder(req: Request, res: Response) {
  const { visitId, procedureId, notes } = req.body as {
    visitId: string;
    procedureId: string;
    notes?: string;
  };

  if (!visitId || !procedureId) {
    return fail(res, 400, 'VALIDATION_ERROR', 'visitId and procedureId are required');
  }

  const result = await procedureOrderService.createProcedureOrder({ visitId, procedureId, notes });
  if ('error' in result) {
    if (result.error === 'VISIT_NOT_FOUND') {
      return fail(res, 404, 'NOT_FOUND', 'Visit not found');
    }
    if (result.error === 'PROCEDURE_NOT_FOUND') {
      return fail(res, 404, 'NOT_FOUND', 'Procedure not found');
    }
    return fail(res, 400, 'BAD_REQUEST', 'Could not create procedure order');
  }

  return res.status(201).json(result.order);
}

export async function listForVisit(req: Request, res: Response) {
  const { visitId } = req.params;
  if (!visitId) {
    return fail(res, 400, 'VALIDATION_ERROR', 'visitId is required');
  }

  const orders = await procedureOrderService.listForVisit(visitId);
  return res.json(
    orders.map((o) => ({
      id: o.id,
      visitId: o.visitId,
      procedureId: o.procedureId,
      procedure: {
        id: o.procedure.id,
        code: o.procedure.code,
        name: o.procedure.name,
        department: o.procedure.department,
        defaultFee: o.procedure.defaultFee
      },
      notes: o.notes,
      status: o.status,
      createdAt: o.createdAt.toISOString()
    }))
  );
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body as { status: 'REQUESTED' | 'COMPLETED' };

  if (status !== 'REQUESTED' && status !== 'COMPLETED') {
    return fail(res, 400, 'VALIDATION_ERROR', 'Invalid status');
  }

  try {
    const order = await procedureOrderService.updateStatus(id, status);
    return res.json({
      id: order.id,
      visitId: order.visitId,
      procedureId: order.procedureId,
      procedure: {
        id: order.procedure.id,
        code: order.procedure.code,
        name: order.procedure.name,
        department: order.procedure.department,
        defaultFee: order.procedure.defaultFee
      },
      notes: order.notes,
      status: order.status,
      createdAt: order.createdAt.toISOString()
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'Procedure order not found');
    }
    throw err;
  }
}

