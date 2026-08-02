import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 连接配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcenabrbftpqeeuufbdr.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

if (!process.env.SUPABASE_SECRET_KEY) {
  console.warn('⚠️  Warning: SUPABASE_SECRET_KEY is not set. Database operations may fail.');
  console.warn('Please set SUPABASE_SECRET_KEY environment variable in your deployment platform.');
}

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      throw error;
    }
  }
  return supabase;
}

export default getSupabaseClient;
