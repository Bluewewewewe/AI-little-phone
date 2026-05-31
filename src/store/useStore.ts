import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 用户身份设置
export interface UserIdentity {
  roleA_name: string      // 爸爸称呼
  roleB_name: string      // 妈妈称呼
  user_name: string       // 女儿称呼
  family_mode: string     // 家庭模式
}

// 聊天消息
export interface ChatMessage {
  id: string
  sender: 'user' | 'dad' | 'mom'
  content: string
  timestamp: Date
  type: 'text' | 'voice' | 'emoji' | 'redpacket'
  isRead?: boolean
}

// 朋友圈动态
export interface Moment {
  id: string
  author: 'dad' | 'mom' | 'user'
  content: string
  images: string[]
  likes: { userId: string; author: string }[]
  comments: { userId: string; author: string; content: string; createdAt: Date }[]
  createdAt: Date
}

// 通知
export interface Notification {
  id: string
  type: 'chat' | 'moment' | 'system' | 'call'
  title: string
  content: string
  isRead: boolean
  createdAt: Date
}

// 微博动态
export interface WeiboPost {
  id: string
  author: 'dad' | 'mom'
  content: string
  images: string[]
  likes: number
  comments: number
  reposts: number
  createdAt: Date
  isHot?: boolean
}

// Store状态
interface AppState {
  // 身份设置
  identity: UserIdentity | null
  setIdentity: (identity: UserIdentity) => void
  hasCompletedSetup: boolean
  setHasCompletedSetup: (value: boolean) => void
  
  // 亲密度
  intimacyDad: number
  intimacyMom: number
  dailyIntimacyDad: number
  dailyIntimacyMom: number
  lastChatDate: string
  chapter: number
  incrementIntimacy: (type: 'dad' | 'mom', amount: number) => void
  resetDailyIntimacy: () => void
  
  // 聊天
  familyMessages: ChatMessage[]
  dadMessages: ChatMessage[]
  momMessages: ChatMessage[]
  addMessage: (chatType: 'family' | 'dad' | 'mom', message: ChatMessage) => void
  clearMessages: (chatType: 'family' | 'dad' | 'mom') => void
  
  // 输入状态
  isTyping: { dad: boolean; mom: boolean }
  setTyping: (who: 'dad' | 'mom', typing: boolean) => void
  
  // 朋友圈
  moments: Moment[]
  addMoment: (moment: Moment) => void
  addLike: (momentId: string, userId: string, author: string) => void
  addComment: (momentId: string, comment: { userId: string; author: string; content: string }) => void
  
  // 微博
  weiboPosts: WeiboPost[]
  setWeiboPosts: (posts: WeiboPost[]) => void
  
  // 通知
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  
  // 来电状态
  incomingCall: { who: 'dad' | 'mom'; isVideo: boolean } | null
  setIncomingCall: (call: { who: 'dad' | 'mom'; isVideo: boolean } | null) => void
  
  // 当前页面
  currentApp: string
  setCurrentApp: (app: string) => void
  
  // 主题
  isDarkMode: boolean
  toggleTheme: () => void
  
  // 用户ID（匿名）
  userId: string
  
  // 记忆笔记本
  memoryNotes: MemoryNote[]
  addMemoryNote: (note: MemoryNote) => void
  removeMemoryNote: (id: string) => void
  updateMemoryNote: (id: string, content: string) => void
  getActiveMemoryNotes: () => string[]
}

// 记忆笔记本条目
export interface MemoryNote {
  id: string
  category: 'about_me' | 'chat_summary' | 'important_event' | 'auto_detected' | 'archived'
  content: string
  source: 'manual' | 'ai_assisted' | 'auto'
  created_at: string
  is_active: boolean
}

