# 安全规范文档

## 概述

本文档定义项目的安全要求和最佳实践，确保数据安全、防止未授权访问和保护用户隐私。

---

## 认证和授权

### 认证策略

1. **仅管理员登录**
   - 使用 Supabase Auth 的邮箱密码认证
   - 关闭公开注册入口
   - 新管理员由超级管理员在 Supabase Dashboard 手动创建

2. **密码要求**
   - 最小长度 12 字符
   - 必须包含大小写字母、数字和特殊字符
   - 定期提醒更换密码（建议 90 天）

3. **会话管理**
   - 使用 Supabase 的 JWT token
   - token 自动续期
   - 支持"记住我"功能（可选）
   - 管理员可随时登出

### 授权策略

1. **角色定义**
   - `admin`: 普通管理员，可管理内容
   - `super_admin`: 超级管理员，可管理其他管理员

2. **权限矩阵**

| 资源 | 公众 | 管理员 | 超级管理员 |
|------|------|--------|------------|
| 查看已发布内容 | ✅ | ✅ | ✅ |
| 查看草稿内容 | ❌ | ✅ | ✅ |
| 创建/编辑内容 | ❌ | ✅ | ✅ |
| 删除内容 | ❌ | ✅ | ✅ |
| 管理管理员 | ❌ | ❌ | ✅ |
| 查看操作日志 | ❌ | ✅ | ✅ |

3. **Row Level Security (RLS)**
   - 所有表必须启用 RLS
   - 公众只能读取已发布且状态为 active 的数据
   - 管理员通过 RLS 策略验证身份
   - 详细策略见 `DATABASE.md`

---

## 环境变量和密钥管理

### 必须保密的信息

1. **数据库密钥**
   - `SUPABASE_SERVICE_ROLE_KEY`: 绝对不能暴露给浏览器
   - 只在服务端代码中使用
   - 不得提交到 Git 仓库

2. **API 密钥**
   - 第三方服务的 API Key
   - 支付接口密钥（如果有）

3. **个人信息**
   - 银行卡号、身份证号等敏感信息
   - 绝对不得写入代码或配置文件

### 环境变量规范

1. **文件结构**
   ```
   .env.local.example   # 模板文件（提交到 Git）
   .env.local           # 本地环境变量（不提交）
   .env.production      # 生产环境变量（不提交）
   ```

2. **.env.local.example 示例**
   ```env
   # Supabase 公开配置（可以暴露给浏览器）
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Supabase 私密配置（仅服务端使用，不能暴露）
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # 站点配置
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_NAME=AIO Guide
   ```

3. **.gitignore 配置**
   ```gitignore
   # 环境变量
   .env.local
   .env.production
   .env*.local
   
   # 敏感文件
   *.pem
   *.key
   secrets/
   ```

4. **Vercel 环境变量**
   - 在 Vercel Dashboard 中配置
   - 分别设置 Development、Preview 和 Production 环境
   - 敏感变量标记为 "Sensitive"

### 密钥使用规范

1. **客户端 vs 服务端**
   ```typescript
   // ❌ 错误：在客户端使用 service role key
   'use client'
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
   
   // ✅ 正确：在服务端使用 service role key
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   )
   ```

2. **Supabase 客户端类型**
   - **Anon Client**: 用于浏览器端，受 RLS 限制
   - **Service Client**: 用于服务端，绕过 RLS（谨慎使用）
   - **Auth Client**: 用于管理员登录后的操作

---

## 数据访问控制

### 公开数据

允许匿名用户访问的数据：
- 已发布的服务商（`providers.status = 'published'`）
- 已发布的模型（`models.status = 'published'`）
- 活跃渠道和价格（`status = 'active'`）
- 已发布的文章（`articles.status = 'published'`）

### 受保护数据

仅管理员可访问：
- 草稿状态的内容
- 管理员资料
- 操作日志
- 完整的价格历史
- 点击统计详情

