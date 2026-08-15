---
slug: configure-claude-code-relay-api-windows
title: Claude Code 如何配置中转 API？Windows 零基础完整教程
summary: Windows 零基础配置 Claude Code 中转 API 教程，详细说明安装、Base URL、API Key、连接测试和常见错误处理方法。
category: guide
tags: ["Claude Code","API 中转站","Windows","使用教程"]
status: published
seo_title: Claude Code 配置中转 API 教程：Windows 完整指南（2026 图解）
seo_description: Windows 安装 Claude Code、配置 Base URL/API Key、测试连接、永久保存配置完整流程。含 PowerShell 命令、settings.json 配置、401/404/429 错误排查，2026-08 验证。
---

## 开头

Claude Code 是 Anthropic 官方的命令行工具，可以通过配置自定义 Base URL 连接中转 API。本文面向 Windows 零基础用户，用截图详解 6 个步骤：安装 Claude Code（1 条命令）→ 确认认证方式（Bearer Token 或 API Key）→ 临时配置测试（PowerShell 环境变量）→ 启动并验证（/status 命令）→ 发送测试消息（验证连接）→ 永久保存配置（settings.json）。包含 401/404/429 错误排查和安全提醒，2026 年 8 月验证有效。

## 准备工作

### 开始前需要准备

1. **电脑系统**  
   - Windows 10 或 Windows 11
   - 已联网

2. **中转服务商账号**  
   - 已注册并充值（建议 ¥10-20 测试）
   - 已创建 API Key
   - 服务商**明确支持** Anthropic Messages API 或 Claude Code

3. **服务商提供的信息**  
   - Base URL（接口地址）
   - API Key 或 Token
   - 认证方式说明（Bearer Token 或 x-api-key）

4. **预计时间**  
   完整流程约 15-20 分钟

### 重要提醒

**不是所有中转站都支持 Claude Code**：

| 服务商类型 | 是否支持 |
|-----------|---------|
| 明确支持 Anthropic Messages API | ✅ 可以 |
| 明确支持 Claude Code | ✅ 可以 |
| 只支持 OpenAI 兼容接口 | ❌ 不可以 |
| 只能调用 `/v1/chat/completions` | ❌ 不可以 |

**如何确认**：
1. 查看服务商文档是否有"Claude Code 配置"章节
2. 查看是否有"Anthropic API"或"Claude API"选项
3. 咨询客服是否支持

### 相关概念

**Base URL**：API 的基础地址，类似：
```
https://api.example.com
```

**API Key**：身份验证密钥，类似：
```
sk-abc123def456...
```

如果不理解这些概念，建议先阅读：[Base URL、模型名称、Token 解释](/articles/base-url-model-id-token-explained)

## 第 1 步：在 Windows 安装 Claude Code

### 1.1 打开 PowerShell

**方法 1：开始菜单搜索**

1. 点击 Windows 开始菜单（左下角）
2. 输入"PowerShell"
3. 点击"Windows PowerShell"

**方法 2：快捷键**

按 `Win + X`，选择"Windows PowerShell"或"终端"

### 1.2 运行安装命令

在 PowerShell 中粘贴以下命令，然后按回车：

```powershell
irm https://claude.ai/install.ps1 | iex
```

**命令说明**：
- `irm`：下载安装脚本
- `iex`：执行安装脚本

**安装过程**：
- 下载 Claude Code 安装程序
- 安装到用户目录
- 添加到系统 PATH

**预计时间**：1-3 分钟（取决于网速）

### 1.3 验证安装成功

安装完成后，输入：

```powershell
claude --version
```

**成功标志**：
```
Claude Code v2.1.233 (或其他版本号)
```

**如果提示"找不到 claude 命令"**：
1. 关闭当前 PowerShell 窗口
2. 重新打开 PowerShell
3. 再次运行 `claude --version`

## 第 2 步：确认中转站使用哪种认证方式

Claude Code 支持两种认证方式：

### 方式 1：Bearer Token（更常见）

**环境变量名**：`ANTHROPIC_AUTH_TOKEN`

**适用场景**：
- 服务商说明使用"Bearer Token"
- 服务商说明使用"Authorization"
- 服务商未明确说明（优先尝试）

**请求头格式**：
```
Authorization: Bearer sk-abc123...
```

### 方式 2：API Key（x-api-key）

**环境变量名**：`ANTHROPIC_API_KEY`

**适用场景**：
- 服务商明确说明使用"x-api-key"
- 服务商明确说明使用"API Key"

**请求头格式**：
```
x-api-key: sk-abc123...
```

### 如何确认

**查看服务商文档**：

