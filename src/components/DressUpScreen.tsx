'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { OUTFITS, RARITY_COLORS, RARITY_LABELS, OutfitItem } from '@/lib/dressup-data'
import { ChevronLeft, ShoppingCart, User, Sparkles } from 'lucide-react'

export default function DressUpScreen({ onBack }: { onBack: () => void }) {
  const { chapter } = useStore()
  const [pocketMoney, setPocketMoney] = useState(500)
  const [ownedItems, setOwnedItems] = useState<string[]>(['school_top', 'cat_ears', 'bow_tie', 'home_bg'])
  const [equippedItems, setEquippedItems] = useState<Record<string, string>>({
    top: 'school_top', hat: 'cat_ears', accessory: 'bow_tie', background: 'home_bg'
  })
  const [category, setCategory] = useState<string>('all')

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
  }

  const getEquippedItem = (cat: string) => {
    const id = equippedItems[cat]
    return id ? OUTFITS.find(o => o.id === id) : null
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-pink-900/50 to-purple-900/50">
      {/* 顶栏 */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 hover:text-white">
          <ChevronLeft className="w-5 h-5" /> 返回
        </button>
        <h2 className="font-bold">🌽 甜玉米换装</h2>
        <div className="text-sm text-yellow-400">💰 {pocketMoney}元</div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* 甜玉米形象预览 */}
        <div className="glass-card p-6 text-center relative overflow-hidden">
          {/* 背景 */}
          <div className="absolute inset-0 opacity-30">
            <img 
              src={getEquippedItem('background')?.image || '/images/home/livingroom.jpg'} 
              alt="bg" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="relative z-10">
            {/* 甜玉米头像 */}
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mb-3 shadow-xl border-2 border-white/20">
              <span className="text-4xl">🐱</span>
            </div>
            
            {/* 装备展示 */}
            <div className="flex flex-wrap gap-1 justify-center">
              {['top', 'hat', 'accessory'].map(cat => {
                const item = getEquippedItem(cat)
                return item ? (
                  <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30">
                    {item.icon} {item.name}
                  </span>
                ) : null
              })}
            </div>
            
            <p className="text-xs text-white/50 mt-2">你就是甜玉米 🌽</p>
          </div>
        </div>

        {/* 分类选择 */}
        <div className="flex gap-1 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${
                category === cat.id ? 'bg-pink-500/40 text-pink-300' : 'glass text-white/60'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* 物品列表 */}
        <div className="grid grid-cols-2 gap-2">
          {filteredOutfits.map(item => {
            const owned = ownedItems.includes(item.id)
            const equipped = equippedItems[item.category] === item.id
            const locked = chapter < item.unlockChapter
            const canBuy = !owned && !locked && pocketMoney >= item.price

            return (
              <div key={item.id} className={`glass-card p-3 relative ${
                equipped ? 'ring-2 ring-pink-400/50' : locked ? 'opacity-40' : ''
              }`}>
                {/* 稀有度标签 */}
                <span className={`absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${RARITY_COLORS[item.rarity]} text-white`}>
                  {RARITY_LABELS[item.rarity]}
                </span>
                
                <div className="text-center">
                  <span className="text-3xl">{item.icon}</span>
                  <p className="text-xs font-medium mt-1">{item.name}</p>
                  <p className="text-[10px] text-white/40">{item.category === 'top' ? '上衣' : item.category === 'hat' ? '帽子' : item.category === 'accessory' ? '配饰' : '背景'}</p>
                </div>

                {locked ? (
                  <p className="text-[10px] text-center text-white/30 mt-1">🔒 Ch{item.unlockChapter}解锁</p>
                ) : owned ? (
                  <button
                    onClick={() => equipItem(item)}
                    className={`w-full mt-2 py-1 rounded-lg text-xs ${
                      equipped ? 'bg-pink-500/30 text-pink-300' : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {equipped ? '✅ 已穿戴' : '穿戴'}
                  </button>
                ) : (
                  <button
                    onClick={() => buyItem(item)}
                    disabled={!canBuy}
                    className="w-full mt-2 py-1 rounded-lg text-xs bg-pink-500/20 hover:bg-pink-500/30 disabled:opacity-40 text-pink-300"
                  >
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
