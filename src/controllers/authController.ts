import type { Request, Response } from 'express';
import {
  login as loginService,
  changePassword as changePasswordService,
  requestPasswordReset,
  AuthError
} from '../services/authService';
import { fail } from '../utils/response';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as { username: string; password: string };

  try {
    const result = await loginService(username, password);
    return res.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === 'ACCOUNT_LOCKED') {
        return fail(
          res,
          423,
          'ACCOUNT_LOCKED',
          error.message
        );
      }
      if (error.code === 'ACCOUNT_INACTIVE') {
        return fail(
          res,
          403,
          'ACCOUNT_INACTIVE',
          error.message
        );
      }
      return fail(res, 401, error.code, error.message);
    }
    throw error;
  }
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

export async function changePassword(req: Request, res: Response) {
  if (!req.user) {
    return fail(res, 401, 'UNAUTHORIZED', 'Not authenticated');
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  try {
    await changePasswordService(req.user.id, currentPassword, newPassword);
    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      const status =
        error.code === 'INVALID_CURRENT_PASSWORD'
          ? 400
          : error.code === 'ACCOUNT_INACTIVE'
            ? 403
            : 400;
      return fail(res, status, error.code, error.message);
    }
    throw error;
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { username } = req.body as { username: string };

  // Always respond with success to avoid leaking which usernames exist.
  await requestPasswordReset(username);

  return res.json({
    ok: true,
    message: 'If the username exists, password reset instructions have been recorded.'
  });
}

