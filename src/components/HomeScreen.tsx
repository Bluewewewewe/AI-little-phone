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
  const tianleiStatus = getParentStatus('tianlei', chapter, intimacyDad, intimacyMom)
  const ziyuStatus = getParentStatus('ziyu', chapter, intimacyDad, intimacyMom)

  // APP列表 - 8个，2行4列
  const apps = [
    { id: 'chat', icon: '💬', label: '家庭群', badge: 2, color: 'rgba(52,199,89,0.88)', colorDark: 'rgba(52,199,89,0.72)' },
    { id: 'chat-dad', icon: '👨', label: identity?.roleA_name || '爸爸', dot: true, color: 'rgba(0,122,255,0.88)', colorDark: 'rgba(0,122,255,0.72)' },
    { id: 'chat-mom', icon: '👩', label: identity?.roleB_name || '妈妈', dot: true, color: 'rgba(255,45,85,0.88)', colorDark: 'rgba(255,45,85,0.72)' },
    { id: 'moments', icon: '📸', label: '朋友圈', color: 'rgba(88,86,214,0.88)', colorDark: 'rgba(88,86,214,0.72)' },
    { id: 'weibo', icon: '🔥', label: '微博', color: 'rgba(255,149,0,0.88)', colorDark: 'rgba(255,149,0,0.72)' },
    { id: 'family', icon: '🏠', label: '家里', color: 'rgba(255,179,64,0.88)', colorDark: 'rgba(255,179,64,0.72)' },
    { id: 'pets', icon: '🐾', label: '宠物', color: 'rgba(90,200,250,0.88)', colorDark: 'rgba(90,200,250,0.72)' },
    { id: 'dressup', icon: '👗', label: '换装', color: 'rgba(255,55,95,0.88)', colorDark: 'rgba(255,55,95,0.72)' },
  ]

  // Dock 4个
  const dockApps = [
    { id: 'chat', icon: '💬', badge: 2, color: 'rgba(52,199,89,0.88)', colorDark: 'rgba(52,199,89,0.72)' },
    { id: 'family', icon: '🏠', color: 'rgba(255,179,64,0.88)', colorDark: 'rgba(255,179,64,0.72)' },
    { id: 'pets', icon: '🐾', color: 'rgba(90,200,250,0.88)', colorDark: 'rgba(90,200,250,0.72)' },
    { id: 'dressup', icon: '👗', color: 'rgba(255,55,95,0.88)', colorDark: 'rgba(255,55,95,0.72)' },
  ]

  return (
    <div className="h-full relative overflow-hidden">
      {/* 壁纸层 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fef9ee] via-[#fef3c7] to-[#fde68a]">
        <div className="absolute top-[15%] left-[20%] w-48 h-48 bg-amber-300/20 rounded-full blur-[80px]" />
        <div className="absolute top-[45%] right-[5%] w-36 h-36 bg-yellow-200/20 rounded-full blur-[60px]" />
        <div className="absolute bottom-[35%] left-[5%] w-32 h-32 bg-orange-200/15 rounded-full blur-[50px]" />
      </div>
      
      {/* 可滚动内容区 */}
      <div className="relative z-10 h-full overflow-y-auto pb-[100px]" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* 时钟 */}
        <div className="pt-6 pb-3 text-center">
          <div className="text-[52px] font-extralight tracking-tight leading-none text-amber-900/75">
            {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-[11px] text-amber-800/25 mt-1 font-light">
            {time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        {/* 爸妈状态小组件 */}
        <div className="mx-5 mb-5">
          <button 
            onClick={() => onOpenApp('family')}
            className="w-full rounded-[18px] bg-white/40 backdrop-blur-2xl p-3.5 text-left active:scale-[0.98] transition-transform duration-150"
            style={{ boxShadow: '0 2px 12px rgba(120,53,0,0.05), inset 0 0.5px 0 rgba(255,255,255,0.5)' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[9px] text-amber-800/30 tracking-wider font-medium">家里现在</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">❤️</span>
                <span className="text-[9px] text-amber-600/60">{totalIntimacy}</span>
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-amber-500/[0.06]">
                <span className="text-base">{tianleiStatus.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate text-amber-900/70">{identity?.roleA_name || '田雷'}</p>
                  <p className="text-[8px] text-amber-800/25 truncate">{tianleiStatus.activity}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-rose-500/[0.06]">
                <span className="text-base">{ziyuStatus.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate text-amber-900/70">{identity?.roleB_name || '梓渝'}</p>
                  <p className="text-[8px] text-amber-800/25 truncate">{ziyuStatus.activity}</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* APP图标网格 - 4列2行 */}
        <div className="px-6">
          <div className="grid grid-cols-4 gap-y-7 justify-items-center">
            {apps.map(app => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                className="flex flex-col items-center gap-1 active:scale-90 transition-transform duration-100"
              >
                <div className="relative">
                  <div className="w-[54px] h-[54px] rounded-[13px] flex items-center justify-center"
                       style={{
                         background: `linear-gradient(145deg, ${app.color}, ${app.colorDark})`,
                         boxShadow: '0 3px 8px rgba(120,53,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.4)',
                       }}>
                    <span className="text-[26px] drop-shadow-sm">{app.icon}</span>
                  </div>
                  {app.badge && app.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-rose-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold shadow-sm">
                      {app.badge}
                    </span>
                  )}
                  {app.dot && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full shadow-sm" />
                  )}
                </div>
                <span className="text-[9px] text-amber-900/45 max-w-[60px] truncate font-medium">{app.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 页面指示点 */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-3">
          <span className="w-[5px] h-[5px] rounded-full bg-amber-900/35" />
          <span className="w-[5px] h-[5px] rounded-full bg-amber-900/12" />
        </div>
      </div>

      {/* 固定底部Dock - 始终在最底部 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-2">
        <div className="rounded-[24px] bg-white/45 backdrop-blur-2xl"
             style={{ boxShadow: '0 2px 16px rgba(120,53,0,0.06), inset 0 0.5px 0 rgba(255,255,255,0.5)' }}>
          <div className="flex items-center justify-around py-2.5 px-2">
            {dockApps.map(app => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                className="active:scale-90 transition-transform duration-100"
              >
                <div className="relative">
                  <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center"
                       style={{
                         background: `linear-gradient(145deg, ${app.color}, ${app.colorDark})`,
                         boxShadow: '0 2px 6px rgba(120,53,0,0.07), inset 0 0.5px 0 rgba(255,255,255,0.4)',
                       }}>
                    <span className="text-[22px] drop-shadow-sm">{app.icon}</span>
                  </div>
                  {app.badge && app.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold shadow-sm">
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
