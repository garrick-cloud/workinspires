import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export interface PlatformSettings {
  platformName: string;
  notificationsEnabled: boolean;
  autoReports: boolean;
  timezone: string;
}

const defaultSettings: PlatformSettings = {
  platformName: 'Workinspires',
  notificationsEnabled: true,
  autoReports: false,
  timezone: 'Asia/Kuala_Lumpur',
};

async function ensureSettings() {
  await pool.query(
    `
    INSERT INTO platform_settings (id, platform_name, notifications_enabled, auto_reports, timezone)
    VALUES (true, $1, $2, $3, $4)
    ON CONFLICT (id) DO NOTHING
    `,
    [
      defaultSettings.platformName,
      defaultSettings.notificationsEnabled,
      defaultSettings.autoReports,
      defaultSettings.timezone,
    ]
  );
}

export async function GET() {
  await ensureSettings();

  const result = await pool.query<PlatformSettings>(
    `
    SELECT
      platform_name AS "platformName",
      notifications_enabled AS "notificationsEnabled",
      auto_reports AS "autoReports",
      timezone
    FROM platform_settings
    WHERE id = true
    `
  );

  return Response.json(result.rows[0] ?? defaultSettings);
}

export async function PUT(request: Request) {
  const body = await request.json();

  const result = await pool.query<PlatformSettings>(
    `
    INSERT INTO platform_settings (id, platform_name, notifications_enabled, auto_reports, timezone, updated_at)
    VALUES (true, $1, $2, $3, $4, now())
    ON CONFLICT (id) DO UPDATE
    SET
      platform_name = EXCLUDED.platform_name,
      notifications_enabled = EXCLUDED.notifications_enabled,
      auto_reports = EXCLUDED.auto_reports,
      timezone = EXCLUDED.timezone,
      updated_at = now()
    RETURNING
      platform_name AS "platformName",
      notifications_enabled AS "notificationsEnabled",
      auto_reports AS "autoReports",
      timezone
    `,
    [
      body.platformName?.trim() || defaultSettings.platformName,
      Boolean(body.notificationsEnabled),
      Boolean(body.autoReports),
      body.timezone?.trim() || defaultSettings.timezone,
    ]
  );

  return Response.json(result.rows[0]);
}
