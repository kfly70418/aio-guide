-- 创建 models 表（模型）
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  family TEXT NOT NULL,
  provider_official TEXT,
  description TEXT,
  official_price_input DECIMAL(10, 4),
  official_price_output DECIMAL(10, 4),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_models_slug ON models(slug);
CREATE INDEX idx_models_family ON models(family);
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_models_sort_order ON models(sort_order);

-- 启用 RLS
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- 公众可以查看已发布的模型
CREATE POLICY "公众可查看已发布模型" ON models
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- 管理员可以管理所有模型
CREATE POLICY "管理员可管理模型" ON models
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
CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
