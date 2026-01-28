import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createVisitSchema } from '../middleware/validator';
import { callNext, complete, createVisit, getVisit, today } from '../controllers/visitController';

const router = Router();

router.post('/', authenticate, authorize('RECEPTION', 'ADMIN'), validate(createVisitSchema), createVisit);
router.get('/today', authenticate, today);
router.get('/:id', authenticate, getVisit);
router.patch('/:id/call', authenticate, authorize('DOCTOR', 'RECEPTION', 'ADMIN'), callNext);
router.patch('/:id/complete', authenticate, authorize('DOCTOR', 'ADMIN'), complete);

export default router;

