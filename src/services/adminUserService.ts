import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { logUserAudit } from './auditService';

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      doctor: true
    }
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    status: u.status,
    doctorName: u.doctor?.name ?? null,
    createdAt: u.createdAt
  }));
}

export async function createUser(input: { username: string; password: string; role: 'ADMIN' | 'RECEPTION' | 'DOCTOR' | 'NURSE' | 'DISPLAY' }) {
  const hash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      password: hash,
      role: input.role
    }
  });

  await logUserAudit({
    userId: user.id,
    action: 'USER_CREATED',
    details: { username: user.username, role: user.role }
  });

  return user;
}

export async function updateUser(
  id: string,
  input: Partial<{ username: string; role: 'ADMIN' | 'RECEPTION' | 'DOCTOR' | 'NURSE' | 'DISPLAY'; status: 'ACTIVE' | 'LOCKED' | 'DISABLED' }>,
  actorId?: string
) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      username: input.username,
      role: input.role,
      status: input.status
    }
  });

  await logUserAudit({
    userId: user.id,
    actorId,
    action: 'USER_UPDATED',
    details: input
  });

  return user;
}

export async function resetPassword(id: string, newPassword: string, actorId?: string) {
  const hash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { id },
    data: {
      password: hash
    }
  });

  await logUserAudit({
    userId: user.id,
    actorId,
    action: 'PASSWORD_RESET',
    details: { byAdmin: true }
  });

  return user;
}

