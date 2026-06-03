'use client'

import { useStore } from '@/store/useStore'
import { getParentStatus } from '@/lib/parent-status'
import { 
  Heart, MessageCircle, Users, Star, Crown,
  Sparkles, ChevronRight, Gift, Music, Camera,
  PawPrint, House2, Eye, Shirt
} from 'lucide-react'
import { CHAPTER_UNLOCK } from '@/lib/prompts'

export default function HomeScreen() {
  const { identity, chapter, intimacyDad, intimacyMom, setCurrentApp } = useStore()
  
  const totalIntimacy = intimacyDad + intimacyMom
  const nextChapter = Math.min(chapter + 1, 6)
  const currentChapterConfig = CHAPTER_UNLOCK[chapter as keyof typeof CHAPTER_UNLOCK]
  const nextChapterConfig = CHAPTER_UNLOCK[nextChapter as keyof typeof CHAPTER_UNLOCK]
  const chapterProgress = nextChapterConfig 
    ? ((totalIntimacy - currentChapterConfig?.min) / (nextChapterConfig.min - currentChapterConfig?.min)) * 100
    : 100

  // 爸妈实时状态
  const tianleiStatus = getParentStatus('tianlei', chapter, intimacyDad, intimacyMom)
  const ziyuStatus = getParentStatus('ziyu', chapter, intimacyDad, intimacyMom)

  return (
    <div className="h-full overflow-auto">
      <div className="p-4">
        {/* 顶部欢迎 */}
        <div className="glass-card p-4 mb-4 animate-fadeIn">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {identity?.user_name || '宝贝'}的小窝
              </h2>
              <p className="text-sm text-white/60">
                第{chapter}章 · {currentChapterConfig?.name || '未知'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>{currentChapterConfig?.name}</span>
              <span>{nextChapterConfig?.name}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, chapterProgress))}%` }} />
            </div>
            <p className="text-xs text-white/40 text-center">
              再获得 {nextChapterConfig?.min - totalIntimacy} 亲密度解锁下一章
            </p>
          </div>
        </div>

        {/* 🏠 爸妈状态速览 - NEW! */}
        <div className="glass-card p-3 mb-4 cursor-pointer hover:bg-white/5 transition-all" onClick={() => setCurrentApp('family')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <House2 className="w-4 h-4 text-purple-400" /> 家里现在
            </span>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{tianleiStatus.icon}</span>
              <div>
                <p className="text-xs font-medium">田雷</p>
                <p className="text-[10px] text-white/50 truncate">{tianleiStatus.emoji} {tianleiStatus.activity}</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${
                tianleiStatus.status === 'home' ? 'bg-green-400' :
                tianleiStatus.status === 'out' ? 'bg-yellow-400' :
                tianleiStatus.status === 'sleeping' ? 'bg-gray-400' : 'bg-red-400'
              }`} />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{ziyuStatus.icon}</span>
              <div>
                <p className="text-xs font-medium">梓渝</p>
                <p className="text-[10px] text-white/50 truncate">{ziyuStatus.emoji} {ziyuStatus.activity}</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${
                ziyuStatus.status === 'home' ? 'bg-green-400' :
                ziyuStatus.status === 'out' ? 'bg-yellow-400' :
                ziyuStatus.status === 'sleeping' ? 'bg-gray-400' : 'bg-red-400'
              }`} />
            </div>
          </div>
        </div>

        {/* 快速入口 - 增加新功能 */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <QuickEntry icon={MessageCircle} label="家庭群" color="from-purple-500 to-purple-600" onClick={() => setCurrentApp('chat')} badge={2} />
          <QuickEntry icon={Users} label={identity?.roleA_name || '爸爸'} color="from-violet-500 to-purple-600" onClick={() => setCurrentApp('chat-dad')} dot />
          <QuickEntry icon={Users} label={identity?.roleB_name || '妈妈'} color="from-pink-500 to-rose-600" onClick={() => setCurrentApp('chat-mom')} dot />
          <QuickEntry icon={Heart} label="亲密度" color="from-rose-500 to-pink-600" onClick={() => {}} />
        </div>

        {/* 第二排快速入口 - NEW! */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <QuickEntry icon={House2} label="家里" color="from-orange-500 to-amber-600" onClick={() => setCurrentApp('family')} isNew />
          <QuickEntry icon={PawPrint} label="宠物" color="from-emerald-500 to-green-600" onClick={() => setCurrentApp('pets')} isNew />
          <QuickEntry icon={Shirt} label="换装" color="from-pink-500 to-fuchsia-600" onClick={() => setCurrentApp('dressup')} isNew />
          <QuickEntry icon={Gift} label="福利" color="from-cyan-500 to-blue-600" onClick={() => {}} />
        </div>

        {/* 功能列表 */}
        <div className="space-y-3">
          <SectionTitle title="精彩内容" icon={Sparkles} />
          
          <div className="glass-card overflow-hidden">
            <MenuItem icon={Star} title="解锁故事" subtitle="体验完整的叙事旅程" right={<span className="badge badge-purple">Ch{chapter}/6</span>} onClick={() => {}} />
            <MenuItem icon={PawPrint} title="宠物之家" subtitle="照顾辛巴、大鱼、小十一" onClick={() => setCurrentApp('pets')} isNew />
            <MenuItem icon={House2} title="家庭场景" subtitle="看看爸妈在干嘛" onClick={() => setCurrentApp('family')} isNew />
            <MenuItem icon={Shirt} title="甜玉米换装" subtitle="给自己换个新造型" onClick={() => setCurrentApp('dressup')} isNew />
            <MenuItem icon={Music} title="语音信箱" subtitle="收听爸妈的留言" onClick={() => {}} />
            <MenuItem icon={Camera} title="相册" subtitle="珍藏美好瞬间" onClick={() => {}} />
          </div>
        </div>

        {/* 今日推荐 */}
        <div className="mt-4">
          <SectionTitle title="今日推荐" icon={Heart} />
          <div className="glass-card p-4">
            <p className="text-sm text-white/80 mb-2">
              💡 和爸妈多聊天可以提升亲密度哦~
            </p>
            <p className="text-xs text-white/50">
              每日亲密度上限30点，每条消息+3点
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickEntry({ icon: Icon, label, color, onClick, badge, dot, isNew }: { 
  icon: any; label: string; color: string; onClick: () => void; badge?: number; dot?: boolean; isNew?: boolean 
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 p-3 rounded-2xl glass hover:bg-glass-hover transition-all">
      <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">{badge}</span>
        )}
        {dot && <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" />}
        {isNew && <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">N</span>}
      </div>
      <span className="text-[11px] text-white/80">{label}</span>
    </button>
  )
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-purple-400" />
      <h3 className="font-medium text-sm">{title}</h3>
    </div>
  )
}

function MenuItem({ icon: Icon, title, subtitle, right, onClick, isNew }: { 
  icon: any; title: string; subtitle?: string; right?: React.ReactNode; onClick: () => void; isNew?: boolean 
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {isNew && <span className="badge badge-pink text-[10px]">NEW</span>}
        </div>
        {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
      </div>
      {right || <ChevronRight className="w-4 h-4 text-white/30" />}
    </button>
  )
}
