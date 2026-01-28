import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { billingSummary, dailyVisits, queueStats } from '../controllers/reportController';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/daily-visits', dailyVisits);
router.get('/billing-summary', billingSummary);
router.get('/queue-stats', queueStats);

export default router;

