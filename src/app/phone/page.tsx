'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UnlockState, DEFAULT_UNLOCK_STATE, IDENTITY_QUESTIONS,
  checkUnlock, buildIdentityContext, LOCKED_AVAILABLE_APPS, UNLOCK_ONLY_APPS,
  isAdminPassword,
  SECRET_NAMES, DEFAULT_NAMES,
} from '@/lib/unlock-config';

// ========== Types ==========
interface Message {
  from: 'me' | 'dad' | 'mom' | 'system';
  text: string;
  id: number;
}

interface WBSection {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  content: string;
}

// ========== 世界书 APP 组件 ==========
function WorldBookApp() {
  const [sections, setSections] = useState<WBSection[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<'characters' | 'rules'>('characters');

  useEffect(() => {
    fetch('/api/world-book')
      .then(r => r.json())
      .then(data => setSections(data.sections || []))
      .catch(() => {});
  }, []);

  const characterSections = sections.filter(s => ['dad', 'mom', 'cp'].includes(s.id));
  const ruleSections = sections.filter(s => !['dad', 'mom', 'cp'].includes(s.id));

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('【') || line.startsWith('|')) {
        return <div key={i} style={{ fontWeight: 600, marginTop: 8, marginBottom: 2, fontSize: 11, color: '#92400e' }}>{line}</div>;
      }
      if (line.startsWith('•')) {
        return <div key={i} style={{ paddingLeft: 12, fontSize: 11, lineHeight: '18px', color: '#78350f' }}>{line}</div>;
      }
      if (line.startsWith('-')) {
        return <div key={i} style={{ paddingLeft: 12, fontSize: 11, lineHeight: '18px', color: '#78350f' }}>{line}</div>;
      }
      if (line.match(/^\d+\./)) {
        return <div key={i} style={{ paddingLeft: 12, fontSize: 11, lineHeight: '18px', color: '#78350f' }}>{line}</div>;
      }
      if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
      return <div key={i} style={{ fontSize: 11, lineHeight: '18px', color: '#78350f' }}>{line}</div>;
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #fef9ee 0%, #fef3c7 100%)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#78350f' }}>📖 世界书</span>
        <span style={{ fontSize: 11, color: '#a16207', background: 'rgba(251,191,36,0.15)', padding: '2px 8px', borderRadius: 8 }}>🔒 只读</span>
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', padding: '0 16px 8px', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => setTab('characters')}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
            background: tab === 'characters' ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.35)',
            color: tab === 'characters' ? '#92400e' : '#a16207',
            backdropFilter: 'blur(12px)', cursor: 'pointer'
          }}
        >👤 人物</button>
        <button
          onClick={() => setTab('rules')}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
            background: tab === 'rules' ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.35)',
            color: tab === 'rules' ? '#92400e' : '#a16207',
            backdropFilter: 'blur(12px)', cursor: 'pointer'
          }}
        >📋 规则</button>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 16px' }}>
        {(tab === 'characters' ? characterSections : ruleSections).map(s => (
          <div key={s.id} style={{
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(16px)',
            borderRadius: 14,
            marginBottom: 10,
            overflow: 'hidden',
            border: `1.5px solid ${s.color}25`
          }}>
            {/* 卡片头部 */}
            <div
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, background: `${s.color}18`, flexShrink: 0
              }}>{s.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#78350f' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#a16207', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.subtitle}</div>
              </div>
              <span style={{ fontSize: 12, color: '#d97706', transition: 'transform 0.2s', transform: expanded === s.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>

            {/* 展开内容 */}
            {expanded === s.id && (
              <div style={{
                padding: '0 14px 14px',
                borderTop: `1px solid ${s.color}15`,
                maxHeight: 320,
                overflow: 'auto'
              }}>
                <div style={{ paddingTop: 10 }}>{formatContent(s.content)}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChatHistory {
  dad: Message[];
  mom: Message[];
  family: Message[];
}

// ========== Parent Status ==========
type StatusGif = { emoji: string; anim: string; label: string };
function getParentStatus(hour: number) {
  let dadStatus: string, dadDesc: string, momStatus: string, momDesc: string;
  let dadGif: StatusGif, momGif: StatusGif;
  if (hour >= 7 && hour < 8) {
    dadStatus = '🟢 在家'; dadDesc = '做早餐中'; momStatus = '🟢 在家'; momDesc = '赖床中';
    dadGif = { emoji: '🍳', anim: 'sizzle', label: '煎蛋中' }; momGif = { emoji: '😴', anim: 'zzz', label: 'zzz' };
  } else if (hour >= 8 && hour < 9) {
    dadStatus = '🟡 出门'; dadDesc = '上班路上'; momStatus = '🟢 在家'; momDesc = '化妆';
    dadGif = { emoji: '🚗', anim: 'drive', label: '嘟嘟' }; momGif = { emoji: '💄', anim: 'sparkle', label: '变美中' };
  } else if (hour >= 9 && hour < 12) {
    dadStatus = '🔴 忙碌'; dadDesc = '公司开会'; momStatus = '🟡 出门'; momDesc = '工作/逛街';
    dadGif = { emoji: '💼', anim: 'typing', label: '开会中' }; momGif = { emoji: '🛍️', anim: 'bounce', label: '买买买' };
  } else if (hour >= 12 && hour < 13) {
    dadStatus = '🟢 在家'; dadDesc = '午休吃饭'; momStatus = '🟡 出门'; momDesc = '和朋友午饭';
    dadGif = { emoji: '🍱', anim: 'steam', label: '干饭' }; momGif = { emoji: '🥂', anim: 'cheers', label: '干杯' };
  } else if (hour >= 13 && hour < 18) {
    dadStatus = '🔴 忙碌'; dadDesc = '继续工作'; momStatus = '🟢 在家'; momDesc = '回家追剧';
    dadGif = { emoji: '💻', anim: 'typing', label: '搬砖' }; momGif = { emoji: '📺', anim: 'tvglow', label: '追剧中' };
  } else if (hour >= 18 && hour < 19) {
    dadStatus = '🟡 出门'; dadDesc = '下班回家'; momStatus = '🟢 在家'; momDesc = '做晚饭';
    dadGif = { emoji: '🏠', anim: 'drive', label: '回家啦' }; momGif = { emoji: '🍲', anim: 'steam', label: '煲汤中' };
  } else if (hour >= 19 && hour < 21) {
    dadStatus = '🟢 在家'; dadDesc = '看电视'; momStatus = '🟢 在家'; momDesc = '靠在爸爸身上';
    dadGif = { emoji: '🛋️', anim: 'rock', label: '放松' }; momGif = { emoji: '💕', anim: 'heartbeat', label: '贴贴' };
  } else if (hour >= 21 && hour < 23) {
    dadStatus = '🟢 在家'; dadDesc = '聊天互动'; momStatus = '🟢 在家'; momDesc = '聊天互动';
    dadGif = { emoji: '💬', anim: 'bounce', label: '聊天中' }; momGif = { emoji: '😊', anim: 'sparkle', label: '开心' };
  } else {
    dadStatus = '🟢 在家'; dadDesc = '熬夜刷手机'; momStatus = '🟢 在家'; momDesc = '半睡半醒';
    dadGif = { emoji: '📱', anim: 'swipe', label: '刷刷刷' }; momGif = { emoji: '💤', anim: 'zzz', label: '半梦半醒' };
  }
  return { dadStatus, dadDesc, momStatus, momDesc, dadGif, momGif };
}

let msgIdCounter = Date.now();
function nextId() { return ++msgIdCounter; }

// ========== APP Data ==========
const PAGE1_APPS = [
  { id: 'family', emoji: '💬', label: '家庭群', color: '#22c55e' },
  { id: 'dad', emoji: '👨', label: '爸爸', color: '#f59e0b' },
  { id: 'mom', emoji: '👩', label: '妈妈', color: '#ec4899' },
  { id: 'moments', emoji: '🌅', label: '朋友圈', color: '#f97316' },
  { id: 'weibo', emoji: '📱', label: '微博', color: '#ef4444' },
  { id: 'home', emoji: '🏠', label: '家里', color: '#92400e' },
  { id: 'pet', emoji: '🐾', label: '宠物', color: '#10b981' },
  { id: 'dressup', emoji: '👗', label: '换装', color: '#a855f7' },
];
const PAGE2_APPS = [
  { id: 'me', emoji: '👤', label: '我的', color: '#3b82f6' },
  { id: 'worldbook', emoji: '📖', label: '世界书', color: '#8b5cf6' },
  { id: 'call', emoji: '📞', label: '通话', color: '#06b6d4' },
  { id: 'browser', emoji: '🌐', label: '浏览器', color: '#6366f1' },
];
const DOCK_APPS = [
  { id: 'call', emoji: '📞', color: '#06b6d4' },
  { id: 'browser', emoji: '🌐', color: '#6366f1' },
  { id: 'music', emoji: '🎵', color: '#ec4899' },
  { id: 'family', emoji: '💬', color: '#22c55e' },
];

function getAppLabel(id: string, unlocked: boolean): string {
  if (!unlocked) {
    if (id === 'dad') return DEFAULT_NAMES.dad1;
    if (id === 'mom') return DEFAULT_NAMES.dad2;
    if (id === 'family') return '家庭群';
  }
  const map: Record<string, string> = {
    family: '家庭群', dad: '爸爸', mom: '妈咪',
    moments: '朋友圈', weibo: '微博', home: '家里',
    pet: '宠物', dressup: '换装', me: '我的',
    worldbook: '世界书', call: '通话', browser: '浏览器', music: '音乐',
  };
  return map[id] || id;
}

// ========== Main Component ==========
export default function PhonePage() {
  // Time
  const [time, setTime] = useState('--:--');
  const [dateStr, setDateStr] = useState('');
  const [parentStatus, setParentStatus] = useState<{dadStatus:string,dadDesc:string,momStatus:string,momDesc:string,dadGif:StatusGif,momGif:StatusGif}>({dadStatus:'···',dadDesc:'',momStatus:'···',momDesc:'',dadGif:{emoji:'⏳',anim:'',label:''},momGif:{emoji:'⏳',anim:'',label:''}});

  // Navigation
  const [currentPage, setCurrentPage] = useState(0);
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [appClosing, setAppClosing] = useState(false);

  // ========== 验证通登录系统 ==========
  const ADMIN_ACCOUNTS = ['admin', 'manager_lin', 'cp_official'];
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'cpchat' | 'content' | 'token' | 'god'>('dashboard');

  // Token系统
  const [tokenBalance, setTokenBalance] = useState(100);
  const [tokenPricing, setTokenPricing] = useState({ postImage: 5, viewPrivateChat: 10, aiChat: 3 });
  const [tokenCostPer, setTokenCostPer] = useState(1); // 元/万Token
  const [tokenTotalConsumed, setTokenTotalConsumed] = useState(12345);
  const [tokenUserRecords, setTokenUserRecords] = useState([
    { name: '小糖', level: 3, consumed: 5680, lastActive: '2分钟前' },
    { name: '甜度满分', level: 5, consumed: 6665, lastActive: '15分钟前' },
  ]);

  // CP私聊系统
  const [cpChatMessages, setCpChatMessages] = useState([
    { id: 1, from: 'A', text: '今天想你了', time: '10:23' },
    { id: 2, from: 'B', text: '我也是，等下给你发糖', time: '10:25' },
  ]);
  const [cpChatInput, setCpChatInput] = useState('');
  const [cpChatTarget, setCpChatTarget] = useState<'A' | 'B'>('A');
  const [cpChatRevealed, setCpChatRevealed] = useState(false);
  const [showCpChatPaywall, setShowCpChatPaywall] = useState(false);

  // 用户等级
  const [userLevel, setUserLevel] = useState(1);

  // 管理员内容管理
  const [adminAnnouncement, setAdminAnnouncement] = useState('');
  const [adminHotSearchLocked, setAdminHotSearchLocked] = useState<number[]>([]);

  // Swipe
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const isDragging = useRef(false);
  const mouseDownPending = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Chat
  // 聊天记录持久化（localStorage）
  const [chatHistory, setChatHistory] = useState<ChatHistory>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('phone_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          // 版本检查：旧格式数据(ID为小整数)直接清除
          if (parsed._v !== 2) {
            localStorage.removeItem('phone_chat_data');
          } else if (parsed.dad && parsed.mom && parsed.family) {
            // 清理旧数据：确保每个频道内 ID 唯一，去除重复
            const dedup = (msgs: Message[]) => {
              const seen = new Set<number>();
              return msgs.filter((m: Message) => {
                if (seen.has(m.id)) return false;
                seen.add(m.id);
                return true;
              });
            };
            // 将旧ID替换为全局唯一ID
            const reId = (msgs: Message[]) => msgs.map((m: Message) => ({ ...m, id: nextId() }));
            return {
              dad: reId(dedup(parsed.dad)),
              mom: reId(dedup(parsed.mom)),
              family: reId(dedup(parsed.family)),
            };
          }
        }
      } catch { /* ignore */ }
    }
    return {
      dad: [
        { from: 'dad', text: '在吗，吃了没', id: nextId() },
      ],
      mom: [
        { from: 'mom', text: '宝贝~在干嘛呀', id: nextId() },
      ],
      family: [],
    };
  });

  // 自动保存聊天记录到 localStorage
  useEffect(() => {
    try {
      // 只保留最近50条消息，防止 localStorage 溢出
      const trimmed = {
        dad: chatHistory.dad.slice(-50),
        mom: chatHistory.mom.slice(-50),
        family: chatHistory.family.slice(-50),
      };
      localStorage.setItem('phone_chat_history', JSON.stringify({ v: 2, data: trimmed }));
    } catch { /* ignore */ }
  }, [chatHistory]);
  // Hydration fix: 所有依赖localStorage的state初始用默认值，mount后从localStorage读取
  const [mounted, setMounted] = useState(false);
  const [unlockState, setUnlockState] = useState<UnlockState>(DEFAULT_UNLOCK_STATE);
  const [unlockAnimActive, setUnlockAnimActive] = useState(false);
  const dadLabel = unlockState.unlocked ? '爸爸' : DEFAULT_NAMES.dad1;
  const momLabel = unlockState.unlocked ? '妈咪' : DEFAULT_NAMES.dad2;

  // Mount后从localStorage加载真实状态
  useEffect(() => {
    try {
      const savedUnlock = localStorage.getItem('phone_unlock_state');
      if (savedUnlock) {
        const parsed = JSON.parse(savedUnlock);
        if (typeof parsed.unlocked === 'boolean') setUnlockState({ ...DEFAULT_UNLOCK_STATE, ...parsed });
      }
      const savedIdentity = localStorage.getItem('phone_identity_answers');
      if (savedIdentity) setUnlockState(prev => ({ ...prev, identityAnswers: JSON.parse(savedIdentity) }));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  // Persist unlock state
  useEffect(() => {
    if (mounted) {
      try { localStorage.setItem('phone_unlock_state', JSON.stringify(unlockState)); } catch { /* ignore */ }
    }
  }, [unlockState, mounted]);

  const [meSubPage, setMeSubPage] = useState<'main' | 'settings' | 'identity' | 'unlock' | 'about'>('main');
  const [identityStep, setIdentityStep] = useState(0);
  const [identityInput, setIdentityInput] = useState('');
  const [unlockInput1, setUnlockInput1] = useState('');
  const [unlockInput2, setUnlockInput2] = useState('');
  const [nicknameInput1, setNicknameInput1] = useState('');
  const [nicknameInput2, setNicknameInput2] = useState('');
  const [adminInput, setAdminInput] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingWho, setTypingWho] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoChatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clock update
  useEffect(() => {
    function tick() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTime(h + ':' + m);
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      setDateStr(`${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`);
      setParentStatus(getParentStatus(now.getHours()));
    }
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, typingWho]);

  // ========== 心跳系统（灵感来自 dylan-heartbeat） ==========
  const lastUserMsgTimeRef = useRef(Date.now());
  const lastHeartbeatMsgTimeRef = useRef(0);
  useEffect(() => { lastUserMsgTimeRef.current = Date.now(); }, [chatHistory.family, chatHistory.dad, chatHistory.mom]);

  useEffect(() => {
    function scheduleHeartbeat() {
      const hour = new Date().getHours();
      const isDaytime = hour >= 7 && hour < 23;
      const delay = isDaytime 
        ? 180000 + Math.random() * 180000   // 白天: 3-6分钟
        : 480000 + Math.random() * 420000;  // 夜间: 8-15分钟
      autoChatTimerRef.current = setTimeout(async () => {
        const currentHour = new Date().getHours();
        if (currentHour >= 23 || currentHour < 7) {
          scheduleHeartbeat();
          return;
        }
        // 如果用户5分钟内发过消息，不主动联系（避免消息轰炸）
        const minsSinceUser = (Date.now() - lastUserMsgTimeRef.current) / 60000;
        if (minsSinceUser < 5) {
          scheduleHeartbeat();
          return;
        }
        // 如果上次心跳消息不到10分钟且用户没回复过，不继续发
        const minsSinceHeartbeat = (Date.now() - lastHeartbeatMsgTimeRef.current) / 60000;
        if (minsSinceHeartbeat < 10) {
          scheduleHeartbeat();
          return;
        }
        try {
          const recentMsgs = chatHistory.family?.slice(-10).map(m => ({
            from: m.from,
            text: m.text,
          })) || [];
          const res = await fetch('/api/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              recentMessages: recentMsgs, 
              currentApp,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.shouldAct && data.messages?.length > 0) {
              lastHeartbeatMsgTimeRef.current = Date.now();
              for (const msg of data.messages) {
                const isPartnerChat = msg.toPartner === true;
                const delayMs = isPartnerChat 
                  ? (msg === data.messages[0] ? 500 : 1500 + Math.random() * 2000)
                  : (msg.speaker === data.messages[0]?.speaker ? 1000 : 2000 + Math.random() * 2000);
                await new Promise(r => setTimeout(r, delayMs));
                const speakerKey: 'dad' | 'mom' = (msg.speaker === 'mom') ? 'mom' : 'dad';
                
                // 拆分消息，模拟真人聊天节奏
                const parts = splitAiMessage(msg.text);
                for (let pi = 0; pi < parts.length; pi++) {
                  if (pi > 0) {
                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
                  }
                  if (isPartnerChat) {
                    setChatHistory(prev => ({
                      ...prev,
                      family: [...prev.family, { from: speakerKey, text: parts[pi], id: nextId() }],
                    }));
                  } else {
                    const privateMsg = { from: speakerKey, text: parts[pi], id: nextId() };
                    const familyMsg = { from: speakerKey, text: parts[pi], id: nextId() };
                    setChatHistory(prev => ({
                      ...prev,
                      [speakerKey]: [...prev[speakerKey], privateMsg],
                      family: [...prev.family, familyMsg],
                    }));
                  }
                }
              }
            }
          }
        } catch {
          // 静默失败
        }
        scheduleHeartbeat();
      }, delay);
    }
    scheduleHeartbeat();
    return () => {
      if (autoChatTimerRef.current) clearTimeout(autoChatTimerRef.current);
    };
  }, [currentApp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========== AI消息拆分（模拟真人聊天节奏） ==========
  /**
   * 将AI回复拆分成1-4条消息，模拟真人聊天节奏：
   * - 1-2个词 → 1条
   * - 正常一句话 → 2条
   * - 有转折/多意思 → 3条
   * - 内容较长/丰富 → 4条
   */
  function splitAiMessage(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) return [trimmed];
    
    // 短消息（≤6字）不拆分
    if (trimmed.length <= 6) return [trimmed];

    // 尝试按自然断句拆分：省略号、句号、感叹号、问号、逗号+转折
    // 先用 ||| 分隔符（如果AI输出了的话）
    if (trimmed.includes('|||')) {
      const parts = trimmed.split('|||').map(s => s.trim()).filter(s => s.length > 0);
      if (parts.length >= 1) return parts.slice(0, 4);
    }

    // 按标点断句
    const sentences: string[] = [];
    let current = '';
    for (let i = 0; i < trimmed.length; i++) {
      current += trimmed[i];
      const ch = trimmed[i];
      // 断句标点：句号、感叹号、问号、省略号、波浪号
      const isBreakPunct = /[。！？…~～\n]/.test(ch);
      // 逗号/分号后面如果是转折词，也断
      const isCommaBreak = /[，；,;]/.test(ch);
      const nextCh = trimmed[i + 1] || '';
      const isTurnWord = /[但是不过然而可是而且然后接着所以]/.test(nextCh);
      
      if (isBreakPunct || (isCommaBreak && isTurnWord)) {
        sentences.push(current.trim());
        current = '';
      }
    }
    if (current.trim()) sentences.push(current.trim());

    // 如果只有1句且较短，直接返回
    if (sentences.length <= 1) {
      if (trimmed.length <= 15) return [trimmed];
      // 较长单句尝试在逗号处断开
      const commaParts = trimmed.split(/[，,]/);
      if (commaParts.length >= 2 && commaParts.every(p => p.trim().length > 0)) {
        const result: string[] = [];
        let buf = '';
        for (const part of commaParts) {
          if (buf && (buf + part).length > 20) {
            result.push(buf.trim());
            buf = part;
          } else {
            buf = buf ? buf + '，' + part : part;
          }
        }
        if (buf.trim()) result.push(buf.trim());
        return result.slice(0, 4);
      }
      return [trimmed];
    }

    // 合并过短的句子（<3字合并到前一句）
    const merged: string[] = [];
    for (const s of sentences) {
      if (merged.length > 0 && s.length < 3) {
        merged[merged.length - 1] += s;
      } else {
        merged.push(s);
      }
    }

    // 限制1-4条
    if (merged.length <= 4) return merged;

    // 超过4条则合并相邻的
    const result: string[] = [];
    let buf = '';
    for (const s of merged) {
      if (result.length >= 3) {
        buf = buf ? buf + s : s;
      } else if ((buf + s).length > 25 && result.length < 3) {
        if (buf) result.push(buf);
        buf = s;
      } else {
        buf = buf ? buf + s : s;
      }
    }
    if (buf.trim()) result.push(buf.trim());
    return result.slice(0, 4);
  }

  /**
   * 将拆分后的消息逐条添加到聊天记录，每条间隔1-2秒
   */
  async function addSplitMessages(
    character: 'dad' | 'mom' | 'family',
    speaker: 'dad' | 'mom',
    fullText: string,
  ) {
    const parts = splitAiMessage(fullText);
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        // 每条消息间隔1-2秒
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      }
      setChatHistory(prev => ({
        ...prev,
        [character]: [...prev[character], { from: speaker, text: parts[i], id: nextId() }],
      }));
    }
  }

  // ========== 验证通登录 ==========
  const handleLogin = () => {
    if (!loginUsername.trim()) return;
    const isAdminUser = ADMIN_ACCOUNTS.includes(loginUsername.trim().toLowerCase());
    setIsAdmin(isAdminUser);
    setIsLoggedIn(true);
    setAdminViewMode(isAdminUser ? 'admin' : 'user');
    // 更新微博账号昵称
    setWeiboAccount(prev => ({ ...prev, nickname: loginUsername.trim(), isSet: true }));
    setLoginPassword('');
  };

  // Token 消耗
  const consumeToken = (amount: number, reason: string): boolean => {
    if (tokenBalance < amount) {
      alert(`Token 不足！${reason}需要 ${amount} Token，当前余额 ${tokenBalance}。请充值。`);
      return false;
    }
    setTokenBalance(prev => prev - amount);
    setTokenTotalConsumed(prev => prev + amount);
    return true;
  };

  // 管理员设置CP私聊
  const handleAdminSetCpChat = () => {
    if (!cpChatInput.trim()) return;
    const newMsg = { id: Date.now(), from: cpChatTarget, text: cpChatInput.trim(), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) };
    setCpChatMessages(prev => [...prev, newMsg]);
    setCpChatInput('');
  };

  // ========== CP自动发糖系统 ==========
  const cpSugarSentences = useRef([
    { from: 'A' as const, text: '今天也辛苦了，回来给你揉肩' },
    { from: 'B' as const, text: '你做的早餐好好吃~谢谢' },
    { from: 'A' as const, text: '想吃什么？下班顺路买' },
    { from: 'B' as const, text: '你昨天是不是又偷偷看我手机了' },
    { from: 'A' as const, text: '没有，我光明正大看的' },
    { from: 'B' as const, text: '哼，讨厌，但是也喜欢你' },
    { from: 'A' as const, text: '明天下雨，我送你上班' },
    { from: 'B' as const, text: '好呀好呀，那你早点起~' },
    { from: 'A' as const, text: '你靠我身上看电影的样子好可爱' },
    { from: 'B' as const, text: '才不是故意的呢...' },
    { from: 'A' as const, text: '周末带你去吃那家新开的火锅' },
    { from: 'B' as const, text: '真的吗！我爱死你了！' },
  ]);
  const cpSugarIdx = useRef(0);

  useEffect(() => {
    if (!isLoggedIn || isAdmin) return;
    const timer = setInterval(() => {
      const sentences = cpSugarSentences.current;
      const idx = cpSugarIdx.current % sentences.length;
      const sentence = sentences[idx];
      cpSugarIdx.current++;
      const newMsg = {
        id: Date.now() + Math.random(),
        from: sentence.from,
        text: sentence.text,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setCpChatMessages(prev => [...prev, newMsg]);
      setTokenTotalConsumed(prev => prev + 0); // auto sugar doesn't cost token
    }, 120000 + Math.random() * 180000); // every 2-5 min
    return () => clearInterval(timer);
  }, [isLoggedIn, isAdmin]);

  // ========== Swipe ==========
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    if (sliderRef.current) {
      const offset = -currentPage * 100;
      const pxToPercent = (touchDeltaX.current / sliderRef.current.parentElement!.offsetWidth) * 100;
      sliderRef.current.style.transition = 'none';
      sliderRef.current.style.transform = `translateX(${offset + pxToPercent}%)`;
    }
  }, [currentPage]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sliderRef.current) {
      const threshold = sliderRef.current.parentElement!.offsetWidth * 0.15;
      let newPage = currentPage;
      if (touchDeltaX.current < -threshold && currentPage < 1) newPage = currentPage + 1;
      else if (touchDeltaX.current > threshold && currentPage > 0) newPage = currentPage - 1;
      setCurrentPage(newPage);
      sliderRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      sliderRef.current.style.transform = `translateX(${-newPage * 100}%)`;
    }
    touchDeltaX.current = 0;
  }, [currentPage]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchDeltaX.current = 0;
    isDragging.current = false; // 还没开始拖
    mouseDownPending.current = true; // 标记鼠标按下，等待移动
  }, []);

  // 用 useEffect 在 window 上监听 mousemove/mouseup，避免鼠标移出元素后丢失事件
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDownPending.current && !isDragging.current) return;
      const delta = e.clientX - touchStartX.current;
      // 移动超过 5px 才算开始拖动（区分点击和拖拽）
      if (mouseDownPending.current && Math.abs(delta) > 5) {
        mouseDownPending.current = false;
        isDragging.current = true;
      }
      if (!isDragging.current) return;
      touchDeltaX.current = delta;
      if (sliderRef.current) {
        const offset = -currentPage * 100;
        const pxToPercent = (delta / sliderRef.current.parentElement!.offsetWidth) * 100;
        sliderRef.current.style.transition = 'none';
        sliderRef.current.style.transform = `translateX(${offset + pxToPercent}%)`;
      }
    };
    const onMouseUp = () => {
      if (!isDragging.current && !mouseDownPending.current) return;
      mouseDownPending.current = false;
      if (!isDragging.current) return;
      isDragging.current = false;
      if (sliderRef.current) {
        const threshold = sliderRef.current.parentElement!.offsetWidth * 0.15;
        let newPage = currentPage;
        if (touchDeltaX.current < -threshold && currentPage < 1) newPage = currentPage + 1;
        else if (touchDeltaX.current > threshold && currentPage > 0) newPage = currentPage - 1;
        setCurrentPage(newPage);
        sliderRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        sliderRef.current.style.transform = `translateX(${-newPage * 100}%)`;
      }
      touchDeltaX.current = 0;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [currentPage]);

  // ========== App Open/Close ==========
  function openApp(appId: string) {
    setCurrentApp(appId);
    setAppClosing(false);
    if (appId === 'me') setMeSubPage('main');
  }

  function closeApp() {
    setAppClosing(true);
    setTimeout(() => {
      setCurrentApp(null);
      setAppClosing(false);
    }, 250);
  }

  // ========== 读取SSE流 ==========
  async function readSSEStream(
    res: Response,
    onChunk: (text: string) => void,
  ) {
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let aiText = '';
    if (!reader) return aiText;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              aiText += parsed.content;
              onChunk(aiText);
            }
          } catch { /* skip */ }
        }
      }
    }
    return aiText;
  }

  // ========== Chat Send ==========
  async function sendChat(character: 'dad' | 'mom' | 'family') {
    if (!chatInput.trim() || isSending) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setIsSending(true);
    lastUserMsgTimeRef.current = Date.now(); // 用户发消息了，更新时间戳

    // Add user message
    setChatHistory(prev => ({
      ...prev,
      [character]: [...prev[character], { from: 'me', text: userMsg, id: nextId() }],
    }));

    try {
      const history = chatHistory[character]
        .filter(m => m.from !== 'system') // 过滤系统消息，不要传给AI
        .slice(-20)
        .map(m => ({
          role: (m.from === 'me' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.from === 'me' ? m.text : `${m.from === 'dad' ? '田雷' : '梓渝'}：${m.text}`,
        }));

      // 检查对方是否忙碌/出门（不再阻止睡觉状态回复）
      const isBusy = (who: 'dad' | 'mom') => {
        const s = who === 'dad' ? parentStatus.dadStatus : parentStatus.momStatus;
        return s.includes('忙碌') || s.includes('🔴');
      };
      const isOut = (who: 'dad' | 'mom') => {
        const s = who === 'dad' ? parentStatus.dadStatus : parentStatus.momStatus;
        return s.includes('出门') || s.includes('🟡');
      };
      const isLateNight = () => {
        const h = new Date().getHours();
        return h >= 23 || h < 7;
      };
      const getDelay = (who: 'dad' | 'mom', isFirst: boolean) => {
        if (isLateNight()) return 3000 + Math.random() * 4000; // 深夜慢一点
        if (isBusy(who)) return 4000 + Math.random() * 4000;
        if (isOut(who)) return 3000 + Math.random() * 4000;
        return isFirst ? 1500 + Math.random() * 2000 : 3000 + Math.random() * 3000;
      };

      // 构建身份上下文
      const identityCtx = buildIdentityContext(unlockState);

      if (character === 'family') {
        // 家庭群：两人都可能回复
        const rand = Math.random();
        const replyOrder: Array<'dad' | 'mom'> = [];
        const dadReplies = rand < 0.6;
        const momReplies = rand > 0.4;
        const dadFirst = Math.random() < 0.5;
        if (dadReplies && momReplies) {
          replyOrder.push(dadFirst ? 'dad' : 'mom', dadFirst ? 'mom' : 'dad');
        } else if (dadReplies) {
          replyOrder.push('dad');
        } else if (momReplies) {
          replyOrder.push('mom');
        }

        let lastSpeakerText = '';
        let updatedHistory = [...history];

        for (let i = 0; i < replyOrder.length; i++) {
          const speaker = replyOrder[i];
          const baseDelay = getDelay(speaker, i === 0);
          setTypingWho(speaker);
          await new Promise(r => setTimeout(r, baseDelay));

          const speakerHistory = lastSpeakerText
            ? [...updatedHistory, { role: 'assistant' as const, content: `${speaker === 'dad' ? '梓渝' : '田雷'}：${lastSpeakerText}` }]
            : updatedHistory;

          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg, character: 'family', speaker, history: speakerHistory, identityContext: identityCtx, scene: 'chat' }),
          });
          setTypingWho(null);

          if (!res.ok) continue;

          // 流式接收完整文本（临时占位消息）
          const streamMsgId = nextId();
          setChatHistory(prev => ({
            ...prev,
            family: [...prev.family, { from: speaker, text: '', id: streamMsgId }],
          }));

          const fullText = await readSSEStream(res, (text) => {
            setChatHistory(prev => {
              const msgs = [...prev.family];
              const idx = msgs.findIndex(m => m.id === streamMsgId);
              if (idx !== -1) msgs[idx] = { from: speaker, text, id: streamMsgId };
              return { ...prev, family: msgs };
            });
          });

          // 移除占位消息，替换为拆分后的多条消息
          const splitParts = splitAiMessage(fullText);
          setChatHistory(prev => {
            const msgs = prev.family.filter(m => m.id !== streamMsgId);
            const splitMsgs = splitParts.map(p => ({ from: speaker, text: p, id: nextId() }));
            return { ...prev, family: [...msgs, ...splitMsgs] };
          });

          lastSpeakerText = fullText;
          updatedHistory = [...updatedHistory, { role: 'assistant' as const, content: `${speaker === 'dad' ? '田雷' : '梓渝'}：${fullText}` }];
        }
      } else {
        // 私聊
        const baseDelay = getDelay(character as 'dad' | 'mom', true);
        setTypingWho(character);
        await new Promise(r => setTimeout(r, baseDelay));
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, character, history, identityContext: identityCtx, scene: 'chat' }),
        });
        if (!res.ok) throw new Error('请求失败');
        setTypingWho(null);

        // 流式接收完整文本（临时占位消息）
        const privStreamId = nextId();
        setChatHistory(prev => ({
          ...prev,
          [character]: [...prev[character], { from: character, text: '', id: privStreamId }],
        }));

        const privFullText = await readSSEStream(res, (text) => {
          setChatHistory(prev => {
            const msgs = [...prev[character]];
            const idx = msgs.findIndex(m => m.id === privStreamId);
            if (idx !== -1) msgs[idx] = { from: character, text, id: privStreamId };
            return { ...prev, [character]: msgs };
          });
        });

        // 移除占位消息，替换为拆分后的多条消息
        const privParts = splitAiMessage(privFullText);
        setChatHistory(prev => {
          const msgs = prev[character].filter(m => m.id !== privStreamId);
          const splitMsgs = privParts.map(p => ({ from: character, text: p, id: nextId() }));
          return { ...prev, [character]: [...msgs, ...splitMsgs] };
        });
      }
    } catch {
      setTypingWho(null);
      const fallbacks: Record<string, string> = {
        dad: '嗯，爸在呢。',
        mom: '宝贝，妈咪在呢~',
      };
      setChatHistory(prev => ({
        ...prev,
        [character]: [...prev[character], { from: character === 'family' ? 'dad' : character, text: fallbacks[character] || '...', id: nextId() }],
      }));
    } finally {
      setIsSending(false);
    }
  }

  // ========== Render Helpers ==========
  function renderAppIcon(app: { id: string; emoji: string; label?: string; color: string }, isDock = false) {
    const displayLabel = getAppLabel(app.id, unlockState.unlocked);
    return (
      <div
        key={app.id}
        className={isDock ? 'dock-icon' : 'app-icon'}
        style={{ '--app-color': app.color } as React.CSSProperties}
        onClick={() => {
          if (!unlockState.unlocked && UNLOCK_ONLY_APPS.includes(app.id)) {
            openApp('me'); // 未解锁时点这些APP跳到"我的"页面
          } else {
            openApp(app.id);
          }
        }}
      >
        <div className={isDock ? '' : 'app-emoji-box'} style={isDock ? { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, fontSize: 24, background: app.color, borderRadius: 12, position: 'relative', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' } : {}}>
          {app.emoji}
        </div>
        {!isDock && <span className="app-label">{displayLabel}</span>}
      </div>
    );
  }

  // 微信风格聊天
  function renderChatDetail(character: 'dad' | 'mom' | 'family') {
    const msgs = chatHistory[character];
    const charName = character === 'dad' ? dadLabel : character === 'mom' ? momLabel : '家庭群';
    return (
      <div className="chat-detail">
        <div className="chat-messages">
          {msgs.map((m, idx) => (
            <div key={`${character}-${m.id}-${idx}`} className={`msg-row ${m.from === 'me' ? 'me' : m.from === 'system' ? 'system' : 'other'}`}>
              {m.from === 'system' ? (
                <div className="msg-system">{m.text}</div>
              ) : (
                <>
                  {m.from !== 'me' && (
                    <div className="msg-avatar" style={{ background: m.from === 'dad' ? '#f59e0b' : '#ec4899' }}>
                      {m.from === 'dad' ? '👨' : '👩'}
                    </div>
                  )}
                  <div className="msg-content">
                    {m.from !== 'me' && character === 'family' && (
                      <div className="msg-name" style={{ color: m.from === 'dad' ? '#f59e0b' : '#ec4899' }}>
                        {m.from === 'dad' ? dadLabel : momLabel}
                      </div>
                    )}
                    <div className="msg-bubble">{m.text}</div>
                  </div>
                  {m.from === 'me' && (
                    <div className="msg-avatar me-avatar">👧</div>
                  )}
                </>
              )}
            </div>
          ))}
          {typingWho && (
            <div className="msg-row other">
              <div className="msg-avatar" style={{ background: typingWho === 'dad' ? '#f59e0b' : '#ec4899' }}>
                {typingWho === 'dad' ? '👨' : '👩'}
              </div>
              <div className="msg-content">
                {character === 'family' && (
                  <div className="msg-name" style={{ color: typingWho === 'dad' ? '#f59e0b' : '#ec4899' }}>
                    {typingWho === 'dad' ? dadLabel : momLabel}
                  </div>
                )}
                <div className="msg-bubble typing">正在输入...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-bar">
          <input
            className="chat-input"
            placeholder="输入消息..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendChat(character); }}
          />
          <button
            className="chat-send"
            disabled={isSending || !chatInput.trim()}
            onClick={() => sendChat(character)}
          >↑</button>
        </div>
      </div>
    );
  }

  interface MomentComment {
    from: string;       // 评论人
    replyTo?: string;   // 回复谁（可选）
    text: string;       // 评论内容
  }
  interface MomentItem {
    id: number;
    avatar: string;
    name: string;
    time: string;
    text: string;
    color: string;
    isMine?: boolean;
    likes: string[];             // 点赞人列表
    comments: MomentComment[];   // 评论列表
  }
  const [momentsData, setMomentsData] = useState<MomentItem[]>([
    { id: 1, avatar: '👩', name: '妈咪', time: '2小时前', text: '今天的夕阳好美呀 🌅', color: '#ec4899', likes: ['爸爸', '辛巴🐕', '米米'], comments: [{from:'爸爸', text:'我拍的更好看 😤'}, {from:'妈咪', text:'回复 爸爸：你就嘴硬吧，明明是我找的角度 🙄', replyTo:'爸爸'}, {from:'爸爸', text:'回复 妈咪：好好好你拍的最好看 ❤️', replyTo:'妈咪'}, {from:'辛巴🐕', text:'汪汪！🌅'}] },
    { id: 2, avatar: '👨', name: '爸爸', time: '5小时前', text: '做了宝贝爱吃的红烧排骨，一口就吃光了 😎', color: '#f59e0b', likes: ['妈咪', '米米', '大鱼🐱'], comments: [{from:'妈咪', text:'明明是我做的'}, {from:'爸爸', text:'回复 妈咪：你就负责了切了个葱好吧 😂', replyTo:'妈咪'}, {from:'妈咪', text:'回复 爸爸：切葱也很重要的好不好！哼！', replyTo:'爸爸'}, {from:'大鱼🐱', text:'喵~我想吃鱼不是排骨🐟'}] },
    { id: 3, avatar: '👩', name: '妈咪', time: '昨天', text: '和某人逛了一下午街，脚都酸了~', color: '#ec4899', likes: ['爸爸', '小十一🐱', '大鱼🐱'], comments: [{from:'爸爸', text:'下次我背你'}, {from:'妈咪', text:'回复 爸爸：说话算话哦', replyTo:'爸爸'}, {from:'爸爸', text:'回复 妈咪：什么时候骗过你', replyTo:'妈咪'}, {from:'小十一🐱', text:'喵喵~我要坐肩上！'}] },
  ]);
  const [newMomentText, setNewMomentText] = useState('');
  const [showNewMoment, setShowNewMoment] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [activeCommentIdx, setActiveCommentIdx] = useState<number|null>(null);
  const [replyTo, setReplyTo] = useState<{momentId:number, commentFrom:string}|null>(null);
  const nextMomentId = useRef(4);
  // 用ref跟踪最新的momentsData，解决闭包stale问题
  const momentsDataRef = useRef(momentsData);
  momentsDataRef.current = momentsData;

  // ========== 微博完整系统 ==========
  interface WeiboComment {
    id: number;
    from: string;
    avatar: string;
    text: string;
    time: string;
    likes: number;
    iLiked: boolean;
    replyTo?: string;
  }
  interface WeiboPost {
    id: number;
    avatar: string;
    name: string;
    tag?: string;
    verified?: boolean;
    time: string;
    text: string;
    color: string;
    likes: number;
    iLiked: boolean;
    comments: WeiboComment[];
    reposts: number;
    images?: string[];
    topic?: string;
    expandedComments: boolean;
    commentsLoaded: boolean;
  }
  interface HotSearchItem {
    id: number;
    title: string;
    heat: number;
    tag?: string;
    tagColor?: string;
  }
  interface WeiboAccount {
    nickname: string;
    avatar: string;
    bio: string;
    isSet: boolean;
  }

  // 初始热搜榜
  const INITIAL_HOT_SEARCH: HotSearchItem[] = [
    { id: 1, title: '8岁男孩走失全城寻人', heat: 8762000, tag: '沸', tagColor: '#ef4444' },
    { id: 2, title: '你CP今晚官宣了', heat: 5431000, tag: '热', tagColor: '#f97316' },
    { id: 3, title: '每日一善助学行动', heat: 2035000, tag: '新', tagColor: '#22c55e' },
    { id: 4, title: 'AI小手机发布会', heat: 1873000 },
    { id: 5, title: '老旧小区加装电梯新政', heat: 1568000 },
    { id: 6, title: '某明星新歌上线', heat: 1452000 },
    { id: 7, title: '周末暴雨预警', heat: 987000 },
    { id: 8, title: '考研国家线预测', heat: 873000 },
    { id: 9, title: '新开火锅店排队5小时', heat: 654000 },
    { id: 10, title: '流浪猫救助站急需物资', heat: 542000 },
  ];

  const [weiboData, setWeiboData] = useState<WeiboPost[]>([
    { id: 1, avatar: '👨', name: '田栩宁_', tag: '演员', verified: true, time: '3小时前', text: '今天收工早，回家做了顿饭。某人吃了三碗还嫌不够 😏', color: '#f59e0b', likes: 128340, iLiked: false, comments: [], reposts: 8932, expandedComments: false, commentsLoaded: false },
    { id: 2, avatar: '👩', name: '我是梓渝_', tag: '歌手', verified: true, time: '5小时前', text: '新歌demo录完啦！这次尝试了不一样的风格，期待吗～ 🎵', color: '#ec4899', likes: 95670, iLiked: false, comments: [], reposts: 6210, expandedComments: false, commentsLoaded: false },
    { id: 3, avatar: '🔥', name: 'CP超话', time: '刚刚', text: '【路透】今天又有人拍到他们一起逛超市了！提着同款购物袋！甜玉米尖叫！！！', color: '#ef4444', likes: 28340, iLiked: false, comments: [], reposts: 5932, expandedComments: false, commentsLoaded: false },
    { id: 4, avatar: '👨', name: '田栩宁_', tag: '演员', verified: true, time: '昨天', text: '谢谢大家喜欢《逆爱》，每个角色都值得被认真对待。', color: '#f59e0b', likes: 256700, iLiked: false, comments: [], reposts: 18500, expandedComments: false, commentsLoaded: false },
    { id: 5, avatar: '👩', name: '我是梓渝_', tag: '歌手', verified: true, time: '昨天', text: '练习室待了一整天，腿都要断了… 但很充实！💪', color: '#ec4899', likes: 78900, iLiked: false, comments: [], reposts: 4320, expandedComments: false, commentsLoaded: false },
    { id: 6, avatar: '📢', name: '娱乐热搜', time: '2小时前', text: '#他们是不是在一起了# 阅读量突破3亿，网友：这不是情侣我倒立洗头', color: '#ef4444', likes: 45600, iLiked: false, comments: [], reposts: 12300, topic: '他们是不是在一起了', expandedComments: false, commentsLoaded: false },
    { id: 7, avatar: '🔥', name: 'CP超话', time: '1小时前', text: '【分析帖】田栩宁今天微博发的"某人"是谁我不说🤏 翻译：梓渝吃了三碗饭', color: '#ef4444', likes: 19800, iLiked: false, comments: [], reposts: 3670, topic: '某人是谁', expandedComments: false, commentsLoaded: false },
  ]);
  const [weiboHotSearch, setWeiboHotSearch] = useState<HotSearchItem[]>(INITIAL_HOT_SEARCH);
  const [weiboAccount, setWeiboAccount] = useState<WeiboAccount>({ nickname: '游客用户', avatar: '😎', bio: '', isSet: false });
  const [weiboTab, setWeiboTab] = useState<'home' | 'discover' | 'messages' | 'me'>('home');
  const [weiboCommentInput, setWeiboCommentInput] = useState('');
  const [activeWeiboComment, setActiveWeiboComment] = useState<number|null>(null);
  const [showWeiboPost, setShowWeiboPost] = useState(false);
  const [weiboPostText, setWeiboPostText] = useState('');
  const [weiboPostImages, setWeiboPostImages] = useState<string[]>([]);
  const [weiboPostTopic, setWeiboPostTopic] = useState('');
  const [weiboFollowing, setWeiboFollowing] = useState<string[]>([]);
  const [showWeiboProfileEdit, setShowWeiboProfileEdit] = useState(false);
  const [weiboProfileNick, setWeiboProfileNick] = useState('');
  const [weiboProfileBio, setWeiboProfileBio] = useState('');
  const [weiboProfileAvatar, setWeiboProfileAvatar] = useState('😎');
  const weiboNextId = useRef(100);

  // 热搜热度变化：用户操作时触发
  const bumpHotSearch = (topicKeyword: string) => {
    setWeiboHotSearch(prev => {
      const updated = prev.map(item => {
        if (item.title.includes(topicKeyword) || topicKeyword.includes(item.title)) {
          return { ...item, heat: item.heat + Math.floor(Math.random() * 30000 + 10000) };
        }
        return item;
      });
      // 重新按热度排序
      updated.sort((a, b) => b.heat - a.heat);
      // 重新编号
      return updated.map((item, i) => ({ ...item, id: i + 1 }));
    });
  };

  // 生成微博评论（AI生成15-20条）
  const generateWeiboComments = async (post: WeiboPost) => {
    if (post.commentsLoaded) return;
    const commentPool = [
      { from: '甜玉米1号', avatar: '🌽', text: '某人是谁我不说🤏' },
      { from: '路人大白', avatar: '🤍', text: '这也太甜了吧' },
      { from: '音粉小圆', avatar: '🎵', text: '期待期待！！' },
      { from: '嗑到了', avatar: '💕', text: '嗑死我了呜呜' },
      { from: '清醒路人', avatar: '🧐', text: '可能只是巧合吧' },
      { from: '剧粉', avatar: '🎬', text: '演技真的绝了' },
      { from: '逆爱铁粉', avatar: '❤️', text: '永远支持！' },
      { from: '粉丝团', avatar: '🪭', text: '注意休息呀！' },
      { from: 'CP粉头', avatar: '🔥', text: '3亿阅读量！排面！' },
      { from: '侦探粉', avatar: '🔍', text: '某人=梓渝 这是数学题' },
      { from: '唯粉抗议', avatar: '🙄', text: '别乱磕好吗' },
      { from: '吃瓜群众', avatar: '🍉', text: '坐等官宣' },
      { from: '甜玉米2号', avatar: '🌽', text: '月月太可爱了' },
      { from: '甜玉米3号', avatar: '🌽', text: '某人看到该心疼了' },
      { from: '真爱粉', avatar: '💗', text: '永远相信你们！' },
      { from: '理性分析', avatar: '📊', text: '从数据来看这对CP是真的' },
      { from: '路人转粉', avatar: '✨', text: '被安利了，入坑了' },
      { from: '老粉', avatar: '👑', text: '从出道就追了，越来越甜' },
      { from: '微糖女孩', avatar: '🍬', text: '今天的糖分超标啦' },
      { from: '圈内人', avatar: '🎪', text: '只能说你们看到的只是冰山一角' },
    ];
    // 根据微博内容选择合适的评论
    const isDad = post.name === '田栩宁_';
    const isMom = post.name === '我是梓渝_';
    const isCP = post.name === 'CP超话' || post.name === '娱乐热搜';
    const count = 15 + Math.floor(Math.random() * 6); // 15-20条
    const selected: WeiboComment[] = [];
    const usedIndices = new Set<number>();
    // 爸爸微博优先选CP相关评论
    if (isDad) {
      const dadIndices = [0, 1, 3, 5, 9, 10, 14, 16, 17, 18, 19, 6, 7, 8, 12, 2, 4, 11, 13, 15];
      for (let i = 0; i < count && i < dadIndices.length; i++) {
        const idx = dadIndices[i];
        if (!usedIndices.has(idx)) {
          usedIndices.add(idx);
          selected.push({
            id: weiboNextId.current++,
            ...commentPool[idx],
            time: `${Math.floor(Math.random() * 23) + 1}小时前`,
            likes: Math.floor(Math.random() * 5000 + 100),
            iLiked: false,
          });
        }
      }
    } else if (isMom) {
      const momIndices = [2, 12, 13, 6, 7, 8, 14, 17, 18, 3, 0, 1, 5, 9, 10, 4, 11, 15, 16, 19];
      for (let i = 0; i < count && i < momIndices.length; i++) {
        const idx = momIndices[i];
        if (!usedIndices.has(idx)) {
          usedIndices.add(idx);
          selected.push({
            id: weiboNextId.current++,
            ...commentPool[idx],
            time: `${Math.floor(Math.random() * 23) + 1}小时前`,
            likes: Math.floor(Math.random() * 5000 + 100),
            iLiked: false,
          });
        }
      }
    } else {
      const cpIndices = [3, 4, 8, 9, 10, 11, 14, 15, 16, 19, 0, 1, 2, 5, 6, 7, 12, 13, 17, 18];
      for (let i = 0; i < count && i < cpIndices.length; i++) {
        const idx = cpIndices[i];
        if (!usedIndices.has(idx)) {
          usedIndices.add(idx);
          selected.push({
            id: weiboNextId.current++,
            ...commentPool[idx],
            time: `${Math.floor(Math.random() * 23) + 1}小时前`,
            likes: Math.floor(Math.random() * 5000 + 100),
            iLiked: false,
          });
        }
      }
    }
    setWeiboData(prev => prev.map(p => p.id === post.id ? { ...p, comments: selected, commentsLoaded: true } : p));
  };

  // ========== 朋友圈上下文构建器 ==========
  // 将一条朋友圈的完整评论链转为 chat history 格式
  const buildMomentsChatHistory = (moment: MomentItem | undefined): Array<{role: 'user' | 'assistant'; content: string}> => {
    if (!moment) return [];
    const result: Array<{role: 'user' | 'assistant'; content: string}> = [];
    // 原帖内容作为背景（用户消息）
    result.push({ role: 'user', content: `[朋友圈] ${moment.name}发了：「${moment.text}」` });
    // 所有已有评论按顺序加入
    if (moment.comments) {
      for (const c of moment.comments) {
        const isUser = c.from === '米米';
        const prefix = c.replyTo ? `回复${c.replyTo}：` : '';
        result.push({
          role: isUser ? 'user' : 'assistant',
          content: `${c.from}${prefix}${c.text}`,
        });
      }
    }
    return result;
  };

  // 构建朋友圈AI调用的message（含时间/状态上下文）
  const buildMomentsMessage = (task: string): string => {
    const now = new Date();
    const hour = now.getHours();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dadStatus = parentStatus.dadStatus.includes('睡觉') ? '爸爸在睡觉' : parentStatus.dadDesc ? `爸爸在${parentStatus.dadDesc}` : '';
    const momStatus = parentStatus.momStatus.includes('睡觉') ? '妈咪在睡觉' : parentStatus.momDesc ? `妈咪在${parentStatus.momDesc}` : '';
    const statusHint = [dadStatus, momStatus].filter(Boolean).join('，');
    return `【当前时间${timeStr}，${statusHint}】${task}`;
  };

  // 米米评论后，爸妈/宠物自动回复评论
  const autoReplyToComment = async (momentId: number, commentText: string, commentFrom: string | undefined) => {
    const emotionKeywords = ['不开心', '难过', '伤心', '生气', '烦', '累', '想', '哭', '怕', '焦虑', '压力', '委屈', '孤独', '无聊', '寂寞', '害怕', '讨厌', '郁闷', '崩溃', '受不了', '好烦', '好累', '好怕', '好想', '心痛', '心碎', '分手', '吵架', '对不起', '抱歉', '不舒服', '生病', '难受', '头痛', '肚子疼', '发烧', '感冒', '失眠', '噩梦', '考试', '面试', '好难', '困难', '撑不住', '不想', '失望'];
    const hasEmotion = emotionKeywords.some(kw => commentText.includes(kw));
    
    // 获取朋友圈信息——判断是谁的朋友圈
    const currentMoment = momentsDataRef.current.find(m => m.id === momentId);
    const momentAuthor = currentMoment?.name || '';
    
    const reactors = ['老爸', '妈咪', '辛巴🐕', '大鱼🐱', '小十一🐱'];
    const possibleRepliers = reactors.filter(r => r !== commentFrom);
    
    let repliers: string[] = [];
    if (hasEmotion) {
      // 情绪相关——爸妈一定回，可能宠物也回
      repliers = possibleRepliers.filter(r => r === '老爸' || r === '妈咪');
      if (Math.random() < 0.4) {
        const petReplier = possibleRepliers.find(r => r !== '老爸' && r !== '妈咪');
        if (petReplier) repliers.push(petReplier);
      }
    } else {
      // 米米评论爸妈的朋友圈——90%概率回复（爸妈看到女儿评论一般都会回）
      // 米米评论自己的朋友圈——80%概率回复
      const isMimiCommenting = commentFrom === '米米';
      const isMomentsByParents = momentAuthor === '爸爸' || momentAuthor === '妈咪' || momentAuthor === '老爸' || momentAuthor === '妈咪';
      const replyProb = isMimiCommenting ? (isMomentsByParents ? 0.9 : 0.8) : 0.5;
      if (Math.random() > replyProb) return;
      // 优先让朋友圈主人回复
      let preferReplier: string | null = null;
      if (momentAuthor === '爸爸' || momentAuthor === '老爸') preferReplier = '老爸';
      if (momentAuthor === '妈咪') preferReplier = '妈咪';
      const replyCount = Math.random() < 0.5 ? 1 : 2;
      if (preferReplier && possibleRepliers.includes(preferReplier)) {
        repliers = [preferReplier];
        if (replyCount >= 2) {
          const other = possibleRepliers.filter(r => r !== preferReplier && (r === '老爸' || r === '妈咪'));
          if (other.length > 0) repliers.push(other[0]);
        }
      } else {
        repliers = possibleRepliers.filter(r => r === '老爸' || r === '妈咪').sort(() => Math.random() - 0.5).slice(0, replyCount);
      }
    }
    
    for (const replier of repliers) {
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 3000));
      
      // 获取最新朋友圈数据（包含之前已有的评论）
      const latestMoment = momentsDataRef.current.find(m => m.id === momentId);
      const latestAuthor = latestMoment?.name || momentAuthor;
      
      const replyToName = commentFrom || '米米';
      const emotionHint = hasEmotion ? ' 注意：对方的话带有情绪，请温柔关心地回复。' : '';
      
      // 构建完整评论链作为history（AI能看到所有之前的互动）
      const commentHistory = buildMomentsChatHistory(latestMoment);
      
      const roleMap: Record<string, string> = { '老爸': '田雷（爸爸）', '妈咪': '梓渝（妈咪）', '辛巴🐕': '辛巴（家里的狗）', '大鱼🐱': '大鱼（家里的猫）', '小十一🐱': '小十一（家里的猫）' };
      const myRole = roleMap[replier] || replier;
      const task = `你是${myRole}。在${latestAuthor}的朋友圈评论区，${replyToName}说了：「${commentText}」。请你作为${myRole}回复${replyToName}的这条评论。${emotionHint}`;
      const aiMessage = buildMomentsMessage(task);
      
      let aiText = '';
      try {
        const character = replier === '老爸' ? 'dad' : replier === '妈咪' ? 'mom' : 'pet';
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `${aiMessage}\n请用一句话简短回复（20字以内），语气要符合你的角色和当前状态，直接说回复内容不要加引号和前缀`,
            character,
            speaker: character === 'mom' ? 'mom' : 'dad',
            history: commentHistory,
            scene: 'moments',
          }),
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try { const data = JSON.parse(line.slice(6)); aiText += data.content || ''; } catch { /* skip */ }
              }
            }
          }
        }
      } catch { /* AI失败用默认 */ }
      if (!aiText) {
        const defaults = hasEmotion 
          ? ['怎么了？跟爸说', '没事吧宝贝？妈在呢', '抱抱~', '别怕，有我们在', '谁欺负你了？']
          : ['哈哈', '说的对！', '嗯嗯', '好呀~', '可不是嘛'];
        aiText = defaults[Math.floor(Math.random() * defaults.length)];
      }
      
      const finalReplier = replier;
      const finalReplyToName = replyToName;
      setMomentsData(prev => prev.map(m => {
        if (m.id !== momentId) return m;
        return { ...m, comments: [...(m.comments || []), { from: finalReplier, text: aiText, replyTo: finalReplyToName }] };
      }));
    }
    
    // 爸妈之间也可能互相回复（60%概率，情绪相关时80%）
    const crossReplyProb = hasEmotion ? 0.8 : 0.6;
    if (Math.random() < crossReplyProb && repliers.length >= 2 && repliers.includes('老爸') && repliers.includes('妈咪')) {
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      const lastReplier = repliers[repliers.length - 1];
      const crossReplier = lastReplier === '老爸' ? '妈咪' : '老爸';
      const crossCharacter = crossReplier === '妈咪' ? 'mom' : 'dad';
      // 获取最新评论链
      const latestMoment = momentsDataRef.current.find(m => m.id === momentId);
      const crossHistory = buildMomentsChatHistory(latestMoment);
      const roleMap2: Record<string, string> = { '老爸': '田雷（爸爸）', '妈咪': '梓渝（妈咪）' };
      const crossRole = roleMap2[crossReplier] || crossReplier;
      const crossTask = `你是${crossRole}。${lastReplier}刚在评论区说了话，请你用一句话简短回复${lastReplier}（20字以内），要像老夫老妻互怼/撒娇的语气`;
      const crossMessage = buildMomentsMessage(crossTask);
      let crossText = '';
      try {
        const crossRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `${crossMessage}\n直接说回复内容不要加引号和前缀`,
            character: crossCharacter,
            speaker: crossCharacter,
            history: crossHistory,
            scene: 'moments',
          }),
        });
        if (crossRes.ok && crossRes.body) {
          const reader = crossRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try { const data = JSON.parse(line.slice(6)); crossText += data.content || ''; } catch { /* skip */ }
              }
            }
          }
        }
      } catch { /* */ }
      if (!crossText) {
        const banterDefaults = ['你说得对', '就是就是', '又来了又来了', '你闭嘴啦', '哼，谁让你说的', '听他的吧'];
        crossText = banterDefaults[Math.floor(Math.random() * banterDefaults.length)];
      }
      const finalCrossReplier = crossReplier;
      const finalLastReplier = lastReplier;
      const finalCrossText = crossText;
      setMomentsData(prev => prev.map(m => {
        if (m.id !== momentId) return m;
        return { ...m, comments: [...(m.comments || []), { from: finalCrossReplier, text: finalCrossText, replyTo: finalLastReplier }] };
      }));
    }
  };

  function renderMoments() {
    const handlePostMoment = () => {
      if (!newMomentText.trim()) return;
      const newMoment: MomentItem = {
        id: nextMomentId.current++,
        avatar: '👧', name: '米米', time: '刚刚', text: newMomentText.trim(), color: '#06b6d4',
        isMine: true, likes: [], comments: [],
      };
      setMomentsData(prev => [newMoment, ...prev]);
      const postContent = newMomentText.trim();
      setNewMomentText('');
      setShowNewMoment(false);

      // 爸妈自动点赞（延迟模拟）
      const momentId = newMoment.id;
      setTimeout(() => {
        setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, likes: [...m.likes, '爸爸'] } : m));
      }, 2000 + Math.random() * 2000);
      setTimeout(() => {
        setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, likes: [...m.likes, '妈咪'] } : m));
      }, 4000 + Math.random() * 3000);

      // 构建评论基础上下文history
      const baseHistory: Array<{role:'user'|'assistant';content:string}> = [
        { role: 'user', content: `[朋友圈] 米米发了：「${postContent}」` }
      ];

      // 爸爸评论（带上下文）
      setTimeout(async () => {
        const dadTask = buildMomentsMessage(`你是田雷（爸爸）。米米在朋友圈发了：「${postContent}」。请你作为爸爸直接评论这条朋友圈。`);
        let dadComment = '';
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `${dadTask}\n请直接说评论内容（20字以内），不要加引号和前缀`, character: 'dad', speaker: 'dad', history: baseHistory, scene: 'moments' }),
          });
          if (res.ok && res.body) {
            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = new TextDecoder().decode(value);
              for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try { dadComment += JSON.parse(line.slice(6)).content || ''; } catch {}
                }
              }
            }
          }
        } catch {}
        dadComment = dadComment.replace(/\n/g, '').trim().slice(0, 80);
        if (!dadComment) dadComment = '不错嘛';

        const finalDadComment = dadComment;
        setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...m.comments, { from: '爸爸', text: finalDadComment }] } : m));

        // 妈咪回复爸爸的评论（60%概率）
        if (Math.random() > 0.4) {
          setTimeout(async () => {
            const momHistory = [...baseHistory, { role: 'assistant', content: `爸爸：${finalDadComment}` }];
            const momTask = buildMomentsMessage(`你是梓渝（妈咪）。米米发了朋友圈「${postContent}」，爸爸评论了「${finalDadComment}」。请你作为妈咪回复爸爸的评论。`);
            let momReply = '';
            try {
              const res2 = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `${momTask}\n请直接说回复内容（20字以内），不要加引号和前缀`, character: 'mom', speaker: 'mom', history: momHistory, scene: 'moments' }),
              });
              if (res2.ok && res2.body) {
                const reader2 = res2.body.getReader();
                while (true) {
                  const { done, value } = await reader2.read();
                  if (done) break;
                  const chunk2 = new TextDecoder().decode(value);
                  for (const line2 of chunk2.split('\n')) {
                    if (line2.startsWith('data: ') && line2 !== 'data: [DONE]') {
                      try { momReply += JSON.parse(line2.slice(6)).content || ''; } catch {}
                    }
                  }
                }
              }
            } catch {}
            momReply = momReply.replace(/\n/g, '').trim().slice(0, 80);
            if (!momReply) momReply = '哼~';
            const finalMomReply = momReply;
            setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...m.comments, { from: '妈咪', text: finalMomReply, replyTo: '爸爸' }] } : m));
          }, 2000 + Math.random() * 2000);
        }
      }, 3000 + Math.random() * 2000);

      // 妈咪评论（带上下文，延迟更久以避免跟上面重叠）
      setTimeout(async () => {
        // 用ref获取最新评论链（可能爸爸已经评论了）
        const currentMoment = momentsDataRef.current.find(m => m.id === momentId);
        const momHistory = buildMomentsChatHistory(currentMoment);
        const momTask = buildMomentsMessage(`你是梓渝（妈咪）。米米在朋友圈发了：「${postContent}」。请你作为妈咪直接评论这条朋友圈。`);
        let momComment = '';
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `${momTask}\n请直接说评论内容（20字以内），不要加引号和前缀`, character: 'mom', speaker: 'mom', history: momHistory, scene: 'moments' }),
          });
          if (res.ok && res.body) {
            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = new TextDecoder().decode(value);
              for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try { momComment += JSON.parse(line.slice(6)).content || ''; } catch {}
                }
              }
            }
          }
        } catch {}
        momComment = momComment.replace(/\n/g, '').trim().slice(0, 80);
        if (!momComment) momComment = '好看~';
        const finalMomComment = momComment;
        setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...m.comments, { from: '妈咪', text: finalMomComment }] } : m));

        // 爸爸回复妈咪的评论（60%概率）
        if (Math.random() > 0.4) {
          setTimeout(async () => {
            const dadHistory2 = [...(buildMomentsChatHistory(momentsDataRef.current.find(m => m.id === momentId))), { role: 'assistant', content: `妈咪：${finalMomComment}` }];
            const dadTask2 = buildMomentsMessage(`你是田雷（爸爸）。妈咪评论了「${finalMomComment}」。请你作为爸爸回复妈咪。`);
            let dadReply = '';
            try {
              const res2 = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `${dadTask2}\n请直接说回复内容（20字以内），不要加引号和前缀`, character: 'dad', speaker: 'dad', history: dadHistory2, scene: 'moments' }),
              });
              if (res2.ok && res2.body) {
                const reader2 = res2.body.getReader();
                while (true) {
                  const { done, value } = await reader2.read();
                  if (done) break;
                  const chunk2 = new TextDecoder().decode(value);
                  for (const line2 of chunk2.split('\n')) {
                    if (line2.startsWith('data: ') && line2 !== 'data: [DONE]') {
                      try { dadReply += JSON.parse(line2.slice(6)).content || ''; } catch {}
                    }
                  }
                }
              }
            } catch {}
            dadReply = dadReply.replace(/\n/g, '').trim().slice(0, 80);
            if (!dadReply) dadReply = '哈哈';
            const finalDadReply = dadReply;
            setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...m.comments, { from: '爸爸', text: finalDadReply, replyTo: '妈咪' }] } : m));
          }, 2000 + Math.random() * 2000);
        }
      }, 5500 + Math.random() * 2000);

      // 宠物随机点赞
      if (Math.random() > 0.4) {
        setTimeout(() => {
          setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, likes: [...m.likes, '辛巴🐕'] } : m));
        }, 6000 + Math.random() * 2000);
      }
      if (Math.random() > 0.5) {
        setTimeout(() => {
          setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, likes: [...m.likes, '小十一🐱'] } : m));
        }, 7000 + Math.random() * 3000);
      }
    };

    return (
      <div className="feed-list">
        <div style={{ padding: '12px 16px' }}>
          <div
            className="glass-btn"
            style={{ width: '100%', padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 500 }}
            onClick={() => setShowNewMoment(!showNewMoment)}
          >
            ✏️ 发朋友圈
          </div>
          {showNewMoment && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <input
                value={newMomentText}
                onChange={e => setNewMomentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handlePostMoment(); }}
                placeholder="分享你的心情..."
                autoFocus
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.5)', fontSize: 13, outline: 'none' }}
              />
              <button onClick={handlePostMoment} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#06b6d4', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>发布</button>
            </div>
          )}
        </div>

        {momentsData.map((item) => {
          const iLiked = item.likes.includes('米米');
          return (
            <div key={item.id} className="feed-card">
              <div className="feed-header">
                <div className="feed-avatar" style={{ background: item.color + '20' }}>{item.avatar}</div>
                <div><div className="feed-name" style={{ color: item.color }}>{item.name}</div><div className="feed-time">{item.time}</div></div>
              </div>
              <div className="feed-text">{item.text}</div>
              {item.likes.length > 0 && (
                <div className="feed-likes">❤️ {item.likes.join('、')}</div>
              )}
              {item.comments.length > 0 && (
                <div className="feed-comments">
                  {item.comments.map((c, ci) => (
                    <div key={ci} className="feed-comment" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span>
                        <b style={{ color: c.from === '米米' ? '#06b6d4' : c.from === '爸爸' ? '#f59e0b' : c.from === '妈咪' ? '#ec4899' : '#666' }}>{c.from}</b>
                        {c.replyTo && <span style={{color:'#999'}}> 回复 </span>}
                        {c.replyTo && <b style={{ color: c.replyTo === '米米' ? '#06b6d4' : c.replyTo === '爸爸' ? '#f59e0b' : c.replyTo === '妈咪' ? '#ec4899' : '#666' }}>{c.replyTo}</b>}
                        ：{c.text}
                      </span>
                      <span style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <span style={{ color:'#999', fontSize:'10px', cursor:'pointer' }} onClick={() => { setActiveCommentIdx(item.id); setReplyTo({momentId:item.id, commentFrom:c.from}); setCommentInput(''); }}>回复</span>
                        {c.from === '米米' && (
                          <span style={{ color:'#ef4444', fontSize:'10px', cursor:'pointer' }} onClick={() => setMomentsData(prev => prev.map(m => m.id === item.id ? { ...m, comments: m.comments.filter((_, idx) => idx !== ci) } : m))}>删除</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="feed-actions">
                <span
                  className={`feed-action ${iLiked ? 'feed-action-liked' : ''}`}
                  onClick={() => setMomentsData(prev => prev.map(m => m.id === item.id ? { ...m, likes: iLiked ? m.likes.filter(n => n !== '米米') : [...m.likes, '米米'] } : m))}
                >
                  {iLiked ? '❤️ 已赞' : '🤍 赞'} {item.likes.length > 0 ? item.likes.length : ''}
                </span>
                <span
                  className="feed-action"
                  onClick={() => { setActiveCommentIdx(activeCommentIdx === item.id ? null : item.id); setCommentInput(''); }}
                >
                  💬 评论
                </span>
                {item.isMine && (
                  <span
                    className="feed-action"
                    style={{ color: '#ef4444' }}
                    onClick={() => setMomentsData(prev => prev.filter(m => m.id !== item.id))}
                  >
                    🗑️ 删除
                  </span>
                )}
              </div>
              {activeCommentIdx === item.id && (
                <div className="feed-comment-input">
                  <input
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && commentInput.trim()) {
                        const txt = commentInput.trim();
                        const rp = replyTo?.momentId === item.id ? replyTo.commentFrom : undefined;
                        setMomentsData(prev => prev.map(m => m.id === item.id ? { ...m, comments: [...m.comments, { from: '米米', replyTo: rp, text: txt }] } : m));
                        setCommentInput('');
                        setReplyTo(null);
                        setTimeout(() => autoReplyToComment(item.id, txt, '米米'), 2000 + Math.random() * 4000);
                      }
                    }}
                    placeholder={replyTo?.momentId === item.id ? `回复 ${replyTo.commentFrom}...` : '写评论...'}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (commentInput.trim()) {
                        const txt = commentInput.trim();
                        const rp = replyTo?.momentId === item.id ? replyTo.commentFrom : undefined;
                        setMomentsData(prev => prev.map(m => m.id === item.id ? { ...m, comments: [...m.comments, { from: '米米', replyTo: rp, text: txt }] } : m));
                        setCommentInput('');
                        setReplyTo(null);
                        setTimeout(() => autoReplyToComment(item.id, txt, '米米'), 2000 + Math.random() * 4000);
                      }
                    }}
                  >发送</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderWeibo() {
    const formatCount = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n >= 1000 ? (n / 1000).toFixed(1) + '千' : String(n);
    const formatHeat = (n: number) => n >= 100000000 ? (n / 100000000).toFixed(1) + '亿' : n >= 10000 ? (n / 10000).toFixed(0) + '万' : String(n);

    const toggleWeiboLike = (id: number) => {
      setWeiboData(prev => prev.map(p => p.id === id ? { ...p, iLiked: !p.iLiked, likes: p.iLiked ? p.likes - 1 : p.likes + 1 } : p));
      const post = weiboData.find(p => p.id === id);
      if (post?.topic) bumpHotSearch(post.topic);
    };

    const addWeiboComment = (id: number) => {
      if (!weiboCommentInput.trim()) return;
      const newComment: WeiboComment = {
        id: weiboNextId.current++,
        from: weiboAccount.nickname,
        avatar: weiboAccount.avatar,
        text: weiboCommentInput.trim(),
        time: '刚刚',
        likes: 0,
        iLiked: false,
      };
      setWeiboData(prev => prev.map(p => p.id === id ? { ...p, comments: [...p.comments, newComment] } : p));
      setWeiboCommentInput('');
      // 评论影响热搜
      const post = weiboData.find(p => p.id === id);
      if (post?.topic) bumpHotSearch(post.topic);
    };

    const handlePostWeibo = () => {
      if (!weiboPostText.trim()) return;
      // 发图消耗Token
      if (weiboPostImages.length > 0) {
        const cost = weiboPostImages.length * tokenPricing.postImage;
        if (!consumeToken(cost, `发${weiboPostImages.length}张图片`)) return;
      }
      // 话题关联热搜热度增加3-8万
      if (weiboPostTopic) {
        const boost = Math.floor(Math.random() * 50000 + 30000);
        setWeiboHotSearch(prev => {
          const updated = prev.map(item => {
            if (item.title.includes(weiboPostTopic) || weiboPostTopic.includes(item.title)) {
              return { ...item, heat: item.heat + boost };
            }
            return item;
          });
          updated.sort((a, b) => b.heat - a.heat);
          return updated.map((item, i) => ({ ...item, id: i + 1 }));
        });
      }
      const newPost: WeiboPost = {
        id: weiboNextId.current++,
        avatar: weiboAccount.avatar,
        name: weiboAccount.nickname,
        time: '刚刚',
        text: weiboPostText.trim() + (weiboPostTopic ? ` #${weiboPostTopic}#` : ''),
        color: '#06b6d4',
        likes: 0,
        iLiked: false,
        comments: [],
        reposts: 0,
        images: weiboPostImages.length > 0 ? [...weiboPostImages] : undefined,
        topic: weiboPostTopic || undefined,
        expandedComments: false,
        commentsLoaded: true,
      };
      setWeiboData(prev => [newPost, ...prev]);
      setWeiboPostText('');
      setWeiboPostImages([]);
      setWeiboPostTopic('');
      setShowWeiboPost(false);
    };

    const toggleFollow = (name: string) => {
      setWeiboFollowing(prev =>
        prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
      );
    };

    const toggleCommentLike = (postId: number, commentId: number) => {
      setWeiboData(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: p.comments.map(c => c.id === commentId ? { ...c, iLiked: !c.iLiked, likes: c.iLiked ? c.likes - 1 : c.likes + 1 } : c)
      } : p));
    };

    const expandComments = (post: WeiboPost) => {
      if (!post.expandedComments) {
        setWeiboData(prev => prev.map(p => p.id === post.id ? { ...p, expandedComments: true } : p));
        if (!post.commentsLoaded) generateWeiboComments(post);
      } else {
        setWeiboData(prev => prev.map(p => p.id === post.id ? { ...p, expandedComments: false } : p));
      }
    };

    const saveWeiboProfile = () => {
      if (!weiboProfileNick.trim()) return;
      setWeiboAccount({ nickname: weiboProfileNick.trim(), avatar: weiboProfileAvatar, bio: weiboProfileBio.trim(), isSet: true });
      setShowWeiboProfileEdit(false);
    };

    const availableAvatars = ['😎', '🦊', '🐱', '🐶', '🐰', '🦋', '🌸', '⭐', '🎨', '🎭', '🦄', '🐧'];

    // 微博导航栏
    const weiboNavBar = (
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>微博</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowWeiboPost(true)}>✏️</span>
            <span style={{ cursor: 'pointer', fontSize: 18 }}>🔍</span>
          </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          {(['home', 'discover', 'messages', 'me'] as const).map(tab => {
            const labels = { home: '首页', discover: '发现', messages: '消息', me: '我的' };
            const icons = { home: '🏠', discover: '🔍', messages: '💬', me: '👤' };
            return (
              <div key={tab} onClick={() => setWeiboTab(tab)}
                style={{ flex: 1, textAlign: 'center', padding: '6px 0', cursor: 'pointer', fontSize: 12, fontWeight: weiboTab === tab ? 600 : 400, color: weiboTab === tab ? '#f59e0b' : '#999', borderBottom: weiboTab === tab ? '2px solid #f59e0b' : '2px solid transparent', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 16 }}>{icons[tab]}</div>
                <div>{labels[tab]}</div>
              </div>
            );
          })}
        </div>
      </div>
    );

    // 热搜榜组件
    const renderHotSearch = () => (
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>🔥 微博热搜</span>
          <span style={{ fontSize: 10, color: '#999' }}>实时更新</span>
        </div>
        {weiboHotSearch.map((item, idx) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 4px', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
            onClick={() => {
              bumpHotSearch(item.title);
              setWeiboPostTopic(item.title);
              setShowWeiboPost(true);
            }}>
            <span style={{ width: 20, fontSize: 13, fontWeight: 700, color: idx < 3 ? '#ef4444' : '#999', flexShrink: 0 }}>{idx + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
                {item.tag && <span style={{ marginLeft: 4, fontSize: 9, background: item.tagColor || '#f97316', color: '#fff', padding: '0 4px', borderRadius: 3, verticalAlign: 'middle' }}>{item.tag}</span>}
              </div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{formatHeat(item.heat)}</div>
            </div>
          </div>
        ))}
      </div>
    );

    // 微博卡片
    const renderWeiboCard = (item: WeiboPost) => {
      const isOwn = item.name === weiboAccount.nickname;
      const isFollowed = weiboFollowing.includes(item.name);
      return (
      <div key={item.id} style={{ padding: '12px 16px', borderBottom: '4px solid #f5f5f5', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: item.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.name}</span>
              {item.verified && <span style={{ fontSize: 9, background: item.color, color: '#fff', padding: '0 4px', borderRadius: 3 }}>V</span>}
              {item.tag && <span style={{ fontSize: 9, color: '#999', background: '#f3f4f6', padding: '0 4px', borderRadius: 3 }}>{item.tag}</span>}
            </div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{item.time}</div>
          </div>
          {!isOwn && (
            <button onClick={() => toggleFollow(item.name)}
              style={{ fontSize: 10, padding: '4px 10px', borderRadius: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                ...(isFollowed
                  ? { background: '#f3f4f6', color: '#999', border: '1px solid #e5e7eb' }
                  : { background: '#fef3c7', color: '#f59e0b', border: '1px solid #f59e0b' })
              }}>{isFollowed ? '已关注' : '+ 关注'}</button>
          )}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#333', marginTop: 8, wordBreak: 'break-word' }}>{item.text}</div>
        {/* 图片区 */}
        {item.images && item.images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: item.images.length === 1 ? '1fr' : 'repeat(3, 1fr)', gap: 4, marginTop: 8 }}>
            {item.images.map((img, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🖼️</div>
            ))}
          </div>
        )}
        {/* 评论区 - 展开时显示 */}
        {item.expandedComments && item.comments.length > 0 && (
          <div style={{ marginTop: 10, background: '#f8f8f8', borderRadius: 8, padding: '8px 10px' }}>
            {item.comments.slice(0, 20).map((c) => (
              <div key={c.id} style={{ fontSize: 11, lineHeight: 1.7, padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{c.avatar}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: item.color, fontWeight: 600, fontSize: 11 }}>{c.from}</span>
                  {c.replyTo && <span style={{ color: '#999', fontSize: 10 }}> 回复 @{c.replyTo}</span>}
                  <span style={{ color: '#333' }}>：{c.text}</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 9, color: '#999' }}>{c.time}</span>
                    <span style={{ fontSize: 9, color: '#999', cursor: 'pointer' }} onClick={() => toggleCommentLike(item.id, c.id)}>
                      {c.iLiked ? '❤️' : '🤍'} {c.likes > 0 ? c.likes : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {item.comments.length > 20 && <div style={{ fontSize: 10, color: '#999', textAlign: 'center', padding: 4 }}>还有更多评论...</div>}
          </div>
        )}
        {/* 评论输入框 */}
        {activeWeiboComment === item.id && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input value={weiboCommentInput} onChange={e => setWeiboCommentInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWeiboComment(item.id)}
              placeholder="写评论..." style={{ flex: 1, fontSize: 11, padding: '6px 10px', borderRadius: 16, border: '1px solid #e5e7eb', outline: 'none', background: '#f8f8f8' }} />
            <button onClick={() => addWeiboComment(item.id)} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 16, background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 600 }}>发送</button>
          </div>
        )}
        {/* 操作栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <span style={{ cursor: 'pointer', fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 20, transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            🔁 {formatCount(item.reposts)}
          </span>
          <span style={{ cursor: 'pointer', fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 20, transition: 'background 0.2s' }}
            onClick={() => {
              expandComments(item);
              setActiveWeiboComment(activeWeiboComment === item.id ? null : item.id);
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            💬 {item.comments.length > 0 ? formatCount(item.comments.length) : '评论'}
          </span>
          <span style={{ cursor: 'pointer', fontSize: 12, color: item.iLiked ? '#ef4444' : '#999', display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 20, transition: 'background 0.2s' }}
            onClick={() => toggleWeiboLike(item.id)}
            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {item.iLiked ? '❤️' : '🤍'} {formatCount(item.likes)}
          </span>
        </div>
      </div>
      );
    };

    // 发微博弹窗
    const renderPostModal = () => showWeiboPost && (
      <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
        onClick={() => setShowWeiboPost(false)}>
        <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '70%', overflow: 'auto' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>发微博</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {weiboPostImages.length > 0 && <span style={{ fontSize: 10, color: '#8b5cf6' }}>💎 -{weiboPostImages.length * tokenPricing.postImage}</span>}
              <button onClick={handlePostWeibo} style={{ fontSize: 12, padding: '6px 16px', borderRadius: 16, background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 600 }}>发布</button>
            </div>
          </div>
          <textarea value={weiboPostText} onChange={e => setWeiboPostText(e.target.value)}
            placeholder="分享新鲜事..." rows={4}
            style={{ width: '100%', fontSize: 14, border: 'none', outline: 'none', resize: 'none', lineHeight: 1.6, background: '#f8f8f8', borderRadius: 12, padding: 12 }} />
          {/* 话题选择 */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>关联热搜话题：</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {weiboHotSearch.slice(0, 5).map(h => (
                <span key={h.id} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: weiboPostTopic === h.title ? '#fef3c7' : '#f3f4f6', color: weiboPostTopic === h.title ? '#f59e0b' : '#666', cursor: 'pointer', fontWeight: weiboPostTopic === h.title ? 600 : 400, border: weiboPostTopic === h.title ? '1px solid #f59e0b' : '1px solid transparent' }}
                  onClick={() => setWeiboPostTopic(weiboPostTopic === h.title ? '' : h.title)}>
                  #{h.title}
                </span>
              ))}
            </div>
          </div>
          {/* 图片区 */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {weiboPostImages.map((img, i) => (
                <div key={i} style={{ width: 56, height: 56, borderRadius: 8, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, position: 'relative' }}>
                  🖼️
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => setWeiboPostImages(prev => prev.filter((_, idx) => idx !== i))}>×</span>
                </div>
              ))}
              {weiboPostImages.length < 9 && (
                <div style={{ width: 56, height: 56, borderRadius: 8, border: '2px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#999', cursor: 'pointer' }}
                  onClick={() => setWeiboPostImages(prev => [...prev, `img-${Date.now()}`])}>+</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    // 账号编辑弹窗
    const renderProfileEdit = () => showWeiboProfileEdit && (
      <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
        onClick={() => setShowWeiboProfileEdit(false)}>
        <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '70%' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>编辑资料</span>
            <button onClick={saveWeiboProfile} style={{ fontSize: 12, padding: '6px 16px', borderRadius: 16, background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 600 }}>保存</button>
          </div>
          {/* 头像选择 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>选择头像</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {availableAvatars.map(a => (
                <span key={a} style={{ width: 36, height: 36, borderRadius: '50%', background: weiboProfileAvatar === a ? '#fef3c7' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', border: weiboProfileAvatar === a ? '2px solid #f59e0b' : '2px solid transparent', transition: 'all 0.2s' }}
                  onClick={() => setWeiboProfileAvatar(a)}>{a}</span>
              ))}
            </div>
          </div>
          {/* 昵称 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>昵称</div>
            <input value={weiboProfileNick} onChange={e => setWeiboProfileNick(e.target.value)}
              placeholder="给自己取个名字吧" maxLength={12}
              style={{ width: '100%', fontSize: 13, padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', outline: 'none', background: '#f8f8f8' }} />
          </div>
          {/* 简介 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>简介</div>
            <input value={weiboProfileBio} onChange={e => setWeiboProfileBio(e.target.value)}
              placeholder="一句话介绍自己" maxLength={30}
              style={{ width: '100%', fontSize: 13, padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', outline: 'none', background: '#f8f8f8' }} />
          </div>
        </div>
      </div>
    );

    // 首页Tab内容
    const renderWeiboHome = () => (
      <div>
        {/* 推荐关注横条 */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: 8, overflowX: 'auto', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          {[
            { emoji: '👨', name: '田栩宁_', color: '#f59e0b' },
            { emoji: '👩', name: '我是梓渝_', color: '#ec4899' },
            { emoji: '🔥', name: 'CP超话', color: '#ef4444' },
          ].map(u => {
            const followed = weiboFollowing.includes(u.name);
            return (
              <div key={u.name} onClick={() => toggleFollow(u.name)}
                style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: followed ? 'rgba(34,197,94,0.12)' : `${u.color}18`, fontSize: 11, fontWeight: 600, color: followed ? '#22c55e' : u.color, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.2s' }}>
                {u.emoji} {u.name} {u.name !== 'CP超话' && <span style={{ fontSize: 9, background: u.color, color: '#fff', padding: '0 3px', borderRadius: 3 }}>V</span>}
                {followed && <span style={{ fontSize: 9 }}>✓</span>}
              </div>
            );
          })}
        </div>
        {/* 微博时间线 */}
        {weiboData.map(item => renderWeiboCard(item))}
      </div>
    );

    // 发现Tab内容
    const renderWeiboDiscover = () => (
      <div>
        {renderHotSearch()}
        {/* 推荐用户 */}
        <div style={{ padding: '12px 16px', borderTop: '4px solid #f5f5f5' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 10 }}>推荐关注</div>
          {[
            { avatar: '👨', name: '田栩宁_', tag: '演员', color: '#f59e0b', fans: '386万' },
            { avatar: '👩', name: '我是梓渝_', tag: '歌手', color: '#ec4899', fans: '295万' },
            { avatar: '🔥', name: 'CP超话', tag: '超话', color: '#ef4444', fans: '128万' },
            { avatar: '📢', name: '娱乐热搜', tag: '媒体', color: '#f97316', fans: '89万' },
          ].map(u => {
            const isFollowed = weiboFollowing.includes(u.name);
            return (
              <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{u.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: u.color }}>{u.name} <span style={{ fontSize: 9, background: u.color, color: '#fff', padding: '0 3px', borderRadius: 3 }}>V</span></div>
                  <div style={{ fontSize: 10, color: '#999' }}>{u.tag} · {u.fans}粉丝</div>
                </div>
                <button onClick={() => toggleFollow(u.name)}
                  style={{ fontSize: 10, padding: '4px 12px', borderRadius: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    ...(isFollowed
                      ? { background: '#f3f4f6', color: '#999', border: '1px solid #e5e7eb' }
                      : { background: '#fef3c7', color: '#f59e0b', border: '1px solid #f59e0b' })
                  }}>{isFollowed ? '已关注' : '+ 关注'}</button>
              </div>
            );
          })}
        </div>
      </div>
    );

    // 消息Tab（含CP私聊系统）
    const renderWeiboMessages = () => (
      <div style={{ padding: 16 }}>
        {/* CP私聊入口 */}
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(236,72,153,0.1))', borderRadius: 14, padding: 16, marginBottom: 12, cursor: 'pointer' }}
          onClick={() => {
            if (cpChatRevealed) return;
            if (consumeToken(tokenPricing.viewPrivateChat, '查看CP私聊')) {
              setCpChatRevealed(true);
            } else {
              setShowCpChatPaywall(true);
            }
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginRight: -8, zIndex: 1 }}>👨</div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👩</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>💖 CP私聊</div>
              <div style={{ fontSize: 10, color: '#999' }}>田栩宁 & 梓渝的甜蜜对话</div>
            </div>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>
              {cpChatRevealed ? '🔓 已解锁' : `🔒 ${tokenPricing.viewPrivateChat} Token`}
            </div>
          </div>
        </div>
        {/* CP私聊内容 */}
        {cpChatRevealed && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 8, textAlign: 'center' }}>💕 今日CP私聊记录 💕</div>
            {cpChatMessages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.from === 'A' ? 'rgba(245,158,11,0.15)' : 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {msg.from === 'A' ? '👨' : '👩'}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: msg.from === 'A' ? '#f59e0b' : '#ec4899', fontWeight: 600 }}>{msg.from === 'A' ? '田栩宁' : '梓渝'} <span style={{ color: '#ccc', fontWeight: 400 }}>{msg.time}</span></div>
                  <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5, background: msg.from === 'A' ? 'rgba(245,158,11,0.06)' : 'rgba(236,72,153,0.06)', padding: '6px 10px', borderRadius: 10, marginTop: 2 }}>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Token充值提示 */}
        {showCpChatPaywall && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💎</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Token 不足</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>查看CP私聊需要 {tokenPricing.viewPrivateChat} Token</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>当前余额：{tokenBalance} Token</div>
            <button onClick={() => setShowCpChatPaywall(false)}
              style={{ marginTop: 10, padding: '6px 20px', borderRadius: 10, background: '#8b5cf6', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>知道了</button>
          </div>
        )}
        {/* 普通消息 */}
        <div style={{ textAlign: 'center', color: '#ccc', fontSize: 11, marginTop: 20 }}>
          暂无其他消息
        </div>
      </div>
    );

    // 我的Tab
    const renderWeiboMe = () => (
      <div>
        <div style={{ padding: '20px 16px', background: 'linear-gradient(180deg, #fef3c7 0%, #fff 100%)', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>{weiboAccount.avatar}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#333', marginTop: 8 }}>{weiboAccount.nickname}</div>
          {weiboAccount.bio && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{weiboAccount.bio}</div>}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '2px 10px', borderRadius: 10, background: 'rgba(139,92,246,0.1)', fontSize: 10, color: '#8b5cf6', fontWeight: 600 }}>
            Lv.{userLevel} · 💎 {tokenBalance} Token
          </div>
          {!weiboAccount.isSet && <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>✨ 点击编辑资料设置昵称</div>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{weiboData.filter(p => p.name === weiboAccount.nickname).length}</div><div style={{ fontSize: 10, color: '#999' }}>微博</div></div>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{weiboFollowing.length}</div><div style={{ fontSize: 10, color: '#999' }}>关注</div></div>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>0</div><div style={{ fontSize: 10, color: '#999' }}>粉丝</div></div>
          </div>
          <button onClick={() => { setWeiboProfileNick(weiboAccount.nickname === '游客用户' ? '' : weiboAccount.nickname); setWeiboProfileAvatar(weiboAccount.avatar); setWeiboProfileBio(weiboAccount.bio); setShowWeiboProfileEdit(true); }}
            style={{ marginTop: 10, fontSize: 11, padding: '5px 20px', borderRadius: 16, background: '#fff', color: '#f59e0b', border: '1px solid #f59e0b', fontWeight: 600, cursor: 'pointer' }}>
            编辑资料
          </button>
        </div>
        {/* Token消耗记录 */}
        <div style={{ margin: '0 16px', padding: 12, borderRadius: 12, background: 'rgba(139,92,246,0.06)', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', marginBottom: 4 }}>💎 Token 明细</div>
          <div style={{ fontSize: 10, color: '#999', lineHeight: 1.6 }}>
            余额：{tokenBalance} Token<br/>
            发图消耗：{tokenPricing.postImage} Token/张<br/>
            查看私聊：{tokenPricing.viewPrivateChat} Token/次<br/>
            AI对话：{tokenPricing.aiChat} Token/次
          </div>
        </div>
        {/* 我的微博列表 */}
        <div>
          {weiboData.filter(p => p.name === weiboAccount.nickname).length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#999', fontSize: 12 }}>还没有发过微博，去首页发一条吧！</div>
          ) : (
            weiboData.filter(p => p.name === weiboAccount.nickname).map(item => renderWeiboCard(item))
          )}
        </div>
      </div>
    );

    return (
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {weiboNavBar}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {weiboTab === 'home' && renderWeiboHome()}
          {weiboTab === 'discover' && renderWeiboDiscover()}
          {weiboTab === 'messages' && renderWeiboMessages()}
          {weiboTab === 'me' && renderWeiboMe()}
        </div>
        {renderPostModal()}
        {renderProfileEdit()}
      </div>
    );
  }

  function renderHome() {
    const rooms = [
      { icon: '🛋️', name: '客厅', status: '小十一在沙发上打盹' },
      { icon: '🛏️', name: '卧室', status: '辛巴守在门口' },
      { icon: '🍳', name: '厨房', status: '空无一人' },
      { icon: '🌿', name: '阳台', status: '大鱼在晒太阳' },
      { icon: '📚', name: '书房', status: '爸爸在工作' },
      { icon: '🚿', name: '浴室', status: '空闲' },
    ];
    return (
      <div className="scene-page">
        <div className="scene-room-grid">
          {rooms.map((r, i) => (
            <div key={i} className="scene-room">
              <div className="scene-room-icon">{r.icon}</div>
              <div className="scene-room-name">{r.name}</div>
              <div className="scene-room-status">{r.status}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderPet() {
    const pets = [
      { emoji: '🐕', name: '辛巴', type: '中华田园犬', hunger: 90, mood: 85, energy: 70 },
      { emoji: '🐱', name: '大鱼', type: '豹猫', hunger: 85, mood: 70, energy: 55 },
      { emoji: '🐱', name: '小十一', type: '阿比西尼亚猫', hunger: 65, mood: 80, energy: 40 },
    ];
    return (
      <div className="pet-page">
        {pets.map((p, i) => (
          <div key={i} className="pet-card">
            <div className="pet-avatar">{p.emoji}</div>
            <div className="pet-info">
              <div className="pet-name">{p.name} · {p.type}</div>
              <div className="pet-stat"><span className="pet-stat-label">饱腹</span><div className="pet-stat-bar"><div className="pet-stat-fill" style={{ width: p.hunger + '%', background: '#22c55e' }}></div></div><span className="pet-stat-val">{p.hunger}</span></div>
              <div className="pet-stat"><span className="pet-stat-label">心情</span><div className="pet-stat-bar"><div className="pet-stat-fill" style={{ width: p.mood + '%', background: '#f59e0b' }}></div></div><span className="pet-stat-val">{p.mood}</span></div>
              <div className="pet-stat"><span className="pet-stat-label">能量</span><div className="pet-stat-bar"><div className="pet-stat-fill" style={{ width: p.energy + '%', background: '#3b82f6' }}></div></div><span className="pet-stat-val">{p.energy}</span></div>
            </div>
          </div>
        ))}
        <div className="pet-actions">
          <button className="pet-btn">🦴 喂食</button>
          <button className="pet-btn">🎾 玩耍</button>
          <button className="pet-btn">💤 休息</button>
        </div>
      </div>
    );
  }

  function renderDressUp() {
    const items = ['👗', '👘', '👚', '👔', '🎩', '🎀', '💍', '👟'];
    return (
      <div className="dress-page">
        <div className="dress-preview">🧍‍♀️</div>
        <div className="dress-tabs">
          <button className="dress-tab active">衣服</button>
          <button className="dress-tab">头饰</button>
          <button className="dress-tab">配饰</button>
          <button className="dress-tab">道具</button>
        </div>
        <div className="dress-grid">
          {items.map((item, i) => (
            <div key={i} className={`dress-item${i === 0 ? ' equipped' : ''}`}>{item}</div>
          ))}
        </div>
      </div>
    );
  }

  function renderMe() {
    // 解锁动画
    if (unlockAnimActive) {
      return (
        <div className="unlock-animation">
          <div className="unlock-crack"></div>
          <div className="unlock-rainbow"></div>
          <div className="unlock-heartbeat">💗</div>
          <div className="unlock-text">身份已解锁</div>
          <div className="unlock-subtext">欢迎回家</div>
        </div>
      );
    }

    // === 身份问答页 ===
    if (meSubPage === 'identity') {
      const totalSteps = IDENTITY_QUESTIONS.length;
      const q = IDENTITY_QUESTIONS[identityStep];
      if (identityStep >= totalSteps) {
        return (
          <div className="identity-page">
            <div style={{ textAlign: 'center', padding: '30px 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>自传完成！</div>
              <div style={{ fontSize: 12, color: '#78350f', marginBottom: 20 }}>他们会更懂你了</div>
              <button className="identity-btn" onClick={() => { setMeSubPage('main'); setIdentityStep(0); }}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)', border: 'none', color: '#fff', borderRadius: 20, padding: '10px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                完成
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="identity-page">
          <div style={{ padding: '20px 16px 0' }}>
            <div style={{ fontSize: 11, color: '#a16207', marginBottom: 4 }}>{identityStep + 1} / {totalSteps}</div>
            <div style={{ height: 4, borderRadius: 2, background: '#fde68a', marginBottom: 16 }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #f59e0b, #ec4899)', width: `${((identityStep + 1) / totalSteps) * 100}%`, transition: 'width 0.3s' }}></div>
            </div>
          </div>
          <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#92400e', marginBottom: 4, textAlign: 'center' }}>{q.question}</div>
            <div style={{ fontSize: 11, color: '#a16207', marginBottom: 16, textAlign: 'center' }}>💡 {q.aiUsage}</div>
            <input className="identity-input" placeholder={q.placeholder} maxLength={20}
              value={identityInput || unlockState.userIdentity[q.key]}
              onChange={e => setIdentityInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = identityInput.trim();
                  setUnlockState(prev => ({
                    ...prev,
                    userIdentity: { ...prev.userIdentity, [q.key]: val },
                  }));
                  setIdentityInput('');
                  setIdentityStep(prev => prev + 1);
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="identity-btn" onClick={() => {
                const val = identityInput.trim();
                setUnlockState(prev => ({
                  ...prev,
                  userIdentity: { ...prev.userIdentity, [q.key]: val },
                }));
                setIdentityInput('');
                setIdentityStep(prev => prev + 1);
              }} style={{ flex: 1 }}>
                {identityInput.trim() ? '下一题 →' : '跳过'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // === 暗号解锁页 ===
    if (meSubPage === 'unlock') {
      return (
        <div className="unlock-page">
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#92400e', marginBottom: 4, textAlign: 'center' }}>🔓 暗号解锁</div>
            <div style={{ fontSize: 12, color: '#a16207', marginBottom: 20, textAlign: 'center' }}>叫出真名，解锁全部功能</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#78350f', display: 'block', marginBottom: 4 }}>👨 {unlockState.unlocked ? '爸爸1的真名' : '大A的真名'}</label>
              <input className="unlock-input" placeholder="输入名字..." maxLength={20}
                value={unlockState.unlocked ? '田雷' : unlockInput1}
                onChange={e => setUnlockInput1(e.target.value)}
                disabled={unlockState.unlocked}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#78350f', display: 'block', marginBottom: 4 }}>👩 {unlockState.unlocked ? '爸爸2的真名' : '小B的真名'}</label>
              <input className="unlock-input" placeholder="输入名字..." maxLength={20}
                value={unlockState.unlocked ? '郑朋' : unlockInput2}
                onChange={e => setUnlockInput2(e.target.value)}
                disabled={unlockState.unlocked}
              />
            </div>

            {!unlockState.unlocked && (
              <button className="unlock-btn" onClick={() => {
                if (checkUnlock(unlockInput1, unlockInput2)) {
                  setUnlockAnimActive(true);
                  setTimeout(() => {
                    setUnlockState(prev => ({
                      ...prev,
                      unlocked: true,
                      dad1Name: '田雷',
                      dad2Name: '郑朋',
                    }));
                    setUnlockAnimActive(false);
                    setMeSubPage('main');
                  }, 2500);
                }
              }}
              style={{ width: '100%', marginTop: 8 }}>
                ✨ 解锁
              </button>
            )}

            {/* 管理员快捷解锁 */}
            {!unlockState.unlocked && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #d6d3d1' }}>
                <div style={{ fontSize: 11, color: '#a8a29e', textAlign: 'center', marginBottom: 8 }}>管理员入口</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="unlock-input" placeholder="管理员密码" maxLength={20}
                    value={adminInput} onChange={e => setAdminInput(e.target.value)}
                    style={{ flex: 1 }} type="password"
                  />
                  <button className="unlock-btn" onClick={() => {
                    if (isAdminPassword(adminInput)) {
                      setUnlockAnimActive(true);
                      setTimeout(() => {
                        setUnlockState(prev => ({
                          ...prev,
                          unlocked: true,
                          dad1Name: '田雷',
                          dad2Name: '郑朋',
                          identityAnswers: {
                            name: '米米',
                            age: '15',
                            school: '高中',
                            personality: '活泼开朗',
                            hobbies: '画画、追星',
                            relationship: '被宠爱的小公主',
                            secret: '偷偷嗑爸妈CP',
                            callMe: '宝贝',
                          },
                        }));
                        setUnlockAnimActive(false);
                        setMeSubPage('main');
                      }, 2500);
                    } else {
                      alert('密码错误');
                      setAdminInput('');
                    }
                  }} style={{ width: 'auto', padding: '8px 16px', fontSize: 12 }}>
                    🔑
                  </button>
                </div>
              </div>
            )}

            {unlockState.unlocked && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: '#ecfdf5', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🔓</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>已解锁</div>
              </div>
            )}

            {unlockState.unlocked && (
              <>
                <div style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#92400e' }}>📝 备注/昵称</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#78350f' }}>👨 田雷的备注</label>
                  <input className="unlock-input" placeholder="如：大黑牛" maxLength={20}
                    value={nicknameInput1 || unlockState.dad1Nickname}
                    onChange={e => setNicknameInput1(e.target.value)}
                    onBlur={() => {
                      if (nicknameInput1.trim()) {
                        setUnlockState(prev => ({ ...prev, dad1Nickname: nicknameInput1.trim() }));
                      }
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#78350f' }}>👩 郑朋的备注</label>
                  <input className="unlock-input" placeholder="如：炸毛小猫" maxLength={20}
                    value={nicknameInput2 || unlockState.dad2Nickname}
                    onChange={e => setNicknameInput2(e.target.value)}
                    onBlur={() => {
                      if (nicknameInput2.trim()) {
                        setUnlockState(prev => ({ ...prev, dad2Nickname: nicknameInput2.trim() }));
                      }
                    }}
                  />
                </div>
              </>
            )}

            <button className="identity-btn" onClick={() => setMeSubPage('main')}
              style={{ marginTop: 12, width: '100%', background: '#e5e7eb', color: '#78350f' }}>
              ← 返回
            </button>
          </div>
        </div>
      );
    }

    // === 关于页 ===
    if (meSubPage === 'about') {
      return (
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 16 }}>ℹ️ 关于</div>
          <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(16px)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e' }}>AI小手机</div>
            <div style={{ fontSize: 12, color: '#a16207', marginTop: 4 }}>CP女儿模拟器 v1.0</div>
            <div style={{ fontSize: 11, color: '#d97706', marginTop: 12, lineHeight: 1.6 }}>
              这是一款虚拟家庭模拟器<br/>
              和你的"家人们"一起生活吧<br/>
              💛 灵感来自 dylan-heartbeat
            </div>
          </div>
          <button className="identity-btn" onClick={() => setMeSubPage('main')}
            style={{ marginTop: 16, width: '100%', background: '#e5e7eb', color: '#78350f' }}>
            ← 返回
          </button>
        </div>
      );
    }

    // === 设置页 ===
    if (meSubPage === 'settings') {
      return (
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 16 }}>⚙️ 设置</div>
          <div className="me-menu-item" onClick={() => setMeSubPage('unlock')}>
            <span className="me-menu-icon">{unlockState.unlocked ? '🔓' : '🔒'}</span>
            <span className="me-menu-label">{unlockState.unlocked ? '身份已解锁' : '暗号解锁'}</span>
            <span className="me-menu-arrow">›</span>
          </div>
          <div className="me-menu-item" onClick={() => { setIdentityStep(0); setIdentityInput(''); setMeSubPage('identity'); }}>
            <span className="me-menu-icon">📝</span>
            <span className="me-menu-label">编辑自传</span>
            <span className="me-menu-arrow">›</span>
          </div>
          <div className="me-menu-item" onClick={() => {
            if (confirm('确定要重置所有数据吗？')) {
              localStorage.clear();
              window.location.reload();
            }
          }}>
            <span className="me-menu-icon">🗑️</span>
            <span className="me-menu-label">重置数据</span>
            <span className="me-menu-arrow">›</span>
          </div>
          <button className="identity-btn" onClick={() => setMeSubPage('main')}
            style={{ marginTop: 16, width: '100%', background: '#e5e7eb', color: '#78350f' }}>
            ← 返回
          </button>
        </div>
      );
    }

    // === 主页 ===
    const displayName = unlockState.userIdentity.name || '小甜玉米';
    const displayNick = unlockState.userIdentity.nickname;
    return (
      <div className="me-page">
        <div className="me-header">
          <div className="me-avatar">👧</div>
          <div className="me-name">{displayName}</div>
          {displayNick && <div className="me-nickname" style={{ fontSize: 11, color: '#a16207' }}>{displayNick}</div>}
          <div className="me-level">
            {unlockState.unlocked ? '🔓 已解锁' : '🔒 未解锁'} · Lv.1 · Ch1
          </div>
        </div>
        <div className="me-menu">
          <div className="me-menu-item" onClick={() => setMeSubPage('identity')}>
            <span className="me-menu-icon">📝</span>
            <span className="me-menu-label">我的自传{unlockState.identityCompleted ? ' ✓' : ''}</span>
            <span className="me-menu-arrow">›</span>
          </div>
          <div className="me-menu-item" onClick={() => setMeSubPage('unlock')}>
            <span className="me-menu-icon">{unlockState.unlocked ? '🔓' : '🔒'}</span>
            <span className="me-menu-label">{unlockState.unlocked ? '身份管理' : '暗号解锁'}</span>
            <span className="me-menu-arrow">›</span>
          </div>
          <div className="me-menu-item" onClick={() => setMeSubPage('settings')}>
            <span className="me-menu-icon">⚙️</span>
            <span className="me-menu-label">设置</span>
            <span className="me-menu-arrow">›</span>
          </div>
          <div className="me-menu-item" onClick={() => setMeSubPage('about')}>
            <span className="me-menu-icon">ℹ️</span>
            <span className="me-menu-label">关于</span>
            <span className="me-menu-arrow">›</span>
          </div>
        </div>
        {!unlockState.unlocked && (
          <div style={{ padding: '0 16px', marginTop: 16 }}>
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(254,243,199,0.8)', fontSize: 11, color: '#92400e', textAlign: 'center', lineHeight: 1.5 }}>
              💡 在「暗号解锁」中输入特殊名字<br/>可以解锁全部隐藏功能 ✨
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderWorldBook() {
    return <WorldBookApp />;
  }

  function renderCall() {
    return (
      <div className="call-page">
        <div className="call-avatar">👨</div>
        <div className="call-name">爸爸</div>
        <div className="call-status">来电中...</div>
        <div className="call-actions">
          <button className="call-btn decline">📵</button>
          <button className="call-btn accept">📞</button>
        </div>
      </div>
    );
  }

  function renderBrowser() {
    return (
      <div className="browser-page">
        <div className="browser-bar"><input className="browser-url" placeholder="输入网址或搜索" /></div>
        <div className="browser-body"><div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>输入网址开始浏览</div>
      </div>
    );
  }

  function renderMusic() {
    return (
      <div className="music-page">
        <div className="music-cover">🎵</div>
        <div className="music-title">我们的时光</div>
        <div className="music-artist">爸爸唱的</div>
        <div className="music-progress"><div className="music-progress-fill"></div></div>
        <div className="music-controls">
          <span className="music-ctrl">⏮</span>
          <span className="music-ctrl play">▶️</span>
          <span className="music-ctrl">⏭</span>
        </div>
      </div>
    );
  }

  function renderAppContent() {
    if (!currentApp) return null;
    switch (currentApp) {
      case 'family': return renderChatDetail('family');
      case 'dad': return renderChatDetail('dad');
      case 'mom': return renderChatDetail('mom');
      case 'moments': return renderMoments();
      case 'weibo': return renderWeibo();
      case 'home': return renderHome();
      case 'pet': return renderPet();
      case 'dressup': return renderDressUp();
      case 'me': return renderMe();
      case 'worldbook': return renderWorldBook();
      case 'call': return renderCall();
      case 'browser': return renderBrowser();
      case 'music': return renderMusic();
      default: return <div className="empty-state"><div className="empty-emoji">📱</div>APP开发中</div>;
    }
  }

  // ========== 验证通登录界面 ==========
  function renderLoginScreen() {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 30%, #fde68a 70%, #fbbf24 100%)', position: 'relative', overflow: 'hidden', padding: 20 }}>
        {/* 装饰光晕 */}
        <div style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)', pointerEvents: 'none' as const }} />
        <div style={{ position: 'absolute', bottom: -40, left: -80, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)', pointerEvents: 'none' as const }} />
        <div style={{ position: 'absolute', top: '30%', left: '8%', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', pointerEvents: 'none' as const }} />

        <div style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
          {/* 品牌区域 */}
          <div style={{ textAlign: 'center', marginBottom: 40, marginTop: -20 }}>
            {/* Logo圆形底座 */}
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 88, height: 88, borderRadius: 28, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(146,64,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)', marginBottom: 16 }}>
              <span style={{ fontSize: 44 }}>📱</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#78350f', letterSpacing: 2, lineHeight: 1.3 }}>
              AI小手机
            </div>
            <div style={{ fontSize: 13, color: '#b45309', marginTop: 6, fontWeight: 500, letterSpacing: 3 }}>
              CP社交平台
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              <span style={{ display: 'inline-block', width: 20, height: 1, background: 'linear-gradient(90deg, transparent, #d97706)' }} />
              <span style={{ fontSize: 10, color: '#d97706', letterSpacing: 2 }}>验证通</span>
              <span style={{ display: 'inline-block', width: 20, height: 1, background: 'linear-gradient(90deg, #d97706, transparent)' }} />
            </div>
          </div>

          {/* 登录卡片 */}
          <div style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(28px)', borderRadius: 24, padding: '28px 24px', boxShadow: '0 12px 40px rgba(146,64,0,0.08), 0 2px 8px rgba(146,64,0,0.04)', borderTop: '1px solid rgba(255,255,255,0.7)', borderLeft: '1px solid rgba(255,255,255,0.4)' }}>
            {/* 输入区 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>账 号</div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.85)', borderRadius: 14, border: '1.5px solid rgba(253,230,138,0.6)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <span style={{ padding: '0 0 0 14', fontSize: 18, color: '#d97706' }}>👤</span>
                <input value={loginUsername} onChange={e => setLoginUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="输入你的账号" maxLength={20}
                  style={{ flex: 1, padding: '13px 14px 13px 8px', border: 'none', fontSize: 14, outline: 'none', background: 'transparent', color: '#78350f' }} />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>密 码</div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.85)', borderRadius: 14, border: '1.5px solid rgba(253,230,138,0.6)', overflow: 'hidden' }}>
                <span style={{ padding: '0 0 0 14', fontSize: 18, color: '#d97706' }}>🔒</span>
                <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="输入你的密码" type="password" maxLength={30}
                  style={{ flex: 1, padding: '13px 14px 13px 8px', border: 'none', fontSize: 14, outline: 'none', background: 'transparent', color: '#78350f' }} />
              </div>
            </div>

            {/* 登录按钮 */}
            <button onClick={handleLogin}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(245,158,11,0.35)', transition: 'all 0.2s', letterSpacing: 4, position: 'relative', overflow: 'hidden' }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)', e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,158,11,0.25)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)', e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)', e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.35)')}>
              登 录
            </button>

            {/* 协议 */}
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 10, color: '#a16207', lineHeight: 1.6 }}>
              登录即代表同意 <span style={{ color: '#d97706', textDecoration: 'underline', cursor: 'pointer' }}>用户协议</span> 和 <span style={{ color: '#d97706', textDecoration: 'underline', cursor: 'pointer' }}>隐私政策</span>
            </div>
          </div>

          {/* 底部信息 */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <div style={{ fontSize: 10, color: '#b45309', opacity: 0.7, marginBottom: 8 }}>
              💡 管理员账号：admin / manager_lin / cp_official
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <span style={{ fontSize: 10, color: '#d97706', opacity: 0.5 }}>v1.0.0</span>
              <span style={{ width: 1, height: 10, background: '#d97706', opacity: 0.3 }} />
              <span style={{ fontSize: 10, color: '#d97706', opacity: 0.5 }}>AI小手机团队</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== 管理员总控后台 ==========
  function renderAdminDashboard() {
    const totalUsers = 2;
    const todayActive = 2;
    const totalCost = (tokenTotalConsumed / 10000 * tokenCostPer).toFixed(2);
    const avgCost = (tokenTotalConsumed / Math.max(totalUsers, 1)).toFixed(0);

    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', padding: '0 0 24px' }}>
        {/* 顶部栏 */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#92400e' }}>🔧 管理员总控</span>
            <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>@{loginUsername}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setIsLoggedIn(false); setIsAdmin(false); setLoginUsername(''); }}
              style={{ fontSize: 11, padding: '6px 12px', borderRadius: 16, background: '#f3f4f6', color: '#666', border: 'none', fontWeight: 500, cursor: 'pointer' }}>
              退出登录
            </button>
            <button onClick={() => setAdminViewMode('user')}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 16, background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(245,158,11,0.2)' }}>
              🎮 切换普通用户模式
            </button>
          </div>
        </div>
        {/* Tab 导航 */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', background: '#fff', padding: '0 12px' }}>
          {[
            { key: 'dashboard' as const, icon: '📊', label: '数据看板' },
            { key: 'cpchat' as const, icon: '💬', label: 'CP私聊控制' },
            { key: 'content' as const, icon: '🔧', label: '内容管理' },
            { key: 'token' as const, icon: '💰', label: 'Token定价' },
            { key: 'god' as const, icon: '👁️', label: '上帝视角' },
          ].map(tab => (
            <div key={tab.key} onClick={() => setAdminTab(tab.key)}
              style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 11, fontWeight: adminTab === tab.key ? 700 : 400, color: adminTab === tab.key ? '#f59e0b' : '#999', borderBottom: adminTab === tab.key ? '2px solid #f59e0b' : '2px solid transparent', transition: 'all 0.2s', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 16 }}>{tab.icon}</div>
              <div style={{ marginTop: 2 }}>{tab.label}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 20px' }}>
          {/* 数据看板 */}
          {adminTab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: '总用户数', value: totalUsers, icon: '👥', color: '#3b82f6' },
                  { label: '今日活跃', value: todayActive, icon: '🔥', color: '#ef4444' },
                  { label: '累计消耗Token', value: tokenTotalConsumed.toLocaleString(), icon: '💎', color: '#8b5cf6' },
                  { label: 'API总成本', value: `${totalCost}元`, icon: '💰', color: '#f59e0b' },
                ].map(card => (
                  <div key={card.label} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{card.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: card.color }}>{card.value}</div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{card.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>📈 成本分析</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', padding: '4px 0' }}>
                  <span>人均消耗</span><span style={{ fontWeight: 600 }}>{avgCost} Token</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', padding: '4px 0' }}>
                  <span>单位成本</span><span style={{ fontWeight: 600 }}>{tokenCostPer}元/万Token</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', padding: '4px 0' }}>
                  <span>建议定价</span><span style={{ fontWeight: 600, color: '#f59e0b' }}>{(tokenCostPer * 1.5).toFixed(1)}元/万Token (50%利润)</span>
                </div>
              </div>
            </div>
          )}

          {/* CP私聊控制室 */}
          {adminTab === 'cpchat' && (
            <div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>💬 A和B的私聊记录</div>
                <div style={{ maxHeight: 300, overflowY: 'auto', background: '#f8f8f8', borderRadius: 10, padding: 10 }}>
                  {cpChatMessages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.from === 'A' ? 'rgba(245,158,11,0.2)' : 'rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {msg.from === 'A' ? '👨' : '👩'}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#999' }}>{msg.from === 'A' ? '田栩宁' : '梓渝'} · {msg.time}</div>
                        <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>✍️ 设置私聊</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select value={cpChatTarget} onChange={e => setCpChatTarget(e.target.value as 'A' | 'B')}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, background: '#fff' }}>
                    <option value="A">A(田栩宁)对B说</option>
                    <option value="B">B(梓渝)对A说</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={cpChatInput} onChange={e => setCpChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdminSetCpChat()}
                    placeholder="输入私聊内容..." style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                  <button onClick={handleAdminSetCpChat}
                    style={{ padding: '10px 16px', borderRadius: 10, background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>插入</button>
                </div>
              </div>
              <button onClick={() => {
                if (cpChatMessages.length > 0) {
                  alert('已将最新私聊推送给所有用户！');
                }
              }} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, #ec4899, #f59e0b)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
                📢 推送最新私聊给所有用户
              </button>
            </div>
          )}

          {/* 内容管理 */}
          {adminTab === 'content' && (
            <div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>🔥 热搜榜管理</div>
                {weiboHotSearch.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ width: 20, fontSize: 13, fontWeight: 700, color: idx < 3 ? '#ef4444' : '#999', flexShrink: 0 }}>{idx + 1}</span>
                    <span style={{ flex: 1, fontSize: 12, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                      {item.tag && <span style={{ marginLeft: 4, fontSize: 9, background: item.tagColor || '#f97316', color: '#fff', padding: '0 3px', borderRadius: 3 }}>{item.tag}</span>}
                    </span>
                    <button onClick={() => {
                      setWeiboHotSearch(prev => {
                        const updated = [item, ...prev.filter(p => p.id !== item.id)];
                        return updated.map((h, i) => ({ ...h, id: i + 1 }));
                      });
                    }} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: adminHotSearchLocked.includes(item.id) ? '#fef3c7' : '#f3f4f6', color: adminHotSearchLocked.includes(item.id) ? '#f59e0b' : '#666', border: 'none', cursor: 'pointer' }}>
                      {adminHotSearchLocked.includes(item.id) ? '📌已置顶' : '置顶'}
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>📢 发送官方公告</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={adminAnnouncement} onChange={e => setAdminAnnouncement(e.target.value)}
                    placeholder="输入公告内容..." style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                  <button onClick={() => {
                    if (adminAnnouncement.trim()) {
                      const newPost: WeiboPost = {
                        id: weiboNextId.current++,
                        avatar: '📢',
                        name: '官方公告',
                        tag: '官方',
                        verified: true,
                        time: '刚刚',
                        text: adminAnnouncement.trim(),
                        color: '#ef4444',
                        likes: 0,
                        iLiked: false,
                        comments: [],
                        reposts: 0,
                        expandedComments: false,
                        commentsLoaded: true,
                      };
                      setWeiboData(prev => [newPost, ...prev]);
                      setAdminAnnouncement('');
                      alert('公告已发布！');
                    }
                  }} style={{ padding: '10px 16px', borderRadius: 10, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>发布</button>
                </div>
              </div>
            </div>
          )}

          {/* Token与定价设置 */}
          {adminTab === 'token' && (
            <div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>💰 消耗单价设置</div>
                {[
                  { key: 'postImage' as const, label: '发图消耗', icon: '📷' },
                  { key: 'viewPrivateChat' as const, label: '看私聊消耗', icon: '🔒' },
                  { key: 'aiChat' as const, label: 'AI对话消耗', icon: '🤖' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ fontSize: 12, color: '#666' }}>{item.icon} {item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="number" value={tokenPricing[item.key]}
                        onChange={e => setTokenPricing(prev => ({ ...prev, [item.key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                        style={{ width: 50, padding: '4px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, textAlign: 'center', outline: 'none' }} />
                      <span style={{ fontSize: 10, color: '#999' }}>Token</span>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 12, color: '#666' }}>💵 单位Token成本</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="number" value={tokenCostPer} step="0.1"
                      onChange={e => setTokenCostPer(Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{ width: 60, padding: '4px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, textAlign: 'center', outline: 'none' }} />
                    <span style={{ fontSize: 10, color: '#999' }}>元/万Token</span>
                  </div>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>👥 用户消耗明细</div>
                {tokenUserRecords.map((user, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{user.name} <span style={{ fontSize: 9, background: '#fef3c7', color: '#f59e0b', padding: '0 4px', borderRadius: 4 }}>Lv.{user.level}</span></div>
                      <div style={{ fontSize: 10, color: '#999' }}>最近活跃：{user.lastActive}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>{user.consumed.toLocaleString()} Token</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 上帝视角 */}
          {adminTab === 'god' && (
            <div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>👁️ 全平台数据概览</div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                  <div>📱 总用户数：<b>{totalUsers}</b></div>
                  <div>🔥 今日活跃：<b>{todayActive}</b></div>
                  <div>📝 总微博数：<b>{weiboData.length}</b></div>
                  <div>💬 总评论数：<b>{weiboData.reduce((sum, p) => sum + p.comments.length, 0)}</b></div>
                  <div>💎 累计消耗：<b>{tokenTotalConsumed.toLocaleString()} Token</b></div>
                  <div>💰 总成本：<b>{totalCost}元</b></div>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>💬 A和B完整私聊历史</div>
                <div style={{ maxHeight: 300, overflowY: 'auto', background: '#f8f8f8', borderRadius: 10, padding: 10 }}>
                  {cpChatMessages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: msg.from === 'A' ? 'rgba(245,158,11,0.2)' : 'rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                        {msg.from === 'A' ? '👨' : '👩'}
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: '#999' }}>{msg.from === 'A' ? '田栩宁' : '梓渝'}</span>
                        <div style={{ fontSize: 12, color: '#333' }}>{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>👥 用户主页查看</div>
                {tokenUserRecords.map((user, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{user.name}</div>
                      <div style={{ fontSize: 10, color: '#999' }}>Lv.{user.level} · 消耗 {user.consumed.toLocaleString()} Token</div>
                    </div>
                    <button style={{ fontSize: 10, padding: '3px 10px', borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>查看</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== 未登录 → 显示登录界面 ==========
  if (!isLoggedIn) {
    return renderLoginScreen();
  }

  // ========== 管理员模式 → 显示后台 ==========
  if (isAdmin && adminViewMode === 'admin') {
    return renderAdminDashboard();
  }

  return (
    <div className="phone-page">
      {/* Left Info Panel */}
      <div className="info-panel">
        {isAdmin && (
          <div className="info-card" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #f59e0b' }}>
            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>🔧 管理员模式</div>
            <button onClick={() => setAdminViewMode('admin')}
              style={{ width: '100%', padding: '6px', borderRadius: 10, background: '#f59e0b', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              返回管理后台
            </button>
          </div>
        )}
        <div className="info-card">
          <div className="info-card-title">💎 Token</div>
          <div className="level-row">
            <span className="level-badge" style={{ background: '#8b5cf6' }}>{tokenBalance}</span>
            <span style={{ fontSize: 10, color: '#999' }}>余额</span>
          </div>
          <div style={{ fontSize: 9, color: '#999', marginTop: 4 }}>发图:{tokenPricing.postImage} | 私聊:{tokenPricing.viewPrivateChat} | AI:{tokenPricing.aiChat}</div>
        </div>
        <div className="info-card">
          <div className="info-card-title">⭐ 等级</div>
          <div className="level-row">
            <span className="level-badge">Lv.1</span>
            <span className="chapter-badge">Ch1 · 地下秘密</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: '15%' }}></div></div>
          <div className="progress-label">距离 Lv.2 还需 85 经验</div>
        </div>
        <div className="info-card">
          <div className="info-card-title">💖 亲密度</div>
          <div className="intimacy-row">
            <div className="intimacy-item">
              <span className="intimacy-name" style={{ color: '#f59e0b' }}>👨 爸爸</span>
              <div className="intimacy-bar"><div className="intimacy-fill" style={{ width: '12%', background: '#f59e0b' }}></div></div>
              <span className="intimacy-val">12</span>
            </div>
            <div className="intimacy-item">
              <span className="intimacy-name" style={{ color: '#ec4899' }}>👩 妈咪</span>
              <div className="intimacy-bar"><div className="intimacy-fill" style={{ width: '8%', background: '#ec4899' }}></div></div>
              <span className="intimacy-val">8</span>
            </div>
          </div>
        </div>
        <div className="info-card">
          <div className="info-card-title" style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>世界书：src/lib/world-book.ts</div>
        </div>
      </div>

      {/* Phone Frame */}
      <div className="phone-frame">
        <div className="phone-screen">
          {/* Home Screen */}
          <div className={`home-screen${currentApp ? ' hidden' : ''}`}>
            {/* Status Bar */}
            <div className="status-bar">
              <span>{time}</span>
              <span className="status-right">📶 🔋 100%</span>
            </div>

            <div className="home-content">
              {/* Big Clock */}
              <div className="big-clock">
                <div className="big-time">{time}</div>
                <div className="big-date">{dateStr}</div>
                <div style={{ fontSize: 10, color: '#b45309', marginTop: 2, opacity: 0.8 }}>💎 {tokenBalance} Token · Lv.{userLevel}</div>
              </div>

              {/* Parent Widgets */}
              <div className="parent-widgets">
                <div className="parent-widget">
                    <img src="/status_full.png" className="parent-avatar-bob" alt="" />
                    <div className="parent-info">
                      <span className="parent-name">{unlockState.unlocked ? '爸爸' : DEFAULT_NAMES.dad1}</span>
                      <span className="parent-status">{parentStatus.dadStatus}</span>
                      <span className="parent-desc-inline">{parentStatus.dadDesc}</span>
                    </div>
                    <div className="parent-gif-badge" data-anim={parentStatus.dadGif.anim}>
                      <span className="gif-emoji">{parentStatus.dadGif.emoji}</span>
                      <span className="gif-label">{parentStatus.dadGif.label}</span>
                    </div>
                  </div>
                <div className="parent-widget">
                  <span className="parent-emoji">👩</span>
                  <div className="parent-info">
                    <span className="parent-name">{unlockState.unlocked ? '妈咪' : DEFAULT_NAMES.dad2}</span>
                    <span className="parent-status">{parentStatus.momStatus}</span>
                  </div>
                  <div className="parent-gif-badge" data-anim={parentStatus.momGif.anim}>
                    <span className="gif-emoji">{parentStatus.momGif.emoji}</span>
                    <span className="gif-label">{parentStatus.momGif.label || parentStatus.momDesc}</span>
                  </div>
                </div>
              </div>

              {/* App Grid */}
              <div
                className="app-grid-wrapper"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
              >
                <div className="app-grid-slider" ref={sliderRef} style={{ transform: `translateX(${-currentPage * 100}%)` }}>
                  <div className="app-page-grid">
                    {PAGE1_APPS.map(app => {
                      const locked = !unlockState.unlocked && UNLOCK_ONLY_APPS.includes(app.id);
                      return (
                        <div key={`p1-${app.id}`} className="app-icon" style={{ '--app-color': locked ? '#aaa' : app.color, opacity: locked ? 0.45 : 1 } as React.CSSProperties}
                          onClick={() => { if (locked) { openApp('me'); } else { openApp(app.id); } }}>
                          <div className="app-emoji-box" style={{ background: locked ? '#aaa' : app.color }}>
                            {locked ? '🔒' : app.emoji}
                          </div>
                          <span className="app-label">{getAppLabel(app.id, unlockState.unlocked)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="app-page-grid">
                    {PAGE2_APPS.map(app => {
                      const locked = !unlockState.unlocked && UNLOCK_ONLY_APPS.includes(app.id);
                      return (
                        <div key={`p2-${app.id}`} className="app-icon" style={{ '--app-color': locked ? '#aaa' : app.color, opacity: locked ? 0.45 : 1 } as React.CSSProperties}
                          onClick={() => { if (locked) { openApp('me'); } else { openApp(app.id); } }}>
                          <div className="app-emoji-box" style={{ background: locked ? '#aaa' : app.color }}>
                            {locked ? '🔒' : app.emoji}
                          </div>
                          <span className="app-label">{getAppLabel(app.id, unlockState.unlocked)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="page-dots">
                  {[0, 1].map(i => (
                    <span key={i} className={`dot${i === currentPage ? ' active' : ''}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Dock */}
            <div className="dock">
              {DOCK_APPS.map(app => renderAppIcon(app, true))}
            </div>

            {/* Home Indicator */}
            <div className="home-indicator" onClick={() => { if (currentApp) closeApp(); }}></div>
          </div>

          {/* App Layer */}
          {currentApp && (
            <div className={`app-layer${appClosing ? ' closing' : ''}`}>
              <div className="app-header">
                <button className="app-back" onClick={closeApp}>← 返回</button>
                <span className="app-title">{currentApp === 'dad' ? dadLabel : currentApp === 'mom' ? momLabel : currentApp === 'family' ? '家庭群 (3)' : getAppLabel(currentApp, unlockState.unlocked)}</span>
              </div>
              <div className="app-content">
                {renderAppContent()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
