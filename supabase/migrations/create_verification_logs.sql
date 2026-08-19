-- 创建核验日志表
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary JSONB NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_verification_logs_checked_at
ON verification_logs(checked_at DESC);

-- 添加注释
COMMENT ON TABLE verification_logs IS '服务商每日核验日志';
COMMENT ON COLUMN verification_logs.summary IS '核验统计摘要（总数、在线、离线等）';
COMMENT ON COLUMN verification_logs.details IS '详细核验结果数组';
