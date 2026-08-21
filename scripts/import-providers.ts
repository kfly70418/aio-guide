import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 .env.local 读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ApiRankingItem {
  name: string;
  url: string;
  description: string;
  verified: boolean;
}

interface HelpaioItem {
  rank: number;
  name: string;
  url: string;
  rating: string;
  description: string;
}

async function main() {
  // 读取今天的数据
  const apirankingData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/apiranking_verified.json'), 'utf-8')
  );
  const helpaioData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/helpaio_top10.json'), 'utf-8')
  );

  console.log('=== APIRanking 数据 (12条) ===');
  console.log(`抓取时间: ${apirankingData.scraped_at}`);

  console.log('\n=== Helpaio 数据 (5条) ===');
  console.log(`抓取时间: ${helpaioData.scraped_at}`);

  // 查询现有服务商
  const { data: existingProviders, error: fetchError } = await supabase
    .from('providers')
    .select('name');

  if (fetchError) {
    console.error('查询失败:', fetchError);
    process.exit(1);
  }

  console.log(`\n=== 数据库现有服务商 (${existingProviders?.length || 0}条) ===`);

  const existingNames = new Set(existingProviders?.map(p => p.name) || []);

  // 分析 APIRanking 数据
  console.log('\n=== APIRanking 对比 ===');
  const newFromApiranking: string[] = [];
  apirankingData.data.forEach((item: ApiRankingItem, i: number) => {
    const exists = existingNames.has(item.name);
    console.log(`${i + 1}. ${item.name} ${exists ? '✓ 已存在' : '✗ 新增'}`);
    if (!exists) newFromApiranking.push(item.name);
  });

  // 分析 Helpaio 数据
  console.log('\n=== Helpaio 对比 ===');
  const newFromHelpaio: string[] = [];
  helpaioData.data.forEach((item: HelpaioItem, i: number) => {
    const exists = existingNames.has(item.name);
    console.log(`${i + 1}. ${item.name} - ${item.rating} ${exists ? '✓ 已存在' : '✗ 新增'}`);
    if (!exists) newFromHelpaio.push(item.name);
  });

  // 汇总
  console.log('\n=== 汇总 ===');
  console.log(`APIRanking 新增: ${newFromApiranking.length} 个`);
  newFromApiranking.forEach(name => console.log(`  - ${name}`));

  console.log(`\nHelpaio 新增: ${newFromHelpaio.length} 个`);
  newFromHelpaio.forEach(name => console.log(`  - ${name}`));

  const allNew = [...new Set([...newFromApiranking, ...newFromHelpaio])];
  console.log(`\n去重后总新增: ${allNew.length} 个`);

  if (allNew.length === 0) {
    console.log('\n✓ 所有服务商均已存在，无需导入');
    return;
  }

  console.log('\n准备导入新服务商...');

  // 批量插入（仅名称，其他字段留空待后续填充）
  const newProviders = allNew.map(name => ({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: 'draft' as const,
    is_recommended: false,
    sort_order: 999,
    invoice_support: false,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('providers')
    .insert(newProviders)
    .select();

  if (insertError) {
    console.error('导入失败:', insertError);
    process.exit(1);
  }

  console.log(`\n✓ 成功导入 ${inserted?.length || 0} 个新服务商`);
}

main().catch(console.error);
