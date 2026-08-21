#!/bin/bash

# aio-guide 项目清理脚本
# 删除已完成任务的脚本文件

cd "$(dirname "$0")"

echo "===== 开始清理过时脚本 ====="
echo ""

# 创建归档目录
mkdir -p scripts/_archive
echo "✓ 创建归档目录 scripts/_archive"

# 需要删除的脚本列表
SCRIPTS_TO_REMOVE=(
  # 导入脚本（已完成数据导入）
  "scripts/import-providers.ts"
  "scripts/import-providers-v2.ts"
  "scripts/import-providers-v3.ts"
  "scripts/import-providers-manual.js"
  "scripts/import-top10-providers.ts"
  "scripts/import-verified-providers.js"
  "scripts/import-core-articles.mjs"
  "scripts/import-lmu-prices.ts"
  "scripts/import-prices-with-channels.ts"
  "scripts/import-upgraded-article.js"
  "scripts/import-upgraded-articles-batch.js"

  # 批量处理脚本（已执行）
  "scripts/batch-add-provider-models.js"
  "scripts/batch-upgrade-articles.js"

  # 检查脚本（一次性）
  "scripts/check-404-images.js"
  "scripts/check-articles-count.js"
  "scripts/check-duplicates.js"
  "scripts/check-empty-fields.js"
  "scripts/check-provider-models.js"
  "scripts/check-providers-on-site.js"
  "scripts/check-schema.ts"
  "scripts/check-today-providers.js"

  # 清理脚本（已执行）
  "scripts/clean-bad-providers.js"
  "scripts/clean-editorial-notes.js"
  "scripts/clean-remaining-notes.js"

  # 修复脚本（已执行）
  "scripts/fix-404-images.js"
  "scripts/fix-prices-and-descriptions.js"
  "scripts/fix-provider-data.js"

  # 更新脚本（已执行）
  "scripts/update-article-new-format.js"
  "scripts/update-provider-descriptions.ts"

  # 插入脚本（已执行）
  "scripts/insert-diagrams-to-articles.js"
  "scripts/insert-final-images.js"
  "scripts/insert-images-to-articles.js"
  "scripts/insert-more-images.js"

  # 分析脚本（一次性）
  "scripts/analyze-article-images.js"
  "scripts/analyze-article-quality.js"
  "scripts/analyze-providers.js"

  # 其他过时脚本
  "scripts/dedupe-providers.ts"
  "scripts/enrich-providers.ts"
  "scripts/rotate-providers.ts"
  "scripts/scrape-providers.js"
  "scripts/scrape-providers-simple.js"
  "scripts/add-agent-article.js"
  "scripts/create-new-article.js"
  "scripts/create-three-articles.js"
  "scripts/fetch-article.js"
  "scripts/fetch-provider-details.js"
  "scripts/find-duplicate-prices.js"
  "scripts/find-editorial-notes.js"
  "scripts/generate-diagrams.js"
  "scripts/list-models.js"
  "scripts/list-recent-articles.js"
  "scripts/map-existing-images.js"
  "scripts/quick-config.js"
  "scripts/verify-imported.js"
  "scripts/run-migration-direct.ts"

  # SQL 文件
  "scripts/add-updated-at-trigger.sql"
  "scripts/apply-migration-direct.sql"
  "scripts/MANUAL_MIGRATION.sql"
)

# 移动到归档
COUNT=0
for script in "${SCRIPTS_TO_REMOVE[@]}"; do
  if [ -f "$script" ]; then
    mv "$script" scripts/_archive/
    echo "✓ 已归档: $script"
    ((COUNT++))
  fi
done

echo ""
echo "===== 清理临时文件 ====="

# 删除临时文件
TEMP_FILES=(
  "copy-images.py"
  "update-article-images.js"
  "provider-details.txt"
  "tsconfig.tsbuildinfo"
)

for file in "${TEMP_FILES[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "✓ 已删除: $file"
  fi
done

# 删除重复的部署脚本（保留 .sh）
if [ -f "deploy.bat" ]; then
  rm deploy.bat
  echo "✓ 已删除: deploy.bat"
fi

if [ -f "deploy.ps1" ]; then
  rm deploy.ps1
  echo "✓ 已删除: deploy.ps1"
fi

echo ""
echo "===== 清理空目录 ====="

# 删除空目录
if [ -d "components/articles" ] && [ -z "$(ls -A components/articles)" ]; then
  rmdir components/articles
  echo "✓ 已删除: components/articles/"
fi

if [ -d "components/models" ] && [ -z "$(ls -A components/models)" ]; then
  rmdir components/models
  echo "✓ 已删除: components/models/"
fi

echo ""
echo "===== 清理完成 ====="
echo "共归档 $COUNT 个脚本文件"
echo ""
echo "保留的活跃脚本："
echo "  - scripts/sync-apiranking.ts"
echo "  - scripts/fetch-ai-news.ts"
echo "  - scripts/import-ai-news.ts"
echo "  - scripts/revalidate-cache.js"
echo "  - scripts/list-providers.ts"
echo ""
echo "归档位置: scripts/_archive/"
