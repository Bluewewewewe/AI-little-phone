// ========== 微博模拟系统 ==========
// 模拟真实微博的动态热度、词条、评论人设等

// --- 类型定义 ---

export interface WeiboSimData {
  heat: number;
  likes: number;
  comments: number;
  reposts: number;
  currentHashtag: SimHashtag | null;
  subHashtags: SimHashtag[];
  timeline: string;
  lastRefresh: number;
  simComments: SimComment[];
  easterEgg: { triggered: boolean; type: string; message: string } | null;
  superTopic: { name: string; checkInCount: number; postCount: number; fansCount: number; rank: number; } | null;
}

export interface SimHashtag {
  text: string;
  tier: 'boom' | 'hot' | 'normal'; // 爆款 / 热门 / 普通
  heat: number;
}

export interface SimComment {
  id: number;
  persona: 'cp_fan' | 'passerby' | 'toxic_fan' | 'troll';
  name: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
}

// --- 词条库 ---
// XX 可替换为 CP 名
const CP_NAME_A = '田雷';
const CP_NAME_B = '梓渝';
const CP_PAIR = `${CP_NAME_A}${CP_NAME_B}`;

function replaceCP(text: string): string {
  return text.replace(/XX/g, CP_PAIR).replace(/AAA/g, CP_NAME_A).replace(/BBB/g, CP_NAME_B);
}

const BOOM_HASHTAGS: string[] = [
  `#XX对视三秒破防了#`,
  `#XX说悄悄话被收音了#`,
  `#XX彩排牵手跑#`,
  `#XX深夜同回酒店#`,
  `#XX互戴戒指#`,
  `#XX综艺同框甜炸了#`,
  `#XX后台拥抱被拍#`,
  `#XX直播意外表白#`,
];

const HOT_HASHTAGS: string[] = [
  `#XX同款卫衣不同色#`,
  `#AAA直播提到BBB名字#`,
  `#AAA点赞了CP视频#`,
  `#XX今日上班路透#`,
  `#XX同款情侣鞋#`,
  `#BBB新综艺路透#`,
  `#AAA机场穿BBB同款#`,
  `#XX粉丝接机现场#`,
  `#XX超话破百万签到#`,
  `#XX代拍文学大赏#`,
];

const NORMAL_HASHTAGS: string[] = [
  `#AAA今日份营业照#`,
  `#BBB录音室vlog#`,
  `#XX粉丝接机秩序#`,
  `#AAA新综艺路透#`,
  `#BBB直播预告#`,
  `#XX应援色征集#`,
  `#AAA微博更新了#`,
  `#BBB小红书更新#`,
  `#XX站姐出图#`,
  `#XX今日穿搭分析#`,
];

// --- 评论区人设 ---

const CP_FAN_AVATARS = ['🐣', '🐥', '🍬', '💕', '🌸', '🎀', '🍭', '🐰', '🐱'];
const CP_FAN_NAMES = [
  '嗑学家本人', '显微镜女孩', 'CP雷达已启动', '嗑糖机器', '民政局搬运工',
  '你俩给我锁死', 'CP粉头子', '每天嗑生嗑死', '产品是真的', '已嗑晕',
];

const CP_FAN_REPLIES: string[] = [
  '卧槽对视了？？这不是真的我就是假的！[抓狂]',
  '有没有人管管他俩了？？手快牵上了吧！',
  '我产品今天又在我脑子里结婚了谢谢',
  '啊啊啊啊啊啊啊我不行了姐妹们！',
  '不是…这也太好嗑了吧救命',
  '你俩别光眉目传情啊赶紧官宣！',
  '今天的糖分超标了家人们',
  '我宣布！这就是真的！民政局呢？',
  '谁懂啊这个眼神…我死了',
  '就这？再来点！我还要！[敲碗]',
  '嗑到了嗑到了嗑到了 重要的事说三遍',
  '这不比偶像剧好看？？',
  '我嗑的CP天下第一甜！',
  '呜呜呜我的产品怎么这么好嗑',
  '已截图保存 永久珍藏',
];

const PASSERBY_AVATARS = ['🍉', '😶', '🌿', '✨', '🎈'];
const PASSERBY_NAMES = ['路过吃瓜', '随便看看', '路人甲', '打酱油的', '吃瓜群众'];

const PASSERBY_REPLIES: string[] = [
  '这俩关系确实挺好的看着',
  '路过嗑一口，不亏',
  '颜值对我眼睛很好',
  '虽然不粉但这氛围感绝了',
  '啊这，有点好嗑是怎么回事',
  '围观群众表示这波可以的',
  '不懂就问 这俩是真的吗',
  '看起来挺自然的挺好',
];

const TOXIC_FAN_AVATARS = ['🧊', '💀', '😒', '🥀', '👊'];
const TOXIC_FAN_NAMES = ['唯爱AAA', 'BBB独美', '勿cue我担', '专注自家', '独美谢谢'];

const TOXIC_FAN_REPLIES: string[] = [
  '哥独美谢谢，别什么都嗑[微笑]',
  '能不能别蹭了？独立行走不会？',
  '某些人离我担远点OK？',
  '衣服而已，别给自己加戏',
  '又是营业 烦不烦',
  '我担独美好吧 别捆绑',
  '就这？CP粉牙口真好',
  '能不能关注作品别关注私生活',
];

const TROLL_AVATARS = ['🤡', '🍿', '🎭', '🪑', '🤪'];
const TROLL_NAMES = ['乐子人一号', '纯看热闹', '板凳已备好', '吃瓜一线', '缺德网友'];

