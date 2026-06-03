'use client'

import { useStore } from '@/store/useStore'
import { getIntimacyLevel, formatIntimacy } from '@/lib/intimacy'
import { PETS } from '@/lib/pet-data'


export default function DesktopInfoPanel() {
  const { intimacyDad, intimacyMom, chapter } = useStore()
  const totalIntimacy = intimacyDad + intimacyMom
  const levelInfo = getIntimacyLevel(totalIntimacy)
  const petsUnlocked = chapter >= 2

  return (
    <div className="hidden lg:flex flex-col gap-6 w-[230px] animate-fadeIn">
      {/* 等级与章节 */}
      <div
        className="rounded-[20px] backdrop-blur-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.45)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 2px 16px rgba(120,80,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.5)'
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          🛡️
          <span className="text-sm font-medium text-amber-900/70">等级</span>
          <span className="text-[10px] ml-auto px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700/70 font-medium">
            Ch{levelInfo.level}
          </span>
        </div>
        <div className="text-center mb-4">
          <span className="text-lg font-bold text-amber-700/80">{levelInfo.title}</span>
        </div>
        <div className="h-2 bg-amber-900/6 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${levelInfo.progress * 100}%`,
              background: 'linear-gradient(90deg, #f59e0b, #eab308, #fbbf24)',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] text-amber-800/35">
          <span>{formatIntimacy(totalIntimacy)} 点</span>
          <span>下一章: {levelInfo.next === '💕' ? '💕' : `${levelInfo.next}点`}</span>
        </div>
      </div>

      {/* 爸妈亲密度 */}
      <div
        className="rounded-[20px] backdrop-blur-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.45)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 2px 16px rgba(120,80,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.5)'
        }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          ❤️
          <span className="text-sm font-medium text-amber-900/70">亲密度</span>
        </div>
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/80 to-yellow-500/80 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">爸</span>
                </div>
                <span className="text-xs text-amber-900/70">爸爸</span>
              </div>
              <span className="text-xs font-medium text-amber-600/70">{intimacyDad}</span>
            </div>
            <div className="h-2 bg-amber-900/6 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (intimacyDad / 500) * 100)}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/80 to-rose-500/80 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">妈</span>
                </div>
                <span className="text-xs text-amber-900/70">妈妈</span>
              </div>
              <span className="text-xs font-medium text-pink-500/70">{intimacyMom}</span>
            </div>
            <div className="h-2 bg-amber-900/6 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (intimacyMom / 500) * 100)}%`,
                  background: 'linear-gradient(90deg, #ec4899, #f472b6)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 宠物健康值 - 解锁后显示 */}
      {petsUnlocked && (
        <div
          className="rounded-[20px] backdrop-blur-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 2px 16px rgba(120,80,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.5)'
          }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            🐾
            <span className="text-sm font-medium text-amber-900/70">宠物</span>
            ✨
          </div>
          <div className="space-y-4">
            {Object.values(PETS).map((pet) => (
              <div key={pet.id} className="flex items-center gap-3">
                <span className="text-xl">{pet.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium truncate text-amber-900/70">{pet.name}</span>
                    <span className="text-[9px] text-amber-800/30">{pet.species}</span>
                  </div>
                  <div className="h-1.5 bg-amber-900/6 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400/60 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
