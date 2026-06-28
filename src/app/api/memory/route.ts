/**
 * 记忆系统 API
 * POST /api/memory - 提交晋升候选
 * GET  /api/memory?type=candidates - 获取候选列表
 * GET  /api/memory?type=stats - 获取审核统计
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  submitPromotionCandidate,
  getPendingCandidates,
  reviewCandidate,
  getReviewStats,
} from '@/lib/public-memory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'promote': {
        const { userId, originalConversation, extractedInfo, suggestedCategory, aiReason } = data;
        if (!userId || !extractedInfo) {
          return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }
        await submitPromotionCandidate({
          userId,
          originalConversation: originalConversation || '',
          extractedInfo,
          suggestedCategory: suggestedCategory || 'worldview',
          aiReason: aiReason || '',
        });
        return NextResponse.json({ success: true });
      }

      case 'review': {
        const { candidateId, status, reviewerId, note } = data;
        if (!candidateId || !status || !reviewerId) {
          return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }
        await reviewCandidate(candidateId, status, reviewerId, note);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (e) {
    console.error('Memory API error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'stats') {
      const stats = await getReviewStats();
      return NextResponse.json(stats);
    }

    // 默认返回待审核候选
    const candidates = await getPendingCandidates();
    return NextResponse.json({ candidates });
  } catch (e) {
    console.error('Memory API error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
