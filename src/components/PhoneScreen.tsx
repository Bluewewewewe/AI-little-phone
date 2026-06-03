'use client'

import { useState, useCallback } from 'react'
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
        <div className={`absolute inset-0 transition-all duration-300 ease-out ${
          animating && animDir === 'open' ? 'animate-appOpen' : ''
        }`}>
          {/* APP内状态栏（覆盖式） */}
          <div className="flex items-center justify-between px-6 h-8 flex-shrink-0">
            <span className="text-xs font-medium">
              {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span>📶</span>
              <span>87%</span>
            </div>
          </div>
          
          {/* APP内容 */}
          <div className="flex-1 overflow-hidden">
            {renderApp()}
          </div>
        </div>
      )}

      {/* 底部Home条 - 在APP内显示，点击回桌面 */}
      {!isHome && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <button 
            onClick={goHome}
            className="w-full flex items-center justify-center py-2 bg-black/40 backdrop-blur-md active:bg-black/60 transition-colors"
          >
            <div className="w-[134px] h-[5px] bg-white/30 rounded-full" />
          </button>
        </div>
      )}

      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
      {incomingCall && <CallScreen />}
    </div>
  )
}
