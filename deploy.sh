#!/bin/bash

# Vercel 快速部署脚本
# 使用方法：./deploy.sh

set -e

echo "🚀 开始部署到 Vercel..."
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未检测到 Vercel CLI"
    echo "📦 正在安装 Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI 安装完成"
    echo ""
fi

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "🔐 请先登录 Vercel..."
    vercel login
    echo ""
fi

# 构建项目
echo "🔨 构建项目..."
npm run build
echo "✅ 构建完成"
echo ""

# 部署到生产环境
echo "🚢 部署到生产环境..."
vercel --prod
echo ""

echo "🎉 部署完成！"
echo ""
echo "📊 下一步操作："
echo "1. 访问 Vercel Dashboard 添加自定义域名: apixuan.com"
echo "2. 配置环境变量（参考 docs/Vercel部署指南.md）"
echo "3. 在 Supabase 中添加新域名到允许列表"
echo "4. 提交 sitemap 到 Google/百度搜索引擎"
echo ""
