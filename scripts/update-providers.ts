import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateNewProviders() {
  console.log('=== 更新新增服务商信息 ===\n');

  // 更新 PackyCode
  const { data: packy, error: packyError } = await supabase
    .from('providers')
    .update({
      name_en: 'PackyCode',
      website_url: 'https://www.packycode.com',
      description: '专注 Claude Code/Codex 中转的 API 服务商。注册送 $1,首充 9 折。采用 Claude Max $200 账号池,无需修改本地配置即可使用,所有行为可观测。在 Helpaio 好评率 96.81%。',
      features: ['Claude Code 专属优化', '无需修改本地配置', 'Claude Max 账号池', '注册送 $1', '首充 9 折', '行为可观测'],
      trial_credit: '注册送 $1',
      min_topup: '按需充值',
      transaction_fee: '首充 9 折',
      verification_status: 'verified',
      status: 'published',
      sort_order: 15,
    })
    .eq('name', 'Packy Code')
    .select();

  if (packyError) {
    console.error('PackyCode 更新失败:', packyError);
  } else {
    console.log('✓ PackyCode 更新成功');
  }

  // 更新聚星AI
  const { data: juxing, error: juxingError } = await supabase
    .from('providers')
    .update({
      name_en: 'JuXingAI',
      website_url: 'https://juxingai.top',
      description: '多模型 API 中转服务商,在 APIRanking 排名第 5。支持主流 AI 模型统一接入,提供稳定的 API 中转服务。',
      features: ['多模型支持', 'API 统一接入', '国内直连'],
      verification_status: 'verified',
      status: 'published',
      sort_order: 16,
    })
    .eq('name', '聚星AI')
    .select();

  if (juxingError) {
    console.error('聚星AI 更新失败:', juxingError);
  } else {
    console.log('✓ 聚星AI 更新成功');
  }

  console.log('\n更新完成!');
}

updateNewProviders().catch(console.error);
