import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createUser, listUsers, resetPassword, updateUser } from '../controllers/adminUserController';
import { createUserSchema, resetPasswordSchema, updateUserSchema, validate } from '../middleware/validator';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.post('/:id/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;