1. 登录服务商后台
2. 查找"Claude Code 配置"或"Anthropic API"文档
3. 查看示例代码中的请求头

**示例（文档中的请求头）**：
```bash
curl https://api.example.com/v1/messages \
  -H "Authorization: Bearer sk-xxx"  # ← Bearer Token
```

或

```bash
curl https://api.example.com/v1/messages \
  -H "x-api-key: sk-xxx"  # ← API Key
```

**如果未说明**：
- 优先尝试 `ANTHROPIC_AUTH_TOKEN`
- 如果出现 401 错误，再尝试 `ANTHROPIC_API_KEY`

## 第 3 步：临时配置 API 地址和密钥

### 为什么先用临时配置

**优点**：
- 关闭 PowerShell 后自动失效
- 适合第一次测试
- 配置错误不影响永久设置

**缺点**：
- 每次打开 PowerShell 都要重新配置

### 3.1 配置 Base URL

在 PowerShell 中输入：

```powershell
$env:ANTHROPIC_BASE_URL = "https://api.example.com"
```

**注意事项**：
- 引号必须保留
- 替换 `https://api.example.com` 为服务商提供的地址
- **不要**在地址后面加 `/v1/messages`（除非文档明确要求）
- 按回车后无任何输出是正常的

**常见错误**：

```powershell
❌ 错误：$env:ANTHROPIC_BASE_URL = https://api.example.com（缺少引号）
❌ 错误：$env:ANTHROPIC_BASE_URL = "https://api.example.com/v1/messages"（多余路径）
✅ 正确：$env:ANTHROPIC_BASE_URL = "https://api.example.com"
```

### 3.2 配置密钥（方式 1：Bearer Token）

如果服务商使用 Bearer Token，输入：

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "sk-abc123def456..."
```

**注意事项**：
- 引号必须保留
- 替换为你的完整 API Key
- 去除前后空格

### 3.2 配置密钥（方式 2：x-api-key）

如果服务商明确使用 x-api-key，输入：

```powershell
$env:ANTHROPIC_API_KEY = "sk-abc123def456..."
```

### 3.3 验证配置

**查看 Base URL**：

```powershell
echo $env:ANTHROPIC_BASE_URL
```

**预期输出**：
```
https://api.example.com
```

**查看密钥**（仅前 10 位）：

```powershell
echo $env:ANTHROPIC_AUTH_TOKEN.Substring(0,10)
```

**预期输出**：
```
sk-abc123d
```

**重要**：不要运行 `echo $env:ANTHROPIC_AUTH_TOKEN`（会显示完整密钥）

## 第 4 步：启动 Claude Code

### 4.1 启动命令

在**同一个** PowerShell 窗口中输入：

```powershell
claude
```

**重要**：必须在设置过环境变量的同一个窗口启动，否则配置无效。

### 4.2 首次启动提示

**可能出现的提示**：

1. **权限确认**：
   ```
   Do you want to allow Claude Code to access files in this directory?
   ```
   输入 `y` 并回车

2. **API Key 使用确认**：
   ```
   Using custom Anthropic base URL: https://api.example.com
   Continue? (y/n)
   ```
   输入 `y` 并回车

### 4.3 检查状态

进入 Claude Code 后，输入：

```
/status
```

**检查以下信息**：

| 检查项 | 预期值 |
|--------|--------|
| Anthropic base URL | `https://api.example.com`（你的中转站地址） |
| Auth method | `Bearer token` 或 `API key` |
| Auth token | `sk-abc***xyz`（显示前后几位） |

**状态页面示例**：

```
╔══════════════════════════════════════════════════════════╗
║                    Claude Code Status                     ║
╠══════════════════════════════════════════════════════════╣
║ Anthropic base URL: https://api.example.com             ║
║ Auth method:        Bearer token                         ║
║ Auth token:         sk-abc***xyz                         ║
║ Model:              claude-3-5-sonnet-20240620           ║
║ Session:            Active                                ║
╚══════════════════════════════════════════════════════════╝
```

**如果 Base URL 显示为官方地址**：

```
Anthropic base URL: https://api.anthropic.com
```

**原因**：环境变量未生效

**解决**：
1. 输入 `/exit` 退出 Claude Code
2. 在同一个 PowerShell 窗口重新运行 `claude`
3. 如果仍不行，重新执行第 3 步配置环境变量

## 第 5 步：发送第一条测试消息

### 5.1 短消息测试

退出状态页面（输入 `/exit` 或按 `Ctrl+C`），然后输入：

```
请只回复：连接测试成功
```

**成功标志**：
- 1-3 秒内收到回复
- 回复内容："连接测试成功"
- 无错误提示

