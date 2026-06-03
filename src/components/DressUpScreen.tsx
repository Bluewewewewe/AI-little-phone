'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { OUTFITS, RARITY_COLORS, RARITY_LABELS, OutfitItem } from '@/lib/dressup-data'
import { ChevronLeft, Sparkles } from 'lucide-react'

export default function DressUpScreen({ onBack }: { onBack: () => void }) {
  const { chapter } = useStore()
  const [pocketMoney, setPocketMoney] = useState(500)
  const [ownedItems, setOwnedItems] = useState<string[]>(['school_top', 'cat_ears', 'bow_tie', 'home_bg'])
  const [equippedItems, setEquippedItems] = useState<Record<string, string>>({
    top: 'school_top', hat: 'cat_ears', accessory: 'bow_tie', background: 'home_bg'
  })
  const [category, setCategory] = useState<string>('all')
  const [equipAnim, setEquipAnim] = useState(false)

  const categories = [
    { id: 'all', label: '全部', icon: '🎨' },
    { id: 'top', label: '上衣', icon: '👗' },
    { id: 'hat', label: '帽子', icon: '🎩' },
    { id: 'accessory', label: '配饰', icon: '💍' },
    { id: 'background', label: '背景', icon: '🏞️' },
  ]

  const filteredOutfits = category === 'all' ? OUTFITS : OUTFITS.filter(o => o.category === category)

  const buyItem = (item: OutfitItem) => {
    if (pocketMoney < item.price || ownedItems.includes(item.id)) return
    setPocketMoney(prev => prev - item.price)
    setOwnedItems(prev => [...prev, item.id])
  }

  const equipItem = (item: OutfitItem) => {
    if (!ownedItems.includes(item.id)) return
    setEquippedItems(prev => ({ ...prev, [item.category]: item.id }))
    setEquipAnim(true)
    setTimeout(() => setEquipAnim(false), 500)
  }

  const getEquippedItem = (cat: string) => {
    const id = equippedItems[cat]
    return id ? OUTFITS.find(o => o.id === id) : null
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" /> <span className="text-sm">返回</span>
        </button>
        <h2 className="font-semibold text-sm">🌽 甜玉米换装</h2>
        <span className="text-xs text-amber-400/80">💰 {pocketMoney}</span>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {/* 甜玉米预览 - 展示台风格 */}
        <div className="glass-card p-6 text-center relative overflow-hidden">
          {/* 背景层 */}
          <div className="absolute inset-0 opacity-20">
            <img src={getEquippedItem('background')?.image || '/images/home/livingroom.jpg'} alt="bg"
              className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          <div className="relative z-10">
            {/* 展示台 */}
            <div className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-pink-400/20 via-violet-400/20 to-indigo-400/20 flex items-center justify-center mb-3 border border-white/10 shadow-2xl transition-all duration-500 ${equipAnim ? 'scale-105' : ''}`}
              style={{ boxShadow: '0 8px 40px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
              <span className="text-5xl">🐱</span>
            </div>
            <p className="text-xs text-white/50 mb-2">你就是甜玉米 🌽</p>
            {/* 装备标签 */}
            <div className="flex flex-wrap gap-1 justify-center">
              {['top', 'hat', 'accessory'].map(cat => {
                const item = getEquippedItem(cat)
                return item ? (
                  <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300/70 border border-violet-400/10">
                    {item.icon} {item.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        </div>

        {/* 分类 */}
        <div className="flex gap-1">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] transition-all duration-300 ${
                category === cat.id ? 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-400/15' : 'text-white/35 hover:bg-white/[0.03]'
              }`}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* 物品网格 */}
        <div className="grid grid-cols-3 gap-2">
          {filteredOutfits.map(item => {
            const owned = ownedItems.includes(item.id)
            const equipped = equippedItems[item.category] === item.id
            const locked = chapter < item.unlockChapter

            return (
              <div key={item.id} className={`glass-card p-2.5 relative text-center transition-all duration-300 ${
                equipped ? 'ring-1 ring-pink-400/20' : locked ? 'opacity-30' : ''
              }`}>
                {/* 稀有度 */}
                <span className={`absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded-full bg-gradient-to-r ${RARITY_COLORS[item.rarity]} text-white/80`}>
                  {RARITY_LABELS[item.rarity]}
                </span>
                <span className="text-2xl">{item.icon}</span>
                <p className="text-[10px] font-medium mt-1 truncate">{item.name}</p>
                <p className="text-[9px] text-white/20">
                  {item.category === 'top' ? '上衣' : item.category === 'hat' ? '帽子' : item.category === 'accessory' ? '配饰' : '背景'}
                </p>

                {locked ? (
                  <p className="text-[9px] text-white/15 mt-1">🔒 Ch{item.unlockChapter}</p>
                ) : owned ? (
                  <button onClick={() => equipItem(item)}
                    className={`w-full mt-1.5 py-1 rounded-lg text-[10px] transition-all ${
                      equipped ? 'bg-pink-500/15 text-pink-300/70' : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                    }`}>
                    {equipped ? '✅ 穿戴中' : '穿戴'}
                  </button>
                ) : (
                  <button onClick={() => buyItem(item)} disabled={pocketMoney < item.price}
                    className="w-full mt-1.5 py-1 rounded-lg text-[10px] bg-pink-500/10 text-pink-300/60 hover:bg-pink-500/20 disabled:opacity-30 transition-all">
                    💰{item.price}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
