import { NextResponse } from 'next/server';
import { getCachedNews, needsRefresh, getCurrentWeekNumber, getLastUpdateDescription } from '@/lib/news-fetcher';

// GET /api/news/refresh — 检查新闻是否需要刷新 / 获取缓存新闻
export async function GET() {
  try {
    const shouldRefresh = needsRefresh();
    const cached = getCachedNews();
    const currentWeek = getCurrentWeekNumber();

    return NextResponse.json({
      success: true,
      data: {
        needsRefresh: shouldRefresh,
        currentWeek,
        cachedWeek: cached?.weekNumber ?? null,
        lastUpdated: getLastUpdateDescription(),
        news: cached?.news ?? [],
        newsCount: cached?.news.length ?? 0,
      },
      note: shouldRefresh
        ? '新闻缓存已过期（超过一周），建议通过管理后台手动更新或等待自动刷新。生产环境请配置 NewsAPI key 实现自动抓取。'
        : '新闻缓存仍在有效期内。',
    });
  } catch (error) {
    console.error('News refresh check error:', error);
    return NextResponse.json(
      { success: false, error: '新闻状态检查失败' },
      { status: 500 }
    );
  }
}
