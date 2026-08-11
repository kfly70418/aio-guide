-- 创建 click_events 表（外链点击统计）
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_click_events_provider_id ON click_events(provider_id);
CREATE INDEX idx_click_events_clicked_at ON click_events(clicked_at);

-- 启用 RLS
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- 公众可以插入点击事件
CREATE POLICY "公众可记录点击" ON click_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 管理员可以查看所有点击事件
CREATE POLICY "管理员可查看点击" ON click_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );
