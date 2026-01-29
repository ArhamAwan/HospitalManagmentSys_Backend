import type { Request, Response } from 'express';
import { fail } from '../utils/response';
import * as doctorService from '../services/doctorService';
import { getDoctorQueue, getDoctorHistory } from '../services/visitService';

export async function listDoctors(req: Request, res: Response) {
  const doctors = await doctorService.listDoctors();
  return res.json(
    doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      consultationFee: d.consultationFee,
      roomNumber: d.roomNumber
    }))
  );
}

export async function getDoctor(req: Request, res: Response) {
  const { id } = req.params;
  const d = await doctorService.getDoctorById(id);
  if (!d) return fail(res, 404, 'NOT_FOUND', 'Doctor not found');

  return res.json({
    id: d.id,
    name: d.name,
    specialization: d.specialization,
    consultationFee: d.consultationFee,
    roomNumber: d.roomNumber
  });
}

export async function getQueue(req: Request, res: Response) {
  const { id } = req.params;
  const d = await doctorService.getDoctorById(id);
  if (!d) return fail(res, 404, 'NOT_FOUND', 'Doctor not found');

  const queue = await getDoctorQueue(id);

  return res.json(
    queue.map((item) => ({
      visit: {
        id: item.visit.id,
        patientId: item.visit.patientId,
        doctorId: item.visit.doctorId,
        tokenNumber: item.visit.tokenNumber,
        visitDate: item.visit.visitDate.toISOString(),
        status: item.visit.status,
        isEmergency: item.visit.isEmergency,
        consultationFee: item.visit.consultationFee,
        doctor: {
          id: item.visit.doctor.id,
          name: item.visit.doctor.name,
          specialization: item.visit.doctor.specialization,
          consultationFee: item.visit.doctor.consultationFee,
          roomNumber: item.visit.doctor.roomNumber
        }
      },
      patient: {
        id: item.patient.id,
        patientId: item.patient.patientId,
        name: item.patient.name,
        age: item.patient.age,
        gender: item.patient.gender,
        phone: item.patient.phone,
        address: item.patient.address ?? undefined,
        createdAt: item.patient.createdAt.toISOString()
      },
      timeWaiting: item.timeWaiting
    }))
  );
}

export async function getHistory(req: Request, res: Response) {
  const { id } = req.params;
  const limit = Number(req.query.limit) || 100;

  const d = await doctorService.getDoctorById(id);
  if (!d) return fail(res, 404, 'NOT_FOUND', 'Doctor not found');

  const visits = await getDoctorHistory(id, limit);

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
      completedAt: v.completedAt?.toISOString(),
      patient: {
        id: v.patient.id,
        patientId: v.patient.patientId,
        name: v.patient.name,
        age: v.patient.age,
        gender: v.patient.gender,
        phone: v.patient.phone,
        address: v.patient.address ?? undefined
      },
      doctor: {
        id: v.doctor.id,
        name: v.doctor.name,
        specialization: v.doctor.specialization,
        consultationFee: v.doctor.consultationFee,
        roomNumber: v.doctor.roomNumber
      },
      prescription: v.prescription
        ? {
            id: v.prescription.id,
            visitId: v.prescription.visitId,
            diagnosis: v.prescription.diagnosis,
            clinicalNotes: v.prescription.clinicalNotes,
            medicines: v.prescription.medicines.map((m) => ({
              id: m.id,
              prescriptionId: m.prescriptionId,
              medicineName: m.medicineName,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              instructions: m.instructions
            })),
            createdAt: v.prescription.createdAt.toISOString()
          }
        : undefined,
      procedureOrders: v.procedureOrders.map((o) => ({
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
    }))
  );
}

