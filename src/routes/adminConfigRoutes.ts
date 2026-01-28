import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createProcedure,
  createRoom,
  deleteProcedure,
  deleteRoom,
  listDoctors,
  listProcedures,
  listRooms,
  updateDoctor,
  updateProcedure,
  updateRoom
} from '../controllers/adminConfigController';
import {
  createProcedureSchema,
  createRoomSchema,
  updateDoctorConfigSchema,
  updateProcedureSchema,
  updateRoomSchema,
  validate
} from '../middleware/validator';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/doctors', listDoctors);
router.patch('/doctors/:id', validate(updateDoctorConfigSchema), updateDoctor);

router.get('/rooms', listRooms);
router.post('/rooms', validate(createRoomSchema), createRoom);
router.patch('/rooms/:id', validate(updateRoomSchema), updateRoom);
router.delete('/rooms/:id', deleteRoom);

router.get('/procedures', listProcedures);
router.post('/procedures', validate(createProcedureSchema), createProcedure);
router.patch('/procedures/:id', validate(updateProcedureSchema), updateProcedure);
router.delete('/procedures/:id', deleteProcedure);

export default router;

