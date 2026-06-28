/**
 * 聊天记忆系统 - localStorage 存储，按用户ID隔离
 * 每次AI对话后自动提取关键信息，按分类保存
 */

const STORAGE_PREFIX = 'cp_chat_memory_v1_';

export interface MemoryEntry {
  id: string;
  category: 'character_preference' | 'conversation_history' | 'game_habit' | 'personal_info' | 'other';
  content: string;
  source: string;
  timestamp: number;
}

export interface ChatMemoryStore {
  userId: string;
  entries: MemoryEntry[];
  lastUpdated: number;
}

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadChatMemory(userId: string): ChatMemoryStore {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) return JSON.parse(raw) as ChatMemoryStore;
  } catch (e) { /* ignore */ }
  return { userId, entries: [], lastUpdated: Date.now() };
}

export function saveChatMemory(store: ChatMemoryStore): void {
  try {
    store.lastUpdated = Date.now();
    localStorage.setItem(getStorageKey(store.userId), JSON.stringify(store));
  } catch (e) { /* ignore */ }
}

export function addMemoryEntry(
  userId: string,
  entry: Omit<MemoryEntry, 'id' | 'timestamp'>
): void {
  const store = loadChatMemory(userId);
  const newEntry: MemoryEntry = {
    ...entry,
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  store.entries.push(newEntry);

  // 每个分类最多保留30条
  const byCategory = new Map<string, MemoryEntry[]>();
  for (const e of store.entries) {
    const list = byCategory.get(e.category) || [];
    list.push(e);
    byCategory.set(e.category, list);
  }
  for (const [cat, list] of byCategory) {
    if (list.length > 30) {
      list.sort((a, b) => b.timestamp - a.timestamp);
      const keep = new Set(list.slice(0, 30).map(e => e.id));
      store.entries = store.entries.filter(e => e.category !== cat || keep.has(e.id));
    }
  }
  saveChatMemory(store);
}

export function getMemoryContext(userId: string): string {
  const store = loadChatMemory(userId);
  if (store.entries.length === 0) return '';

  const recent = [...store.entries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  const byCategory: Record<string, MemoryEntry[]> = {};
  for (const e of recent) {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category].push(e);
  }

  const lines: string[] = ['【用户聊天记忆 - AI 已知信息】'];
  const names: Record<string, string> = {
    character_preference: '角色偏好',
    conversation_history: '对话历史',
    game_habit: '游戏习惯',
    personal_info: '个人信息',
    other: '其他',
  };
  for (const [cat, entries] of Object.entries(byCategory)) {
    lines.push(`\n## ${names[cat] || cat}`);
    for (const e of entries) lines.push(`- ${e.content}`);
  }
  return lines.join('\n');
}

export function getRecentMemories(userId: string, limit = 10): MemoryEntry[] {
  const store = loadChatMemory(userId);
  return [...store.entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export function addMemoryBatch(
  userId: string,
  entries: Omit<MemoryEntry, 'id' | 'timestamp'>[]
): void {
  for (const entry of entries) {
    addMemoryEntry(userId, entry);
  }
}

export function clearChatMemory(userId: string): void {
  localStorage.removeItem(getStorageKey(userId));
}
