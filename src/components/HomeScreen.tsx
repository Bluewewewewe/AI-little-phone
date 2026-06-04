'use client'

import { useStore } from '@/store/useStore'
import { getParentStatus } from '@/lib/parent-status'
import { CHAPTER_UNLOCK } from '@/lib/prompts'
import { useEffect, useState, useRef, useCallback } from 'react'

interface HomeScreenProps {
  onOpenApp: (appId: string) => void
}

export default function HomeScreen({ onOpenApp }: HomeScreenProps) {
  const { identity, chapter, intimacyDad, intimacyMom } = useStore()
  const [time, setTime] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchDelta, setTouchDelta] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const totalIntimacy = intimacyDad + intimacyMom
  const tianleiStatus = getParentStatus('tianlei', chapter, intimacyDad, intimacyMom)
  const ziyuStatus = getParentStatus('ziyu', chapter, intimacyDad, intimacyMom)

  interface AppItem {
    id: string
    icon: string
    label: string
    badge?: number
    dot?: boolean
    color: string
    colorDark: string
  }

  // 所有APP - 分页：每页8个（2行4列）
  const allApps: AppItem[] = [
    { id: 'chat', icon: '💬', label: '家庭群', badge: 2, color: 'rgba(52,199,89,0.9)', colorDark: 'rgba(52,199,89,0.72)' },
    { id: 'chat-dad', icon: '👨', label: identity?.roleA_name || '爸爸', dot: true, color: 'rgba(0,122,255,0.9)', colorDark: 'rgba(0,122,255,0.72)' },
    { id: 'chat-mom', icon: '👩', label: identity?.roleB_name || '妈妈', dot: true, color: 'rgba(255,45,85,0.9)', colorDark: 'rgba(255,45,85,0.72)' },
    { id: 'moments', icon: '📸', label: '朋友圈', color: 'rgba(88,86,214,0.9)', colorDark: 'rgba(88,86,214,0.72)' },
    { id: 'weibo', icon: '🔥', label: '微博', color: 'rgba(255,149,0,0.9)', colorDark: 'rgba(255,149,0,0.72)' },
    { id: 'family', icon: '🏠', label: '家里', color: 'rgba(255,179,64,0.9)', colorDark: 'rgba(255,179,64,0.72)' },
    { id: 'pets', icon: '🐾', label: '宠物', color: 'rgba(90,200,250,0.9)', colorDark: 'rgba(90,200,250,0.72)' },
    { id: 'dressup', icon: '👗', label: '换装', color: 'rgba(255,55,95,0.9)', colorDark: 'rgba(255,55,95,0.72)' },
    // 第二页
    { id: 'stories', icon: '📖', label: '故事', color: 'rgba(175,82,222,0.9)', colorDark: 'rgba(175,82,222,0.72)' },
    { id: 'album', icon: '🎞️', label: '相册', color: 'rgba(255,80,60,0.9)', colorDark: 'rgba(255,80,60,0.72)' },
    { id: 'voicemail', icon: '🎙️', label: '语音信箱', color: 'rgba(48,209,88,0.9)', colorDark: 'rgba(48,209,88,0.72)' },
    { id: 'memory', icon: '📝', label: '记忆本', color: 'rgba(162,132,94,0.9)', colorDark: 'rgba(162,132,94,0.72)' },
  ]

  const appsPerPage = 8
  const pages: AppItem[][] = []
  for (let i = 0; i < allApps.length; i += appsPerPage) {
    pages.push(allApps.slice(i, i + appsPerPage))
  }
  const totalPages = pages.length

  // Dock 4个
  const dockApps: AppItem[] = [
    { id: 'chat', icon: '💬', label: '消息', badge: 2, color: 'rgba(52,199,89,0.9)', colorDark: 'rgba(52,199,89,0.72)' },
    { id: 'family', icon: '🏠', label: '家里', color: 'rgba(255,179,64,0.9)', colorDark: 'rgba(255,179,64,0.72)' },
    { id: 'pets', icon: '🐾', label: '宠物', color: 'rgba(90,200,250,0.9)', colorDark: 'rgba(90,200,250,0.72)' },
    { id: 'dressup', icon: '👗', label: '换装', color: 'rgba(255,55,95,0.9)', colorDark: 'rgba(255,55,95,0.72)' },
  ]

  // 触摸滑动处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
    setIsDragging(true)
    setTouchDelta(0)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return
    const delta = e.touches[0].clientX - touchStart
    setTouchDelta(delta)
  }, [touchStart])

  const handleTouchEnd = useCallback(() => {
    if (touchStart === null) return
    const threshold = 50
    if (touchDelta < -threshold && currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1)
    } else if (touchDelta > threshold && currentPage > 0) {
      setCurrentPage(p => p - 1)
    }
    setTouchStart(null)
    setTouchDelta(0)
    setIsDragging(false)
  }, [touchStart, touchDelta, currentPage, totalPages])

  // 鼠标拖拽支持（桌面端）
  const mouseStartRef = useRef<number | null>(null)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStartRef.current = e.clientX
    setIsDragging(true)
    setTouchDelta(0)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mouseStartRef.current === null) return
    setTouchDelta(e.clientX - mouseStartRef.current)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (mouseStartRef.current === null) return
    const threshold = 50
    if (touchDelta < -threshold && currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1)
    } else if (touchDelta > threshold && currentPage > 0) {
      setCurrentPage(p => p - 1)
    }
    mouseStartRef.current = null
    setTouchDelta(0)
    setIsDragging(false)
  }, [touchDelta, currentPage, totalPages])

  // 计算偏移量
  const baseOffset = currentPage * 100
  const dragOffset = touchDelta !== 0 ? (touchDelta / (containerRef.current?.offsetWidth || 390)) * 100 : 0

  return (
    <div className="h-full relative overflow-hidden select-none">
      {/* 壁纸层 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fef9ee] via-[#fef3c7] to-[#fde68a]">
        <div className="absolute top-[12%] left-[15%] w-52 h-52 bg-amber-300/20 rounded-full blur-[80px]" />
        <div className="absolute top-[40%] right-[5%] w-40 h-40 bg-yellow-200/20 rounded-full blur-[60px]" />
        <div className="absolute bottom-[30%] left-[5%] w-36 h-36 bg-orange-200/15 rounded-full blur-[50px]" />
      </div>

      {/* 顶部固定区域：时钟 + 小组件 */}
      <div className="relative z-10 flex-shrink-0">
        {/* 时钟 */}
        <div className="pt-4 pb-2 text-center">
          <div className="text-[48px] font-extralight tracking-tight leading-none text-amber-900/70">
            {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-[11px] text-amber-800/25 mt-0.5 font-light">
            {time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        {/* 爸妈状态小组件 */}
        <div className="mx-5 mb-4">
          <button
            onClick={() => onOpenApp('family')}
            className="w-full rounded-[18px] bg-white/40 backdrop-blur-2xl p-3 text-left active:scale-[0.98] transition-transform duration-150"
            style={{ boxShadow: '0 2px 12px rgba(120,53,0,0.05), inset 0 0.5px 0 rgba(255,255,255,0.5)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-amber-800/30 tracking-wider font-medium">家里现在</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">❤️</span>
                <span className="text-[9px] text-amber-600/60">{totalIntimacy}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-amber-500/[0.06]">
                <span className="text-base">{tianleiStatus.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate text-amber-900/65">{identity?.roleA_name || '田雷'}</p>
                  <p className="text-[8px] text-amber-800/25 truncate">{tianleiStatus.activity}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-rose-500/[0.06]">
                <span className="text-base">{ziyuStatus.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate text-amber-900/65">{identity?.roleB_name || '梓渝'}</p>
                  <p className="text-[8px] text-amber-800/25 truncate">{ziyuStatus.activity}</p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* APP页面滑动区域 */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="flex h-full transition-transform"
          style={{
            width: `${totalPages * 100}%`,
            transform: `translateX(${-(baseOffset + dragOffset)}%)`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {pages.map((pageApps, pageIdx) => (
            <div key={pageIdx} className="h-full" style={{ width: `${100 / totalPages}%` }}>
              <div className="px-6 pt-2">
                <div className="grid grid-cols-4 gap-y-8 justify-items-center">
                  {pageApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => onOpenApp(app.id)}
                      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform duration-100"
                    >
                      <div className="relative">
                        {/* iOS 圆角方块图标 */}
                        <div
                          className="w-[56px] h-[56px] rounded-[14px] flex items-center justify-center"
                          style={{
                            background: `linear-gradient(145deg, ${app.color}, ${app.colorDark})`,
                            boxShadow: '0 3px 10px rgba(120,53,0,0.10), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.05)',
                          }}
                        >
                          <span className="text-[28px] drop-shadow-sm">{app.icon}</span>
                        </div>
                        {/* 角标 */}
                        {app.badge && app.badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold shadow-sm">
                            {app.badge}
                          </span>
                        )}
                        {app.dot && (
                          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-sm" />
                        )}
                      </div>
                      <span className="text-[10px] text-amber-900/50 max-w-[64px] truncate font-medium drop-shadow-sm">{app.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 页面指示点 */}
      <div className="relative z-10 flex items-center justify-center gap-2 py-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <span
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentPage ? '16px' : '6px',
              height: '6px',
              background: i === currentPage ? 'rgba(120,53,0,0.45)' : 'rgba(120,53,0,0.15)',
            }}
          />
        ))}
      </div>

      {/* 固定底部Dock */}
      <div className="relative z-20 px-5 pb-2">
        <div
          className="rounded-[24px] bg-white/45 backdrop-blur-2xl"
          style={{ boxShadow: '0 2px 16px rgba(120,53,0,0.06), inset 0 0.5px 0 rgba(255,255,255,0.5)' }}
        >
          <div className="flex items-center justify-around py-2.5 px-2">
            {dockApps.map(app => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                className="active:scale-90 transition-transform duration-100"
              >
                <div className="relative">
                  <div
                    className="w-[48px] h-[48px] rounded-[12px] flex items-center justify-center"
                    style={{
                      background: `linear-gradient(145deg, ${app.color}, ${app.colorDark})`,
                      boxShadow: '0 2px 6px rgba(120,53,0,0.08), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.04)',
                    }}
                  >
                    <span className="text-[24px] drop-shadow-sm">{app.icon}</span>
                  </div>
                  {app.badge && app.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-rose-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold shadow-sm">
                      {app.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
