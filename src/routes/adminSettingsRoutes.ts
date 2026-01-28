import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getAllSettings, updateAllSettings } from '../controllers/adminSettingsController';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', getAllSettings);
router.put('/', updateAllSettings);

export default router;

