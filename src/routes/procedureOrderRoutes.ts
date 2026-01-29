import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createProcedureOrder,
  listForVisit,
  updateStatus,
  startProcedure,
  completeProcedure,
  listOngoing,
  listRequested
} from '../controllers/procedureOrderController';

const router = Router();

router.use(authenticate);

router.post('/', authorize('DOCTOR', 'ADMIN'), createProcedureOrder);
router.get('/visit/:visitId', listForVisit);
router.get('/ongoing', authorize('NURSE', 'ADMIN'), listOngoing);
router.get('/requested', authorize('NURSE', 'ADMIN'), listRequested);
router.patch('/:id/status', authorize('DOCTOR', 'ADMIN', 'NURSE'), updateStatus);
router.patch('/:id/start', authorize('NURSE', 'ADMIN'), startProcedure);
router.patch('/:id/complete', authorize('NURSE', 'ADMIN'), completeProcedure);

export default router;

