'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore, ChatMessage } from '@/store/useStore'
import { 
  ChevronLeft, Send, Smile, MoreHorizontal, 
  Phone, Video, Image, Mic
} from 'lucide-react'

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
  
  const otherName = chatType === 'dad' 
    ? identity?.roleB_name || '妈妈'
    : chatType === 'mom'
    ? identity?.roleA_name || '爸爸'
    : null

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // 发送消息
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
    
    // 显示对方正在输入
    const other = chatType === 'dad' ? 'mom' : 'dad'
    if (chatType === 'family') {
      setTyping('dad', true)
      setTimeout(() => setTyping('mom', true), 500)
    } else {
      setTyping(other, true)
    }
    
    try {
      // 调用API
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
      
      // 添加AI回复
      const aiSenders: ('dad' | 'mom')[] = chatType === 'family' ? ['dad', 'mom'] : [chatType === 'dad' ? 'dad' : 'mom']
      
      for (const sender of aiSenders) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          sender,
          content: sender === 'dad' ? data.content : data.content, // 后续可区分
          timestamp: new Date(),
          type: 'text',
          isRead: false,
        }
        addMessage(chatType, aiMessage)
        
        // 增加亲密度
        incrementIntimacy(sender, 3)
      }
    } catch (error) {
      console.error('Chat error:', error)
      // 添加预设回复
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

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="glass px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1">
          <h2 className="font-bold">{chatName}</h2>
          {otherName && (
            <p className="text-xs text-white/50">
              和{identity?.user_name || '宝贝'}的聊天
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full">
            <Phone className="w-5 h-5 text-white/70" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full">
            <Video className="w-5 h-5 text-white/70" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/40 py-8">
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
        
        {/* 正在输入提示 */}
        {isTyping.dad || isTyping.mom ? (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
      <div className="glass p-3 border-t border-white/10">
        <div className="flex items-end gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full">
            <Image className="w-5 h-5 text-white/70" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full">
            <Mic className="w-5 h-5 text-white/70" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-purple-500/50"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full">
              <Smile className="w-5 h-5 text-white/50" />
            </button>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-full transition-all ${
              inputValue.trim() && !isLoading
                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                : 'bg-white/10'
            }`}
          >
            <Send className={`w-5 h-5 ${inputValue.trim() ? 'text-white' : 'text-white/30'}`} />
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
  
  const avatarBg = message.sender === 'user'
    ? 'from-cyan-500 to-blue-500'
    : message.sender === 'dad'
    ? 'from-purple-500 to-violet-500'
    : 'from-pink-500 to-rose-500'

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} animate-fadeIn`}>
      {/* 头像 */}
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <span className="text-xs font-bold text-white">
          {senderName.slice(0, 1)}
        </span>
      </div>
      
      {/* 消息内容 */}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <span className={`text-xs text-white/50 ${isOwn ? 'text-right' : 'text-left'}`}>
          {senderName}
        </span>
        <div className={`px-4 py-2.5 rounded-2xl ${
          isOwn 
            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-br-md' 
            : 'glass rounded-bl-md'
        }`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <span className={`text-[10px] text-white/30 ${isOwn ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
