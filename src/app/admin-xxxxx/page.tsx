'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Settings, DollarSign, Users, BarChart3, 
  PieChart, TrendingUp, Save, RefreshCw,
  Plus, X, Check, AlertCircle, ChevronDown
} from 'lucide-react'

// 类型定义
interface ModelConfig {
  key: string
  value: string
  description?: string
}

interface CostData {
  totalCost: number
  byModel: { model: string; displayName: string; cost: number; percentage: number; tokensIn: number; tokensOut: number }[]
  byFeature: { feature: string; cost: number; percentage: number }[]
  trend: { date: string; cost: number }[]
  totalCalls: number
}

interface RevenueData {
  today: number
  week: number
  month: number
  total: number
  bySource: Record<string, number>
  trend: { date: string; revenue: number }[]
  recentRecords: { id: number; amount: number; source: string; note?: string; created_at: string }[]
}

interface UserStats {
  totalUsers: number
  paidUsers: number
  unpaidUsers: number
  avgIntimacy: number
  activeUsers: number
  chapterDistribution: Record<number, number>
  intimacyDistribution: Record<string, number>
}

// 颜色配置
const CHART_COLORS = [
  'from-purple-500 to-violet-500',
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-amber-500',
  'from-red-500 to-rose-500',
]

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'users' | 'revenue'>('overview')
  const [loading, setLoading] = useState(false)
  const [secret, setSecret] = useState('')
  
  // 数据状态
  const [costData, setCostData] = useState<CostData | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [modelConfig, setModelConfig] = useState<ModelConfig[]>([])
  
  // 表单状态
  const [configForm, setConfigForm] = useState<Record<string, string>>({})
  const [revenueForm, setRevenueForm] = useState({ amount: '', source: 'manual', note: '' })
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')

  // 认证
  const handleAuth = () => {
    if (password === secret || password === 'admin123') {
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError('密码错误')
    }
  }

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    
    try {
      // 获取成本数据
      const costRes = await fetch(`/api/admin/cost?period=${period}`, {
        headers: { 'x-admin-secret': password || secret }
      })
      if (costRes.ok) {
        const costJson = await costRes.json()
        setCostData(costJson)
      }
      
      // 获取收入数据
      const revenueRes = await fetch('/api/admin/revenue', {
        headers: { 'x-admin-secret': password || secret }
      })
      if (revenueRes.ok) {
        const revenueJson = await revenueRes.json()
        setRevenueData(revenueJson)
      }
      
      // 获取用户统计
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'x-admin-secret': password || secret }
      })
      if (statsRes.ok) {
        const statsJson = await statsRes.json()
        setUserStats(statsJson)
      }
      
      // 获取模型配置
      const configRes = await fetch('/api/admin/config', {
        headers: { 'x-admin-secret': password || secret }
      })
      if (configRes.ok) {
        const configJson = await configRes.json()
        setModelConfig(configJson.config || [])
        const formData: Record<string, string> = {}
        configJson.config?.forEach((item: ModelConfig) => {
          formData[item.key] = item.value
        })
        setConfigForm(formData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, password, secret, period])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, fetchData])

  // 保存配置
  const saveConfig = async () => {
    setLoading(true)
    try {
      const updates = Object.entries(configForm).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': password || secret
        },
        body: JSON.stringify({ updates })
      })
      
      if (res.ok) {
        alert('配置保存成功！')
        fetchData()
      } else {
        alert('保存失败')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setLoading(false)
    }
  }

  // 添加收入
  const addRevenue = async () => {
    if (!revenueForm.amount) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/admin/revenue', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': password || secret
        },
        body: JSON.stringify(revenueForm)
      })
      
      if (res.ok) {
        setShowRevenueModal(false)
        setRevenueForm({ amount: '', source: 'manual', note: '' })
        fetchData()
      } else {
        alert('添加失败')
      }
    } catch (error) {
      console.error('Failed to add revenue:', error)
    } finally {
      setLoading(false)
    }
  }

  // 认证界面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">管理后台</h1>
            <p className="text-white/60 text-sm">请输入访问密码</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              placeholder="输入管理员密码"
              className="input"
            />
            
            {authError && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {authError}
              </div>
            )}
            
            <button onClick={handleAuth} className="btn btn-primary w-full py-3">
              进入后台
            </button>
            
            <p className="text-center text-white/40 text-xs">
              默认密码: admin123（开发环境）
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 主界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">管理后台</h1>
            <p className="text-white/60 text-sm">AI小手机 V3.0</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm"
            >
              <option value="today">今日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="all">全部</option>
            </select>
            <button onClick={fetchData} className="btn btn-secondary flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: '财务总览', icon: DollarSign },
            { id: 'config', label: '模型配置', icon: Settings },
            { id: 'revenue', label: '收入管理', icon: BarChart3 },
            { id: 'users', label: '用户统计', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-purple-500 text-white' 
                  : 'glass hover:bg-glass-hover'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 财务总览 */}
        {activeTab === 'overview' && costData && revenueData && (
          <div className="space-y-6 animate-fadeIn">
            {/* 核心指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="总收入" 
                value={`¥${revenueData.total.toFixed(2)}`}
                subtitle={`本月: ¥${revenueData.month.toFixed(2)}`}
                trend={`+¥${revenueData.today.toFixed(2)}`}
                color="from-green-500 to-emerald-500"
                icon={DollarSign}
              />
              <MetricCard 
                title="总成本" 
                value={`¥${costData.totalCost.toFixed(4)}`}
                subtitle={`调用次数: ${costData.totalCalls}`}
                trend={`¥${(costData.totalCost / (revenueData.total || 1) * 100).toFixed(1)}% 占比`}
                color="from-red-500 to-rose-500"
                icon={TrendingUp}
              />
              <MetricCard 
                title="净利润" 
                value={`¥${(revenueData.total - costData.totalCost).toFixed(2)}`}
                subtitle={`利润率: ${((revenueData.total - costData.totalCost) / (revenueData.total || 1) * 100).toFixed(1)}%`}
                trend={(revenueData.total - costData.totalCost) >= 0 ? '盈利' : '亏损'}
                color={revenueData.total - costData.totalCost >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-amber-500'}
                icon={BarChart3}
              />
              <MetricCard 
                title="今日收入" 
                value={`¥${revenueData.today.toFixed(2)}`}
                subtitle={`本周: ¥${revenueData.week.toFixed(2)}`}
                trend={`${revenueData.recentRecords.length} 条记录`}
                color="from-purple-500 to-violet-500"
                icon={PieChart}
              />
            </div>

            {/* 成本分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 模型成本占比 */}
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  模型成本占比
                </h3>
                {costData.byModel.length > 0 ? (
                  <div className="space-y-4">
                    {costData.byModel.map((item, idx) => (
                      <div key={item.model}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.displayName}</span>
                          <span className="text-white/60">¥{item.cost.toFixed(4)} ({item.percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill bg-gradient-to-r ${CHART_COLORS[idx % CHART_COLORS.length]}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          输入: {item.tokensIn.toLocaleString()} tokens | 输出: {item.tokensOut.toLocaleString()} tokens
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm text-center py-8">暂无数据</p>
                )}
              </div>

              {/* 功能成本占比 */}
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-400" />
                  功能成本分类
                </h3>
                {costData.byFeature.length > 0 ? (
                  <div className="space-y-4">
                    {costData.byFeature.map((item, idx) => (
                      <div key={item.feature}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{item.feature}</span>
                          <span className="text-white/60">¥{item.cost.toFixed(4)} ({item.percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill bg-gradient-to-r ${CHART_COLORS[(idx + 2) % CHART_COLORS.length]}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm text-center py-8">暂无数据</p>
                )}
              </div>
            </div>

            {/* 成本趋势 */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                成本趋势（近7天）
              </h3>
              <div className="flex items-end gap-2 h-40">
                {costData.trend.map((item, idx) => {
                  const maxCost = Math.max(...costData.trend.map(t => t.cost), 0.01)
                  return (
                    <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <div 
                          className="w-full max-w-12 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all"
                          style={{ height: `${(item.cost / maxCost) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">
                        {item.date.slice(5)}
                      </span>
                      <span className="text-xs text-purple-400">
                        ¥{item.cost.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 收入vs成本对比 */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4">收入 vs 成本 对比</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>收入</span>
                    <span className="text-green-400">¥{revenueData.total.toFixed(2)}</span>
                  </div>
                  <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>成本</span>
                    <span className="text-red-400">¥{costData.totalCost.toFixed(4)}</span>
                  </div>
                  <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (costData.totalCost / revenueData.total) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="font-bold">净利润</span>
                    <span className={`font-bold ${revenueData.total - costData.totalCost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ¥{(revenueData.total - costData.totalCost).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 模型配置 */}
        {activeTab === 'config' && (
          <div className="glass-card p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                模型权重配置
              </h3>
              <button onClick={saveConfig} className="btn btn-primary flex items-center gap-2" disabled={loading}>
                <Save className="w-4 h-4" />
                保存配置
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gemini 权重 */}
              <div className="space-y-3">
                <label className="text-sm text-white/60">Gemini 权重</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={parseInt(configForm.gemini_weight) || 70}
                  onChange={(e) => setConfigForm({ ...configForm, gemini_weight: e.target.value })}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-purple-400 font-medium">{configForm.gemini_weight || 70}%</span>
                  <span className="text-white/40">{100 - (parseInt(configForm.gemini_weight) || 70)}% Claude</span>
                </div>
              </div>

              {/* Claude 权重 */}
              <div className="space-y-3">
                <label className="text-sm text-white/60">Claude 权重</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={parseInt(configForm.claude_weight) || 30}
                  onChange={(e) => setConfigForm({ ...configForm, claude_weight: e.target.value })}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-pink-400 font-medium">{configForm.claude_weight || 30}%</span>
                  <span className="text-white/40">{100 - (parseInt(configForm.claude_weight) || 30)}% Gemini</span>
                </div>
              </div>

              {/* 路由模式 */}
              <div className="space-y-3">
                <label className="text-sm text-white/60">路由模式</label>
                <select
                  value={configForm.routing_mode || 'weighted'}
                  onChange={(e) => setConfigForm({ ...configForm, routing_mode: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
                >
                  <option value="weighted">按权重分配</option>
                  <option value="chapter">按章节分配</option>
                  <option value="manual">手动指定</option>
                </select>
              </div>

              {/* Gemini 模型 */}
              <div className="space-y-3">
                <label className="text-sm text-white/60">Gemini 模型版本</label>
                <select
                  value={configForm.gemini_model || 'gemini-2.5-pro-06-05'}
                  onChange={(e) => setConfigForm({ ...configForm, gemini_model: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
                >
                  <option value="gemini-2.5-pro-06-05">Gemini 2.5 Pro (06-05)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>

              {/* Claude 模型 */}
              <div className="space-y-3">
                <label className="text-sm text-white/60">Claude 模型版本</label>
                <select
                  value={configForm.claude_model || 'claude-sonnet-4-20250514'}
                  onChange={(e) => setConfigForm({ ...configForm, claude_model: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
                >
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (2025-05-14)</option>
                  <option value="claude-sonnet-4">Claude Sonnet 4</option>
                  <option value="claude-opus-4">Claude Opus 4</option>
                </select>
              </div>

              {/* 粉丝模型 */}
              <div className="space-y-3">
                <label className="text-sm text-white/60">粉丝模型</label>
                <select
                  value={configForm.fan_model || 'deepseek-v4-flash'}
                  onChange={(e) => setConfigForm({ ...configForm, fan_model: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
                >
                  <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
                  <option value="deepseek-chat">DeepSeek Chat</option>
                </select>
              </div>
            </div>

            {/* 模型价格配置 */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  模型价格配置
                </h4>
                <span className="text-xs text-white/40">修改后保存即时生效，不用重新部署</span>
              </div>
              <p className="text-xs text-white/40 mb-4">价格单位：¥/百万token。修改价格会影响后续成本计算，已有记录不受影响。</p>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-white/60 border-b border-white/10">
                      <th className="pb-3">模型</th>
                      <th className="pb-3">输入价格</th>
                      <th className="pb-3">输出价格</th>
                      <th className="pb-3">缓存价格</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'price_gemini_pro', label: 'Gemini 2.5 Pro', defaultIn: '9', defaultOut: '72', defaultCache: '2.25' },
                      { key: 'price_gemini_flash', label: 'Gemini 2.5 Flash', defaultIn: '0.5', defaultOut: '2.16', defaultCache: '0.13' },
                      { key: 'price_claude_sonnet', label: 'Claude Sonnet 4.6', defaultIn: '21.6', defaultOut: '108', defaultCache: '2.16' },
                      { key: 'price_claude_opus', label: 'Claude Opus 4', defaultIn: '108', defaultOut: '540', defaultCache: '10.8' },
                      { key: 'price_deepseek_flash', label: 'DeepSeek V4 Flash', defaultIn: '1', defaultOut: '2', defaultCache: '0.02' },
                    ].map(model => (
                      <tr key={model.key} className="border-b border-white/5">
                        <td className="py-3 text-sm font-medium">{model.label}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={configForm[model.key + '_in'] || model.defaultIn}
                            onChange={(e) => setConfigForm({ ...configForm, [model.key + '_in']: e.target.value })}
                            className="w-24 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={configForm[model.key + '_out'] || model.defaultOut}
                            onChange={(e) => setConfigForm({ ...configForm, [model.key + '_out']: e.target.value })}
                            className="w-24 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={configForm[model.key + '_cache'] || model.defaultCache}
                            onChange={(e) => setConfigForm({ ...configForm, [model.key + '_cache']: e.target.value })}
                            className="w-24 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 收入管理 */}
        {activeTab === 'revenue' && revenueData && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-end">
              <button 
                onClick={() => setShowRevenueModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加收入
              </button>
            </div>

            {/* 收入统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="今日" value={`¥${revenueData.today.toFixed(2)}`} />
              <StatCard title="本周" value={`¥${revenueData.week.toFixed(2)}`} />
              <StatCard title="本月" value={`¥${revenueData.month.toFixed(2)}`} />
              <StatCard title="累计" value={`¥${revenueData.total.toFixed(2)}`} highlight />
            </div>

            {/* 收入来源 */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4">收入来源分布</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(revenueData.bySource).map(([source, amount]) => (
                  <div key={source} className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-sm text-white/60 capitalize mb-1">{source}</p>
                    <p className="text-xl font-bold text-green-400">¥{amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近记录 */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4">最近收入记录</h3>
              {revenueData.recentRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-white/60 border-b border-white/10">
                        <th className="pb-3">时间</th>
                        <th className="pb-3">金额</th>
                        <th className="pb-3">来源</th>
                        <th className="pb-3">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData.recentRecords.map((record) => (
                        <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 text-sm">{new Date(record.created_at).toLocaleString()}</td>
                          <td className="py-3 text-sm text-green-400">¥{record.amount.toFixed(2)}</td>
                          <td className="py-3">
                            <span className="badge badge-blue capitalize text-xs">{record.source}</span>
                          </td>
                          <td className="py-3 text-sm text-white/60 truncate max-w-32">{record.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-white/40 py-8">暂无记录</p>
              )}
            </div>
          </div>
        )}

        {/* 用户统计 */}
        {activeTab === 'users' && userStats && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="总用户" value={userStats.totalUsers.toString()} />
              <StatCard title="付费用户" value={userStats.paidUsers.toString()} highlight />
              <StatCard title="活跃用户" value={userStats.activeUsers.toString()} />
              <StatCard title="平均亲密度" value={userStats.avgIntimacy.toString()} />
            </div>

            {/* 章节分布 */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4">章节进度分布</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map(chapter => (
                  <div key={chapter} className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-sm text-white/60 mb-1">第{chapter}章</p>
                    <p className="text-2xl font-bold">{userStats.chapterDistribution[chapter] || 0}</p>
                    <p className="text-xs text-white/40">用户</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 亲密度分布 */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4">亲密度分布</h3>
              <div className="space-y-4">
                {Object.entries(userStats.intimacyDistribution).map(([range, count]) => (
                  <div key={range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{range}</span>
                      <span className="text-white/60">{count} 用户</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${(count / userStats.totalUsers) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 添加收入弹窗 */}
        {showRevenueModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md animate-slideUp">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">添加收入记录</h3>
                <button onClick={() => setShowRevenueModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">金额</label>
                  <input
                    type="number"
                    step="0.01"
                    value={revenueForm.amount}
                    onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                    placeholder="输入金额"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/60 mb-2 block">来源</label>
                  <select
                    value={revenueForm.source}
                    onChange={(e) => setRevenueForm({ ...revenueForm, source: e.target.value })}
                    className="input"
                  >
                    <option value="manual">手动录入</option>
                    <option value="subscription">订阅付费</option>
                    <option value="redeem_code">兑换码</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-white/60 mb-2 block">备注</label>
                  <input
                    type="text"
                    value={revenueForm.note}
                    onChange={(e) => setRevenueForm({ ...revenueForm, note: e.target.value })}
                    placeholder="可选备注"
                    className="input"
                  />
                </div>
                
                <button 
                  onClick={addRevenue}
                  disabled={!revenueForm.amount}
                  className="btn btn-primary w-full py-3"
                >
                  <Check className="w-4 h-4" />
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 指标卡片
function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  color, 
  icon: Icon 
}: { 
  title: string
  value: string
  subtitle: string
  trend: string
  color: string
  icon: any
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-white/60 mb-1">{title}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-white/40">{subtitle}</p>
      {trend && (
        <p className={`text-xs mt-2 ${trend.includes('盈利') ? 'text-green-400' : trend.includes('亏损') ? 'text-red-400' : 'text-white/60'}`}>
          {trend}
        </p>
      )}
    </div>
  )
}

// 统计卡片
function StatCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-sm text-white/60 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-400' : ''}`}>{value}</p>
    </div>
  )
}
