**直接答案**：只要服务商提供 **Base URL、API Key 和 Model ID**，就可以按照 OpenAI 兼容格式调用。初次测试建议先用命令行确认接口可用，再把同一组参数放进 Python 或 Node.js。本文不需要官方 OpenAI 账号，也不要求把密钥写进代码。

> 本文适用于标注“OpenAI 兼容”“兼容 Chat Completions”或提供 `/v1/chat/completions` 接口的服务。Anthropic 原生格式、Gemini 原生格式和只支持 Responses API 的接口，参数会有所不同，应以服务商文档为准。

## 开始前准备三项信息

先登录服务商控制台，找到以下内容：

| 信息 | 示例 | 注意事项 |
| --- | --- | --- |
| Base URL | `https://api.example.com/v1` | 使用服务商给出的真实地址，不要照抄示例域名 |
| API Key | `sk-...` | 只在自己的设备或服务器中使用 |
| Model ID | `gpt-4.1-mini` | 必须复制后台显示的完整标识，不能凭模型名称猜测 |

Base URL 通常以 `/v1` 结尾。使用 SDK 时只填写 Base URL，SDK 会自动追加 `/chat/completions`；使用 curl 时需要请求完整地址：

```text
Base URL: https://api.example.com/v1
完整地址: https://api.example.com/v1/chat/completions
```

部分平台提供的地址不含 `/v1`，或者使用自定义路径。此时不要自行添加，优先按照平台文档中的示例填写。还不清楚这三个参数时，先阅读 [Base URL、Model ID 和 Token 是什么](/articles/base-url-model-id-token-explained)。

## 第一步：把密钥保存到环境变量

环境变量可以避免把 API Key 直接写进代码。关闭当前终端后，下面的临时变量通常会失效，适合首次测试。

### Windows PowerShell

```powershell
$env:AI_API_KEY="替换为你的API Key"
$env:AI_BASE_URL="https://api.example.com/v1"
$env:AI_MODEL="替换为后台显示的Model ID"
```

### macOS 或 Linux

```bash
export AI_API_KEY="替换为你的API Key"
export AI_BASE_URL="https://api.example.com/v1"
export AI_MODEL="替换为后台显示的Model ID"
```

不要把真实密钥发到聊天群、截图、公开仓库或在线代码运行网站。测试完成后，可直接关闭终端清除临时变量。更多保护方法见 [API Key 安全指南](/articles/api-key-security-basics)。

## 方法一：用 curl 完成最小调用

curl 最适合排除 SDK 安装和代码环境的干扰。如果 curl 能成功，而程序不能成功，问题通常在 SDK 配置或代码中。

### macOS 或 Linux

```bash
curl "$AI_BASE_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AI_API_KEY" \
  -d '{
    "model": "'"$AI_MODEL"'",
    "messages": [
      {"role": "user", "content": "只回复：连接成功"}
    ],
    "temperature": 0.2
  }'
```

### Windows PowerShell

Windows PowerShell 对引号和换行的处理不同，用 `Invoke-RestMethod` 更稳定：

```powershell
$headers = @{
  "Authorization" = "Bearer $env:AI_API_KEY"
  "Content-Type"  = "application/json"
}

$body = @{
  model = $env:AI_MODEL
  messages = @(
    @{ role = "user"; content = "只回复：连接成功" }
  )
  temperature = 0.2
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "$env:AI_BASE_URL/chat/completions" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

成功时会返回一段 JSON。重点检查：

- `choices[0].message.content` 中出现模型回复；
- `model` 是本次实际调用的模型；
- `usage` 中可能包含输入、输出和总 Token 数；
- 服务商后台新增了一条用量记录，扣费与本次短请求相符。

并非所有兼容平台都会返回完全相同的 `usage` 字段。只要 HTTP 状态为 200 且 `choices` 中有内容，最小调用就已成功。

## 方法二：用 Python 调用

下面使用 OpenAI 官方 Python SDK，但把 `base_url` 指向你选择的服务商。

### 1. 安装 Python 和 SDK

确认已经安装 Python 3.9 或更高版本：

```bash
python --version
python -m pip install --upgrade openai
```

部分 Windows 电脑需要把 `python` 改成 `py`。

### 2. 创建测试文件

新建 `test_api.py`：

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["AI_API_KEY"],
    base_url=os.environ["AI_BASE_URL"],
)

response = client.chat.completions.create(
    model=os.environ["AI_MODEL"],
    messages=[
        {"role": "system", "content": "你是一个回答简洁的助手。"},
        {"role": "user", "content": "只回复：Python 连接成功"},
    ],
    temperature=0.2,
)

print(response.choices[0].message.content)
if response.usage:
    print("Token 用量：", response.usage.total_tokens)
```

### 3. 运行

```bash
python test_api.py
```

看到“Python 连接成功”说明配置正确。如果提示缺少环境变量，先在同一个终端窗口重新执行本文第一步，再运行程序。

