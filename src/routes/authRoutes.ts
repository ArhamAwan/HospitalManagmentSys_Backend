import { Router } from 'express';
import { login, logout, me, changePassword, forgotPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, loginSchema, changePasswordSchema, forgotPasswordSchema } from '../middleware/validator';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;

