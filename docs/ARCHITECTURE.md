# 技术架构文档

## 技术栈

### 前端框架
- **Next.js 15** (App Router)
  - 服务端组件为主
  - 客户端组件用于交互
  - 服务端渲染 (SSR) 确保 SEO
  - 静态生成 (SSG) 用于不常变化的页面

### 开发语言
- **TypeScript 5.x** (严格模式)
  - `strict: true`
  - `noImplicitAny: true`
  - `strictNullChecks: true`

### 样式
- **Tailwind CSS 3.x**
  - 响应式设计
  - 深色模式支持（可选）
  - 自定义主题配置

### 数据库
- **Supabase PostgreSQL**
  - 托管式数据库
  - Row Level Security (RLS)
  - 实时订阅（暂不使用）

### 认证
- **Supabase Auth**
  - 仅管理员登录
  - 邮箱密码认证
  - 关闭公开注册

### 部署
- **Vercel**
  - 自动部署
  - CDN 加速
  - 环境变量管理

### 版本控制
- **GitHub 私有仓库**
  - 主分支保护
  - PR 审查（可选）

## 项目结构

```
aio-guide/
├── .env.local.example      # 环境变量模板
├── .env.local              # 本地环境变量（不提交）
├── .gitignore              # Git 忽略配置
├── next.config.js          # Next.js 配置
├── tsconfig.json           # TypeScript 配置
├── tailwind.config.js      # Tailwind 配置
├── package.json            # 依赖管理
├── README.md               # 项目说明
│
├── docs/                   # 项目文档
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── TASKS.md
│
├── public/                 # 静态资源
│   ├── robots.txt
│   ├── sitemap.xml
│   └── images/
│
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 首页
│   │   ├── not-found.tsx   # 404 页面
│   │   │
│   │   ├── providers/      # 服务商页面
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── models/         # 模型对比页面
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── articles/       # 教程文章
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/          # 管理后台
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── providers/
│   │   │   ├── models/
│   │   │   ├── channels/
│   │   │   ├── prices/
│   │   │   ├── articles/
│   │   │   └── logs/
│   │   │
│   │   ├── auth/           # 认证相关
│   │   │   ├── login/
│   │   │   └── callback/
│   │   │
│   │   └── api/            # API 路由（如果需要）
│   │       └── ...
│   │
│   ├── components/         # React 组件
│   │   ├── ui/             # 基础 UI 组件
│   │   ├── providers/      # 服务商相关组件
│   │   ├── models/         # 模型相关组件
│   │   ├── articles/       # 文章相关组件
│   │   └── admin/          # 后台组件
│   │
│   ├── lib/                # 工具库
│   │   ├── supabase/       # Supabase 客户端
│   │   │   ├── client.ts   # 浏览器端客户端
│   │   │   ├── server.ts   # 服务端客户端
│   │   │   └── admin.ts    # 管理端客户端
│   │   ├── utils.ts        # 通用工具函数
│   │   ├── constants.ts    # 常量定义
│   │   └── types.ts        # 类型定义
│   │
│   ├── hooks/              # 自定义 React Hooks
│   │   ├── useAuth.ts
│   │   └── useSupabase.ts
│   │
│   └── styles/             # 全局样式
│       └── globals.css
│
└── supabase/               # Supabase 配置
    ├── migrations/         # 数据库迁移文件
    └── seed.sql            # 初始数据
```

## 数据流

### 前台页面数据流
```
用户请求
  ↓
Next.js 服务器组件
  ↓
Supabase 服务端客户端
  ↓
PostgreSQL (RLS: 只读已发布数据)
  ↓
渲染 HTML 返回
```

### 后台页面数据流
```
管理员请求
  ↓
检查认证状态
  ↓
Next.js 服务器组件/客户端组件
  ↓
Supabase 客户端
  ↓
PostgreSQL (RLS: 管理员全权限)
  ↓
返回数据/执行操作
  ↓
记录操作日志
```

## 页面渲染策略

### 静态生成 (SSG)
- 首页（每次构建时生成）
- 教程文章列表（增量静态生成）
- 教程文章详情（增量静态生成）

