// ========== State ==========
let currentPage = 0;
const totalPages = 2;
let touchStartX = 0;
let touchDeltaX = 0;
let isDragging = false;
let currentApp = null;

// ========== Clock ==========
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const timeStr = h + ':' + m;
  
  const clock = document.getElementById('clock');
  const bigTime = document.getElementById('bigTime');
  const bigDate = document.getElementById('bigDate');
  
  if (clock) clock.textContent = timeStr;
  if (bigTime) bigTime.textContent = timeStr;
  
  if (bigDate) {
    const days = ['日','一','二','三','四','五','六'];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = days[now.getDay()];
    bigDate.textContent = month + '月' + date + '日 星期' + day;
  }
  
  updateParentStatus(now);
}

// ========== Parent Status ==========
function updateParentStatus(now) {
  const hour = now.getHours();
  
  // Dad schedule
  let dadStatus, dadDesc;
  if (hour >= 7 && hour < 8) { dadStatus = '🟢 在家'; dadDesc = '起床做早餐'; }
  else if (hour >= 8 && hour < 9) { dadStatus = '🟡 出门'; dadDesc = '出门上班'; }
  else if (hour >= 9 && hour < 12) { dadStatus = '🔴 忙碌'; dadDesc = '公司开会'; }
  else if (hour >= 12 && hour < 13) { dadStatus = '🟢 在家'; dadDesc = '午休吃饭'; }
  else if (hour >= 13 && hour < 18) { dadStatus = '🔴 忙碌'; dadDesc = '继续工作'; }
  else if (hour >= 18 && hour < 19) { dadStatus = '🟡 出门'; dadDesc = '下班回家'; }
  else if (hour >= 19 && hour < 21) { dadStatus = '🟢 在家'; dadDesc = '看电视玩手机'; }
  else if (hour >= 21 && hour < 23) { dadStatus = '🟢 在家'; dadDesc = '聊天互动'; }
  else { dadStatus = '💤 睡觉'; dadDesc = '睡眠中'; }
  
  // Mom schedule
  let momStatus, momDesc;
  if (hour >= 7 && hour < 8) { momStatus = '💤 睡觉'; momDesc = '赖床中'; }
  else if (hour >= 8 && hour < 9) { momStatus = '🟢 在家'; momDesc = '化妆'; }
  else if (hour >= 9 && hour < 12) { momStatus = '🟡 出门'; momDesc = '工作/逛街'; }
  else if (hour >= 12 && hour < 13) { momStatus = '🟡 出门'; momDesc = '和朋友午饭'; }
  else if (hour >= 13 && hour < 18) { momStatus = '🟢 在家'; momDesc = '回家追剧'; }
  else if (hour >= 18 && hour < 19) { momStatus = '🟢 在家'; momDesc = '做晚饭'; }
  else if (hour >= 19 && hour < 21) { momStatus = '🟢 在家'; momDesc = '靠在爸爸身上'; }
  else if (hour >= 21 && hour < 23) { momStatus = '🟢 在家'; momDesc = '聊天互动'; }
  else { momStatus = '💤 睡觉'; momDesc = '睡眠中'; }
  
  const ds = document.getElementById('dadStatus');
  const dd = document.getElementById('dadDesc');
  const ms = document.getElementById('momStatus');
  const md = document.getElementById('momDesc');
  if (ds) ds.textContent = dadStatus;
  if (dd) dd.textContent = dadDesc;
  if (ms) ms.textContent = momStatus;
  if (md) md.textContent = momDesc;
}

// ========== Swipe Pagination ==========
function initSwipe() {
  const wrapper = document.getElementById('appGridWrapper');
  if (!wrapper) return;
  
  wrapper.addEventListener('touchstart', onTouchStart, { passive: true });
  wrapper.addEventListener('touchmove', onTouchMove, { passive: true });
  wrapper.addEventListener('touchend', onTouchEnd);
  wrapper.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  isDragging = true;
}
function onTouchMove(e) {
  if (!isDragging) return;
  touchDeltaX = e.touches[0].clientX - touchStartX;
  slideGrid();
}
function onTouchEnd() {
  finishSwipe();
  isDragging = false;
}
function onMouseDown(e) {
  touchStartX = e.clientX;
  isDragging = true;
  e.preventDefault();
}
function onMouseMove(e) {
  if (!isDragging) return;
  touchDeltaX = e.clientX - touchStartX;
  slideGrid();
}
function onMouseUp() {
  if (!isDragging) return;
  finishSwipe();
  isDragging = false;
}

