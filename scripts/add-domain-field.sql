-- 在 Supabase SQL Editor 执行：https://supabase.com/dashboard/project/bmnvirrnbkrepmixiisq/sql

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS domain TEXT;

COMMENT ON COLUMN providers.domain IS '服务商域名，例如 api.h-api.com';

-- 验证
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'providers' AND column_name = 'domain';
