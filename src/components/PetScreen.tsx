'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { PETS, FOODS, FURNITURE, PET_FRIENDSHIP_EVENTS, PetConfig, FoodConfig } from '@/lib/pet-data'
import { ChevronLeft, ShoppingCart, Home as HomeIcon, Heart, Sparkles, BedDouble } from 'lucide-react'

interface PetState {
  hunger: number; mood: number; health: number; energy: number
  isSleeping: boolean
}

const INIT_PET_STATE: PetState = { hunger: 100, mood: 100, health: 100, energy: 100, isSleeping: false }

export default function PetScreen({ onBack }: { onBack: () => void }) {
  const { chapter } = useStore()
  const [selectedPet, setSelectedPet] = useState<string>('xinba')
  const [petStates, setPetStates] = useState<Record<string, PetState>>({
    xinba: { ...INIT_PET_STATE }, dayu: { ...INIT_PET_STATE }, xiaoshiyi: { ...INIT_PET_STATE }
  })
  const [tab, setTab] = useState<'status' | 'feed' | 'play' | 'furniture' | 'events'>('status')
  const [pocketMoney, setPocketMoney] = useState(500)
  const [ownedFurniture, setOwnedFurniture] = useState<string[]>([])
  const [showEvent, setShowEvent] = useState<string | null>(null)

  // 模拟属性衰减
  useEffect(() => {
    const timer = setInterval(() => {
      setPetStates(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(id => {
          const pet = PETS[id]
          if (!pet || next[id].isSleeping) return
          next[id] = {
            ...next[id],
            hunger: Math.max(0, next[id].hunger - pet.decayRate.hunger * 0.01),
            mood: Math.max(0, next[id].mood - pet.decayRate.mood * 0.01),
            health: Math.max(0, next[id].health - pet.decayRate.health * 0.001),
            energy: Math.max(0, next[id].energy - pet.decayRate.energy * 0.01),
          }
        })
        return next
      })
    }, 60000) // 每分钟衰减一点
    return () => clearInterval(timer)
  }, [])

  const currentPet = PETS[selectedPet]
  const currentState = petStates[selectedPet]

  // 喂食
  const feedPet = (foodId: string) => {
    const food = FOODS[foodId]
    if (!food || pocketMoney < food.price) return
    if (currentPet.dislikedFoods.includes(foodId)) {
      alert(`${currentPet.name}不想吃这个！😤`)
      return
    }
    setPocketMoney(prev => prev - food.price)
    setPetStates(prev => ({
      ...prev,
      [selectedPet]: {
        ...prev[selectedPet],
        hunger: Math.min(100, prev[selectedPet].hunger + food.hungerRestore),
        mood: Math.min(100, prev[selectedPet].mood + food.moodRestore),
        health: Math.min(100, prev[selectedPet].health + food.healthRestore),
      }
    }))
  }

  // 互动
  const interactPet = (type: 'pet' | 'talk' | 'play' | 'bath') => {
    const bonus = currentPet.interactionPreference[type]
    if (type === 'play' && bonus === 0) {
      alert(`${currentPet.name}懒得动！😤`)
      return
    }
    setPetStates(prev => {
      const moodChange = bonus
      const energyChange = type === 'play' ? -20 : 0
      const hungerChange = type === 'play' ? -5 : 0
      return {
        ...prev,
        [selectedPet]: {
          ...prev[selectedPet],
          mood: Math.min(100, Math.max(0, prev[selectedPet].mood + moodChange)),
          energy: Math.min(100, Math.max(0, prev[selectedPet].energy + energyChange)),
          hunger: Math.min(100, Math.max(0, prev[selectedPet].hunger + hungerChange)),
        }
      }
    })
  }

  // 让宠物睡觉
  const sleepPet = () => {
    setPetStates(prev => ({
      ...prev,
      [selectedPet]: { ...prev[selectedPet], isSleeping: !prev[selectedPet].isSleeping }
    }))
  }

  // 购买家具
  const buyFurniture = (id: string) => {
    const f = FURNITURE[id]
    if (!f || pocketMoney < f.price || ownedFurniture.includes(id)) return
    setPocketMoney(prev => prev - f.price)
    setOwnedFurniture(prev => [...prev, id])
  }

  // 随机触发友情事件
  const triggerRandomEvent = () => {
    const events = PET_FRIENDSHIP_EVENTS.filter(e => e.rarity === 'common' || Math.random() < 0.3)
    if (events.length === 0) return
    const event = events[Math.floor(Math.random() * events.length)]
    setShowEvent(event.id)
  }

  const getStatColor = (val: number) => {
    if (val > 60) return 'bg-green-500'
    if (val > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getPetAnimation = () => {
    if (currentState.isSleeping) return 'animate-pulse'
    if (currentState.mood > 70) return 'animate-bounce'
    if (currentState.mood > 30) return ''
    return 'opacity-70'
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-900/50 to-indigo-900/50">
      {/* 顶栏 */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 hover:text-white">
          <ChevronLeft className="w-5 h-5" /> 返回
        </button>
        <h2 className="font-bold">🐾 宠物之家</h2>
        <div className="text-sm text-yellow-400">💰 {pocketMoney}元</div>
      </div>

      {/* 宠物选择 */}
      <div className="flex gap-2 p-3 justify-center">
        {Object.values(PETS).map(pet => (
          <button
            key={pet.id}
            onClick={() => setSelectedPet(pet.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
              selectedPet === pet.id ? 'bg-purple-500/40 ring-2 ring-purple-400' : 'glass'
            }`}
          >
            <span className="text-2xl">{pet.icon}</span>
            <span className="text-xs">{pet.name}</span>
          </button>
        ))}
      </div>

      {/* 宠物主展示区 */}
      <div className="flex-1 overflow-auto p-3">
        {/* 宠物形象 + 状态 */}
        <div className="glass-card p-4 mb-3 text-center">
          <div className={`text-6xl mb-2 ${getPetAnimation()}`}>
            {currentState.isSleeping ? '💤' : currentPet.icon}
          </div>
          <h3 className="font-bold text-lg">{currentPet.name}</h3>
          <p className="text-xs text-white/50 mb-3">{currentPet.species} · {currentPet.personality}</p>
          
          {/* 四大属性条 */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '饱腹', key: 'hunger' as keyof PetState, icon: '🍽️' },
              { label: '心情', key: 'mood' as keyof PetState, icon: '😊' },
              { label: '健康', key: 'health' as keyof PetState, icon: '💊' },
              { label: '能量', key: 'energy' as keyof PetState, icon: '⚡' },
            ].map(stat => (
              <div key={stat.key} className="text-left">
                <div className="flex justify-between text-xs mb-1">
                  <span>{stat.icon} {stat.label}</span>
                  <span>{Math.round(currentState[stat.key])}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatColor(currentState[stat.key])} rounded-full transition-all duration-500`}
                    style={{ width: `${currentState[stat.key]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 当前状态提示 */}
          {currentState.hunger < 30 && (
            <p className="text-red-400 text-xs mt-2 animate-pulse">⚠️ {currentPet.name}饿了！快喂饭！</p>
          )}
          {currentState.mood < 30 && (
            <p className="text-yellow-400 text-xs mt-2 animate-pulse">😢 {currentPet.name}不开心...</p>
          )}
          {currentState.isSleeping && (
            <p className="text-blue-400 text-xs mt-2">💤 {currentPet.name}正在睡觉...</p>
          )}
        </div>

        {/* Tab切换 */}
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {[
            { id: 'status', icon: HomeIcon, label: '状态' },
            { id: 'feed', icon: ShoppingCart, label: '喂食' },
            { id: 'play', icon: Heart, label: '互动' },
            { id: 'furniture', icon: BedDouble, label: '家具' },
            { id: 'events', icon: Sparkles, label: '友情' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-purple-500/40 text-purple-300' : 'glass text-white/60'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* 喂食面板 */}
        {tab === 'feed' && (
          <div className="space-y-2">
            {Object.values(FOODS).map(food => {
              const isDisliked = currentPet.dislikedFoods.includes(food.id)
              const isFav = currentPet.favoriteFoods.includes(food.id)
              return (
                <button
                  key={food.id}
                  onClick={() => feedPet(food.id)}
                  disabled={isDisliked || pocketMoney < food.price}
                  className={`w-full glass-card p-3 flex items-center gap-3 text-left transition-all ${
                    isDisliked ? 'opacity-40' : 'hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{food.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">{food.name}</span>
                      {isFav && <span className="text-pink-400 text-xs">❤️最爱</span>}
                      {isDisliked && <span className="text-gray-400 text-xs">😤不吃</span>}
                    </div>
                    <p className="text-xs text-white/50">饱腹+{food.hungerRestore} 心情+{food.moodRestore}</p>
                  </div>
                  <span className="text-yellow-400 text-sm">💰{food.price}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* 互动面板 */}
        {tab === 'play' && (
          <div className="space-y-2">
            {[
              { type: 'pet' as const, icon: '🖐️', label: '摸头', desc: `${currentPet.name}会怎样呢？` },
              { type: 'talk' as const, icon: '💬', label: '说话', desc: '跟它聊聊天' },
              { type: 'play' as const, icon: '🎾', label: '玩耍', desc: '一起玩！消耗能量-20' },
              { type: 'bath' as const, icon: '🛀', label: '洗澡', desc: '健康+5' },
            ].map(action => (
              <button
                key={action.type}
                onClick={() => interactPet(action.type)}
                disabled={currentState.isSleeping}
                className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-white/10 transition-all"
              >
                <span className="text-2xl">{action.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-white/50">{action.desc}</p>
                </div>
                <span className="text-purple-400 text-sm">心情{currentPet.interactionPreference[action.type] > 0 ? '+' : ''}{currentPet.interactionPreference[action.type]}</span>
              </button>
            ))}
            <button
              onClick={sleepPet}
              className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-white/10 transition-all"
            >
              <span className="text-2xl">{currentState.isSleeping ? '☀️' : '😴'}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{currentState.isSleeping ? '叫醒' : '睡觉'}</p>
                <p className="text-xs text-white/50">{currentState.isSleeping ? '让它起来' : '恢复能量'}</p>
              </div>
            </button>
          </div>
        )}

        {/* 家具商店 */}
        {tab === 'furniture' && (
          <div className="space-y-2">
            {Object.values(FURNITURE).map(f => {
              const owned = ownedFurniture.includes(f.id)
              return (
                <div key={f.id} className={`glass-card p-3 flex items-center gap-3 ${owned ? 'ring-1 ring-green-400/30' : ''}`}>
                  <span className="text-2xl">{f.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{f.name} {owned && '✅'}</p>
                    <p className="text-xs text-white/50">{f.effect}</p>
                  </div>
                  {owned ? (
                    <span className="text-green-400 text-xs">已拥有</span>
                  ) : (
                    <button
                      onClick={() => buyFurniture(f.id)}
                      disabled={pocketMoney < f.price}
                      className="px-3 py-1 bg-purple-500/40 rounded-lg text-xs hover:bg-purple-500/60 disabled:opacity-40"
                    >
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
            <button
              onClick={triggerRandomEvent}
              className="w-full glass-card p-3 text-center hover:bg-white/10 transition-all"
            >
              <span className="text-2xl">🎲</span>
              <p className="text-sm font-medium mt-1">触发随机事件</p>
              <p className="text-xs text-white/50">看看它们在干嘛~</p>
            </button>
            
            {showEvent && (() => {
              const evt = PET_FRIENDSHIP_EVENTS.find(e => e.id === showEvent)
              if (!evt) return null
              const rarityColors: Record<string, string> = { common: 'text-green-400', rare: 'text-blue-400', epic: 'text-purple-400' }
              return (
                <div className="glass-card p-4 border border-purple-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold">{evt.title}</span>
                    <span className={`text-xs ${rarityColors[evt.rarity]}`}>
                      {evt.rarity === 'common' ? '普通' : evt.rarity === 'rare' ? '稀有' : '史诗'}
                    </span>
                  </div>
                  <p className="text-sm text-white/80">{evt.description}</p>
                  <p className="text-xs text-white/40 mt-2">参与者：{evt.participants.map(p => PETS[p]?.icon).join(' ')}</p>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
