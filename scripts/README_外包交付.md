# 外包交付包

这个包包含两个数据抓取脚本，**无需安装任何依赖**，只需要 Node.js 环境即可运行。

## 文件清单

- `standalone-fetch-ai-news.js` — AI 快讯抓取脚本（每天一次）
- `standalone-sync-providers.js` — 中转站排行榜抓取脚本（每周两次）
- `外包使用指南.md` — 完整使用说明
- `SKILL_fetch-ai-news.md` — 快讯任务详细说明
- `SKILL_fetch-providers-ranking.md` — 榜单任务详细说明

## 快速开始

### 1. 确保已安装 Node.js

```bash
node --version  # 应显示 v18.x.x 或更高
```

如果没有安装，访问 https://nodejs.org/ 下载 LTS 版本。

### 2. 运行脚本

```bash
# AI 快讯（每天一次，建议早上 9:00）
node standalone-fetch-ai-news.js

# 中转站排行榜（每周两次，建议周一、周四 10:00）
node standalone-sync-providers.js
```

### 3. 发送生成的文件

脚本运行后会在 `exports/` 目录生成 JSON 文件，将文件发送给数据接收方即可。

## 详细说明

请查看 `外包使用指南.md` 获取完整的使用说明、常见问题解答和故障排除。

## 注意事项

1. **文件名不要改**：导入脚本会从文件名解析日期
2. **无需配置**：脚本不需要任何环境变量或配置文件
3. **自动创建目录**：首次运行会自动创建 `exports/` 目录
4. **内置缓存**：重复运行不会造成额外网络请求（缓存 12 小时）

## 联系方式

有任何问题请联系：kfly70418@gmail.com
