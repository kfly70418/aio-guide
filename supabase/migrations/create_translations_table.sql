-- 创建翻译表
-- 用于存储所有资源的多语言翻译

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,  -- 'provider', 'model', 'article', 'faq'
  resource_id UUID NOT NULL,     -- 关联资源的 ID
  locale TEXT NOT NULL,          -- 'zh', 'ru'
  field TEXT NOT NULL,           -- 'name', 'description', 'content', 'features'
  value TEXT NOT NULL,           -- 翻译后的值
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_type, resource_id, locale, field)
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_translations_lookup
ON translations(resource_type, resource_id, locale);

CREATE INDEX IF NOT EXISTS idx_translations_resource
ON translations(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_translations_locale
ON translations(locale);

-- 添加注释
COMMENT ON TABLE translations IS '多语言翻译表';
COMMENT ON COLUMN translations.resource_type IS '资源类型：provider, model, article, faq';
COMMENT ON COLUMN translations.resource_id IS '关联资源的ID';
COMMENT ON COLUMN translations.locale IS '语言代码：zh, ru';
COMMENT ON COLUMN translations.field IS '字段名：name, description, content等';
COMMENT ON COLUMN translations.value IS '翻译后的文本内容';

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
