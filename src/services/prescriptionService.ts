import { prisma } from '../config/database';

export async function createPrescription(input: {
  visitId: string;
  diagnosis?: string;
  clinicalNotes?: string;
  medicines: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
}) {
  const visit = await prisma.visit.findUnique({ where: { id: input.visitId } });
  if (!visit) return { error: 'VISIT_NOT_FOUND' as const };

  const prescription = await prisma.prescription.create({
    data: {
      visitId: input.visitId,
      diagnosis: input.diagnosis,
      clinicalNotes: input.clinicalNotes,
      medicines: {
        create: input.medicines.map((m) => ({
          medicineName: m.medicineName,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions
        }))
      }
    },
    include: {
      medicines: true,
      visit: {
        include: { patient: true, doctor: true }
      }
    }
  });

  return { prescription };
}

export async function getPrescriptionById(id: string) {
  return prisma.prescription.findUnique({
    where: { id },
    include: {
      medicines: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });
}

