# 如何让 AI API 稳定返回 JSON：结构化输出、Schema 与解析失败处理（2026）

**直接结论**：不要只在提示词里写“请返回 JSON”。更可靠的做法是同时约束三层：请求参数启用结构化输出（服务商支持时）、提示词明确字段和类型、客户端对响应做严格校验和容错。这样即使模型、线路或版本发生变化，也不会因为多一句解释文字就让程序崩溃。

---

## 1. 为什么“看起来像 JSON”仍然不够

模型返回的内容可能包含 Markdown 代码围栏、前后说明、缺少引号、字段类型不一致，或者在流式输出中只收到半段 JSON。下面这些内容对人类可读，但不能直接交给 `JSON.parse()`：

```text
当然可以，结果如下：
```json
{"priority": "high", "score": 8}
```
```

另外，`score` 有时会被返回成字符串 `"8"`，`items` 也可能从数组变成单个对象。真正稳定的接口需要把“格式正确”和“业务字段正确”分开验证。

## 2. 先确认服务商支持哪种结构化能力

不同 OpenAI 兼容服务商支持的参数并不完全一致，常见能力有：

- **JSON mode**：只保证输出是合法 JSON，不一定保证字段齐全。
- **JSON Schema / Structured Outputs**：按你提供的 Schema 约束对象结构，可靠性更高。
- **仅提示词约束**：兼容性最好，但必须在客户端自行校验。

先查服务商文档和实际响应，不要因为接口“兼容 OpenAI”就默认所有参数都可用。遇到 `400 invalid parameter` 时，删除不支持的结构化参数，退回提示词 + 客户端校验方案。

## 3. 请求设计：给出最小、明确的 Schema

以“给工单分类”为例，目标结构是：

```json
{
  "category": "billing",
  "priority": "high",
  "confidence": 0.92,
  "needs_human": false
}
```

Schema 设计建议：

1. 字段名使用稳定的英文标识，展示文字在客户端翻译。
2. 枚举值写死在 `enum` 中，避免出现同义词。
3. 数字、布尔值、数组等类型明确区分。
4. 只保留业务真正需要的字段，Schema 越小越容易稳定。
5. 明确是否允许额外字段；需要严格解析时设置为不允许。

提示词可以这样写：

```text
你是工单分类器。只输出一个 JSON 对象，不要 Markdown、解释、前缀或后缀。
category 只能是 billing、technical、account 之一；
priority 只能是 low、normal、high 之一；
confidence 是 0 到 1 的数字；needs_human 必须是布尔值。
```

提示词不是校验器，它的作用是减少错误；最终是否接受结果仍由程序决定。

## 4. Python：请求、解析与字段校验

下面的示例使用 OpenAI 兼容客户端。`BASE_URL`、模型名和密钥请替换成服务商控制台提供的值。

```python
import json
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["AI_API_KEY"],
    base_url=os.environ["AI_BASE_URL"],
)

response = client.chat.completions.create(
    model=os.environ["AI_MODEL"],
    temperature=0,
    messages=[
        {"role": "system", "content": (
            "只输出 JSON 对象。category 只能是 billing、technical、account；"
            "priority 只能是 low、normal、high；confidence 为 0 到 1 的数字；"
            "needs_human 必须是布尔值。"
        )},
        {"role": "user", "content": "用户无法充值，页面提示支付失败。"},
    ],
    # 只有服务商明确支持时才保留这一项
    response_format={"type": "json_object"},
)

raw = response.choices[0].message.content or ""
try:
    data = json.loads(raw)
except json.JSONDecodeError as exc:
    raise RuntimeError(f"模型返回的不是合法 JSON: {raw[:200]}") from exc

allowed_categories = {"billing", "technical", "account"}
allowed_priorities = {"low", "normal", "high"}
if (
    not isinstance(data, dict)
    or data.get("category") not in allowed_categories
    or data.get("priority") not in allowed_priorities
    or not isinstance(data.get("confidence"), (int, float))
    or not 0 <= data["confidence"] <= 1
    or not isinstance(data.get("needs_human"), bool)
):
    raise RuntimeError(f"JSON 字段不符合约定: {data}")
```

生产项目可以使用 Pydantic、JSON Schema 等成熟校验库；不要用正则表达式验证嵌套 JSON。

## 5. Node.js：避免把“清洗字符串”当成解析方案

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
});

const completion = await client.chat.completions.create({
  model: process.env.AI_MODEL,
  temperature: 0,
  messages: [
    { role: "system", content: "只输出 JSON，不要 Markdown 或解释。" },
    { role: "user", content: "把这条反馈分类：无法充值，支付失败。" },
  ],
  response_format: { type: "json_object" },
});

const raw = completion.choices?.[0]?.message?.content ?? "";
let result;
try {
  result = JSON.parse(raw);
} catch {
  throw new Error(`响应不是合法 JSON: ${raw.slice(0, 200)}`);
}

if (typeof result.category !== "string" || typeof result.needs_human !== "boolean") {
  throw new Error("响应缺少必需字段或字段类型错误");
}
```

不要直接用 `replace("```json", "")` 处理所有响应。它无法处理截断、嵌套字符串中的反引号和字段类型错误。若确实要兼容旧模型，可以先记录原始响应，再做有限的代码围栏剥离，最后仍必须执行 JSON 解析和 Schema 校验。

## 6. 解析失败时怎样重试

重试应该针对可恢复错误，而不是无条件重复请求：

1. 记录请求 ID、模型、状态码和响应前 200 个字符，注意脱敏，不要记录 API Key。
2. 如果是网络超时或 5xx，使用指数退避，例如 1 秒、2 秒、4 秒，并设置最大次数。
3. 如果 HTTP 200 但 JSON 无效，可以把错误类型和原始片段作为一次修复提示发回模型，最多重试 1 次。
4. 如果是 400 参数不支持，移除不兼容的 `response_format`，不要重复发送同一个请求。
5. 连续失败后进入人工队列或返回明确的业务错误，不要把半截 JSON 写入数据库。

## 7. 流式输出要在结束后再解析

流式响应每个事件都可能只是 JSON 的一部分。正确流程是：先拼接所有文本，确认收到结束事件，再一次性 `JSON.parse()`；如果业务必须边收边展示，应把“展示文本”和“最终结构化结果”分成两个通道。流式中断的排查方法可参考[AI API 流式输出中断怎么办](/articles/debug-ai-api-streaming-sse)。

## 8. 上线前检查清单

- [ ] 服务商文档确认了 `response_format` 或 Schema 参数
- [ ] 用至少 20 条正常、边界和空输入做解析测试
- [ ] 校验了必需字段、枚举值和数据类型
- [ ] 对超时、429、5xx 和无效 JSON 分别设置了处理方式
- [ ] 日志包含 request ID，但不包含密钥和完整敏感提示词
- [ ] 失败不会把不完整结果写入业务数据库
- [ ] 更换模型或中转线路后重新跑一遍回归测试

**总结**：结构化输出参数负责“尽量约束”，Schema 校验负责“判断是否接受”，重试和降级负责“保证业务不中断”。三层同时做，才是真正可维护的 JSON API 集成。

相关教程：

- [OpenAI 兼容 API 调用教程：curl、Python、Node.js 三种方法](/articles/openai-compatible-api-curl-python-nodejs)
- [API 调用失败怎么办？5 步排查法快速定位问题](/articles/api-call-failed-troubleshooting)
- [AI API 流式输出中断怎么办？SSE 调试与重试完整指南](/articles/debug-ai-api-streaming-sse)

**更新日期：**2026-09-07
