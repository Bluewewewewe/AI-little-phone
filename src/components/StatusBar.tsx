'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Wifi, Signal, Battery, Sun, Moon } from 'lucide-react'

export default function StatusBar() {
  const { isDarkMode, toggleTheme } = useStore()
  const [timeString, setTimeString] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setTimeString(new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }))
    }
    updateTime()
    const t = setInterval(updateTime, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="status-bar text-amber-900">
      <span className="font-semibold text-[14px]">{timeString || '--:--'}</span>
      
      <div className="flex items-center gap-[6px]">
        <button 
          onClick={toggleTheme}
          className="p-0.5 hover:bg-amber-800/10 rounded transition-colors"
        >
          {isDarkMode ? (
            <Moon className="w-[14px] h-[14px]" />
          ) : (
            <Sun className="w-[14px] h-[14px]" />
          )}
        </button>
        
        <Signal className="w-[14px] h-[14px]" />
        <Wifi className="w-[14px] h-[14px]" />
        <div className="flex items-center gap-[3px]">
          <Battery className="w-[18px] h-[14px]" />
          <span className="text-[10px] leading-none">87%</span>
        </div>
      </div>
    </div>
  )
}
