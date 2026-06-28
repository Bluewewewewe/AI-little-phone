/**
 * 聊天记忆系统（本地 localStorage）
 * - 按用户ID隔离存储
 * - 自动提取关键信息分类保存
 * - 不消耗网络请求
 */

export interface ChatMemoryEntry {
  id: string;
  timestamp: number;
  category: 'role_preference' | 'chat_history' | 'game_habit' | 'relationship' | 'other';
  content: string;
  keywords: string[];
  source: string; // 原始对话摘要
}

export interface ChatMemory {
  userId: string;
  version: number;
  updatedAt: number;
  entries: ChatMemoryEntry[];
}

const MEMORY_KEY_PREFIX = 'cp_memory_';
const MEMORY_VERSION = 1;
const MAX_ENTRIES = 200;

function getStorageKey(userId: string): string {
  return `${MEMORY_KEY_PREFIX}${userId}`;
}

/** 加载用户聊天记忆 */
export function loadChatMemory(userId: string): ChatMemory {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      const memory = JSON.parse(raw) as ChatMemory;
      if (memory.version === MEMORY_VERSION) {
        return memory;
      }
    }
  } catch (e) {
    console.warn('Failed to load chat memory:', e);
  }
  return { userId, version: MEMORY_VERSION, updatedAt: Date.now(), entries: [] };
}

/** 保存用户聊天记忆 */
export function saveChatMemory(memory: ChatMemory): void {
  try {
    memory.updatedAt = Date.now();
    localStorage.setItem(getStorageKey(memory.userId), JSON.stringify(memory));
  } catch (e) {
    console.warn('Failed to save chat memory:', e);
    // 如果存储空间不足，删除最旧的条目
    if (memory.entries.length > 50) {
      memory.entries = memory.entries.slice(-50);
      try {
        localStorage.setItem(getStorageKey(memory.userId), JSON.stringify(memory));
      } catch (_) { /* 忽略 */ }
    }
  }
}

/** 从对话中提取关键信息并添加到记忆 */
export function extractAndSaveMemory(
  userId: string,
  userMessage: string,
  aiResponse: string,
  speaker: string
): void {
  const memory = loadChatMemory(userId);
  const combined = userMessage + ' ' + aiResponse;

  // 提取分类
  const categories = detectCategories(combined);
  const keywords = extractKeywords(combined);
  const summary = summarize(userMessage, aiResponse, speaker);

  const entry: ChatMemoryEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    category: categories[0] || 'other',
    content: summary,
    keywords,
    source: `用户: ${userMessage.slice(0, 80)} | ${speaker}: ${aiResponse.slice(0, 80)}`,
  };

  memory.entries.push(entry);

  // 限制条目数量
  if (memory.entries.length > MAX_ENTRIES) {
    memory.entries = memory.entries.slice(-MAX_ENTRIES);
  }

  saveChatMemory(memory);
}

/** 构建记忆上下文文本（注入 AI prompt） */
export function buildMemoryContext(userId: string): string {
  const memory = loadChatMemory(userId);
  if (memory.entries.length === 0) return '';

  const recent = memory.entries.slice(-20);
  const lines: string[] = ['【用户聊天记忆】'];

  // 按分类分组
  const grouped: Record<string, ChatMemoryEntry[]> = {};
  for (const e of recent) {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  }

  const categoryNames: Record<string, string> = {
    role_preference: '角色偏好',
    chat_history: '近期对话',
    game_habit: '使用习惯',
    relationship: '人际关系',
    other: '其他',
  };

  for (const [cat, entries] of Object.entries(grouped)) {
    const name = categoryNames[cat] || cat;
    lines.push(`\n### ${name}`);
    for (const e of entries.slice(-5)) {
      lines.push(`- ${e.content}`);
    }
  }

  return lines.join('\n');
}

/** 检测内容分类 */
function detectCategories(text: string): ChatMemoryEntry['category'][] {
  const cats: ChatMemoryEntry['category'][] = [];

  if (/喜欢|想要|偏好|讨厌|不喜欢|习惯|经常|每次/.test(text)) {
    cats.push('role_preference');
  }
  if (/聊天|说话|回复|消息|对话/.test(text)) {
    cats.push('chat_history');
  }
  if (/游戏|功能|使用|打开|点击|APP|应用/.test(text)) {
    cats.push('game_habit');
  }
  if (/爸爸|妈妈|朋友|关系|亲密度|CP|情侣/.test(text)) {
    cats.push('relationship');
  }
  if (cats.length === 0) {
    cats.push('other');
  }

  return cats;
}

/** 提取关键词 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set(['的', '了', '是', '我', '你', '他', '她', '它', '们', '这', '那', '吗', '呢', '吧', '啊', '哦', '嗯']);
  const words = text.split(/[\s,，。！？、；：""''（）\(\)\[\]【】\n]+/);
  const freq: Record<string, number> = {};

  for (const w of words) {
    if (w.length >= 2 && !stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);
}

/** 生成摘要 */
function summarize(userMsg: string, aiMsg: string, speaker: string): string {
  const maxLen = 100;
  const combined = `[${speaker}] ${aiMsg.slice(0, 60)}`;
  if (combined.length <= maxLen) return combined;
  return combined.slice(0, maxLen - 3) + '...';
}

/** 清空用户记忆 */
export function clearChatMemory(userId: string): void {
  localStorage.removeItem(getStorageKey(userId));
}
