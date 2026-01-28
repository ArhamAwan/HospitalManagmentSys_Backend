import type { Request, Response } from 'express';
import { fail } from '../utils/response';
import { getSettings, updateSettings } from '../services/settingService';
import { logUserAudit } from '../services/auditService';

export async function getAllSettings(_req: Request, res: Response) {
  const s = await getSettings();
  return res.json(s);
}

export async function updateAllSettings(req: Request, res: Response) {
  const { tokenResetTime, emergencyProtocolEnabled } = req.body as {
    tokenResetTime?: string;
    emergencyProtocolEnabled?: boolean;
  };

  if (tokenResetTime && !/^\d{2}:\d{2}$/.test(tokenResetTime)) {
    return fail(res, 400, 'VALIDATION_ERROR', 'tokenResetTime must be in HH:MM format');
  }

  const updated = await updateSettings({
    tokenResetTime,
    emergencyProtocolEnabled
  });

  if (req.user) {
    await logUserAudit({
      userId: req.user.id,
      actorId: req.user.id,
      action: 'SETTINGS_UPDATED',
      details: { tokenResetTime, emergencyProtocolEnabled }
    });
  }

  return res.json(updated);
}