### 服务端渲染 (SSR)
- 服务商列表（支持筛选和排序）
- 服务商详情
- 模型对比页面
- 价格历史页面

### 客户端渲染 (CSR)
- 管理后台所有页面
- 登录页面
- 交互式筛选组件

## 性能优化

1. **图片优化**
   - 使用 Next.js Image 组件
   - 服务商 Logo 使用 WebP 格式
   - 懒加载非首屏图片

2. **代码分割**
   - 动态导入管理后台组件
   - 按路由自动分割

3. **缓存策略**
   - 静态资源 CDN 缓存
   - 数据库查询结果缓存（考虑 Next.js 15 缓存机制）
   - 合理设置 `revalidate` 时间

4. **数据库优化**
   - 添加必要索引
   - 避免 N+1 查询
   - 使用 Supabase 的查询优化

## SEO 策略

### 元数据管理
- 每个页面独立的 `metadata` 导出
- 动态生成 title 和 description
- Open Graph 图片

### URL 结构
```
/                           # 首页
/providers                  # 服务商列表
/providers/[slug]           # 服务商详情
/models                     # 模型列表
/models/[slug]              # 模型对比
/articles                   # 教程列表
/articles/[slug]            # 教程详情
/admin                      # 管理后台（noindex）
```

### 结构化数据
- 首页: Organization + WebSite
- 服务商详情: Service
- 文章详情: Article
- 列表页: ItemList

### Sitemap
- 自动生成 sitemap.xml
- 只包含已发布且优质的页面
- 定期更新

### Robots.txt
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /auth
Disallow: /api

Sitemap: https://yourdomain.com/sitemap.xml
```

## 环境变量

### 必需的环境变量
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 仅服务端使用，不暴露给浏览器

# 站点配置
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=AIO Guide
```

### 可选的环境变量
```
# 分析工具（未来）
NEXT_PUBLIC_GA_ID=

# 其他第三方服务
```

## 安全考虑

1. **环境变量**: `.env.local` 必须在 `.gitignore` 中
2. **密钥分离**: `SUPABASE_SERVICE_ROLE_KEY` 只在服务端使用
3. **RLS 策略**: 所有表必须启用 Row Level Security
4. **输入验证**: 所有用户输入必须验证和清理
5. **CSRF 保护**: Next.js 自动处理
6. **SQL 注入**: 使用 Supabase 参数化查询

## 部署流程

### 开发环境
1. 克隆代码仓库
2. 复制 `.env.local.example` 为 `.env.local`
3. 填写环境变量
4. `npm install`
5. `npm run dev`

### 生产部署
1. 推送到 GitHub
2. Vercel 自动检测并部署
3. 配置环境变量
4. 首次部署后配置自定义域名
5. 验证 SEO 和性能指标

## 监控和维护

### 需要监控的指标
- Vercel Analytics（速度和性能）
- Supabase Dashboard（数据库性能）
- Google Search Console（SEO 表现）
- 错误日志（Vercel 日志）

### 日常维护
- 每周检查过期数据提醒
- 每月更新依赖包（安全补丁）
- 定期备份数据库
- 监控网站可访问性

## 技术决策记录

### 为什么选择 App Router 而不是 Pages Router？
- 更好的 SEO（服务器组件）
- 更灵活的布局系统
- 更好的性能（自动优化）
- Next.js 官方推荐的新标准

### 为什么选择 Supabase 而不是自建 PostgreSQL？
- 托管式服务，减少运维负担
- 内置认证系统
- 自动备份
- 开发环境和生产环境一致

### 为什么不使用 Prisma ORM？
- Supabase 客户端已足够强大
- 减少一层抽象
- 类型安全由 Supabase 类型生成保证
- 更好的性能（直接查询）

## 未来扩展可能

以下功能不在第一版范围，但架构需预留扩展空间：

1. **用户系统**: 预留 user_id 关联字段
2. **评论系统**: 可增加 comments 表
3. **API 对外开放**: 可增加 API 路由和 API Key 管理
4. **多语言**: 使用 i18n 库
5. **自动监测**: 可增加定时任务系统
