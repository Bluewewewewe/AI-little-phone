'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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

const APP_TITLES: Record<string, string> = {
  family: '家庭群 (3)', dad: '爸爸', mom: '妈咪',
  moments: '朋友圈', weibo: '微博', home: '家里',
  pet: '宠物', dressup: '换装', me: '我的',
  worldbook: '世界书', call: '通话', browser: '浏览器', music: '音乐',
};

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
  const [chatHistory, setChatHistory] = useState<ChatHistory>({
    dad: [
      { from: 'dad', text: '在吗，吃了没', id: nextId() },
    ],
    mom: [
      { from: 'mom', text: '宝贝~在干嘛呀', id: nextId() },
    ],
    family: [],
  });
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

  // ========== 主动聊天 ==========
  useEffect(() => {
    // 每60-120秒随机一个爸妈主动发消息
    function scheduleAutoChat() {
      const delay = 60000 + Math.random() * 60000; // 60-120秒
      autoChatTimerRef.current = setTimeout(async () => {
        const hour = new Date().getHours();
        // 睡觉时间不发
        if (hour >= 23 || hour < 7) {
          scheduleAutoChat();
          return;
        }
        // 随机选一个人，如果在睡觉就换另一个
        let speaker: 'dad' | 'mom' = Math.random() > 0.5 ? 'dad' : 'mom';
        const s = speaker === 'dad' ? parentStatus.dadStatus : parentStatus.momStatus;
        if (s.includes('睡觉') || s.includes('💤')) {
          speaker = speaker === 'dad' ? 'mom' : 'dad';
          const s2 = speaker === 'dad' ? parentStatus.dadStatus : parentStatus.momStatus;
          if (s2.includes('睡觉') || s2.includes('💤')) {
            scheduleAutoChat();
            return;
          }
        }
        try {
          const recentMsgs = chatHistory.family.slice(-6).map(m => ({
            from: m.from,
            text: m.text,
          }));
          const res = await fetch('/api/auto-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speaker, recentMessages: recentMsgs }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.message) {
              setChatHistory(prev => ({
                ...prev,
                [speaker]: [...prev[speaker], { from: speaker, text: data.message, id: nextId() }],
              }));
            }
          }
        } catch {
          // 静默失败
        }
        scheduleAutoChat();
      }, delay);
    }
    scheduleAutoChat();
    return () => {
      if (autoChatTimerRef.current) clearTimeout(autoChatTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const history = chatHistory[character].slice(-20).map(m => ({
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
            body: JSON.stringify({ message: userMsg, character: 'family', speaker, history: speakerHistory }),
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
          body: JSON.stringify({ message: userMsg, character, history }),
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
    return (
      <div
        key={app.id}
        className={isDock ? 'dock-icon' : 'app-icon'}
        style={{ '--app-color': app.color } as React.CSSProperties}
        onClick={() => openApp(app.id)}
      >
        <div className={isDock ? '' : 'app-emoji-box'} style={isDock ? { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, fontSize: 24, background: app.color, borderRadius: 12, position: 'relative', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' } : {}}>
          {app.emoji}
        </div>
        {!isDock && app.label && <span className="app-label">{app.label}</span>}
      </div>
    );
  }

  // 微信风格聊天
  function renderChatDetail(character: 'dad' | 'mom' | 'family') {
    const msgs = chatHistory[character];
    const charName = character === 'dad' ? '爸爸' : character === 'mom' ? '妈咪' : '家庭群';
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
                        {m.from === 'dad' ? '爸爸' : '妈咪'}
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
                    {typingWho === 'dad' ? '爸爸' : '妈咪'}
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

  // 米米评论后，爸妈/宠物自动回复评论
  const autoReplyToComment = async (momentId: number, commentText: string, commentFrom: string | undefined) => {
    // commentFrom 是发这条评论的人（米米/爸/妈等）
    // 回复应该指向发评论的人，而不是评论的 replyTo
    const emotionKeywords = ['不开心', '难过', '伤心', '生气', '烦', '累', '想', '哭', '怕', '焦虑', '压力', '委屈', '孤独', '无聊', '寂寞', '害怕', '讨厌', '郁闷', '崩溃', '受不了', '好烦', '好累', '好怕', '好想', '心痛', '心碎', '分手', '吵架', '对不起', '抱歉', '不舒服', '生病', '难受', '头痛', '肚子疼', '发烧', '感冒', '失眠', '噩梦', '考试', '面试', '好难', '困难', '撑不住', '不想', '失望'];
    const hasEmotion = emotionKeywords.some(kw => commentText.includes(kw));
    
    const reactors = ['老爸', '妈咪', '辛巴🐕', '大鱼🐱', '小十一🐱'];
    // 排除发评论的人自己
    const possibleRepliers = reactors.filter(r => r !== commentFrom);
    
    // 选择性回复：情绪相关必回（2-3人），否则50%概率不回或1人回
    let repliers: string[] = [];
    if (hasEmotion) {
      // 情绪相关——爸妈一定回，可能宠物也回
      repliers = possibleRepliers.filter(r => r === '老爸' || r === '妈咪');
      if (Math.random() < 0.4) {
        const petReplier = possibleRepliers.find(r => r !== '老爸' && r !== '妈咪');
        if (petReplier) repliers.push(petReplier);
      }
    } else {
      // 普通评论——50%概率不回，50%概率1-2人回
      if (Math.random() < 0.5) return; // 50%概率没人回
      const replyCount = Math.random() < 0.6 ? 1 : 2;
      repliers = possibleRepliers.sort(() => Math.random() - 0.5).slice(0, replyCount);
    }
    
    for (const replier of repliers) {
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 3000));
      
      // replyTo 指向发评论的人，而不是评论的原始replyTo
      // 找到原朋友圈内容
      const moment = momentsData.find(m => m.id === momentId);
      const momentAuthor = moment?.name || '';
      const momentContent = moment?.text || '';
      
      const replyToName = commentFrom || '米米';
      const emotionHint = hasEmotion ? '\n注意：对方的话带有情绪，请温柔关心地回复。' : '';
      
      // 明确告诉AI：你是谁、你在回复谁、原朋友圈内容
      const roleMap: Record<string, string> = { '老爸': '田雷（爸爸）', '妈咪': '梓渝（妈咪）', '辛巴🐕': '辛巴（家里的狗）', '大鱼🐱': '大鱼（家里的猫）', '小十一🐱': '小十一（家里的猫）' };
      const myRole = roleMap[replier] || replier;
      const contextInfo = `你是${myRole}。${momentAuthor}发了朋友圈："${momentContent}"。在评论区，${replyToName}说了："${commentText}"。现在请你作为${myRole}，回复${replyToName}的这条评论。${emotionHint}`;
      
      let aiText = '';
      try {
        const character = replier === '老爸' ? 'dad' : replier === '妈咪' ? 'mom' : 'pet';
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `${contextInfo}\n请用一句话简短回复（20字以内），语气要符合你的角色，直接说回复内容不要加引号和前缀`,
            character,
            speaker: character === 'mom' ? 'mom' : 'dad',
            history: [],
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
      
      // replyTo 指向发评论的人
      setMomentsData(prev => prev.map(m => {
        if (m.id !== momentId) return m;
        return { ...m, comments: [...(m.comments || []), { from: replier, text: aiText, replyTo: replyToName }] };
      }));
    }
    
    // 爸妈之间也可能互相回复（60%概率，情绪相关时80%）
    const crossReplyProb = hasEmotion ? 0.8 : 0.6;
    if (Math.random() < crossReplyProb && repliers.length >= 2 && repliers.includes('老爸') && repliers.includes('妈咪')) {
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      // 谁最后评论，另一个人回复谁
      const lastReplier = repliers[repliers.length - 1];
      const crossReplier = lastReplier === '老爸' ? '妈咪' : '老爸';
      const crossCharacter = crossReplier === '妈咪' ? 'mom' : 'dad';
      let crossText = '';
      try {
        const crossRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `朋友圈评论区，${lastReplier}刚说了话，请你用一句话简短回复${lastReplier}（20字以内），要像老夫老妻互怼/撒娇的语气`,
            character: crossCharacter,
            speaker: crossCharacter,
            history: [],
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
      setNewMomentText('');
      setShowNewMoment(false);

      // 爸妈自动互动（延迟模拟）
      const momentId = newMoment.id;
      setTimeout(() => {
        setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, likes: [...m.likes, '爸爸'] } : m));
      }, 2000 + Math.random() * 2000);
      setTimeout(() => {
        setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, likes: [...m.likes, '妈咪'] } : m));
      }, 4000 + Math.random() * 3000);

      // AI 评论互动
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `米米在朋友圈发了：「${newMomentText.trim()}」，请你作为爸爸直接评论这条朋友圈（20字以内）`, character: 'dad', speaker: 'dad', history: [] }),
      }).then(res => {
        const reader = res.body?.getReader();
        if (!reader) return;
        let text = '';
        const pump = (): Promise<void> => reader.read().then(({ done, value }) => {
          if (done) {
            const comment = text.replace(/\n/g, '').trim();
            if (comment) {
              setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...m.comments, { from: '爸爸', text: comment.slice(0, 80) }] } : m));
              // 妈咪可能回复爸爸的评论
              if (Math.random() > 0.3) {
                setTimeout(() => {
                  fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `米米发了朋友圈：「${newMomentText.trim()}」，爸爸评论了：「${comment}」。请你作为妈咪回复爸爸的评论，简短回应他（20字以内）`, character: 'mom', speaker: 'mom', history: [] }),
                  }).then(res2 => {
                    const reader2 = res2.body?.getReader();
                    if (!reader2) return;
                    let text2 = '';
                    const pump2 = (): Promise<void> => reader2.read().then(({ done: d2, value: v2 }) => {
                      if (d2) {
                        const c2 = text2.replace(/\n/g, '').trim();
                        if (c2) {
                          setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...m.comments, { from: '妈咪', text: c2.slice(0, 80), replyTo: '爸爸' }] } : m));
                        }
                        return;
                      }
                      const ch2 = new TextDecoder().decode(v2);
                      ch2.split('\n').forEach(l2 => {
                        if (l2.startsWith('data: ') && l2 !== 'data: [DONE]') {
                          try { text2 += JSON.parse(l2.slice(6)).content; } catch {}
                        }
                      });
                      return pump2();
                    });
                    return pump2();
                  }).catch(() => {});
                }, 2000 + Math.random() * 2000);
              }
            }
            return;
          }
          const chunk = new TextDecoder().decode(value);
          chunk.split('\n').forEach(line => {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try { text += JSON.parse(line.slice(6)).content; } catch {}
            }
          });
          return pump();
        });
        return pump();
      }).catch(() => {});

      setTimeout(() => {
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `米米在朋友圈发了：「${newMomentText.trim()}」，请你作为妈咪直接评论这条朋友圈（20字以内）`, character: 'mom', speaker: 'mom', history: [] }),
        }).then(res => {
          const reader = res.body?.getReader();
          if (!reader) return;
          let text = '';
          const pump = (): Promise<void> => reader.read().then(({ done, value }) => {
            if (done) {
              const comment = text.replace(/\n/g, '').trim();
              if (comment) {
                setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...m.comments, { from: '妈咪', text: comment.slice(0, 80) }] } : m));
                // 爸爸可能回复妈咪的评论
                if (Math.random() > 0.3) {
                  setTimeout(() => {
                    fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ message: `米米在朋友圈发了：「${newMomentText.trim()}」，妈咪评论了：「${comment}」。请你作为爸爸回复妈咪的评论，简短回应她（20字以内）`, character: 'dad', speaker: 'dad', history: [] }),
                    }).then(res2 => {
                      const reader2 = res2.body?.getReader();
                      if (!reader2) return;
                      let text2 = '';
                      const pump2 = (): Promise<void> => reader2.read().then(({ done: d2, value: v2 }) => {
                        if (d2) {
                          const c2 = text2.replace(/\n/g, '').trim();
                          if (c2 && c2.length < 50) {
                            setMomentsData(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...m.comments, { from: '爸爸', text: c2, replyTo: '妈咪' }] } : m));
                          }
                          return;
                        }
                        const ch2 = new TextDecoder().decode(v2);
                        ch2.split('\n').forEach(l2 => {
                          if (l2.startsWith('data: ') && l2 !== 'data: [DONE]') {
                            try { text2 += JSON.parse(l2.slice(6)).content; } catch {}
                          }
                        });
                        return pump2();
                      });
                      return pump2();
                    }).catch(() => {});
                  }, 2000 + Math.random() * 2000);
                }
              }
              return;
            }
            const chunk = new TextDecoder().decode(value);
            chunk.split('\n').forEach(line => {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try { text += JSON.parse(line.slice(6)).content; } catch {}
              }
            });
            return pump();
          });
          return pump();
        }).catch(() => {});
      }, 3500);

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
    const items = [
      { avatar: '🔥', name: 'CP超话', time: '刚刚', text: '【路透】今天又有人拍到他们一起逛超市了！提着同款购物袋！', color: '#ef4444' },
      { avatar: '📢', name: '娱乐热搜', time: '1小时前', text: '#他们是不是在一起了# 阅读量突破3亿', color: '#ef4444' },
    ];
    return (
      <div className="feed-list">
        {items.map((item, i) => (
          <div key={i} className="feed-card">
            <div className="feed-header">
              <div className="feed-avatar" style={{ background: item.color + '20' }}>{item.avatar}</div>
              <div><div className="feed-name">{item.name}</div><div className="feed-time">{item.time}</div></div>
            </div>
            <div className="feed-text">{item.text}</div>
            <div className="feed-actions">
              <span className="feed-action">❤️ 赞</span>
              <span className="feed-action">💬 评论</span>
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
    const menus = [['👤', '个人信息'], ['⭐', '等级系统'], ['🏆', '成就墙'], ['📸', '相册'], ['📓', '记忆笔记本'], ['⚙️', '设置'], ['ℹ️', '关于']];
    return (
      <div className="me-page">
        <div className="me-header">
          <div className="me-avatar">👧</div>
          <div className="me-name">小甜玉米</div>
          <div className="me-level">Lv.1 · Ch1 地下秘密</div>
        </div>
        <div className="me-menu">
          {menus.map((m, i) => (
            <div key={i} className="me-menu-item">
              <span className="me-menu-icon">{m[0]}</span>
              <span className="me-menu-label">{m[1]}</span>
              <span className="me-menu-arrow">›</span>
            </div>
          ))}
        </div>
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
                    <span className="parent-name">爸爸</span>
                    <span className="parent-status">{parentStatus.dadStatus}</span>
                  </div>
                  <span className="parent-desc">{parentStatus.dadDesc}</span>
                </div>
                <div className="parent-widget">
                  <span className="parent-emoji">👩</span>
                  <div className="parent-info">
                    <span className="parent-name">妈咪</span>
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
                    {PAGE1_APPS.map(app => renderAppIcon(app))}
                  </div>
                  <div className="app-page-grid">
                    {PAGE2_APPS.map(app => renderAppIcon(app))}
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
                <span className="app-title">{APP_TITLES[currentApp] || ''}</span>
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