### 敏感操作

需要二次确认的操作：
- 删除服务商
- 删除模型
- 批量删除价格
- 删除文章
- 禁用管理员账号

---

## 输入验证和清理

### 表单验证

1. **前端验证**
   - 使用 Zod 或 Yup 进行类型验证
   - 即时反馈用户错误输入
   - 不依赖前端验证作为唯一防线

2. **后端验证**
   - 服务端必须重新验证所有输入
   - 验证数据类型、格式、长度、范围
   - 拒绝不合法的请求

3. **验证示例**
   ```typescript
   import { z } from 'zod'
   
   const ProviderSchema = z.object({
     name: z.string().min(1).max(100),
     slug: z.string().regex(/^[a-z0-9-]+$/),
     website_url: z.string().url().optional(),
     description: z.string().max(1000).optional(),
   })
   
   // 使用
   const result = ProviderSchema.safeParse(input)
   if (!result.success) {
     return { error: result.error }
   }
   ```

### SQL 注入防护

1. **使用参数化查询**
   ```typescript
   // ❌ 错误：字符串拼接
   const { data } = await supabase
     .from('providers')
     .select('*')
     .eq('name', `${userInput}`) // 危险！
   
   // ✅ 正确：参数化查询
   const { data } = await supabase
     .from('providers')
     .select('*')
     .eq('name', userInput) // Supabase 自动处理
   ```

2. **避免动态表名或列名**
   - 如必须使用，采用白名单验证

### XSS 防护

1. **内容清理**
   - Markdown 内容使用 `react-markdown` 或 `marked` + `DOMPurify`
   - 不允许嵌入 `<script>` 标签
   - 不允许 `javascript:` 协议的链接

2. **React 自动转义**
   - 使用 JSX 自动转义
   - 避免使用 `dangerouslySetInnerHTML`（除非内容已清理）

   ```typescript
   // ❌ 危险
   <div dangerouslySetInnerHTML={{ __html: userInput }} />
   
   // ✅ 安全
   import DOMPurify from 'isomorphic-dompurify'
   const clean = DOMPurify.sanitize(userInput)
   <div dangerouslySetInnerHTML={{ __html: clean }} />
   ```

### CSRF 防护

- Next.js App Router 自动处理 CSRF
- 使用 Server Actions 时自动保护
- 敏感操作额外验证用户身份

---

## API 安全

### Rate Limiting（速率限制）

1. **Vercel 内置限制**
   - 自动防止 DDoS
   - 每个 IP 的请求频率限制

2. **应用层限制**（未来可选）
   - 点击统计 API：每分钟最多 10 次
   - 搜索 API：每分钟最多 30 次

### CORS 配置

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ]
  },
}
```

---

## 日志和审计

### 操作日志

记录所有管理员操作：
- 创建、更新、删除内容
- 发布和下架操作
- 登录和登出
- 导出数据

```typescript
// 示例：记录操作日志
async function logAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: any
) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    ip_address: getClientIP(),
    user_agent: headers().get('user-agent'),
  })
}
```

### 敏感信息脱敏

- 日志中不记录密码
- IP 地址可选择性记录（考虑隐私）
- 避免记录完整的信用卡号或身份证号

### 日志保留

- 操作日志保留至少 90 天
- 重要操作日志永久保留
- 定期导出备份

---

## 数据隐私

### 用户数据收集

**第一版不收集用户个人信息**，仅收集：
- 点击统计（匿名）
- 页面浏览量（匿名）

### GDPR 合规（未来）

如果需要收集用户数据：
1. 明确告知收集目的
2. 提供隐私政策
3. 支持数据导出和删除
4. Cookie 使用说明

---

## 第三方依赖安全

### 依赖审查

1. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

2. **避免高风险包**
   - 检查包的维护状态
   - 优先选择知名、活跃的包
   - 避免使用包含已知漏洞的版本

3. **锁定版本**
   - 使用 `package-lock.json`
   - 生产环境避免使用 `^` 或 `~`

### 供应链攻击防护

1. 使用官方源
2. 验证包的完整性
3. 定期审查新增的依赖

---

## 部署安全

### HTTPS

- 生产环境必须使用 HTTPS
- Vercel 自动提供 SSL 证书
- 强制 HTTPS 重定向

### 环境隔离

1. **开发环境**
   - 使用测试数据库
   - 不影响生产数据

2. **生产环境**
   - 独立的数据库
   - 严格的访问控制
   - 定期备份

### 安全头部

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}
```

