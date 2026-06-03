'use client'

import { ReactNode } from 'react'
import StatusBar from './StatusBar'

interface PhoneLayoutProps {
  children: ReactNode
}

export default function PhoneLayout({ children }: PhoneLayoutProps) {
  return (
    <div className="phone-page">
      <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="phone-frame">
        <div className="dynamic-island" />
        <div className="phone-screen">
          <StatusBar />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          <div className="home-indicator">
            <div className="w-[134px] h-[5px] bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
