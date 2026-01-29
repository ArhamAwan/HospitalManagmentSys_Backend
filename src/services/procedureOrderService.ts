import { prisma } from '../config/database';
import { createInvoice, addInvoiceItem } from './invoiceService';

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

export async function updateStatus(id: string, status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED') {
  const order = await prisma.procedureOrder.update({
    where: { id },
    data: { status },
    include: { procedure: true }
  });
  return order;
}

export async function startProcedure(id: string) {
  const order = await prisma.procedureOrder.findUnique({
    where: { id },
    include: { procedure: true, visit: true }
  });

  if (!order) {
    return { error: 'PROCEDURE_ORDER_NOT_FOUND' as const };
  }

  if (order.status !== 'REQUESTED') {
    return { error: 'INVALID_STATUS' as const };
  }

  const updated = await prisma.procedureOrder.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date()
    },
    include: {
      procedure: true,
      visit: {
        include: {
          patient: true,
          doctor: true
        }
      }
    }
  });

  return { order: updated };
}

export async function completeProcedure(id: string) {
  const order = await prisma.procedureOrder.findUnique({
    where: { id },
    include: {
      procedure: true,
      visit: {
        include: {
          patient: true,
          doctor: true,
          invoice: true
        }
      }
    }
  });

  if (!order) {
    return { error: 'PROCEDURE_ORDER_NOT_FOUND' as const };
  }

  if (order.status !== 'IN_PROGRESS') {
    return { error: 'INVALID_STATUS' as const };
  }

  if (!order.startedAt) {
    return { error: 'PROCEDURE_NOT_STARTED' as const };
  }

  const completedAt = new Date();
  const durationHours = (completedAt.getTime() - order.startedAt.getTime()) / (1000 * 60 * 60);

  // Calculate charge: defaultFee + (hourlyRate × duration)
  const hourlyRate = order.procedure.hourlyRate ?? 0;
  const charge = order.procedure.defaultFee + (hourlyRate * durationHours);

  const updated = await prisma.procedureOrder.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt
    },
    include: {
      procedure: true,
      visit: {
        include: {
          patient: true,
          doctor: true,
          invoice: true
        }
      }
    }
  });

  // Auto-add invoice item if invoice exists
  if (updated.visit.invoice) {
    const durationFormatted = durationHours.toFixed(2);
    const description = `${order.procedure.name} - ${durationFormatted} hours`;

    await addInvoiceItem({
      invoiceId: updated.visit.invoice.id,
      description,
      category: 'PROCEDURE',
      quantity: 1,
      unitPrice: charge
    });
  }

  return { order: updated };
}

export async function listOngoingProcedures() {
  const orders = await prisma.procedureOrder.findMany({
    where: {
      status: 'IN_PROGRESS'
    },
    include: {
      procedure: true,
      visit: {
        include: {
          patient: true,
          doctor: true
        }
      }
    },
    orderBy: [
      { visit: { isEmergency: 'desc' } },
      { startedAt: 'asc' }
    ]
  });

  return orders;
}

export async function listRequestedProcedures() {
  const orders = await prisma.procedureOrder.findMany({
    where: {
      status: 'REQUESTED'
    },
    include: {
      procedure: true,
      visit: {
        include: {
          patient: true,
          doctor: true
        }
      }
    },
    orderBy: [
      { visit: { isEmergency: 'desc' } },
      { createdAt: 'asc' }
    ]
  });

  return orders;
}

