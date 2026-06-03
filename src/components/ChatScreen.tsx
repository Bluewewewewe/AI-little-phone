'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore, ChatMessage } from '@/store/useStore'

interface ChatScreenProps {
  chatType: 'family' | 'dad' | 'mom'
  onBack: () => void
}

export default function ChatScreen({ chatType, onBack }: ChatScreenProps) {
  const { 
    identity, 
    familyMessages, 
    dadMessages, 
    momMessages,
    addMessage,
    isTyping,
    setTyping,
    incrementIntimacy,
    intimacyDad,
    intimacyMom,
  } = useStore()
  
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const messages = chatType === 'family' ? familyMessages 
    : chatType === 'dad' ? dadMessages 
    : momMessages
  
  const chatName = chatType === 'family' ? '家庭群' 
    : chatType === 'dad' ? identity?.roleA_name || '爸爸'
    : identity?.roleB_name || '妈妈'
  
  const chatEmoji = chatType === 'family' ? '👨‍👩‍👧' 
    : chatType === 'dad' ? '👨' 
    : '👩'

  const otherName = chatType === 'dad' 
    ? identity?.roleB_name || '妈妈'
    : chatType === 'mom'
    ? identity?.roleA_name || '爸爸'
    : null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      type: 'text',
      isRead: true,
    }
    
    addMessage(chatType, userMessage)
    setInputValue('')
    setIsLoading(true)
    
    const other = chatType === 'dad' ? 'mom' : 'dad'
    if (chatType === 'family') {
      setTyping('dad', true)
      setTimeout(() => setTyping('mom', true), 500)
    } else {
      setTyping(other, true)
    }
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: inputValue.trim() }],
          chatType,
          userId: useStore.getState().userId,
          identity,
          intimacyDad,
          intimacyMom,
        }),
      })
      
      const data = await response.json()
      
      const aiSenders: ('dad' | 'mom')[] = chatType === 'family' ? ['dad', 'mom'] : [chatType === 'dad' ? 'dad' : 'mom']
      
      for (const sender of aiSenders) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          sender,
          content: sender === 'dad' ? data.content : data.content,
          timestamp: new Date(),
          type: 'text',
          isRead: false,
        }
        addMessage(chatType, aiMessage)
        incrementIntimacy(sender, 3)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + Math.random()).toString(),
        sender: chatType === 'dad' ? 'dad' : chatType === 'mom' ? 'mom' : 'dad',
        content: '宝贝想聊什么呢？爸爸/妈妈在呢~',
        timestamp: new Date(),
        type: 'text',
        isRead: false,
      }
      addMessage(chatType, fallbackMessage)
    } finally {
      setIsLoading(false)
      setTyping('dad', false)
      setTyping('mom', false)
    }
  }

  const glassBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.4)',
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <button onClick={onBack} 
          className="flex items-center gap-1 text-amber-900/50 hover:text-amber-800/70 transition-colors py-1 px-2 -ml-2 rounded-xl hover:bg-white/20">
          <span className="text-lg">←</span>
          <span className="text-sm">返回</span>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-lg">{chatEmoji}</span>
          <span className="font-semibold text-sm text-amber-900">{chatName}</span>
        </div>
        
        <div className="flex gap-1">
          <button className="p-2 rounded-xl hover:bg-white/20 transition-colors text-sm">📞</button>
          <button className="p-2 rounded-xl hover:bg-white/20 transition-colors text-sm">📹</button>
          <button className="p-2 rounded-xl hover:bg-white/20 transition-colors text-sm">⋯</button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-amber-900/50 py-8">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm">还没有消息</p>
            <p className="text-xs mt-1">开始和{chatName}聊天吧~</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            identity={identity}
            isOwn={msg.sender === 'user'}
          />
        ))}
        
        {isTyping.dad || isTyping.mom ? (
          <div className="flex items-center gap-2 text-amber-900/50 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-amber-700/30 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-amber-700/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2 h-2 bg-amber-700/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>
              {chatType === 'family' 
                ? (isTyping.dad ? identity?.roleA_name : identity?.roleB_name) + '正在输入...'
                : chatName + '正在输入...'
              }
            </span>
          </div>
        ) : null}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="px-3 pb-2 pt-2"
        style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-xl hover:bg-white/20 transition-colors text-lg">🖼️</button>
          <button className="p-2 rounded-xl hover:bg-white/20 transition-colors text-lg">🎤</button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="w-full bg-white/30 backdrop-blur-xl rounded-2xl px-4 py-3 pr-10 text-sm focus:outline-none focus:bg-white/40 transition-colors"
              style={{ boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.5)' }}
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-xl transition-colors text-sm">
              😊
            </button>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 rounded-2xl transition-all active:scale-90"
            style={inputValue.trim() && !isLoading ? {
              background: 'rgba(245,158,11,0.25)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 2px 8px rgba(245,158,11,0.15), inset 0 0.5px 0 rgba(255,255,255,0.4)',
            } : {
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <span className="text-lg">{inputValue.trim() ? '🚀' : '➤'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// 消息气泡组件
function MessageBubble({ 
  message, 
  identity, 
  isOwn 
}: { 
  message: ChatMessage
  identity: any
  isOwn: boolean
}) {
  const senderName = message.sender === 'user' 
    ? identity?.user_name || '我'
    : message.sender === 'dad'
    ? identity?.roleA_name || '爸爸'
    : identity?.roleB_name || '妈妈'
  
  const senderEmoji = message.sender === 'user' ? '👧' 
    : message.sender === 'dad' ? '👨' : '👩'

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} animate-fadeIn`}>
      {/* 头像 */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
        style={{
          background: isOwn ? 'rgba(6,182,212,0.2)' : message.sender === 'dad' ? 'rgba(245,158,11,0.2)' : 'rgba(236,72,153,0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.4)',
        }}>
        {senderEmoji}
      </div>
      
      {/* 消息内容 */}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <span className={`text-xs text-amber-900/50 ${isOwn ? 'text-right' : 'text-left'}`}>
          {senderName}
        </span>
        <div className={`px-4 py-2.5 rounded-2xl ${
          isOwn ? 'rounded-br-md' : 'rounded-bl-md'
        }`}
          style={isOwn ? {
            background: 'rgba(6,182,212,0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.4)',
          } : {
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.4)',
          }}
        >
          <p className={`text-[13px] leading-relaxed ${isOwn ? 'text-amber-900' : 'text-amber-900'}`}>
            {message.content}
          </p>
        </div>
        <span className="text-[10px] text-amber-900/30">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
