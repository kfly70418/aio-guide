-- 为 providers 表增加运营相关字段
-- 这些字段记录平台级的运营信息：起充门槛、赠送额度、手续费率、
-- 开票支持、优惠码，以及检测状态（区别于核验时间 verified_at）。

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS min_topup TEXT,
  ADD COLUMN IF NOT EXISTS trial_credit TEXT,
  ADD COLUMN IF NOT EXISTS transaction_fee TEXT,
  ADD COLUMN IF NOT EXISTS invoice_support BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('verified', 'pending', 'suspect', 'failed'));

COMMENT ON COLUMN providers.min_topup IS '最低充值金额，例如 "¥10"、"$5"、"无门槛"';
COMMENT ON COLUMN providers.trial_credit IS '注册赠送额度，例如 "$0.5"、"¥7"、"无"';
COMMENT ON COLUMN providers.transaction_fee IS '充值手续费率或说明，例如 "3%"、"无"、"支付宝 2% / USDT 无"';
COMMENT ON COLUMN providers.invoice_support IS '是否支持开具发票';
COMMENT ON COLUMN providers.promo_code IS '平台优惠码，例如 "APIRANKING"、"Y7" 等';
COMMENT ON COLUMN providers.verification_status IS '核验检测状态：verified=通过检测，pending=待检测，suspect=存疑，failed=未通过。与 verified_at（核验时间）配合使用';

-- 价格历史表也记录手续费和起充变更（这两项变更频次较高）
ALTER TABLE price_history
  ADD COLUMN IF NOT EXISTS min_topup_old TEXT,
  ADD COLUMN IF NOT EXISTS min_topup_new TEXT,
  ADD COLUMN IF NOT EXISTS transaction_fee_old TEXT,
  ADD COLUMN IF NOT EXISTS transaction_fee_new TEXT;

COMMENT ON COLUMN price_history.min_topup_old IS '变更前的最低充值金额';
COMMENT ON COLUMN price_history.min_topup_new IS '变更后的最低充值金额';
COMMENT ON COLUMN price_history.transaction_fee_old IS '变更前的手续费率';
COMMENT ON COLUMN price_history.transaction_fee_new IS '变更后的手续费率';
