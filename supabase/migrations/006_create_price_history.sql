-- 创建 price_history 表（价格历史）
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id UUID NOT NULL REFERENCES prices(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id),
  model_id UUID NOT NULL REFERENCES models(id),
  price_input_old DECIMAL(10, 4),
  price_output_old DECIMAL(10, 4),
  price_input_new DECIMAL(10, 4) NOT NULL,
  price_output_new DECIMAL(10, 4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_price_id ON price_history(price_id);
CREATE INDEX idx_price_history_channel_id ON price_history(channel_id);
CREATE INDEX idx_price_history_model_id ON price_history(model_id);
CREATE INDEX idx_price_history_changed_at ON price_history(changed_at);

-- 启用 RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- 公众可以查看价格历史
CREATE POLICY "公众可查看价格历史" ON price_history
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channels
      JOIN providers ON providers.id = channels.provider_id
      WHERE channels.id = price_history.channel_id
        AND channels.status = 'active'
        AND providers.status = 'published'
    )
  );

-- 管理员可以查看所有历史
CREATE POLICY "管理员可查看所有历史" ON price_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- 创建自动记录价格历史的触发器函数
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO price_history (
      price_id, channel_id, model_id,
      price_input_new, price_output_new, currency,
      change_type, changed_by
    ) VALUES (
      NEW.id, NEW.channel_id, NEW.model_id,
      NEW.price_input, NEW.price_output, NEW.currency,
      'created', NEW.updated_by
    );
  ELSIF TG_OP = 'UPDATE' AND (
    OLD.price_input != NEW.price_input OR
    OLD.price_output != NEW.price_output
  ) THEN
    INSERT INTO price_history (
      price_id, channel_id, model_id,
      price_input_old, price_output_old,
      price_input_new, price_output_new, currency,
      change_type, changed_by
    ) VALUES (
      NEW.id, NEW.channel_id, NEW.model_id,
      OLD.price_input, OLD.price_output,
      NEW.price_input, NEW.price_output, NEW.currency,
      'updated', NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 prices 表创建触发器
CREATE TRIGGER track_price_changes
  AFTER INSERT OR UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();
