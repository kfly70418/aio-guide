---
seo_title: AI API 返回 429 错误怎么办？限流排查和重试策略（2026）
seo_description: 429 不一定是余额不足。本文区分 RPM/TPM/并发/配额/上游拥堵五类限流，提供指数退避重试代码、并发控制方案、备用线路切换策略。
slug: fix-api-429-error
category: faq
tags: ["429错误","限流","配额","重试策略"]
---

## 429 表示什么

**HTTP 429 Too Many Requests** 表示当前请求**超过了某种限制**，但具体是哪种限制，需要结合错误信息判断。

**常见限制类型**：
1. **RPM（Requests Per Minute）**：每分钟请求次数
2. **TPM（Tokens Per Minute）**：每分钟 Token 用量
3. **并发限制**：同时进行的请求数
4. **账户配额**：账户等级或套餐的总额度
5. **上游容量**：模型服务器繁忙或线路拥堵

> ⚠️ **重要**：429 **不一定**是余额不足。部分平台会用 429 表示套餐配额用完，但多数情况是请求速度过快。

---

## 快速判断是哪一类

### 症状 1：偶尔一条短请求也立即失败

**可能原因**：
- 余额不足或欠费
- 套餐配额已用完（如"月卡 100 万 Token"已耗尽）
- 密钥被设置了每日额度上限

**检查方法**：
1. 登录控制台 → 查看余额或套餐剩余量
2. 检查密钥设置 → 是否有"每日 ¥10 上限"
3. 查看账单明细 → 今日是否已超过预设限额

**解决方法**：
- 充值或等待套餐刷新（通常每月 1 日）
- 调整密钥额度上限
- 升级账户套餐

---

### 症状 2：手动聊天正常，批量程序失败

**可能原因**：
- RPM 超限（每分钟请求次数过多）
- 并发超限（同时发送多个请求）

**检查方法**：
1. 查看控制台 → Rate Limits 或 Usage Limits 页面
2. 记录当前限制（如 RPM: 60, TPM: 90,000, 并发: 3）
3. 估算程序的实际请求速度

**示例**：
- 程序每秒发送 2 个请求 → 每分钟 120 次 → 超过 RPM 60 限制
- 程序用 `Promise.all()` 同时发送 10 个请求 → 超过并发 3 限制

**解决方法**：
- 降低请求频率（每次请求后等待 1-2 秒）
- 限制并发数量（改用队列逐个处理）

---

### 症状 3：晚间集中出现，过一会自动恢复

**可能原因**：
- 上游模型服务器繁忙（高峰时段）
- 中转站线路拥堵

**检查方法**：
1. 查看平台状态页或公告（是否有"服务降级"提示）
2. 测试时间规律（是否固定在晚上 20:00-23:00）
3. 更换模型测试（如从 GPT-4 改为 GPT-3.5）

**解决方法**：
- 等待 5-10 分钟后自动恢复
- 切换到低负载模型（如 Haiku 代替 Opus）
- 更换中转站或使用备用线路

---

### 症状 4：长文本请求失败，短文本正常

**可能原因**：
- TPM 超限（每分钟 Token 用量过多）

**检查方法**：
1. 查看控制台 → TPM 限制（如 90,000）
2. 估算单次请求的 Token 量（输入 + 输出）
3. 计算：单次 Token × 每分钟请求次数 = 总 TPM

**示例**：
- 单次请求：输入 3000 Token + 输出 2000 Token = 5000 Token
- 每分钟发送 20 次 → 总 TPM = 100,000 → 超限

**解决方法**：
- 缩短输入文本（删除不必要的上下文）
- 限制最大输出长度（`max_tokens: 500`）
- 降低请求频率

---

## 常见错误信息对照表

| 错误信息 | 含义 | 立即检查 |
|---------|------|---------|
| `Rate limit exceeded` | 请求速度过快 | RPM/TPM 限制 |
| `Insufficient quota` | 配额不足 | 余额或套餐剩余量 |
| `Concurrent requests exceeded` | 并发过高 | 同时进行的请求数 |
| `Daily limit reached` | 每日额度用完 | 密钥设置中的每日上限 |
| `Model is currently overloaded` | 上游服务器繁忙 | 更换模型或等待恢复 |
| `You exceeded your current quota` | 账户配额用完 | OpenAI 账户等级限制 |

---

## 正确的重试策略

### ❌ 错误做法：固定间隔重试

```javascript
// 错误示例：每秒重试一次
async function badRetry() {
  for (let i = 0; i < 100; i++) {
    try {
      return await callAPI();
    } catch (error) {
      if (error.status === 429) {
        await sleep(1000); // 固定等待 1 秒
      }
    }
  }
}
```

**问题**：
- 所有请求在同一时刻恢复，形成新的拥堵
- 未根据错误信息调整等待时间
- 无限重试可能导致死循环

---

### ✅ 正确做法：指数退避 + 随机抖动