function slideGrid() {
  const slider = document.getElementById('appGridSlider');
  if (!slider) return;
  const offset = -currentPage * 100;
  const pxToPercent = (touchDeltaX / slider.parentElement.offsetWidth) * 100;
  slider.style.transition = 'none';
  slider.style.transform = 'translateX(' + (offset + pxToPercent) + '%)';
}

function finishSwipe() {
  const slider = document.getElementById('appGridSlider');
  if (!slider) return;
  const threshold = slider.parentElement.offsetWidth * 0.15;
  
  if (touchDeltaX < -threshold && currentPage < totalPages - 1) {
    currentPage++;
  } else if (touchDeltaX > threshold && currentPage > 0) {
    currentPage--;
  }
  
  slider.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  slider.style.transform = 'translateX(' + (-currentPage * 100) + '%)';
  touchDeltaX = 0;
  updateDots();
}

function updateDots() {
  document.querySelectorAll('#pageDots .dot').forEach(function(dot, i) {
    dot.classList.toggle('active', i === currentPage);
  });
}

// ========== App Open/Close ==========
function openApp(appId) {
  const home = document.getElementById('homeScreen');
  const layer = document.getElementById('appLayer');
  const title = document.getElementById('appTitle');
  const content = document.getElementById('appContent');
  
  if (!home || !layer || !title || !content) return;
  
  currentApp = appId;
  title.textContent = getAppTitle(appId);
  content.innerHTML = getAppContent(appId);
  
  layer.style.display = 'flex';
  layer.classList.remove('closing');
  home.classList.add('hidden');
  
  // Bind back button
  var backBtn = document.getElementById('appBack');
  if (backBtn) {
    backBtn.onclick = closeApp;
  }
}

function closeApp() {
  var home = document.getElementById('homeScreen');
  var layer = document.getElementById('appLayer');
  if (!home || !layer) return;
  
  layer.classList.add('closing');
  setTimeout(function() {
    layer.style.display = 'none';
    layer.classList.remove('closing');
    home.classList.remove('hidden');
    currentApp = null;
  }, 250);
}

function getAppTitle(id) {
  var titles = {
    family: '家庭群', dad: '爸爸', mom: '妈妈',
    moments: '朋友圈', weibo: '微博', home: '家里',
    pet: '宠物', dressup: '换装', me: '我的',
    call: '通话', browser: '浏览器', music: '音乐'
  };
  return titles[id] || '';
}

function getAppContent(id) {
  switch(id) {
    case 'family': return chatListHTML([
      { avatar: '👨', name: '爸爸', preview: '今天想吃什么？', time: '12:30', unread: 1, color: '#f59e0b' },
      { avatar: '👩', name: '妈妈', preview: '宝贝早点睡哦', time: '昨天', unread: 0, color: '#ec4899' },
      { avatar: '👨‍👩‍👧', name: '家庭群', preview: '爸爸: 周末去哪玩', time: '昨天', unread: 3, color: '#22c55e' }
    ]);
    case 'dad': return chatDetailHTML('👨', '爸爸', '#f59e0b', [
      { from: 'dad', text: '今天想吃什么？' },
      { from: 'dad', text: '爸爸给你做' },
      { from: 'me', text: '想吃红烧排骨！' },
      { from: 'dad', text: '好！爸爸这就去准备' }
    ]);
    case 'mom': return chatDetailHTML('👩', '妈妈', '#ec4899', [
      { from: 'mom', text: '宝贝早点睡哦' },
      { from: 'me', text: '知道啦妈~' },
      { from: 'mom', text: '明天降温，记得穿厚点' }
    ]);
    case 'moments': return feedHTML([
      { avatar: '👩', name: '妈妈', time: '2小时前', text: '今天的夕阳好美呀 🌅', color: '#ec4899' },
      { avatar: '👨', name: '爸爸', time: '5小时前', text: '做了宝贝爱吃的红烧排骨，一口就吃光了 😎', color: '#f59e0b' },
      { avatar: '👩', name: '妈妈', time: '昨天', text: '和某人逛了一下午街，脚都酸了~', color: '#ec4899' }
    ]);
    case 'weibo': return feedHTML([
      { avatar: '🔥', name: 'CP超话', time: '刚刚', text: '【路透】今天又有人拍到他们一起逛超市了！提着同款购物袋！', color: '#ef4444' },
      { avatar: '📢', name: '娱乐热搜', time: '1小时前', text: '#他们是不是在一起了# 阅读量突破3亿', color: '#ef4444' }
    ]);
    case 'home': return sceneHTML();
    case 'pet': return petHTML();
    case 'dressup': return dressupHTML();
    case 'me': return meHTML();
    case 'call': return callHTML();
    case 'browser': return browserHTML();
    case 'music': return musicHTML();
    default: return '<div class="empty-state"><div class="empty-emoji">📱</div>APP开发中</div>';
  }
}

