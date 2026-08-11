-- 创建 articles 表（教程文章）
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  related_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'tutorial' CHECK (category IN ('tutorial', 'guide', 'news', 'faq')),
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_related_provider_id ON articles(related_provider_id);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_sort_order ON articles(sort_order);

-- 启用 RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 公众可以查看已发布的文章
CREATE POLICY "公众可查看已发布文章" ON articles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- 管理员可以管理所有文章
CREATE POLICY "管理员可管理文章" ON articles
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
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
