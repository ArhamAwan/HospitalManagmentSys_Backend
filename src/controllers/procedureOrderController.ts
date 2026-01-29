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
        defaultFee: o.procedure.defaultFee,
        hourlyRate: o.procedure.hourlyRate
      },
      notes: o.notes,
      status: o.status,
      startedAt: o.startedAt?.toISOString(),
      completedAt: o.completedAt?.toISOString(),
      createdAt: o.createdAt.toISOString()
    }))
  );
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body as { status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' };

  if (status !== 'REQUESTED' && status !== 'IN_PROGRESS' && status !== 'COMPLETED') {
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
        defaultFee: order.procedure.defaultFee,
        hourlyRate: order.procedure.hourlyRate
      },
      notes: order.notes,
      status: order.status,
      startedAt: order.startedAt?.toISOString(),
      completedAt: order.completedAt?.toISOString(),
      createdAt: order.createdAt.toISOString()
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'Procedure order not found');
    }
    throw err;
  }
}

export async function startProcedure(req: Request, res: Response) {
  const { id } = req.params;

  const result = await procedureOrderService.startProcedure(id);
  if ('error' in result) {
    if (result.error === 'PROCEDURE_ORDER_NOT_FOUND') {
      return fail(res, 404, 'NOT_FOUND', 'Procedure order not found');
    }
    if (result.error === 'INVALID_STATUS') {
      return fail(res, 400, 'INVALID_STATUS', 'Procedure must be in REQUESTED status to start');
    }
    return fail(res, 400, 'BAD_REQUEST', 'Could not start procedure');
  }

  return res.json({
    id: result.order.id,
    visitId: result.order.visitId,
    procedureId: result.order.procedureId,
    procedure: {
      id: result.order.procedure.id,
      code: result.order.procedure.code,
      name: result.order.procedure.name,
      department: result.order.procedure.department,
      defaultFee: result.order.procedure.defaultFee,
      hourlyRate: result.order.procedure.hourlyRate
    },
    notes: result.order.notes,
    status: result.order.status,
    startedAt: result.order.startedAt?.toISOString(),
    completedAt: result.order.completedAt?.toISOString(),
    createdAt: result.order.createdAt.toISOString()
  });
}

export async function completeProcedure(req: Request, res: Response) {
  const { id } = req.params;

  const result = await procedureOrderService.completeProcedure(id);
  if ('error' in result) {
    if (result.error === 'PROCEDURE_ORDER_NOT_FOUND') {
      return fail(res, 404, 'NOT_FOUND', 'Procedure order not found');
    }
    if (result.error === 'INVALID_STATUS') {
      return fail(res, 400, 'INVALID_STATUS', 'Procedure must be in IN_PROGRESS status to complete');
    }
    if (result.error === 'PROCEDURE_NOT_STARTED') {
      return fail(res, 400, 'INVALID_STATE', 'Procedure must be started before completion');
    }
    return fail(res, 400, 'BAD_REQUEST', 'Could not complete procedure');
  }

  return res.json({
    id: result.order.id,
    visitId: result.order.visitId,
    procedureId: result.order.procedureId,
    procedure: {
      id: result.order.procedure.id,
      code: result.order.procedure.code,
      name: result.order.procedure.name,
      department: result.order.procedure.department,
      defaultFee: result.order.procedure.defaultFee,
      hourlyRate: result.order.procedure.hourlyRate
    },
    notes: result.order.notes,
    status: result.order.status,
    startedAt: result.order.startedAt?.toISOString(),
    completedAt: result.order.completedAt?.toISOString(),
    createdAt: result.order.createdAt.toISOString()
  });
}

export async function listOngoing(req: Request, res: Response) {
  const orders = await procedureOrderService.listOngoingProcedures();
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
        defaultFee: o.procedure.defaultFee,
        hourlyRate: o.procedure.hourlyRate
      },
      notes: o.notes,
      status: o.status,
      startedAt: o.startedAt?.toISOString(),
      completedAt: o.completedAt?.toISOString(),
      createdAt: o.createdAt.toISOString(),
      visit: {
        id: o.visit.id,
        patientId: o.visit.patientId,
        tokenNumber: o.visit.tokenNumber,
        isEmergency: o.visit.isEmergency,
        patient: {
          id: o.visit.patient.id,
          patientId: o.visit.patient.patientId,
          name: o.visit.patient.name,
          age: o.visit.patient.age,
          gender: o.visit.patient.gender
        },
        doctor: o.visit.doctor
          ? {
              id: o.visit.doctor.id,
              name: o.visit.doctor.name,
              specialization: o.visit.doctor.specialization,
              roomNumber: o.visit.doctor.roomNumber
            }
          : undefined
      }
    }))
  );
}

export async function listRequested(req: Request, res: Response) {
  const orders = await procedureOrderService.listRequestedProcedures();
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
        defaultFee: o.procedure.defaultFee,
        hourlyRate: o.procedure.hourlyRate
      },
      notes: o.notes,
      status: o.status,
      startedAt: o.startedAt?.toISOString(),
      completedAt: o.completedAt?.toISOString(),
      createdAt: o.createdAt.toISOString(),
      visit: {
        id: o.visit.id,
        patientId: o.visit.patientId,
        tokenNumber: o.visit.tokenNumber,
        isEmergency: o.visit.isEmergency,
        patient: {
          id: o.visit.patient.id,
          patientId: o.visit.patient.patientId,
          name: o.visit.patient.name,
          age: o.visit.patient.age,
          gender: o.visit.patient.gender
        },
        doctor: o.visit.doctor
          ? {
              id: o.visit.doctor.id,
              name: o.visit.doctor.name,
              specialization: o.visit.doctor.specialization,
              roomNumber: o.visit.doctor.roomNumber
            }
          : undefined
      }
    }))
  );
}

