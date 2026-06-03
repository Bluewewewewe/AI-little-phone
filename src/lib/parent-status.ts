// 👀 爸妈状态系统 - 基于时间推进

export interface ParentStatus {
  id: 'tianlei' | 'ziyu'
  name: string
  icon: string
  status: 'home' | 'out' | 'busy' | 'sleeping'
  location: string
  activity: string
  mood: 'happy' | 'annoyed' | 'sleepy' | 'loving' | 'angry'
  emoji: string
}

// 基础日程表
const SCHEDULE: Record<string, Record<number, Partial<ParentStatus>>> = {
  tianlei: {
    7: { status: 'home', location: '厨房', activity: '做早餐🍳', mood: 'happy', emoji: '🍳' },
    8: { status: 'out', location: '外出', activity: '出门上班💼', mood: 'happy', emoji: '💼' },
    9: { status: 'out', location: '公司', activity: '开会中📊', mood: 'busy' as any, emoji: '📊' },
    10: { status: 'out', location: '公司', activity: '处理工作💻', mood: 'annoyed', emoji: '💻' },
    11: { status: 'out', location: '公司', activity: '和同事讨论', mood: 'happy', emoji: '💬' },
    12: { status: 'out', location: '公司', activity: '午休吃面🍜', mood: 'happy', emoji: '🍜' },
    13: { status: 'out', location: '公司', activity: '下午工作', mood: 'annoyed', emoji: '😤' },
    14: { status: 'out', location: '公司', activity: '开会...', mood: 'annoyed', emoji: '😩' },
    15: { status: 'out', location: '公司', activity: '摸鱼看梓渝朋友圈📱', mood: 'loving', emoji: '📱' },
    16: { status: 'out', location: '公司', activity: '准备下班🚗', mood: 'happy', emoji: '🚗' },
    17: { status: 'home', location: '路上', activity: '回家路上🚗', mood: 'happy', emoji: '🚗' },
    18: { status: 'home', location: '客厅', activity: '到家了，换鞋', mood: 'happy', emoji: '🏠' },
    19: { status: 'home', location: '客厅', activity: '看电视📱', mood: 'happy', emoji: '📺' },
    20: { status: 'home', location: '客厅', activity: '陪梓渝聊天😊', mood: 'loving', emoji: '😊' },
    21: { status: 'home', location: '客厅', activity: '和梓渝一起看剧🎬', mood: 'loving', emoji: '🎬' },
    22: { status: 'home', location: '浴室', activity: '洗澡🚿', mood: 'happy', emoji: '🚿' },
    23: { status: 'sleeping', location: '卧室', activity: '...💤', mood: 'sleepy', emoji: '💤' },
  },
  ziyu: {
    7: { status: 'home', location: '卧室', activity: '赖床😴', mood: 'sleepy', emoji: '😴' },
    8: { status: 'home', location: '卧室', activity: '被田雷叫起来😤→😊', mood: 'annoyed', emoji: '😤' },
    9: { status: 'home', location: '卧室', activity: '化妆💄', mood: 'happy', emoji: '💄' },
    10: { status: 'out', location: '外出', activity: '逛街🛍️', mood: 'happy', emoji: '🛍️' },
    11: { status: 'out', location: '咖啡厅', activity: '和朋友喝咖啡☕', mood: 'happy', emoji: '☕' },
    12: { status: 'out', location: '外面', activity: '和朋友吃午饭', mood: 'happy', emoji: '🍱' },
    13: { status: 'home', location: '客厅', activity: '追剧📺', mood: 'happy', emoji: '📺' },
    14: { status: 'home', location: '客厅', activity: '刷手机📱', mood: 'happy', emoji: '📱' },
    15: { status: 'home', location: '阳台', activity: '晒太阳+撸猫🪴', mood: 'happy', emoji: '☀️' },
    16: { status: 'home', location: '厨房', activity: '准备做晚饭🍳', mood: 'happy', emoji: '🍳' },
    17: { status: 'home', location: '厨房', activity: '做晚饭中🍳', mood: 'happy', emoji: '🍳' },
    18: { status: 'home', location: '厨房', activity: '饭做好了！叫田雷吃饭', mood: 'happy', emoji: '🍲' },
    19: { status: 'home', location: '客厅', activity: '吃晚饭+聊天', mood: 'loving', emoji: '💕' },
    20: { status: 'home', location: '客厅', activity: '靠在田雷旁边刷手机📱', mood: 'loving', emoji: '📱' },
    21: { status: 'home', location: '客厅', activity: '跟田雷撒娇🥺', mood: 'loving', emoji: '🥺' },
    22: { status: 'home', location: '浴室', activity: '护肤💆', mood: 'happy', emoji: '💆' },
    23: { status: 'sleeping', location: '卧室', activity: '...💤', mood: 'sleepy', emoji: '💤' },
  },
}

