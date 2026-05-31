import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// 验证管理后台访问密码
function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret')
  const envSecret = process.env.ADMIN_SECRET
  return secret === envSecret
}

// 获取用户统计
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  try {
    // 获取用户数据
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_data')
      .select('*')
    
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }
    
    // 获取收入数据（用于计算付费用户）
    const { data: revenue, error: revenueError } = await supabaseAdmin
      .from('revenue')
      .select('user_id, amount')
    
    if (revenueError) {
      return NextResponse.json({ error: revenueError.message }, { status: 500 })
    }
    
    // 计算统计数据
    const totalUsers = users?.length || 0
    const paidUsers = new Set(revenue?.filter(r => Number(r.amount) > 0).map(r => r.user_id))
    const paidUserCount = paidUsers.size
    
    // 计算平均亲密度
    const avgIntimacy = users && users.length > 0
      ? users.reduce((sum, u) => sum + (u.intimacy_dad || 0) + (u.intimacy_mom || 0), 0) / users.length
      : 0
    
    // 章节分布
    const chapterDistribution: Record<number, number> = {}
    users?.forEach(u => {
      const chapter = u.chapter || 1
      chapterDistribution[chapter] = (chapterDistribution[chapter] || 0) + 1
    })
    
    // 亲密度分布
    const intimacyDistribution: Record<string, number> = {
      '0-100': 0,
      '100-300': 0,
      '300-600': 0,
      '600-1000': 0,
      '1000+': 0,
    }
    users?.forEach(u => {
      const total = (u.intimacy_dad || 0) + (u.intimacy_mom || 0)
      if (total < 100) intimacyDistribution['0-100']++
      else if (total < 300) intimacyDistribution['100-300']++
      else if (total < 600) intimacyDistribution['300-600']++
      else if (total < 1000) intimacyDistribution['600-1000']++
      else intimacyDistribution['1000+']++
    })
    
    // 最近7天活跃用户
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeUsers = users?.filter(u => 
      u.updated_at && new Date(u.updated_at) > weekAgo
    ).length || 0
    
    return NextResponse.json({
      totalUsers,
      paidUsers: paidUserCount,
      unpaidUsers: totalUsers - paidUserCount,
      avgIntimacy: Math.round(avgIntimacy),
      activeUsers,
      chapterDistribution,
      intimacyDistribution,
    })
  } catch (error) {
    console.error('Stats GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
