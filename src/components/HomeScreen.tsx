'use client'

import { useStore } from '@/store/useStore'
import { getParentStatus } from '@/lib/parent-status'
import { 
  Heart, MessageCircle, Users, Star, Crown,
  Sparkles, ChevronRight, Gift, Music, Camera,
  PawPrint, HousePlus, Eye, Shirt
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

  const tianleiStatus = getParentStatus('tianlei', chapter, intimacyDad, intimacyMom)
  const ziyuStatus = getParentStatus('ziyu', chapter, intimacyDad, intimacyMom)

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-4">
        {/* 顶部欢迎 - 精简版 */}
        <div className="glass-card p-4 animate-fadeIn">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[15px]">
                {identity?.user_name || '宝贝'}的小窝
              </h2>
              <p className="text-xs text-white/40">
                第{chapter}章 · {currentChapterConfig?.name || '未知'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-violet-400 font-medium">Ch{chapter}/6</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-white/30">
              <span>{currentChapterConfig?.name}</span>
              <span className="text-violet-400/60">{nextChapterConfig?.name}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, chapterProgress))}%` }} />
            </div>
            <p className="text-[10px] text-white/25 text-center">
              再获得 {nextChapterConfig?.min - totalIntimacy} 亲密度解锁下一章
            </p>
          </div>
        </div>

        {/* 🏠 爸妈状态速览 - 重设计 */}
        <button 
          className="glass-card w-full p-3.5 hover:bg-white/[0.03] transition-all duration-300 text-left"
          onClick={() => setCurrentApp('family')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
              <HousePlus className="w-3.5 h-3.5 text-violet-400" /> 家里现在
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          </div>
          <div className="flex gap-3">
            {/* 爸 */}
            <div className="flex-1 flex items-center gap-2.5 p-2 rounded-xl bg-violet-500/[0.06] border border-violet-400/[0.06]">
              <div className="relative">
                <span className="text-2xl">{tianleiStatus.icon}</span>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0c0015] ${
                  tianleiStatus.status === 'home' ? 'bg-emerald-400' :
                  tianleiStatus.status === 'out' ? 'bg-amber-400' :
                  tianleiStatus.status === 'sleeping' ? 'bg-slate-400' : 'bg-rose-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">田雷</p>
                <p className="text-[10px] text-white/35 truncate">{tianleiStatus.emoji} {tianleiStatus.activity}</p>
              </div>
            </div>
            {/* 妈 */}
            <div className="flex-1 flex items-center gap-2.5 p-2 rounded-xl bg-rose-500/[0.06] border border-rose-400/[0.06]">
              <div className="relative">
                <span className="text-2xl">{ziyuStatus.icon}</span>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0c0015] ${
                  ziyuStatus.status === 'home' ? 'bg-emerald-400' :
                  ziyuStatus.status === 'out' ? 'bg-amber-400' :
                  ziyuStatus.status === 'sleeping' ? 'bg-slate-400' : 'bg-rose-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">梓渝</p>
                <p className="text-[10px] text-white/35 truncate">{ziyuStatus.emoji} {ziyuStatus.activity}</p>
              </div>
            </div>
          </div>
        </button>

        {/* 快速入口 - 精致圆角 */}
        <div className="grid grid-cols-4 gap-2.5">
          <QuickEntry icon={MessageCircle} label="家庭群" color="from-violet-500 to-purple-600" onClick={() => setCurrentApp('chat')} badge={2} />
          <QuickEntry icon={Users} label={identity?.roleA_name || '爸爸'} color="from-indigo-500 to-violet-600" onClick={() => setCurrentApp('chat-dad')} dot />
          <QuickEntry icon={Users} label={identity?.roleB_name || '妈妈'} color="from-rose-500 to-pink-600" onClick={() => setCurrentApp('chat-mom')} dot />
          <QuickEntry icon={Heart} label="亲密度" color="from-pink-500 to-fuchsia-600" onClick={() => {}} />
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          <QuickEntry icon={HousePlus} label="家里" color="from-orange-500 to-amber-600" onClick={() => setCurrentApp('family')} isNew />
          <QuickEntry icon={PawPrint} label="宠物" color="from-emerald-500 to-green-600" onClick={() => setCurrentApp('pets')} isNew />
          <QuickEntry icon={Shirt} label="换装" color="from-fuchsia-500 to-pink-600" onClick={() => setCurrentApp('dressup')} isNew />
          <QuickEntry icon={Gift} label="福利" color="from-cyan-500 to-blue-600" onClick={() => {}} />
        </div>

        {/* 功能列表 */}
        <div>
          <SectionTitle title="精彩内容" icon={Sparkles} />
          <div className="glass-card overflow-hidden">
            <MenuItem icon={Star} title="解锁故事" subtitle="体验完整的叙事旅程" right={<span className="badge badge-purple">Ch{chapter}/6</span>} onClick={() => {}} />
            <MenuItem icon={PawPrint} title="宠物之家" subtitle="照顾辛巴、大鱼、小十一" onClick={() => setCurrentApp('pets')} isNew />
            <MenuItem icon={HousePlus} title="家庭场景" subtitle="看看爸妈在干嘛" onClick={() => setCurrentApp('family')} isNew />
            <MenuItem icon={Shirt} title="甜玉米换装" subtitle="给自己换个新造型" onClick={() => setCurrentApp('dressup')} isNew />
            <MenuItem icon={Music} title="语音信箱" subtitle="收听爸妈的留言" onClick={() => {}} />
            <MenuItem icon={Camera} title="相册" subtitle="珍藏美好瞬间" onClick={() => {}} />
          </div>
        </div>

        {/* 今日推荐 */}
        <div>
          <SectionTitle title="今日推荐" icon={Heart} />
          <div className="glass-card p-4">
            <p className="text-sm text-white/70 mb-1">
              💡 和爸妈多聊天可以提升亲密度哦~
            </p>
            <p className="text-xs text-white/30">
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
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl hover:bg-white/[0.03] transition-all duration-300 group">
      <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 group-active:scale-95`}
        style={{ boxShadow: `0 4px 12px rgba(0,0,0,0.2)` }}>
        <Icon className="w-[18px] h-[18px] text-white" />
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        {dot && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
        {isNew && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gradient-to-br from-pink-500 to-fuchsia-500 rounded-full text-[7px] flex items-center justify-center text-white font-bold">N</span>}
      </div>
      <span className="text-[10px] text-white/50 group-hover:text-white/70">{label}</span>
    </button>
  )
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon className="w-3.5 h-3.5 text-violet-400/60" />
      <h3 className="font-medium text-xs text-white/60">{title}</h3>
    </div>
  )
}

function MenuItem({ icon: Icon, title, subtitle, right, onClick, isNew }: { 
  icon: any; title: string; subtitle?: string; right?: React.ReactNode; onClick: () => void; isNew?: boolean 
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0 group">
      <div className="w-9 h-9 rounded-xl bg-violet-500/[0.08] flex items-center justify-center">
        <Icon className="w-[18px] h-[18px] text-violet-400/70" />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-[13px]">{title}</span>
          {isNew && <span className="badge badge-pink text-[9px] py-0">NEW</span>}
        </div>
        {subtitle && <p className="text-[11px] text-white/30 mt-0.5">{subtitle}</p>}
      </div>
      {right || <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 transition-colors" />}
    </button>
  )
}
