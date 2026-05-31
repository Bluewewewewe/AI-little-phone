import { createClient, SupabaseClient } from '@supabase/supabase-js'

const getEnv = (key: string) => process.env[key] || ''

function createSupabaseClient(useServiceKey = false): SupabaseClient {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = useServiceKey 
    ? getEnv('SUPABASE_SERVICE_ROLE_KEY') 
    : getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  if (!url || !key) {
    // 返回一个空客户端，不会真正调用API
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      realtime: { params: { eventsPerSecond: 1 } },
    })
  }
  
  return createClient(url, key, {
    realtime: { params: { eventsPerSecond: 1 } },
    db: { schema: 'public' },
  })
}

// 客户端用匿名key
export const supabase: SupabaseClient = createSupabaseClient(false)

// 服务端用service role key
export const supabaseAdmin: SupabaseClient = createSupabaseClient(true)

// 检查Supabase是否配置
export function isSupabaseConfigured(): boolean {
  return !!(getEnv('NEXT_PUBLIC_SUPABASE_URL') && getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
}
