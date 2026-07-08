// ========== 暗号解锁与身份系统配置 ==========

// 匹配词（可编辑配置）——提交审核时清空此文件
export const SECRET_NAMES = {
  dad1: ['田雷', '田栩宁', '小田'],
  dad2: ['郑朋', '梓渝', '小梓'],
};

// 未解锁时的默认名
export const DEFAULT_NAMES = {
  dad1: '大A',
  dad2: '小B',
};

// 用户身份8题问答
export interface UserIdentity {
  name: string;           // Q1: 你叫什么名字？
  nickname: string;       // Q2: 你想让他们叫你什么？
  hobby: string;          // Q3: 你的爱好是什么？
  dislikeFood: string;    // Q4: 最不喜欢吃什么？
  fear: string;           // Q5: 最怕什么？
  bedtimeHabit: string;   // Q6: 睡觉前必须要做什么？
  birthdayWish: string;   // Q7: 最想要的生日礼物？
  secret: string;         // Q8: 有没有偷偷藏的小秘密？
}

export const IDENTITY_QUESTIONS: Array<{
  key: keyof UserIdentity;
  question: string;
  placeholder: string;
  aiUsage: string;
}> = [
  { key: 'name', question: '你叫什么名字？', placeholder: '1-20字', aiUsage: '对话中称呼你' },
  { key: 'nickname', question: '你想让他们叫你什么？', placeholder: '如：宝贝、小鱼', aiUsage: '他们嘴里的昵称' },
  { key: 'hobby', question: '你的爱好是什么？', placeholder: '如：画画、追蝴蝶', aiUsage: '日常话题/送礼物' },
  { key: 'dislikeFood', question: '最不喜欢吃什么？', placeholder: '如：青椒、胡萝卜', aiUsage: '吃饭场景、挑食互动' },
  { key: 'fear', question: '最怕什么？', placeholder: '如：打雷、黑漆漆的房间', aiUsage: '害怕时的安慰场景' },
  { key: 'bedtimeHabit', question: '睡觉前必须要做什么？', placeholder: '如：听故事、要抱抱', aiUsage: '晚安场景个性化' },
  { key: 'birthdayWish', question: '最想要的生日礼物？', placeholder: '如：一只小猫', aiUsage: '生日剧情触发' },
  { key: 'secret', question: '有没有偷偷藏的小秘密？', placeholder: '如：偷偷留了块糖', aiUsage: '增加互动深度' },
];

// 解锁状态
export interface UnlockState {
  unlocked: boolean;          // 是否已解锁
  dad1Name: string;           // 爸爸1的显示名（解锁后固定为真名）
  dad2Name: string;           // 爸爸2的显示名（解锁后固定为真名）
  dad1Nickname: string;       // 爸爸1的备注/昵称
  dad2Nickname: string;       // 爸爸2的备注/昵称
  userIdentity: UserIdentity; // 用户自传
  identityCompleted: boolean; // 自传问答是否完成
}

export const DEFAULT_UNLOCK_STATE: UnlockState = {
  unlocked: false,
  dad1Name: DEFAULT_NAMES.dad1,
  dad2Name: DEFAULT_NAMES.dad2,
  dad1Nickname: '',
  dad2Nickname: '',
  userIdentity: {
    name: '', nickname: '', hobby: '', dislikeFood: '',
    fear: '', bedtimeHabit: '', birthdayWish: '', secret: '',
  },
  identityCompleted: false,
};

// 构建全局身份上下文（注入 AI system prompt）
export function buildIdentityContext(state: UnlockState): string {
  const lines: string[] = [];
  
  if (state.unlocked) {
    lines.push(`【CP模式已解锁】`);
    lines.push(`爸爸1=田雷${state.dad1Nickname ? `（备注：${state.dad1Nickname}）` : ''}`);
    lines.push(`爸爸2=郑朋${state.dad2Nickname ? `（备注：${state.dad2Nickname}）` : ''}`);
  } else {
    lines.push(`【普通模式】爸爸1=${state.dad1Name}，爸爸2=${state.dad2Name}`);
    lines.push(`只能进行简单日常对话，不要涉及任何深度内容。`);
  }

  const id = state.userIdentity;
  if (id.name || id.nickname) {
    lines.push(`【女儿身份】`);
    if (id.name) lines.push(`名字=${id.name}`);
    if (id.nickname) lines.push(`昵称=${id.nickname}`);
    if (id.hobby) lines.push(`爱好=${id.hobby}`);
    if (id.dislikeFood) lines.push(`讨厌吃=${id.dislikeFood}`);
    if (id.fear) lines.push(`最怕=${id.fear}`);
    if (id.bedtimeHabit) lines.push(`睡前习惯=${id.bedtimeHabit}`);
    if (id.birthdayWish) lines.push(`想要礼物=${id.birthdayWish}`);
    if (id.secret) lines.push(`小秘密=${id.secret}`);
    lines.push(`备注：爸爸1=${state.dad1Nickname || state.dad1Name}，爸爸2=${state.dad2Nickname || state.dad2Name}`);
    lines.push(`重要：绝不跳出人设说"根据你的设定"，自然融入对话。`);
  }

  return lines.join('\n');
}

// 管理员密码 — 输入此密码直接解锁全部功能
export const ADMIN_PASSWORD = 'admin888';

// 检查是否匹配暗号
export function checkUnlock(input1: string, input2: string): boolean {
  const match1 = SECRET_NAMES.dad1.some(n => input1.trim().includes(n));
  const match2 = SECRET_NAMES.dad2.some(n => input2.trim().includes(n));
  return match1 && match2;
}

// 检查是否管理员密码
export function isAdminPassword(input: string): boolean {
  return input.trim() === ADMIN_PASSWORD;
}

// 解锁前可用的APP
export const LOCKED_AVAILABLE_APPS = ['family', 'dad', 'mom', 'me', 'call', 'music'];

// 解锁后才有的APP
export const UNLOCK_ONLY_APPS = ['weibo', 'worldbook', 'pet', 'dressup', 'home', 'browser', 'shopping'];
