import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createInvoiceSchema, addInvoiceItemSchema, recordInvoicePaymentSchema } from '../middleware/validator';
import { addItem, createInvoice, getInvoice, getReceipt, issue, recordPayment, voidInvoice } from '../controllers/invoiceController';

const router = Router();

router.post('/', authenticate, authorize('RECEPTION', 'ADMIN'), validate(createInvoiceSchema), createInvoice);
router.get('/:id', authenticate, authorize('RECEPTION', 'ADMIN'), getInvoice);

router.post('/:id/items', authenticate, authorize('RECEPTION', 'ADMIN'), validate(addInvoiceItemSchema), addItem);
router.post('/:id/payments', authenticate, authorize('RECEPTION', 'ADMIN'), validate(recordInvoicePaymentSchema), recordPayment);

router.post('/:id/issue', authenticate, authorize('RECEPTION', 'ADMIN'), issue);
router.post('/:id/void', authenticate, authorize('RECEPTION', 'ADMIN'), voidInvoice);

router.get('/:id/receipt', authenticate, authorize('RECEPTION', 'ADMIN'), getReceipt);

export default router;

