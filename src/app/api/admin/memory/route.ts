/**
 * 管理员记忆审核 API
 * GET: 获取晋升候选列表 + 统计
 * POST: 审批/拒绝候选
 */

import { NextRequest } from 'next/server';
import {
  getPromotionCandidates,
  getPromotionStats,
  approvePromotionCandidate,
  rejectPromotionCandidate,
} from '@/lib/public-memory';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;

    const [candidates, stats] = await Promise.all([
      getPromotionCandidates(status || undefined),
      getPromotionStats(),
    ]);

    return new Response(JSON.stringify({
      success: true,
      candidates,
      stats,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('获取审核列表失败:', error);
    return new Response(JSON.stringify({ error: '获取失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, candidateId, approvedBy, category, editedContent } = await request.json();

    if (!candidateId || !action) {
      return new Response(JSON.stringify({ error: '缺少参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let success = false;

    if (action === 'approve') {
      success = await approvePromotionCandidate(
        candidateId,
        approvedBy || 'admin',
        category || 'general',
        editedContent
      );
    } else if (action === 'reject') {
      success = await rejectPromotionCandidate(candidateId);
    }

    return new Response(JSON.stringify({ success }), {
      status: success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('审核操作失败:', error);
    return new Response(JSON.stringify({ error: '操作失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
