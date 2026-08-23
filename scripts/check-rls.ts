/**
 * 检查 Supabase RLS 策略
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

async function checkRLS() {
  console.log('🔍 检查 Supabase RLS 策略\n')
  console.log('─'.repeat(80))

  // 1. 使用 service_role_key（绕过 RLS）
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 2. 使用 anon_key（受 RLS 限制）
  const publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  console.log('测试 1: 使用 service_role_key 查询翻译')
  const { data: adminData, error: adminError } = await adminClient
    .from('translations')
    .select('*')
    .eq('resource_type', 'article')
    .eq('locale', 'ru')
    .eq('field', 'title')
    .limit(5)

  if (adminError) {
    console.error('❌ service_role 查询失败:', adminError)
  } else {
    console.log(`✅ service_role 查询成功: ${adminData?.length || 0} 条记录`)
  }

  console.log('\n测试 2: 使用 anon_key 查询翻译（模拟线上环境）')
  const { data: publicData, error: publicError } = await publicClient
    .from('translations')
    .select('*')
    .eq('resource_type', 'article')
    .eq('locale', 'ru')
    .eq('field', 'title')
    .limit(5)

  if (publicError) {
    console.error('❌ anon_key 查询失败:', publicError)
    console.error('\n⚠️  这就是问题所在！')
    console.error('RLS 策略阻止了公开访问 translations 表')
    console.error('\n解决方案:')
    console.error('1. 在 Supabase 控制台中为 translations 表启用 RLS')
    console.error('2. 添加策略允许公开读取：')
    console.error('   CREATE POLICY "Enable read access for all users" ON translations')
    console.error('   FOR SELECT USING (true);')
  } else {
    console.log(`✅ anon_key 查询成功: ${publicData?.length || 0} 条记录`)
    if (publicData && publicData.length > 0) {
      console.log('\n示例数据:')
      publicData.forEach(t => {
        console.log(`  - ${t.resource_type}/${t.field}: ${t.value.substring(0, 50)}...`)
      })
    }
  }

  console.log('\n' + '─'.repeat(80))
  console.log('\n测试 3: 查询文章表')
  const { data: articles, error: articlesError } = await publicClient
    .from('articles')
    .select('id, slug, title')
    .eq('status', 'published')
    .eq('category', 'tutorial')
    .limit(3)

  if (articlesError) {
    console.error('❌ 查询文章失败:', articlesError)
  } else {
    console.log(`✅ 查询文章成功: ${articles?.length || 0} 条记录`)
  }
}

if (require.main === module) {
  checkRLS().catch(console.error)
}