// 生成匿名用户ID
const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substring(2, 15)
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 身份设置
      identity: null,
      setIdentity: (identity) => set({ identity }),
      hasCompletedSetup: false,
      setHasCompletedSetup: (value) => set({ hasCompletedSetup: value }),
      
      // 亲密度
      intimacyDad: 0,
      intimacyMom: 0,
      dailyIntimacyDad: 0,
      dailyIntimacyMom: 0,
      lastChatDate: new Date().toISOString().split('T')[0],
      chapter: 1,
      incrementIntimacy: (type, amount) => {
        const state = get()
        const today = new Date().toISOString().split('T')[0]
        
        // 检查是否需要重置每日计数
        if (state.lastChatDate !== today) {
          set({
            dailyIntimacyDad: 0,
            dailyIntimacyMom: 0,
            lastChatDate: today,
          })
        }
        
        if (type === 'dad') {
          const newDaily = state.dailyIntimacyDad + amount
          if (newDaily <= 60) {
            set({
              intimacyDad: state.intimacyDad + amount,
              dailyIntimacyDad: newDaily,
            })
          }
        } else {
          const newDaily = state.dailyIntimacyMom + amount
          if (newDaily <= 60) {
            set({
              intimacyMom: state.intimacyMom + amount,
              dailyIntimacyMom: newDaily,
            })
          }
        }
      },
      resetDailyIntimacy: () => {
        set({
          dailyIntimacyDad: 0,
          dailyIntimacyMom: 0,
          lastChatDate: new Date().toISOString().split('T')[0],
        })
      },
      
      // 聊天
      familyMessages: [],
      dadMessages: [],
      momMessages: [],
      addMessage: (chatType, message) => {
        if (chatType === 'family') {
          set((state) => ({ familyMessages: [...state.familyMessages, message] }))
        } else if (chatType === 'dad') {
          set((state) => ({ dadMessages: [...state.dadMessages, message] }))
        } else {
          set((state) => ({ momMessages: [...state.momMessages, message] }))
        }
      },
      clearMessages: (chatType) => {
        if (chatType === 'family') {
          set({ familyMessages: [] })
        } else if (chatType === 'dad') {
          set({ dadMessages: [] })
        } else {
          set({ momMessages: [] })
        }
      },
      
      // 输入状态
      isTyping: { dad: false, mom: false },
      setTyping: (who, typing) => {
        set((state) => ({
          isTyping: { ...state.isTyping, [who]: typing }
        }))
      },
      
      // 朋友圈
      moments: [],
      addMoment: (moment) => set((state) => ({ moments: [moment, ...state.moments] })),
      addLike: (momentId, userId, author) => {
        set((state) => ({
          moments: state.moments.map((m) => {
            if (m.id === momentId) {
              const exists = m.likes.some((l) => l.userId === userId)
              return {
                ...m,
                likes: exists
                  ? m.likes.filter((l) => l.userId !== userId)
                  : [...m.likes, { userId, author }],
              }
            }
            return m
          }),
        }))
      },
      addComment: (momentId, comment) => {
        set((state) => ({
          moments: state.moments.map((m) => {
            if (m.id === momentId) {
              return {
                ...m,
                comments: [...m.comments, { ...comment, createdAt: new Date() }],
              }
            }
            return m
          }),
        }))
      },
      
      // 微博
      weiboPosts: [],
      setWeiboPosts: (posts) => set({ weiboPosts: posts }),
      
      // 通知
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))
      },
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }))
      },
      
      // 来电
      incomingCall: null,
      setIncomingCall: (call) => set({ incomingCall: call }),
      
      // 当前页面
      currentApp: 'home',
      setCurrentApp: (app) => set({ currentApp: app }),
      
      // 主题
      isDarkMode: true,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      // 用户ID
      userId: generateUserId(),
      
      // 记忆笔记本
      memoryNotes: [],
      addMemoryNote: (note) => set((state) => ({ memoryNotes: [...state.memoryNotes, note] })),
      removeMemoryNote: (id) => set((state) => ({ memoryNotes: state.memoryNotes.filter(n => n.id !== id) })),
      updateMemoryNote: (id, content) => set((state) => ({
        memoryNotes: state.memoryNotes.map(n => n.id === id ? { ...n, content } : n)
      })),
      getActiveMemoryNotes: () => get().memoryNotes.filter(n => n.is_active).map(n => n.content),
    }),
    {
      name: 'ai-phone-storage',
      partialize: (state) => ({
        identity: state.identity,
        hasCompletedSetup: state.hasCompletedSetup,
        intimacyDad: state.intimacyDad,
        intimacyMom: state.intimacyMom,
        dailyIntimacyDad: state.dailyIntimacyDad,
        dailyIntimacyMom: state.dailyIntimacyMom,
        lastChatDate: state.lastChatDate,
        chapter: state.chapter,
        userId: state.userId,
        isDarkMode: state.isDarkMode,
        memoryNotes: state.memoryNotes,
        // 不持久化消息，避免存储过大
      }),
    }
  )
)
