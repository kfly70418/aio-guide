-- 创建 channels 表（渠道）
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_channels_provider_id ON channels(provider_id);
CREATE INDEX idx_channels_status ON channels(status);
CREATE INDEX idx_channels_priority ON channels(priority);

-- 确保每个服务商只有一个主渠道
CREATE UNIQUE INDEX idx_channels_primary_per_provider
  ON channels(provider_id)
  WHERE is_primary = true;

-- 启用 RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- 公众可以查看已发布服务商的活跃渠道
CREATE POLICY "公众可查看活跃渠道" ON channels
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM providers
      WHERE providers.id = channels.provider_id
        AND providers.status = 'published'
    )
  );

-- 管理员可以管理所有渠道
CREATE POLICY "管理员可管理渠道" ON channels
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
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
