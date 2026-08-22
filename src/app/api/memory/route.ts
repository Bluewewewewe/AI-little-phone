/**
 * 记忆提取 API - AI 自动从对话中提取关键信息
 * POST: 提取聊天记忆 + 判断是否晋升公共记忆 + 跨用户重复检测
 */

import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getModelForScene } from '@/lib/config';
import { detectCrossUserDuplicates, computeContentFingerprint } from '@/lib/duplicate-detector';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuthRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthRequest(request);
    const userId = authUser.userId;

    const { message, reply } = await request.json();

    if (!message || !reply) {
      return new Response(JSON.stringify({ error: '缺少参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const prompt = `你是一个记忆提取助手。分析以下对话，完成两个任务：

【任务1：提取聊天记忆】
从对话中提取对AI有帮助的关键信息，按分类输出：
- character_preference（角色偏好）：用户对角色/CP的喜好
- conversation_history（对话历史）：重要的对话内容摘要
- game_habit（游戏习惯）：用户的玩法习惯
- personal_info（个人信息）：用户透露的个人信息
- other（其他）：其他值得记住的信息

每条记忆要求：简洁（15字以内）、客观、不含隐私敏感信息。
最多提取3条，没有值得记的就输出空数组。

【任务2：判断是否晋升公共记忆】
判断标准（满足任一即可晋升）：
1. 不是个人偏好（如"我喜欢XX"不算），且可能被多个用户需要
2. 涉及游戏核心内容（世界观/角色设定/玩法机制等）
如果符合，输出晋升理由（20字以内）；不符合输出 null。

注意：即使 AI 判断不应该晋升，系统还会进行跨用户重复检测——如果多个用户都提到了相似内容，会自动触发晋升。

【对话】
用户: ${message}
AI: ${reply}

请用JSON格式回复（不要markdown代码块）：
{
  "memories": [
    {"category": "分类", "content": "记忆内容", "source": "来源摘要"}
  ],
  "promotion": {
    "should_promote": true/false,
    "reason": "晋升理由或null",
    "category": "worldview/character_setting/activity_record/player_consensus/general"
  }
}`;

    const model = getModelForScene('auto');
    const result = await client.invoke([{ role: 'user', content: prompt }], {
      model,
      temperature: 0.3,
    });

    // 解析 JSON
    let parsed: {
      memories: Array<{ category: string; content: string; source: string }>;
      promotion: { should_promote: boolean; reason: string | null; category: string };
    };

    try {
      const cleaned = result.content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { memories: [], promotion: { should_promote: false, reason: null, category: 'general' } };
    }

    // ========== 跨用户重复检测 ==========
    // 对每条可能晋升的记忆做跨用户检测
    const duplicateResults: Array<{
      memoryContent: string;
      hasDuplicates: boolean;
      uniqueUserCount: number;
      shouldAutoPromote: boolean;
      boostReason: string | null;
      matches: Array<{ userId: string; originalMessage: string; similarity: number }>;
    }> = [];

    for (const mem of parsed.memories || []) {
      const dupResult = await detectCrossUserDuplicates(mem.content, userId);
      duplicateResults.push({
        memoryContent: mem.content,
        hasDuplicates: dupResult.hasDuplicates,
        uniqueUserCount: dupResult.uniqueUserCount,
        shouldAutoPromote: dupResult.shouldAutoPromote,
        boostReason: dupResult.boostReason,
        matches: dupResult.matches.map(m => ({
          userId: m.userId,
          originalMessage: m.originalMessage,
          similarity: m.similarity,
        })),
      });
    }

    // 跨用户重复增强：如果有任何记忆被多用户提及，强制晋升
    let finalPromotion = parsed.promotion || { should_promote: false, reason: null, category: 'general' };
    const boostedByDuplicate = duplicateResults.some(d => d.shouldAutoPromote);

    if (boostedByDuplicate && !finalPromotion.should_promote) {
      // 找出触发增强的记忆
      const boosted = duplicateResults.find(d => d.shouldAutoPromote);
      finalPromotion = {
        should_promote: true,
        reason: `[跨用户增强] ${boosted?.boostReason || '多用户重复提及'}`,
        category: finalPromotion.category || 'general',
      };
    } else if (boostedByDuplicate && finalPromotion.should_promote) {
      // AI 和重复检测都认为应该晋升，合并理由
      const boosted = duplicateResults.find(d => d.shouldAutoPromote);
      finalPromotion.reason = `${finalPromotion.reason || '有价值内容'} | ${boosted?.boostReason || '多用户重复'}`;
    }

    // ========== 如果决定晋升，写入 promotion_candidates ==========
    let candidateId: string | null = null;
    if (finalPromotion.should_promote) {
      try {
        const supabase = getSupabaseClient();
        const fingerprint = computeContentFingerprint(
          parsed.memories?.map(m => m.content).join(' ') || message
        );
        const { data: inserted, error: insertErr } = await supabase
          .from('promotion_candidates')
          .insert({
            user_id: userId,
            original_message: message,
            extracted_memory: parsed.memories?.map(m => m.content).join(' | ') || message,
            ai_reason: finalPromotion.reason,
            category: finalPromotion.category,
            content_fingerprint: fingerprint,
            duplicate_count: String(duplicateResults.filter(d => d.hasDuplicates).length),
            status: 'pending',
          })
          .select('id')
          .single();

        if (!insertErr && inserted) {
          candidateId = inserted.id;
        }
      } catch (e) {
        console.error('写入晋升候选失败:', e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      memories: parsed.memories || [],
      promotion: finalPromotion,
      candidateId,
      duplicateDetection: {
        checkedMemories: duplicateResults.length,
        boostedByDuplicate,
        details: duplicateResults,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('记忆提取失败:', error);
    return new Response(JSON.stringify({ error: '记忆提取失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
