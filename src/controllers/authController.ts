import type { Request, Response } from 'express';
import { login as loginService } from '../services/authService';
import { fail } from '../utils/response';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as { username: string; password: string };

  const result = await loginService(username, password);
  if (!result) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  return res.json(result);
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return fail(res, 401, 'UNAUTHORIZED', 'Not authenticated');
  }

  return res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
    doctorId: req.user.doctor?.id
  });
}

export async function logout(_req: Request, res: Response) {
  // Stateless JWT: client removes token.
  return res.json({ ok: true });
}

