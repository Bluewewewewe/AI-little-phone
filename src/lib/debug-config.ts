// ========== 开发者调试系统 ==========
// 上线前将 DEBUG_ENABLED 改为 false 即可关闭所有调试功能
// 或直接删除此文件（记得清理 page.tsx 中的引用）

export const DEBUG_ENABLED = true;

// 调试等级定义
export interface DebugLevel {
  level: number;
  name: string;
  description: string;
}

export const DEBUG_LEVELS: DebugLevel[] = [
  { level: 1, name: 'Ch1 · 地下秘密', description: '基础状态：聊天+朋友圈+红包，CP未解锁' },
  { level: 2, name: 'Ch2 · 暗流涌动', description: 'CP已解锁 + 微博+直播+AI观众' },
  { level: 3, name: 'Ch3 · 偷窥真心', description: '全功能解锁 + 爸妈私聊+位置+互送礼物' },
  { level: 4, name: 'Ch4 · 粉圈潜行', description: 'CP粉群+小红书' },
  { level: 5, name: 'Ch5 · 官宣天下', description: 'CP公开恋情' },
  { level: 6, name: 'Ch6 · 身份风暴', description: '公开身份，上热搜' },
];

// 解析 URL 参数
export function parseDebugParams(): { enabled: boolean; level: number | 'all' | null } {
  if (!DEBUG_ENABLED) return { enabled: false, level: null };
  if (typeof window === 'undefined') return { enabled: false, level: null };

  const params = new URLSearchParams(window.location.search);
  const debug = params.get('debug');
  const level = params.get('level');

  if (debug !== 'true') return { enabled: false, level: null };

  if (level === 'all') return { enabled: true, level: 'all' };
  if (level && !isNaN(Number(level))) {
    const lv = Number(level);
    if (lv >= 1 && lv <= 6) return { enabled: true, level: lv };
  }
  return { enabled: true, level: null };
}

// 根据调试等级应用状态
export function applyDebugLevel(level: number | 'all'): {
  unlocked: boolean;
  adminAccess: boolean;
  levelName: string;
  userLevel: number;
} {
  if (level === 'all') {
    return { unlocked: true, adminAccess: true, levelName: '全部解锁（all）', userLevel: 99 };
  }

  const lv = Number(level);
  const levelInfo = DEBUG_LEVELS.find(l => l.level === lv);
  
  // Level → userLevel mapping: 1→1, 2→5, 3→10, 4→20, 5→30, 6→50
  const userLevelMap: Record<number, number> = { 1: 1, 2: 5, 3: 10, 4: 20, 5: 30, 6: 50 };

  return {
    unlocked: lv >= 2,
    adminAccess: lv >= 3,
    levelName: levelInfo?.name || `Level ${lv}`,
    userLevel: userLevelMap[lv] || lv * 5,
  };
}
