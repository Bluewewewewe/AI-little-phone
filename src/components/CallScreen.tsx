'use client'

import { useStore } from '@/store/useStore'
import { useState, useEffect } from 'react'


export default function CallScreen() {
  const { incomingCall, setIncomingCall, identity } = useStore()
  const [isAccepted, setIsAccepted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const callerName = incomingCall?.who === 'dad' 
    ? identity?.roleA_name || '爸爸'
    : identity?.roleB_name || '妈妈'
  
  const callerEmoji = incomingCall?.who === 'dad' ? '👨' : '👩'

  useEffect(() => {
    if (isAccepted) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isAccepted])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAccept = () => {
    setIsAccepted(true)
  }

  const handleDecline = () => {
    setIncomingCall(null)
    setIsAccepted(false)
    setCallDuration(0)
  }

  if (!incomingCall) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
         style={{
           background: 'linear-gradient(135deg, #fef9ee 0%, #fef3c7 40%, #fde68a 100%)',
         }}>
      {/* 顶部 */}
      <div className="p-5 flex items-center justify-between">
        <button 
          onClick={handleDecline}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/25 backdrop-blur-xl active:scale-90 transition-transform"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.5)' }}
        >
          <span className="text-amber-900/60 text-sm">✕</span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/25 backdrop-blur-xl"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.5)' }}>
          <span className="text-sm">🔊</span>
        </button>
      </div>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* 头像 */}
        <div className="w-28 h-28 rounded-full bg-white/30 backdrop-blur-xl flex items-center justify-center mb-6"
             style={{ boxShadow: '0 4px 20px rgba(120,80,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.6)' }}>
          <span className="text-5xl">{callerEmoji}</span>
        </div>

        {/* 名字 */}
        <h2 className="text-2xl font-bold mb-2 text-amber-900">{callerName}</h2>
        
        {isAccepted ? (
          <p className="text-amber-800/50 text-sm">{formatDuration(callDuration)}</p>
        ) : (
          <p className="text-amber-800/50 text-sm">来电中...</p>
        )}

        {/* 通话字幕 */}
        {isAccepted && (
          <div className="mt-8 w-full max-w-sm space-y-3">
            <CallBubble text={`宝贝在吗？${callerName}想你了~`} isOwn={false} />
            <CallBubble text={`嗯，我在呢~`} isOwn={true} />
            <CallBubble text={`今天过得怎么样？有没有好好吃饭？`} isOwn={false} />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="p-8 flex justify-center gap-10">
        {!isAccepted ? (
          <>
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-red-400/25 backdrop-blur-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ boxShadow: '0 2px 10px rgba(239,68,68,0.15), inset 0 0.5px 0 rgba(255,255,255,0.4)' }}
            >
              <span className="text-xl">📵</span>
            </button>
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-green-400/25 backdrop-blur-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ boxShadow: '0 2px 10px rgba(34,197,94,0.15), inset 0 0.5px 0 rgba(255,255,255,0.4)' }}
            >
              <span className="text-xl">📞</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleDecline}
            className="w-18 h-18 rounded-full bg-red-400/25 backdrop-blur-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ boxShadow: '0 2px 10px rgba(239,68,68,0.15), inset 0 0.5px 0 rgba(255,255,255,0.4)', width: '72px', height: '72px' }}
          >
            <span className="text-2xl">📵</span>
          </button>
        )}
      </div>
    </div>
  )
}

// 通话字幕气泡
function CallBubble({ text, isOwn }: { text: string; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl backdrop-blur-xl ${
        isOwn 
          ? 'bg-amber-500/20 text-amber-900 rounded-br-sm' 
          : 'bg-white/30 text-amber-900 rounded-bl-sm'
      }`}
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.4)' }}
      >
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
