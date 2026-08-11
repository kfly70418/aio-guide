-- ==========================================
-- 完整数据库迁移脚本
-- 一次性执行所有表和策略的创建
-- ==========================================

-- 1. 创建 profiles 表（管理员资料）
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "管理员可查看所有资料" ON profiles;
CREATE POLICY "管理员可查看所有资料" ON profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "管理员可更新自己的资料" ON profiles;
CREATE POLICY "管理员可更新自己的资料" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 2. 创建 providers 表（服务商）
-- ==========================================
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

CREATE INDEX IF NOT EXISTS idx_providers_slug ON providers(slug);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_is_recommended ON providers(is_recommended);
CREATE INDEX IF NOT EXISTS idx_providers_sort_order ON providers(sort_order);
CREATE INDEX IF NOT EXISTS idx_providers_verified_at ON providers(verified_at);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "公众可查看已发布服务商" ON providers;
CREATE POLICY "公众可查看已发布服务商" ON providers
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "管理员可查看所有服务商" ON providers;
CREATE POLICY "管理员可查看所有服务商" ON providers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "管理员可管理服务商" ON providers;
CREATE POLICY "管理员可管理服务商" ON providers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP TRIGGER IF EXISTS update_providers_updated_at ON providers;
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 3. 创建 models 表（模型）
-- ==========================================
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

CREATE INDEX IF NOT EXISTS idx_models_slug ON models(slug);
CREATE INDEX IF NOT EXISTS idx_models_family ON models(family);
CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
CREATE INDEX IF NOT EXISTS idx_models_sort_order ON models(sort_order);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "公众可查看已发布模型" ON models;
CREATE POLICY "公众可查看已发布模型" ON models
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "管理员可管理模型" ON models;
CREATE POLICY "管理员可管理模型" ON models
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP TRIGGER IF EXISTS update_models_updated_at ON models;
CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON models FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 4. 创建 channels 表（渠道）
-- ==========================================
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

CREATE INDEX IF NOT EXISTS idx_channels_provider_id ON channels(provider_id);
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
CREATE INDEX IF NOT EXISTS idx_channels_priority ON channels(priority);

DROP INDEX IF EXISTS idx_channels_primary_per_provider;
CREATE UNIQUE INDEX idx_channels_primary_per_provider
  ON channels(provider_id) WHERE is_primary = true;

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "公众可查看活跃渠道" ON channels;
CREATE POLICY "公众可查看活跃渠道" ON channels
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND EXISTS (
    SELECT 1 FROM providers WHERE providers.id = channels.provider_id AND providers.status = 'published'
  ));

DROP POLICY IF EXISTS "管理员可管理渠道" ON channels;
CREATE POLICY "管理员可管理渠道" ON channels
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 5. 创建 prices 表（当前价格）
-- ==========================================
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

CREATE INDEX IF NOT EXISTS idx_prices_channel_id ON prices(channel_id);
CREATE INDEX IF NOT EXISTS idx_prices_model_id ON prices(model_id);
CREATE INDEX IF NOT EXISTS idx_prices_verified_at ON prices(verified_at);
CREATE INDEX IF NOT EXISTS idx_prices_status ON prices(status);
CREATE INDEX IF NOT EXISTS idx_prices_effective_date ON prices(effective_date);

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "公众可查看活跃价格" ON prices;
CREATE POLICY "公众可查看活跃价格" ON prices
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND EXISTS (
    SELECT 1 FROM channels JOIN providers ON providers.id = channels.provider_id
    WHERE channels.id = prices.channel_id AND channels.status = 'active' AND providers.status = 'published'
  ));

DROP POLICY IF EXISTS "管理员可管理价格" ON prices;
CREATE POLICY "管理员可管理价格" ON prices
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP TRIGGER IF EXISTS update_prices_updated_at ON prices;
CREATE TRIGGER update_prices_updated_at
  BEFORE UPDATE ON prices FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 6. 创建 price_history 表（价格历史）
-- ==========================================
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

CREATE INDEX IF NOT EXISTS idx_price_history_price_id ON price_history(price_id);
CREATE INDEX IF NOT EXISTS idx_price_history_channel_id ON price_history(channel_id);
CREATE INDEX IF NOT EXISTS idx_price_history_model_id ON price_history(model_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON price_history(changed_at);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "公众可查看价格历史" ON price_history;
CREATE POLICY "公众可查看价格历史" ON price_history
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM channels JOIN providers ON providers.id = channels.provider_id
    WHERE channels.id = price_history.channel_id AND channels.status = 'active' AND providers.status = 'published'
  ));

DROP POLICY IF EXISTS "管理员可查看所有历史" ON price_history;
CREATE POLICY "管理员可查看所有历史" ON price_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

-- 创建价格变更自动记录触发器
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
    OLD.price_input != NEW.price_input OR OLD.price_output != NEW.price_output
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

DROP TRIGGER IF EXISTS track_price_changes ON prices;
CREATE TRIGGER track_price_changes
  AFTER INSERT OR UPDATE ON prices FOR EACH ROW
  EXECUTE FUNCTION log_price_change();


-- 7. 创建 articles 表（教程文章）
-- ==========================================
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

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_related_provider_id ON articles(related_provider_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_sort_order ON articles(sort_order);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "公众可查看已发布文章" ON articles;
CREATE POLICY "公众可查看已发布文章" ON articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "管理员可管理文章" ON articles;
CREATE POLICY "管理员可管理文章" ON articles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 8. 创建 click_events 表（外链点击统计）
-- ==========================================
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_click_events_provider_id ON click_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_click_events_clicked_at ON click_events(clicked_at);

ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "公众可记录点击" ON click_events;
CREATE POLICY "公众可记录点击" ON click_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "管理员可查看点击" ON click_events;
CREATE POLICY "管理员可查看点击" ON click_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));


-- 9. 创建 audit_logs 表（操作日志）
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "管理员可查看日志" ON audit_logs;
CREATE POLICY "管理员可查看日志" ON audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "管理员可插入日志" ON audit_logs;
CREATE POLICY "管理员可插入日志" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));


-- ==========================================
-- 迁移完成！
-- ==========================================
