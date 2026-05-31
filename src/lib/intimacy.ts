// 亲密度系统 V3.1 — 调整节奏：正常1月/级，上头2周/级，佛系2月/级

export interface IntimacyData {
  dad: number
  mom: number
  daily_dad: number
  daily_mom: number
  last_date: string
}

// 每日亲密度上限（每人）
export const DAILY_INTIMACY_LIMIT = 30

// 每次聊天增加的亲密度
export const INTIMACY_PER_MESSAGE = 1

// 亲密度获取值配置
export const INTIMACY_REWARDS = {
  DAILY_CHECKIN: 2,
  CHAT_REPLY: 1,
  CHAT_INITIATE: 2,
  GROUP_CHAT: 1,
  MOMENTS_LIKE: 1,
  MOMENTS_COMMENT: 2,
  MOMENTS_POST: 1,
  WEIBO_INTERACT: 2,
  FORWARD_SUMMARY: 2,
  POMODORO: 3,
  BEDTIME_STORY: 5,
  LIVE_INTERACT: 2,
  CPF_GROUP: 1,
  DIARY: 1,
  MEMO: 1,
  TODO_COMPLETE: 2,
  QUIZ_CORRECT: 10,
  OFFLINE_RETURN: 5,
  CHECKIN_7DAY_BONUS: 15,
  BIRTHDAY_BONUS: 15,
  RECONCILE: 15,
  LIKED_BY_PARENT: 8,
} as const

// 每日上限配置
export const INTIMACY_DAILY_LIMITS = {
  CHECKIN: 1,
  CHAT_REPLY: 15,
  CHAT_INITIATE: 1,
  GROUP_CHAT: 6,
  MOMENTS_LIKE: 3,
  MOMENTS_COMMENT: 3,
  MOMENTS_POST: 1,
  WEIBO_INTERACT: 5,
  FORWARD_SUMMARY: 2,
  POMODORO: 2,
  BEDTIME_STORY: 1,
  LIVE_INTERACT: 1,
  CPF_GROUP: 5,
  DIARY: 1,
  MEMO: 3,
} as const

// 章节阈值（新节奏：每章900分，Ch5→Ch6需1200）
export const CHAPTER_THRESHOLDS = [
  { chapter: 1, name: '地下秘密', min: 0, max: 899 },
  { chapter: 2, name: '暗流涌动', min: 900, max: 1799 },
  { chapter: 3, name: '偷窥真心', min: 1800, max: 2699 },
  { chapter: 4, name: '粉圈潜行', min: 2700, max: 3599 },
  { chapter: 5, name: '官宣天下', min: 3600, max: 4799 },
  { chapter: 6, name: '身份风暴', min: 4800, max: Infinity },
]

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

// 根据亲密度获取当前章节
export function getChapter(intimacy: number): {
  chapter: number
  name: string
  progress: number
  nextAt: number
} {
  for (let i = CHAPTER_THRESHOLDS.length - 1; i >= 0; i--) {
    const c = CHAPTER_THRESHOLDS[i]
    if (intimacy >= c.min) {
      const nextChapter = CHAPTER_THRESHOLDS[i + 1]
      const progress = nextChapter
        ? (intimacy - c.min) / (nextChapter.min - c.min)
        : 1
      return {
        chapter: c.chapter,
        name: c.name,
        progress: Math.min(progress, 1),
        nextAt: nextChapter ? nextChapter.min : Infinity,
      }
    }
  }
  return { chapter: 1, name: '地下秘密', progress: 0, nextAt: 900 }
}

// 亲密度等级显示（兼容旧接口，按章节展示）
export function getIntimacyLevel(total: number): {
  level: number
  title: string
  progress: number
  next: string
} {
  const { chapter, name, progress, nextAt } = getChapter(total)
  return {
    level: chapter,
    title: name,
    progress,
    next: nextAt === Infinity ? '💕' : nextAt.toString(),
  }
}

// 格式化亲密度显示
export function formatIntimacy(value: number): string {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k'
  }
  return value.toString()
}
