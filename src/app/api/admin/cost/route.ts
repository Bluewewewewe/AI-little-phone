import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { getModelDisplayName } from '@/lib/models'

// 验证管理后台访问密码
function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret')
  const envSecret = process.env.ADMIN_SECRET
  return secret === envSecret
}

// 获取成本统计
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'today' // today|week|month|all
    
    let dateFilter = ''
    const now = new Date()
    
    switch (period) {
      case 'today':
        dateFilter = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = weekAgo.toISOString()
        break
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        dateFilter = monthStart.toISOString()
        break
      default:
        dateFilter = ''
    }
    
    // 构建查询
    let query = supabaseAdmin
      .from('api_usage')
      .select('model, feature, cost_rmb, tokens_in, tokens_out, created_at')
      .order('created_at', { ascending: false })
    
    if (dateFilter) {
      if (period === 'today') {
        query = query.gte('created_at', dateFilter)
      } else {
        query = query.gte('created_at', dateFilter)
      }
    }
    
    const { data: usageData, error: usageError } = await query
    
    if (usageError) {
      return NextResponse.json({ error: usageError.message }, { status: 500 })
    }
    
    // 计算总成本
    const totalCost = usageData?.reduce((sum, item) => sum + Number(item.cost_rmb), 0) || 0
    
    // 按模型分组
    const byModel: Record<string, { cost: number; tokensIn: number; tokensOut: number }> = {}
    usageData?.forEach(item => {
      const model = item.model || 'unknown'
      if (!byModel[model]) {
        byModel[model] = { cost: 0, tokensIn: 0, tokensOut: 0 }
      }
      byModel[model].cost += Number(item.cost_rmb)
      byModel[model].tokensIn += item.tokens_in || 0
      byModel[model].tokensOut += item.tokens_out || 0
    })
    
    // 按功能分组
    const byFeature: Record<string, number> = {}
    usageData?.forEach(item => {
      const feature = item.feature || 'other'
      byFeature[feature] = (byFeature[feature] || 0) + Number(item.cost_rmb)
    })
    
    // 按天分组（用于趋势图）
    const byDay: Record<string, number> = {}
    usageData?.forEach(item => {
      const day = item.created_at.split('T')[0]
      byDay[day] = (byDay[day] || 0) + Number(item.cost_rmb)
    })
    
    // 最近7天的趋势
    const trend: { date: string; cost: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      trend.push({ date, cost: byDay[date] || 0 })
    }
    
    // 模型列表（带显示名）
    const modelBreakdown = Object.entries(byModel).map(([model, data]) => ({
      model,
      displayName: getModelDisplayName(model),
      cost: data.cost,
      percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
      tokensIn: data.tokensIn,
      tokensOut: data.tokensOut,
    })).sort((a, b) => b.cost - a.cost)
    
    // 功能列表
    const featureBreakdown = Object.entries(byFeature).map(([feature, cost]) => ({
      feature,
      cost,
      percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
    })).sort((a, b) => b.cost - a.cost)
    
    return NextResponse.json({
      totalCost,
      byModel: modelBreakdown,
      byFeature: featureBreakdown,
      trend,
      totalCalls: usageData?.length || 0,
    })
  } catch (error) {
    console.error('Cost GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
