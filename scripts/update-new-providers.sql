-- 更新 PackyCode 信息
UPDATE providers 
SET 
  name_en = 'PackyCode',
  website_url = 'https://www.packycode.com',
  description = '专注 Claude Code/Codex 中转的 API 服务商。注册送 $1，首充 9 折。采用 Claude Max $200 账号池，无需修改本地配置即可使用，所有行为可观测。在 Helpaio 好评率 96.81%。',
  features = ARRAY['Claude Code 专属优化', '无需修改本地配置', 'Claude Max 账号池', '注册送 $1', '首充 9 折', '行为可观测'],
  trial_credit = '注册送 $1',
  min_topup = '按需充值',
  transaction_fee = '首充 9 折',
  verification_status = 'verified',
  status = 'published',
  sort_order = 15,
  updated_at = NOW()
WHERE slug = 'packy-code';

-- 更新聚星AI信息
UPDATE providers 
SET 
  name_en = 'JuXingAI',
  website_url = 'https://juxingai.top',
  description = '多模型 API 中转服务商，在 APIRanking 排名第 5。支持主流 AI 模型统一接入，提供稳定的 API 中转服务。',
  features = ARRAY['多模型支持', 'API 统一接入', '国内直连'],
  verification_status = 'verified',
  status = 'published',
  sort_order = 16,
  updated_at = NOW()
WHERE slug = '聚星ai' OR slug = 'juxingai';
