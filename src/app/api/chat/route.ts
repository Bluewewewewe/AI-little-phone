import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { callAI, DEFAULT_MODEL_CONFIG, UserIdentity } from '@/lib/ai-engine'
import { generateSystemPrompt, getChapterByIntimacy } from '@/lib/prompts'
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
    const body = await request.json()
    const { 
      messages, 
      chatType, 
      userId, 
      identity,
      intimacyDad,
      intimacyMom,
      isFanMode = false,
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
    
    // 生成系统提示
    const systemPrompt = generateSystemPrompt(userIdentity, currentChapter, sender)
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
