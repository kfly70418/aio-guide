import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 前10家服务商数据
const providers = [
  {
    name: 'H API',
    name_en: 'H API',
    slug: 'h-api',
    website_url: 'https://hapiopen.cc',
    description: 'H API 是排名第一的 AI API 中转站，提供稳定的 API 服务，支持多种主流大模型。',
    features: ['首购9折', '价格优惠', '模型齐全', '服务稳定'],
    is_recommended: true,
    status: 'published',
    sort_order: 1,
    min_topup: '10元',
    trial_credit: '无',
    coupon_code: '首购9折',
    verified_at: new Date().toISOString(),
  },
  {
    name: 'OpenOx',
    name_en: 'OpenOx',
    slug: 'openox',
    website_url: 'https://openox.tech',
    description: 'OpenOx 排名第二的 AI API 中转服务，提供高质量的 API 接口。',
    features: ['价格实惠', '响应快速', '技术支持好'],
    is_recommended: true,
    status: 'published',
    sort_order: 2,
    verified_at: new Date().toISOString(),
  },
  {
    name: 'LinkAI',
    name_en: 'LinkAI',
    slug: 'linkai',
    website_url: 'https://linkai.pics',
    description: 'LinkAI 提供稳定的 AI API 中转服务，支持多种大模型接入。',
    features: ['稳定可靠', '价格透明'],
    is_recommended: true,
    status: 'published',
    sort_order: 3,
    verified_at: new Date().toISOString(),
  },
  {
    name: 'UU API',
    name_en: 'UU API',
    slug: 'uuapi',
    website_url: 'https://uuapi.shop',
    description: 'UU API 提供便捷的 AI API 中转服务。',
    features: ['简单易用', '价格合理'],
    is_recommended: true,
    status: 'published',
    sort_order: 4,
    verified_at: new Date().toISOString(),
  },
  {
    name: 'APINebula',
    name_en: 'APINebula',
    slug: 'apinebula',
    website_url: 'https://apinebula.ai',
    description: 'APINebula 专业的 AI API 中转服务提供商。',
    features: ['专业服务', '技术领先'],
    is_recommended: true,
    status: 'published',
    sort_order: 5,
    verified_at: new Date().toISOString(),
  },
  {
    name: 'RunAPI',
    name_en: 'RunAPI',
    slug: 'runapi',
    website_url: 'https://runapi.host',
    description: 'RunAPI 提供快速稳定的 AI API 中转服务。',
    features: ['快速响应', '稳定运营'],
    is_recommended: true,
    status: 'published',
    sort_order: 6,
    verified_at: new Date().toISOString(),
  },
  {
    name: 'LinksAPI',
    name_en: 'LinksAPI',
    slug: 'linksapi',
    website_url: 'https://linksapi.cn',
    description: 'LinksAPI 提供可靠的 AI API 中转服务。',
    features: ['国内访问快', '服务稳定'],
    is_recommended: true,
    status: 'published',
    sort_order: 7,
    verified_at: new Date().toISOString(),
  },
  {
    name: 'LMU AI · 灵眸',
    name_en: 'LMU AI',
    slug: 'lmu-ai',
    website_url: 'https://api.lmuai.com',
    description: 'LMU AI 灵眸提供专业的 AI API 中转服务。',
    features: ['价格优惠', '模型丰富'],
    is_recommended: true,
    status: 'published',
    sort_order: 8,
    verified_at: new Date().toISOString(),
  },
  {
    name: '三头牛',
    name_en: '36niu',
    slug: 'santoniu',
    website_url: 'https://36niu.com',
    description: '三头牛提供稳定的 AI API 中转服务。',
    features: ['老牌服务商', '信誉良好'],
    is_recommended: true,
    status: 'published',
    sort_order: 9,
    verified_at: new Date().toISOString(),
  },
  {
    name: 'boxying',
    name_en: 'boxying',
    slug: 'boxying',
    website_url: 'https://boxying.com',
    description: 'boxying 提供便捷的 AI API 中转服务。',
    features: ['操作简单', '价格实惠'],
    is_recommended: false,
    status: 'published',
    sort_order: 10,
    verified_at: new Date().toISOString(),
  },
]

async function importProviders() {
  console.log('开始导入服务商数据...\n')

  for (const provider of providers) {
    console.log(`导入: ${provider.name}...`)

    const { data, error } = await supabase
      .from('providers')
      .insert(provider)
      .select()
      .single()

    if (error) {
      console.error(`  ❌ 失败: ${error.message}`)
    } else {
      console.log(`  ✅ 成功 (ID: ${data.id})`)
    }
  }

  console.log('\n导入完成！')
}

importProviders().catch(console.error)
