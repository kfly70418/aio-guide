# 数据库设计文档

## 概述

使用 Supabase PostgreSQL 数据库，所有表启用 Row Level Security (RLS)，确保数据安全。

## 表结构

### 1. profiles（管理员资料）

存储管理员账号的扩展信息。

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
```

**字段说明**：
- `id`: 关联 Supabase Auth 用户 ID
- `email`: 邮箱（冗余存储，方便查询）
- `display_name`: 显示名称
- `avatar_url`: 头像 URL
- `role`: 角色（admin/super_admin）
- `is_active`: 是否启用

---

### 2. providers（服务商）

存储 AI API 服务商信息。

```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  features TEXT[], -- 特色功能标签
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ, -- 最后人工核验时间
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
```

**字段说明**：
- `slug`: URL 友好的唯一标识（如 openai-official）
- `name`: 中文名称
- `name_en`: 英文名称（可选）
- `logo_url`: Logo 图片 URL
- `website_url`: 官网链接
- `description`: 简介
- `features`: 特色功能（如 ["支持 GPT-4", "按需计费", "无需翻墙"]）
- `is_recommended`: 是否推荐
- `status`: 状态（草稿/已发布/已归档）
- `sort_order`: 排序权重（数字越大越靠前）
- `verified_at`: 最后核验时间

---

### 3. models（模型）

存储 AI 模型信息。

```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL, -- 如 gpt-4-turbo
  family TEXT NOT NULL, -- 如 GPT-4
  provider_official TEXT, -- 官方提供商（如 OpenAI）
  description TEXT,
  official_price_input DECIMAL(10, 4), -- 官方输入价格（美元/百万 token）
  official_price_output DECIMAL(10, 4), -- 官方输出价格
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
```

**字段说明**：
- `slug`: URL 友好标识（如 gpt-4-turbo）
- `name`: 模型名称
- `family`: 模型家族（用于分组）
- `provider_official`: 官方提供商名称
- `description`: 模型简介
- `official_price_input/output`: 官方定价参考（美元）

---

### 4. channels（渠道）

每个服务商可能有多个渠道（如官方渠道、代理渠道）。

```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 如 "官方渠道"、"代理 A"
  description TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false, -- 是否主渠道
  priority INTEGER NOT NULL DEFAULT 0, -- 优先级（数字越大越优先）
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
```

**字段说明**：
- `provider_id`: 所属服务商
- `name`: 渠道名称
- `is_primary`: 是否为主渠道（每个服务商只能有一个）
- `priority`: 优先级（用于默认显示哪个渠道的价格）

---

### 5. prices（当前价格）

存储每个渠道对每个模型的当前价格。

```sql
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  price_input DECIMAL(10, 4) NOT NULL, -- 输入价格（人民币/百万 token）
  price_output DECIMAL(10, 4) NOT NULL, -- 输出价格
  currency TEXT NOT NULL DEFAULT 'CNY' CHECK (currency IN ('CNY', 'USD')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT, -- 备注（如 "首充送 10 元"）
  verified_at TIMESTAMPTZ, -- 人工核验时间
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 确保同一渠道对同一模型只有一个当前价格
  UNIQUE(channel_id, model_id)
);

