'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import HomeScreen from './HomeScreen'
import ChatScreen from './ChatScreen'
import MomentsScreen from './MomentsScreen'
import WeiboScreen from './WeiboScreen'
import NotificationCenter from './NotificationCenter'
import CallScreen from './CallScreen'
import PetScreen from './PetScreen'
import FamilyHomeScreen from './FamilyHomeScreen'
import DressUpScreen from './DressUpScreen'

export default function PhoneScreen() {
  const { currentApp, setCurrentApp, incomingCall } = useStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [animDir, setAnimDir] = useState<'open'|'close'>('open')
  const [appBarTime, setAppBarTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setAppBarTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }))
    }
    updateTime()
    const t = setInterval(updateTime, 1000)
    return () => clearInterval(t)
  }, [])

  const isHome = currentApp === 'home'

  const openApp = useCallback((appId: string) => {
    setAnimDir('open')
    setAnimating(true)
    setCurrentApp(appId)
    setTimeout(() => setAnimating(false), 350)
  }, [setCurrentApp])

  const goHome = useCallback(() => {
    setAnimDir('close')
    setAnimating(true)
    setTimeout(() => {
      setCurrentApp('home')
      setAnimating(false)
    }, 300)
  }, [setCurrentApp])

  const renderApp = () => {
    switch (currentApp) {
      case 'chat': return <ChatScreen chatType="family" onBack={goHome} />
      case 'chat-dad': return <ChatScreen chatType="dad" onBack={goHome} />
      case 'chat-mom': return <ChatScreen chatType="mom" onBack={goHome} />
      case 'moments': return <MomentsScreen onBack={goHome} />
      case 'weibo': return <WeiboScreen onBack={goHome} />
      case 'pets': return <PetScreen onBack={goHome} />
      case 'family': return <FamilyHomeScreen onBack={goHome} />
      case 'dressup': return <DressUpScreen onBack={goHome} />
      default: return null
    }
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      
      {/* 桌面层 - 始终在底下 */}
      <div className={`absolute inset-0 transition-all duration-300 ${
        isHome ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <HomeScreen onOpenApp={openApp} />
      </div>

      {/* APP层 - 打开时从底部滑上来 */}
      {!isHome && (
        <div className={`absolute inset-0 flex flex-col transition-all duration-300 ease-out ${
          animating && animDir === 'open' ? 'animate-appOpen' : ''
        }`}>
          {/* APP内状态栏 */}
          <div className="app-status-bar text-amber-900 flex-shrink-0">
            <span className="font-semibold text-[14px]">
              {appBarTime || '--:--'}
            </span>
            <div className="flex items-center gap-[6px] text-xs">
              <span>📶</span>
              <span className="text-[10px] leading-none">87%</span>
            </div>
          </div>
          
          {/* APP内容 - flex-1 撑满剩余空间 */}
          <div className="flex-1 overflow-hidden">
            {renderApp()}
          </div>

          {/* Home Indicator - 暖色半透明底条 */}
          <div className="flex-shrink-0">
            <button 
              onClick={goHome}
              className="w-full flex items-center justify-center py-2 bg-amber-900/10 backdrop-blur-md active:bg-amber-900/20 transition-colors"
            >
              <div className="w-[134px] h-[5px] bg-amber-900/20 rounded-full" />
            </button>
          </div>
        </div>
      )}

      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
      {incomingCall && <CallScreen onBack={goHome} />}
    </div>
  )
}
