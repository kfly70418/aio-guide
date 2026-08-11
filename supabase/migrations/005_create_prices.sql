-- 创建 prices 表（当前价格）
CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  price_input DECIMAL(10, 4) NOT NULL,
  price_output DECIMAL(10, 4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY' CHECK (currency IN ('CNY', 'USD')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_id, model_id)
);

CREATE INDEX idx_prices_channel_id ON prices(channel_id);
CREATE INDEX idx_prices_model_id ON prices(model_id);
CREATE INDEX idx_prices_verified_at ON prices(verified_at);
CREATE INDEX idx_prices_status ON prices(status);
CREATE INDEX idx_prices_effective_date ON prices(effective_date);

-- 启用 RLS
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- 公众可以查看已发布服务商的活跃价格
CREATE POLICY "公众可查看活跃价格" ON prices
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM channels
      JOIN providers ON providers.id = channels.provider_id
      WHERE channels.id = prices.channel_id
        AND channels.status = 'active'
        AND providers.status = 'published'
    )
  );

-- 管理员可以管理所有价格
CREATE POLICY "管理员可管理价格" ON prices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- 创建触发器
CREATE TRIGGER update_prices_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