```javascript
async function smartRetry(fn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        // 检查响应头中的重试时间
        const retryAfter = error.headers?.['retry-after'];
        
        if (retryAfter) {
          // 平台明确告知等待时间
          const waitTime = parseInt(retryAfter) * 1000;
          console.log(`Rate limited. Waiting ${retryAfter}s...`);
          await sleep(waitTime);
        } else {
          // 指数退避：1s, 2s, 4s, 8s, 16s
          const baseDelay = 1000 * Math.pow(2, attempt);
          // 加入随机抖动（±25%）
          const jitter = baseDelay * (0.75 + Math.random() * 0.5);
          console.log(`Rate limited. Retrying in ${Math.round(jitter/1000)}s...`);
          await sleep(jitter);
        }
      } else {
        throw error; // 非 429 错误直接抛出
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 使用示例
const result = await smartRetry(() => callAPI());
```

**优点**：
- 等待时间逐步增加，避免立即重试
- 随机抖动避免多个请求同时恢复
- 检查 `Retry-After` 头部（部分平台提供）
- 设置最大重试次数，避免死循环

---

## 降低请求压力

### 1. 控制并发数量

**❌ 错误做法**：
```javascript
// 一次性发送 100 个请求
const results = await Promise.all(
  items.map(item => callAPI(item))
);
```

**✅ 正确做法**：
```javascript
// 限制并发为 3
async function batchProcess(items, concurrency = 3) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => smartRetry(() => callAPI(item)))
    );
    results.push(...batchResults);
    
    // 批次之间等待 2 秒
    if (i + concurrency < items.length) {
      await sleep(2000);
    }
  }
  return results;
}
```

---

### 2. 合并小请求

**场景**：需要分析 100 个短句子。

**❌ 低效做法**：
```javascript
// 发送 100 次请求，每次 1 个句子
for (const sentence of sentences) {
  await callAPI(`Analyze: ${sentence}`);
}
```

**✅ 高效做法**：
```javascript
// 每次发送 10 个句子
const batches = chunk(sentences, 10);
for (const batch of batches) {
  const prompt = `Analyze these sentences:\n${batch.join('\n')}`;
  await callAPI(prompt);
  await sleep(2000); // 批次之间等待
}
```

---

### 3. 缩短上下文

**问题**：每次请求都发送完整的 5 轮对话历史。

**优化**：
```javascript
// 只保留最近 3 轮对话
function trimContext(messages, maxTurns = 3) {
  const systemMsg = messages.find(m => m.role === 'system');
  const recent = messages.slice(-maxTurns * 2); // 3 轮 = 6 条消息
  return systemMsg ? [systemMsg, ...recent] : recent;
}

const trimmed = trimContext(conversationHistory);
await callAPI({ messages: trimmed });
```

---

### 4. 限制输出长度

```javascript
// 限制最大输出为 500 Token
await callAPI({
  model: "gpt-4",
  messages: [...],
  max_tokens: 500  // 防止意外生成长文本
});
```

---

## 查看平台限制规则

### OpenAI 官方

登录 `platform.openai.com` → Settings → Limits

| 账户等级 | RPM | TPM | 并发 |
|---------|-----|-----|------|
| Free Tier | 3 | 40,000 | 1 |
| Tier 1 (充值 $5) | 500 | 200,000 | 10 |
| Tier 2 (消费 $50) | 5,000 | 2,000,000 | 50 |

**查看方法**：
- 点击右上角账户 → View usage tiers
- 页面显示当前等级和限制

---

### Anthropic 官方

Claude API 的限制通常更宽松：

| 账户类型 | RPM | TPM | 并发 |
|---------|-----|-----|------|
| Free Tier | 50 | 200,000 | 5 |
| Paid Tier | 4,000 | 4,000,000 | 100 |

**查看方法**：
- 登录 `console.anthropic.com`
- Settings → Rate Limits

---

### 中转站

**问题**：多数中转站**不公开限制规则**。

**排查方法**：
1. 查看文档或 FAQ（如果有）
2. 咨询客服（工单或社群）
3. 实测摸底：
   - 用脚本每秒发送 1 次请求，记录何时触发 429
   - 用 `Promise.all()` 发送 10 个并发，看是否失败

**常见中转站限制**（非官方，仅供参考）：
- RPM: 30-60
- 并发: 3-5
- 无 TPM 限制（按实际用量计费）

---

## 是否应该升级额度

### 先排除程序问题

在申请提高限制前，确认：

- [ ] 程序没有死循环（如错误处理逻辑导致无限重试）
- [ ] 没有重复提交相同请求
- [ ] 并发控制已正确实现
- [ ] 上下文长度已优化

**检查方法**：
1. 查看控制台账单 → 今日用量是否异常暴涨
2. 查看日志 → 是否有相同的请求 ID 重复出现
3. 监控程序 → CPU/内存是否正常

---

### 何时需要升级

**场景 1：正常业务增长**
- 每天处理 5000+ 条客服消息
- 需要批量分析大量文档
- 多个用户同时使用

