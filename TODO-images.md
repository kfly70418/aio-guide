# 文章图片补充清单

> 生成时间：2026-08-15
> 最后更新：2026-08-18
> 状态：进行中

## 概述

- **总文章数**：21 篇
- **需要图片**：13 篇
- **已完成**：2 篇（API Key 泄露止损清单 + API 中转站跑路预案）
- **剩余**：11 篇
- **优先级**：按文章重要性和图片数量排序

---

## 高优先级（提及 ≥ 5 处）

### 1. ~~what-if-api-service-shuts-down（18 处）~~ ✅ 已完成
**文章**：API 中转站跑路或停止服务怎么办？提前做好这 8 件事  
**配图状态**：已完成 7 张配图（2026-08-18）
- ✅ backup-01-failure-case.png - 服务中断真实案例
- ✅ backup-02-comparison.png - 备用服务商对比
- ✅ backup-03-task-priority-template.png - 任务优先级模板
- ✅ backup-04-config-comparison.png - 多账号配置对比
- ✅ backup-05-client-switch.png - 客户端切换流程
- ✅ backup-06-drill-checklist.png - 演练检查清单
- ✅ backup-07-incident-report.png - 故障复盘记录

### 2. what-to-do-if-api-key-leaked（16 处）
**文章**：API Key 泄露止损清单  
**需要的图片类型**：
- 泄露检测工具截图
- 密钥撤销步骤
- 日志分析界面
- 安全检查清单

### 3. api-key-security-basics（9 处）
**文章**：API Key 安全指南  
**需要的图片类型**：
- 密钥创建界面
- 权限配置截图
- 密码管理器示例（1Password/Bitwarden）
- 不安全存储位置警示图

### 4. first-api-account-checklist（6 处）
**文章**：首次注册 API 完整指南  
**需要的图片类型**：
- 注册流程截图
- 充值界面
- API Key 创建界面
- 测试成功示例

### 5. ai-api-beginner-basics（5 处）
**文章**：AI API 零基础入门指南  
**需要的图片类型**：
- API vs 网页聊天对比图
- API 工作原理流程图
- 配置示例截图

---

## 中优先级（提及 3-4 处）

### 6. beginner-api-troubleshooting（4 处）
**文章**：API 连接失败排查指南  
**需要的图片类型**：
- 错误信息截图（401/429/timeout）
- 排查流程图

### 7. how-much-to-recharge-api（4 处）
**文章**：第一次充值建议  
**需要的图片类型**：
- 充值界面
- 用量统计面板

### 8. configure-claude-code-relay-api-windows（4 处）
**文章**：Claude Code 配置教程  
**需要的图片类型**：
- Windows 配置界面截图
- settings.json 示例
- 测试成功界面

### 9. api-relay-service-explained（3 处）
**文章**：中转站工作原理  
**需要的图片类型**：
- 架构示意图
- 官方 vs 中转对比

### 10. base-url-model-id-token-explained（3 处）
**文章**：核心概念解释  
**需要的图片类型**：
- 配置示例截图（OpenAI/Claude）
- 错误信息对照

---

## 低优先级（提及 1-2 处）

### 11. api-pricing-token-billing-basics（2 处）
**文章**：API 计费规则  
**图片**：Token 计算示意图

### 12. choose-first-ai-model（1 处）
**文章**：新手选模型指南  
**图片**：模型对比表

### 13. official-api-vs-relay-service（1 处）
**文章**：官方 vs 中转对比  
**图片**：价格对比表

---

## 不需要图片（8 篇）

这些文章以文字说明为主，不强制要求配图：

1. api-key-vs-ai-membership
2. api-relay-service-safe-or-not
3. does-api-store-conversations
4. fix-api-401-error
5. fix-api-429-error
6. fix-api-timeout
7. test-api-service-quality
8. why-ai-api-price-different

---

## 图片制作建议

### 技术要求
- **格式**：PNG/WebP
- **尺寸**：最大宽度 1200px
- **压缩**：使用 TinyPNG 或 WebP 压缩
- **存储**：`public/images/articles/` 目录

### 设计风格
- 简洁现代，符合网站深色调设计
- 使用项目配色：`#0F172A`（背景）+ `#38BDF8`（强调色）
- 截图添加边框和阴影，提高可读性
- 示意图使用扁平化风格

### 优先级策略
1. **先做高优先级**：前 5 篇文章的关键截图
2. **批量制作**：相同类型的图片一起做（如所有"错误信息截图"）
3. **渐进增强**：文章可以先发布，图片后续补充

---

## 下一步

- [ ] 收集真实服务商界面截图（脱敏处理）
- [ ] 使用 Figma/Excalidraw 制作流程图
- [ ] 更新文章中的图片引用路径
- [ ] 测试图片加载性能
