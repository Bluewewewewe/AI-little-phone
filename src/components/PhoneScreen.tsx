'use client'

import { useState } from 'react'
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
import { 
  Home, MessageCircle, Users, PawPrint, House2, Sparkles
} from 'lucide-react'

export default function PhoneScreen() {
  const { 
    currentApp, setCurrentApp, notifications, unreadCount, incomingCall,
  } = useStore()
  const [showNotifications, setShowNotifications] = useState(false)

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
      case 'pets':
        return <PetScreen onBack={() => setCurrentApp('home')} />
      case 'family':
        return <FamilyHomeScreen onBack={() => setCurrentApp('home')} />
      case 'dressup':
        return <DressUpScreen onBack={() => setCurrentApp('home')} />
      default:
        return <HomeScreen />
    }
  }

  const navItems = [
    { id: 'home', icon: Home, label: '首页' },
    { id: 'chat', icon: MessageCircle, label: '聊天', badge: 3 },
    { id: 'family', icon: House2, label: '家里', dot: true },
    { id: 'pets', icon: PawPrint, label: '宠物' },
    { id: 'dressup', icon: Sparkles, label: '换装' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {renderApp()}
      </div>
      
      {/* 底部导航 - Liquid Glass 风格 */}
      <nav className="flex-shrink-0 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center justify-around px-2 py-2.5"
          style={{
            background: 'rgba(10, 10, 30, 0.7)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {navItems.map(item => {
            const isActive = item.id === 'home' 
              ? currentApp === 'home' 
              : item.id === 'chat' 
                ? currentApp.startsWith('chat') 
                : currentApp === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentApp(item.id as any)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-white/40'
                }`}
              >
                <div className="relative">
                  <item.icon className={`w-[22px] h-[22px] transition-all duration-300 ${
                    isActive ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : ''
                  }`} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-rose-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/30">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  {item.dot && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
                  )}
                </div>
                <span className={`text-[9px] font-medium tracking-wide ${
                  isActive ? 'text-violet-300' : ''
                }`}>{item.label}</span>
                {/* 选中指示器 */}
                <div className={`nav-indicator ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
              </button>
            )
          })}
        </div>
      </nav>

      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
      {incomingCall && <CallScreen />}
    </div>
  )
}
