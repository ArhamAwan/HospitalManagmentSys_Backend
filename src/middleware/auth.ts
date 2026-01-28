import type { NextFunction, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import type { JwtPayload } from '../types';
import { fail } from '../utils/response';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.replace('Bearer ', '') : undefined;

    if (!token) {
      return fail(res, 401, 'UNAUTHORIZED', 'No token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { doctor: true }
    });

    if (!user) {
      return fail(res, 401, 'UNAUTHORIZED', 'Invalid token');
    }

    req.user = user;
    return next();
  } catch (error) {
    return fail(res, 401, 'UNAUTHORIZED', 'Invalid token');
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 403, 'FORBIDDEN', 'Insufficient permissions');
    }
    return next();
  };
}

