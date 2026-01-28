import type { User } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: string;
}

export type AuthUser = User & {
  doctor?: import('@prisma/client').Doctor | null;
};

