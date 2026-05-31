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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* 手机外框 */}
      <div className="w-full max-w-[430px] h-[932px] bg-black rounded-[55px] p-3 shadow-2xl relative overflow-hidden">
        {/* 刘海区域 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[34px] bg-black rounded-b-3xl z-50" />
        
        {/* 手机内屏 */}
        <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900 rounded-[47px] overflow-hidden flex flex-col">
          {/* 状态栏 */}
          <StatusBar />
          
          {/* 主屏幕内容 */}
          <PhoneScreen />
          
          {/* 底部导航指示器 */}
          <div className="h-[34px] flex items-center justify-center">
            <div className="w-[134px] h-[5px] bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* 亲密度面板（悬浮） */}
      <IntimacyPanel />
    </div>
  )
}
