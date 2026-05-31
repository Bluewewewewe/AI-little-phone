'use client'

import { useStore, Moment } from '@/store/useStore'
import { useState } from 'react'
import { 
  ChevronLeft, Heart, MessageCircle, Send, 
  MoreHorizontal, Image, Camera
} from 'lucide-react'

interface MomentsScreenProps {
  onBack: () => void
}

export default function MomentsScreen({ onBack }: MomentsScreenProps) {
  const { identity, moments, addMoment, addLike, addComment } = useStore()
  const [newPost, setNewPost] = useState('')
  const [showComment, setShowComment] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  // 预设朋友圈内容
  const sampleMoments: Moment[] = [
    {
      id: '1',
      author: 'dad',
      content: '今天带宝贝去公园玩，看到她笑得那么开心，觉得一切都值得了。🌸',
      images: ['https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400'],
      likes: [
        { userId: 'mom', author: 'mom' },
        { userId: 'user', author: 'user' }
      ],
      comments: [
        { userId: 'mom', author: 'mom', content: '我也想一起去！', createdAt: new Date() }
      ],
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      author: 'mom',
      content: '宝贝第一次学会自己穿衣服了，虽然穿反了但是超级可爱！😂',
      images: [],
      likes: [
        { userId: 'dad', author: 'dad' }
      ],
      comments: [],
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      author: 'dad',
      content: '这周末家庭日，准备给宝贝一个惊喜~',
      images: [],
      likes: [],
      comments: [],
      createdAt: new Date(Date.now() - 86400000),
    },
  ]

  const allMoments = [...moments, ...sampleMoments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )

  const handlePost = () => {
    if (!newPost.trim()) return
    
    const moment: Moment = {
      id: Date.now().toString(),
      author: 'user',
      content: newPost.trim(),
      images: [],
      likes: [],
      comments: [],
      createdAt: new Date(),
    }
    
    addMoment(moment)
    setNewPost('')
  }

  const handleComment = (momentId: string) => {
    if (!commentText.trim()) return
    
    addComment(momentId, {
      userId: 'user',
      author: 'user',
      content: commentText.trim(),
    })
    
    setCommentText('')
    setShowComment(null)
  }

  const getAuthorName = (author: string) => {
    if (author === 'dad') return identity?.roleA_name || '爸爸'
    if (author === 'mom') return identity?.roleB_name || '妈妈'
    return identity?.user_name || '我'
  }

  const getAuthorAvatar = (author: string) => {
    if (author === 'dad') return 'from-purple-500 to-violet-500'
    if (author === 'mom') return 'from-pink-500 to-rose-500'
    return 'from-cyan-500 to-blue-500'
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="glass px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold flex-1">朋友圈</h2>
        <button className="p-2 hover:bg-white/10 rounded-full">
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* 朋友圈列表 */}
      <div className="flex-1 overflow-auto">
        {/* 发布框 */}
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">
                {identity?.user_name?.slice(0, 1) || '我'}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="记录美好生活..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-purple-500/50"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handlePost}
                  disabled={!newPost.trim()}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    newPost.trim()
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 动态列表 */}
        {allMoments.map((moment) => (
          <div key={moment.id} className="p-4 border-b border-white/10">
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAuthorAvatar(moment.author)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm font-bold text-white">
                  {getAuthorName(moment.author).slice(0, 1)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${moment.author === 'dad' ? 'text-purple-400' : moment.author === 'mom' ? 'text-pink-400' : 'text-cyan-400'}`}>
                    {getAuthorName(moment.author)}
                  </span>
                  {moment.author !== 'user' && (
                    <span className="badge badge-purple text-[10px]">
                      {moment.author === 'dad' ? identity?.roleA_name || '爸爸' : identity?.roleB_name || '妈妈'}
                    </span>
                  )}
                </div>
                
                <p className="text-sm mt-2 leading-relaxed">{moment.content}</p>
                
                {/* 图片 */}
                {moment.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {moment.images.map((img, idx) => (
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
                  {formatTime(moment.createdAt)}
                </p>
                
                {/* 互动栏 */}
                <div className="flex items-center gap-6 mt-2">
                  <button
                    onClick={() => addLike(moment.id, 'user', 'user')}
                    className="flex items-center gap-1 text-sm hover:text-red-400 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${moment.likes.some(l => l.userId === 'user') ? 'fill-red-500 text-red-500' : 'text-white/60'}`} />
                    <span className="text-white/60">{moment.likes.length || ''}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowComment(showComment === moment.id ? null : moment.id)}
                    className="flex items-center gap-1 text-sm text-white/60 hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{moment.comments.length || ''}</span>
                  </button>
                </div>
                
                {/* 点赞列表 */}
                {moment.likes.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                    <span className="text-xs text-white/60">
                      {moment.likes.map(l => l.author === 'user' ? identity?.user_name : l.author === 'dad' ? identity?.roleA_name : identity?.roleB_name).join('、')}
                    </span>
                  </div>
                )}
                
                {/* 评论列表 */}
                {moment.comments.length > 0 && (
                  <div className="mt-2 bg-white/5 rounded-lg p-2 space-y-1">
                    {moment.comments.map((comment, idx) => (
                      <p key={idx} className="text-xs">
                        <span className="text-purple-400">
                          {comment.author === 'user' ? identity?.user_name : comment.author === 'dad' ? identity?.roleA_name : identity?.roleB_name}:
                        </span>
                        <span className="text-white/80 ml-1">{comment.content}</span>
                      </p>
                    ))}
                  </div>
                )}
                
                {/* 评论输入框 */}
                {showComment === moment.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleComment(moment.id)}
                      placeholder="写评论..."
                      className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                      onClick={() => handleComment(moment.id)}
                      className="p-2 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}
