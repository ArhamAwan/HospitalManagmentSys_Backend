import type { Request, Response } from 'express';
import { fail } from '../utils/response';
import * as invoiceService from '../services/invoiceService';

export async function createInvoice(req: Request, res: Response) {
  const result = await invoiceService.createInvoice(req.body);
  if ('error' in result) {
    if (result.error === 'VISIT_NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Visit not found');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to create invoice');
  }
  return res.status(result.created ? 201 : 200).json(result.invoice);
}

export async function getInvoice(req: Request, res: Response) {
  const result = await invoiceService.getInvoiceById(req.params.id);
  if ('error' in result) return fail(res, 404, 'NOT_FOUND', 'Invoice not found');
  return res.json(result.invoice);
}

export async function addItem(req: Request, res: Response) {
  const result = await invoiceService.addInvoiceItem({ invoiceId: req.params.id, ...req.body });
  if ('error' in result) {
    if (result.error === 'INVOICE_NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Invoice not found');
    if (result.error === 'INVOICE_VOID') return fail(res, 409, 'CONFLICT', 'Invoice is void');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to add invoice item');
  }
  return res.json(result.invoice);
}

export async function issue(req: Request, res: Response) {
  const result = await invoiceService.issueInvoice(req.params.id);
  if ('error' in result) {
    if (result.error === 'INVOICE_NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Invoice not found');
    if (result.error === 'INVOICE_VOID') return fail(res, 409, 'CONFLICT', 'Invoice is void');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to issue invoice');
  }
  return res.json(result.invoice);
}

export async function voidInvoice(req: Request, res: Response) {
  const result = await invoiceService.voidInvoice(req.params.id);
  if ('error' in result) {
    if (result.error === 'INVOICE_NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Invoice not found');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to void invoice');
  }
  return res.json(result.invoice);
}

export async function recordPayment(req: Request, res: Response) {
  const result = await invoiceService.recordInvoicePayment({ invoiceId: req.params.id, ...req.body });
  if ('error' in result) {
    if (result.error === 'INVOICE_NOT_FOUND') return fail(res, 404, 'NOT_FOUND', 'Invoice not found');
    if (result.error === 'INVOICE_VOID') return fail(res, 409, 'CONFLICT', 'Invoice is void');
    if (result.error === 'INVALID_AMOUNT') return fail(res, 400, 'BAD_REQUEST', 'Invalid amount');
    return fail(res, 400, 'BAD_REQUEST', 'Unable to record payment');
  }
  return res.json(result.invoice);
}

export async function getReceipt(req: Request, res: Response) {
  const result = await invoiceService.getOrCreateReceipt(req.params.id);
  if ('error' in result) return fail(res, 404, 'NOT_FOUND', 'Invoice not found');
  return res.json(result.receipt);
}

