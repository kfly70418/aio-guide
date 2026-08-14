# 废弃字段清理报告

## 背景

在整站排查 `apiranking` 过程中，发现数据库存在重复字段，导致数据不一致。

## 发现的问题

### 1. 硬编码的 apiranking
**位置**: `scripts/sync-apiranking.ts:347`
```typescript
coupon_code: s.couponNote ? 'apiranking' : null,
```
**修复**: 改为 `'apixuan'`

### 2. 重复字段

| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| `min_recharge` | `min_topup` | 最低充值金额 |
| `free_credits` | `trial_credit` | 新人赠送额度 |

**问题详情**:
- `min_recharge` 存储纯数字（如 `1`），前端显示时拼接 `元`
- `min_topup` 存储带货币符号的字符串（如 `¥1`）
- `free_credits` 存储纯数字（如 `3`），前端显示时拼接 `$`
- `trial_credit` 存储带货币符号的字符串（如 `$3`）

**影响范围**:
- 首页使用 `min_recharge` 和 `free_credits`
- 服务商列表页、详情页使用 `min_topup` 和 `trial_credit`
- 后台管理使用 `min_topup` 和 `trial_credit`
- 导致不同页面显示的数据可能不一致

## 修复内容

### 1. 代码层面

#### 替换硬编码优惠码
- ✅ `scripts/sync-apiranking.ts` - 优惠码改为 `apixuan`
- ✅ `scripts/enrich-providers.ts` - 注释去除 apiranking 引用
- ✅ `scripts/README_外包交付.md` - 脚本名称更新
- ✅ `scripts/外包使用指南.md` - 脚本名称和示例更新
- ✅ `scripts/SKILL_fetch-providers-ranking.md` - 描述去品牌化

#### 统一字段使用
- ✅ `app/page.tsx` - 查询改为使用 `min_topup`, `trial_credit`
- ✅ `app/page.tsx` - 显示逻辑改为使用 `min_topup`, `trial_credit`
- ✅ 删除所有 `min_recharge` 和 `free_credits` 的引用

### 2. 数据层面

#### 数据同步
- ✅ 4 条记录的数据从旧字段同步到新字段：
  - H API: `min_topup: ¥1`, `trial_credit: $0.5`
  - boxying: `min_topup: ¥1`
  - LinkAI: `min_topup: ¥1`
  - LinksAPI: `min_topup: ¥9`, `trial_credit: $3`

### 3. 清理文件
- ✅ 删除所有旧的导出文件（`scripts/exports/*.json`）
- ✅ 删除临时检查脚本

## 待执行操作

### 数据库字段删除

在 Supabase Dashboard 执行：

```sql
ALTER TABLE providers DROP COLUMN IF EXISTS min_recharge;
ALTER TABLE providers DROP COLUMN IF EXISTS free_credits;
```

或使用迁移文件：`supabase/migrations/drop_duplicate_fields.sql`

### 部署

```bash
cd "D:\Websites\aio-guide"
vercel --prod
```

部署后刷新缓存：
```bash
REVALIDATE_SECRET=apixuan-revalidate-2024 node scripts/revalidate-cache.js
```

## 验证清单

- ✅ 代码中无 `apiranking` 硬编码值（除文件名和缓存键）
- ✅ 代码中无 `min_recharge` 或 `free_credits` 引用
- ✅ 数据已从旧字段同步到新字段
- ⏳ 数据库废弃字段已删除（待执行）
- ⏳ 部署到生产环境（待执行）
- ⏳ 缓存已刷新（待执行）

## 预期效果

1. **品牌统一**: 所有优惠码使用 `apixuan`
2. **数据一致**: 所有页面使用相同的字段
3. **代码简洁**: 删除重复字段，避免混淆
4. **维护性提升**: 单一数据源，减少同步错误

## 文档

- 删除字段说明: `supabase/migrations/drop_duplicate_fields.sql`
- 本报告: `docs/CLEANUP_APIRANKING.md`
