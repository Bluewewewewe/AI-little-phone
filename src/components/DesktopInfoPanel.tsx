'use client'

import { useStore } from '@/store/useStore'
import { getIntimacyLevel, formatIntimacy } from '@/lib/intimacy'
import { PETS } from '@/lib/pet-data'
import { Heart, Star, PawPrint, ChevronRight, Shield, Sparkles } from 'lucide-react'

export default function DesktopInfoPanel() {
  const { intimacyDad, intimacyMom, chapter } = useStore()
  const totalIntimacy = intimacyDad + intimacyMom
  const levelInfo = getIntimacyLevel(totalIntimacy)
  const petsUnlocked = chapter >= 2

  return (
    <div className="hidden lg:flex flex-col gap-3 w-[200px] animate-fadeIn">
      {/* 等级与章节 */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-900">等级</span>
          <span className="badge badge-gold text-[10px] ml-auto">
            Ch{levelInfo.level}
          </span>
        </div>
        <div className="text-center mb-2">
          <span className="text-lg font-bold text-amber-700">{levelInfo.title}</span>
        </div>
        <div className="progress-bar h-2">
          <div
            className="progress-fill"
            style={{
              width: `${levelInfo.progress * 100}%`,
              background: 'linear-gradient(90deg, #f59e0b, #eab308, #fbbf24)',
              boxShadow: '0 0 12px rgba(234, 179, 8, 0.3)',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-amber-800/40">
          <span>{formatIntimacy(totalIntimacy)} 点</span>
          <span>下一章: {levelInfo.next === '💕' ? '💕' : `${levelInfo.next}点`}</span>
        </div>
      </div>

      {/* 爸妈亲密度 */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          <span className="text-sm font-medium text-amber-900">亲密度</span>
        </div>
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">爸</span>
                </div>
                <span className="text-xs text-amber-900">爸爸</span>
              </div>
              <span className="text-xs font-medium text-amber-600">{intimacyDad}</span>
            </div>
            <div className="progress-bar h-1.5">
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
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">妈</span>
                </div>
                <span className="text-xs text-amber-900">妈妈</span>
              </div>
              <span className="text-xs font-medium text-pink-500">{intimacyMom}</span>
            </div>
            <div className="progress-bar h-1.5">
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
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <PawPrint className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-amber-900">宠物</span>
            <Sparkles className="w-3 h-3 text-amber-500 ml-auto" />
          </div>
          <div className="space-y-2">
            {Object.values(PETS).map((pet) => (
              <div key={pet.id} className="flex items-center gap-2">
                <span className="text-base">{pet.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium truncate text-amber-900">{pet.name}</span>
                    <span className="text-[9px] text-amber-800/40">{pet.species}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-1 bg-amber-900/8 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400/70 rounded-full" style={{ width: '100%' }} />
                    </div>
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
