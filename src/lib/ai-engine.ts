// AI双引擎调度系统

import { calculateCost } from './models'

// 接口定义
export interface ModelConfig {
  gemini_weight: number
  claude_weight: number
  routing_mode: 'weighted' | 'chapter' | 'manual'
  gemini_model: string
  claude_model: string
  fan_model: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  tokens_in: number
  tokens_out: number
  cost_rmb: number
}

export interface UserIdentity {
  roleA_name: string      // 爸爸称呼
  roleB_name: string      // 妈妈称呼
  user_name: string       // 女儿称呼
  family_mode: string     // 家庭模式
}

// 默认配置
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  gemini_weight: 70,
  claude_weight: 30,
  routing_mode: 'weighted',
  gemini_model: 'gemini-2.5-pro-06-05',
  claude_model: 'claude-sonnet-4-20250514',
  fan_model: 'deepseek-v4-flash',
}

// 预设回复（当API调用失败时使用）
const FALLBACK_RESPONSES: Record<string, string[]> = {
  dad: [
    '宝贝在想什么呢？爸爸在这里陪你~',
    '今天的天气不错，想不想出去走走？',
    '作业写完了吗？别太累了哦',
    '想爸爸了吗？爸爸也想你了',
    '来，抱一个～',
  ],
  mom: [
    '宝贝回来啦～今天怎么样？',
    '妈妈给你做了好吃的，快来尝尝',
    '想妈妈了？妈妈也想你～',
    '别太晚睡，对身体不好哦',
    '来，让妈妈看看瘦了没',
  ],
  family: [
    '我们一家三口真幸福呀～',
    '宝贝今天乖不乖呀？',
    '一家人的时光最珍贵了',
    '宝贝想和谁聊天呢？',
    '今天发生了什么事呀？说来听听',
  ],
}

// 获取预设回复
function getFallbackReply(sender: 'dad' | 'mom' | 'family'): string {
  const responses = FALLBACK_RESPONSES[sender] || FALLBACK_RESPONSES.family
  return responses[Math.floor(Math.random() * responses.length)]
}

// 情绪检测：判断是否需要强制某个模型
function detectEmotionOverride(userMessage: string): 'claude' | 'gemini' | null {
  const msg = userMessage.toLowerCase()
  
  // 负面情绪 → Claude（更擅长情感共情）
  const negativeEmotions = ['累', '难过', '伤心', '哭', '委屈', '生气', '烦', '困', '不舒服', '痛', 'sad', 'tired', 'cry']
  if (negativeEmotions.some(e => msg.includes(e))) {
    return 'claude'
  }
  
  // 提到另一个爸爸 → 哈基米（Gemini）偏执/吃醋模式
  if (msg.includes('另一个') && (msg.includes('爸') || msg.includes('爹') || msg.includes('父'))) {
    return 'gemini'
  }
  
  return null
}

// 按权重选择模型
function selectModelByWeight(geminiWeight: number, claudeWeight: number): 'gemini' | 'claude' {
  const total = geminiWeight + claudeWeight
  const rand = Math.random() * total
  return rand < geminiWeight ? 'gemini' : 'claude'
}

// 调用Gemini API
async function callGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<{ content: string; tokens_in: number; tokens_out: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  
  const formattedMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  })
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }
  
  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const tokens_in = data.usageMetadata?.promptTokenCount || 0
  const tokens_out = data.usageMetadata?.candidatesTokenCount || content.length / 4
  
  return { content, tokens_in, tokens_out }
}

// 调用Claude API
async function callClaude(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<{ content: string; tokens_in: number; tokens_out: number }> {
  const url = 'https://api.anthropic.com/v1/messages'
  
  const formattedMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }))
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model,
      messages: formattedMessages,
      max_tokens: 2048,
      temperature: 0.9,
    })
  })
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }
  
  const data = await response.json()
  const content = data.content?.[0]?.text || ''
  const tokens_in = data.usage?.input_tokens || 0
  const tokens_out = data.usage?.output_tokens || 0
  
  return { content, tokens_in, tokens_out }
}

// 调用DeepSeek API（粉丝层）
async function callDeepSeek(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<{ content: string; tokens_in: number; tokens_out: number }> {
  const url = 'https://api.deepseek.com/v1/chat/completions'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 1024,
      temperature: 0.8,
    })
  })
  
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }
  
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const tokens_in = data.usage?.prompt_tokens || 0
  const tokens_out = data.usage?.completion_tokens || 0
  
  return { content, tokens_in, tokens_out }
}

// 主调度函数
export async function callAI(
  messages: ChatMessage[],
  config: ModelConfig,
  identity: UserIdentity,
  sender: 'dad' | 'mom' | 'family',
  userId: string,
  isFanMode: boolean = false
): Promise<AIResponse> {
  const geminiKey = process.env.GEMINI_API_KEY
  const claudeKey = process.env.CLAUDE_API_KEY
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  
  // 粉丝模式用DeepSeek
  if (isFanMode) {
    if (!deepseekKey) {
      return {
        content: '粉丝模式暂时不可用哦～',
        model: 'none',
        tokens_in: 0,
        tokens_out: 0,
        cost_rmb: 0,
      }
    }
    
    try {
      const result = await callDeepSeek(deepseekKey, config.fan_model, messages)
      const cost = calculateCost(config.fan_model, result.tokens_in, result.tokens_out)
      return {
        content: result.content,
        model: config.fan_model,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
        cost_rmb: cost,
      }
    } catch (error) {
      console.error('DeepSeek API error:', error)
      return {
        content: '宝贝今天想聊什么呢？',
        model: 'none',
        tokens_in: 0,
        tokens_out: 0,
        cost_rmb: 0,
      }
    }
  }
  
  // 情绪检测覆盖
  const emotionOverride = detectEmotionOverride(messages[messages.length - 1]?.content || '')
  
  // 选择模型
  let selectedModel: 'gemini' | 'claude' | null = null
  
  if (emotionOverride) {
    selectedModel = emotionOverride
  } else {
    selectedModel = selectModelByWeight(config.gemini_weight, config.claude_weight)
  }
  
  // 调用对应API
  try {
    if (selectedModel === 'gemini' && geminiKey) {
      const result = await callGemini(geminiKey, config.gemini_model, messages)
      const cost = calculateCost(config.gemini_model, result.tokens_in, result.tokens_out)
      return {
        content: result.content,
        model: config.gemini_model,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
        cost_rmb: cost,
      }
    } else if (selectedModel === 'claude' && claudeKey) {
      const result = await callClaude(claudeKey, config.claude_model, messages)
      const cost = calculateCost(config.claude_model, result.tokens_in, result.tokens_out)
      return {
        content: result.content,
        model: config.claude_model,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
        cost_rmb: cost,
      }
    }
  } catch (error) {
    console.error(`${selectedModel} API error:`, error)
  }
  
  // API调用失败，返回预设回复
  return {
    content: getFallbackReply(sender),
    model: 'fallback',
    tokens_in: 0,
    tokens_out: 0,
    cost_rmb: 0,
  }
}
