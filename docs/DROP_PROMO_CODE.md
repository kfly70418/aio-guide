# 删除 promo_code 列

## 背景
`promo_code` 字段已被 `coupon_code` 替代，所有代码已更新使用 `coupon_code`。

## 数据迁移状态
✅ 所有数据已从 `promo_code` 迁移到 `coupon_code`
✅ 所有代码已更新为使用 `coupon_code`
✅ `promo_code` 列现在为空，可以安全删除

## 执行步骤

### 方法 1：通过 Supabase Dashboard（推荐）

1. 访问 SQL Editor：
   https://supabase.com/dashboard/project/bmnvirrnbkrepmixiisq/sql/new

2. 粘贴并执行以下 SQL：
   ```sql
   ALTER TABLE providers DROP COLUMN IF EXISTS promo_code;
   ```

3. 点击 "Run" 执行

### 方法 2：使用迁移文件

如果你使用 Supabase CLI，迁移文件已准备好：
```bash
supabase migration up
```

迁移文件位置：`supabase/migrations/drop_promo_code_column.sql`

## 验证

执行后，可以运行以下 SQL 验证列已删除：
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'providers' AND column_name = 'promo_code';
```

应该返回空结果。

## 注意事项

- 删除列是不可逆操作
- 执行前已确认数据已完全迁移
- 所有应用代码已更新，不再使用此列
