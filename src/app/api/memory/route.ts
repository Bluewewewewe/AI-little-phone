/**
 * 记忆提取 API - AI 自动从对话中提取关键信息
 * POST: 提取聊天记忆 + 判断是否晋升公共记忆
 */

import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getModelForScene } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const { message, reply, userId } = await request.json();

    if (!message || !reply || !userId) {
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
判断标准（必须同时满足）：
1. 不是个人偏好（如"我喜欢XX"不算）
2. 可能被多个用户需要
3. 涉及游戏核心内容（世界观/角色设定/玩法机制等）
如果符合，输出晋升理由（20字以内）；不符合输出 null。

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

    return new Response(JSON.stringify({
      success: true,
      memories: parsed.memories || [],
      promotion: parsed.promotion || { should_promote: false, reason: null, category: 'general' },
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
