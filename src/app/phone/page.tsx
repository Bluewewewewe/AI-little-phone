'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import PhoneScreen from '@/components/PhoneScreen'
import StatusBar from '@/components/StatusBar'
import DesktopInfoPanel from '@/components/DesktopInfoPanel'

export default function PhonePage() {
  const { identity, hasCompletedSetup, currentApp } = useStore()

  useEffect(() => {
    if (!hasCompletedSetup || !identity) {
      window.location.href = '/'
    }
  }, [hasCompletedSetup, identity])

  if (!hasCompletedSetup || !identity) {
    return null
  }

  const isHome = currentApp === 'home'

  return (
    <div className="phone-page">
      {/* 背景氛围光 - 桌面端 */}
      <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-300/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 左侧信息面板 - 仅桌面端首页显示 */}
      {isHome && <DesktopInfoPanel />}

      {isHome ? (
        /* ===== 首页模式：手机框包裹 ===== */
        <div className="phone-frame">
          <div className="phone-screen">
            <StatusBar />
            <div className="flex-1 overflow-hidden">
              <PhoneScreen />
            </div>
            <div className="home-indicator">
              <div className="w-[134px] h-[5px] bg-amber-900/15 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        /* ===== APP全屏模式：像真手机打开APP一样，内容铺满全屏 ===== */
        <div className="w-full h-full absolute inset-0 z-50 bg-gradient-to-b from-[#fef9ee] via-[#fef3c7] to-[#fde68a]">
          <PhoneScreen />
        </div>
      )}
    </div>
  )
}
