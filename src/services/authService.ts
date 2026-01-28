import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { signToken } from './tokenService';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;

// In-memory tracker for failed login attempts per username.
// This avoids schema changes while still supporting lockout after repeated failures.
const failedLoginAttempts = new Map<string, number>();

export class AuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { doctor: true }
  });

  // Treat missing or disabled users as invalid credentials to avoid leaking information.
  if (!user || user.status === 'DISABLED') {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid username or password');
  }

  if (user.status === 'LOCKED') {
    throw new AuthError(
      'ACCOUNT_LOCKED',
      'Your account is locked due to multiple failed login attempts. Please contact an administrator.'
    );
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const current = failedLoginAttempts.get(username) ?? 0;
    const next = current + 1;
    failedLoginAttempts.set(username, next);

    if (next >= MAX_FAILED_LOGIN_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'LOCKED' }
      });
      failedLoginAttempts.delete(username);
      throw new AuthError(
        'ACCOUNT_LOCKED',
        'Your account has been locked due to multiple failed login attempts. Please contact an administrator.'
      );
    }

    throw new AuthError('INVALID_CREDENTIALS', 'Invalid username or password');
  }

  // Successful login – clear any failed attempts.
  if (failedLoginAttempts.has(username)) {
    failedLoginAttempts.delete(username);
  }

  if (user.status !== 'ACTIVE') {
    throw new AuthError('ACCOUNT_INACTIVE', 'Your account is not active. Please contact an administrator.');
  }

  const token = signToken({ userId: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      doctorId: user.doctor?.id
    }
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { doctor: true }
  });

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    doctorId: user.doctor?.id
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new AuthError('ACCOUNT_INACTIVE', 'Account is not active.');
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    throw new AuthError('INVALID_CURRENT_PASSWORD', 'Current password is incorrect.');
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed }
  });
}

export async function requestPasswordReset(username: string) {
  // Minimal implementation: record an audit entry if the user exists,
  // but always return success to avoid leaking which usernames exist.
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (user) {
    await prisma.userAuditLog.create({
      data: {
        userId: user.id,
        actorId: user.id,
        action: 'FORGOT_PASSWORD_REQUESTED',
        details: {}
      }
    });
  }
}


