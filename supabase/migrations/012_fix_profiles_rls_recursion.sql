-- 修复 profiles RLS 无限递归（Postgres 42P17）
--
-- 问题：001_create_profiles.sql 的 SELECT 策略在 USING 子句里查询 profiles 自身：
--   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true))
-- 判断"能否读 profiles"需要先读 profiles，而这次读取又要过同一条策略，
-- Postgres 检测到循环后抛出 42P17。表现为登录时被判定"该账号没有后台访问权限"
-- （app/auth/signin/route.ts 的 .maybeSingle() 吞掉了错误，profile 变成 null）。
--
-- 同样的 EXISTS 子查询出现在其他 8 张表的 16 条策略里，它们也会被 profiles
-- 的递归策略带崩，所以后台的读写整体不可用。
--
-- 解法：把"是否为启用的管理员"收敛到一个 SECURITY DEFINER 函数。函数以所有者
-- 身份执行，读 profiles 时不再触发 RLS，循环就断开了。所有策略改用它。

-- 1) 判定函数
--    SECURITY DEFINER：绕过 RLS，打断递归
--    STABLE：同一语句内可缓存结果
--    search_path = ''：防搜索路径劫持，因此表名/函数名全部写全限定
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;

COMMENT ON FUNCTION public.is_active_admin() IS
  '判断当前登录用户是否为启用状态的管理员。SECURITY DEFINER 以避免 profiles 表 RLS 递归。';

-- 2) profiles：递归的源头
DROP POLICY IF EXISTS "管理员可查看所有资料" ON profiles;
CREATE POLICY "管理员可查看所有资料" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_active_admin());

-- 更新自己的资料：原策略无递归，保持不变，此处不改动

-- 3) providers
DROP POLICY IF EXISTS "管理员可查看所有服务商" ON providers;
CREATE POLICY "管理员可查看所有服务商" ON providers
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

DROP POLICY IF EXISTS "管理员可管理服务商" ON providers;
CREATE POLICY "管理员可管理服务商" ON providers
  FOR ALL TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- 4) models
DROP POLICY IF EXISTS "管理员可管理模型" ON models;
CREATE POLICY "管理员可管理模型" ON models
  FOR ALL TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- 5) channels
DROP POLICY IF EXISTS "管理员可管理渠道" ON channels;
CREATE POLICY "管理员可管理渠道" ON channels
  FOR ALL TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- 6) prices
DROP POLICY IF EXISTS "管理员可管理价格" ON prices;
CREATE POLICY "管理员可管理价格" ON prices
  FOR ALL TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- 7) price_history
DROP POLICY IF EXISTS "管理员可查看所有历史" ON price_history;
CREATE POLICY "管理员可查看所有历史" ON price_history
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 8) articles
DROP POLICY IF EXISTS "管理员可管理文章" ON articles;
CREATE POLICY "管理员可管理文章" ON articles
  FOR ALL TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- 9) click_events
DROP POLICY IF EXISTS "管理员可查看点击" ON click_events;
CREATE POLICY "管理员可查看点击" ON click_events
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

-- 10) audit_logs
DROP POLICY IF EXISTS "管理员可查看日志" ON audit_logs;
CREATE POLICY "管理员可查看日志" ON audit_logs
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

DROP POLICY IF EXISTS "管理员可插入日志" ON audit_logs;
CREATE POLICY "管理员可插入日志" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_active_admin());
