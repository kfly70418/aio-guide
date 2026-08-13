// 操作日志记录函数
import { createClient } from '@/lib/supabase/server'

interface LogActionParams {
  action: string
  resourceType: string
  resourceId?: string
  details?: Record<string, unknown> | null
}

export async function logAction(params: LogActionParams) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId || null,
    details: params.details ? JSON.parse(JSON.stringify(params.details)) : null,
  })
}
