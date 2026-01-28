import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, loginSchema } from '../middleware/validator';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;

