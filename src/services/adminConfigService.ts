import { prisma } from '../config/database';
import { generateRoomCode, generateProcedureCode } from '../utils/helpers';

export async function listDoctors() {
  return prisma.doctor.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function updateDoctor(
  id: string,
  input: Partial<{ name: string; specialization: string; consultationFee: number; roomNumber: string }>
) {
  return prisma.doctor.update({
    where: { id },
    data: {
      name: input.name,
      specialization: input.specialization,
      consultationFee: input.consultationFee,
      roomNumber: input.roomNumber
    }
  });
}

export async function listRooms() {
  return prisma.room.findMany({
    orderBy: { code: 'asc' }
  });
}

export async function createRoom(input: { code?: string; name: string; floor?: string | null }) {
  const code = input.code || (await generateRoomCode());
  return prisma.room.create({
    data: {
      code,
      name: input.name,
      floor: input.floor ?? null
    }
  });
}

export async function updateRoom(
  id: string,
  input: Partial<{ code: string; name: string; floor: string | null; status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' }>
) {
  return prisma.room.update({
    where: { id },
    data: {
      name: input.name,
      floor: input.floor,
      status: input.status
    }
  });
}

export async function deleteRoom(id: string) {
  return prisma.room.delete({ where: { id } });
}

export async function listProcedures() {
  return prisma.procedure.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createProcedure(input: {
  code?: string;
  name: string;
  department?: string | null;
  defaultFee: number;
  hourlyRate?: number | null;
}) {
  const code = input.code || (await generateProcedureCode());
  return prisma.procedure.create({
    data: {
      code,
      name: input.name,
      department: input.department ?? null,
      defaultFee: input.defaultFee,
      hourlyRate: input.hourlyRate ?? null
    }
  });
}

export async function updateProcedure(
  id: string,
  input: Partial<{ code: string; name: string; department: string | null; defaultFee: number; hourlyRate: number | null }>
) {
  return prisma.procedure.update({
    where: { id },
    data: {
      name: input.name,
      department: input.department,
      defaultFee: input.defaultFee,
      hourlyRate: input.hourlyRate
    }
  });
}

export async function deleteProcedure(id: string) {
  return prisma.procedure.delete({ where: { id } });
}

