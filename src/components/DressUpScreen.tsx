'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { OUTFITS, RARITY_COLORS, RARITY_LABELS, OutfitItem } from '@/lib/dressup-data'

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
      {/* 顶栏 - 毛玻璃 */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-amber-900/50 hover:text-amber-800/70 transition-colors py-1 px-2 -ml-2 rounded-xl hover:bg-white/20">
          <span className="text-lg">←</span>
          <span className="text-sm">返回</span>
        </button>
        <h2 className="font-semibold text-sm">🌽 甜玉米换装</h2>
        <span className="text-xs text-amber-700/60 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">💰 {pocketMoney}</span>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {/* 甜玉米预览 */}
        <div className="glass-card p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img src={getEquippedItem('background')?.image || '/images/home/livingroom.jpg'} alt="bg"
              className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)' }} />

          <div className="relative z-10">
            <div className={`w-28 h-28 mx-auto rounded-3xl bg-amber-400/15 flex items-center justify-center mb-3 transition-all duration-500 ${equipAnim ? 'scale-105' : ''}`}
              style={{ boxShadow: '0 8px 40px rgba(139,92,246,0.1)', background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(16px)' }}>
              <span className="text-5xl">🐱</span>
            </div>
            <p className="text-xs text-amber-900/50 mb-2">你就是甜玉米 🌽</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {['top', 'hat', 'accessory'].map(cat => {
                const item = getEquippedItem(cat)
                return item ? (
                  <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700/70">
                    {item.icon} {item.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        </div>

        {/* 分类 - emoji */}
        <div className="flex gap-1.5">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] transition-all duration-300 ${
                category === cat.id ? 'bg-amber-500/15 text-amber-700' : 'text-amber-900/45 hover:bg-white/20'
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
                equipped ? 'bg-amber-500/10' : locked ? 'opacity-30' : ''
              }`}>
                <span className={`absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded-full ${RARITY_COLORS[item.rarity]} text-amber-800/60`}
                  style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
                  {RARITY_LABELS[item.rarity]}
                </span>
                <span className="text-2xl">{item.icon}</span>
                <p className="text-[10px] font-medium mt-1 truncate">{item.name}</p>
                <p className="text-[9px] text-amber-800/25">
                  {item.category === 'top' ? '上衣' : item.category === 'hat' ? '帽子' : item.category === 'accessory' ? '配饰' : '背景'}
                </p>

                {locked ? (
                  <p className="text-[9px] text-amber-800/20 mt-1">🔒 Ch{item.unlockChapter}</p>
                ) : owned ? (
                  <button onClick={() => equipItem(item)}
                    className={`w-full mt-1.5 py-1 rounded-lg text-[10px] transition-all ${
                      equipped ? 'bg-amber-500/15 text-amber-700/70' : 'text-amber-900/50 hover:bg-white/20'
                    }`}>
                    {equipped ? '✅ 穿戴中' : '穿戴'}
                  </button>
                ) : (
                  <button onClick={() => buyItem(item)} disabled={pocketMoney < item.price}
                    className="w-full mt-1.5 py-1 rounded-lg text-[10px] bg-amber-500/10 text-amber-700/60 hover:bg-amber-500/20 disabled:opacity-30 transition-all">
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
