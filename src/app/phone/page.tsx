'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UnlockState, DEFAULT_UNLOCK_STATE, IDENTITY_QUESTIONS,
  checkUnlock, buildIdentityContext, LOCKED_AVAILABLE_APPS, UNLOCK_ONLY_APPS,
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
function getParentStatus(hour: number) {
  let dadStatus: string, dadDesc: string, momStatus: string, momDesc: string;
  if (hour >= 7 && hour < 8) { dadStatus = '🟢 在家'; dadDesc = '做早餐中'; momStatus = '💤 睡觉'; momDesc = '赖床中'; }
  else if (hour >= 8 && hour < 9) { dadStatus = '🟡 出门'; dadDesc = '上班路上'; momStatus = '🟢 在家'; momDesc = '化妆'; }
  else if (hour >= 9 && hour < 12) { dadStatus = '🔴 忙碌'; dadDesc = '公司开会'; momStatus = '🟡 出门'; momDesc = '工作/逛街'; }
  else if (hour >= 12 && hour < 13) { dadStatus = '🟢 在家'; dadDesc = '午休吃饭'; momStatus = '🟡 出门'; momDesc = '和朋友午饭'; }
  else if (hour >= 13 && hour < 18) { dadStatus = '🔴 忙碌'; dadDesc = '继续工作'; momStatus = '🟢 在家'; momDesc = '回家追剧'; }
  else if (hour >= 18 && hour < 19) { dadStatus = '🟡 出门'; dadDesc = '下班回家'; momStatus = '🟢 在家'; momDesc = '做晚饭'; }
  else if (hour >= 19 && hour < 21) { dadStatus = '🟢 在家'; dadDesc = '看电视'; momStatus = '🟢 在家'; momDesc = '靠在爸爸身上'; }
  else if (hour >= 21 && hour < 23) { dadStatus = '🟢 在家'; dadDesc = '聊天互动'; momStatus = '🟢 在家'; momDesc = '聊天互动'; }
  else { dadStatus = '💤 睡觉'; dadDesc = '睡眠中'; momStatus = '💤 睡觉'; momDesc = '睡眠中'; }
  return { dadStatus, dadDesc, momStatus, momDesc };
}