---

## 事件响应

### 安全事件分类

1. **P0（严重）**
   - 数据库泄露
   - 管理员账号被盗
   - 生产数据被删除

2. **P1（高）**
   - 未授权访问后台
   - XSS 漏洞被利用
   - API 密钥泄露

3. **P2（中）**
   - 可疑登录尝试
   - 异常流量

### 应急流程

1. **立即行动**
   - 封禁可疑 IP
   - 重置泄露的密钥
   - 锁定受影响的账号

2. **调查**
   - 检查操作日志
   - 确定影响范围
   - 记录事件详情

3. **恢复**
   - 修复漏洞
   - 恢复数据（如有备份）
   - 通知受影响用户

4. **事后总结**
   - 编写事件报告
   - 改进安全措施
   - 更新安全文档

---

## 安全检查清单

### 开发阶段
- [ ] `.env.local` 已加入 `.gitignore`
- [ ] 所有密钥使用环境变量
- [ ] 服务端和客户端代码分离清晰
- [ ] 表单输入已验证
- [ ] SQL 查询使用参数化
- [ ] Markdown 内容已清理

### 部署前
- [ ] 所有表已启用 RLS
- [ ] RLS 策略已测试
- [ ] 环境变量已在 Vercel 配置
- [ ] 生产数据库已备份
- [ ] 安全头部已配置
- [ ] HTTPS 已启用

### 上线后
- [ ] 监控异常登录
- [ ] 定期审查操作日志
- [ ] 定期更新依赖
- [ ] 定期备份数据
- [ ] 定期更换密钥（建议 90 天）

---

## 禁止事项

### 绝对不允许

1. **伪造数据**
   - 不得伪造测试结果
   - 不得伪造核验时间
   - 不得伪造点击量或浏览量
   - 不得伪造价格数据

2. **泄露密钥**
   - 不得将密钥写入代码
   - 不得在日志中打印密钥
   - 不得在 Git 提交中包含密钥
   - 不得在公开渠道分享密钥

3. **绕过安全机制**
   - 不得禁用 RLS（除非有充分理由且经过审查）
   - 不得跳过输入验证
   - 不得使用硬编码的管理员密码

4. **侵犯隐私**
   - 不得收集不必要的用户信息
   - 不得出售用户数据
   - 不得滥用操作日志

---

## 安全培训

### 管理员培训内容

1. **密码安全**
   - 使用强密码
   - 不共享账号
   - 定期更换密码

2. **钓鱼识别**
   - 识别可疑邮件
   - 不点击不明链接
   - 确认网站域名

3. **数据操作**
   - 删除前确认
   - 导出数据注意保护
   - 不在公共场所登录后台

---

## 合规要求

### 中国法律法规

1. **网络安全法**
   - 保护用户数据安全
   - 防止数据泄露
   - 配合监管部门

2. **数据安全法**
   - 数据分类分级
   - 重要数据保护
   - 数据出境管理

3. **个人信息保护法**
   - 最小必要原则
   - 用户知情同意
   - 数据主体权利

### 行业标准

- 遵循 OWASP Top 10 安全风险防护
- 参考 CIS 安全基准
- 定期进行安全审计

---

## 更新记录

- 2024-01-XX: 初版发布
- 后续更新将记录在此
