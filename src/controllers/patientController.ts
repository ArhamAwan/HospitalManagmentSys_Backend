import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { fail } from '../utils/response';
import * as patientService from '../services/patientService';

export async function createPatient(req: Request, res: Response) {
  try {
    const patient = await patientService.createPatient(req.body);
    return res.status(201).json({
      ...patient,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString()
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return fail(res, 409, 'CONFLICT', 'Patient already exists');
    }
    throw err;
  }
}

export async function searchPatients(req: Request, res: Response) {
  const q = String(req.query.q ?? '').trim();

  const patients =
    q.length < 2 ? await patientService.listRecentPatients() : await patientService.searchPatients(q);
  return res.json(
    patients.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    }))
  );
}

export async function getPatient(req: Request, res: Response) {
  const { id } = req.params;
  const patient = await patientService.getPatientById(id);
  if (!patient) return fail(res, 404, 'NOT_FOUND', 'Patient not found');

  return res.json({
    ...patient,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString()
  });
}

export async function getPatientHistory(req: Request, res: Response) {
  const { id } = req.params;

  const patient = await patientService.getPatientById(id);
  if (!patient) return fail(res, 404, 'NOT_FOUND', 'Patient not found');

  const visits = await patientService.getPatientHistory(id);
  return res.json(
    visits.map((v) => ({
      id: v.id,
      patientId: v.patientId,
      doctorId: v.doctorId,
      tokenNumber: v.tokenNumber,
      visitDate: v.visitDate.toISOString(),
      status: v.status,
      isEmergency: v.isEmergency,
      consultationFee: v.consultationFee,
      doctor: v.doctor
        ? {
            id: v.doctor.id,
            name: v.doctor.name,
            specialization: v.doctor.specialization,
            consultationFee: v.doctor.consultationFee,
            roomNumber: v.doctor.roomNumber
          }
        : undefined
    }))
  );
}