## 方法三：用 Node.js 调用

下面的示例适合 Node.js 18 或更高版本。

### 1. 初始化项目并安装 SDK

```bash
mkdir api-test
cd api-test
npm init -y
npm install openai
```

### 2. 创建测试文件

新建 `test-api.mjs`：

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
});

const response = await client.chat.completions.create({
  model: process.env.AI_MODEL,
  messages: [
    { role: "system", content: "你是一个回答简洁的助手。" },
    { role: "user", content: "只回复：Node.js 连接成功" },
  ],
  temperature: 0.2,
});

console.log(response.choices[0].message.content);
if (response.usage) {
  console.log("Token 用量：", response.usage.total_tokens);
}
```

### 3. 运行

```bash
node test-api.mjs
```

如果服务商文档给出的是完整接口地址，不要把完整的 `/chat/completions` 地址填写到 `baseURL`，否则 SDK 可能重复拼接路径并返回 404。

## 三种方法应该选哪个

| 方法 | 适合人群 | 优点 | 局限 |
| --- | --- | --- | --- |
| curl / PowerShell | 首次验证、排查接口 | 环境最少，能看到原始返回 | 不适合大型程序 |
| Python | 数据处理、自动化、AI 应用入门 | 代码简洁，资料丰富 | 需要安装 Python 和依赖 |
| Node.js | 网站、机器人、JavaScript 项目 | 适合前后端项目 | API Key 只能放在服务端 |

如果你完全不想写代码，可以改用 [零代码 AI API 教程](/articles/first-api-call-no-code)。

## 常见报错和处理顺序

| 状态或现象 | 常见原因 | 优先检查 |
| --- | --- | --- |
| 401 Unauthorized | 密钥错误、失效或请求头格式不对 | 重新复制 Key，确认使用 `Bearer` |
| 403 Forbidden | 账号、地区、IP 或模型权限受限 | 查看账户状态和密钥权限 |
| 404 Not Found | Base URL 路径错误或重复 `/v1` | 对照文档检查完整请求地址 |
| model not found | Model ID 拼写错误或没有权限 | 从后台模型列表复制标识 |
| 429 Too Many Requests | 余额、额度、频率或并发受限 | 查看账单、限额和服务状态 |
| 500/502/503 | 服务商或上游暂时异常 | 等待后重试，必要时切换线路 |
| 请求超时 | 网络、模型生成慢或上下文过长 | 先用本文的短请求测试 |

排查时按下面的顺序进行，通常最快：

1. 用服务商后台确认余额和账号状态；
2. 重新复制 Base URL、API Key、Model ID；
3. 用 curl 或 PowerShell 发送本文的最小请求；
4. 查看完整 HTTP 状态码和响应正文；
5. 最小请求成功后，再回到 Python 或 Node.js；
6. 仍失败时，把时间、模型、状态码和请求 ID 提交给客服，不要提供完整密钥。

更完整的错误处理可参考 [API 连接失败排查指南](/articles/beginner-api-troubleshooting)。

## 上线前必须修改的三点

测试成功不等于可以直接上线。正式项目至少要补齐以下设置：

### 1. 不要在浏览器前端调用

网页里的 JavaScript、浏览器扩展和前端环境变量都可能被访问者查看。Node.js 示例只能运行在你控制的服务端，不要打包到公开网页中。

### 2. 设置超时和有限重试

遇到 429、502、503 等临时错误时，可以延迟后重试，但必须限制次数。不要无限循环，也不要对已经成功但客户端未收到响应的请求盲目重试，否则可能重复扣费。

### 3. 核对模型和账单

首次成功后立即到服务商后台确认：模型名称、输入输出 Token、扣费金额和调用时间是否一致。先用短提示、小额余额验证，再逐步增加上下文和调用频率。

## 最终检查清单

- [ ] Base URL 来自服务商文档，而不是搜索结果或他人截图；
- [ ] Model ID 从当前账户的模型列表复制；
- [ ] API Key 存在环境变量中，未写入代码；
- [ ] curl 或 PowerShell 最小请求返回 HTTP 200；
- [ ] Python 或 Node.js 能读取 `choices[0].message.content`；
- [ ] 后台账单与本次调用一致；
- [ ] 正式应用在服务端调用，并设置额度、超时和有限重试；
- [ ] 已准备密钥撤销方法和备用线路。

完成这份清单后，你已经走通了从接口验证到程序调用的最小闭环。下一步可以学习 [AI API 计费规则](/articles/api-pricing-token-billing-basics)，再根据真实任务逐步增加上下文、流式输出和工具调用，不要一开始就把所有高级功能同时加入测试。

---

**核验日期**：2026年8月26日

**适用范围**：OpenAI 兼容的 Chat Completions 接口

**测试建议**：始终先使用短提示和小额余额验证，具体路径与模型能力以服务商当前文档为准。
