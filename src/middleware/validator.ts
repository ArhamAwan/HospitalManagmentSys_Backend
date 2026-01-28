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

