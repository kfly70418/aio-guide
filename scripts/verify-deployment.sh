#!/bin/bash

echo "🔍 验证 apixuan.com 部署状态"
echo "================================"
echo ""

BASE_URL="https://www.apixuan.com"

# 要验证的页面列表
pages=(
  "/"
  "/rankings/claude-api"
  "/rankings/gpt-api"
  "/rankings/cheap"
  "/rankings/stable"
  "/rankings/domestic"
  "/faq"
  "/sitemap.xml"
  "/robots.txt"
)

echo "📋 检查页面可访问性..."
echo ""

for page in "${pages[@]}"; do
  url="${BASE_URL}${page}"
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [ "$status" -eq 200 ]; then
    echo "✅ $page - HTTP $status"
  else
    echo "❌ $page - HTTP $status"
  fi
done

echo ""
echo "================================"
echo "✅ 验证完成！"
echo ""
echo "📊 下一步："
echo "1. 访问 https://www.apixuan.com 确认首页更新"
echo "2. 访问 https://vercel.com 查看部署日志"
echo "3. 使用 Google Search Console 提交 Sitemap"
echo "4. 为新页面请求索引"
