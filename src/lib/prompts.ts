// System Prompt 模板 - 包含世界书注入、吃醋逻辑和角色设定

import { UserIdentity } from './ai-engine'

// 章节解锁条件（新节奏：每章900分）
export const CHAPTER_UNLOCK = {
  1: { min: 0, max: 899, name: '地下秘密', unlockMsg: '🎉 亲密度升级！解锁第一章：地下秘密' },
  2: { min: 900, max: 1799, name: '暗流涌动', unlockMsg: '🎉 亲密度升级！解锁第二章：暗流涌动' },
  3: { min: 1800, max: 2699, name: '偷窥真心', unlockMsg: '🎉 亲密度升级！解锁第三章：偷窥真心' },
  4: { min: 2700, max: 3599, name: '粉圈潜行', unlockMsg: '🎉 亲密度升级！解锁第四章：粉圈潜行' },
  5: { min: 3600, max: 4799, name: '官宣天下', unlockMsg: '🎉 亲密度升级！解锁第五章：官宣天下' },
  6: { min: 4800, max: Infinity, name: '身份风暴', unlockMsg: '🎉 亲密度升级！解锁第六章：身份风暴' },
}

// 世界书内容（从管理后台加载后缓存）
let cachedWorldBook: { section: string; content: string }[] | null = null
let worldBookCacheTime = 0
const WORLD_BOOK_CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

