import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 连接配置
// 优先使用 SERVICE ROLE KEY，同时兼容旧版 SECRET KEY 命名
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

if (!SUPABASE_URL) {
  throw new Error(
    '[Supabase] 缺少 SUPABASE_URL 环境变量，请在部署平台配置。'
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '[Supabase] 缺少 SUPABASE_SERVICE_ROLE_KEY（或兼容的 SUPABASE_SECRET_KEY）环境变量，请在部署平台配置。'
  );
}

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    try {
      supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      throw new Error(
        '[Supabase] 初始化失败，请检查 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。'
      );
    }
  }
  return supabase;
}

export default getSupabaseClient;
