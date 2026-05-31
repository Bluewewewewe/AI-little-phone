'use client'

import { useStore, WeiboPost } from '@/store/useStore'
import { useState } from 'react'
import { 
  ChevronLeft, Heart, MessageCircle, Share2, 
  Search, TrendingUp, Flame, Star
} from 'lucide-react'

interface WeiboScreenProps {
  onBack: () => void
}

// 预设微博内容
const samplePosts: WeiboPost[] = [
  {
    id: '1',
    author: 'dad',
    content: '今天工作结束，终于可以回家陪家人了。每次推开家门看到她在等我，所有的疲惫都消失了。🏠💕',
    images: ['https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400'],
    likes: 12580,
    comments: 892,
    reposts: 234,
    createdAt: new Date(Date.now() - 3600000),
    isHot: true,
  },
  {
    id: '2',
    author: 'mom',
    content: '周末家庭日，准备做一顿大餐！希望他们会喜欢~ 🍳❤️',
    images: [],
    likes: 8932,
    comments: 456,
    reposts: 89,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: '3',
    author: 'dad',
    content: '感谢大家的支持，新作品马上和大家见面了。请期待~ ✨',
    images: [],
    likes: 45678,
    comments: 2341,
    reposts: 1892,
    createdAt: new Date(Date.now() - 86400000),
    isHot: true,
  },
  {
    id: '4',
    author: 'mom',
    content: '最近在学习新菜谱，等我学会了做给最重要的人吃！👨‍🍳',
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'],
    likes: 6721,
    comments: 321,
    reposts: 45,
    createdAt: new Date(Date.now() - 172800000),
  },
]

export default function WeiboScreen({ onBack }: WeiboScreenProps) {
  const { identity, chapter } = useStore()
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'home' | 'hot'>('home')
  
  const isUnlocked = chapter >= 2

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }

  const getAuthorName = (author: string) => {
    return author === 'dad' ? identity?.roleA_name || '某爸' : identity?.roleB_name || '某妈'
  }

  const getAuthorAvatar = (author: string) => {
    return author === 'dad' ? 'from-purple-500 to-violet-500' : 'from-pink-500 to-rose-500'
  }

  if (!isUnlocked) {
    return (
      <div className="h-full flex flex-col">
        <div className="glass px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold flex-1">微博</h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <Star className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">第2章解锁</h3>
            <p className="text-sm text-white/60">
              继续和爸妈聊天，提升亲密度到300即可解锁微博功能~
            </p>
            <p className="text-xs text-white/40 mt-4">
              当前亲密度需达到 300，当前还需 {300 - (useStore.getState().intimacyDad + useStore.getState().intimacyMom)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="glass px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {/* 标签切换 */}
        <div className="flex-1 flex gap-4 justify-center">
          <button
            onClick={() => setActiveTab('home')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'home' ? 'text-white' : 'text-white/50'
            }`}
          >
            首页
          </button>
          <button
            onClick={() => setActiveTab('hot')}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${
              activeTab === 'hot' ? 'text-white' : 'text-white/50'
            }`}
          >
            <Flame className="w-4 h-4" />
            热搜
          </button>
        </div>
        
        <button className="p-2 hover:bg-white/10 rounded-full">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* 微博列表 */}
      <div className="flex-1 overflow-auto">
        {/* 热搜榜入口 */}
        {activeTab === 'home' && (
          <div className="p-4 border-b border-white/10">
            <div className="glass-card p-3 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">热搜榜</p>
                <p className="text-xs text-white/50">实时热度排行</p>
              </div>
              <span className="badge badge-gold text-xs">爆</span>
            </div>
          </div>
        )}

        {/* 微博内容 */}
        {(activeTab === 'home' ? samplePosts : samplePosts.filter(p => p.isHot)).map((post) => (
          <div key={post.id} className="p-4 border-b border-white/10">
            <div className="flex gap-3">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAuthorAvatar(post.author)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm font-bold text-white">
                  {getAuthorName(post.author).slice(0, 1)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${post.author === 'dad' ? 'text-purple-400' : 'text-pink-400'}`}>
                    {getAuthorName(post.author)}
                  </span>
                  {post.isHot && (
                    <span className="badge bg-red-500 text-white text-[10px] flex items-center gap-0.5">
                      <Flame className="w-3 h-3" /> 热
                    </span>
                  )}
                  <span className="badge badge-blue text-[10px]">
                    {post.author === 'dad' ? identity?.roleA_name || '爸' : identity?.roleB_name || '妈'}
                  </span>
                </div>
                
                <p className="text-sm mt-2 leading-relaxed">{post.content}</p>
                
                {/* 图片 */}
                {post.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {post.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img}
                        alt=""
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
                
                {/* 时间 */}
                <p className="text-xs text-white/40 mt-2">
                  {formatTime(post.createdAt)}
                </p>
                
                {/* 互动栏 */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1 text-sm text-white/60 hover:text-red-400 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{formatNumber(post.likes + (likedPosts.has(post.id) ? 1 : 0))}</span>
                  </button>
                  
                  <button className="flex items-center gap-1 text-sm text-white/60 hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(post.comments)}</span>
                  </button>
                  
                  <button className="flex items-center gap-1 text-sm text-white/60 hover:text-green-400 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>{formatNumber(post.reposts)}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
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
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}
