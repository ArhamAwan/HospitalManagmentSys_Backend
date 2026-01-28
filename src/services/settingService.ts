import { prisma } from '../config/database';

export type AppSettings = {
  tokenResetTime: string; // HH:MM, e.g. "06:00"
  emergencyProtocolEnabled: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  tokenResetTime: '00:00',
  emergencyProtocolEnabled: false
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    tokenResetTime: map.tokenResetTime ?? DEFAULT_SETTINGS.tokenResetTime,
    emergencyProtocolEnabled:
      map.emergencyProtocolEnabled !== undefined
        ? map.emergencyProtocolEnabled === 'true'
        : DEFAULT_SETTINGS.emergencyProtocolEnabled
  };
}

export async function updateSettings(input: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next: AppSettings = {
    ...current,
    ...input
  };

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: 'tokenResetTime' },
      update: { value: next.tokenResetTime },
      create: { key: 'tokenResetTime', value: next.tokenResetTime }
    }),
    prisma.setting.upsert({
      where: { key: 'emergencyProtocolEnabled' },
      update: { value: String(next.emergencyProtocolEnabled) },
      create: { key: 'emergencyProtocolEnabled', value: String(next.emergencyProtocolEnabled) }
    })
  ]);

  return next;
}

