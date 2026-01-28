import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { fail } from '../utils/response';
import * as adminUserService from '../services/adminUserService';

export async function listUsers(req: Request, res: Response) {
  const users = await adminUserService.listUsers();
  return res.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      status: u.status,
      doctorName: u.doctorName,
      createdAt: u.createdAt.toISOString()
    }))
  );
}

export async function createUser(req: Request, res: Response) {
  try {
    const user = await adminUserService.createUser(req.body);
    return res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString()
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return fail(res, 409, 'CONFLICT', 'Username already exists');
    }
    throw err;
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const user = await adminUserService.updateUser(id, req.body, req.user?.id);
    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString()
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'User not found');
    }
    throw err;
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await adminUserService.resetPassword(id, req.body.password, req.user?.id);
    return res.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return fail(res, 404, 'NOT_FOUND', 'User not found');
    }
    throw err;
  }
}

