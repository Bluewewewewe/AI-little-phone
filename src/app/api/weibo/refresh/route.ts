import { NextResponse } from 'next/server';
import { refreshWeiboData, generateSimComments, rollEasterEgg, getSuperTopicData } from '@/lib/weibo-simulator';

// GET /api/weibo/refresh — 刷新微博模拟数据
export async function GET() {
  try {
    const data = refreshWeiboData();
    const comments = generateSimComments(3);
    const easterEgg = rollEasterEgg();
    const superTopic = getSuperTopicData();

    return NextResponse.json({
      success: true,
      data: {
        heat: data.heat,
        likes: data.likes,
        comments: data.comments,
        reposts: data.reposts,
        currentHashtag: data.currentHashtag,
        subHashtags: data.subHashtags,
        timeline: data.timeline,
        simComments: comments,
        easterEgg,
        superTopic,
      },
    });
  } catch (error) {
    console.error('Weibo refresh error:', error);
    return NextResponse.json(
      { success: false, error: '微博数据刷新失败' },
      { status: 500 }
    );
  }
}
