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
    <div className="h-8 px-6 flex items-center justify-between text-xs">
      {/* 左侧：时间 */}
      <span className="font-medium">{timeString || '--:--'}</span>
      
      {/* 右侧：状态图标 */}
      <div className="flex items-center gap-2">
        {/* 主题切换 */}
        <button 
          onClick={toggleTheme}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          {isDarkMode ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
        </button>
        
        {/* 信号强度 */}
        <Signal className="w-3.5 h-3.5" />
        
        {/* WiFi */}
        <Wifi className="w-3.5 h-3.5" />
        
        {/* 电池 */}
        <div className="flex items-center gap-0.5">
          <Battery className="w-4 h-3.5" />
          <span className="text-[10px]">87%</span>
        </div>
      </div>
    </div>
  )
}
