'use client'

import { useStore } from '@/store/useStore'
import { getParentStatus } from '@/lib/parent-status'

import { CHAPTER_UNLOCK } from '@/lib/prompts'
import { useEffect, useState } from 'react'

interface HomeScreenProps {
  onOpenApp: (appId: string) => void
}

export default function HomeScreen({ onOpenApp }: HomeScreenProps) {
  const { identity, chapter, intimacyDad, intimacyMom } = useStore()
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const totalIntimacy = intimacyDad + intimacyMom
  const currentChapterConfig = CHAPTER_UNLOCK[chapter as keyof typeof CHAPTER_UNLOCK]
  const tianleiStatus = getParentStatus('tianlei', chapter, intimacyDad, intimacyMom)
  const ziyuStatus = getParentStatus('ziyu', chapter, intimacyDad, intimacyMom)

  // 所有APP
  const apps = [
    { id: 'chat', icon: '💬', label: '家庭群', badge: 2, color: 'rgba(52,199,89,0.85)', colorDark: 'rgba(52,199,89,0.70)' },
    { id: 'chat-dad', icon: '👨', label: identity?.roleA_name || '爸爸', dot: true, color: 'rgba(0,122,255,0.85)', colorDark: 'rgba(0,122,255,0.70)' },
    { id: 'chat-mom', icon: '👩', label: identity?.roleB_name || '妈妈', dot: true, color: 'rgba(255,45,85,0.85)', colorDark: 'rgba(255,45,85,0.70)' },
    { id: 'moments', icon: '📸', label: '朋友圈', color: 'rgba(88,86,214,0.85)', colorDark: 'rgba(88,86,214,0.70)' },
    { id: 'weibo', icon: '🔥', label: '微博', color: 'rgba(255,149,0,0.85)', colorDark: 'rgba(255,149,0,0.70)' },
    { id: 'family', icon: '🏠', label: '家里', isNew: true, color: 'rgba(255,179,64,0.85)', colorDark: 'rgba(255,179,64,0.70)' },
    { id: 'pets', icon: '🐾', label: '宠物', isNew: true, color: 'rgba(90,200,250,0.85)', colorDark: 'rgba(90,200,250,0.70)' },
    { id: 'dressup', icon: '👗', label: '换装', isNew: true, color: 'rgba(255,55,95,0.85)', colorDark: 'rgba(255,55,95,0.70)' },
    { id: 'stories', icon: '📖', label: '故事', color: 'rgba(175,82,222,0.85)', colorDark: 'rgba(175,82,222,0.70)' },
    { id: 'album', icon: '🎞️', label: '相册', color: 'rgba(255,80,60,0.85)', colorDark: 'rgba(255,80,60,0.70)' },
    { id: 'voicemail', icon: '🎙️', label: '语音信箱', color: 'rgba(48,209,88,0.85)', colorDark: 'rgba(48,209,88,0.70)' },
    { id: 'memory', icon: '📝', label: '记忆本', color: 'rgba(162,132,94,0.85)', colorDark: 'rgba(162,132,94,0.70)' },
  ]

  // 底部Dock 4个
  const dockApps = [
    { id: 'chat', icon: '💬', label: '消息', badge: 2, color: 'rgba(52,199,89,0.85)', colorDark: 'rgba(52,199,89,0.70)' },
    { id: 'family', icon: '🏠', label: '家里', color: 'rgba(255,179,64,0.85)', colorDark: 'rgba(255,179,64,0.70)' },
    { id: 'pets', icon: '🐾', label: '宠物', color: 'rgba(90,200,250,0.85)', colorDark: 'rgba(90,200,250,0.70)' },
    { id: 'dressup', icon: '👗', label: '换装', color: 'rgba(255,55,95,0.85)', colorDark: 'rgba(255,55,95,0.70)' },
  ]

  return (
    <div className="h-full flex flex-col relative">
      {/* 壁纸层 - 浅黄暖调 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fef9ee] via-[#fef3c7] to-[#fde68a]">
        {/* 壁纸装饰 - 柔和暖光光晕 */}
        <div className="absolute top-[12%] left-[15%] w-56 h-56 bg-amber-300/20 rounded-full blur-[80px]" />
        <div className="absolute top-[35%] right-[5%] w-44 h-44 bg-yellow-200/25 rounded-full blur-[60px]" />
        <div className="absolute bottom-[25%] left-[5%] w-40 h-40 bg-orange-200/15 rounded-full blur-[50px]" />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        {/* 顶部时钟 - iOS桌面大字钟 */}
        <div className="pt-8 pb-4 text-center">
          <div className="text-[64px] font-extralight tracking-tight leading-none text-amber-900/80">
            {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-[13px] text-amber-800/35 mt-2 font-light">
            {time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        {/* 爸妈状态小组件 - iOS桌面小组件风格 */}
        <div className="mx-7 mb-5">
          <button 
            onClick={() => onOpenApp('family')}
            className="w-full rounded-[20px] bg-white/35 backdrop-blur-2xl p-4 text-left active:scale-[0.98] transition-transform duration-150 shadow-sm shadow-amber-900/5"
          >
            {/* 顶部高光线 */}
            <div className="absolute top-0 left-[15%] right-[15%] h-[0.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-amber-800/35 tracking-wider font-medium">家里现在</span>
              <div className="flex items-center gap-1">
                ❤️
                <span className="text-[10px] text-amber-600/70">{totalIntimacy}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2.5 p-2.5 rounded-2xl bg-amber-500/[0.06]">
                <span className="text-xl">{tianleiStatus.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate text-amber-900/80">{identity?.roleA_name || '田雷'}</p>
                  <p className="text-[9px] text-amber-800/30 truncate">{tianleiStatus.activity}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2.5 p-2.5 rounded-2xl bg-rose-500/[0.06]">
                <span className="text-xl">{ziyuStatus.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate text-amber-900/80">{identity?.roleB_name || '梓渝'}</p>
                  <p className="text-[9px] text-amber-800/30 truncate">{ziyuStatus.activity}</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* APP图标网格 - iOS风格毛玻璃圆角方块+Emoji */}
        <div className="flex-1 px-7">
          <div className="grid grid-cols-4 gap-y-7 gap-x-5">
            {apps.map(app => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                className="flex flex-col items-center gap-2 active:scale-90 transition-transform duration-100"
              >
                <div className="relative">
                  {/* iOS风格圆角方块图标 - 像真手机APP图标 */}
                  <div className="w-[60px] h-[60px] rounded-[14px] flex items-center justify-center shadow-lg shadow-amber-900/10"
                       style={{
                         background: `linear-gradient(145deg, ${app.color || 'rgba(255,255,255,0.8)'}, ${app.colorDark || 'rgba(255,255,255,0.6)'})`,
                         boxShadow: '0 4px 12px rgba(120,53,0,0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
                       }}>
                    <span className="text-[30px] drop-shadow-sm">{app.icon}</span>
                  </div>
                  {app.badge && app.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold shadow-sm">
                      {app.badge}
                    </span>
                  )}
                  {app.dot && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-sm" />
                  )}
                  {app.isNew && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-br from-pink-500 to-fuchsia-500 rounded-full text-[7px] flex items-center justify-center text-white font-bold shadow-sm">N</span>
                  )}
                </div>
                <span className="text-[10px] text-amber-900/50 max-w-[68px] truncate font-medium">{app.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 页面指示点 - iOS风格导航标 */}
        <div className="flex items-center justify-center gap-1.5 pb-2">
          <span className="w-[6px] h-[6px] rounded-full bg-amber-900/40" />
          <span className="w-[6px] h-[6px] rounded-full bg-amber-900/15" />
        </div>

        {/* 底部Dock - iOS风格毛玻璃 */}
        <div className="relative mx-6 mb-4 rounded-[28px] bg-white/50 backdrop-blur-2xl shadow-md shadow-amber-900/[0.08]">
          {/* 顶部高光线 */}
          <div className="absolute top-[1px] left-[10%] right-[10%] h-[0.5px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="flex items-center justify-around py-3 px-4">
            {dockApps.map(app => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform duration-100"
              >
                <div className="relative">
                  {/* Dock图标 - 更透一点的毛玻璃方块 */}
                  <div className="w-[52px] h-[52px] rounded-[14px] bg-white/35 backdrop-blur-xl flex items-center justify-center shadow-sm shadow-amber-900/8">
                    <div className="absolute top-[1px] left-[20%] right-[20%] h-[0.5px] rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <span className="text-[26px] drop-shadow-sm">{app.icon}</span>
                  </div>
                  {app.badge && app.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-rose-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold shadow-sm">
                      {app.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-amber-900/40 font-medium">{app.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
