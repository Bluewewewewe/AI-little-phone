import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  let supabaseStatus: 'connected' | 'disconnected' = 'disconnected';

  try {
    const { default: getSupabaseClient } = await import('@/storage/database/supabase-client');
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (!error) {
      supabaseStatus = 'connected';
    }
  } catch {
    supabaseStatus = 'disconnected';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env,
    supabase: supabaseStatus,
  });
}
