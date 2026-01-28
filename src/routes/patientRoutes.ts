import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createPatientSchema } from '../middleware/validator';
import { createPatient, getPatient, getPatientHistory, searchPatients } from '../controllers/patientController';

const router = Router();

router.post('/', authenticate, authorize('RECEPTION', 'ADMIN'), validate(createPatientSchema), createPatient);
router.get('/search', authenticate, searchPatients);
router.get('/:id/history', authenticate, getPatientHistory);
router.get('/:id', authenticate, getPatient);

export default router;

