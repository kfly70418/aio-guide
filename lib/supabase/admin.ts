// 管理端 Supabase 客户端（使用 service_role key，绕过 RLS）
// 警告：仅在服务端使用，不要在客户端代码中使用
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
