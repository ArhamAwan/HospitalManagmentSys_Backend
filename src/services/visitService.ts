import { prisma } from '../config/database';
import { generateTokenNumber, minutesSince } from '../utils/helpers';
import { getSettings } from './settingService';
import { emitDoctorQueueRefresh, emitEmergencyActive, emitQueueUpdate } from '../socket/socketHandler';

export async function createVisit(input: { patientId: string; doctorId: string; isEmergency?: boolean }) {
  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({ where: { id: input.patientId } }),
    prisma.doctor.findUnique({ where: { id: input.doctorId } })
  ]);

  if (!patient) return { error: 'PATIENT_NOT_FOUND' as const };
  if (!doctor) return { error: 'DOCTOR_NOT_FOUND' as const };

  const tokenNumber = await generateTokenNumber(doctor.id);

  const visit = await prisma.visit.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      tokenNumber,
      isEmergency: Boolean(input.isEmergency),
      consultationFee: doctor.consultationFee
    },
    include: {
      patient: true,
      doctor: true
    }
  });

  if (visit.isEmergency) {
    // Notify all relevant screens immediately.
    emitEmergencyActive({
      doctorId: doctor.id,
      isActive: true,
      visitId: visit.id,
      tokenNumber: visit.tokenNumber,
      patientName: patient.name,
      roomNumber: doctor.roomNumber
    });
  }

  emitDoctorQueueRefresh({ doctorId: doctor.id });

  return { visit };
}

export async function getVisitById(id: string) {
  return prisma.visit.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true
    }
  });
}

export async function callVisit(id: string) {
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: { doctor: true }
  });

  if (!visit) return { error: 'NOT_FOUND' as const };
  if (visit.status !== 'WAITING') return { error: 'INVALID_STATUS' as const };

  const updated = await prisma.visit.update({
    where: { id },
    data: { status: 'IN_CONSULTATION' },
    include: { patient: true, doctor: true }
  });

  emitQueueUpdate({
    doctorId: updated.doctorId,
    currentToken: updated.tokenNumber,
    roomNumber: updated.doctor.roomNumber
  });

  if (updated.isEmergency) {
    emitEmergencyActive({ doctorId: updated.doctorId, isActive: true });
  }

  emitDoctorQueueRefresh({ doctorId: updated.doctorId });

  return { visit: updated };
}

export async function completeVisit(id: string) {
  const visit = await prisma.visit.findUnique({ where: { id } });
  if (!visit) return { error: 'NOT_FOUND' as const };

  const updated = await prisma.visit.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date() },
    include: { patient: true, doctor: true }
  });

  if (visit.isEmergency) {
    emitEmergencyActive({ doctorId: updated.doctorId, isActive: false });
  }

  emitDoctorQueueRefresh({ doctorId: updated.doctorId });

  return { visit: updated };
}

export async function getTokenResetStart(): Promise<Date> {
  const settings = await getSettings();
  const [h, m] = settings.tokenResetTime.split(':').map((n) => Number(n));
  const now = new Date();
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  // If it's before today's reset time, use previous day.
  if (now < start) {
    start.setDate(start.getDate() - 1);
  }
  return start;
}

export async function getTodayVisits() {
  const start = await getTokenResetStart();
  return prisma.visit.findMany({
    where: { visitDate: { gte: start } },
    include: { patient: true, doctor: true },
    orderBy: { visitDate: 'desc' }
  });
}

export async function getDoctorQueue(doctorId: string) {
  const start = await getTokenResetStart();

  const visits = await prisma.visit.findMany({
    where: {
      doctorId,
      visitDate: { gte: start },
      status: 'WAITING'
    },
    include: {
      patient: true,
      doctor: true
    },
    orderBy: [{ isEmergency: 'desc' }, { tokenNumber: 'asc' }]
  });

  return visits.map((v) => ({
    visit: v,
    patient: v.patient,
    timeWaiting: minutesSince(v.visitDate)
  }));
}

