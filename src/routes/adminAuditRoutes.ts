import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { listLogs } from '../controllers/adminAuditController';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', listLogs);

export default router;

