import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { callAI, DEFAULT_MODEL_CONFIG, UserIdentity } from '@/lib/ai-engine'
import { generateSystemPrompt, getChapterByIntimacy } from '@/lib/prompts'
import { updateModelPrices, DEFAULT_MODEL_PRICES } from '@/lib/models'

// 启动时从DB加载价格（如果可用）
let pricesLoaded = false
async function ensurePricesLoaded() {
  if (pricesLoaded || !isSupabaseConfigured()) return
  try {
    const { data } = await supabaseAdmin.from('model_config').select('key, value')
    if (data) {
      const configMap = data.reduce((acc, item) => { acc[item.key] = item.value; return acc }, {} as Record<string, string>)
      const PRICE_KEY_MAP: Record<string, { modelIds: string[]; name: string }> = {
        'price_gemini_pro': { modelIds: ['gemini-2.5-pro', 'gemini-2.5-pro-06-05'], name: 'Gemini 2.5 Pro' },
        'price_gemini_flash': { modelIds: ['gemini-2.5-flash', 'gemini-1.5-flash'], name: 'Gemini 2.5 Flash' },
        'price_claude_sonnet': { modelIds: ['claude-sonnet-4', 'claude-sonnet-4-20250514'], name: 'Claude Sonnet 4.6' },
        'price_claude_opus': { modelIds: ['claude-opus-4'], name: 'Claude Opus 4' },
        'price_deepseek_flash': { modelIds: ['deepseek-v4-flash', 'deepseek-chat'], name: 'DeepSeek V4 Flash' },
      }
      const overrides: Record<string, { name: string; input_per_million: number; output_per_million: number; cache_per_million: number }> = {}
      for (const [key, mapping] of Object.entries(PRICE_KEY_MAP)) {
        const inVal = parseFloat(configMap[key + '_in'])
        const outVal = parseFloat(configMap[key + '_out'])
        const cacheVal = parseFloat(configMap[key + '_cache'])
        if (!isNaN(inVal) && !isNaN(outVal) && !isNaN(cacheVal)) {
          for (const modelId of mapping.modelIds) {
            overrides[modelId] = { name: mapping.name, input_per_million: inVal, output_per_million: outVal, cache_per_million: cacheVal }
          }
        }
      }
      if (Object.keys(overrides).length > 0) updateModelPrices(overrides)
      pricesLoaded = true
    }
  } catch { /* ignore */ }
}
// 聊天消息类型（API用）
interface ApiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// 从数据库获取模型配置
async function getModelConfig() {
  if (!isSupabaseConfigured()) {
    return DEFAULT_MODEL_CONFIG
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('model_config')
      .select('key, value')
    
    if (error || !data) {
      return DEFAULT_MODEL_CONFIG
    }
    
    const configMap = data.reduce((acc, item) => {
      acc[item.key] = item.value
      return acc
    }, {} as Record<string, string>)
    
    return {
      gemini_weight: parseInt(configMap.gemini_weight) || 70,
      claude_weight: parseInt(configMap.claude_weight) || 30,
      routing_mode: (configMap.routing_mode as 'weighted' | 'chapter' | 'manual') || 'weighted',
      gemini_model: configMap.gemini_model || 'gemini-2.5-pro-06-05',
      claude_model: configMap.claude_model || 'claude-sonnet-4-20250514',
      fan_model: configMap.fan_model || 'deepseek-v4-flash',
    }
  } catch {
    return DEFAULT_MODEL_CONFIG
  }
}

// 记录API使用到数据库
async function recordUsage(
  userId: string,
  model: string,
  feature: string,
  tokensIn: number,
  tokensOut: number,
  costRmb: number
) {
  if (!isSupabaseConfigured()) return
  
  try {
    await supabaseAdmin.from('api_usage').insert({
      user_id: userId,
      model,
      feature,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_rmb: costRmb,
    })
  } catch (error) {
    console.error('Failed to record usage:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 确保价格从DB加载
    await ensurePricesLoaded()
    
    const body = await request.json()
    const { 
      messages, 
      chatType, 
      userId, 
      identity,
      intimacyDad,
      intimacyMom,
      isFanMode = false,
      memoryNotes,
    } = body
    
    if (!messages || !chatType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // 获取模型配置
    const config = await getModelConfig()
    
    // 确定发送者
    const sender = chatType === 'family' ? 'family' : chatType === 'dad' ? 'dad' : 'mom'
    
    // 确定用户身份
    const userIdentity: UserIdentity = identity || {
      roleA_name: '爸爸',
      roleB_name: '妈妈',
      user_name: '宝贝',
      family_mode: '爸妈',
    }
    
    // 计算当前章节
    const totalIntimacy = (intimacyDad || 0) + (intimacyMom || 0)
    const currentChapter = getChapterByIntimacy(totalIntimacy)
    
    // 构建消息历史
    const chatHistory: ApiChatMessage[] = messages.map((m: { sender: string; content: string }) => ({
      role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }))
    
    // 生成系统提示（异步加载世界书）
    const systemPrompt = await generateSystemPrompt(userIdentity, currentChapter, sender, memoryNotes)
    const allMessages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: systemPrompt },
      ...chatHistory,
    ]
    
    // 调用AI
    const response = await callAI(
      allMessages,
      config,
      userIdentity,
      sender,
      userId || 'anonymous',
      isFanMode
    )
    
    // 记录使用量
    await recordUsage(
      userId || 'anonymous',
      response.model,
      chatType === 'fan' ? 'fan' : 'chat',
      response.tokens_in,
      response.tokens_out,
      response.cost_rmb
    )
    
    return NextResponse.json({
      content: response.content,
      model: response.model,
      cost: response.cost_rmb,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', content: '抱歉，服务出错了～' },
      { status: 500 }
    )
  }
}
