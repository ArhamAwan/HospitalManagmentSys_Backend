import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { signToken } from './tokenService';

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { doctor: true }
  });

  if (!user) {
    return null;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return null;
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

