import { prisma } from '../config/database';

type InvoiceTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidTotal: number;
  balanceDue: number;
};

function money(n: number) {
  // Keep arithmetic predictable for now; consider decimal library later.
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function recomputeInvoice(invoiceId: string): Promise<InvoiceTotals> {
  const [items, payments, invoice] = await Promise.all([
    prisma.invoiceItem.findMany({ where: { invoiceId } }),
    prisma.paymentTransaction.findMany({ where: { invoiceId } }),
    prisma.invoice.findUnique({ where: { id: invoiceId } })
  ]);

  if (!invoice) throw new Error('INVOICE_NOT_FOUND');

  const subtotal = money(items.reduce((acc, it) => acc + it.lineTotal, 0));
  const discount = money(invoice.discount ?? 0);
  const tax = money(invoice.tax ?? 0);
  const total = money(Math.max(0, subtotal - discount + tax));
  const paidTotal = money(payments.reduce((acc, p) => acc + p.amount, 0));
  const balanceDue = money(Math.max(0, total - paidTotal));

  return { subtotal, discount, tax, total, paidTotal, balanceDue };
}

function statusFromTotals(input: { issuedAt: Date | null; balanceDue: number; total: number }) {
  // Preserve DRAFT if not issued yet.
  if (!input.issuedAt) return 'DRAFT' as const;
  if (input.total <= 0) return 'PAID' as const;
  if (input.balanceDue <= 0) return 'PAID' as const;
  if (input.balanceDue < input.total) return 'PARTIALLY_PAID' as const;
  return 'ISSUED' as const;
}

function receiptNumberForToday(n: number) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(n).padStart(4, '0');
  return `R-${y}${m}${day}-${seq}`;
}

export async function createInvoice(input: {
  visitId: string;
  // Optional overrides
  discount?: number;
  tax?: number;
}) {
  const existing = await prisma.invoice.findUnique({
    where: { visitId: input.visitId },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
      receipt: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });
  if (existing) return { invoice: existing, created: false as const };

  const visit = await prisma.visit.findUnique({
    where: { id: input.visitId },
    include: { doctor: true, patient: true }
  });
  if (!visit) return { error: 'VISIT_NOT_FOUND' as const };

  // Build create payload separately to avoid TS widening enum literals.
  const itemCreates: Array<{
    description: string;
    category: any;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [
    {
      description: 'Consultation fee',
      category: 'CONSULTATION',
      quantity: 1,
      unitPrice: money(visit.consultationFee),
      lineTotal: money(visit.consultationFee)
    }
  ];
  if (visit.isEmergency) {
    itemCreates.push({
      description: 'Emergency surcharge',
      category: 'EMERGENCY',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    });
  }

  const invoice = await prisma.invoice.create({
    data: {
      visitId: visit.id,
      discount: money(input.discount ?? 0),
      tax: money(input.tax ?? 0),
      items: {
        create: itemCreates
      }
    },
    include: {
      items: true,
      payments: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });

  const totals = await recomputeInvoice(invoice.id);
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      ...totals,
      status: statusFromTotals({ issuedAt: invoice.issuedAt ?? null, balanceDue: totals.balanceDue, total: totals.total })
    },
    include: {
      items: true,
      payments: true,
      receipt: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });

  return { invoice: updated, created: true as const };
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
      receipt: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });
  if (!invoice) return { error: 'INVOICE_NOT_FOUND' as const };
  return { invoice };
}

