/**
 * 公共记忆系统 - Supabase 存储，所有用户共享读取
 * 5分钟缓存减少请求
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!supabase) supabase = getSupabaseClient();
  return supabase;
}

export interface PublicMemory {
  id: string;
  category: 'worldview' | 'character_setting' | 'activity_record' | 'player_consensus' | 'general';
  content: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface PromotionCandidate {
  id: string;
  user_id: string;
  original_message: string;
  ai_reason: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_category?: string;
  edited_content?: string;
  created_at: string;
  updated_at: string;
}

// 缓存
let memoryCache: PublicMemory[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

export async function getPublicMemories(): Promise<PublicMemory[]> {
  const now = Date.now();
  if (memoryCache && now - cacheTimestamp < CACHE_TTL) {
    return memoryCache;
  }

  const { data, error } = await getClient()
    .from('public_memories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取公共记忆失败:', error);
    return memoryCache || [];
  }

  memoryCache = data as PublicMemory[];
  cacheTimestamp = now;
  return memoryCache;
}

export function clearMemoryCache(): void {
  memoryCache = null;
  cacheTimestamp = 0;
}

export async function getPublicMemoriesByCategory(
  category: string
): Promise<PublicMemory[]> {
  const all = await getPublicMemories();
  return all.filter(m => m.category === category);
}

export function getPublicMemoryContext(memories: PublicMemory[]): string {
  if (memories.length === 0) return '';

  const byCategory: Record<string, PublicMemory[]> = {};
  for (const m of memories) {
    if (!byCategory[m.category]) byCategory[m.category] = [];
    byCategory[m.category].push(m);
  }

  const lines: string[] = ['【公共记忆 - 共享世界观】'];
  const names: Record<string, string> = {
    worldview: '世界观',
    character_setting: '角色设定',
    activity_record: '活动记录',
    player_consensus: '玩家共识',
    general: '综合',
  };

  for (const [cat, entries] of Object.entries(byCategory)) {
    lines.push(`\n## ${names[cat] || cat}`);
    for (const e of entries) {
      lines.push(`- ${e.content}`);
    }
  }
  return lines.join('\n');
}

// 晋升候选
export async function submitPromotionCandidate(
  userId: string,
  originalMessage: string,
  aiReason: string,
  category: string = 'general'
): Promise<boolean> {
  if (!supabase) { console.error('Supabase 未初始化'); return false; }
  const { error } = await supabase
    .from('promotion_candidates')
    .insert({
      user_id: userId,
      original_message: originalMessage,
      ai_reason: aiReason,
      category,
      status: 'pending',
    });

  if (error) {
    console.error('提交晋升候选失败:', error);
    return false;
  }
  return true;
}

export async function getPromotionCandidates(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<PromotionCandidate[]> {
  if (!supabase) { console.error('Supabase 未初始化'); return []; }
  let query = supabase
    .from('promotion_candidates')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('获取晋升候选失败:', error);
    return [];
  }
  return data as PromotionCandidate[];
}

export async function approvePromotionCandidate(
  candidateId: string,
  approvedBy: string,
  category: string,
  editedContent?: string
): Promise<boolean> {
  // 更新候选状态
  if (!supabase) { console.error('Supabase 未初始化'); return false; }
  const { error: updateError } = await supabase
    .from('promotion_candidates')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_category: category,
      edited_content: editedContent || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', candidateId);

  if (updateError) {
    console.error('审批更新失败:', updateError);
    return false;
  }

  if (!supabase) return false;
  // 获取候选内容
  const { data: candidate } = await supabase
    .from('promotion_candidates')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (candidate) {
    const content = editedContent || candidate.original_message;
    const { error: insertError } = await supabase
      .from('public_memories')
      .insert({
        category,
        content,
        source: `晋升自用户 ${candidate.user_id}`,
      });

    if (insertError) {
      console.error('写入公共记忆失败:', insertError);
      return false;
    }
    clearMemoryCache();
  }

  return true;
}

export async function rejectPromotionCandidate(candidateId: string): Promise<boolean> {
  const { error } = await getClient()
    .from('promotion_candidates')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', candidateId);

  return !error;
}

export async function getPromotionStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
}> {
  const { data, error } = await getClient()
    .from('promotion_candidates')
    .select('status');

  if (error) return { pending: 0, approved: 0, rejected: 0 };

  const stats = { pending: 0, approved: 0, rejected: 0 };
  for (const row of data) {
    if (row.status === 'pending') stats.pending++;
    else if (row.status === 'approved') stats.approved++;
    else if (row.status === 'rejected') stats.rejected++;
  }
  return stats;
}
