# Vercel 部署脚本 (PowerShell)
# 使用方法：.\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 开始部署到 Vercel..." -ForegroundColor Green
Write-Host ""

# 检查是否安装了 Vercel CLI
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ 未检测到 Vercel CLI" -ForegroundColor Red
    Write-Host "📦 正在安装 Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Vercel CLI 安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI 安装完成" -ForegroundColor Green
    Write-Host ""
}

# 检查是否已登录
$loggedIn = vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔐 请先登录 Vercel..." -ForegroundColor Yellow
    vercel login
    Write-Host ""
}

# 构建项目
Write-Host "🔨 构建项目..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 构建完成" -ForegroundColor Green
Write-Host ""

# 部署到生产环境
Write-Host "🚢 部署到生产环境..." -ForegroundColor Cyan
vercel --prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 部署失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 下一步操作：" -ForegroundColor Yellow
Write-Host "1. 访问 Vercel Dashboard 添加自定义域名: apixuan.com"
Write-Host "2. 配置环境变量（参考 docs\Vercel部署指南.md）"
Write-Host "3. 在 Supabase 中添加新域名到允许列表"
Write-Host "4. 提交 sitemap 到 Google/百度搜索引擎"
Write-Host ""
