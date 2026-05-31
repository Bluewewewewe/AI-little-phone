import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// 验证管理后台访问密码
function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret')
  const envSecret = process.env.ADMIN_SECRET
  return secret === envSecret
}

// 获取模型配置
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('model_config')
      .select('*')
      .order('id')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ config: data })
  } catch (error) {
    console.error('Config GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 更新模型配置
export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  try {
    const body = await request.json()
    const { key, value } = body
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })
    }
    
    const { data, error } = await supabaseAdmin
      .from('model_config')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, config: data })
  } catch (error) {
    console.error('Config PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 批量更新配置
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  try {
    const body = await request.json()
    const updates = body.updates || []
    
    for (const update of updates) {
      const { key, value } = update
      if (key && value !== undefined) {
        await supabaseAdmin
          .from('model_config')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key)
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Config POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
