import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { fail } from '../utils/response';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return fail(res, 409, 'CONFLICT', 'Resource already exists');
    }
  }

  return fail(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

