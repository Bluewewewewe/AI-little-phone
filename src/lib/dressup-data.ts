// 🌽 甜玉米换装系统 - 你就是甜玉米！

export interface OutfitItem {
  id: string
  name: string
  icon: string
  category: 'top' | 'bottom' | 'shoes' | 'accessory' | 'hat' | 'background'
  price: number
  image: string
  unlockChapter: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const OUTFITS: OutfitItem[] = [
  // 上衣
  { id: 'school_top', name: '校服上衣', icon: '🏫', category: 'top', price: 0, image: '/images/dressup/outfits.jpg', unlockChapter: 1, rarity: 'common' },
  { id: 'hoodie', name: '奶牛猫卫衣', icon: '🧥', category: 'top', price: 30, image: '/images/dressup/outfits.jpg', unlockChapter: 2, rarity: 'common' },
  { id: 'princess_dress', name: '公主裙', icon: '👗', category: 'top', price: 80, image: '/images/dressup/outfits.jpg', unlockChapter: 3, rarity: 'rare' },
  { id: 'couple_shirt', name: '亲子装', icon: '👔', category: 'top', price: 60, image: '/images/dressup/outfits.jpg', unlockChapter: 4, rarity: 'rare' },
  { id: 'pajamas', name: '奶牛睡衣', icon: '🛏️', category: 'top', price: 40, image: '/images/dressup/outfits.jpg', unlockChapter: 2, rarity: 'common' },
  { id: 'star_cloak', name: '星光斗篷', icon: '✨', category: 'top', price: 200, image: '/images/dressup/outfits.jpg', unlockChapter: 5, rarity: 'epic' },
  
  // 帽子
  { id: 'cat_ears', name: '猫耳朵', icon: '🐱', category: 'hat', price: 20, image: '/images/dressup/accessories.jpg', unlockChapter: 1, rarity: 'common' },
  { id: 'flower_crown', name: '花环', icon: '🌸', category: 'hat', price: 50, image: '/images/dressup/accessories.jpg', unlockChapter: 3, rarity: 'rare' },
  { id: 'crown', name: '小皇冠', icon: '👑', category: 'hat', price: 150, image: '/images/dressup/accessories.jpg', unlockChapter: 6, rarity: 'legendary' },
  { id: 'bunny_hood', name: '兔兔兜帽', icon: '🐰', category: 'hat', price: 35, image: '/images/dressup/accessories.jpg', unlockChapter: 2, rarity: 'common' },
  
  // 配饰
  { id: 'bow_tie', name: '蝴蝶结', icon: '🎀', category: 'accessory', price: 15, image: '/images/dressup/accessories.jpg', unlockChapter: 1, rarity: 'common' },
  { id: 'star_necklace', name: '星星项链', icon: '⭐', category: 'accessory', price: 45, image: '/images/dressup/accessories.jpg', unlockChapter: 3, rarity: 'rare' },
  { id: 'couple_bracelet', name: '亲子手链', icon: '💕', category: 'accessory', price: 70, image: '/images/dressup/accessories.jpg', unlockChapter: 4, rarity: 'rare' },
  { id: 'glasses', name: '圆框眼镜', icon: '👓', category: 'accessory', price: 25, image: '/images/dressup/accessories.jpg', unlockChapter: 2, rarity: 'common' },
  
  // 背景
  { id: 'home_bg', name: '家里', icon: '🏠', category: 'background', price: 0, image: '/images/home/livingroom.jpg', unlockChapter: 1, rarity: 'common' },
  { id: 'balcony_bg', name: '阳台', icon: '🌿', category: 'background', price: 30, image: '/images/home/balcony.jpg', unlockChapter: 2, rarity: 'common' },
  { id: 'starlight_bg', name: '星空', icon: '🌌', category: 'background', price: 100, image: '/images/home/livingroom.jpg', unlockChapter: 5, rarity: 'epic' },
  { id: 'cherry_bg', name: '樱花', icon: '🌸', category: 'background', price: 120, image: '/images/home/balcony.jpg', unlockChapter: 6, rarity: 'legendary' },
]

export const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-amber-500 to-amber-600',
}

export const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}
