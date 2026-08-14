-- 删除 providers 表中的 promo_code 列
-- 该字段已被 coupon_code 替代

ALTER TABLE providers DROP COLUMN IF EXISTS promo_code;

-- 备注：执行前请确保所有数据已从 promo_code 迁移到 coupon_code
