---
name: 抓取 AI 快讯数据
description: 从 ainav.cn 抓取极客公园和机器之心的 AI 快讯，保存为本地 JSON 文件
---

# 任务：抓取 AI 快讯

你需要每天运行一次快讯抓取脚本，将结果保存为本地文件发给我。

## 环境准备

确保已安装 Node.js（v18+）和项目依赖：

```bash
cd /path/to/aio-guide
npm install
```

## 执行步骤

### 1. 运行抓取脚本

```bash
npx tsx scripts/fetch-ai-news.ts --export
```

参数说明：
- `--export`：导出为本地 JSON 文件，不写入数据库
- `--date=2026-08-13`（可选）：指定日期，默认为当天

### 2. 找到输出文件

脚本会在 `scripts/exports/` 目录生成文件，文件名格式：

```
ai-news_2026-08-13_1723567890.json
```

### 3. 发送文件

将这个 JSON 文件发给我即可。

## 文件格式说明

JSON 文件包含以下字段：

```json
{
  "meta": {
    "date": "2026-08-13",
    "sources": ["geekpark", "jiqizhixin"],
    "total": 20,
    "exported_at": "2026-08-13T10:30:45.123Z"
  },
  "items": [
    {
      "title": "3 个月烧掉 105 亿，腾讯急了",
      "link": "https://...",
      "published_at": "2026-08-13T08:00:00Z",
      "source": "极客公园",
      "summary": "..."
    }
  ]
}
```

## 运行频率

**建议每天早上 9 点**运行一次（ainav 在前一天 23 点会更新完当天所有快讯）。

## 常见问题

**Q: 脚本报错 "找不到 .env.local"**  
A: 这个错误可以忽略，使用 `--export` 参数不需要数据库连接。

**Q: 某个日期的数据抓取失败**  
A: 源站可能当天没有更新，或网络临时故障。记录下来并继续运行，下次会补抓。

**Q: 输出文件很大**  
A: 正常单日数据在 50KB 左右（20 条快讯）。如果超过 500KB，可能抓到了重复数据，联系我确认。

## 缓存说明

脚本会在 `scripts/.cache/` 缓存已抓取的数据（6 小时有效），调试时不会重复请求源站。如需强制重新抓取，加 `--force` 参数：

```bash
npx tsx scripts/fetch-ai-news.ts --export --force
```

## 注意事项

- 不要手动修改导出的 JSON 文件
- 保持文件名不变（我这边的导入脚本会从文件名解析日期）
- 如果连续多天无法抓取，及时告知