**预期对话**：

```
You: 请只回复：连接测试成功

Claude: 连接测试成功
```

### 5.2 文件读取测试

创建一个测试文件夹，进入该文件夹后启动 Claude Code，输入：

```
请查看当前文件夹，告诉我有哪些文件。不要修改任何文件。
```

**成功标志**：
- Claude 列出了文件夹中的文件
- 说明文件读取功能正常

### 5.3 多轮对话测试

```
You: 中国的首都是哪里？

Claude: 北京。

You: 那里的人口有多少？

Claude: 北京人口约 2154 万（截至 2023 年）。
```

**成功标志**：
- 第二轮能理解"那里"指北京
- 说明上下文功能正常

## 第 6 步：永久保存配置

### 6.1 找到配置文件位置

**用户级配置**（推荐）：

```
%USERPROFILE%\.claude\settings.json
```

**打开方式 1：文件资源管理器**

1. 按 `Win + R` 打开运行窗口
2. 输入：`%USERPROFILE%\.claude`
3. 按回车

**打开方式 2：PowerShell**

```powershell
explorer "$env:USERPROFILE\.claude"
```

### 6.2 创建或编辑 settings.json

**如果没有 `.claude` 文件夹**：

1. 在 `%USERPROFILE%` 下新建文件夹，命名为 `.claude`
2. 进入 `.claude` 文件夹
3. 新建文件 `settings.json`

**如果已有 settings.json**：

用记事本或 VS Code 打开编辑

### 6.3 填写配置内容

**方式 1：Bearer Token 用户**

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.example.com",
    "ANTHROPIC_AUTH_TOKEN": "sk-abc123def456..."
  }
}
```

**方式 2：x-api-key 用户**

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.example.com",
    "ANTHROPIC_API_KEY": "sk-abc123def456..."
  }
}
```

**注意事项**：
- 所有引号必须是英文引号 `"`
- 最后一项后面没有逗号
- 保存为 UTF-8 编码

### 6.4 验证永久配置

1. 关闭所有 PowerShell 窗口
2. 重新打开 PowerShell
3. 运行 `claude`
4. 输入 `/status` 检查配置

**成功标志**：
- Base URL 显示为中转站地址
- 无需再手动设置环境变量

### 6.5 安全提醒

**不要把密钥保存在项目目录**：

```
❌ 错误：D:\MyProject\.claude\settings.json
✅ 正确：%USERPROFILE%\.claude\settings.json
```

**原因**：
- 项目目录可能被上传到 GitHub
- 用户目录不会被提交到版本控制

## 常见错误及解决方法

### 错误 1：401 Unauthorized（未授权）

**完整错误信息**：

```
Error: 401 Unauthorized
Invalid API key provided
```

**可能原因**：

| 原因 | 解决方法 |
|------|---------|
| API Key 错误 | 重新复制 Key，去除前后空格 |
| API Key 过期 | 重新生成 Key |
| 认证方式错误 | `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_API_KEY` 互换试试 |
| 账户被封禁 | 登录后台查看状态 |

**排查步骤**：

1. 登录服务商后台，确认 Key 有效
2. 重新复制 Key，确认无空格
3. 尝试换另一种认证方式：
   ```powershell
   # 如果之前用 ANTHROPIC_AUTH_TOKEN，改用：
   $env:ANTHROPIC_API_KEY = "sk-abc123..."
   ```

详细见：[401 错误排查](/articles/fix-api-401-error)

### 错误 2：404 Not Found（未找到）

**完整错误信息**：

```
Error: 404 Not Found
Endpoint not found
```

**可能原因**：

| 原因 | 解决方法 |
|------|---------|
| Base URL 错误 | 检查是否包含多余路径（如 `/v1/messages`） |
| 服务商不支持 | 确认服务商支持 Anthropic Messages API |
| 地址拼写错误 | 重新从文档复制 |

**排查步骤**：

1. 检查 Base URL：
   ```powershell
   echo $env:ANTHROPIC_BASE_URL
   ```

2. 确认格式：
   ```
   ✅ 正确：https://api.example.com
   ❌ 错误：https://api.example.com/v1/messages
   ❌ 错误：http://api.example.com（没有 s）
   ```

3. 联系服务商确认 Claude Code 支持

### 错误 3：429 Too Many Requests（限流）

**完整错误信息**：

```
Error: 429 Too Many Requests
Rate limit exceeded
```

**可能原因**：

| 原因 | 解决方法 |
|------|---------|
| 请求过快 | 等待 1-5 分钟后重试 |
| 账户余额不足 | 充值 |
| 达到每日限额 | 查看后台限额设置 |
| 上游限流 | 等待恢复 |

