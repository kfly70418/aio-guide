import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateGPTModels() {
  console.log('=== 更新 GPT 模型到最新版本 ===\n');

  // 1. 检查现有 GPT 模型
  const { data: existingModels } = await supabase
    .from('models')
    .select('slug, name, family')
    .ilike('slug', 'gpt%')
    .order('slug');

  console.log('现有 GPT 模型:');
  existingModels?.forEach(m => console.log(`  - ${m.slug}: ${m.name}`));

  // 2. 添加 GPT-5.6 模型（如果不存在）
  const gpt56Slug = 'gpt-5-6';

  const { data: existing56 } = await supabase
    .from('models')
    .select('id')
    .eq('slug', gpt56Slug)
    .single();

  if (!existing56) {
    console.log('\n正在添加 GPT-5.6 模型...');

    const { data: newModel, error } = await supabase
      .from('models')
      .insert({
        slug: gpt56Slug,
        name: 'GPT-5.6',
        family: 'GPT',
        provider_official: 'OpenAI',
        description: 'OpenAI 最新旗舰模型 GPT-5.6，性能全面提升',
        status: 'published',
        sort_order: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('添加失败:', error.message);
    } else {
      console.log('✓ GPT-5.6 模型添加成功');
    }
  } else {
    console.log('\n✓ GPT-5.6 模型已存在');
  }

  // 3. 更新文档说明
  console.log('\n=== 更新建议 ===');
  console.log('1. rankings 页面已更新为支持 GPT-5.6');
  console.log('2. 建议为支持 GPT-5.6 的服务商添加对应渠道');
  console.log('3. 更新首页和模型对比页的 GPT 模型展示');
}

updateGPTModels().catch(console.error);
