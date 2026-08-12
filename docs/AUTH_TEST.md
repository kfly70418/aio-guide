# 认证系统测试文档

## 阶段 2 完成情况

### ✅ 已完成

1. **Supabase Auth 客户端配置**
   - ✅ `lib/supabase/server.ts` - 服务端客户端
   - ✅ `lib/supabase/client.ts` - 浏览器端客户端
   - ✅ `lib/supabase/admin.ts` - 管理端客户端

2. **认证相关组件**
   - ✅ `hooks/useAuth.tsx` - 认证状态 Hook
   - ✅ 登录表单（集成在登录页面中）

3. **认证页面**
   - ✅ `app/auth/login/page.tsx` - 登录页面
   - ✅ `app/auth/signin/route.ts` - 登录处理（POST）
   - ✅ `app/auth/logout/route.ts` - 登出处理（POST/GET）
   - ✅ `app/auth/callback/route.ts` - OAuth 回调页面

4. **路由保护**
   - ✅ `app/admin/layout.tsx` - 后台布局带认证检查
   - ✅ 未登录访问 `/admin` 自动跳转到 `/auth/login`
   - ✅ 已登录访问 `/auth/login` 自动跳转到 `/admin`

5. **公开注册控制**
   - ✅ 登录页面明确提示："本站不开放公开注册，管理员账号由超级管理员在后台创建"
   - ⚠️ 需在 Supabase Dashboard 关闭公开注册

---

## 功能测试清单

### 1. 未登录访问后台
**测试步骤：**
1. 打开浏览器无痕模式
2. 访问 `http://localhost:3000/admin`

**预期结果：**
- 自动重定向到 `/auth/login`
- 显示登录表单

### 2. 管理员登录
**测试步骤：**
1. 访问 `http://localhost:3000/auth/login`
2. 输入管理员邮箱和密码
3. 点击"登录"按钮

**预期结果：**
- 登录成功后重定向到 `/admin`
- 顶部导航栏显示用户邮箱
- 侧边栏显示管理菜单

### 3. 错误处理
**测试场景 3.1：错误的邮箱或密码**
- 输入错误的凭据
- 预期：显示"邮箱或密码不正确"

**测试场景 3.2：空表单提交**
- 不填写任何内容直接提交
- 预期：浏览器原生验证提示"请填写此字段"

**测试场景 3.3：非管理员账号**
- 使用没有 profiles 记录的账号登录
- 预期：显示"该账号不是管理员，无法访问后台"

**测试场景 3.4：停用账号**
- 使用 `is_active = false` 的账号登录
- 预期：显示"该账号已被停用，请联系超级管理员"

### 4. 会话管理
**测试步骤：**
1. 登录成功后关闭浏览器
2. 重新打开浏览器访问 `/admin`

**预期结果：**
- 会话保持，直接显示后台页面
- 无需重新登录

### 5. 登出功能
**测试步骤：**
1. 在后台页面点击"登出"按钮
2. 观察跳转

**预期结果：**
- 会话清除
- 重定向到 `/auth/login`
- 再次访问 `/admin` 需要重新登录

### 6. 已登录访问登录页
**测试步骤：**
1. 登录成功后
2. 手动访问 `/auth/login`

**预期结果：**
- 自动重定向到 `/admin`
- 不显示登录表单

### 7. OAuth 回调处理
**测试步骤：**
1. 访问 `/auth/callback?code=invalid_code`

**预期结果：**
- 重定向到 `/auth/login?error=登录验证失败，请重试`
- 显示错误提示

---

## Supabase 配置检查清单

### 1. 环境变量配置
检查 `.env.local` 文件包含：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. 关闭公开注册
在 Supabase Dashboard 中：
1. 进入 `Authentication` → `Providers`
2. 找到 `Email` provider
3. 关闭 `Enable email signup` 选项
4. 保存设置

### 3. 验证数据库表和 RLS
执行以下 SQL 检查：
```sql
-- 检查 profiles 表是否存在
SELECT * FROM profiles LIMIT 1;

-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 检查是否有管理员账号
SELECT id, email, is_active, created_at 
FROM profiles 
WHERE is_active = true;
```

### 4. 创建测试管理员（如果没有）
```sql
-- 1. 在 Supabase Dashboard 的 Authentication 中手动创建用户
-- 2. 然后在 SQL Editor 中执行：
INSERT INTO profiles (id, email, is_active)
VALUES (
  '从 auth.users 表复制的 user_id',
  'admin@example.com',
  true
);
```

---

## 安全检查清单

- ✅ 所有后台路由都经过 `admin/layout.tsx` 的认证检查
- ✅ 服务端使用 `createClient()` 从 `lib/supabase/server.ts`
- ✅ 浏览器端使用 `createClient()` 从 `lib/supabase/client.ts`
- ✅ 管理操作使用 `createAdminClient()` 从 `lib/supabase/admin.ts`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` 只在服务端使用，不暴露给客户端
- ✅ 登录页面设置了 `robots: noindex, nofollow`
- ✅ 密码输入框使用 `type="password"` 和 `autoComplete="current-password"`
- ⚠️ 登出按钮使用 POST 防止 CSRF（已实现）

---

## 已知问题和改进建议

### 当前实现
- ✅ 基本认证功能完整
- ✅ 错误处理健全
- ✅ 会话管理正常
- ✅ 路由保护有效

### 未来改进（可选）
1. **记住我功能** - 延长会话有效期
2. **忘记密码** - 密码重置流程
3. **双因素认证** - 增强安全性
4. **登录日志** - 记录登录历史
5. **会话超时提醒** - 提前通知用户会话即将过期

---

## 验证方式

### 快速验证命令
```bash
# 1. 启动开发服务器
npm run dev

# 2. 在浏览器中测试
# - 访问 http://localhost:3000/auth/login
# - 尝试登录
# - 检查重定向
# - 测试登出

# 3. 构建生产版本
npm run build

# 4. TypeScript 类型检查
npm run type-check
```

---

## 交付物

阶段 2 已完成以下交付物：

1. ✅ 完整的登录系统
2. ✅ 受保护的后台路由
3. ✅ 会话管理
4. ✅ 错误处理
5. ✅ OAuth 回调页面
6. ✅ 认证相关组件和 Hook

---

## 下一步

✅ **阶段 2 完成** - 认证系统已就绪

**准备进入阶段 3：基础 UI 组件库**
- 布局组件（前台布局、后台布局、导航栏、页脚）
- 表单组件（Input、Textarea、Select、Button 等）
- 数据展示组件（Table、Card、Badge 等）
- 反馈组件（Toast、Modal、Loading 等）
