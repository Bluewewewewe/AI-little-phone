import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// 验证管理后台访问密码
function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret')
  const envSecret = process.env.ADMIN_SECRET
  return secret === envSecret
}

// 获取收入统计
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('revenue')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    
    // 计算各周期收入
    const todayRevenue = data
      ?.filter(item => item.created_at.split('T')[0] === today)
      .reduce((sum, item) => sum + Number(item.amount), 0) || 0
    
    const weekRevenue = data
      ?.filter(item => item.created_at >= weekAgo)
      .reduce((sum, item) => sum + Number(item.amount), 0) || 0
    
    const monthRevenue = data
      ?.filter(item => item.created_at >= monthStart)
      .reduce((sum, item) => sum + Number(item.amount), 0) || 0
    
    const totalRevenue = data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
    
    // 按来源分组
    const bySource: Record<string, number> = {}
    data?.forEach(item => {
      bySource[item.source] = (bySource[item.source] || 0) + Number(item.amount)
    })
    
    // 最近7天趋势
    const trend: { date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const dayRevenue = data
        ?.filter(item => item.created_at.split('T')[0] === date)
        .reduce((sum, item) => sum + Number(item.amount), 0) || 0
      trend.push({ date, revenue: dayRevenue })
    }
    
    return NextResponse.json({
      today: todayRevenue,
      week: weekRevenue,
      month: monthRevenue,
      total: totalRevenue,
      bySource,
      trend,
      recentRecords: data?.slice(0, 20) || [],
    })
  } catch (error) {
    console.error('Revenue GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 添加收入记录
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  try {
    const body = await request.json()
    const { amount, source, user_id, note } = body
    
    if (!amount || !source) {
      return NextResponse.json({ error: 'Missing amount or source' }, { status: 400 })
    }
    
    const { data, error } = await supabaseAdmin
      .from('revenue')
      .insert({
        amount: parseFloat(amount),
        source,
        user_id: user_id || null,
        note: note || null,
      })
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, record: data })
  } catch (error) {
    console.error('Revenue POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
