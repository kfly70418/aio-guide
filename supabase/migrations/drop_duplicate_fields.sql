-- 删除 providers 表中的废弃字段
-- 这些字段已被其他字段替代：
-- min_recharge → min_topup
-- free_credits → trial_credit

-- 确保数据已同步
-- 执行前请确认：
-- 1. min_topup 已包含所有 min_recharge 的数据
-- 2. trial_credit 已包含所有 free_credits 的数据

ALTER TABLE providers DROP COLUMN IF EXISTS min_recharge;
ALTER TABLE providers DROP COLUMN IF EXISTS free_credits;

-- 说明：
-- min_recharge 存储纯数字，min_topup 存储带货币符号的字符串（如 ¥1）
-- free_credits 存储纯数字，trial_credit 存储带货币符号的字符串（如 $3）
-- 统一使用带货币符号的版本，避免前端重复拼接
