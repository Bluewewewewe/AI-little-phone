import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { updateModelPrices, DEFAULT_MODEL_PRICES } from '@/lib/models'

// 验证管理后台访问密码
function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret')
  const envSecret = process.env.ADMIN_SECRET
  return secret === envSecret
}

// 价格配置key到模型ID的映射
const PRICE_KEY_MAP: Record<string, { modelIds: string[]; name: string }> = {
  'price_gemini_pro': { modelIds: ['gemini-2.5-pro', 'gemini-2.5-pro-06-05'], name: 'Gemini 2.5 Pro' },
  'price_gemini_flash': { modelIds: ['gemini-2.5-flash', 'gemini-1.5-flash'], name: 'Gemini 2.5 Flash' },
  'price_claude_sonnet': { modelIds: ['claude-sonnet-4', 'claude-sonnet-4-20250514'], name: 'Claude Sonnet 4.6' },
  'price_claude_opus': { modelIds: ['claude-opus-4'], name: 'Claude Opus 4' },
  'price_deepseek_flash': { modelIds: ['deepseek-v4-flash', 'deepseek-chat'], name: 'DeepSeek V4 Flash' },
}

// 从DB重新加载价格到运行时
async function reloadPricesFromDB() {
  if (!isSupabaseConfigured()) return
  
  try {
    const { data } = await supabaseAdmin.from('model_config').select('key, value')
    if (!data) return
    
    const configMap = data.reduce((acc, item) => {
      acc[item.key] = item.value
      return acc
    }, {} as Record<string, string>)
    
    // 构建覆盖价格
    const overrides: Record<string, { name: string; input_per_million: number; output_per_million: number; cache_per_million: number }> = {}
    
    for (const [key, mapping] of Object.entries(PRICE_KEY_MAP)) {
      const inVal = parseFloat(configMap[key + '_in'])
      const outVal = parseFloat(configMap[key + '_out'])
      const cacheVal = parseFloat(configMap[key + '_cache'])
      
      if (!isNaN(inVal) && !isNaN(outVal) && !isNaN(cacheVal)) {
        for (const modelId of mapping.modelIds) {
          overrides[modelId] = {
            name: mapping.name,
            input_per_million: inVal,
            output_per_million: outVal,
            cache_per_million: cacheVal,
          }
        }
      }
    }
    
    if (Object.keys(overrides).length > 0) {
      updateModelPrices(overrides)
    }
  } catch (error) {
    console.error('Failed to reload prices:', error)
  }
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
        // 如果key不存在就insert，存在就update（upsert）
        await supabaseAdmin
          .from('model_config')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      }
    }
    
    // 重新加载价格配置到运行时
    await reloadPricesFromDB()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Config POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
