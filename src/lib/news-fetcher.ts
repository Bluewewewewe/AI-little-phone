// ========== 新闻自动抓取系统 ==========
// 每周抓取最新公益/社会新闻，保证信息真实性与时效性
// 生产环境需配置 NewsAPI / RSS 源等真实数据源

export interface FetchedNews {
  id: number;
  title: string;
  detail: string;
  detailImage: string;
  source: string;
  sourceUrl: string;
  category: 'social' | 'welfare' | 'missing' | 'rescue';
  tags: string[];
  fetchedAt: number; // timestamp
  weekNumber: number; // ISO week number
  verified: boolean; // 是否已验证真实性
}

export interface NewsCache {
  lastFetched: number;
  weekNumber: number;
  news: FetchedNews[];
  version: string;
}

// 缓存 key
const NEWS_CACHE_KEY = 'ai_phone_news_cache';

/**
 * 获取当前 ISO 周数
 */
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000;
  return Math.ceil((diff / oneWeek + start.getDay() + 1) / 7);
}

/**
 * 检查是否需要刷新（超过一周）
 */
export function needsRefresh(): boolean {
  try {
    const cached = localStorage.getItem(NEWS_CACHE_KEY);
    if (!cached) return true;

    const data: NewsCache = JSON.parse(cached);
    const currentWeek = getCurrentWeekNumber();

    // 周数不同 或 超过 7 天
    if (data.weekNumber !== currentWeek) return true;
    if (Date.now() - data.lastFetched > 7 * 24 * 60 * 60 * 1000) return true;

    return false;
  } catch {
    return true;
  }
}

/**
 * 从缓存读取新闻
 */
export function getCachedNews(): NewsCache | null {
  try {
    const cached = localStorage.getItem(NEWS_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * 保存新闻到缓存
 */
export function saveNewsCache(news: FetchedNews[]): NewsCache {
  const cache: NewsCache = {
    lastFetched: Date.now(),
    weekNumber: getCurrentWeekNumber(),
    news,
    version: '1.0',
  };
  try {
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save news cache:', e);
  }
  return cache;
}

/**
 * 新闻源配置（真实媒体源）
 * 生产环境替换为真实 RSS / API 端点
 */
export const NEWS_SOURCES = [
  {
    name: '澎湃新闻',
    baseUrl: 'https://www.thepaper.cn',
    category: 'social' as const,
    rssUrl: 'https://www.thepaper.cn/feeds/rss',
  },
  {
    name: '人民日报',
    baseUrl: 'https://www.people.com.cn',
    category: 'welfare' as const,
    rssUrl: '',
  },
  {
    name: '央视新闻',
    baseUrl: 'https://news.cctv.com',
    category: 'social' as const,
    rssUrl: '',
  },
  {
    name: '宝贝回家',
    baseUrl: 'https://www.baobeihuijia.com',
    category: 'missing' as const,
    rssUrl: '',
  },
];

/**
 * 格式化新闻时间为相对时间
 */
export function formatNewsTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${Math.floor(days / 7)}周前`;
}

/**
 * 获取上次更新时间描述
 */
export function getLastUpdateDescription(): string {
  const cached = getCachedNews();
  if (!cached) return '尚未更新';
  return `更新于 ${new Date(cached.lastFetched).toLocaleDateString('zh-CN')}（第${cached.weekNumber}周）`;
}

/**
 * 验证新闻真实性（简单检查）
 * 生产环境应接入事实核查 API
 */
export function verifyNews(news: FetchedNews): boolean {
  // 必须有来源
  if (!news.source || !news.sourceUrl) return false;
  // 必须有详细内容
  if (!news.detail || news.detail.length < 20) return false;
  // 标题不能太短
  if (!news.title || news.title.length < 5) return false;
  return true;
}

/**
 * 将抓取的新闻转换为热搜条目格式
 */
export function newsToHotSearchItem(news: FetchedNews, index: number) {
  return {
    id: 200 + index,
    title: news.title,
    heat: Math.floor(Math.random() * 5000000) + 500000,
    tag: news.category === 'missing' ? '急' : news.category === 'welfare' ? '善' : undefined,
    tagColor: news.category === 'missing' ? '#f97316' : '#22c55e',
    type: 'social' as const,
    detail: `${news.detail}\n\n【来源：${news.source}】${news.sourceUrl ? `\n原文链接：${news.sourceUrl}` : ''}\n【更新时间：${new Date(news.fetchedAt).toLocaleDateString('zh-CN')}，第${news.weekNumber}周】`,
    detailImage: news.detailImage || '',
    posts: [],
  };
}
