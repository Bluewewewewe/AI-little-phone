// ========== 开发者调试系统 ==========
// 上线前删除此文件或设置 DEBUG_ENABLED = false 即可关闭所有调试功能

/** 总开关 — 上线前改为 false */
export const DEBUG_ENABLED = true;

/** 章节/关卡定义 */
export interface DebugLevel {
  id: number;
  name: string;
  description: string;
}

export const DEBUG_LEVELS: DebugLevel[] = [
  { id: 1, name: 'Ch1 · 地下秘密', description: '解锁聊天+朋友圈+红包' },
  { id: 2, name: 'Ch2 · 暗流涌动', description: '解锁微博+直播+AI观众' },
  { id: 3, name: 'Ch3 · 偷窥真心', description: '解锁爸妈私聊+位置+互送礼物' },
  { id: 4, name: 'Ch4 · 粉圈潜行', description: '解锁CP粉群+小红书' },
  { id: 5, name: 'Ch5 · 官宣天下', description: '解锁CP公开恋情' },
  { id: 6, name: 'Ch6 · 身份风暴', description: '解锁公开身份+上热搜' },
];

/** 根据 level 返回需要解锁的功能列表 */
export function getFeaturesForLevel(level: number): string[] {
  const features: string[] = [];
  if (level >= 1) features.push('family', 'dad', 'mom', 'me', 'call', 'music', 'chat', 'moments');
  if (level >= 2) features.push('weibo');
  if (level >= 3) features.push('pet', 'dressup');
  if (level >= 4) features.push('home', 'browser');
  if (level >= 5) features.push('worldbook');
  if (level >= 6) features.push('all');
  return features;
}

/** 解析 URL 参数 */
export function parseDebugParams(): { enabled: boolean; level: number | null; all: boolean } {
  if (typeof window === 'undefined') return { enabled: false, level: null, all: false };
  const params = new URLSearchParams(window.location.search);
  const debug = params.get('debug') === 'true';
  if (!debug) return { enabled: false, level: null, all: false };

  const levelRaw = params.get('level');
  if (levelRaw === 'all') return { enabled: true, level: null, all: true };
  const level = levelRaw ? parseInt(levelRaw) : null;
  if (level !== null && (isNaN(level) || level < 1 || level > DEBUG_LEVELS.length)) {
    console.warn(`🔧 Debug: invalid level "${levelRaw}", ignoring`);
    return { enabled: true, level: null, all: false };
  }
  return { enabled: true, level, all: false };
}
