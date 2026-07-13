import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 连接配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcenabrbftpqeeuufbdr.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'REPLACED_SECRET';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabase;
}

export default getSupabaseClient;
