import { prisma } from '../config/database';
import { getTokenResetStart } from './visitService';

export async function getTotalPatients() {
  const count = await prisma.patient.count();
  return { totalPatients: count };
}

export async function getDailyVisits(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const visits = await prisma.visit.findMany({
    where: {
      visitDate: {
        gte: start,
        lt: end
      }
    },
    include: {
      doctor: true
    }
  });

  const total = visits.length;
  const byStatus: Record<string, number> = {};
  const byDoctor: Record<string, { id: string; name: string; count: number }> = {};

  for (const v of visits) {
    byStatus[v.status] = (byStatus[v.status] ?? 0) + 1;
    if (v.doctor) {
      const key = v.doctor.id;
      if (!byDoctor[key]) {
        byDoctor[key] = { id: v.doctor.id, name: v.doctor.name, count: 0 };
      }
      byDoctor[key].count += 1;
    }
  }

  return {
    total,
    byStatus,
    byDoctor: Object.values(byDoctor)
  };
}

export async function getBillingSummary(from: Date, to: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    include: {
      visit: {
        include: {
          doctor: true
        }
      }
    }
  });

  let totalAmount = 0;
  const byType: Record<string, number> = {};
  const byDoctor: Record<string, { id: string; name: string; amount: number }> = {};

  for (const p of payments) {
    totalAmount += p.amount;
    byType[p.paymentType] = (byType[p.paymentType] ?? 0) + p.amount;
    const d = p.visit.doctor;
    if (d) {
      const key = d.id;
      if (!byDoctor[key]) {
        byDoctor[key] = { id: d.id, name: d.name, amount: 0 };
      }
      byDoctor[key].amount += p.amount;
    }
  }

  return {
    totalAmount,
    byType,
    byDoctor: Object.values(byDoctor)
  };
}

export async function getQueueStats(date: Date) {
  const start = await getTokenResetStart();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const visits = await prisma.visit.findMany({
    where: {
      visitDate: {
        gte: start,
        lt: end
      }
    },
    include: {
      doctor: true
    },
    orderBy: {
      visitDate: 'asc'
    }
  });

  const byDoctor: Record<
    string,
    { id: string; name: string; total: number; totalWaitingMinutes: number; maxQueue: number; currentQueue: number }
  > = {};

  for (const v of visits) {
    const d = v.doctor;
    if (!d) continue;
    const key = d.id;
    if (!byDoctor[key]) {
      byDoctor[key] = {
        id: d.id,
        name: d.name,
        total: 0,
        totalWaitingMinutes: 0,
        maxQueue: 0,
        currentQueue: 0
      };
    }
    const bucket = byDoctor[key];
    bucket.total += 1;
    if (v.completedAt) {
      const waitMinutes = Math.max(0, Math.round((v.completedAt.getTime() - v.visitDate.getTime()) / 60000));
      bucket.totalWaitingMinutes += waitMinutes;
    }
  }

  // Approximate max queue as total WAITING/IN_CONSULTATION on that day; for now we don't track time series.
  const waiting = await prisma.visit.groupBy({
    by: ['doctorId'],
    where: {
      visitDate: {
        gte: start,
        lt: end
      },
      status: {
        in: ['WAITING', 'IN_CONSULTATION']
      }
    },
    _count: {
      _all: true
    }
  });

  for (const w of waiting) {
    const d = await prisma.doctor.findUnique({ where: { id: w.doctorId } });
    if (!d) continue;
    const key = d.id;
    if (!byDoctor[key]) {
      byDoctor[key] = {
        id: d.id,
        name: d.name,
        total: 0,
        totalWaitingMinutes: 0,
        maxQueue: 0,
        currentQueue: 0
      };
    }
    byDoctor[key].currentQueue = w._count._all;
    byDoctor[key].maxQueue = Math.max(byDoctor[key].maxQueue, w._count._all);
  }

  const doctors = Object.values(byDoctor).map((d) => ({
    id: d.id,
    name: d.name,
    totalVisits: d.total,
    avgWaitingMinutes: d.total > 0 ? Math.round(d.totalWaitingMinutes / d.total) : 0,
    maxQueue: d.maxQueue,
    currentQueue: d.currentQueue
  }));

  const overall = doctors.reduce(
    (acc, d) => {
      acc.totalVisits += d.totalVisits;
      acc.totalWaitingMinutes += d.avgWaitingMinutes * d.totalVisits;
      acc.maxQueue = Math.max(acc.maxQueue, d.maxQueue);
      return acc;
    },
    { totalVisits: 0, totalWaitingMinutes: 0, maxQueue: 0 }
  );

  const avgWaitingMinutes =
    overall.totalVisits > 0 ? Math.round(overall.totalWaitingMinutes / overall.totalVisits) : 0;

  return {
    avgWaitingMinutes,
    maxQueue: overall.maxQueue,
    doctors
  };
}

