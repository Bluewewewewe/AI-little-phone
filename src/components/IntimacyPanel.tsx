'use client'

import { useStore } from '@/store/useStore'

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
      <div className="rounded-[18px] bg-white/35 backdrop-blur-2xl p-4 w-52 animate-fadeIn shadow-sm shadow-amber-900/5">
        <div className="flex items-center gap-2 mb-4">
          ❤️
          <span className="text-sm font-medium text-amber-900/70">亲密度</span>
          <span className="text-[10px] ml-auto px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700/70 font-medium">
            Ch{currentChapter}
          </span>
        </div>
        
        {/* 爸妈亲密度 */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/80 to-yellow-500/80 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">爸</span>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-amber-900/[0.06] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (intimacyDad / 500) * 100)}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
                />
              </div>
            </div>
            <span className="text-xs font-medium w-8 text-right text-amber-900/60">{intimacyDad}</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500/80 to-rose-500/80 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">妈</span>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-amber-900/[0.06] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (intimacyMom / 500) * 100)}%`, background: 'linear-gradient(90deg, #ec4899, #f472b6)' }}
                />
              </div>
            </div>
            <span className="text-xs font-medium w-8 text-right text-amber-900/60">{intimacyMom}</span>
          </div>
        </div>
        
        {/* 今日进度 */}
        <div className="rounded-2xl bg-amber-900/[0.03] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-amber-800/35">今日进度</span>
            <span className="text-[10px] text-amber-800/35">
              {totalDaily}/{DAILY_INTIMACY_LIMIT}
            </span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: DAILY_INTIMACY_LIMIT / 3 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full ${
                  i < Math.floor(totalDaily / 3)
                    ? 'bg-gradient-to-r from-amber-500/70 to-yellow-400/70'
                    : 'bg-amber-900/[0.06]'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* 下一章进度 */}
        {nextChapterConfig && (
          <div className="mt-3 pt-3 border-t border-amber-900/[0.04]">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-amber-800/35">
                下一章：{nextChapterConfig.name}
              </span>
              <span className="text-amber-600/60">
                {nextChapterConfig.min - totalIntimacy}点
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
