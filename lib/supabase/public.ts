// 公共 Supabase 客户端（用于不需要认证的公开页面）
// 不读取 cookies，支持 ISR 缓存
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let publicClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createPublicClient() {
  // 复用同一个客户端实例
  if (publicClient) {
    return publicClient
  }

  publicClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  return publicClient
}