**排查步骤**：

1. 登录服务商后台查看余额
2. 查看是否有每日/每小时限额
3. 等待 5 分钟后重试

详细见：[429 错误处理](/articles/fix-api-429-error)

### 错误 4：Claude Code 一直要求登录

**现象**：

```
Please log in to Claude.ai to continue
```

**原因**：
- Claude Code 未检测到自定义配置
- 环境变量未在启动前设置

**解决**：

1. 确认已在 settings.json 中保存配置
2. 或在设置环境变量的同一个 PowerShell 窗口启动
3. 检查 settings.json 格式正确（JSON 语法）

### 错误 5：模型列表中没有想用的模型

**现象**：
- 只能看到 Claude 3 Haiku
- 看不到 Opus 或 Sonnet

**原因**：
- 服务商未提供该模型
- 账户权限不足

**解决**：
1. 查看服务商的模型列表文档
2. 联系客服确认支持的模型
3. 检查账户权限

### 错误 6：响应缓慢或超时

**现象**：
- 等待 >30 秒无响应
- 提示 Timeout

**可能原因**：

| 原因 | 解决方法 |
|------|---------|
| 中转站线路慢 | 换时间段重试 |
| 网络问题 | 检查本地网络 |
| 服务器负载高 | 等待高峰期过后 |

## 测试清单

完成配置后，建议按此清单全面测试：

- [ ] 短消息测试（"你好"）
- [ ] 中文输出测试（用 100 字介绍北京）
- [ ] 多轮对话测试（连续 2 轮）
- [ ] 文件读取测试（查看文件夹）
- [ ] 停止生成测试（Ctrl+C）
- [ ] 账单核对（后台查看 Token 数和费用）
- [ ] 响应速度测试（多次请求，记录延迟）
- [ ] 长时间使用测试（连续使用 1 小时）

## 安全提醒

### 1. 保护 API Key

**不要泄露的地方**：
- ❌ 聊天群截图
- ❌ GitHub 公开仓库
- ❌ 微信/QQ 收藏
- ❌ 网盘同步文件夹（未加密）

**正确做法**：
- ✅ 保存在用户目录 settings.json
- ✅ 使用密码管理器
- ✅ 截图时遮挡完整 Key

### 2. 小额测试

**建议充值**：
- 首次：¥10-20
- 测试 1-2 周后：按月度预算充值

**不要**：
- 看到"充 1000 送 500"就充 ¥1000
- 未测试就大额充值

### 3. 定期检查账单

**检查频率**：每周 1 次

**检查内容**：
- Token 数是否合理
- 费用是否符合价格表
- 是否有异常消耗

### 4. 准备备用方案

**推荐配置**：
- 主力：中转站 A
- 备用：中转站 B 或官方 API

**备用要求**：
- 已注册并充值 ¥10
- 配置已保存
- 每月测试 1 次

### 5. 怀疑泄露立即处理

**症状**：
- 账单出现大量未知消耗
- 凌晨 3 点有调用记录（你在睡觉）

**处理**：
1. 立即禁用该 Key
2. 生成新 Key
3. 更新 settings.json
4. 检查账单，保存证据
5. 联系服务商

## 费用说明

- **Claude Code 安装**：免费
- **配置时间**：15-20 分钟
- **测试费用**：约 ¥0.1-0.5（发送 10 条测试消息）

## 总结

Windows 配置 Claude Code 中转 API 的核心步骤：

1. **安装 Claude Code**：1 条 PowerShell 命令
2. **确认认证方式**：Bearer Token 或 API Key
3. **临时配置测试**：PowerShell 环境变量
4. **启动并验证**：/status 命令检查
5. **发送测试消息**：验证连接成功
6. **永久保存配置**：settings.json

**关键提醒**：
- 必须使用支持 Anthropic Messages API 的服务商
- 环境变量必须在启动前设置
- API Key 绝对不能泄露
- 小额测试，确认稳定后再大额充值

---

**测试环境**: Windows 10/11  
**测试日期**: 2026-08-14  
**Claude Code 版本**: 2.1.233

**参考文档**：
- [Claude Code 官方安装文档](https://code.claude.com/docs/en/setup)
- [Claude Code LLM Gateway 配置](https://code.claude.com/docs/en/llm-gateway-connect)

**相关阅读**：
- [Base URL/Model ID/Token 解释](/articles/base-url-model-id-token-explained)
- [401 错误排查](/articles/fix-api-401-error)
- [API 连接失败排查](/articles/beginner-api-troubleshooting)
