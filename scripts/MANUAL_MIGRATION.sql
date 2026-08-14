-- ============================================================
-- 手动执行此 SQL：https://supabase.com/dashboard/project/bmnvirrnbkrepmixiisq/sql
-- ============================================================

-- 1. 添加所有缺失的字段
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS stability_score INTEGER,
  ADD COLUMN IF NOT EXISTS price_level TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods TEXT,
  ADD COLUMN IF NOT EXISTS refund_policy TEXT,
  ADD COLUMN IF NOT EXISTS invoice_policy TEXT,
  ADD COLUMN IF NOT EXISTS free_credits DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS min_recharge INTEGER,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_note TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. 放宽 status 约束（支持 'active'）
ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_status_check;
ALTER TABLE providers ADD CONSTRAINT providers_status_check
  CHECK (status IN ('draft', 'published', 'archived', 'active'));

-- 3. 放宽 verification_status 约束
ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_verification_status_check;
ALTER TABLE providers ADD CONSTRAINT providers_verification_status_check
  CHECK (verification_status IN ('verified', 'unverified', 'flagged', 'pending', 'suspect', 'failed'));

-- 4. 添加 stability_score 约束
ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_stability_score_check;
ALTER TABLE providers ADD CONSTRAINT providers_stability_score_check
  CHECK (stability_score BETWEEN 1 AND 5);

-- 5. 添加注释
COMMENT ON COLUMN providers.stability_score IS '稳定性评分 1-5，5 表示优秀';
COMMENT ON COLUMN providers.price_level IS '价格水平描述，例如 "低 中"';
COMMENT ON COLUMN providers.payment_methods IS '支付方式，例如 "支付宝"';
COMMENT ON COLUMN providers.refund_policy IS '退款政策描述';
COMMENT ON COLUMN providers.invoice_policy IS '开票政策描述';
COMMENT ON COLUMN providers.free_credits IS '赠送额度（美元）';
COMMENT ON COLUMN providers.min_recharge IS '最低起充金额（人民币）';
COMMENT ON COLUMN providers.coupon_code IS '优惠码';
COMMENT ON COLUMN providers.coupon_note IS '优惠码说明';
COMMENT ON COLUMN providers.is_featured IS '是否为精选服务商';

-- 验证：查看字段是否添加成功
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'providers'
  AND column_name IN (
    'stability_score', 'price_level', 'payment_methods',
    'refund_policy', 'invoice_policy', 'free_credits',
    'min_recharge', 'coupon_code', 'coupon_note', 'is_featured'
  )
ORDER BY column_name;
