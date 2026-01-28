import { prisma } from '../config/database';

export async function recordPayment(input: {
  visitId: string;
  amount: number;
  paymentType: 'CONSULTATION' | 'EMERGENCY';
}) {
  const visit = await prisma.visit.findUnique({ where: { id: input.visitId } });
  if (!visit) return { error: 'VISIT_NOT_FOUND' as const };

  const payment = await prisma.payment.upsert({
    where: { visitId: input.visitId },
    update: {
      amount: input.amount,
      paymentType: input.paymentType
    },
    create: {
      visitId: input.visitId,
      amount: input.amount,
      paymentType: input.paymentType
    }
  });

  return { payment };
}

export async function getPaymentByVisitId(visitId: string) {
  return prisma.payment.findUnique({ where: { visitId } });
}

