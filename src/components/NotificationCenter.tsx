'use client'

import { useStore, Notification } from '@/store/useStore'
import { X, Bell, Heart, MessageCircle, Star, Check } from 'lucide-react'

interface NotificationCenterProps {
  onClose: () => void
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useStore()

  // 预设通知
  const sampleNotifications: Notification[] = [
    {
      id: '1',
      type: 'chat',
      title: '爸爸发来消息',
      content: '宝贝在干嘛呢？想你了~',
      isRead: false,
      createdAt: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      type: 'moment',
      title: '妈妈发了新朋友圈',
      content: '宝贝今天真棒！',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      type: 'system',
      title: '亲密度提升！',
      content: '恭喜！和爸爸的亲密度达到了50',
      isRead: false,
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: '4',
      type: 'call',
      title: '未接来电',
      content: '妈妈 曾拨打你的电话',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000),
    },
  ]

  const allNotifications = [...notifications, ...sampleNotifications].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )

  const getIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageCircle className="w-5 h-5 text-blue-400" />
      case 'moment':
        return <Heart className="w-5 h-5 text-pink-400" />
      case 'system':
        return <Star className="w-5 h-5 text-yellow-400" />
      case 'call':
        return <Bell className="w-5 h-5 text-green-400" />
      default:
        return <Bell className="w-5 h-5 text-white/60" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'bg-blue-500/20'
      case 'moment':
        return 'bg-pink-500/20'
      case 'system':
        return 'bg-yellow-500/20'
      case 'call':
        return 'bg-green-500/20'
      default:
        return 'bg-white/10'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50 animate-fadeIn">
      <div 
        className="w-full glass-card rounded-t-3xl max-h-[80vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg">通知中心</h2>
            {unreadCount > 0 && (
              <span className="badge badge-pink">{unreadCount}条新消息</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                全部已读
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 通知列表 */}
        <div className="overflow-auto max-h-[calc(80vh-60px)]">
          {allNotifications.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无通知</p>
            </div>
          ) : (
            allNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`w-full p-4 flex gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                  !notification.isRead ? 'bg-white/5' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${getBgColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{notification.title}</span>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                    {notification.content}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// 格式化时间
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}
