'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import PhoneScreen from '@/components/PhoneScreen'
import StatusBar from '@/components/StatusBar'
import DesktopInfoPanel from '@/components/DesktopInfoPanel'

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
    <div className="phone-page">
      {/* 背景氛围光 - 桌面端 */}
      <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 左侧信息面板 - 桌面端 */}
      <DesktopInfoPanel />

      {/* 手机外框 */}
      <div className="phone-frame">
        {/* Dynamic Island */}
        <div className="dynamic-island" />

        {/* 手机内屏 */}
        <div className="phone-screen">
          <StatusBar />
          <div className="flex-1 overflow-hidden">
            <PhoneScreen />
          </div>
          <div className="home-indicator">
            <div className="w-[134px] h-[5px] bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
