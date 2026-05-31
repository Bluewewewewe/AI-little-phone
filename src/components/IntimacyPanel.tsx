'use client'

import { useStore } from '@/store/useStore'
import { Heart, Users, ChevronRight, Star } from 'lucide-react'
import { CHAPTER_UNLOCK, getChapterByIntimacy } from '@/lib/prompts'
import { DAILY_INTIMACY_LIMIT, INTIMACY_PER_MESSAGE } from '@/lib/intimacy'

export default function IntimacyPanel() {
  const { intimacyDad, intimacyMom, dailyIntimacyDad, dailyIntimacyMom, chapter } = useStore()
  
  const totalIntimacy = intimacyDad + intimacyMom
  const totalDaily = dailyIntimacyDad + dailyIntimacyMom
  const currentChapter = getChapterByIntimacy(totalIntimacy)
  const chapterConfig = CHAPTER_UNLOCK[currentChapter as keyof typeof CHAPTER_UNLOCK]
  const nextChapterConfig = CHAPTER_UNLOCK[(currentChapter + 1) as keyof typeof CHAPTER_UNLOCK]

  // 计算到下一章的进度
  const chapterProgress = nextChapterConfig
    ? ((totalIntimacy - chapterConfig?.min) / (nextChapterConfig.min - chapterConfig?.min)) * 100
    : 100

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* 亲密度总览 */}
      <div className="glass-card p-3 w-48 animate-fadeIn">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          <span className="text-sm font-medium">亲密度</span>
          <span className="badge badge-purple text-[10px] ml-auto">
            Ch{currentChapter}
          </span>
        </div>
        
        {/* 爸妈亲密度 */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">爸</span>
            </div>
            <div className="flex-1">
              <div className="progress-bar h-2">
                <div 
                  className="progress-fill bg-gradient-to-r from-purple-500 to-violet-500"
                  style={{ width: `${Math.min(100, (intimacyDad / 500) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium w-8 text-right">{intimacyDad}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">妈</span>
            </div>
            <div className="flex-1">
              <div className="progress-bar h-2">
                <div 
                  className="progress-fill bg-gradient-to-r from-pink-500 to-rose-500"
                  style={{ width: `${Math.min(100, (intimacyMom / 500) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium w-8 text-right">{intimacyMom}</span>
          </div>
        </div>
        
        {/* 今日进度 */}
        <div className="bg-white/5 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/60">今日进度</span>
            <span className="text-[10px] text-white/60">
              {totalDaily}/{DAILY_INTIMACY_LIMIT}
            </span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: DAILY_INTIMACY_LIMIT / 3 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-sm ${
                  i < Math.floor(totalDaily / 3)
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* 下一章进度 */}
        {nextChapterConfig && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/60">
                下一章：{nextChapterConfig.name}
              </span>
              <span className="text-purple-400">
                {nextChapterConfig.min - totalIntimacy}点
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
