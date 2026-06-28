/**
 * 公共记忆系统（Supabase 数据库共享）
 * - 所有用户共享读取
 * - 5分钟缓存减少请求
 * - 管理员审核后写入
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface PublicMemory {
  id: number;
  category: 'worldview' | 'character_setting' | 'activity_record' | 'player_consensus';
  title: string;
  content: string;
  keywords: string[];
  source_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PromotionCandidate {
  id: number;
  user_id: string;
  original_conversation: string;
  extracted_info: string;
  suggested_category: string;
  ai_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export type MemoryCategory = 'worldview' | 'character_setting' | 'activity_record' | 'player_consensus';
export type PromotionStatus = 'pending' | 'approved' | 'rejected';

// ========== 缓存 ==========
let memoryCache: PublicMemory[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

/** 获取所有公共记忆（带缓存） */
export async function getPublicMemories(forceRefresh = false): Promise<PublicMemory[]> {
  const now = Date.now();
  if (!forceRefresh && memoryCache && (now - cacheTimestamp) < CACHE_TTL) {
    return memoryCache;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('public_memories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch public memories:', error);
    return memoryCache ?? [];
  }

  memoryCache = data as PublicMemory[];
  cacheTimestamp = now;
  return memoryCache;
}

/** 按分类获取公共记忆 */
export async function getPublicMemoriesByCategory(category: MemoryCategory): Promise<PublicMemory[]> {
  const all = await getPublicMemories();
  return all.filter(m => m.category === category);
}

/** 构建注入 AI 的公共记忆上下文 */
export function buildPublicMemoryContext(memories: PublicMemory[]): string {
  if (memories.length === 0) return '';

  const categories: Record<string, PublicMemory[]> = {};
  for (const m of memories) {
    if (!categories[m.category]) categories[m.category] = [];
    categories[m.category].push(m);
  }

  let context = '\n【公共记忆（所有玩家共享的知识）】\n';
  const labels: Record<string, string> = {
    worldview: '世界观',
    character_setting: '角色设定',
    activity_record: '活动记录',
    player_consensus: '玩家共识',
  };

  for (const [cat, items] of Object.entries(categories)) {
    context += `\n## ${labels[cat] ?? cat}\n`;
    for (const item of items.slice(0, 5)) {
      context += `- ${item.title}: ${item.content}\n`;
    }
  }

  return context;
}

// ========== 晋升候选 ==========

/** 提交晋升候选 */
export async function submitPromotionCandidate(data: {
  userId: string;
  originalConversation: string;
  extractedInfo: string;
  suggestedCategory: string;
  aiReason: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('promotion_candidates')
    .insert({
      user_id: data.userId,
      original_conversation: data.originalConversation,
      extracted_info: data.extractedInfo,
      suggested_category: data.suggestedCategory,
      ai_reason: data.aiReason,
      status: 'pending',
    });

  if (error) {
    console.error('Failed to submit promotion candidate:', error);
  }
}

/** 获取待审核候选列表 */
export async function getPendingCandidates(): Promise<PromotionCandidate[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('promotion_candidates')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch pending candidates:', error);
    return [];
  }

  return data as PromotionCandidate[];
}

/** 审核候选（通过/拒绝） */
export async function reviewCandidate(
  id: number,
  status: 'approved' | 'rejected',
  reviewerId: string,
  note?: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  // 更新候选状态
  const { error } = await supabase
    .from('promotion_candidates')
    .update({
      status,
      reviewer_id: reviewerId,
      review_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to review candidate:', error);
    return;
  }

  // 如果通过，写入公共记忆
  if (status === 'approved') {
    const { data: candidate } = await supabase
      .from('promotion_candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (candidate) {
      await supabase
        .from('public_memories')
        .insert({
          category: candidate.suggested_category,
          title: candidate.extracted_info.slice(0, 100),
          content: candidate.extracted_info,
          keywords: [],
          source_user_id: candidate.user_id,
        });

      // 清除缓存
      memoryCache = null;
    }
  }
}

/** 获取审核统计 */
export async function getReviewStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
}> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('promotion_candidates')
    .select('status');

  if (error) {
    console.error('Failed to fetch review stats:', error);
    return { pending: 0, approved: 0, rejected: 0 };
  }

  const stats = { pending: 0, approved: 0, rejected: 0 };
  for (const row of data) {
    if (row.status === 'pending') stats.pending++;
    else if (row.status === 'approved') stats.approved++;
    else if (row.status === 'rejected') stats.rejected++;
  }

  return stats;
}

/** 管理员写入公共记忆（直接写入，无需审核） */
export async function adminWriteMemory(data: {
  category: MemoryCategory;
  title: string;
  content: string;
  keywords: string[];
  sourceUserId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('public_memories')
    .insert({
      category: data.category,
      title: data.title,
      content: data.content,
      keywords: data.keywords,
      source_user_id: data.sourceUserId,
    });

  if (error) {
    console.error('Failed to write public memory:', error);
  } else {
    memoryCache = null; // 清除缓存
  }
}
