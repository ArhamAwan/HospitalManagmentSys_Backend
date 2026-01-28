import { prisma } from '../config/database';

export async function generatePatientId(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const count = await prisma.patient.count({
    where: {
      patientId: {
        startsWith: `P-${dateStr}`
      }
    }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `P-${dateStr}-${sequence}`;
}

export async function generateTokenNumber(doctorId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.visit.count({
    where: {
      doctorId,
      visitDate: {
        gte: today
      }
    }
  });

  return count + 1;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function minutesSince(date: Date): number {
  const now = new Date().getTime();
  const then = date.getTime();
  return Math.max(0, Math.round((now - then) / (1000 * 60)));
}

