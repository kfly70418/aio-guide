/**
 * 更新服务商描述 - SEO 优化
 * 重写 5 家服务商的描述，提升专业性和可读性
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 读取环境变量
function loadEnv(): Record<string, string> {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) throw new Error('找不到 .env.local')
  const env: Record<string, string> = {}
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)

// 新的描述 - 专业、准确、SEO 友好
const NEW_DESCRIPTIONS: Record<string, string> = {
  'h-api': 'H API（hapiopen.cc）专注 Claude、GPT 系列模型中转服务，榜单第 1 位。实测稳定性优秀，1 元起充，新用户赠送 0.5 美元额度，支持开发票。适合个人开发者和中小团队日常使用。',

  'openox': 'OpenOx（openox.tech）提供 Claude、GPT、Gemini 多模型接入，榜单第 2 位。稳定性优秀，支持开发票，退款零手续费。新用户加客服可领 3 美元体验金，适合需要多模型切换的场景。',

  'linkai': 'LinkAI（linkai.pics）覆盖 Claude、GPT、Gemini 主流模型，榜单第 3 位。低中高三档价格可选，1 元起充，进群赠送额度。支持开发票，退款无手续费，适合预算弹性的用户。',

  'linksapi': 'LinksAPI（linksapi.cn）主打 Claude、GPT 模型服务，榜单第 7 位。稳定性优秀，支持支付宝、微信双通道支付，本站用户专享 3 美元赠送。最低 9.9 元起充，退款无手续费。',

  'boxying': 'boxying（boxying.com）提供 Claude、GPT 等 10+ 模型接入，榜单第 10 位。1 元起充，新用户赠 0.5 元，支持开发票。稳定性优秀，退款无手续费，适合多模型场景轻量使用。',
}

async function main() {
  console.log('开始更新服务商描述...\n')

  for (const [slug, description] of Object.entries(NEW_DESCRIPTIONS)) {
    const { data, error } = await supabase
      .from('providers')
      .update({ description })
      .eq('slug', slug)
      .select('id, name, slug')
      .single()

    if (error) {
      console.log(`❌ ${slug}: ${error.message}`)
    } else {
      console.log(`✅ ${data.name} (${slug})`)
      console.log(`   ${description}\n`)
    }
  }

  console.log('更新完成！')
}

main().catch(console.error)
