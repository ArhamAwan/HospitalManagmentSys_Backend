import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createPaymentSchema } from '../middleware/validator';
import { getPayment, recordPayment } from '../controllers/paymentController';

const router = Router();

router.post('/', authenticate, authorize('RECEPTION', 'ADMIN'), validate(createPaymentSchema), recordPayment);
router.get('/:visitId', authenticate, getPayment);

export default router;