const TROLL_REPLIES: string[] = [
  '笑死我了你们CP粉牙口真好这也能嗑',
  '打起来打起来！（端板凳）',
  '哈哈哈哈哈哈评论区比正片精彩',
  '我是来看评论的 果然没让我失望',
  '每日一乐（1/1）',
  '毒唯和CP粉打起来没 我来晚了？',
  '这个评论区好热闹 我爱了',
];

// --- 工具函数 ---

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// --- 核心函数 ---

/**
 * 刷新微博模拟数据
 */
export function refreshWeiboData(current?: Partial<WeiboSimData>): WeiboSimData {
  const baseHeat = current?.heat ?? 23000;
  const baseLikes = current?.likes ?? 18000;
  const baseComments = current?.comments ?? 4200;
  const baseReposts = current?.reposts ?? 6000;

  // 热度增量
  let heatDelta = randomInt(300, 2000);
  const isBoom = Math.random() < 0.1; // 10% 概率触发爆款
  if (isBoom) heatDelta += randomInt(5000, 10000);

  // 点赞增量（糖点内容 1.5 倍）
  const isSugar = Math.random() < 0.4;
  const likesDelta = Math.floor(randomInt(200, 1500) * (isSugar ? 1.5 : 1));

  const commentsDelta = randomInt(30, 300);
  const repostsDelta = randomInt(50, 400);

  // 词条选择
  const tierRoll = Math.random();
  let tier: 'boom' | 'hot' | 'normal';
  let hashtagPool: string[];
  if (tierRoll < 0.2) { tier = 'boom'; hashtagPool = BOOM_HASHTAGS; }
  else if (tierRoll < 0.7) { tier = 'hot'; hashtagPool = HOT_HASHTAGS; }
  else { tier = 'normal'; hashtagPool = NORMAL_HASHTAGS; }

  const mainHashtagText = replaceCP(randomPick(hashtagPool));
  const mainHashtag: SimHashtag = {
    text: mainHashtagText,
    tier,
    heat: baseHeat + heatDelta,
  };

  // 副词条
  const subPools = [HOT_HASHTAGS, NORMAL_HASHTAGS].flat();
  const subTexts = randomPickN(subPools.filter(h => h !== mainHashtagText), 2);
  const subHashtags: SimHashtag[] = subTexts.map(t => ({
    text: replaceCP(t),
    tier: (HOT_HASHTAGS.includes(t) ? 'hot' : 'normal') as 'hot' | 'normal',
    heat: randomInt(5000, 50000),
  }));

  // 时间戳
  const minutesAgo = randomInt(1, 59);
  const timeline = minutesAgo <= 1 ? '刚刚' : `${minutesAgo}分钟前`;

  return {
    heat: baseHeat + heatDelta,
    likes: baseLikes + likesDelta,
    comments: baseComments + commentsDelta,
    reposts: baseReposts + repostsDelta,
    currentHashtag: mainHashtag,
    subHashtags,
    timeline,
    lastRefresh: Date.now(),
    simComments: generateSimComments(3),
    superTopic: getSuperTopicData(),
    easterEgg: rollEasterEgg(),
  };
}

/**
 * 生成评论区内容
 */
export function generateSimComments(count: number = 3): SimComment[] {
  const comments: SimComment[] = [];

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let persona: SimComment['persona'];
    let avatarPool: string[];
    let namePool: string[];
    let replyPool: string[];

    if (roll < 0.55) {
      persona = 'cp_fan';
      avatarPool = CP_FAN_AVATARS;
      namePool = CP_FAN_NAMES;
      replyPool = CP_FAN_REPLIES;
    } else if (roll < 0.80) {
      persona = 'passerby';
      avatarPool = PASSERBY_AVATARS;
      namePool = PASSERBY_NAMES;
      replyPool = PASSERBY_REPLIES;
    } else if (roll < 0.95) {
      persona = 'toxic_fan';
      avatarPool = TOXIC_FAN_AVATARS;
      namePool = TOXIC_FAN_NAMES;
      replyPool = TOXIC_FAN_REPLIES;
    } else {
      persona = 'troll';
      avatarPool = TROLL_AVATARS;
      namePool = TROLL_NAMES;
      replyPool = TROLL_REPLIES;
    }

    const name = replaceCP(randomPick(namePool));
    const text = replaceCP(randomPick(replyPool));
    const minsAgo = randomInt(0, i * 15 + 10);
    const timeStr = minsAgo === 0 ? '刚刚' : `${minsAgo}分钟前`;

    comments.push({
      id: Date.now() + i,
      persona,
      name,
      avatar: randomPick(avatarPool),
      text,
      time: timeStr,
      likes: randomInt(0, 999),
    });
  }

  return comments;
}

/**
 * 1% 概率触发彩蛋
 */
export function rollEasterEgg(): { triggered: boolean; type: string; message: string } | null {
  if (Math.random() > 0.01) return null;

  const eggs = [
    { type: 'star_like', message: `🔥 ${CP_NAME_A}点赞了这条微博！评论区炸了！` },
    { type: 'star_reply', message: `💬 ${CP_NAME_B}回复了一条评论："哈哈你们太可爱了"` },
    { type: 'star_post', message: `📢 ${CP_NAME_A}空降超话发帖了！速去围观！` },
  ];

  const egg = randomPick(eggs);
  return { triggered: true, ...egg };
}

/**
 * 获取超话模拟数据
 */
export function getSuperTopicData() {
  return {
    name: `${CP_PAIR}超话`,
    checkInCount: randomInt(85000, 120000),
    postCount: randomInt(1200000, 1500000),
    fansCount: randomInt(500000, 800000),
    rank: randomInt(1, 5),
  };
}
