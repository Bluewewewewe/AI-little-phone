'use client'

import { useStore } from '@/store/useStore'
import { useState, useEffect } from 'react'
import { Phone, Video, X, Volume2 } from 'lucide-react'

export default function CallScreen() {
  const { incomingCall, setIncomingCall, identity } = useStore()
  const [isAccepted, setIsAccepted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const callerName = incomingCall?.who === 'dad' 
    ? identity?.roleA_name || '爸爸'
    : identity?.roleB_name || '妈妈'
  
  const callerAvatar = incomingCall?.who === 'dad'
    ? 'from-purple-500 to-violet-500'
    : 'from-pink-500 to-rose-500'

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
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-black z-50 flex flex-col">
      {/* 顶部 */}
      <div className="p-6 flex items-center justify-between">
        <button 
          onClick={handleDecline}
          className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* 头像 */}
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${callerAvatar} flex items-center justify-center mb-6 shadow-2xl animate-pulse`}>
          <span className="text-5xl font-bold text-white">
            {callerName.slice(0, 1)}
          </span>
        </div>

        {/* 名字 */}
        <h2 className="text-2xl font-bold mb-2">{callerName}</h2>
        
        {isAccepted ? (
          <p className="text-white/60">{formatDuration(callDuration)}</p>
        ) : (
          <p className="text-white/60">来电中...</p>
        )}

        {/* 字幕式通话内容 */}
        {isAccepted && (
          <div className="mt-8 w-full max-w-sm space-y-3">
            <CallBubble 
              text={`宝贝在吗？爸爸想你了~`}
              isOwn={false}
            />
            <CallBubble 
              text={`嗯，我在呢~`}
              isOwn={true}
            />
            <CallBubble 
              text={`今天过得怎么样？有没有好好吃饭？`}
              isOwn={false}
            />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="p-8 flex justify-center gap-8">
        {!isAccepted ? (
          <>
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <Phone className="w-7 h-7 text-white rotate-[135deg]" />
            </button>
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
            >
              <Phone className="w-7 h-7 text-white" />
            </button>
          </>
        ) : (
          <button
            onClick={handleDecline}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <Phone className="w-8 h-8 text-white rotate-[135deg]" />
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
      <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
        isOwn 
          ? 'bg-green-500/80 text-white rounded-br-sm' 
          : 'bg-white/20 text-white rounded-bl-sm'
      }`}>
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
