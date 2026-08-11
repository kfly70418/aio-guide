-- 创建 providers 表（服务商）
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  features TEXT[],
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_providers_slug ON providers(slug);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_is_recommended ON providers(is_recommended);
CREATE INDEX idx_providers_sort_order ON providers(sort_order);
CREATE INDEX idx_providers_verified_at ON providers(verified_at);

-- 启用 RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- 公众可以查看已发布的服务商
CREATE POLICY "公众可查看已发布服务商" ON providers
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- 管理员可以查看所有服务商
CREATE POLICY "管理员可查看所有服务商" ON providers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- 管理员可以管理服务商
CREATE POLICY "管理员可管理服务商" ON providers
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
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
