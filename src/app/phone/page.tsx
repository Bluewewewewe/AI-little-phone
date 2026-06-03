'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import PhoneScreen from '@/components/PhoneScreen'
import StatusBar from '@/components/StatusBar'
import IntimacyPanel from '@/components/IntimacyPanel'

export default function PhonePage() {
  const { identity, hasCompletedSetup } = useStore()

  useEffect(() => {
    if (!hasCompletedSetup || !identity) {
      window.location.href = '/'
    }
  }, [hasCompletedSetup, identity])

  if (!hasCompletedSetup || !identity) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#06060f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景氛围光 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600/3 rounded-full blur-[80px] pointer-events-none" />

      {/* 手机外框 */}
      <div className="phone-frame w-full max-w-[430px] h-[932px] relative">
        {/* Dynamic Island */}
        <div className="dynamic-island" />

        {/* 手机内屏 */}
        <div className="phone-screen w-full h-full">
          {/* 状态栏 */}
          <StatusBar />
          
          {/* 主屏幕内容 */}
          <PhoneScreen />
          
          {/* 底部Home指示器 */}
          <div className="h-[34px] flex items-center justify-center flex-shrink-0">
            <div className="w-[134px] h-[5px] bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* 亲密度面板（悬浮） */}
      <IntimacyPanel />
    </div>
  )
}
