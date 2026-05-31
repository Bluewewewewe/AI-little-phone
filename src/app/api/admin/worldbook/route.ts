import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// 验证管理后台访问
function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

// 获取世界书内容（公开，用于AI注入）
export async function GET(request: NextRequest) {
  // 如果带admin secret，返回完整内容（含禁用的）
  const isAdmin = verifyAdmin(request)
  
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ 
      sections: [
        { section: 'world_rules', title: '🌍 世界书·时间感知系统', content: '时间是你的世界的根基。在你回应之前，先感知此刻的现实时间。\nM1: 时间最高优先级。\nM2: 每条消息重新校准时间。\nM3: 三态模型。\nM4: 状态切换必须时间对账。\nM5: 时间与环境绑定。\nM6: 感知日期星期节日。\nM7: 用户不在时仍在生活。\nM8: 时间感知隐形。', is_active: true, sort_order: 0 },
        { section: 'dad_profile', title: '🟢 爸爸人设', content: '', is_active: true, sort_order: 1 },
        { section: 'mom_profile', title: '🟣 妈妈人设', content: '', is_active: true, sort_order: 2 },
        { section: 'npc_profiles', title: '👥 NPC人设', content: '', is_active: true, sort_order: 3 },
      ]
    })
  }

  try {
    let query = supabaseAdmin.from('world_book').select('*').order('sort_order')
    
    // 非管理员只看启用的
    if (!isAdmin) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // 非管理员：只返回内容（用于AI注入），不含管理信息
    if (!isAdmin) {
      return NextResponse.json({
        sections: data.map(s => ({
          section: s.section,
          title: s.title,
          content: s.content,
          is_active: s.is_active,
          sort_order: s.sort_order,
        }))
      })
    }
    
    return NextResponse.json({ sections: data })
  } catch (error) {
    console.error('World book GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 更新世界书条目（仅管理员）
export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { section, title, content, is_active } = body

    if (!section) {
      return NextResponse.json({ error: 'Missing section' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabaseAdmin
      .from('world_book')
      .update(updateData)
      .eq('section', section)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, section: data?.[0] })
  } catch (error) {
    console.error('World book PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 新增世界书条目（仅管理员）
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { section, title, content, sort_order } = body

    if (!section || !title) {
      return NextResponse.json({ error: 'Missing section or title' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('world_book')
      .upsert({
        section,
        title,
        content: content || '',
        sort_order: sort_order || 99,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'section' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, section: data?.[0] })
  } catch (error) {
    console.error('World book POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 删除世界书条目（仅管理员）
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    if (!section) {
      return NextResponse.json({ error: 'Missing section' }, { status: 400 })
    }

    // 不允许删除核心模块
    const coreSections = ['world_rules', 'dad_profile', 'mom_profile', 'npc_profiles']
    if (coreSections.includes(section)) {
      return NextResponse.json({ error: 'Cannot delete core section' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('world_book')
      .delete()
      .eq('section', section)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('World book DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
