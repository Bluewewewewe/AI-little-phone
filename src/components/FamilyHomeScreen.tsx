'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { getParentStatus, getPeekDetail, getBedroomScene, ParentStatus } from '@/lib/parent-status'
import { ChevronLeft, Eye, DoorOpen, MessageCircle, Heart, Moon } from 'lucide-react'

export default function FamilyHomeScreen({ onBack }: { onBack: () => void }) {
  const { chapter, intimacyDad, intimacyMom, setCurrentApp } = useStore()
  const [tianlei, setTianlei] = useState<ParentStatus | null>(null)
  const [ziyu, setZiyu] = useState<ParentStatus | null>(null)
  const [peekDetail, setPeekDetail] = useState('')
  const [showPeek, setShowPeek] = useState(false)
  const [peekTarget, setPeekTarget] = useState<'tianlei' | 'ziyu' | null>(null)
  const [showBedroom, setShowBedroom] = useState(false)
  const [petBubble, setPetBubble] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      setTianlei(getParentStatus('tianlei', chapter, intimacyDad, intimacyMom))
      setZiyu(getParentStatus('ziyu', chapter, intimacyDad, intimacyMom))
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [chapter, intimacyDad, intimacyMom])

  useEffect(() => {
    const bubbles = [
      '辛巴：汪汪！想出去散步~', '大鱼：喵...别碰我 😾',
      '小十一：来玩呀来玩呀！', '辛巴：主人回来了！摇尾巴~',
      '大鱼：我要睡梓渝的腿上 💤', '小十一：大鱼姐姐好凶呜呜',
    ]
    const timer = setInterval(() => {
      setPetBubble(bubbles[Math.floor(Math.random() * bubbles.length)])
      setTimeout(() => setPetBubble(null), 4000)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const handlePeek = (parent: 'tianlei' | 'ziyu') => {
    setPeekTarget(parent)
    const result = getPeekDetail(parent, chapter)
    if (result.needAI) {
      setPeekDetail('正在偷看...')
      setTimeout(() => setPeekDetail(`${parent === 'tianlei' ? '田雷' : '梓渝'}似乎注意到了你的目光...😳`), 1000)
    } else {
      setPeekDetail(result.detail)
    }
    setShowPeek(true)
  }

  const hour = new Date().getHours()
  const isNight = hour >= 22 || hour < 7
  const isEvening = hour >= 18 && hour < 22

  const rooms = [
    { name: '主卧', icon: '🛏️', color: 'from-pink-500/8 to-rose-500/4', accent: 'border-pink-400/8',
      occupants: isNight ? ['👨', '🧑'] : [] },
    { name: '浴室', icon: '🚿', color: 'from-sky-500/8 to-blue-500/4', accent: 'border-sky-400/8', occupants: [] },
    { name: '厨房', icon: '🍳', color: 'from-orange-500/8 to-amber-500/4', accent: 'border-orange-400/8', occupants: [] },
    { name: '客厅', icon: '🛋️', color: 'from-violet-500/8 to-purple-500/4', accent: 'border-violet-400/8',
      occupants: [], petHere: true },
    { name: '书房', icon: '📚', color: 'from-emerald-500/8 to-green-500/4', accent: 'border-emerald-400/8', occupants: [] },
    { name: '阳台', icon: '🌿', color: 'from-teal-500/8 to-cyan-500/4', accent: 'border-teal-400/8', occupants: [] },
  ]

  if (tianlei && !isNight) {
    const r = rooms.find(rm => rm.name === tianlei.location)
    if (r) r.occupants.push('👨')
  }
  if (ziyu && !isNight) {
    const r = rooms.find(rm => rm.name === ziyu.location)
    if (r) r.occupants.push('🧑')
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" /> <span className="text-sm">返回</span>
        </button>
        <div className="flex items-center gap-1.5">
          {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-400/60" /> : <span className="text-xs">☀️</span>}
          <h2 className="font-semibold text-sm">家里现在</h2>
        </div>
        <span className="text-[11px] text-white/25 tabular-nums">
          {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* 户型图 */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-widest">🏡 户型图</h3>
            <span className="text-[9px] text-white/20">{isNight ? '🌙 深夜' : isEvening ? '🌆 傍晚' : '☀️ 白天'}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {rooms.map(room => (
              <div key={room.name}
                className={`relative rounded-xl bg-gradient-to-br ${room.color} ${room.accent} border p-2.5 transition-all duration-300 hover:scale-[1.02] min-h-[60px] ${
                  room.name === '主卧' ? 'min-h-[85px]' : ''
                } ${room.occupants.length > 0 ? 'ring-1 ring-white/5' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{room.icon}</span>
                  <span className="text-[9px] text-white/20">{room.name}</span>
                </div>
                {room.occupants.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {room.occupants.map((o, i) => (
                      <span key={i} className="text-lg animate-fadeIn">{o}</span>
                    ))}
                  </div>
                )}
                {(room as any).petHere && (
                  <div className="absolute top-1.5 right-1.5 text-[8px] opacity-30">🐾</div>
                )}
              </div>
            ))}
          </div>
          {/* 宠物角 */}
          <div className="mt-1.5 rounded-xl bg-gradient-to-r from-amber-500/[0.06] to-orange-500/[0.06] border border-amber-400/[0.06] p-2 flex items-center gap-2 relative">
            <div className="flex gap-1">
              <span className="text-sm" title="辛巴">🐕</span>
              <span className="text-sm" title="大鱼">🐱</span>
              <span className="text-sm" title="小十一">🐱</span>
            </div>
            <span className="text-[9px] text-white/25">宠物角</span>
            {petBubble && (
              <div className="absolute -top-9 right-2 bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] text-white/70 animate-fadeIn whitespace-nowrap border border-white/10 shadow-lg">
                {petBubble}
              </div>
            )}
          </div>
        </div>

        {/* 爸妈状态卡 */}
        {tianlei && ziyu && (
          <div className="grid grid-cols-2 gap-2.5">
            <ParentCard status={tianlei} color="violet" onPeek={() => handlePeek('tianlei')} onChat={() => setCurrentApp('chat-dad')} />
            <ParentCard status={ziyu} color="rose" onPeek={() => handlePeek('ziyu')} onChat={() => setCurrentApp('chat-mom')} />
          </div>
        )}

        {/* 偷看浮层 */}
        {showPeek && peekTarget && (
          <div className="glass-card p-4 border-pink-400/10 animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-lg bg-pink-500/15 flex items-center justify-center">
                <Eye className="w-3 h-3 text-pink-400" />
              </div>
              <span className="font-medium text-xs text-pink-300/80">偷看{peekTarget === 'tianlei' ? '爸爸' : '妈妈'}中...</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">{peekDetail}</p>
            <button onClick={() => setShowPeek(false)} className="mt-2.5 text-[11px] text-white/20 hover:text-white/40 transition-colors">关闭</button>
          </div>
        )}

        {/* 深夜卧室 */}
        {isNight && (
          <div className="glass-card p-5 border-indigo-400/[0.06]">
            <div className="text-center">
              <div className="text-3xl mb-2 animate-breathe">🔒</div>
              <p className="text-xs text-white/40 mb-1">卧室门已关</p>
              <p className="text-[11px] text-white/25">{getBedroomScene(chapter)}</p>
              <div className="flex gap-2 mt-3 justify-center">
                <button onClick={() => setShowBedroom(true)}
                  className="glass-btn text-[11px] px-4 py-1.5 !bg-rose-500/10 !border-rose-400/10 !text-rose-300/80 hover:!bg-rose-500/20">
                  <DoorOpen className="w-3 h-3" /> 推门
                </button>
                <button className="glass-btn text-[11px] px-4 py-1.5 !text-white/30">
                  回房间
                </button>
              </div>
              {showBedroom && (
                <div className="mt-3 p-3 bg-rose-500/[0.06] rounded-xl animate-fadeIn border border-rose-400/[0.06]">
                  <p className="text-xs text-rose-300/70 leading-relaxed">
                    {chapter < 3 ? '"宝贝怎么还没睡？快去睡觉！"' : '"你你你进来干嘛！出去出去出去！😳"'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 情侣互动快报 */}
        {tianlei && ziyu && tianlei.status === 'home' && ziyu.status === 'home' && !isNight && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500/[0.04] border border-pink-400/[0.04]">
            <Heart className="w-3.5 h-3.5 text-pink-400/60 animate-pulse" />
            <span className="text-[11px] text-white/35">爸妈都在家~现在感情好好</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ParentCard({ status, color, onPeek, onChat }: {
  status: ParentStatus; color: 'violet' | 'rose'; onPeek: () => void; onChat: () => void
}) {
  const c = {
    violet: { bg: 'from-violet-500/[0.06] to-purple-500/[0.03]', accent: 'border-violet-400/[0.06]', btn: 'bg-violet-500/10 text-violet-300/70 hover:bg-violet-500/20' },
    rose: { bg: 'from-rose-500/[0.06] to-pink-500/[0.03]', accent: 'border-rose-400/[0.06]', btn: 'bg-rose-500/10 text-rose-300/70 hover:bg-rose-500/20' },
  }[color]

  const statusDot = {
    home: 'bg-emerald-400', out: 'bg-amber-400', busy: 'bg-rose-400', sleeping: 'bg-slate-400',
  }[status.status] || 'bg-slate-400'

  const statusLabel = { home: '在家', out: '外出', busy: '忙碌', sleeping: '睡觉' }[status.status] || '未知'

  return (
    <div className={`glass-card p-3 bg-gradient-to-br ${c.bg} ${c.accent} border text-center`}>
      <div className="relative w-12 h-12 mx-auto mb-2">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center border ${c.accent}`}>
          <span className="text-xl">{status.icon}</span>
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusDot} border-2 border-[#0c0015]`} />
      </div>
      <span className="font-semibold text-[13px]">{status.name}</span>
      <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full ${statusDot} text-white ml-1`}>{statusLabel}</span>
      <p className="text-[11px] text-white/45 mt-1.5">{status.emoji} {status.activity}</p>
      <p className="text-[9px] text-white/20 mt-0.5">{status.location}</p>
      <div className="flex gap-1.5 mt-2.5">
        <button onClick={onPeek} className={`flex-1 py-1.5 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 ${c.btn}`}>
          <Eye className="w-3 h-3" /> 偷看
        </button>
        <button onClick={onChat} className="flex-1 py-1.5 rounded-lg text-[10px] bg-white/[0.04] text-white/40 hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1">
          <MessageCircle className="w-3 h-3" /> 消息
        </button>
      </div>
    </div>
  )
}
