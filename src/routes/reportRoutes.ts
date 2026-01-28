import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { billingSummary, dailyVisits, queueStats, totalPatients } from '../controllers/reportController';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'RECEPTION'));

router.get('/daily-visits', dailyVisits);
router.get('/billing-summary', billingSummary);
router.get('/queue-stats', queueStats);
router.get('/total-patients', totalPatients);

export default router;

