// 亲密度系统

export interface IntimacyData {
  dad: number
  mom: number
  daily_dad: number
  daily_mom: number
  last_date: string
}

// 每日亲密度上限
export const DAILY_INTIMACY_LIMIT = 30

// 每次聊天增加的亲密度
export const INTIMACY_PER_MESSAGE = 3

// 计算总亲密度
export function getTotalIntimacy(dad: number, mom: number): number {
  return dad + mom
}

// 检查今日是否还能增加亲密度
export function canIncreaseIntimacy(dailyCount: number): boolean {
  return dailyCount < DAILY_INTIMACY_LIMIT
}

// 获取今日剩余亲密度
export function getRemainingIntimacy(dailyCount: number): number {
  return Math.max(0, DAILY_INTIMACY_LIMIT - dailyCount)
}

// 重置每日计数（日期变更时）
export function shouldResetDaily(lastDate: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return lastDate !== today
}

// 亲密度等级显示
export function getIntimacyLevel(total: number): {
  level: number
  title: string
  progress: number
  next: string
} {
  if (total < 50) {
    return { level: 1, title: '初识', progress: total / 50, next: '50' }
  } else if (total < 150) {
    return { level: 2, title: '熟悉', progress: (total - 50) / 100, next: '150' }
  } else if (total < 300) {
    return { level: 3, title: '亲近', progress: (total - 150) / 150, next: '300' }
  } else if (total < 500) {
    return { level: 4, title: '信任', progress: (total - 300) / 200, next: '500' }
  } else if (total < 800) {
    return { level: 5, title: '亲密', progress: (total - 500) / 300, next: '800' }
  } else {
    return { level: 6, title: '家人', progress: (total - 800) / 200, next: '💕' }
  }
}

// 格式化亲密度显示
export function formatIntimacy(value: number): string {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k'
  }
  return value.toString()
}
