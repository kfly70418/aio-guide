---
name: 抓取中转站排行数据
description: 从外部数据源抓取通过检测的服务商数据，保存为本地 JSON 文件
---

# 任务：抓取中转站排行数据

你需要每周运行 2 次排行榜抓取脚本，将结果保存为本地文件发给我。

## 环境准备

确保已安装 Node.js（v18+）和项目依赖：

```bash
cd /path/to/aio-guide
npm install
```

## 执行步骤

### 1. 运行抓取脚本

```bash
npx tsx scripts/sync-apiranking.ts --export
```

参数说明：
- `--export`：导出为本地 JSON 文件，不写入数据库
- `--limit=30`（可选）：只处理榜单前 30 家

### 2. 找到输出文件

脚本会在 `scripts/exports/` 目录生成文件，文件名格式：

```
providers_2026-08-13_1723567890.json
```

### 3. 发送文件

将这个 JSON 文件发给我即可。

## 文件格式说明

JSON 文件包含以下字段：

```json
{
  "meta": {
    "scraped_at": "2026-08-13T10:30:45.123Z",
    "total": 12,
    "verified_only": true
  },
  "providers": [
    {
      "rank": 1,
      "name": "OpenOx",
      "domain": "openox.tech",
      "verification": "✓ 通过检测",
      "price_level": "中 高",
      "min_topup": "¥1",
      "trial_credit": "加客服领取$3",
      "refund_policy": "无手续费",
      "invoice_policy": "可开票",
      "coupon_code": "apiranking",
      "coupon_note": "本站用户首充9.9额外送$6"
    }
  ]
}
```

## 运行频率

**建议每周一和周四上午 10 点**运行一次（价格和政策不会天天变）。

## 常见问题

**Q: 脚本报错 "找不到 .env.local"**  
A: 这个错误可以忽略，使用 `--export` 参数不需要数据库连接。

**Q: 输出的服务商数量很少（< 10 家）**  
A: apiranking 只有少数服务商标注「✓ 通过检测」，脚本只抓取通过检测的。如果数量异常少（< 5 家），可能是页面结构变化，联系我确认。

**Q: 抓取速度很慢**  
A: 脚本会随机延迟 0-20 秒后再请求，这是正常的礼貌性延迟。首次抓取后会缓存 12 小时，重复运行会直接读缓存。

**Q: 某家服务商的字段是空的**  
A: 榜单上有些服务商信息不完整，这是正常现象。导出文件如实记录，我这边会处理。

## 缓存说明

脚本会在 `scripts/.cache/` 缓存已抓取的 HTML（12 小时有效）。如需强制重新抓取，加 `--force` 参数：

```bash
npx tsx scripts/sync-apiranking.ts --export --force
```

## 注意事项

- 不要手动修改导出的 JSON 文件
- 保持文件名不变（我这边的导入脚本会从文件名解析时间戳）
- 如果榜单结构大幅变化（解析出的服务商数量 < 5），及时告知
- 不要过于频繁运行（一天不要超过 2 次），避免给源站造成压力