// 亲密度影响（不同章节的甜蜜度）
const INTIMACY_EFFECTS: Record<number, { eveningActivity: string; publicDisplay: string }> = {
  1: { eveningActivity: '各自坐在沙发一边', publicDisplay: '有点距离感' },
  2: { eveningActivity: '梓渝偶尔靠过来', publicDisplay: '偶尔互动' },
  3: { eveningActivity: '田雷搂着梓渝看电视', publicDisplay: '经常靠一起' },
  4: { eveningActivity: '厨房里偷偷亲', publicDisplay: '甜蜜日常' },
  5: { eveningActivity: '田雷抱着梓渝不撒手', publicDisplay: '粘人日常' },
  6: { eveningActivity: '各种暗戳戳撒狗粮', publicDisplay: '老夫老妻甜蜜' },
}

// 随机事件
interface RandomEvent {
  id: string
  name: string
  tianleiActivity: string
  ziyuActivity: string
  tianleiMood: ParentStatus['mood']
  ziyuMood: ParentStatus['mood']
  triggerHour: number[]
  probability: number
  intimacyMin?: number
}

const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: 'argue', name: '吵架',
    tianleiActivity: '在客厅摔手机😤', ziyuActivity: '在卧室生闷气🙄',
    tianleiMood: 'angry', ziyuMood: 'annoyed',
    triggerHour: [19, 20, 21], probability: 0.08, intimacyMin: 0,
  },
  {
    id: 'reconcile', name: '和好',
    tianleiActivity: '在门口堵梓渝🥺', ziyuActivity: '嘴硬但心软😤→😊',
    tianleiMood: 'loving', ziyuMood: 'loving',
    triggerHour: [20, 21, 22], probability: 0.1, intimacyMin: 300,
  },
  {
    id: 'cook_together', name: '一起做饭',
    tianleiActivity: '在厨房笨手笨脚🍳', ziyuActivity: '在旁边指挥+偷吃😋',
    tianleiMood: 'happy', ziyuMood: 'happy',
    triggerHour: [17, 18], probability: 0.15, intimacyMin: 600,
  },
  {
    id: 'exercise', name: '健身',
    tianleiActivity: '在阳台健身💪', ziyuActivity: '在旁边看+递水🧴',
    tianleiMood: 'happy', ziyuMood: 'loving',
    triggerHour: [15, 16], probability: 0.1, intimacyMin: 0,
  },
  {
    id: 'video_call', name: '视频通话',
    tianleiActivity: '在跟你视频📱', ziyuActivity: '凑过来抢镜🤳',
    tianleiMood: 'loving', ziyuMood: 'loving',
    triggerHour: [19, 20, 21], probability: 0.12, intimacyMin: 300,
  },
  {
    id: 'cuddling', name: '甜蜜时刻',
    tianleiActivity: '抱着梓渝看电视🤗', ziyuActivity: '靠在田雷怀里😊',
    tianleiMood: 'loving', ziyuMood: 'loving',
    triggerHour: [20, 21, 22], probability: 0.2, intimacyMin: 900,
  },
]