export async function addInvoiceItem(input: {
  invoiceId: string;
  description: string;
  category: 'CONSULTATION' | 'EMERGENCY' | 'LAB' | 'IMAGING' | 'MEDICINE' | 'PROCEDURE' | 'OTHER';
  quantity: number;
  unitPrice: number;
}) {
  const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!invoice) return { error: 'INVOICE_NOT_FOUND' as const };
  if (invoice.status === 'VOID') return { error: 'INVOICE_VOID' as const };

  const qty = Math.max(1, Math.floor(input.quantity));
  const unit = money(input.unitPrice);
  const lineTotal = money(qty * unit);

  await prisma.invoiceItem.create({
    data: {
      invoiceId: input.invoiceId,
      description: input.description,
      category: input.category,
      quantity: qty,
      unitPrice: unit,
      lineTotal
    }
  });

  const totals = await recomputeInvoice(input.invoiceId);
  const updated = await prisma.invoice.update({
    where: { id: input.invoiceId },
    data: {
      ...totals,
      status: statusFromTotals({ issuedAt: invoice.issuedAt ?? null, balanceDue: totals.balanceDue, total: totals.total })
    },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
      receipt: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });

  return { invoice: updated };
}

export async function issueInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { error: 'INVOICE_NOT_FOUND' as const };
  if (invoice.status === 'VOID') return { error: 'INVOICE_VOID' as const };

  const issuedAt = invoice.issuedAt ?? new Date();
  const totals = await recomputeInvoice(invoiceId);

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      issuedAt,
      ...totals,
      status: statusFromTotals({ issuedAt, balanceDue: totals.balanceDue, total: totals.total })
    },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
      receipt: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });

  return { invoice: updated };
}

export async function voidInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { error: 'INVOICE_NOT_FOUND' as const };

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'VOID', voidedAt: new Date() },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
      receipt: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });

  return { invoice: updated };
}

export async function recordInvoicePayment(input: {
  invoiceId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_WALLET' | 'OTHER';
  reference?: string;
}) {
  const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!invoice) return { error: 'INVOICE_NOT_FOUND' as const };
  if (invoice.status === 'VOID') return { error: 'INVOICE_VOID' as const };

  const amt = money(input.amount);
  if (amt <= 0) return { error: 'INVALID_AMOUNT' as const };

  await prisma.paymentTransaction.create({
    data: {
      invoiceId: input.invoiceId,
      amount: amt,
      method: input.method,
      reference: input.reference
    }
  });

  const totals = await recomputeInvoice(input.invoiceId);
  const issuedAt = invoice.issuedAt ?? null;

  const updated = await prisma.invoice.update({
    where: { id: input.invoiceId },
    data: {
      ...totals,
      status: statusFromTotals({ issuedAt, balanceDue: totals.balanceDue, total: totals.total })
    },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
      receipt: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });

  return { invoice: updated };
}

export async function getOrCreateReceipt(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
      receipt: true,
      visit: { include: { patient: true, doctor: true } }
    }
  });
  if (!invoice) return { error: 'INVOICE_NOT_FOUND' as const };

  if (invoice.receipt) return { receipt: invoice.receipt, invoice };

  const todaysCount = await prisma.receipt.count({
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
      }
    }
  });

  const receiptNumber = receiptNumberForToday(todaysCount + 1);

  const snapshot = {
    receiptNumber,
    invoiceId: invoice.id,
    visitId: invoice.visitId,
    patient: {
      id: invoice.visit.patient.id,
      patientId: invoice.visit.patient.patientId,
      name: invoice.visit.patient.name
    },
    doctor: {
      id: invoice.visit.doctor.id,
      name: invoice.visit.doctor.name,
      roomNumber: invoice.visit.doctor.roomNumber
    },
    totals: {
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      total: invoice.total,
      paidTotal: invoice.paidTotal,
      balanceDue: invoice.balanceDue
    },
    items: invoice.items.map((it) => ({
      description: it.description,
      category: it.category,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal
    })),
    payments: invoice.payments.map((p) => ({
      amount: p.amount,
      method: p.method,
      reference: p.reference,
      createdAt: p.createdAt.toISOString()
    })),
    createdAt: new Date().toISOString()
  };

  const receipt = await prisma.receipt.create({
    data: {
      invoiceId: invoice.id,
      receiptNumber,
      snapshot
    }
  });

  return { receipt, invoice };
}

