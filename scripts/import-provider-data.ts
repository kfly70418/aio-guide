/**
 * 服务商数据批量导入工具
 *
 * 功能：
 * 1. 读取采集的 JSON 数据
 * 2. 数据校验和清洗
 * 3. 批量导入到 Supabase
 * 4. 生成导入报告
 *
 * 使用方法：
 * npx tsx scripts/import-provider-data.ts <json-file>
 * 或导入整个目录：npx tsx scripts/import-provider-data.ts --dir ./data/scraped
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// 加载 .env.local 文件
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ImportResult {
  success: boolean
  provider_name: string
  provider_id?: string
  channels_created?: number
  prices_created?: number
  errors?: string[]
}

// 数据校验
function validateData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name) errors.push('缺少服务商名称')
  if (!data.website_url) errors.push('缺少官网地址')
  if (!data.description) errors.push('缺少描述')

  if (data.models && data.models.length > 0) {
    data.models.forEach((model: any, idx: number) => {
      if (!model.model_name) errors.push(`模型 ${idx + 1} 缺少名称`)
      if (model.price_input === undefined) errors.push(`模型 ${model.model_name} 缺少输入价格`)
      if (model.price_output === undefined) errors.push(`模型 ${model.model_name} 缺少输出价格`)
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// 生成 slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9一-龥-]/g, '')
}

// 查找或创建模型
async function findOrCreateModel(modelName: string): Promise<string | null> {
  // 标准化模型名称
  const normalizedName = modelName.toLowerCase().trim()

  // 先查找是否已存在
  const { data: existing } = await supabase
    .from('models')
    .select('id')
    .ilike('slug', normalizedName.replace(/\s+/g, '-'))
    .maybeSingle()

  if (existing) {
    return existing.id
  }

  // 如果不存在，创建新模型（需要手动补充完整信息）
  console.log(`   ⚠️  模型 ${modelName} 不存在，跳过价格导入`)
  return null
}

// 导入单个服务商数据
async function importProviderData(data: any, dryRun: boolean = false): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    provider_name: data.name,
    errors: [],
  }

  try {
    // 1. 数据校验
    const validation = validateData(data)
    if (!validation.valid) {
      result.errors = validation.errors
      return result
    }

    if (dryRun) {
      console.log(`   [DRY RUN] 跳过实际导入`)
      result.success = true
      return result
    }

    // 2. 检查服务商是否已存在
    const slug = data.slug || generateSlug(data.name)

    const { data: existingProvider } = await supabase
      .from('providers')
      .select('id, name')
      .eq('slug', slug)
      .maybeSingle()

    let providerId: string

    if (existingProvider) {
      console.log(`   ℹ️  服务商已存在，更新数据: ${existingProvider.name}`)
      providerId = existingProvider.id

      // 更新服务商信息
      const { error: updateError } = await supabase
        .from('providers')
        .update({
          name: data.name,
          name_en: data.name_en,
          description: data.description,
          features: data.features,
          min_topup: data.min_topup,
          trial_credit: data.trial_credit,
          transaction_fee: data.transaction_fee,
          invoice_support: data.invoice_support,
          updated_at: new Date().toISOString(),
        })
        .eq('id', providerId)

      if (updateError) {
        result.errors?.push(`更新服务商失败: ${updateError.message}`)
        return result
      }
    } else {
      console.log(`   ➕ 创建新服务商: ${data.name}`)

      // 创建新服务商
      const { data: newProvider, error: insertError } = await supabase
        .from('providers')
        .insert({
          slug,
          name: data.name,
          name_en: data.name_en,
          website_url: data.website_url,
          description: data.description,
          features: data.features,
          is_recommended: false,
          status: 'draft', // 默认草稿，需人工审核后发布
          verification_status: 'pending',
          min_topup: data.min_topup,
          trial_credit: data.trial_credit,
          transaction_fee: data.transaction_fee,
          invoice_support: data.invoice_support,
        })
        .select('id')
        .single()

      if (insertError) {
        result.errors?.push(`创建服务商失败: ${insertError.message}`)
        return result
      }

      providerId = newProvider.id
    }

    result.provider_id = providerId

    // 3. 创建或更新主渠道
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('provider_id', providerId)
      .eq('is_primary', true)
      .maybeSingle()

    let channelId: string

    if (existingChannel) {
      channelId = existingChannel.id
      // 渠道已存在，无需更新
    } else {
      // 创建主渠道
      const { data: newChannel, error: channelError } = await supabase
        .from('channels')
        .insert({
          provider_id: providerId,
          name: '官方主渠道',
          is_primary: true,
          status: 'active',
        })
        .select('id')
        .single()

      if (channelError) {
        result.errors?.push(`创建渠道失败: ${channelError.message}`)
        return result
      }

      channelId = newChannel.id
      result.channels_created = 1
    }

    // 4. 导入价格数据
    if (data.models && data.models.length > 0) {
      let pricesCreated = 0

      for (const modelData of data.models) {
        const modelId = await findOrCreateModel(modelData.model_name)

        if (!modelId) {
          console.log(`   ⚠️  跳过模型: ${modelData.model_name}`)
          continue
        }

        // 检查价格是否已存在
        const { data: existingPrice } = await supabase
          .from('prices')
          .select('id')
          .eq('channel_id', channelId)
          .eq('model_id', modelId)
          .maybeSingle()

        const priceData = {
          channel_id: channelId,
          model_id: modelId,
          price_input: modelData.price_input,
          price_output: modelData.price_output,
          currency: modelData.currency || 'CNY',
          pricing_unit: '1M tokens',
          verified_at: new Date().toISOString(),
          status: 'active',
        }

        if (existingPrice) {
          // 更新价格
          await supabase.from('prices').update(priceData).eq('id', existingPrice.id)
        } else {
          // 创建价格
          const { error: priceError } = await supabase.from('prices').insert(priceData)

          if (priceError) {
            result.errors?.push(`创建价格失败 (${modelData.model_name}): ${priceError.message}`)
          } else {
            pricesCreated++
          }
        }
      }

      result.prices_created = pricesCreated
    }

    result.success = true
    return result
  } catch (error) {
    result.errors?.push(`意外错误: ${error}`)
    return result
  }
}

// 导入单个文件
async function importFile(filePath: string, dryRun: boolean = false) {
  console.log(`\n📄 导入文件: ${filePath}`)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`)
    return null
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(content)

  const result = await importProviderData(data, dryRun)

  if (result.success) {
    console.log(`✅ 导入成功: ${result.provider_name}`)
    if (result.channels_created) console.log(`   渠道: ${result.channels_created} 个`)
    if (result.prices_created) console.log(`   价格: ${result.prices_created} 条`)
  } else {
    console.log(`❌ 导入失败: ${result.provider_name}`)
    result.errors?.forEach((err) => console.log(`   - ${err}`))
  }

  return result
}

// 导入目录下所有文件
async function importDirectory(dirPath: string, dryRun: boolean = false) {
  console.log(`📦 批量导入目录: ${dirPath}`)
  console.log('─'.repeat(60))

  if (!fs.existsSync(dirPath)) {
    console.error(`❌ 目录不存在: ${dirPath}`)
    return
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json') && !f.includes('batch-'))

  console.log(`📊 共 ${files.length} 个文件待导入\n`)

  const results: ImportResult[] = []

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const result = await importFile(filePath, dryRun)
    if (result) {
      results.push(result)
    }

    // 避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  // 生成导入报告
  console.log('\n' + '─'.repeat(60))
  console.log('📊 导入统计:')
  console.log(`   总计: ${results.length}`)
  console.log(`   成功: ${results.filter((r) => r.success).length}`)
  console.log(`   失败: ${results.filter((r) => !r.success).length}`)
  console.log(
    `   新增渠道: ${results.reduce((sum, r) => sum + (r.channels_created || 0), 0)}`
  )
  console.log(`   新增价格: ${results.reduce((sum, r) => sum + (r.prices_created || 0), 0)}`)

  if (results.some((r) => !r.success)) {
    console.log('\n❌ 失败列表:')
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.provider_name}`)
        r.errors?.forEach((err) => console.log(`     ${err}`))
      })
  }

  // 保存导入报告
  const reportPath = path.join(dirPath, `import-report-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`\n✅ 导入报告已保存: ${reportPath}`)
}

// 主函数
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('用法:')
    console.log('  导入单个文件: npx tsx scripts/import-provider-data.ts <json-file>')
    console.log('  导入整个目录: npx tsx scripts/import-provider-data.ts --dir <directory>')
    console.log('  试运行模式: 添加 --dry-run 参数')
    console.log('\n示例:')
    console.log('  npx tsx scripts/import-provider-data.ts ./data/scraped/2026-08-19-linkai.json')
    console.log('  npx tsx scripts/import-provider-data.ts --dir ./data/scraped')
    console.log('  npx tsx scripts/import-provider-data.ts --dir ./data/scraped --dry-run')
    process.exit(1)
  }

  const dryRun = args.includes('--dry-run')

  if (dryRun) {
    console.log('🔍 试运行模式 - 不会实际修改数据库\n')
  }

  if (args[0] === '--dir') {
    const dirPath = args[1]
    await importDirectory(dirPath, dryRun)
  } else {
    const filePath = args[0]
    await importFile(filePath, dryRun)
  }
}

// 执行
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  })
}

export { importProviderData, importFile, importDirectory }