// 获取当前时间对应的状态
export function getParentStatus(
  parent: 'tianlei' | 'ziyu',
  chapter: number = 1,
  intimacyDad: number = 0,
  intimacyMom: number = 0,
): ParentStatus {
  const hour = new Date().getHours()
  const schedule = SCHEDULE[parent]
  
  // 默认状态
  const defaultStatus: ParentStatus = {
    id: parent,
    name: parent === 'tianlei' ? '田雷' : '梓渝',
    icon: parent === 'tianlei' ? '👨' : '🧑',
    status: 'sleeping',
    location: '卧室',
    activity: '睡着了💤',
    mood: 'sleepy',
    emoji: '💤',
  }
  
  // 找到当前小时的状态
  let currentStatus = schedule[hour]
  if (!currentStatus) {
    // 0-6点都在睡觉
    return defaultStatus
  }
  
  // 检查随机事件
  const randomEvent = checkRandomEvent(hour, chapter, intimacyDad + intimacyMom)
  if (randomEvent) {
    return {
      id: parent,
      name: parent === 'tianlei' ? '田雷' : '梓渝',
      icon: parent === 'tianlei' ? '👨' : '🧑',
      status: currentStatus.status || 'home',
      location: currentStatus.location || '家里',
      activity: parent === 'tianlei' ? randomEvent.tianleiActivity : randomEvent.ziyuActivity,
      mood: parent === 'tianlei' ? randomEvent.tianleiMood : randomEvent.ziyuMood,
      emoji: currentStatus.emoji || '🏠',
    }
  }
  
  // 亲密度修正（晚上时段）
  if (hour >= 20 && hour <= 22) {
    const effect = INTIMACY_EFFECTS[chapter] || INTIMACY_EFFECTS[1]
    return {
      id: parent,
      name: parent === 'tianlei' ? '田雷' : '梓渝',
      icon: parent === 'tianlei' ? '👨' : '🧑',
      status: 'home',
      location: '客厅',
      activity: effect.eveningActivity,
      mood: 'loving',
      emoji: '💕',
    }
  }
  
  return {
    id: parent,
    name: parent === 'tianlei' ? '田雷' : '梓渝',
    icon: parent === 'tianlei' ? '👨' : '🧑',
    status: currentStatus.status || 'home',
    location: currentStatus.location || '家里',
    activity: currentStatus.activity || '在家',
    mood: currentStatus.mood || 'happy',
    emoji: currentStatus.emoji || '🏠',
  }
}

function checkRandomEvent(hour: number, chapter: number, totalIntimacy: number): RandomEvent | null {
  const eligible = RANDOM_EVENTS.filter(e => 
    e.triggerHour.includes(hour) && 
    (e.intimacyMin || 0) <= totalIntimacy
  )
  
  for (const event of eligible) {
    if (Math.random() < event.probability) {
      return event
    }
  }
  return null
}

// 偷看细节 - 模板+AI混合
export function getPeekDetail(parent: 'tianlei' | 'ziyu', chapter: number): { detail: string; needAI: boolean } {
  const templates: Record<string, string[]> = {
    tianlei_loving: [
      '田雷正偷偷看梓渝的侧脸，嘴角不自觉上扬...',
      '田雷的手搭在梓渝肩上，拇指轻轻画圈...',
      '田雷凑到梓渝耳边不知道说了什么，梓渝脸红了',
    ],
    tianlei_annoyed: [
      '田雷皱着眉头看手机，大概是工作消息又来了',
      '田雷在客厅来回踱步，嘴上嘟囔着什么',
      '田雷盯着梓渝的方向叹了口气，又低头看手机',
    ],
    tianlei_sleeping: [
      '田雷睡了，但手还搭在梓渝那边...',
      '田雷的呼吸很均匀，辛巴趴在他脚边',
    ],
    ziyu_loving: [
      '梓渝正靠在田雷怀里玩手机，偶尔抬头看他一眼',
      '梓渝把头埋在田雷肩膀上，大鱼在旁边看着',
      '梓渝在给田雷整理衣领，嘴里念叨着"都不好好穿衣服"',
    ],
    ziyu_annoyed: [
      '梓渝翻了个白眼，大概田雷又说了什么气人的话',
      '梓渝一个人在阳台发呆，小十一蹭过来安慰',
      '梓渝抱起大鱼不说话，大鱼也配合地蹭蹭',
    ],
    ziyu_sleeping: [
      '梓渝睡了，大鱼蜷在枕边',
      '梓渝抱着小十一的玩偶睡着了，田雷在旁边看着笑',
    ],
  }
  
  const status = getParentStatus(parent, chapter)
  const mood = status.mood
  const key = `${parent}_${mood}`
  const list = templates[key] || templates[`${parent}_happy`] || ['正在家里...']
  
  // 70%模板，30%AI
  const needAI = Math.random() < 0.3
  
  if (!needAI) {
    return { detail: list[Math.floor(Math.random() * list.length)], needAI: false }
  }
  
  return { detail: '', needAI: true }
}

// 深夜卧室场景
export function getBedroomScene(chapter: number): string {
  if (chapter < 3) return '门关着...💤 "晚安宝贝~"'
  if (chapter < 5) return '🔒 门关着...隐约听到说话声..."大人的事小孩别管😤"'
  return '🔒 门关着...🤭 "去睡吧宝贝，爸妈还有事...别进来😤"'
}
