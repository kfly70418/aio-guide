# AIO Guide - AI API 中转站精选导航

精选优质 AI API 中转站，人工核验，价格透明，帮您找到最适合的服务商。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **部署**: Vercel

## 功能特性

### 前台功能
- ✅ 中转站排行榜（分页、搜索）
- ✅ 服务商详情页（价格对比、核验时间）
- ✅ 使用教程和 AI 快讯
- ✅ 关于我们、评测方法、商业披露

### 后台管理
- ✅ 服务商管理（CRUD、发布/下架、核验）
- ✅ 操作日志
- ✅ 用户认证

### SEO 优化
- ✅ 服务端渲染 + ISR
- ✅ 动态 Sitemap
- ✅ 结构化数据 (JSON-LD)
- ✅ Open Graph + Twitter Card
- ✅ 语义化 HTML
- ✅ 关键词优化

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Supabase 配置

# 运行开发服务器
npm run dev

# 访问
http://localhost:3000
```

## 环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 网站配置
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=api中转站精选导航
NEXT_PUBLIC_SITE_DESCRIPTION=AI中转站评测，真实体验
```

## 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 访问 [Vercel](https://vercel.com)
3. 导入项目
4. 配置环境变量
5. 部署

### 环境变量配置

在 Vercel Dashboard 中配置以下环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_DESCRIPTION`

## 项目结构

```
aio-guide/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── admin/             # 后台管理
│   ├── providers/         # 服务商页面
│   ├── articles/          # 文章页面
│   ├── about/             # 关于页面
│   └── page.tsx           # 首页
├── components/
│   ├── ui/                # UI 组件库
│   ├── layout/            # 布局组件
│   └── admin/             # 后台组件
├── lib/
│   ├── supabase/          # Supabase 客户端
│   ├── providers.ts       # 数据访问层
│   ├── seo.ts             # SEO 工具
│   └── utils.ts           # 工具函数
├── public/                # 静态资源
└── supabase/              # 数据库迁移
```

## 数据库

使用 Supabase PostgreSQL，包含以下表：
- `profiles` - 管理员资料
- `providers` - 服务商
- `models` - AI 模型
- `channels` - 渠道
- `prices` - 价格
- `articles` - 文章
- `audit_logs` - 操作日志

## License

MIT

## 作者

Built with Claude Code
