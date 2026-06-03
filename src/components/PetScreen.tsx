'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { PETS, FOODS, FURNITURE, PET_FRIENDSHIP_EVENTS, PetConfig, FoodConfig } from '@/lib/pet-data'
import { ChevronLeft, ShoppingCart, Home as HomeIcon, Heart, Sparkles, BedDouble } from 'lucide-react'

interface PetState { hunger: number; mood: number; health: number; energy: number; isSleeping: boolean }
const INIT: PetState = { hunger: 100, mood: 100, health: 100, energy: 100, isSleeping: false }

export default function PetScreen({ onBack }: { onBack: () => void }) {
  const { chapter } = useStore()
  const [selectedPet, setSelectedPet] = useState<string>('xinba')
  const [petStates, setPetStates] = useState<Record<string, PetState>>({ xinba: { ...INIT }, dayu: { ...INIT }, xiaoshiyi: { ...INIT } })
  const [tab, setTab] = useState<'status' | 'feed' | 'play' | 'furniture' | 'events'>('status')
  const [pocketMoney, setPocketMoney] = useState(500)
  const [ownedFurniture, setOwnedFurniture] = useState<string[]>([])
  const [showEvent, setShowEvent] = useState<string | null>(null)
  const [feedAnim, setFeedAnim] = useState(false)
  const [moodEmoji, setMoodEmoji] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setPetStates(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(id => {
          const pet = PETS[id]; if (!pet || next[id].isSleeping) return
          next[id] = { ...next[id],
            hunger: Math.max(0, next[id].hunger - pet.decayRate.hunger * 0.01),
            mood: Math.max(0, next[id].mood - pet.decayRate.mood * 0.01),
            health: Math.max(0, next[id].health - pet.decayRate.health * 0.001),
            energy: Math.max(0, next[id].energy - pet.decayRate.energy * 0.01),
          }
        })
        return next
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const currentPet = PETS[selectedPet]
  const cs = petStates[selectedPet]

  const feedPet = (foodId: string) => {
    const food = FOODS[foodId]
    if (!food || pocketMoney < food.price) return
    if (currentPet.dislikedFoods.includes(foodId)) { alert(`${currentPet.name}不想吃这个！😤`); return }
    setPocketMoney(prev => prev - food.price)
    setPetStates(prev => ({ ...prev, [selectedPet]: { ...prev[selectedPet],
      hunger: Math.min(100, prev[selectedPet].hunger + food.hungerRestore),
      mood: Math.min(100, prev[selectedPet].mood + food.moodRestore),
      health: Math.min(100, prev[selectedPet].health + food.healthRestore),
    }}))
    setFeedAnim(true)
    setMoodEmoji(currentPet.favoriteFoods.includes(foodId) ? '❤️' : '😋')
    setTimeout(() => { setFeedAnim(false); setMoodEmoji(null) }, 1200)
  }

  const interactPet = (type: 'pet' | 'talk' | 'play' | 'bath') => {
    const bonus = currentPet.interactionPreference[type]
    if (type === 'play' && bonus === 0) { alert(`${currentPet.name}懒得动！😤`); return }
    setPetStates(prev => ({ ...prev, [selectedPet]: { ...prev[selectedPet],
      mood: Math.min(100, Math.max(0, prev[selectedPet].mood + bonus)),
      energy: Math.min(100, Math.max(0, prev[selectedPet].energy + (type === 'play' ? -20 : 0))),
      hunger: Math.min(100, Math.max(0, prev[selectedPet].hunger + (type === 'play' ? -5 : 0))),
    }}))
    const emojis = { pet: '🥰', talk: '💬', play: '🎾', bath: '🛁' }
    setMoodEmoji(emojis[type])
    setTimeout(() => setMoodEmoji(null), 1000)
  }

  const sleepPet = () => setPetStates(prev => ({ ...prev, [selectedPet]: { ...prev[selectedPet], isSleeping: !prev[selectedPet].isSleeping } }))
  const buyFurniture = (id: string) => {
    const f = FURNITURE[id]; if (!f || pocketMoney < f.price || ownedFurniture.includes(id)) return
    setPocketMoney(prev => prev - f.price); setOwnedFurniture(prev => [...prev, id])
  }
  const triggerRandomEvent = () => {
    const events = PET_FRIENDSHIP_EVENTS.filter(e => e.rarity === 'common' || Math.random() < 0.3)
    if (events.length === 0) return
    setShowEvent(events[Math.floor(Math.random() * events.length)].id)
  }

  const statColor = (v: number) => v > 60 ? 'bg-emerald-400' : v > 30 ? 'bg-amber-400' : 'bg-rose-400'
  const statGlow = (v: number) => v > 60 ? 'shadow-emerald-400/30' : v > 30 ? 'shadow-amber-400/30' : 'shadow-rose-400/30'

  return (
    <div className="h-full flex flex-col">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" /> <span className="text-sm">返回</span>
        </button>
        <h2 className="font-semibold text-sm">🐾 宠物之家</h2>
        <span className="text-xs text-amber-400/80">💰 {pocketMoney}</span>
      </div>

      {/* 宠物选择 */}
      <div className="flex gap-2 px-4 py-3 justify-center">
        {Object.values(PETS).map(pet => (
          <button key={pet.id} onClick={() => setSelectedPet(pet.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-300 ${
              selectedPet === pet.id ? 'bg-violet-500/15 ring-1 ring-violet-400/20' : 'hover:bg-white/[0.03]'
            }`}>
            <span className={`text-xl transition-transform duration-300 ${selectedPet === pet.id ? 'scale-110' : ''}`}>{pet.icon}</span>
            <span className={`text-[10px] ${selectedPet === pet.id ? 'text-violet-300' : 'text-white/35'}`}>{pet.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4 space-y-3">
        {/* 宠物展示 */}
        <div className="glass-card p-5 text-center">
          <div className="relative inline-block">
            <div className={`text-5xl transition-all duration-500 ${
              cs.isSleeping ? 'animate-breathe' :
              cs.mood > 70 ? 'animate-float' :
              cs.mood > 30 ? '' : 'opacity-60'
            } ${feedAnim ? 'scale-125' : ''}`}>
              {cs.isSleeping ? '💤' : currentPet.icon}
            </div>
            {/* 互动反馈表情 */}
            {moodEmoji && (
              <span className="absolute -top-2 -right-4 text-xl animate-fadeIn">{moodEmoji}</span>
            )}
          </div>
          <h3 className="font-bold text-base mt-2">{currentPet.name}</h3>
          <p className="text-[11px] text-white/30 mt-0.5">{currentPet.species} · {currentPet.personality}</p>

          {/* 四大属性 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
            {[
              { label: '饱腹', key: 'hunger' as keyof PetState, icon: '🍽️' },
              { label: '心情', key: 'mood' as keyof PetState, icon: '😊' },
              { label: '健康', key: 'health' as keyof PetState, icon: '💊' },
              { label: '能量', key: 'energy' as keyof PetState, icon: '⚡' },
            ].map(s => (
              <div key={s.key} className="text-left">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-white/40">{s.icon} {s.label}</span>
                  <span className="text-white/50 tabular-nums">{Math.round(cs[s.key])}</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full ${statColor(cs[s.key])} rounded-full transition-all duration-700 shadow-sm ${statGlow(cs[s.key])}`}
                    style={{ width: `${cs[s.key]}%` }} />
                </div>
              </div>
            ))}
          </div>

          {cs.hunger < 30 && <p className="text-rose-400/80 text-[11px] mt-2 animate-pulse">⚠️ {currentPet.name}饿了！快喂饭！</p>}
          {cs.mood < 30 && <p className="text-amber-400/80 text-[11px] mt-2 animate-pulse">😢 {currentPet.name}不开心...</p>}
          {cs.isSleeping && <p className="text-indigo-300/60 text-[11px] mt-2">💤 {currentPet.name}正在睡觉...</p>}
        </div>

        {/* Tab */}
        <div className="flex gap-1">
          {[
            { id: 'feed', icon: ShoppingCart, label: '喂食' },
            { id: 'play', icon: Heart, label: '互动' },
            { id: 'furniture', icon: BedDouble, label: '家具' },
            { id: 'events', icon: Sparkles, label: '友情' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] transition-all duration-300 ${
                tab === t.id ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/15' : 'text-white/35 hover:bg-white/[0.03]'
              }`}>
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>

        {/* 喂食 */}
        {tab === 'feed' && (
          <div className="space-y-1.5">
            {Object.values(FOODS).map(food => {
              const disliked = currentPet.dislikedFoods.includes(food.id)
              const fav = currentPet.favoriteFoods.includes(food.id)
              return (
                <button key={food.id} onClick={() => feedPet(food.id)} disabled={disliked || pocketMoney < food.price}
                  className={`w-full glass-card p-3 flex items-center gap-3 text-left transition-all ${disliked ? 'opacity-30' : 'hover:bg-white/[0.03] active:scale-[0.98]'}`}>
                  <span className="text-xl">{food.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-[13px]">{food.name}</span>
                      {fav && <span className="text-pink-400 text-[9px]">❤️最爱</span>}
                      {disliked && <span className="text-white/20 text-[9px]">😤不吃</span>}
                    </div>
                    <p className="text-[10px] text-white/25">饱腹+{food.hungerRestore} 心情+{food.moodRestore}</p>
                  </div>
                  <span className="text-amber-400/70 text-[11px]">💰{food.price}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* 互动 */}
        {tab === 'play' && (
          <div className="space-y-1.5">
            {[
              { type: 'pet' as const, icon: '🖐️', label: '摸头', desc: `${currentPet.name}会怎样呢？` },
              { type: 'talk' as const, icon: '💬', label: '说话', desc: '跟它聊聊天' },
              { type: 'play' as const, icon: '🎾', label: '玩耍', desc: '消耗能量-20' },
              { type: 'bath' as const, icon: '🛀', label: '洗澡', desc: '健康+5' },
            ].map(a => (
              <button key={a.type} onClick={() => interactPet(a.type)} disabled={cs.isSleeping}
                className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-white/[0.03] transition-all active:scale-[0.98]">
                <span className="text-xl">{a.icon}</span>
                <div className="flex-1"><p className="font-medium text-[13px]">{a.label}</p><p className="text-[10px] text-white/25">{a.desc}</p></div>
                <span className={`text-[11px] ${currentPet.interactionPreference[a.type] > 0 ? 'text-emerald-400/70' : 'text-white/20'}`}>
                  心情{currentPet.interactionPreference[a.type] > 0 ? '+' : ''}{currentPet.interactionPreference[a.type]}
                </span>
              </button>
            ))}
            <button onClick={sleepPet}
              className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-white/[0.03] transition-all">
              <span className="text-xl">{cs.isSleeping ? '☀️' : '😴'}</span>
              <div className="flex-1"><p className="font-medium text-[13px]">{cs.isSleeping ? '叫醒' : '睡觉'}</p><p className="text-[10px] text-white/25">{cs.isSleeping ? '让它起来' : '恢复能量'}</p></div>
            </button>
          </div>
        )}

        {/* 家具 */}
        {tab === 'furniture' && (
          <div className="space-y-1.5">
            {Object.values(FURNITURE).map(f => {
              const owned = ownedFurniture.includes(f.id)
              return (
                <div key={f.id} className={`glass-card p-3 flex items-center gap-3 ${owned ? 'ring-1 ring-emerald-400/10' : ''}`}>
                  <span className="text-xl">{f.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-[13px]">{f.name} {owned && '✅'}</p>
                    <p className="text-[10px] text-white/25">{f.effect}</p>
                  </div>
                  {owned ? (
                    <span className="text-emerald-400/60 text-[10px]">已拥有</span>
                  ) : (
                    <button onClick={() => buyFurniture(f.id)} disabled={pocketMoney < f.price}
                      className="glass-btn text-[10px] px-2.5 py-1 !bg-violet-500/15 !border-violet-400/15 !text-violet-300/70 disabled:opacity-30">
                      💰{f.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 友情事件 */}
        {tab === 'events' && (
          <div className="space-y-2">
            <button onClick={triggerRandomEvent}
              className="w-full glass-card p-4 text-center hover:bg-white/[0.03] transition-all active:scale-[0.98]">
              <span className="text-2xl">🎲</span>
              <p className="text-sm font-medium mt-1">触发随机事件</p>
              <p className="text-[10px] text-white/25 mt-0.5">看看它们在干嘛~</p>
            </button>
            {showEvent && (() => {
              const evt = PET_FRIENDSHIP_EVENTS.find(e => e.id === showEvent)
              if (!evt) return null
              const rc = { common: 'text-emerald-400', rare: 'text-blue-400', epic: 'text-violet-400' }
              return (
                <div className="glass-card p-4 ring-1 ring-violet-400/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{evt.title}</span>
                    <span className={`text-[10px] ${rc[evt.rarity]}`}>
                      {evt.rarity === 'common' ? '普通' : evt.rarity === 'rare' ? '稀有' : '史诗'}
                    </span>
                  </div>
                  <p className="text-[13px] text-white/60 leading-relaxed">{evt.description}</p>
                  <p className="text-[10px] text-white/20 mt-2">参与者：{evt.participants.map(p => PETS[p]?.icon).join(' ')}</p>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