// ========== HTML Templates ==========

function chatListHTML(chats) {
  var html = '<div class="chat-list">';
  chats.forEach(function(c) {
    html += '<div class="chat-item" data-chat="' + c.name + '">';
    html += '<div class="chat-avatar" style="background:' + c.color + '20">' + c.avatar + '</div>';
    html += '<div class="chat-info"><div class="chat-name">' + c.name + '</div><div class="chat-preview">' + c.preview + '</div></div>';
    html += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">';
    html += '<span class="chat-time">' + c.time + '</span>';
    if (c.unread > 0) html += '<span class="chat-unread">' + c.unread + '</span>';
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

function chatDetailHTML(avatar, name, color, messages) {
  var html = '<div class="chat-detail">';
  html += '<div class="chat-messages">';
  messages.forEach(function(m) {
    var isMe = m.from === 'me';
    html += '<div class="msg-row ' + (isMe ? 'me' : '') + '">';
    html += '<div class="msg-bubble">' + m.text + '</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div class="chat-input-bar">';
  html += '<input class="chat-input" placeholder="输入消息..." />';
  html += '<button class="chat-send">↑</button>';
  html += '</div>';
  html += '</div>';
  return html;
}

function feedHTML(items) {
  var html = '<div class="feed-list">';
  items.forEach(function(item) {
    html += '<div class="feed-card">';
    html += '<div class="feed-header">';
    html += '<div class="feed-avatar" style="background:' + item.color + '20">' + item.avatar + '</div>';
    html += '<div><div class="feed-name">' + item.name + '</div><div class="feed-time">' + item.time + '</div></div>';
    html += '</div>';
    html += '<div class="feed-text">' + item.text + '</div>';
    html += '<div class="feed-actions">';
    html += '<span class="feed-action">❤️ 赞</span>';
    html += '<span class="feed-action">💬 评论</span>';
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

function sceneHTML() {
  var rooms = [
    { icon: '🛋️', name: '客厅', status: '小十一在沙发上打盹' },
    { icon: '🛏️', name: '卧室', status: '辛巴守在门口' },
    { icon: '🍳', name: '厨房', status: '空无一人' },
    { icon: '🌿', name: '阳台', status: '大鱼在晒太阳' },
    { icon: '📚', name: '书房', status: '爸爸在工作' },
    { icon: '🚿', name: '浴室', status: '空闲' }
  ];
  var html = '<div class="scene-page"><div class="scene-room-grid">';
  rooms.forEach(function(r) {
    html += '<div class="scene-room">';
    html += '<div class="scene-room-icon">' + r.icon + '</div>';
    html += '<div class="scene-room-name">' + r.name + '</div>';
    html += '<div class="scene-room-status">' + r.status + '</div>';
    html += '</div>';
  });
  html += '</div></div>';
  return html;
}

function petHTML() {
  var pets = [
    { emoji: '🐕', name: '辛巴', type: '中华田园犬', hunger: 90, mood: 85, energy: 70 },
    { emoji: '🐱', name: '大鱼', type: '豹猫', hunger: 85, mood: 70, energy: 55 },
    { emoji: '🐱', name: '小十一', type: '阿比西尼亚猫', hunger: 65, mood: 80, energy: 40 }
  ];
  var html = '<div class="pet-page">';
  pets.forEach(function(p) {
    html += '<div class="pet-card">';
    html += '<div class="pet-avatar">' + p.emoji + '</div>';
    html += '<div class="pet-info">';
    html += '<div class="pet-name">' + p.name + ' · ' + p.type + '</div>';
    html += '<div class="pet-stat"><span class="pet-stat-label">饱腹</span><div class="pet-stat-bar"><div class="pet-stat-fill" style="width:' + p.hunger + '%;background:#22c55e"></div></div><span class="pet-stat-val">' + p.hunger + '</span></div>';
    html += '<div class="pet-stat"><span class="pet-stat-label">心情</span><div class="pet-stat-bar"><div class="pet-stat-fill" style="width:' + p.mood + '%;background:#f59e0b"></div></div><span class="pet-stat-val">' + p.mood + '</span></div>';
    html += '<div class="pet-stat"><span class="pet-stat-label">能量</span><div class="pet-stat-bar"><div class="pet-stat-fill" style="width:' + p.energy + '%;background:#3b82f6"></div></div><span class="pet-stat-val">' + p.energy + '</span></div>';
    html += '</div></div>';
  });
  html += '<div class="pet-actions">';
  html += '<button class="pet-btn">🦴 喂食</button>';
  html += '<button class="pet-btn">🎾 玩耍</button>';
  html += '<button class="pet-btn">💤 休息</button>';
  html += '</div></div>';
  return html;
}

function dressupHTML() {
  var items = ['👗','👘','👚','👔','🎩','🎀','💍','👟'];
  var html = '<div class="dress-page">';
  html += '<div class="dress-preview">🧍‍♀️</div>';
  html += '<div class="dress-tabs">';
  html += '<button class="dress-tab active">衣服</button>';
  html += '<button class="dress-tab">头饰</button>';
  html += '<button class="dress-tab">配饰</button>';
  html += '<button class="dress-tab">道具</button>';
  html += '</div>';
  html += '<div class="dress-grid">';
  items.forEach(function(item, i) {
    html += '<div class="dress-item' + (i === 0 ? ' equipped' : '') + '">' + item + '</div>';
  });
  html += '</div></div>';
  return html;
}

function meHTML() {
  var html = '<div class="me-page">';
  html += '<div class="me-header">';
  html += '<div class="me-avatar">👧</div>';
  html += '<div class="me-name">小甜玉米</div>';
  html += '<div class="me-level">Lv.1 · Ch1 地下秘密</div>';
  html += '</div>';
  html += '<div class="me-menu">';
  var menus = [
    ['👤', '个人信息'], ['⭐', '等级系统'], ['🏆', '成就墙'],
    ['📸', '相册'], ['📓', '记忆笔记本'], ['⚙️', '设置'], ['ℹ️', '关于']
  ];
  menus.forEach(function(m) {
    html += '<div class="me-menu-item">';
    html += '<span class="me-menu-icon">' + m[0] + '</span>';
    html += '<span class="me-menu-label">' + m[1] + '</span>';
    html += '<span class="me-menu-arrow">›</span>';
    html += '</div>';
  });
  html += '</div></div>';
  return html;
}

function callHTML() {
  var html = '<div class="call-page">';
  html += '<div class="call-avatar">👨</div>';
  html += '<div class="call-name">爸爸</div>';
  html += '<div class="call-status">来电中...</div>';
  html += '<div class="call-actions">';
  html += '<button class="call-btn decline">📵</button>';
  html += '<button class="call-btn accept">📞</button>';
  html += '</div></div>';
  return html;
}

function browserHTML() {
  var html = '<div class="browser-page">';
  html += '<div class="browser-bar">';
  html += '<input class="browser-url" placeholder="输入网址或搜索" />';
  html += '</div>';
  html += '<div class="browser-body">';
  html += '<div style="font-size:48px;margin-bottom:12px">🌐</div>';
  html += '输入网址开始浏览';
  html += '</div></div>';
  return html;
}

function musicHTML() {
  var html = '<div class="music-page">';
  html += '<div class="music-cover">🎵</div>';
  html += '<div class="music-title">我们的时光</div>';
  html += '<div class="music-artist">爸爸唱的</div>';
  html += '<div class="music-progress"><div class="music-progress-fill"></div></div>';
  html += '<div class="music-controls">';
  html += '<span class="music-ctrl">⏮</span>';
  html += '<span class="music-ctrl play">▶️</span>';
  html += '<span class="music-ctrl">⏭</span>';
  html += '</div></div>';
  return html;
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', function() {
  updateClock();
  setInterval(updateClock, 30000);
  initSwipe();
  
  // App icon clicks
  document.querySelectorAll('.app-icon, .dock-icon').forEach(function(el) {
    el.addEventListener('click', function() {
      var appId = this.getAttribute('data-app');
      if (appId) openApp(appId);
    });
  });
  
  // Home indicator click
  var hi = document.getElementById('homeIndicator');
  if (hi) {
    hi.addEventListener('click', function() {
      if (currentApp) closeApp();
    });
  }
  
  // Chat item clicks (delegated)
  document.addEventListener('click', function(e) {
    var chatItem = e.target.closest('.chat-item');
    if (chatItem) {
      var chatName = chatItem.getAttribute('data-chat');
      if (chatName === '爸爸') openApp('dad');
      else if (chatName === '妈妈') openApp('mom');
    }
  });
});
