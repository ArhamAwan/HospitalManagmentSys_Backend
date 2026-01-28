import { prisma } from '../config/database';
import { generatePatientId, startOfToday } from '../utils/helpers';

export async function createPatient(input: {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address?: string;
}) {
  const patientId = await generatePatientId();

  const patient = await prisma.patient.create({
    data: {
      patientId,
      name: input.name,
      age: input.age,
      gender: input.gender,
      phone: input.phone,
      address: input.address
    }
  });

  return patient;
}

export async function searchPatients(query: string) {
  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { patientId: query },
        { name: { contains: query, mode: 'insensitive' } },
        { phone: query }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return patients;
}

export async function getPatientById(id: string) {
  return prisma.patient.findUnique({ where: { id } });
}

export async function getPatientHistory(patientId: string) {
  return prisma.visit.findMany({
    where: {
      patientId,
      visitDate: {
        gte: new Date(0)
      }
    },
    include: {
      doctor: true
    },
    orderBy: { visitDate: 'desc' },
    take: 50
  });
}

export async function getTodayPatientVisits(patientId: string) {
  const today = startOfToday();
  return prisma.visit.findMany({
    where: {
      patientId,
      visitDate: { gte: today }
    }
  });
}