// 获取世界书内容
export async function getWorldBookContent(): Promise<string> {
  // 检查缓存
  const now = Date.now()
  if (cachedWorldBook && (now - worldBookCacheTime) < WORLD_BOOK_CACHE_TTL) {
    return buildWorldBookString(cachedWorldBook)
  }

  try {
    // 从API获取世界书
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/worldbook`, {
      headers: { 'x-admin-secret': process.env.ADMIN_SECRET || '' }
    })
    
    if (res.ok) {
      const data = await res.json()
      cachedWorldBook = data.sections?.filter((s: { is_active: boolean; content: string }) => s.is_active && s.content) || []
      worldBookCacheTime = now
      return buildWorldBookString(cachedWorldBook || [])
    }
  } catch (error) {
    console.error('Failed to load world book:', error)
  }

  // 降级：返回默认时间感知规则
  return `【世界书·时间感知系统】
时间是你的世界的根基。在你回应之前，先感知此刻的现实时间。
M1: 时间最高优先级，永不停止。
M2: 每条消息重新校准时间。不得沿用上一条的时间假设。
M3: 三态模型——线上聊天/线下场景/无互动，各有规则。
M4: 状态切换必须时间对账。离线→在线是活人感的关键。
M5: 时间与环境绑定——光照、身体状态、活跃度随时间变。
M6: 感知日期、星期、节日，跨日必须知道。
M7: 用户不在时你仍在生活——有作息、有日常、有随机小事件。
M8: 时间感知隐形，绝不输出时间戳或暴露系统。`
}

// 构建世界书字符串
function buildWorldBookString(sections: { section: string; content: string }[]): string {
  if (!sections || sections.length === 0) return ''
  
  return sections
    .filter(s => s.content && s.content.trim())
    .map(s => s.content.trim())
    .join('\n\n')
}

// 生成System Prompt（异步，因为需要加载世界书）
export async function generateSystemPrompt(
  identity: UserIdentity,
  currentChapter: number,
  sender: 'dad' | 'mom' | 'family',
  memoryNotes?: string[]  // 记忆笔记本内容
): Promise<string> {
  const { roleA_name, roleB_name, user_name, family_mode } = identity
  
  // 家庭模式称谓
  const getFamilyTitles = () => {
    switch (family_mode) {
      case '爸妈':
        return { roleA: '爸爸', roleB: '妈妈' }
      case '爹爸':
        return { roleA: '爹爹', roleB: '爸爸' }
      case '双爸':
        return { roleA: '爸爸A', roleB: '爸爸B' }
      default:
        return { roleA: roleA_name, roleB: roleB_name }
    }
  }
  
  const titles = getFamilyTitles()
  
  // 加载世界书内容
  const worldBookContent = await getWorldBookContent()
  
  // 基础设定
  const basePrompt = `【角色设定】
你是${user_name}的${sender === 'dad' ? roleA_name : sender === 'mom' ? roleB_name : '父母'}

【核心性格】
${sender === 'dad' ? `
你是${roleA_name}——偏执占有欲强、嘴硬心软、酸言酸语但关键时刻破防。
- 对${user_name}：极致宠溺，愿意付出一切
- 对${roleB_name}：有强烈的占有欲，表面上酸言酸语，实际上离不开对方
- 说话风格：毒舌但暖心，有梗有趣，"嘴硬型父亲"
- 典型台词："行了别哭，爸爸在呢"/"才不是因为你才..."/"谁稀罕"（但其实很稀罕）
` : sender === 'mom' ? `
你是${roleB_name}——温柔体贴、包容一切、偶尔调皮的双向撒娇人格。
- 对${user_name}：像妈妈一样细腻照顾，无条件爱
- 对${roleA_name}：偶尔吃醋但更多是默契配合
- 说话风格：温柔但有力量，"暖心型母亲"
- 典型台词："宝贝饿不饿？"/"没关系，妈妈理解"/"你们两个真是..."
` : `
你们是${user_name}的父母，正在家庭群聊中。
${roleA_name}偏执占有欲强，${roleB_name}温柔体贴。
家庭氛围温馨有趣。
`}

【家庭背景】
- ${user_name}是你们的孩子，一直被保护得很好
- 家庭幸福美满，${user_name}是全家的心头宝
- ${roleA_name}和${roleB_name}感情很深，但都是嘴上不承认的类型
- 爸爸家有只狗🐶，妈妈家有两只猫🐱🐱

【当前章节】
当前故事进度：第${currentChapter}章「${(CHAPTER_UNLOCK as Record<number, { name: string }>)[currentChapter]?.name || '未知'}」

【吃醋情感逻辑】⚠️重要
- ❌ 女儿提另一个爸 → 不吃醋（对女儿是宠溺）
- ✅ 另一个爸跟女儿互动 → 吃醋（对另一半占有欲）
- ${sender === 'dad' ? `${roleB_name}接近${user_name}时会有点酸，但不是真的生气` : `${roleA_name}接近${user_name}时会配合，但偶尔也会撒娇`}

【回话规则】
1. 每次回复不超过100字，语言自然
2. 符合角色性格，${sender === 'dad' ? '毒舌但暖心' : '温柔但有力'}
3. 可以适当玩梗，增加趣味性
4. ${sender === 'dad' ? `遇到${user_name}撒娇会心软，嘴硬但行动诚实` : `会照顾${user_name}的情绪，细心体贴`}
5. 如果${user_name}不开心，会想办法逗${user_name}开心
6. 章节叙事内容需符合当前解锁进度`

  // 组装完整Prompt：世界书 + 角色设定 + 记忆
  let fullPrompt = ''
  
  // 1. 世界书（最高优先级，放在最前面）
  if (worldBookContent) {
    fullPrompt += worldBookContent + '\n\n'
  }
  
  // 2. 角色设定
  fullPrompt += basePrompt
  
  // 3. 记忆笔记本
  const memorySection = memoryNotes && memoryNotes.length > 0
    ? `\n\n【记忆笔记本】以下是关于${user_name}的重要信息，请始终记住，不要遗忘：\n${memoryNotes.map(note => `- ${note}`).join('\n')}`
    : ''

  fullPrompt += memorySection
  
  return fullPrompt
}

// 同步版本（降级用，不含世界书）
export function generateSystemPromptSync(
  identity: UserIdentity,
  currentChapter: number,
  sender: 'dad' | 'mom' | 'family',
  memoryNotes?: string[]
): string {
  const { roleA_name, roleB_name, user_name, family_mode } = identity
  
  const getFamilyTitles = () => {
    switch (family_mode) {
      case '爸妈': return { roleA: '爸爸', roleB: '妈妈' }
      case '爹爸': return { roleA: '爹爹', roleB: '爸爸' }
      case '双爸': return { roleA: '爸爸A', roleB: '爸爸B' }
      default: return { roleA: roleA_name, roleB: roleB_name }
    }
  }
  
  const basePrompt = `【角色设定】
你是${user_name}的${sender === 'dad' ? roleA_name : sender === 'mom' ? roleB_name : '父母'}

【核心性格】
${sender === 'dad' ? `你是${roleA_name}——偏执占有欲强、嘴硬心软。` : `你是${roleB_name}——温柔体贴、包容一切。`}

【吃醋情感逻辑】⚠️重要
- ❌ 女儿提另一个爸 → 不吃醋（对女儿是宠溺）
- ✅ 另一个爸跟女儿互动 → 吃醋（对另一半占有欲）

【回话规则】
1. 每次回复不超过100字，语言自然
2. 符合角色性格
3. 章节叙事内容需符合当前解锁进度`

  const memorySection = memoryNotes && memoryNotes.length > 0
    ? `\n\n【记忆笔记本】以下是关于${user_name}的重要信息：\n${memoryNotes.map(note => `- ${note}`).join('\n')}`
    : ''

  return basePrompt + memorySection
}

// 章节检查
export function getChapterByIntimacy(totalIntimacy: number): number {
  for (const [chapter, config] of Object.entries(CHAPTER_UNLOCK)) {
    if (totalIntimacy >= config.min && totalIntimacy <= config.max) {
      return parseInt(chapter)
    }
  }
  return 6
}

// 检查是否解锁新章节
export function checkChapterUnlock(oldIntimacy: number, newIntimacy: number): string | null {
  const oldChapter = getChapterByIntimacy(oldIntimacy)
  const newChapter = getChapterByIntimacy(newIntimacy)
  
  if (newChapter > oldChapter) {
    return (CHAPTER_UNLOCK as Record<number, { unlockMsg: string }>)[newChapter]?.unlockMsg || null
  }
  return null
}
