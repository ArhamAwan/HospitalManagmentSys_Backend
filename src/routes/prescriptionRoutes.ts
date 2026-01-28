import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createPrescriptionSchema } from '../middleware/validator';
import { createPrescription, getPrescription, getPrescriptionPdf } from '../controllers/prescriptionController';

const router = Router();

router.post('/', authenticate, authorize('DOCTOR', 'ADMIN'), validate(createPrescriptionSchema), createPrescription);
router.get('/:id', authenticate, getPrescription);
router.get('/:id/pdf', authenticate, getPrescriptionPdf);

export default router;

