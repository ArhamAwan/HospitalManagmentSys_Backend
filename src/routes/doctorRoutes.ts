import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getDoctor, getQueue, listDoctors } from '../controllers/doctorController';

const router = Router();

// Public (used by waiting display page)
router.get('/', listDoctors);
router.get('/:id', getDoctor);

// Protected (doctor queue UI)
router.get('/:id/queue', authenticate, authorize('DOCTOR', 'ADMIN', 'RECEPTION'), getQueue);

export default router;

