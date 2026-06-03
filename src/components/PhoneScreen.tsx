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
  Home, MessageCircle, Users, Bell, Phone, 
  Instagram, Globe, ChevronLeft, Settings, PawPrint, House2, Sparkles
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

  const BottomNav = () => (
    <nav className="h-16 glass flex items-center justify-around px-2 border-t border-white/10">
      <NavItem icon={Home} label="首页" active={currentApp === 'home'} onClick={() => setCurrentApp('home')} />
      <NavItem icon={MessageCircle} label="聊天" active={currentApp.startsWith('chat')} onClick={() => setCurrentApp('chat')} badge={3} />
      <NavItem icon={House2} label="家里" active={currentApp === 'family'} onClick={() => setCurrentApp('family')} dot />
      <NavItem icon={PawPrint} label="宠物" active={currentApp === 'pets'} onClick={() => setCurrentApp('pets')} />
      <NavItem icon={Sparkles} label="换装" active={currentApp === 'dressup'} onClick={() => setCurrentApp('dressup')} />
    </nav>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {renderApp()}
      </div>
      <BottomNav />
      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
      {incomingCall && <CallScreen />}
    </div>
  )
}

function NavItem({ icon: Icon, label, active, onClick, badge, dot }: { 
  icon: any; label: string; active: boolean; onClick: () => void; badge?: number; dot?: boolean 
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
        active ? 'text-purple-400' : 'text-white/60'
      }`}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        {dot && <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" />}
      </div>
      <span className="text-[9px]">{label}</span>
    </button>
  )
}
