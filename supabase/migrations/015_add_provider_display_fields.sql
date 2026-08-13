-- 为 providers 表增加前端展示相关字段
-- 包括：稳定性评分、价格水平、支付方式、退款政策、开票政策、赠送额度、优惠券信息、是否精选、状态

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS stability_score INTEGER CHECK (stability_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS price_level TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods TEXT,
  ADD COLUMN IF NOT EXISTS refund_policy TEXT,
  ADD COLUMN IF NOT EXISTS invoice_policy TEXT,
  ADD COLUMN IF NOT EXISTS free_credits DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS min_recharge INTEGER,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_note TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 修改 status 字段允许 'active' 状态
ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_status_check;
ALTER TABLE providers ADD CONSTRAINT providers_status_check 
  CHECK (status IN ('draft', 'published', 'archived', 'active'));

-- 修改 verification_status 允许更多状态
ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_verification_status_check;
ALTER TABLE providers ADD CONSTRAINT providers_verification_status_check
  CHECK (verification_status IN ('verified', 'unverified', 'flagged', 'pending', 'suspect', 'failed'));

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
