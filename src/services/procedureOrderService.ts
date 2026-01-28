import { prisma } from '../config/database';

export async function createProcedureOrder(input: {
  visitId: string;
  procedureId: string;
  notes?: string;
}) {
  // Ensure visit and procedure exist
  const [visit, procedure] = await Promise.all([
    prisma.visit.findUnique({ where: { id: input.visitId }, include: { doctor: true, patient: true } }),
    prisma.procedure.findUnique({ where: { id: input.procedureId } })
  ]);

  if (!visit) {
    return { error: 'VISIT_NOT_FOUND' as const };
  }
  if (!procedure) {
    return { error: 'PROCEDURE_NOT_FOUND' as const };
  }

  const order = await prisma.procedureOrder.create({
    data: {
      visitId: visit.id,
      procedureId: procedure.id,
      notes: input.notes
    },
    include: {
      procedure: true
    }
  });

  return { order };
}

export async function listForVisit(visitId: string) {
  return prisma.procedureOrder.findMany({
    where: { visitId },
    include: { procedure: true },
    orderBy: { createdAt: 'asc' }
  });
}

export async function updateStatus(id: string, status: 'REQUESTED' | 'COMPLETED') {
  const order = await prisma.procedureOrder.update({
    where: { id },
    data: { status },
    include: { procedure: true }
  });
  return order;
}

