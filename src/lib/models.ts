// 模型价格表（用于成本计算）
// 默认价格——可通过管理后台 model_config 表动态覆盖

export interface ModelPrice {
  name: string
  input_per_million: number   // ¥/百万token
  output_per_million: number  // ¥/百万token
  cache_per_million: number   // ¥/百万token（缓存命中）
}

// 默认价格（硬编码兜底，后台可覆盖）
export const DEFAULT_MODEL_PRICES: Record<string, ModelPrice> = {
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    input_per_million: 9,
    output_per_million: 72,
    cache_per_million: 2.25,
  },
  'gemini-2.5-pro-06-05': {
    name: 'Gemini 2.5 Pro (06-05)',
    input_per_million: 9,
    output_per_million: 72,
    cache_per_million: 2.25,
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    input_per_million: 0.5,
    output_per_million: 2.16,
    cache_per_million: 0.13,
  },
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    input_per_million: 0.5,
    output_per_million: 2.16,
    cache_per_million: 0.13,
  },
  'claude-sonnet-4': {
    name: 'Claude Sonnet 4',
    input_per_million: 21.6,
    output_per_million: 108,
    cache_per_million: 2.16,
  },
  'claude-sonnet-4-20250514': {
    name: 'Claude Sonnet 4 (2025-05-14)',
    input_per_million: 21.6,
    output_per_million: 108,
    cache_per_million: 2.16,
  },
  'claude-opus-4': {
    name: 'Claude Opus 4',
    input_per_million: 108,
    output_per_million: 540,
    cache_per_million: 10.8,
  },
  'deepseek-v4-flash': {
    name: 'DeepSeek V4 Flash',
    input_per_million: 1,
    output_per_million: 2,
    cache_per_million: 0.02,
  },
  'deepseek-chat': {
    name: 'DeepSeek Chat',
    input_per_million: 1,
    output_per_million: 2,
    cache_per_million: 0.02,
  },
}

// 运行时价格表（可被后台配置覆盖）
let runtimePrices: Record<string, ModelPrice> = { ...DEFAULT_MODEL_PRICES }

// 更新运行时价格（从Supabase model_config 读取后调用）
export function updateModelPrices(pricesFromDB: Record<string, ModelPrice>) {
  runtimePrices = { ...DEFAULT_MODEL_PRICES, ...pricesFromDB }
}

// 获取当前生效的价格表
export function getModelPrices(): Record<string, ModelPrice> {
  return runtimePrices
}

// 计算单次API调用的成本
export function calculateCost(
  model: string,
  tokensIn: number,
  tokensOut: number,
  cacheHits: number = 0
): number {
  const prices = runtimePrices[model]
  
  if (!prices) {
    // 未知模型，返回估算值
    return (tokensIn / 1000000) * 10 + (tokensOut / 1000000) * 50
  }

  const inputCost = ((tokensIn - cacheHits) / 1000000) * prices.input_per_million
  const cacheCost = (cacheHits / 1000000) * prices.cache_per_million
  const outputCost = (tokensOut / 1000000) * prices.output_per_million

  return inputCost + cacheCost + outputCost
}

// 获取模型显示名称
export function getModelDisplayName(model: string): string {
  const prices = runtimePrices[model]
  return prices?.name || model
}

// 所有可用模型列表
export const ALL_MODELS = [
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-pro-06-05', label: 'Gemini 2.5 Pro (06-05)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { id: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (2025-05-14)' },
  { id: 'claude-opus-4', label: 'Claude Opus 4' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat' },
]
