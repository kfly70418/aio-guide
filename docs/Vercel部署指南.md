# Vercel 部署指南

## 📋 前置准备

✅ 域名已购买：`apixuan.com`  
✅ DNS 解析已配置（阿里云）：
- `www` → `cname.vercel-dns.com`
- `@` → `cname.vercel-dns.com`

✅ 本地环境变量已更新：`.env.local` 中 `NEXT_PUBLIC_SITE_URL=https://apixuan.com`

---

## 🚀 部署步骤

### 第一步：注册/登录 Vercel

1. 访问 https://vercel.com/signup
2. 使用 GitHub 账号登录（推荐）

---

### 第二步：导入项目

#### 方式 A：通过 Git 仓库（推荐）

1. 将代码推送到 GitHub：
```bash
cd D:\Websites\aio-guide
git init
git add .
git commit -m "Initial commit: API选导航网站"
git branch -M main
git remote add origin https://github.com/你的用户名/aio-guide.git
git push -u origin main
```

2. 在 Vercel Dashboard 点击 **Import Project**
3. 选择 GitHub 仓库 `aio-guide`
4. 点击 **Import**

#### 方式 B：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd D:\Websites\aio-guide
vercel
```

---

### 第三步：配置环境变量

在 Vercel 项目设置中添加环境变量：

**路径**：项目 → Settings → Environment Variables

添加以下变量（**Production, Preview, Development 都勾选**）：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://apixuan.com
NEXT_PUBLIC_SITE_NAME=api中转站精选导航
NEXT_PUBLIC_SITE_DESCRIPTION=AI中转站评测，真实体验, 从首充优惠，稳定性，模型价格，使用体验，模型跑分等多维评测排名，助您找到最适合的 GPT,Claude, Codex,Grok,Gemini 中转站
```

⚠️ **重要**：不要把 `.env.local` 文件提交到 Git！它已经在 `.gitignore` 中了。

---

### 第四步：添加自定义域名

**路径**：项目 → Settings → Domains

1. 点击 **Add Domain**
2. 输入 `apixuan.com`，点击 **Add**
3. 再次点击 **Add Domain**
4. 输入 `www.apixuan.com`，点击 **Add**

**Vercel 会自动**：
- ✅ 验证 DNS 解析是否正确
- ✅ 配置 SSL 证书（Let's Encrypt）
- ✅ 设置 www → apixuan.com 的重定向

**等待时间**：通常 5-10 分钟

---

### 第五步：配置 Supabase 允许域名

1. 访问 https://supabase.com/dashboard
2. 进入你的项目：`bmnvirrnbkrepmixiisq`
3. 进入 **Authentication → URL Configuration**
4. 在 **Site URL** 中填入：`https://apixuan.com`
5. 在 **Redirect URLs** 中添加：
   - `https://apixuan.com/**`
   - `https://www.apixuan.com/**`
   - `https://*.vercel.app/**` （预览部署用）

---

## ✅ 验证部署

### 1. 检查域名访问

访问以下 URL，确保都能正常打开：
- https://apixuan.com
- https://www.apixuan.com
- https://apixuan.com/providers
- https://apixuan.com/models
- https://apixuan.com/articles

### 2. 检查 SSL 证书

浏览器地址栏应显示 🔒 锁图标

### 3. 检查 SEO 配置

```bash
# 查看 robots.txt
curl https://apixuan.com/robots.txt

# 查看 sitemap
curl https://apixuan.com/sitemap.xml

# 查看 Open Graph 元标签
curl -s https://apixuan.com | grep "og:"
```

### 4. 检查移动端

在 Chrome DevTools 中切换到移动端视图，确保响应式布局正常。

---

## 🔄 自动部署

配置完成后，每次推送代码到 GitHub main 分支，Vercel 会自动：
1. 拉取最新代码
2. 运行 `npm run build`
3. 部署到生产环境
4. 通知部署结果

**部署时间**：通常 2-3 分钟

---

## 📊 提交 Sitemap 到搜索引擎

### Google Search Console

1. 访问 https://search.google.com/search-console
2. 添加资源：`apixuan.com`
3. 验证所有权（选择 DNS 验证或 HTML 标签验证）
4. 提交 Sitemap：`https://apixuan.com/sitemap.xml`

### 百度站长平台

1. 访问 https://ziyuan.baidu.com/site/index
2. 添加网站：`apixuan.com`
3. 验证所有权（选择文件验证或 HTML 标签验证）
4. 提交 Sitemap：`https://apixuan.com/sitemap.xml`

---

## 🛠️ 常见问题

### Q1: 域名访问显示 404

**解决方案**：
- 检查 DNS 解析是否生效：`nslookup apixuan.com`
- 等待 DNS 传播完成（最多 48 小时，通常 2 小时内）

### Q2: SSL 证书配置失败

**解决方案**：
- 确保 DNS 解析正确指向 `cname.vercel-dns.com`
- 在 Vercel Domains 设置中点击 **Refresh** 按钮

### Q3: Supabase 连接失败

**解决方案**：
- 检查 Vercel 环境变量是否正确配置
- 确认 Supabase 允许列表包含新域名
- 重新部署：`vercel --prod`

### Q4: ISR 不生效

**解决方案**：
- 检查 `app/*/page.tsx` 中是否正确设置 `export const revalidate = 300`
- 在 Vercel 项目设置中确认启用了 ISR

---

## 📈 部署后监控

### 推荐工具

1. **Google Analytics 4**（流量分析）
2. **Vercel Analytics**（性能监控，免费）
3. **Sentry**（错误追踪，可选）
4. **UptimeRobot**（可用性监控，免费）

---

## 🎉 完成！

部署成功后，你的网站将：
- ✅ 在全球 CDN 上运行（低延迟）
- ✅ 自动配置 SSL 证书
- ✅ 每次推送代码自动部署
- ✅ ISR 增量静态再生成（数据自动更新）
- ✅ SEO 优化完整（93/100 分）

---

**联系方式**：kfly70418@gmail.com  
**部署时间**：2026-08-14
