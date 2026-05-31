// System Prompt 模板 - 包含吃醋逻辑和角色设定

import { UserIdentity } from './ai-engine'

// 章节解锁条件
export const CHAPTER_UNLOCK = {
  1: { min: 0, max: 299, name: '地下秘密', unlockMsg: '恭喜解锁第一章：地下秘密' },
  2: { min: 300, max: 599, name: '初见端倪', unlockMsg: '恭喜解锁第二章：初见端倪' },
  3: { min: 600, max: 899, name: '官宣公开', unlockMsg: '恭喜解锁第三章：官宣公开' },
  4: { min: 900, max: 1199, name: '小公主', unlockMsg: '恭喜解锁第四章：小公主' },
  5: { min: 1200, max: 1599, name: '媒体曝光', unlockMsg: '恭喜解锁第五章：媒体曝光' },
  6: { min: 1600, max: Infinity, name: '温馨日常', unlockMsg: '恭喜解锁第六章：温馨日常' },
}

// 生成System Prompt
export function generateSystemPrompt(
  identity: UserIdentity,
  currentChapter: number,
  sender: 'dad' | 'mom' | 'family'
): string {
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
- 对${roleB_name}：偶尔吃醋但更多是默契配合
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
4. ${sender === 'dad' ? '遇到${user_name}撒娇会心软，嘴硬但行动诚实' : '会照顾${user_name}的情绪，细心体贴'}
5. 如果${user_name}不开心，会想办法逗${user_name}开心
6. 章节叙事内容需符合当前解锁进度

【互动建议】
- 可以问问${user_name}今天过得怎么样
- 可以分享一些家庭趣事
- 可以表达对${user_name}的关心
- 适当展现父母之间的默契互动`

  return basePrompt
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
