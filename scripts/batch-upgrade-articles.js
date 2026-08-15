const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 待升级的文章列表
const articlesToUpgrade = [
  'api-relay-service-safe-or-not',
  'api-key-vs-ai-membership',
  'fix-api-401-error',
  'fix-api-429-error',
  'fix-api-timeout',
  'why-ai-api-price-different',
  'how-much-to-recharge-api',
  'what-to-do-if-api-key-leaked',
  'does-api-store-conversations',
  'what-if-api-service-shuts-down',
  'test-api-service-quality',
  'api-key-security-basics',
  'base-url-model-id-token-explained',
  'api-relay-service-explained',
  'first-api-account-checklist',
  'configure-claude-code-relay-api-windows',
  'ai-api-beginner-basics',
  'api-pricing-token-billing-basics',
  'choose-first-ai-model',
  'official-api-vs-relay-service',
  'beginner-api-troubleshooting'
];

async function fetchArticle(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  console.log(`📦 准备批量导出 ${articlesToUpgrade.length} 篇文章\n`);

  const outputDir = path.join(__dirname, '../articles-to-upgrade');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const slug of articlesToUpgrade) {
    try {
      const article = await fetchArticle(slug);

      const content = `---
slug: ${article.slug}
title: ${article.title}
summary: ${article.summary || ''}
category: ${article.category}
tags: ${JSON.stringify(article.tags || [])}
status: ${article.status}
published_at: ${article.published_at}
---

${article.content}
`;

      const filename = `${slug}.md`;
      fs.writeFileSync(path.join(outputDir, filename), content, 'utf-8');
      console.log(`✅ ${slug}`);
    } catch (err) {
      console.error(`❌ ${slug}:`, err.message);
    }
  }

  console.log(`\n✅ 导出完成！文件保存在: ${outputDir}`);
}

main();
