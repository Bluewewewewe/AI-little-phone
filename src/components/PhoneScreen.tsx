'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import HomeScreen from './HomeScreen'
import ChatScreen from './ChatScreen'
import MomentsScreen from './MomentsScreen'
import WeiboScreen from './WeiboScreen'
import NotificationCenter from './NotificationCenter'
import CallScreen from './CallScreen'
import { 
  Home, MessageCircle, Users, Bell, Phone, 
  Instagram, Globe, ChevronLeft, Settings
} from 'lucide-react'

export default function PhoneScreen() {
  const { 
    currentApp, 
    setCurrentApp, 
    notifications, 
    unreadCount,
    incomingCall,
  } = useStore()
  
  const [showNotifications, setShowNotifications] = useState(false)

  // 渲染当前应用
  const renderApp = () => {
    switch (currentApp) {
      case 'chat':
        return <ChatScreen chatType="family" onBack={() => setCurrentApp('home')} />
      case 'chat-dad':
        return <ChatScreen chatType="dad" onBack={() => setCurrentApp('home')} />
      case 'chat-mom':
        return <ChatScreen chatType="mom" onBack={() => setCurrentApp('home')} />
      case 'moments':
        return <MomentsScreen onBack={() => setCurrentApp('home')} />
      case 'weibo':
        return <WeiboScreen onBack={() => setCurrentApp('home')} />
      default:
        return <HomeScreen />
    }
  }

  // 底部导航栏
  const BottomNav = () => (
    <nav className="h-16 glass flex items-center justify-around px-4 border-t border-white/10">
      <NavItem 
        icon={Home} 
        label="首页" 
        active={currentApp === 'home'} 
        onClick={() => setCurrentApp('home')} 
      />
      <NavItem 
        icon={MessageCircle} 
        label="聊天" 
        active={currentApp.startsWith('chat')} 
        onClick={() => setCurrentApp('chat')} 
        badge={3}
      />
      <NavItem 
        icon={Instagram} 
        label="朋友圈" 
        active={currentApp === 'moments'} 
        onClick={() => setCurrentApp('moments')} 
      />
      <NavItem 
        icon={Globe} 
        label="微博" 
        active={currentApp === 'weibo'} 
        onClick={() => setCurrentApp('weibo')} 
        badge={12}
      />
      <NavItem 
        icon={Bell} 
        label="通知" 
        active={showNotifications} 
        onClick={() => setShowNotifications(true)} 
        badge={unreadCount}
      />
    </nav>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden">
        {renderApp()}
      </div>
      
      {/* 底部导航 */}
      <BottomNav />
      
      {/* 通知中心 */}
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
      
      {/* 来电界面 */}
      {incomingCall && <CallScreen />}
    </div>
  )
}

// 导航项组件
function NavItem({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  badge 
}: { 
  icon: any
  label: string
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
        active ? 'text-purple-400' : 'text-white/60'
      }`}
    >
      <div className="relative">
        <Icon className="w-6 h-6" />
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px]">{label}</span>
    </button>
  )
}
