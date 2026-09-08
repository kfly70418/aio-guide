# AI API Function Calling 工具调用教程：Schema、执行循环与安全校验（2026）

**直接结论**：Function Calling 不是让模型直接执行函数，而是让模型输出“要调用哪个工具以及参数是什么”。真正的执行必须由你的服务端完成，再把结果返回给模型。稳定实现需要四步：定义小而明确的工具 Schema → 校验模型参数 → 服务端执行并限制权限 → 将工具结果放回对话继续生成。

## 1. 一次工具调用到底发生了什么

典型流程如下：

1. 客户端把用户问题和可用工具定义发送给模型。
2. 模型判断是否需要工具，并返回工具名和 JSON 参数。
3. 你的服务端检查工具名、参数类型、用户权限和请求范围。
4. 服务端执行真实操作，例如查询天气、读取订单或搜索内部资料。
5. 将执行结果作为 `tool` 消息传回模型，由模型生成给用户看的最终答案。

模型只负责提出调用建议，不能因为它输出了一个函数名就自动获得数据库、文件系统或支付接口权限。

## 2. 工具 Schema 要小、严格、可验证

下面是一个查询天气工具定义。字段描述要告诉模型“什么时候使用”和“不能传什么”，但不要把整套业务规则都塞进提示词。

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "查询指定城市当前天气。只用于用户明确询问天气的场景。",
    "parameters": {
      "type": "object",
      "properties": {
        "city": { "type": "string", "description": "城市名称，例如 Shanghai" },
        "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] }
      },
      "required": ["city"],
      "additionalProperties": false
    }
  }
}
```

建议：

- 工具名使用稳定的英文标识，避免同义名称造成选择混乱。
- 必填字段写入 `required`，枚举值写入 `enum`。
- 只暴露当前对话真正需要的工具，工具过多会增加误调用概率。
- 不要把 API Key、内部表名或管理员接口放进 Schema 描述。

## 3. OpenAI 兼容 API 的 Python 示例

不同中转服务对 `tools` 和 `tool_choice` 的支持程度可能不同，先以服务商文档为准。下面示例展示完整的单轮执行循环：

```python
import json
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["AI_API_KEY"],
    base_url=os.environ["AI_BASE_URL"],
)

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "查询城市当前天气",
        "parameters": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"],
            "additionalProperties": False,
        },
    },
}]

messages = [
    {"role": "system", "content": "需要实时天气时调用工具，不要猜测天气。"},
    {"role": "user", "content": "上海现在天气怎么样？"},
]

first = client.chat.completions.create(
    model=os.environ["AI_MODEL"],
    messages=messages,
    tools=tools,
    tool_choice="auto",
    temperature=0,
)
assistant = first.choices[0].message
messages.append(assistant.model_dump(exclude_none=True))

for call in assistant.tool_calls or []:
    if call.function.name != "get_weather":
        raise ValueError("未知工具")
    arguments = json.loads(call.function.arguments)
    city = arguments.get("city")
    if not isinstance(city, str) or not city.strip() or len(city) > 50:
        raise ValueError("city 参数不合法")

    # 这里调用你自己的天气服务；不要把模型传入的字符串直接拼接 SQL 或命令。
    weather = {"city": city, "temperature": 24, "condition": "cloudy"}
    messages.append({
        "role": "tool",
        "tool_call_id": call.id,
        "content": json.dumps(weather, ensure_ascii=False),
    })

