# Claude Code 如何配置中转 API？Windows 零基础完整教程

Claude Code 支持通过自定义 Base URL 连接兼容 Anthropic Messages API 的中转服务。Windows 用户只需要安装 Claude Code，然后配置中转站提供的 API 地址和密钥，不需要自己编程。

需要注意：并不是所有 AI API 中转站都能用于 Claude Code。服务商必须明确支持 **Claude Code** 或 **Anthropic Messages API**。只有 OpenAI 兼容接口、只能调用 `/v1/chat/completions` 的服务，通常不能直接使用本教程。

> 待补截图：中转站后台显示 Claude Code、Anthropic API 地址和 API Key 的页面。截图时必须遮住完整密钥。

## 开始前需要准备什么

开始配置前，请准备：

- 一台 Windows 10 或 Windows 11 电脑
- 一个可以正常使用的 Claude Code 中转服务
- 中转站提供的 Base URL
- 中转站提供的 API Key 或 Token
- 中转账户内有少量可用余额

Base URL 通常类似：

```text
https://api.example.com
```

不要直接照抄这个示例。每家服务商的地址不同，必须使用中转站后台或使用文档提供的地址。

如果还不理解 Base URL 和 API Key，可以先阅读：[Base URL、模型名称、Token 分别是什么？](/articles/base-url-model-id-token-explained)

## 第一步：在 Windows 安装 Claude Code

点击 Windows 开始菜单，搜索“PowerShell”，然后打开 Windows PowerShell。

![从 Windows 开始菜单搜索并打开 PowerShell](/images/articles/claude-code-relay-api/04-open-powershell.png)

在 PowerShell 中粘贴下面的官方安装命令，然后按回车：

```powershell
irm https://claude.ai/install.ps1 | iex
```

等待安装完成后，输入：

```powershell
claude --version
```

如果画面中出现 Claude Code 的版本号，说明安装成功。

![Windows PowerShell 安装 Claude Code 并检查版本](/images/articles/claude-code-relay-api/01-install-and-version.png)

如果提示找不到 `claude` 命令，可以关闭 PowerShell，重新打开后再试一次。

## 第二步：确认中转站使用哪种密钥

Claude Code 支持两种常见的认证方式：

- 服务商说明使用“Bearer Token”或“Authorization”，配置 `ANTHROPIC_AUTH_TOKEN`
- 服务商说明使用“API Key”或“x-api-key”，配置 `ANTHROPIC_API_KEY`

如果服务商没有明确说明，可以先尝试 `ANTHROPIC_AUTH_TOKEN`。出现 401 错误时，再向服务商确认认证方式。

## 第三步：临时配置 API 地址和密钥

下面先使用临时配置进行测试。关闭当前 PowerShell 窗口后，临时配置会自动失效，更适合第一次尝试。

如果服务商使用 Bearer Token，在 PowerShell 中依次输入：

```powershell
$env:ANTHROPIC_BASE_URL = "填写服务商提供的API地址"
$env:ANTHROPIC_AUTH_TOKEN = "填写你的API密钥"
```

如果服务商明确要求使用 `x-api-key`，第二行改成：

```powershell
$env:ANTHROPIC_API_KEY = "填写你的API密钥"
```

引号需要保留，只替换引号里面的内容。

![在 PowerShell 中临时配置 Claude Code API 地址和密钥](/images/articles/claude-code-relay-api/02-configure-api-variables.png)

Base URL 一般不要直接填写完整的 `/v1/messages` 请求地址，除非服务商文档明确要求这样配置。

## 第四步：启动 Claude Code

保持当前 PowerShell 窗口不要关闭，输入：

```powershell
claude
```

首次启动可能会出现权限确认或 API Key 使用确认，按照页面提示继续。

进入 Claude Code 后，输入：

```text
/status
```

在状态页面检查：

- `Anthropic base URL` 是否显示中转站地址
- `Auth token` 或 `API key` 是否显示已经启用
- 是否仍然使用以前保存的 Claude.ai 登录

![Claude Code status 页面检查 Base URL 和认证方式示意图](/images/articles/claude-code-relay-api/05-claude-code-status-example.png)

上图为示意界面，Claude Code 的页面布局和字段名称可能随版本更新。你需要重点确认 Base URL 和认证变量是否与服务商说明一致。

