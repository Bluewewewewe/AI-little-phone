'use client'

import { useStore } from '@/store/useStore'
import { getParentStatus } from '@/lib/parent-status'
import { Heart } from 'lucide-react'
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
    { id: 'chat', icon: '💬', label: '家庭群', badge: 2 },
    { id: 'chat-dad', icon: '👨', label: identity?.roleA_name || '爸爸', dot: true },
    { id: 'chat-mom', icon: '👩', label: identity?.roleB_name || '妈妈', dot: true },
    { id: 'moments', icon: '📸', label: '朋友圈' },
    { id: 'weibo', icon: '🔥', label: '微博' },
    { id: 'family', icon: '🏠', label: '家里', isNew: true },
    { id: 'pets', icon: '🐾', label: '宠物', isNew: true },
    { id: 'dressup', icon: '👗', label: '换装', isNew: true },
    { id: 'stories', icon: '📖', label: '故事' },
    { id: 'album', icon: '🎞️', label: '相册' },
    { id: 'voicemail', icon: '🎙️', label: '语音信箱' },
    { id: 'memory', icon: '📝', label: '记忆本' },
  ]

  // 底部Dock 4个
  const dockApps = [
    { id: 'chat', icon: '💬', label: '消息', badge: 2 },
    { id: 'family', icon: '🏠', label: '家里' },
    { id: 'pets', icon: '🐾', label: '宠物' },
    { id: 'dressup', icon: '👗', label: '换装' },
  ]

  return (
    <div className="h-full flex flex-col relative">
      {/* 壁纸层 - 浅黄暖调 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fef9ee] via-[#fef3c7] to-[#fde68a]">
        {/* 壁纸装饰 - 柔和暖光 */}
        <div className="absolute top-[15%] left-[20%] w-48 h-48 bg-amber-300/20 rounded-full blur-[60px]" />
        <div className="absolute top-[40%] right-[10%] w-40 h-40 bg-yellow-200/25 rounded-full blur-[50px]" />
        <div className="absolute bottom-[30%] left-[10%] w-36 h-36 bg-orange-200/20 rounded-full blur-[40px]" />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        {/* 顶部时钟小组件 - 像iOS锁屏/桌面大时钟 */}
        <div className="pt-6 pb-3 text-center">
          <div className="text-[60px] font-extralight tracking-tight leading-none text-amber-900">
            {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-[13px] text-amber-800/40 mt-2">
            {time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        {/* 爸妈状态小组件 - 像iOS桌面小组件 */}
        <div className="mx-6 mb-4">
          <button 
            onClick={() => onOpenApp('family')}
            className="w-full glass-card p-4 text-left active:scale-[0.98] transition-transform duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-amber-800/40 uppercase tracking-wider font-medium">家里现在</span>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] text-amber-600">{totalIntimacy}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2.5 p-2 rounded-xl bg-amber-500/[0.08]">
                <span className="text-lg">{tianleiStatus.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate text-amber-900">{identity?.roleA_name || '田雷'}</p>
                  <p className="text-[9px] text-amber-800/35 truncate">{tianleiStatus.activity}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2.5 p-2 rounded-xl bg-rose-500/[0.08]">
                <span className="text-lg">{ziyuStatus.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate text-amber-900">{identity?.roleB_name || '梓渝'}</p>
                  <p className="text-[9px] text-amber-800/35 truncate">{ziyuStatus.activity}</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* APP图标网格 */}
        <div className="flex-1 px-6">
          <div className="grid grid-cols-4 gap-y-6 gap-x-4">
            {apps.map(app => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform duration-100"
              >
                <div className="relative">
                  <div className="w-[58px] h-[58px] rounded-[16px] bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg shadow-amber-900/10">
                    <span className="text-[28px]">{app.icon}</span>
                  </div>
                  {app.badge && app.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                      {app.badge}
                    </span>
                  )}
                  {app.dot && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
                  )}
                  {app.isNew && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-fuchsia-500 rounded-full text-[7px] flex items-center justify-center text-white font-bold">N</span>
                  )}
                </div>
                <span className="text-[10px] text-amber-900/60 max-w-[64px] truncate">{app.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 底部Dock - 毛玻璃背景 */}
        <div className="mx-5 mb-3 rounded-[24px] bg-white/40 backdrop-blur-2xl border border-white/50">
          <div className="flex items-center justify-around py-3 px-3">
            {dockApps.map(app => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                className="flex flex-col items-center gap-1 active:scale-90 transition-transform duration-100"
              >
                <div className="relative">
                  <div className="w-[50px] h-[50px] rounded-[14px] bg-white/50 border border-white/50 flex items-center justify-center">
                    <span className="text-[24px]">{app.icon}</span>
                  </div>
                  {app.badge && app.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-rose-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
                      {app.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-amber-900/50">{app.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
