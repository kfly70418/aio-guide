-- 为 articles 表添加 views 字段（替代 view_count）
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

-- 如果 view_count 存在数据，迁移到 views
UPDATE articles SET views = view_count WHERE view_count IS NOT NULL;

-- 可选：如果要完全替换 view_count，取消注释下面的行
-- ALTER TABLE articles DROP COLUMN IF EXISTS view_count;

COMMENT ON COLUMN articles.views IS '文章浏览次数';
