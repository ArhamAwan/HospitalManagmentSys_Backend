import type { Request, Response } from 'express';
import { fail } from '../utils/response';
import * as doctorService from '../services/doctorService';
import { getDoctorQueue } from '../services/visitService';

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

