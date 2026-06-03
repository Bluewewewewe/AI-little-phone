// 🐾 宠物配置数据 - 辛巴/大鱼/小十一

export interface PetConfig {
  id: string
  name: string
  species: string
  icon: string
  image: string
  personality: string
  description: string
  decayRate: { hunger: number; mood: number; health: number; energy: number }
  favoriteFoods: string[]
  dislikedFoods: string[]
  interactionPreference: { pet: number; talk: number; play: number; bath: number; sleep: number }
}

export const PETS: Record<string, PetConfig> = {
  xinba: {
    id: 'xinba', name: '辛巴', species: '中华田园犬', icon: '🐕', image: '/images/pets/xinba.jpg',
    personality: '忠诚稳重，守护全家的大哥哥',
    description: '辛巴是家里的老大，忠诚可靠，最喜欢守在门口等田雷回家。',
    decayRate: { hunger: 4, mood: 2, health: 0.5, energy: 6 },
    favoriteFoods: ['bone', 'steak', 'star_snack', 'vitamin'],
    dislikedFoods: ['cheese', 'fish_dry'],
    interactionPreference: { pet: 5, talk: 3, play: 8, bath: 2, sleep: 30 },
  },
  dayu: {
    id: 'dayu', name: '大鱼', species: '豹猫', icon: '🐱', image: '/images/pets/dayu.jpg',
    personality: '傲娇女王，只粘梓渝，对田雷翻白眼',
    description: '大鱼是家里的高冷女王，只有梓渝能抱，田雷靠近就翻白眼。',
    decayRate: { hunger: 3, mood: 4, health: 1, energy: 8 },
    favoriteFoods: ['fish_dry', 'steak', 'star_snack', 'vitamin'],
    dislikedFoods: ['bone', 'cheese'],
    interactionPreference: { pet: 3, talk: 1, play: 0, bath: -5, sleep: 30 },
  },
  xiaoshiyi: {
    id: 'xiaoshiyi', name: '小十一', species: '阿比西尼亚猫', icon: '🐱', image: '/images/pets/xiaoshiyi.jpg',
    personality: '社牛小疯子，跟谁都亲，永动机',
    description: '小十一是家里的开心果，到处疯跑，跟谁都蹭，永远停不下来。',
    decayRate: { hunger: 6, mood: 3, health: 0.8, energy: 10 },
    favoriteFoods: ['cheese', 'steak', 'star_snack', 'vitamin'],
    dislikedFoods: ['bone', 'fish_dry'],
    interactionPreference: { pet: 8, talk: 5, play: 12, bath: 5, sleep: 20 },
  },
}

export interface FoodConfig {
  id: string; name: string; icon: string; price: number
  hungerRestore: number; moodRestore: number; healthRestore: number
}

export const FOODS: Record<string, FoodConfig> = {
  bone: { id: 'bone', name: '骨头', icon: '🦴', price: 5, hungerRestore: 25, moodRestore: 5, healthRestore: 0 },
  fish_dry: { id: 'fish_dry', name: '小鱼干', icon: '🐟', price: 8, hungerRestore: 20, moodRestore: 10, healthRestore: 0 },
  steak: { id: 'steak', name: '牛排', icon: '🥩', price: 25, hungerRestore: 40, moodRestore: 5, healthRestore: 0 },
  cheese: { id: 'cheese', name: '奶酪', icon: '🧀', price: 10, hungerRestore: 15, moodRestore: 8, healthRestore: 0 },
  star_snack: { id: 'star_snack', name: '星光零食', icon: '✨', price: 50, hungerRestore: 15, moodRestore: 15, healthRestore: 10 },
  vitamin: { id: 'vitamin', name: '营养膏', icon: '💊', price: 30, hungerRestore: 10, moodRestore: 0, healthRestore: 10 },
}

export interface FurnitureConfig {
  id: string; name: string; icon: string; price: number
  benefitPet: string[]; effect: string; effectType: string; effectValue: number
}

export const FURNITURE: Record<string, FurnitureConfig> = {
  xinba_bed: { id: 'xinba_bed', name: '辛巴大窝', icon: '🦴', price: 50, benefitPet: ['xinba'], effect: '辛巴睡觉恢复+30%', effectType: 'sleep_bonus', effectValue: 30 },
  cat_tree: { id: 'cat_tree', name: '大鱼猫爬架', icon: '🐟', price: 60, benefitPet: ['dayu'], effect: '大鱼心情衰减减半', effectType: 'mood_decay_reduce', effectValue: 50 },
  toy_tunnel: { id: 'toy_tunnel', name: '十一玩具隧道', icon: '🎾', price: 40, benefitPet: ['xiaoshiyi'], effect: '小十一能量衰减-2/时', effectType: 'energy_decay_reduce', effectValue: 2 },
  warm_light: { id: 'warm_light', name: '暖光灯', icon: '💡', price: 40, benefitPet: ['xinba','dayu','xiaoshiyi'], effect: '晚上心情衰减减半', effectType: 'night_mood_bonus', effectValue: 50 },
  cat_grass: { id: 'cat_grass', name: '猫草盆栽', icon: '🪴', price: 30, benefitPet: ['dayu','xiaoshiyi'], effect: '猫心情+5/天', effectType: 'daily_mood_bonus', effectValue: 5 },
  pet_sofa: { id: 'pet_sofa', name: '宠物沙发', icon: '🛋️', price: 80, benefitPet: ['xinba','dayu','xiaoshiyi'], effect: '全家心情+3/时', effectType: 'group_mood_bonus', effectValue: 3 },
}

export interface PetFriendshipEvent {
  id: string; title: string; description: string; participants: string[]
  triggerCondition: string; rarity: 'common' | 'rare' | 'epic'
}

export const PET_FRIENDSHIP_EVENTS: PetFriendshipEvent[] = [
  { id: 'xinba_protect', title: '辛巴护猫', description: '小十一摔倒了，辛巴冲过来检查！大鱼在旁边翻了个白眼。', participants: ['xinba','xiaoshiyi','dayu'], triggerCondition: '小十一玩耍能量耗尽', rarity: 'common' },
  { id: 'dayu_secret_lick', title: '大鱼偷舔', description: '深夜大鱼偷偷舔了辛巴的耳朵，被发现后立刻装没事走开。', participants: ['dayu','xinba'], triggerCondition: '深夜随机', rarity: 'rare' },
  { id: 'eleven_chase', title: '十一追尾巴', description: '小十一追大鱼尾巴，大鱼一爪拍开："别碰老娘的尾巴！"', participants: ['xiaoshiyi','dayu'], triggerCondition: '下午随机', rarity: 'common' },
  { id: 'sunbath_trio', title: '三只晒太阳', description: '辛巴+大鱼+小十一叠在一起晒太阳☀️', participants: ['xinba','dayu','xiaoshiyi'], triggerCondition: '周末午后', rarity: 'common' },
  { id: 'snack_war', title: '抢零食大战', description: '小十一想抢辛巴的骨头，辛巴让开了，大鱼不屑走开。', participants: ['xinba','xiaoshiyi','dayu'], triggerCondition: '喂食时随机', rarity: 'common' },
  { id: 'midnight_cuddle', title: '深夜叠叠乐', description: '凌晨三点，辛巴守门口，大鱼睡辛巴背上，小十一窝辛巴肚子上。', participants: ['xinba','dayu','xiaoshiyi'], triggerCondition: '深夜随机', rarity: 'epic' },
]
