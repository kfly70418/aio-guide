import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addProviderModels() {
  console.log('=== 为新服务商添加模型配置 ===\n');

  // 获取 PackyCode 和聚星AI 的 ID
  const { data: providers, error: provError } = await supabase
    .from('providers')
    .select('id, name')
    .in('name', ['Packy Code', '聚星AI']);

  if (provError || !providers || providers.length === 0) {
    console.error('获取服务商失败:', provError);
    return;
  }

  const packyCode = providers.find(p => p.name === 'Packy Code');
  const juxingAI = providers.find(p => p.name === '聚星AI');

  // PackyCode 主打 Claude Code,添加 Claude 系列模型渠道
  if (packyCode) {
    const packyModels = [
      { name: 'claude-opus-5', description: 'Claude Opus 5 模型' },
      { name: 'claude-sonnet-5', description: 'Claude Sonnet 5 模型' },
      { name: 'claude-opus-4-6', description: 'Claude Opus 4.6 模型' },
      { name: 'claude-sonnet-4', description: 'Claude Sonnet 4 模型' },
      { name: 'claude-haiku-4-5', description: 'Claude Haiku 4.5 模型' },
    ];

    for (const model of packyModels) {
      const { error } = await supabase
        .from('channels')
        .insert({
          provider_id: packyCode.id,
          name: model.name,
          description: model.description,
          is_primary: false,
          priority: 10,
          status: 'active',
        });

      if (error) {
        console.error(`PackyCode ${model.name} 添加失败:`, error.message);
      } else {
        console.log(`✓ PackyCode: ${model.name}`);
      }
    }
  }

  // 聚星AI 多模型支持,添加主流模型渠道
  if (juxingAI) {
    const juxingModels = [
      { name: 'gpt-4o', description: 'GPT-4o 模型' },
      { name: 'gpt-4o-mini', description: 'GPT-4o Mini 模型' },
      { name: 'claude-sonnet-5', description: 'Claude Sonnet 5 模型' },
      { name: 'claude-opus-4-6', description: 'Claude Opus 4.6 模型' },
      { name: 'deepseek-chat', description: 'DeepSeek Chat 模型' },
    ];

    for (const model of juxingModels) {
      const { error } = await supabase
        .from('channels')
        .insert({
          provider_id: juxingAI.id,
          name: model.name,
          description: model.description,
          is_primary: false,
          priority: 10,
          status: 'active',
        });

      if (error) {
        console.error(`聚星AI ${model.name} 添加失败:`, error.message);
      } else {
        console.log(`✓ 聚星AI: ${model.name}`);
      }
    }
  }

  console.log('\n模型配置添加完成!');
}

addProviderModels().catch(console.error);
