import type { NextFunction, Request, Response } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { fail } from '../utils/response';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return fail(
          res,
          400,
          'VALIDATION_ERROR',
          'Invalid input data',
          error.errors.map((e) => e.message)
        );
      }
      return next(error);
    }
  };
}

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(3)
});

export const createPatientSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().regex(/^03\d{9}$/, 'Phone must be in format 03XXXXXXXXX'),
  address: z.string().optional()
});

export const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  isEmergency: z.boolean().optional().default(false)
});

export const createPrescriptionSchema = z.object({
  visitId: z.string().uuid(),
  diagnosis: z.string().optional(),
  clinicalNotes: z.string().optional(),
  medicines: z
    .array(
      z.object({
        medicineName: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        instructions: z.string().optional()
      })
    )
    .min(1)
});

export const createPaymentSchema = z.object({
  visitId: z.string().uuid(),
  amount: z.number().positive(),
  paymentType: z.enum(['CONSULTATION', 'EMERGENCY'])
});

export const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'RECEPTION', 'DOCTOR'])
});

export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  role: z.enum(['ADMIN', 'RECEPTION', 'DOCTOR']).optional(),
  status: z.enum(['ACTIVE', 'LOCKED', 'DISABLED']).optional()
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8)
});

export const updateDoctorConfigSchema = z.object({
  name: z.string().min(2).optional(),
  specialization: z.string().min(2).optional(),
  consultationFee: z.number().positive().optional(),
  roomNumber: z.string().min(1).optional()
});

export const createRoomSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1),
  floor: z.string().optional()
});

export const updateRoomSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  floor: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional()
});

export const createProcedureSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1),
  department: z.string().optional(),
  defaultFee: z.number().positive()
});

export const updateProcedureSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  department: z.string().optional(),
  defaultFee: z.number().positive().optional()
});

export const createInvoiceSchema = z.object({
  visitId: z.string().uuid(),
  discount: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0)
});

export const addInvoiceItemSchema = z.object({
  description: z.string().min(1),
  category: z.enum(['CONSULTATION', 'EMERGENCY', 'LAB', 'IMAGING', 'MEDICINE', 'PROCEDURE', 'OTHER']),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0)
});

export const recordInvoicePaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET', 'OTHER']),
  reference: z.string().optional()
});