如果状态页面没有显示自定义 Base URL，通常是因为 Claude Code 没有从刚才配置的 PowerShell 窗口启动。请退出 Claude Code，在同一个 PowerShell 窗口重新运行 `claude`。

## 第五步：发送第一条测试消息

退出状态页面后，可以输入一条简单指令：

```text
请只回复：连接测试成功
```

能够正常返回内容，说明 API 地址、密钥和 Claude Code 已经连接成功。

![Claude Code 返回连接测试成功的示意图](/images/articles/claude-code-relay-api/06-connection-test-example.png)

接下来可以打开一个测试文件夹，让 Claude Code 执行：

```text
请查看当前文件夹，但不要修改任何文件。告诉我这里有哪些文件。
```

这样可以同时确认 Claude Code 的对话和文件读取功能是否正常。

## 第六步：把配置永久保存

临时测试成功后，可以把配置写入 Claude Code 的用户设置文件。Windows 用户的文件位置是：

```text
%USERPROFILE%\.claude\settings.json
```

打开文件资源管理器，在地址栏输入 `%USERPROFILE%\.claude`。如果没有 `.claude` 文件夹，可以手动创建，然后使用记事本创建 `settings.json` 文件。

Bearer Token 用户填写：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "填写服务商提供的API地址",
    "ANTHROPIC_AUTH_TOKEN": "填写你的API密钥"
  }
}
```

要求使用 `x-api-key` 的用户，把 `ANTHROPIC_AUTH_TOKEN` 改成 `ANTHROPIC_API_KEY`。

![在 settings.json 中永久保存 Claude Code API 配置](/images/articles/claude-code-relay-api/03-settings-json.png)

保存后重新打开 PowerShell 并运行 `claude`，再通过 `/status` 检查配置。

不要把密钥保存在项目里的 `.claude/settings.json`，因为项目文件可能被上传到 GitHub。个人密钥应保存在 `%USERPROFILE%\.claude\settings.json`。

## 常见错误及解决方法

### 出现 401 或认证失败

常见原因包括 API Key 填写错误、密钥过期，或者把 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_API_KEY` 用反了。

可以参考：[AI API 返回 401 或 403 怎么办？](/articles/fix-api-401-error)

### 出现 404 或接口不存在

首先检查 Base URL 是否填写正确，不要擅自在地址后面增加 `/v1/messages` 或 `/chat/completions`。如果地址确认无误仍然返回 404，需要询问服务商是否支持 Anthropic Messages API。

### 出现 429 或余额不足

429 通常表示调用频率过高、账户额度不足或者服务商设置了并发限制。请检查账户余额，并等待一段时间后重试。

详细处理方法可以参考：[AI API 返回 429 是什么原因？](/articles/fix-api-429-error)

### Claude Code 一直要求登录

这通常说明 API Key 没有在 Claude Code 启动前生效。请关闭 Claude Code，在设置过环境变量的同一个 PowerShell 窗口运行 `claude`，也可以把配置写入用户目录下的 `settings.json`。

### 模型列表中没有想用的模型

模型名称和映射方式由中转站决定。不要自行猜测模型 ID，应查看服务商的 Claude Code 使用说明。

部分中转站虽然可以调用 Claude 模型，但没有完整支持 Claude Code 的工具调用、流式输出或长上下文功能。购买较大金额前，建议先小额测试。

## 安全提醒

API Key 相当于账户密码。不要把完整密钥发布到文章截图、聊天群、网盘或 GitHub。

建议第一次只充值少量金额，并测试普通对话、文件读取、工具调用、连续使用稳定性以及后台用量记录。如果怀疑密钥已经泄露，应立即删除旧密钥并创建新密钥。

## 总结

Windows 配置 Claude Code 中转 API 的核心只有三个步骤：安装 Claude Code、设置 `ANTHROPIC_BASE_URL` 和正确的密钥变量、使用 `/status` 和测试消息确认连接。

配置成功不代表中转服务一定稳定。正式使用前，还应检查模型真实性、响应速度、计费记录和退款政策。可以前往[中转站排行榜](/providers)查看本站已经整理的服务商信息。

测试环境：Windows 10/11  
最后核验：2026 年 8 月 14 日  
参考资料：[Claude Code 官方安装文档](https://code.claude.com/docs/en/setup)、[Claude Code LLM Gateway 配置文档](https://code.claude.com/docs/en/llm-gateway-connect)
