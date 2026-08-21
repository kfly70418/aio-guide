-- 为文章表添加俄语配图字段
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image_url_ru TEXT;

COMMENT ON COLUMN articles.cover_image_url_ru IS '俄语版配图URL';