CREATE INDEX idx_prices_channel_id ON prices(channel_id);
CREATE INDEX idx_prices_model_id ON prices(model_id);
CREATE INDEX idx_prices_verified_at ON prices(verified_at);
CREATE INDEX idx_prices_status ON prices(status);
CREATE INDEX idx_prices_effective_date ON prices(effective_date);
```

**字段说明**：
- `channel_id`: 所属渠道
- `model_id`: 所属模型
- `price_input/output`: 价格（人民币/百万 token）
- `currency`: 货币单位
- `effective_date`: 生效日期
- `notes`: 备注信息
- `verified_at`: 最后核验时间

---

### 6. price_history（价格历史）

自动记录价格变更历史。

```sql
CREATE TABLE price_history (
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
```

**字段说明**：
- `price_id`: 关联的价格记录
- `price_input/output_old`: 旧价格
- `price_input/output_new`: 新价格
- `change_type`: 变更类型
- `changed_by`: 操作人
- `changed_at`: 变更时间

---

### 7. articles（教程文章）

存储教程和帮助文章。

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT, -- 摘要
  content TEXT NOT NULL, -- Markdown 内容
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
```

**字段说明**：
- `slug`: URL 友好标识
- `title`: 标题
- `summary`: 摘要（用于列表展示）
- `content`: 正文（Markdown 格式）
- `cover_image_url`: 封面图
- `related_provider_id`: 关联的服务商（可选）
- `category`: 分类
- `tags`: 标签数组
- `view_count`: 浏览次数
- `published_at`: 发布时间

---

### 8. click_events（外链点击）

记录用户点击服务商外链的行为。

```sql
CREATE TABLE click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  referrer TEXT, -- 来源页面
  user_agent TEXT,
  ip_address INET,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_click_events_provider_id ON click_events(provider_id);
CREATE INDEX idx_click_events_clicked_at ON click_events(clicked_at);
```

**字段说明**：
- `provider_id`: 点击的服务商
- `referrer`: 来源页面 URL
- `user_agent`: 浏览器信息
- `ip_address`: IP 地址（可选，考虑隐私）
- `clicked_at`: 点击时间

---

### 9. audit_logs（操作日志）

记录所有管理员操作。

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL, -- 操作类型（如 create_provider, update_price）
  resource_type TEXT NOT NULL, -- 资源类型（如 provider, price）
  resource_id UUID, -- 资源 ID
  details JSONB, -- 详细信息（如修改前后的值）
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**字段说明**：
- `user_id`: 操作人
- `action`: 操作类型
- `resource_type`: 操作的资源类型
- `resource_id`: 资源 ID
- `details`: JSON 格式的详细信息
- `created_at`: 操作时间

---

## Row Level Security (RLS) 策略

### profiles 表

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有资料
CREATE POLICY "管理员可查看所有资料" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- 管理员可以更新自己的资料
CREATE POLICY "管理员可更新自己的资料" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

### providers 表

```sql
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

-- 管理员可以插入、更新、删除服务商
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
```

### models 表

```sql
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
```

### channels 表

```sql
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
```

### prices 表

```sql
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
```

### price_history 表

```sql
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- 公众可以查看价格历史（通过关联的 prices 表权限）
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

-- 只允许通过触发器插入（不允许直接 INSERT）
```

### articles 表

```sql
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
```

### click_events 表

```sql
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
```

### audit_logs 表

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 只允许管理员查看操作日志
CREATE POLICY "管理员可查看日志" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- 只允许通过应用逻辑插入日志（不允许直接 INSERT）
```

---

## 触发器和函数

### 1. 自动更新 updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有需要的表创建触发器
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 其他表同理...
```

### 2. 自动记录价格历史

```sql
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

CREATE TRIGGER track_price_changes
  AFTER INSERT OR UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();
```

---

## 初始数据

### 创建第一个管理员

管理员账号需要先在 Supabase Auth 中创建，然后在 profiles 表中添加记录：

```sql
-- 假设管理员邮箱是 admin@example.com
-- 先在 Supabase Dashboard 的 Authentication 中创建用户
-- 然后插入 profiles 记录
INSERT INTO profiles (id, email, display_name, role, is_active)
VALUES (
  '用户的 UUID', -- 从 auth.users 表中获取
  'admin@example.com',
  '管理员',
  'super_admin',
  true
);
```

---

## 数据迁移策略

1. 使用 Supabase CLI 管理迁移文件
2. 每次结构变更创建新的迁移文件
3. 在本地测试迁移后再应用到生产环境
4. 重要变更前先备份数据库

---

## 性能优化建议

1. **索引**: 已在表定义中添加必要的索引
2. **分页**: 列表查询必须分页，避免一次性加载大量数据
3. **缓存**: 使用 Next.js 缓存机制减少数据库查询
4. **连接池**: Supabase 自动管理连接池
5. **查询优化**: 避免 N+1 查询，使用 JOIN 或批量查询

---

## 备份策略

1. Supabase 自动每日备份（保留 7 天）
2. 重要操作前手动备份
3. 定期导出关键数据到 CSV
4. 测试恢复流程

---

## 数据质量检查

### 需要定期检查的项目

1. **过期数据**: 超过 30 天未核验的价格
2. **孤立数据**: 没有关联服务商的渠道、没有价格的模型
3. **数据一致性**: 确保主渠道的唯一性
4. **草稿清理**: 长期未发布的草稿

```sql
-- 查询过期价格（超过 30 天未核验）
SELECT p.*, pr.name as provider_name, m.name as model_name
FROM prices p
JOIN channels c ON c.id = p.channel_id
JOIN providers pr ON pr.id = c.provider_id
JOIN models m ON m.id = p.model_id
WHERE p.verified_at < NOW() - INTERVAL '30 days'
  OR p.verified_at IS NULL
ORDER BY p.verified_at ASC NULLS FIRST;
```
