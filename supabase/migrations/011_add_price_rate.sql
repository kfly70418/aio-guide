-- 为 prices 表增加"倍率"字段
-- 倍率 = 中转站价格 / 官方价格，用于直观对比溢价或折扣

ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS rate DECIMAL(10, 4);

COMMENT ON COLUMN prices.rate IS '相对官方价格的倍率，例如 0.5 表示官方价的五折';

-- 价格历史表同步记录倍率变化
ALTER TABLE price_history
  ADD COLUMN IF NOT EXISTS rate_old DECIMAL(10, 4);

ALTER TABLE price_history
  ADD COLUMN IF NOT EXISTS rate_new DECIMAL(10, 4);

-- 重建触发器函数，把倍率一起写入历史
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO price_history (
      price_id, channel_id, model_id,
      price_input_new, price_output_new, rate_new, currency,
      change_type, changed_by
    ) VALUES (
      NEW.id, NEW.channel_id, NEW.model_id,
      NEW.price_input, NEW.price_output, NEW.rate, NEW.currency,
      'created', NEW.updated_by
    );
  ELSIF TG_OP = 'UPDATE' AND (
    OLD.price_input IS DISTINCT FROM NEW.price_input OR
    OLD.price_output IS DISTINCT FROM NEW.price_output OR
    OLD.rate IS DISTINCT FROM NEW.rate
  ) THEN
    INSERT INTO price_history (
      price_id, channel_id, model_id,
      price_input_old, price_output_old, rate_old,
      price_input_new, price_output_new, rate_new, currency,
      change_type, changed_by
    ) VALUES (
      NEW.id, NEW.channel_id, NEW.model_id,
      OLD.price_input, OLD.price_output, OLD.rate,
      NEW.price_input, NEW.price_output, NEW.rate, NEW.currency,
      'updated', NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_price_changes ON prices;
CREATE TRIGGER track_price_changes
  AFTER INSERT OR UPDATE ON prices FOR EACH ROW
  EXECUTE FUNCTION log_price_change();
