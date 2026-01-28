import type { Request, Response } from 'express';
import { fail } from '../utils/response';
import * as visitService from '../services/visitService';

function mapDoctor(d: any) {
  return {
    id: d.id,
    name: d.name,
    specialization: d.specialization,
    consultationFee: d.consultationFee,
    roomNumber: d.roomNumber
  };
}

function mapPatient(p: any) {
  return {
    id: p.id,
    patientId: p.patientId,
    name: p.name,
    age: p.age,
    gender: p.gender,
    phone: p.phone,
    address: p.address ?? undefined,
    createdAt: p.createdAt.toISOString()
  };
}

function mapVisit(v: any) {
  return {
    id: v.id,
    patientId: v.patientId,
    doctorId: v.doctorId,
    tokenNumber: v.tokenNumber,
    visitDate: v.visitDate.toISOString(),
    status: v.status,
    isEmergency: v.isEmergency,
    consultationFee: v.consultationFee,
    ...(v.patient ? { patient: mapPatient(v.patient) } : {}),
    ...(v.doctor ? { doctor: mapDoctor(v.doctor) } : {})
  };
}

export async function createVisit(req: Request, res: Response) {
  const { patientId, doctorId, isEmergency } = req.body as {
    patientId: string;
    doctorId: string;
    isEmergency?: boolean;
  };

  const result = await visitService.createVisit({ patientId, doctorId, isEmergency });
  if ('error' in result) {
    if (result.error === 'PATIENT_NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Patient not found');
    if (result.error === 'DOCTOR_NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Doctor not found');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to create visit');
  }

  return res.status(201).json(mapVisit(result.visit));
}

export async function getVisit(req: Request, res: Response) {
  const { id } = req.params;
  const v = await visitService.getVisitById(id);
  if (!v) return fail(res, 404, 'NOT_FOUND', 'Visit not found');
  return res.json(mapVisit(v));
}

export async function callNext(req: Request, res: Response) {
  const { id } = req.params;
  const result = await visitService.callVisit(id);
  if ('error' in result) {
    if (result.error === 'NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Visit not found');
    if (result.error === 'INVALID_STATUS') return fail(res, 409, 'CONFLICT', 'Visit is not in WAITING status');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to call visit');
  }
  return res.json(mapVisit(result.visit));
}

export async function complete(req: Request, res: Response) {
  const { id } = req.params;
  const result = await visitService.completeVisit(id);
  if ('error' in result) {
    if (result.error === 'NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Visit not found');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to complete visit');
  }
  return res.json(mapVisit(result.visit));
}

export async function today(req: Request, res: Response) {
  const visits = await visitService.getTodayVisits();
  return res.json(visits.map(mapVisit));
}

