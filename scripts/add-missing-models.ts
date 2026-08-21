/**
 * 补充缺失的主流 AI 模型
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 需要补充的主流模型
const modelsToAdd = [
  // OpenAI GPT 系列
  {
    slug: 'gpt-4o',
    name: 'GPT-4o',
    family: 'GPT',
    provider_official: 'OpenAI',
    description: 'OpenAI 最新多模态旗舰模型',
    status: 'published',
    sort_order: 100
  },
  {
    slug: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    family: 'GPT',
    provider_official: 'OpenAI',
    description: 'GPT-4o 的轻量版本',
    status: 'published',
    sort_order: 101
  },
  {
    slug: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    family: 'GPT',
    provider_official: 'OpenAI',
    description: 'GPT-4 的增强版本',
    status: 'published',
    sort_order: 102
  },
  {
    slug: 'gpt-35-turbo',
    name: 'GPT-3.5 Turbo',
    family: 'GPT',
    provider_official: 'OpenAI',
    description: 'OpenAI 经典高性价比模型',
    status: 'published',
    sort_order: 103
  },

  // Claude 系列
  {
    slug: 'claude-haiku-45',
    name: 'Claude Haiku 4.5',
    family: 'Claude',
    provider_official: 'Anthropic',
    description: 'Claude 最快速的模型',
    status: 'published',
    sort_order: 200
  },

  // DeepSeek 系列
  {
    slug: 'deepseek-v4',
    name: 'DeepSeek V4',
    family: 'DeepSeek',
    provider_official: 'DeepSeek',
    description: 'DeepSeek 旗舰推理模型',
    status: 'published',
    sort_order: 300
  },
  {
    slug: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    family: 'DeepSeek',
    provider_official: 'DeepSeek',
    description: 'DeepSeek V4 增强版',
    status: 'published',
    sort_order: 301
  },

  // GLM 系列
  {
    slug: 'glm-5-turbo',
    name: 'GLM-5 Turbo',
    family: 'GLM',
    provider_official: '智谱AI',
    description: '智谱 GLM-5 快速版本',
    status: 'published',
    sort_order: 400
  },
  {
    slug: 'glm-52',
    name: 'GLM-5.2',
    family: 'GLM',
    provider_official: '智谱AI',
    description: '智谱最新旗舰模型',
    status: 'published',
    sort_order: 401
  },

  // Doubao 系列
  {
    slug: 'doubao-seed',
    name: 'Doubao Seed',
    family: 'Doubao',
    provider_official: '字节跳动',
    description: '字节豆包推理模型',
    status: 'published',
    sort_order: 500
  },

  // Qwen 系列
  {
    slug: 'qwen3-max',
    name: 'Qwen3 Max',
    family: 'Qwen',
    provider_official: '阿里云',
    description: '通义千问旗舰模型',
    status: 'published',
    sort_order: 600
  },
  {
    slug: 'qwen37-max',
    name: 'Qwen3.7 Max',
    family: 'Qwen',
    provider_official: '阿里云',
    description: '通义千问最新版本',
    status: 'published',
    sort_order: 601
  },

  // Kimi 系列
  {
    slug: 'kimi-k3',
    name: 'Kimi K3',
    family: 'Kimi',
    provider_official: 'Moonshot AI',
    description: 'Moonshot 长文本模型',
    status: 'published',
    sort_order: 700
  },

  // MiniMax 系列
  {
    slug: 'minimax-m27',
    name: 'MiniMax M2.7',
    family: 'MiniMax',
    provider_official: 'MiniMax',
    description: 'MiniMax 多模态模型',
    status: 'published',
    sort_order: 800
  },

  // Hunyuan 系列
  {
    slug: 'hunyuan-turbo',
    name: 'Hunyuan Turbo',
    family: 'Hunyuan',
    provider_official: '腾讯',
    description: '腾讯混元快速版本',
    status: 'published',
    sort_order: 900
  }
]

async function addMissingModels() {
  console.log('📦 开始补充缺失的模型')
  console.log('─'.repeat(60))

  for (const model of modelsToAdd) {
    console.log(`\n检查: ${model.name}`)

    // 检查模型是否已存在
    const { data: existing } = await supabase
      .from('models')
      .select('id')
      .eq('slug', model.slug)
      .maybeSingle()

    if (existing) {
      console.log(`  ⚠️  已存在，跳过`)
      continue
    }

    // 插入新模型
    const { error } = await supabase
      .from('models')
      .insert(model)

    if (error) {
      console.error(`  ❌ 插入失败:`, error.message)
    } else {
      console.log(`  ✅ 已添加`)
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n' + '─'.repeat(60))

  // 统计总模型数
  const { count } = await supabase
    .from('models')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ 补充完成`)
  console.log(`📊 当前模型总数: ${count}`)
}

async function main() {
  try {
    await addMissingModels()
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { addMissingModels }
