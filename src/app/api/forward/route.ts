import { NextRequest, NextResponse } from 'next/server'

// 转发内容总结 API
// 用于将长内容总结后分享到家庭群

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, maxLength = 100 } = body
    
    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }
    
    // 简单的文本截取和总结
    // TODO: 可以接入AI进行智能总结
    let summary = content.trim()
    
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...'
    }
    
    return NextResponse.json({
      summary,
      original_length: content.length,
      summarized_length: summary.length,
    })
  } catch (error) {
    console.error('Forward API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
