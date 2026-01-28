import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { fail } from '../utils/response';
import * as adminConfigService from '../services/adminConfigService';
import { logUserAudit } from '../services/auditService';

export async function listDoctors(req: Request, res: Response) {
  const doctors = await adminConfigService.listDoctors();
  return res.json(
    doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      consultationFee: d.consultationFee,
      roomNumber: d.roomNumber,
      userId: d.userId
    }))
  );
}

export async function updateDoctor(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const d = await adminConfigService.updateDoctor(id, req.body);
    if (req.user) {
      await logUserAudit({
        userId: req.user.id,
        actorId: req.user.id,
        action: 'DOCTOR_CONFIG_UPDATED',
        details: { doctorId: d.id, changes: req.body }
      });
    }
    return res.json({
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      consultationFee: d.consultationFee,
      roomNumber: d.roomNumber,
      userId: d.userId
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'Doctor not found');
    }
    throw err;
  }
}

export async function listRooms(req: Request, res: Response) {
  const rooms = await adminConfigService.listRooms();
  return res.json(
    rooms.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      floor: r.floor,
      status: r.status,
      createdAt: r.createdAt.toISOString()
    }))
  );
}

export async function createRoom(req: Request, res: Response) {
  try {
    const r = await adminConfigService.createRoom(req.body);
    if (req.user) {
      await logUserAudit({
        userId: req.user.id,
        actorId: req.user.id,
        action: 'ROOM_CREATED',
        details: { roomId: r.id, code: r.code, name: r.name }
      });
    }
    return res.status(201).json({
      id: r.id,
      code: r.code,
      name: r.name,
      floor: r.floor,
      status: r.status,
      createdAt: r.createdAt.toISOString()
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return fail(res, 409, 'CONFLICT', 'Room code already exists');
    }
    throw err;
  }
}

export async function updateRoom(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const r = await adminConfigService.updateRoom(id, req.body);
    if (req.user) {
      await logUserAudit({
        userId: req.user.id,
        actorId: req.user.id,
        action: 'ROOM_UPDATED',
        details: { roomId: r.id, changes: req.body }
      });
    }
    return res.json({
      id: r.id,
      code: r.code,
      name: r.name,
      floor: r.floor,
      status: r.status,
      createdAt: r.createdAt.toISOString()
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'Room not found');
    }
    throw err;
  }
}

export async function deleteRoom(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await adminConfigService.deleteRoom(id);
    if (req.user) {
      await logUserAudit({
        userId: req.user.id,
        actorId: req.user.id,
        action: 'ROOM_DELETED',
        details: { roomId: id }
      });
    }
    return res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'Room not found');
    }
    throw err;
  }
}

export async function listProcedures(req: Request, res: Response) {
  const procedures = await adminConfigService.listProcedures();
  return res.json(
    procedures.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      department: p.department,
      defaultFee: p.defaultFee,
      createdAt: p.createdAt.toISOString()
    }))
  );
}

export async function createProcedure(req: Request, res: Response) {
  try {
    const p = await adminConfigService.createProcedure(req.body);
    if (req.user) {
      await logUserAudit({
        userId: req.user.id,
        actorId: req.user.id,
        action: 'PROCEDURE_CREATED',
        details: { procedureId: p.id, code: p.code }
      });
    }
    return res.status(201).json({
      id: p.id,
      code: p.code,
      name: p.name,
      department: p.department,
      defaultFee: p.defaultFee,
      createdAt: p.createdAt.toISOString()
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return fail(res, 409, 'CONFLICT', 'Procedure code already exists');
    }
    throw err;
  }
}

export async function updateProcedure(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const p = await adminConfigService.updateProcedure(id, req.body);
    if (req.user) {
      await logUserAudit({
        userId: req.user.id,
        actorId: req.user.id,
        action: 'PROCEDURE_UPDATED',
        details: { procedureId: p.id, changes: req.body }
      });
    }
    return res.json({
      id: p.id,
      code: p.code,
      name: p.name,
      department: p.department,
      defaultFee: p.defaultFee,
      createdAt: p.createdAt.toISOString()
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'Procedure not found');
    }
    throw err;
  }
}

export async function deleteProcedure(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await adminConfigService.deleteProcedure(id);
    if (req.user) {
      await logUserAudit({
        userId: req.user.id,
        actorId: req.user.id,
        action: 'PROCEDURE_DELETED',
        details: { procedureId: id }
      });
    }
    return res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'Procedure not found');
    }
    throw err;
  }
}

