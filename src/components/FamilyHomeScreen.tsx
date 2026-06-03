'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { getParentStatus, getPeekDetail, getBedroomScene, ParentStatus } from '@/lib/parent-status'
import { ChevronLeft, Eye, DoorOpen, Camera, Phone, MessageCircle } from 'lucide-react'

export default function FamilyHomeScreen({ onBack }: { onBack: () => void }) {
  const { chapter, intimacyDad, intimacyMom, setCurrentApp } = useStore()
  const [tianlei, setTianlei] = useState<ParentStatus | null>(null)
  const [ziyu, setZiyu] = useState<ParentStatus | null>(null)
  const [peekDetail, setPeekDetail] = useState<string>('')
  const [showPeek, setShowPeek] = useState(false)
  const [showBedroom, setShowBedroom] = useState(false)

  // 每分钟更新状态
  useEffect(() => {
    const update = () => {
      setTianlei(getParentStatus('tianlei', chapter, intimacyDad, intimacyMom))
      setZiyu(getParentStatus('ziyu', chapter, intimacyDad, intimacyMom))
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [chapter, intimacyDad, intimacyMom])

  const handlePeek = (parent: 'tianlei' | 'ziyu') => {
    const result = getPeekDetail(parent, chapter)
    if (result.needAI) {
      setPeekDetail('正在偷看...')
      // TODO: 调AI生成细节
      setTimeout(() => setPeekDetail(`${parent === 'tianlei' ? '田雷' : '梓渝'}似乎注意到了你的目光...😳`), 1000)
    } else {
      setPeekDetail(result.detail)
    }
    setShowPeek(true)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'home': return 'bg-green-500'
      case 'out': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'sleeping': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'home': return '在家'
      case 'out': return '外出'
      case 'busy': return '忙碌'
      case 'sleeping': return '睡觉'
      default: return '未知'
    }
  }

  const hour = new Date().getHours()
  const isNight = hour >= 22 || hour < 7

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-900/50 to-indigo-900/50">
      {/* 顶栏 */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 hover:text-white">
          <ChevronLeft className="w-5 h-5" /> 返回
        </button>
        <h2 className="font-bold">🏠 家里现在</h2>
        <span className="text-xs text-white/50">{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* 家庭俯视图 */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium mb-3 text-white/70">🏡 家庭场景</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: '卧室', icon: '🛏️', color: 'from-pink-900/30 to-pink-800/20',
                occupants: isNight ? [tianlei?.icon || '', ziyu?.icon || ''] : [] },
              { name: '浴室', icon: '🚿', color: 'from-blue-900/30 to-blue-800/20', occupants: [] },
              { name: '厨房', icon: '🍳', color: 'from-orange-900/30 to-orange-800/20',
                occupants: tianlei?.location === '厨房' || ziyu?.location === '厨房' 
                  ? [tianlei?.location === '厨房' ? '👨' : '', ziyu?.location === '厨房' ? '🧑' : ''].filter(Boolean) : [] },
              { name: '客厅', icon: '🛋️', color: 'from-purple-900/30 to-purple-800/20',
                occupants: tianlei?.location === '客厅' || ziyu?.location === '客厅'
                  ? [tianlei?.location === '客厅' ? '👨' : '', ziyu?.location === '客厅' ? '🧑' : ''].filter(Boolean) : [] },
              { name: '书房', icon: '📚', color: 'from-green-900/30 to-green-800/20', occupants: [] },
              { name: '阳台', icon: '🌿', color: 'from-emerald-900/30 to-emerald-800/20',
                occupants: tianlei?.location === '阳台' || ziyu?.location === '阳台'
                  ? [tianlei?.location === '阳台' ? '👨' : '', ziyu?.location === '阳台' ? '🧑' : ''].filter(Boolean) : [] },
            ].map(room => (
              <div key={room.name} className={`rounded-xl bg-gradient-to-b ${room.color} p-2 text-center border border-white/5`}>
                <div className="text-lg">{room.icon}</div>
                <div className="text-[10px] text-white/60">{room.name}</div>
                {room.occupants.length > 0 && (
                  <div className="text-sm mt-1">{room.occupants.join(' ')}</div>
                )}
              </div>
            ))}
          </div>
          {/* 宠物角 */}
          <div className="mt-2 rounded-xl bg-gradient-to-b from-amber-900/30 to-amber-800/20 p-2 text-center border border-white/5">
            <div className="text-sm">🐾 辛巴🐕 大鱼🐱 小十一🐱</div>
            <div className="text-[10px] text-white/60">宠物角</div>
          </div>
        </div>

        {/* 爸妈状态卡片 */}
        {tianlei && ziyu && (
          <>
            <StatusCard 
              status={tianlei} 
              onPeek={() => handlePeek('tianlei')}
              onCall={() => setCurrentApp('chat-dad')}
            />
            <StatusCard 
              status={ziyu} 
              onPeek={() => handlePeek('ziyu')}
              onCall={() => setCurrentApp('chat-mom')}
            />
          </>
        )}

        {/* 偷看详情 */}
        {showPeek && (
          <div className="glass-card p-4 border border-pink-400/30 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-pink-400" />
              <span className="font-medium text-sm text-pink-300">偷看中...</span>
            </div>
            <p className="text-sm text-white/80">{peekDetail}</p>
            <button onClick={() => setShowPeek(false)} className="mt-2 text-xs text-white/50">关闭</button>
          </div>
        )}

        {/* 深夜卧室 */}
        {isNight && (
          <div className="glass-card p-4 border border-red-400/20">
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm text-white/70">{getBedroomScene(chapter)}</p>
              <div className="flex gap-2 mt-3 justify-center">
                <button 
                  onClick={() => setShowBedroom(true)}
                  className="px-4 py-2 bg-red-500/20 rounded-xl text-xs hover:bg-red-500/30 flex items-center gap-1"
                >
                  <DoorOpen className="w-3.5 h-3.5" /> 推门
                </button>
                <button 
                  onClick={() => setShowPeek(false)}
                  className="px-4 py-2 bg-gray-500/20 rounded-xl text-xs hover:bg-gray-500/30"
                >
                  回房间
                </button>
              </div>
            </div>
            {showBedroom && (
              <div className="mt-3 p-3 bg-red-500/10 rounded-xl animate-fadeIn">
                <p className="text-sm text-red-300">
                  {chapter < 3 
                    ? '"宝贝怎么还没睡？快去睡觉！"' 
                    : '"你你你进来干嘛！出去出去出去！😳"'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusCard({ status, onPeek, onCall }: { 
  status: ParentStatus; onPeek: () => void; onCall: () => void 
}) {
  return (
    <div className="glass-card p-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="text-3xl">{status.icon}</span>
          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{status.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(status.status)} text-white`}>
              {getStatusLabel(status.status)}
            </span>
          </div>
          <p className="text-sm text-white/70 mt-1">{status.emoji} {status.activity}</p>
          <p className="text-xs text-white/40">{status.location}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={onPeek} className="flex-1 py-1.5 bg-pink-500/20 rounded-lg text-xs hover:bg-pink-500/30 flex items-center justify-center gap-1">
          <Eye className="w-3 h-3" /> 偷看
        </button>
        <button onClick={onCall} className="flex-1 py-1.5 bg-purple-500/20 rounded-lg text-xs hover:bg-purple-500/30 flex items-center justify-center gap-1">
          <MessageCircle className="w-3 h-3" /> 发消息
        </button>
      </div>
    </div>
  )
}
