import { prisma } from '../config/database';

export async function listDoctors() {
  return prisma.doctor.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function getDoctorById(id: string) {
  return prisma.doctor.findUnique({ where: { id } });
}