let msgIdCounter = 0;
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
  const [parentStatus, setParentStatus] = useState<{dadStatus:string,dadDesc:string,momStatus:string,momDesc:string}>({dadStatus:'···',dadDesc:'',momStatus:'···',momDesc:''});

  // Navigation
  const [currentPage, setCurrentPage] = useState(0);
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [appClosing, setAppClosing] = useState(false);

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
          if (parsed.dad && parsed.mom && parsed.family) return parsed;
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
      localStorage.setItem('phone_chat_history', JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }, [chatHistory]);
  // Unlock & Identity System
  const [unlockState, setUnlockState] = useState<UnlockState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('phone_unlock_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.unlocked === 'boolean') return { ...DEFAULT_UNLOCK_STATE, ...parsed };
        }
      } catch { /* ignore */ }
    }
    return DEFAULT_UNLOCK_STATE;
  });
  const [unlockAnimActive, setUnlockAnimActive] = useState(false);
  const dadLabel = unlockState.unlocked ? '爸爸' : DEFAULT_NAMES.dad1;
  const momLabel = unlockState.unlocked ? '妈咪' : DEFAULT_NAMES.dad2;
  const [meSubPage, setMeSubPage] = useState<'main' | 'settings' | 'identity' | 'unlock' | 'about'>('main');
  const [identityStep, setIdentityStep] = useState(0);
  const [identityInput, setIdentityInput] = useState('');
  const [unlockInput1, setUnlockInput1] = useState('');
  const [unlockInput2, setUnlockInput2] = useState('');
  const [nicknameInput1, setNicknameInput1] = useState('');
  const [nicknameInput2, setNicknameInput2] = useState('');

  // Persist unlock state
  useEffect(() => {
    try { localStorage.setItem('phone_unlock_state', JSON.stringify(unlockState)); } catch { /* ignore */ }
  }, [unlockState]);

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
  useEffect(() => {
    // 心跳间隔：白天90-180秒，夜间300-600秒
    function scheduleHeartbeat() {
      const hour = new Date().getHours();
      const isDaytime = hour >= 7 && hour < 23;
      const delay = isDaytime 
        ? 90000 + Math.random() * 90000   // 白天: 90-180秒
        : 300000 + Math.random() * 300000; // 夜间: 5-10分钟
      autoChatTimerRef.current = setTimeout(async () => {
        const currentHour = new Date().getHours();
        // 深夜不唤醒
        if (currentHour >= 23 || currentHour < 7) {
          scheduleHeartbeat();
          return;
        }
        // 只在用户在聊天页面时才主动联系
        if (currentApp !== 'family' && currentApp !== 'dad' && currentApp !== 'mom') {
          scheduleHeartbeat();
          return;
        }
        try {
          // 获取当前聊天的最近消息
          const chatKey = currentApp === 'family' ? 'family' : currentApp;
          const recentMsgs = chatHistory[chatKey]?.slice(-10).map(m => ({
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
              for (const msg of data.messages) {
                const delay = msg.speaker === data.messages[0]?.speaker ? 1000 : 2000 + Math.random() * 2000;
                await new Promise(r => setTimeout(r, delay));
                const speakerKey: 'dad' | 'mom' = (msg.speaker === 'mom') ? 'mom' : 'dad';
                setChatHistory(prev => ({
                  ...prev,
                  [speakerKey]: [...prev[speakerKey], { from: speakerKey, text: msg.text, id: nextId() }],
                  family: [...prev.family, { from: speakerKey, text: msg.text, id: nextId() }],
                }));
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
  }, [currentApp, chatHistory]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // 检查对方是否在睡觉/忙碌/出门
      const isSleeping = (who: 'dad' | 'mom') => {
        const s = who === 'dad' ? parentStatus.dadStatus : parentStatus.momStatus;
        return s.includes('睡觉') || s.includes('💤');
      };
      const isBusy = (who: 'dad' | 'mom') => {
        const s = who === 'dad' ? parentStatus.dadStatus : parentStatus.momStatus;
        return s.includes('忙碌') || s.includes('🔴');
      };
      const isOut = (who: 'dad' | 'mom') => {
        const s = who === 'dad' ? parentStatus.dadStatus : parentStatus.momStatus;
        return s.includes('出门') || s.includes('🟡');
      };
      const getDelay = (who: 'dad' | 'mom', isFirst: boolean) => {
        if (isBusy(who)) return 5000 + Math.random() * 5000;
        if (isOut(who)) return 3000 + Math.random() * 5000;
        return isFirst ? 1000 + Math.random() * 2000 : 3000 + Math.random() * 3000;
      };

      // 构建身份上下文
      const identityCtx = buildIdentityContext(unlockState);

      if (character === 'family') {
        // 家庭群：先检查谁醒着
        const dadAwake = !isSleeping('dad');
        const momAwake = !isSleeping('mom');

        if (!dadAwake && !momAwake) {
          setChatHistory(prev => ({
            ...prev,
            family: [...prev.family, { from: 'system' as const, text: '💤 爸爸妈妈都睡了，明天再聊吧~', id: nextId() }],
          }));
          return;
        }

        // 只让醒着的人参与回复
        const rand = Math.random();
        const replyOrder: Array<'dad' | 'mom'> = [];
        if (dadAwake && momAwake) {
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
        } else if (dadAwake) {
          replyOrder.push('dad');
        } else {
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
            body: JSON.stringify({ message: userMsg, character: 'family', speaker, history: speakerHistory, identityContext: identityCtx }),
          });
          setTypingWho(null);

          if (!res.ok) continue;

          const msgId = nextId();
          setChatHistory(prev => ({
            ...prev,
            family: [...prev.family, { from: speaker, text: '', id: msgId }],
          }));

          const fullText = await readSSEStream(res, (text) => {
            setChatHistory(prev => {
              const msgs = [...prev.family];
              const idx = msgs.findIndex(m => m.id === msgId);
              if (idx !== -1) msgs[idx] = { from: speaker, text, id: msgId };
              return { ...prev, family: msgs };
            });
          });

          lastSpeakerText = fullText;
          updatedHistory = [...updatedHistory, { role: 'assistant' as const, content: `${speaker === 'dad' ? '田雷' : '梓渝'}：${fullText}` }];
        }
      } else {
        // 私聊：检查对方是否在睡觉
        if (isSleeping(character as 'dad' | 'mom')) {
          setChatHistory(prev => ({
            ...prev,
            [character]: [...prev[character], { from: 'system' as const, text: `💤 ${character === 'dad' ? '爸爸' : '妈咪'}睡了，明天再聊吧~`, id: nextId() }],
          }));
          return;
        }

        const baseDelay = getDelay(character as 'dad' | 'mom', true);
        setTypingWho(character);
        await new Promise(r => setTimeout(r, baseDelay));
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, character, history, identityContext: identityCtx }),
        });
        if (!res.ok) throw new Error('请求失败');
        setTypingWho(null);

        const msgId = nextId();
        setChatHistory(prev => ({
          ...prev,
          [character]: [...prev[character], { from: character, text: '', id: msgId }],
        }));

        await readSSEStream(res, (text) => {
          setChatHistory(prev => {
            const msgs = [...prev[character]];
            const idx = msgs.findIndex(m => m.id === msgId);
            if (idx !== -1) msgs[idx] = { from: character, text, id: msgId };
            return { ...prev, [character]: msgs };
          });
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
          {msgs.map((m) => (
            <div key={m.id} className={`msg-row ${m.from === 'me' ? 'me' : m.from === 'system' ? 'system' : 'other'}`}>
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

  // ========== 微博数据 ==========
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
    comments: { from: string; text: string }[];
    reposts: number;
  }
  const [weiboData, setWeiboData] = useState<WeiboPost[]>([
    { id: 1, avatar: '👨', name: '田栩宁_', tag: '演员', verified: true, time: '3小时前', text: '今天收工早，回家做了顿饭。某人吃了三碗还嫌不够 😏', color: '#f59e0b', likes: 128340, iLiked: false, comments: [{ from: '甜玉米1号', text: '某人是谁我不说🤏' }, { from: '路人大白', text: '田老师做饭也太宠了吧' }], reposts: 8932 },
    { id: 2, avatar: '👩', name: '我是梓渝_', tag: '歌手', verified: true, time: '5小时前', text: '新歌demo录完啦！这次尝试了不一样的风格，期待吗～ 🎵', color: '#ec4899', likes: 95670, iLiked: false, comments: [{ from: '音粉小圆', text: '期待期待！！' }, { from: '甜玉米2号', text: '月月唱歌太好听了呜呜' }], reposts: 6210 },
    { id: 3, avatar: '🔥', name: 'CP超话', time: '刚刚', text: '【路透】今天又有人拍到他们一起逛超市了！提着同款购物袋！甜玉米尖叫！！！', color: '#ef4444', likes: 28340, iLiked: false, comments: [{ from: '嗑到了', text: '同款购物袋！这是官宣了吧' }, { from: '清醒路人', text: '可能只是巧合吧' }], reposts: 5932 },
    { id: 4, avatar: '👨', name: '田栩宁_', tag: '演员', verified: true, time: '昨天', text: '谢谢大家喜欢《逆爱》，每个角色都值得被认真对待。', color: '#f59e0b', likes: 256700, iLiked: false, comments: [{ from: '剧粉', text: '田栩宁演技真的绝了' }, { from: '逆爱铁粉', text: '永远支持逆爱！' }], reposts: 18500 },
    { id: 5, avatar: '👩', name: '我是梓渝_', tag: '歌手', verified: true, time: '昨天', text: '练习室待了一整天，腿都要断了… 但很充实！💪', color: '#ec4899', likes: 78900, iLiked: false, comments: [{ from: '粉丝团', text: '月月注意休息！' }, { from: '甜玉米3号', text: '某人看到该心疼了' }], reposts: 4320 },
    { id: 6, avatar: '📢', name: '娱乐热搜', time: '2小时前', text: '#他们是不是在一起了# 阅读量突破3亿，网友：这不是情侣我倒立洗头', color: '#ef4444', likes: 45600, iLiked: false, comments: [{ from: '吃瓜群众', text: '坐等官宣' }, { from: 'CP粉头', text: '3亿阅读量！排面！' }], reposts: 12300 },
    { id: 7, avatar: '🔥', name: 'CP超话', time: '1小时前', text: '【分析帖】田栩宁今天微博发的"某人"是谁我不说🤏 翻译：梓渝吃了三碗饭', color: '#ef4444', likes: 19800, iLiked: false, comments: [{ from: '侦探粉', text: '某人=梓渝 这是数学题' }, { from: '唯粉抗议', text: '别乱磕好吗' }], reposts: 3670 },
  ]);
  const [weiboCommentInput, setWeiboCommentInput] = useState('');
  const [activeWeiboComment, setActiveWeiboComment] = useState<number|null>(null);

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
            body: JSON.stringify({ message: `${dadTask}\n请直接说评论内容（20字以内），不要加引号和前缀`, character: 'dad', speaker: 'dad', history: baseHistory }),
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
                body: JSON.stringify({ message: `${momTask}\n请直接说回复内容（20字以内），不要加引号和前缀`, character: 'mom', speaker: 'mom', history: momHistory }),
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
            body: JSON.stringify({ message: `${momTask}\n请直接说评论内容（20字以内），不要加引号和前缀`, character: 'mom', speaker: 'mom', history: momHistory }),
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
                body: JSON.stringify({ message: `${dadTask2}\n请直接说回复内容（20字以内），不要加引号和前缀`, character: 'dad', speaker: 'dad', history: dadHistory2 }),
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
    const formatCount = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n);
    const toggleWeiboLike = (id: number) => {
      setWeiboData(prev => prev.map(p => p.id === id ? { ...p, iLiked: !p.iLiked, likes: p.iLiked ? p.likes - 1 : p.likes + 1 } : p));
    };
    const addWeiboComment = (id: number) => {
      if (!weiboCommentInput.trim()) return;
      setWeiboData(prev => prev.map(p => p.id === id ? { ...p, comments: [...p.comments, { from: '米米', text: weiboCommentInput.trim() }] } : p));
      setWeiboCommentInput('');
    };
    return (
      <div className="feed-list">
        {/* 顶部推荐关注 */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          <div style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', fontSize: 11, fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>👨 田栩宁_ ✓</div>
          <div style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: 'rgba(236,72,153,0.15)', fontSize: 11, fontWeight: 600, color: '#ec4899', display: 'flex', alignItems: 'center', gap: 4 }}>👩 我是梓渝_ ✓</div>
        </div>
        {weiboData.map((item) => (
          <div key={item.id} className="feed-card">
            <div className="feed-header">
              <div className="feed-avatar" style={{ background: item.color + '20' }}>{item.avatar}</div>
              <div style={{ flex: 1 }}>
                <div className="feed-name" style={{ color: item.color }}>
                  {item.name}
                  {item.verified && <span style={{ marginLeft: 4, fontSize: 10, background: item.color, color: '#fff', padding: '1px 4px', borderRadius: 4, verticalAlign: 'middle' }}>V</span>}
                </div>
                <div className="feed-time" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>{item.time}</span>
                  {item.tag && <span style={{ fontSize: 9, color: '#999', background: '#f3f4f6', padding: '0 4px', borderRadius: 3 }}>{item.tag}</span>}
                </div>
              </div>
            </div>
            <div className="feed-text">{item.text}</div>
            {/* 评论区 */}
            {item.comments.length > 0 && (
              <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: '2px solid ' + item.color + '30' }}>
                {item.comments.map((c, ci) => (
                  <div key={ci} style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
                    <span style={{ color: item.color, fontWeight: 600 }}>{c.from}</span>：{c.text}
                  </div>
                ))}
              </div>
            )}
            {/* 评论输入 */}
            {activeWeiboComment === item.id && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={weiboCommentInput} onChange={e => setWeiboCommentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addWeiboComment(item.id)}
                  placeholder="写评论..." style={{ flex: 1, fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none' }} />
                <button onClick={() => addWeiboComment(item.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: item.color, color: '#fff', border: 'none' }}>发送</button>
              </div>
            )}
            <div className="feed-actions" style={{ color: '#999', fontSize: 11, marginTop: 6 }}>
              <span style={{ cursor: 'pointer' }}>🔁 {formatCount(item.reposts)}</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setActiveWeiboComment(activeWeiboComment === item.id ? null : item.id)}>💬 {item.comments.length}</span>
              <span style={{ cursor: 'pointer' }} onClick={() => toggleWeiboLike(item.id)}>
                {item.iLiked ? '❤️' : '🤍'} {formatCount(item.likes)}
              </span>
            </div>
          </div>
        ))}
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

  return (
    <div className="phone-page">
      {/* Left Info Panel */}
      <div className="info-panel">
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
              </div>

              {/* Parent Widgets */}
              <div className="parent-widgets">
                <div className="parent-widget">
                  <span className="parent-emoji">👨</span>
                  <div className="parent-info">
                    <span className="parent-name">{unlockState.unlocked ? '爸爸' : DEFAULT_NAMES.dad1}</span>
                    <span className="parent-status">{parentStatus.dadStatus}</span>
                  </div>
                  <span className="parent-desc">{parentStatus.dadDesc}</span>
                </div>
                <div className="parent-widget">
                  <span className="parent-emoji">👩</span>
                  <div className="parent-info">
                    <span className="parent-name">{unlockState.unlocked ? '妈咪' : DEFAULT_NAMES.dad2}</span>
                    <span className="parent-status">{parentStatus.momStatus}</span>
                  </div>
                  <span className="parent-desc">{parentStatus.momDesc}</span>
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
                        <div key={app.id} className="app-icon" style={{ '--app-color': locked ? '#aaa' : app.color, opacity: locked ? 0.45 : 1 } as React.CSSProperties}
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
                        <div key={app.id} className="app-icon" style={{ '--app-color': locked ? '#aaa' : app.color, opacity: locked ? 0.45 : 1 } as React.CSSProperties}
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
