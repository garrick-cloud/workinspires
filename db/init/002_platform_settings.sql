CREATE TABLE IF NOT EXISTS platform_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  platform_name text NOT NULL DEFAULT 'Workinspires',
  notifications_enabled boolean NOT NULL DEFAULT true,
  auto_reports boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  updated_at timestamptz NOT NULL DEFAULT now()
);
