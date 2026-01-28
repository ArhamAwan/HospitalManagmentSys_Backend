import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createProcedureOrder, listForVisit, updateStatus } from '../controllers/procedureOrderController';

const router = Router();

router.use(authenticate);

router.post('/', authorize('DOCTOR', 'ADMIN'), createProcedureOrder);
router.get('/visit/:visitId', listForVisit);
router.patch('/:id/status', authorize('DOCTOR', 'ADMIN'), updateStatus);

export default router;