**操作**：
- OpenAI: 累计消费到更高 Tier（自动升级）
- Anthropic: 联系客服申请提高限制
- 中转站: 购买更高套餐或申请 VIP 额度

---

### 何时不需要升级

**场景 2：上游容量问题**

错误信息：
```
429: Model is currently overloaded. Please try again later.
```

**原因**：即使你的账户额度足够，但上游模型服务器繁忙时仍会返回 429。

**解决方法**：
- 更换模型（如 GPT-4 → GPT-3.5）
- 更换时段（避开晚间高峰）
- 更换线路（如从官方切到中转站，或反向）
- 准备备用服务商

---

## 备用线路切换方案

### 单一线路的风险

如果只有一个服务商，当出现 429 时：
- 无法确定是自己的问题还是平台问题
- 被迫等待恢复，影响业务

### 推荐方案：主备双线

**配置**：
```javascript
const providers = [
  {
    name: 'Primary',
    baseURL: 'https://api.primary.com/v1',
    apiKey: 'sk-primary-xxx',
    priority: 1
  },
  {
    name: 'Backup',
    baseURL: 'https://api.backup.com/v1',
    apiKey: 'sk-backup-xxx',
    priority: 2
  }
];

async function callWithFallback(prompt) {
  for (const provider of providers) {
    try {
      return await callAPI({
        baseURL: provider.baseURL,
        apiKey: provider.apiKey,
        prompt
      });
    } catch (error) {
      if (error.status === 429) {
        console.log(`${provider.name} rate limited, trying next...`);
        continue; // 尝试下一个
      } else {
        throw error; // 非 429 错误直接抛出
      }
    }
  }
  throw new Error('All providers failed');
}
```

---

## 给客服的信息

### 应该提供的信息 ✅

- **发生时间**：2026-08-15 14:30-14:35 UTC+8（明确时间段）
- **模型名称**：gpt-4-turbo、claude-3-opus-20240229
- **请求频率**：每分钟约 50 次（或"每秒 1 次"）
- **并发量**：同时进行 5 个请求
- **错误全文**：`429: Rate limit exceeded for requests`
- **请求 ID**：`req-abc123`（如果响应头中有）
- **密钥末四位**：`...aB3d`

### 不要提供的信息 ❌

- ❌ 完整 API Key
- ❌ 账户密码

### 询问的问题

1. 当前账户的 RPM/TPM/并发限制分别是多少？
2. 是否可以申请提高限制？需要什么条件？
3. 错误是由于账户限制还是上游容量问题？
4. 有没有推荐的请求速度和并发设置？

---

## 监控和预警

### 记录 429 频率

```javascript
let rateLimitCount = 0;

async function monitoredCall() {
  try {
    return await callAPI();
  } catch (error) {
    if (error.status === 429) {
      rateLimitCount++;
      console.warn(`Rate limited ${rateLimitCount} times today`);
      
      // 当天触发 10 次 429，发送预警
      if (rateLimitCount >= 10) {
        sendAlert('Frequent rate limiting detected');
      }
    }
    throw error;
  }
}
```

### 查看账单异常

每天或每周检查：
- 用量是否突然暴涨（可能是程序 bug）
- 某个时段的请求是否集中（触发限流的高峰期）

---

## 关键自动化任务的准备

如果你的业务**强依赖** API（如客服机器人、实时翻译），必须准备：

### 1. 备用服务商

至少 2 个独立平台：
- 主线：官方 API 或大型中转站
- 备线：另一个中转站或开源模型

### 2. 降级方案

当 429 持续触发时：
- 自动切换到更简单的模型（GPT-4 → GPT-3.5）
- 返回缓存结果或默认回复
- 提示用户"服务繁忙，请稍后重试"

### 3. 监控告警

- 429 触发次数 > 10/小时 → 发送邮件/短信
- API 可用率 < 95% → 自动切换备线

---

## 总结：429 处理清单

- [ ] 判断限制类型（RPM/TPM/并发/配额/上游）
- [ ] 检查余额和套餐剩余量
- [ ] 实现指数退避重试（不要固定间隔）
- [ ] 控制并发数量（≤ 3 for 免费账户）
- [ ] 优化请求内容（缩短上下文、限制输出）
- [ ] 查看平台限制规则（RPM/TPM 是多少）
- [ ] 排除程序 bug（死循环、重复提交）
- [ ] 准备备用线路（主备双线）
- [ ] 监控 429 频率（超过阈值告警）
- [ ] 联系客服（提供完整诊断信息）

**核心原则**：429 的处理重点是"**减速并找出限制维度**"，而不是立刻充值或无限重试。

---

**最后更新**：2026-08-15  
**测试环境**：OpenAI Tier 1、Anthropic Paid、主流中转站  

**延伸阅读**：
- [AI API 返回 401/403 错误怎么办？鉴权失败排查全流程](/articles/fix-api-401-error)
- [API 请求超时排查：从网络到服务端的完整诊断](/articles/fix-api-timeout)
- [如何准备 AI API 备用线路？降低服务中断影响](/articles/build-multi-provider-backup)
