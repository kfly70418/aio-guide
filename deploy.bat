@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo 🚀 开始部署到 Vercel...
echo.

:: 检查是否安装了 Vercel CLI
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Vercel CLI
    echo 📦 正在安装 Vercel CLI...
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Vercel CLI 安装失败
        pause
        exit /b 1
    )
    echo ✅ Vercel CLI 安装完成
    echo.
)

:: 检查是否已登录
vercel whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo 🔐 请先登录 Vercel...
    call vercel login
    echo.
)

:: 构建项目
echo 🔨 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建完成
echo.

:: 部署到生产环境
echo 🚢 部署到生产环境...
call vercel --prod
if %errorlevel% neq 0 (
    echo ❌ 部署失败
    pause
    exit /b 1
)
echo.

echo 🎉 部署完成！
echo.
echo 📊 下一步操作：
echo 1. 访问 Vercel Dashboard 添加自定义域名: apixuan.com
echo 2. 配置环境变量（参考 docs\Vercel部署指南.md）
echo 3. 在 Supabase 中添加新域名到允许列表
echo 4. 提交 sitemap 到 Google/百度搜索引擎
echo.

pause