final = client.chat.completions.create(
    model=os.environ["AI_MODEL"],
    messages=messages,
    temperature=0,
)
print(final.choices[0].message.content)
```

示例中的天气值只是流程演示，生产环境应替换为你自己的可信数据源。注意 `tool_call_id` 必须与模型返回的调用 ID 一一对应，否则很多兼容接口会拒绝后续请求。

## 4. Node.js 示例与多工具循环

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
});

const tools = [{
  type: "function",
  function: {
    name: "get_weather",
    description: "查询城市当前天气",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
      additionalProperties: false,
    },
  },
}];

const messages = [
  { role: "system", content: "需要实时天气时调用工具，不要猜测。" },
  { role: "user", content: "上海现在天气怎么样？" },
];

for (let round = 0; round < 3; round += 1) {
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL,
    messages,
    tools,
    tool_choice: "auto",
    temperature: 0,
  });
  const message = response.choices?.[0]?.message;
  if (!message) throw new Error("模型没有返回消息");
  messages.push(message);

  if (!message.tool_calls?.length) {
    console.log(message.content ?? "");
    break;
  }

  for (const call of message.tool_calls) {
    if (call.function.name !== "get_weather") throw new Error("未知工具");
    const args = JSON.parse(call.function.arguments);
    if (typeof args.city !== "string" || args.city.length > 50) {
      throw new Error("city 参数不合法");
    }
    const result = { city: args.city, temperature: 24, condition: "cloudy" };
    messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: JSON.stringify(result),
    });
  }
}
```

必须设置最大循环次数。没有上限的 Agent 可能不断调用工具，造成费用增长或重复写入。多个工具调用可以并行执行，但涉及账户、订单、删除等有副作用的操作时应改为串行，并在执行前要求用户确认。

## 5. 四层安全边界

### 参数校验

先解析 JSON，再校验类型、长度、枚举和范围。即使 Schema 写了 `additionalProperties: false`，服务端也要再次检查，因为部分兼容接口不会真正执行 Schema 约束。

### 权限校验

工具执行函数必须接收当前登录用户的身份，在服务端重新查询权限。不要相信模型传来的 `user_id`、角色或账户编号。

### 操作范围

为搜索、分页、时间区间设置上限；为循环和单次请求设置超时。读操作和写操作分开注册，删除、退款、发消息等高风险动作默认不自动执行。

### 日志与脱敏

记录工具名、耗时、成功/失败和 request ID，避免记录 API Key、完整用户输入和敏感工具参数。发生错误时，返回用户友好的失败信息，不要把内部堆栈发送给模型。

## 6. 常见报错排查

- **`tools is not supported`**：当前模型或中转线路没有工具调用能力，换支持该功能的模型，或退回普通 JSON 输出。
- **`tool_call_id` 不匹配**：工具结果没有使用模型返回的原始调用 ID，或消息顺序被改动。
- **参数 JSON 解析失败**：记录原始参数片段，降低工具 Schema 复杂度，并在客户端增加重试或人工兜底。
- **模型一直不调用工具**：检查 `description` 是否明确、`tool_choice` 是否被设为 `none`，并确认该问题确实需要实时数据。
- **循环次数过多**：设置最大轮数，给工具结果返回明确的终止信息，并为每次调用设置预算。

如果同时遇到 429、超时或流式中断，应按对应的[错误排查教程](/articles/api-call-failed-troubleshooting)、[限流处理教程](/articles/fix-api-429-error)和[SSE 调试教程](/articles/debug-ai-api-streaming-sse)分别处理，不要把所有错误都归咎于工具调用。

## 7. 上线前检查清单

- [ ] 已确认模型和服务商支持 `tools`
- [ ] 每个工具都有必填字段、枚举和长度限制
- [ ] 服务端重新执行用户权限校验
- [ ] 工具循环有最大轮数、超时和费用上限
- [ ] 写入、删除、退款等有副作用的操作需要确认
- [ ] `tool_call_id`、消息顺序和异常分支都有测试
- [ ] 日志已脱敏，失败时不会泄露内部错误
- [ ] 准备了不支持工具调用时的普通 JSON 或人工处理降级方案

**总结**：Function Calling 的核心不是“让模型执行代码”，而是建立一个受控的工具协议。模型提出调用，服务端验证并执行，结果再回到模型。把权限、预算和循环上限放在服务端，才能在中转 API 和不同模型之间稳定运行。

相关教程：

- [如何让 AI API 稳定返回 JSON：结构化输出、Schema 与解析失败处理](/articles/stable-json-output-ai-api)
- [OpenAI 兼容 API 调用教程：curl、Python、Node.js 三种方法](/articles/openai-compatible-api-curl-python-nodejs)
- [AI API 请求超时怎么办？](/articles/fix-api-timeout)

**更新日期：**2026-09-08
