// 成本追踪工具

import { supabaseAdmin } from './supabase'

export interface CostQuery {
  today?: boolean
  week?: boolean
  month?: boolean
  all?: boolean
  userId?: string
}

// 获取今日成本
export async function getTodayCost(): Promise<number> {
  const { data } = await supabaseAdmin
    .from('api_usage')
    .select('cost_rmb')
    .gt('created_at', new Date().toISOString().split('T')[0])
  
  return data?.reduce((sum, item) => sum + Number(item.cost_rmb), 0) || 0
}

// 获取本周成本
export async function getWeekCost(): Promise<number> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const { data } = await supabaseAdmin
    .from('api_usage')
    .select('cost_rmb')
    .gt('created_at', weekAgo.toISOString())
  
  return data?.reduce((sum, item) => sum + Number(item.cost_rmb), 0) || 0
}

// 获取本月成本
export async function getMonthCost(): Promise<number> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  
  const { data } = await supabaseAdmin
    .from('api_usage')
    .select('cost_rmb')
    .gt('created_at', monthStart.toISOString())
  
  return data?.reduce((sum, item) => sum + Number(item.cost_rmb), 0) || 0
}

// 获取总成本
export async function getTotalCost(): Promise<number> {
  const { data } = await supabaseAdmin
    .from('api_usage')
    .select('cost_rmb')
  
  return data?.reduce((sum, item) => sum + Number(item.cost_rmb), 0) || 0
}

// 按模型分组成本
export async function getCostByModel(): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin
    .from('api_usage')
    .select('model, cost_rmb')
  
  const result: Record<string, number> = {}
  data?.forEach(item => {
    const model = item.model || 'unknown'
    result[model] = (result[model] || 0) + Number(item.cost_rmb)
  })
  
  return result
}

// 按功能分组成本
export async function getCostByFeature(): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin
    .from('api_usage')
    .select('feature, cost_rmb')
  
  const result: Record<string, number> = {}
  data?.forEach(item => {
    const feature = item.feature || 'other'
    result[feature] = (result[feature] || 0) + Number(item.cost_rmb)
  })
  
  return result
}

// 获取最近7天成本趋势
export async function getCostTrend(): Promise<{ date: string; cost: number }[]> {
  const { data } = await supabaseAdmin
    .from('api_usage')
    .select('created_at, cost_rmb')
    .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })
  
  // 按日期分组
  const byDate: Record<string, number> = {}
  data?.forEach(item => {
    const date = item.created_at.split('T')[0]
    byDate[date] = (byDate[date] || 0) + Number(item.cost_rmb)
  })
  
  // 补齐7天
  const result: { date: string; cost: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    result.push({ date, cost: byDate[date] || 0 })
  }
  
  return result
}

// 记录API使用
export async function recordAPIUsage(
  userId: string,
  model: string,
  feature: string,
  tokensIn: number,
  tokensOut: number,
  costRmb: number
): Promise<void> {
  await supabaseAdmin.from('api_usage').insert({
    user_id: userId,
    model,
    feature,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_rmb: costRmb,
  })
}

// 收入统计
export async function getRevenue(query: CostQuery): Promise<number> {
  let dateFilter = ''
  
  if (query.today) {
    dateFilter = `gt.created_at.${new Date().toISOString().split('T')[0]}`
  } else if (query.week) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    dateFilter = `gt.created_at.${weekAgo.toISOString()}`
  } else if (query.month) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    dateFilter = `gt.created_at.${monthStart.toISOString()}`
  }
  
  let queryBuilder = supabaseAdmin.from('revenue').select('amount')
  
  if (query.today) {
    queryBuilder = queryBuilder.gt('created_at', new Date().toISOString().split('T')[0])
  } else if (query.week) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    queryBuilder = queryBuilder.gt('created_at', weekAgo.toISOString())
  } else if (query.month) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    queryBuilder = queryBuilder.gt('created_at', monthStart.toISOString())
  }
  
  const { data } = await queryBuilder
  
  return data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
}

// 添加收入记录
export async function addRevenue(
  amount: number,
  source: 'subscription' | 'redeem_code' | 'manual' | 'other',
  userId?: string,
  note?: string
): Promise<void> {
  await supabaseAdmin.from('revenue').insert({
    amount,
    source,
    user_id: userId,
    note,
  })
}

// 用户统计
export async function getUserStats(): Promise<{
  totalUsers: number
  activeUsers: number
  intimacyDistribution: Record<number, number>
  chapterDistribution: Record<number, number>
}> {
  const { data: users } = await supabaseAdmin.from('user_data').select('*')
  
  const totalUsers = users?.length || 0
  
  // 最近7天活跃用户
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const activeUsers = users?.filter(u => 
    u.updated_at && new Date(u.updated_at) > weekAgo
  ).length || 0
  
  // 亲密度分布
  const intimacyDistribution: Record<number, number> = {}
  users?.forEach(u => {
    const total = (u.intimacy_dad || 0) + (u.intimacy_mom || 0)
    const bucket = Math.floor(total / 100) * 100
    intimacyDistribution[bucket] = (intimacyDistribution[bucket] || 0) + 1
  })
  
  // 章节分布
  const chapterDistribution: Record<number, number> = {}
  users?.forEach(u => {
    const chapter = u.chapter || 1
    chapterDistribution[chapter] = (chapterDistribution[chapter] || 0) + 1
  })
  
  return { totalUsers, activeUsers, intimacyDistribution, chapterDistribution }
}
