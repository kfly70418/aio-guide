# API 中转站精选导航

一个中文 AI API 服务商评测与价格对比平台。

## 项目简介

AI中转站评测，真实体验, 从首充优惠，稳定性，模型价格，使用体验，模型跑分等多维评测排名，助您找到最适合的 GPT,Claude, Codex,Grok,Gemini 中转站。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript (严格模式)
- **样式**: Tailwind CSS
- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth
- **部署**: Vercel

## 开发指南

### 环境要求

- Node.js 20+
- npm 或 yarn

### 本地开发

1. 克隆仓库
```bash
git clone <your-repo-url>
cd aio-guide
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.local.example .env.local
# 编辑 .env.local 填入你的 Supabase 配置
```

4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 可用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run type-check   # TypeScript 类型检查
```

## 项目结构

```
aio-guide/
├── app/              # Next.js App Router 页面
├── components/       # React 组件
├── lib/              # 工具库和配置
├── public/           # 静态资源
├── docs/             # 项目文档
└── supabase/         # 数据库迁移文件
```

## 文档

详细文档请查看 `docs/` 目录：

- [产品需求文档 (PRD)](docs/PRD.md)
- [技术架构文档](docs/ARCHITECTURE.md)
- [数据库设计文档](docs/DATABASE.md)
- [安全规范文档](docs/SECURITY.md)
- [开发任务拆解文档](docs/TASKS.md)

## 部署

本项目使用 Vercel 部署：

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署

## 安全注意事项

- 不要将 `.env.local` 提交到 Git
- 不要在客户端代码中使用 `SUPABASE_SERVICE_ROLE_KEY`
- 所有数据库表必须启用 Row Level Security
- 定期更新依赖包

## License

Private Project - All Rights Reserved
