# AI小手机 V3.0 - CP女儿模拟器

> 你是CP的女儿，跟爸妈聊天的温馨日常

## 📱 项目简介

AI小手机是一个模拟CP粉丝圈互动的小众产品。用户扮演男男CP的"女儿"，跟两个AI角色（爸爸+妈妈）聊天互动，核心体验是从"地下秘密"到"官宣公开"到"身份曝光"的叙事解锁。

## ✨ 特色功能

- 🎨 **Glassmorphism UI** - 深紫→暗蓝渐变+毛玻璃卡片，精致美观
- 💬 **双角色聊天** - 家庭群聊/爸妈私聊，AI角色个性鲜明
- 💕 **亲密度系统** - 聊天提升亲密度，解锁6章叙事
- 📊 **管理后台** - 财务看板、模型配置、用户统计
- 🤖 **双引擎AI** - Gemini+Claude双模型智能调度

## 🚀 快速开始

### 1. 安装依赖

```bash
cd AI小手机/v3

# 使用国内镜像安装（推荐）
npm install --registry=https://registry.npmmirror.com

# 或者
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key
CLAUDE_API_KEY=your_claude_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# 管理后台访问密码（非常重要！请修改）
ADMIN_SECRET=your_secure_password
```

### 3. 创建数据库表

在 Supabase SQL Editor 中执行 `supabase/schema.sql` 文件中的所有SQL语句。

### 4. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000 即可看到应用。

## 🗄️ Supabase 数据库配置

### 创建项目

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 进入项目设置 → API，获取 `Project URL` 和 `anon/public` key
3. 在 SQL Editor 中执行 `supabase/schema.sql`

### 表结构说明

| 表名 | 说明 |
|------|------|
| `model_config` | 模型配置（权重、路由模式等） |
| `api_usage` | API使用记录（成本追踪） |
| `revenue` | 收入记录 |
| `redeem_codes` | 兑换码 |
| `user_data` | 用户数据（亲密度、章节等） |
| `chat_messages` | 聊天记录 |
| `moments` | 朋友圈动态 |
| `notifications` | 通知 |

## 🎨 自定义配置

### 修改UI颜色/字体

在 `src/app/globals.css` 中修改 CSS 变量：

```css
:root {
  /* 主色调 */
  --accent-purple: #a855f7;
  --accent-blue: #3b82f6;
  --accent-pink: #ec4899;
  
  /* 家人颜色 */
  --dad-color: #8b5cf6;
  --mom-color: #ec4899;
  
  /* 渐变背景 */
  --bg-primary: linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f0f23 100%);
}
```

### 修改角色人设 (System Prompt)

编辑 `src/lib/prompts.ts` 中的 `generateSystemPrompt` 函数：

```typescript
// 修改爸爸性格
// 【核心性格】部分 - 偏执占有欲、说话风格等

// 修改妈妈性格
// 【核心性格】部分 - 温柔体贴、说话风格等

// 修改吃醋逻辑
// 【吃醋情感逻辑】部分
```

### 修改模型权重

**方式一：通过管理后台**
访问 `/admin-xxxxx`（xxxxx为你的ADMIN_SECRET）→ 模型配置标签

**方式二：修改数据库**
在 `model_config` 表中修改 `gemini_weight` 和 `claude_weight` 的值（0-100）

### 修改模型价格

编辑 `src/lib/models.ts` 中的 `MODEL_PRICES` 对象：

```typescript
export const MODEL_PRICES = {
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    input_per_million: 9,      // ¥9/百万token
    output_per_million: 72,    // ¥72/百万token
    cache_per_million: 2.25,   // ¥2.25/百万token
  },
  // ...
}
```

## 📁 项目结构

```
AI小手机/v3/
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.example
├── .gitignore
│
├── supabase/
│   └── schema.sql              # 数据库建表SQL
│
├── src/
│   ├── app/
│   │   ├── globals.css         # 全局样式（Glassmorphism）
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页（身份设置）
│   │   ├── phone/
│   │   │   └── page.tsx        # 手机主界面
│   │   ├── admin-xxxxx/
│   │   │   └── page.tsx        # 管理后台
│   │   └── api/
│   │       ├── chat/route.ts   # 聊天API
│   │       ├── voice/route.ts  # 语音API（预留）
│   │       ├── forward/route.ts # 转发总结API
│   │       └── admin/
│   │           ├── config/route.ts   # 模型配置CRUD
│   │           ├── cost/route.ts     # 成本统计
│   │           ├── revenue/route.ts  # 收入管理
│   │           └── stats/route.ts    # 用户统计
│   │
│   ├── components/
│   │   ├── PhoneScreen.tsx     # 手机屏幕容器
│   │   ├── HomeScreen.tsx      # 主页
│   │   ├── ChatScreen.tsx     # 聊天界面
│   │   ├── MomentsScreen.tsx  # 朋友圈
│   │   ├── WeiboScreen.tsx    # 微博
│   │   ├── NotificationCenter.tsx # 通知中心
│   │   ├── CallScreen.tsx     # 来电界面
│   │   ├── StatusBar.tsx       # 状态栏
│   │   └── IntimacyPanel.tsx  # 亲密度面板
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Supabase客户端
│   │   ├── ai-engine.ts        # AI双引擎调度
│   │   ├── prompts.ts          # System Prompt
│   │   ├── models.ts           # 模型价格表
│   │   ├── intimacy.ts         # 亲密度计算
│   │   └── cost-tracker.ts     # 成本追踪
│   │
│   └── store/
│       └── useStore.ts         # Zustand状态管理
│
└── public/
    └── icons/                  # 图标资源
```

## 🛠️ 添加新的APP页面

1. 在 `src/components/` 中创建新组件（如 `GameScreen.tsx`）
2. 在 `PhoneScreen.tsx` 中添加导航逻辑：

```tsx
// PhoneScreen.tsx
import GameScreen from './GameScreen'

// 添加状态
const [currentApp, setCurrentApp] = useState('home')

// 在 renderApp() 中添加
switch (currentApp) {
  case 'game':
    return <GameScreen onBack={() => setCurrentApp('home')} />
  // ...
}

// 在 BottomNav 中添加入口
<NavItem icon={Gamepad2} label="游戏" onClick={() => setCurrentApp('game')} />
```

## 🔐 管理后台

### 访问地址

```
/admin-xxxxx
```

其中 `xxxxx` 是你设置的 `ADMIN_SECRET` 环境变量值。

### 功能说明

#### 财务总览
- 💰 **总收入** - 所有用户付费总额
- 📉 **总成本** - AI调用成本之和
- 🤑 **净利润** = 总收入 - 总成本
- 📊 支持今日/本周/本月/累计切换

#### 模型成本分析
- 各模型成本占比（饼图）
- 各功能成本分类（聊天/粉丝/转发等）
- 最近7天成本趋势（折线图）
- 成本vs收入对比条

#### 收入管理
- 添加收入记录（手动录入）
- 收入来源统计
- 最近收入记录列表

#### 模型配置
- Gemini/Claude权重滑块
- 模型版本下拉选择
- 路由模式配置
- 粉丝模型选择

#### 用户统计
- 总用户数/付费用户数
- 章节进度分布
- 亲密度分布

## 📦 部署到 Zeabur

### 1. 准备代码

```bash
npm run build
```

### 2. 部署

1. 注册 [Zeabur](https://zeabur.com)
2. 创建新服务，选择 **Next.js**
3. 连接 GitHub 仓库或直接上传代码
4. 配置环境变量（在 Zeabur 控制台）
5. 部署

### 3. 环境变量配置

在 Zeabur 控制台添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
CLAUDE_API_KEY
DEEPSEEK_API_KEY
ADMIN_SECRET
```

### 4. 域名配置

在 Zeabur 控制台 → 服务设置 → 域名，可以绑定自定义域名。

## 🔧 AI模型配置

### 支持的模型

| 模型 | ID | 适用场景 |
|------|-----|----------|
| Gemini 2.5 Pro | `gemini-2.5-pro-06-05` | 主聊天（爸爸角色） |
| Gemini 2.5 Flash | `gemini-2.5-flash` | 快速响应 |
| Claude Sonnet 4 | `claude-sonnet-4-20250514` | 主聊天（妈妈角色） |
| Claude Opus 4 | `claude-opus-4` | 复杂对话 |
| DeepSeek V4 Flash | `deepseek-v4-flash` | 粉丝层（低成本） |

### 双引擎调度逻辑

1. 读取 `model_config` 表中的权重配置
2. 情绪检测覆盖：
   - 用户情绪低落 → 强制 Claude（更擅长共情）
   - 提及另一个爸 → 强制 Gemini（触发吃醋逻辑）
3. 按权重随机选择模型
4. 调用对应API
5. 记录tokens和成本到 `api_usage` 表

### 成本计算

```typescript
// 成本 = 输入成本 + 缓存成本 + 输出成本
cost = (tokens_in / 1_000_000) * input_price
     + (tokens_out / 1_000_000) * output_price
     + (cache_hits / 1_000_000) * cache_price
```

## 📝 开发注意事项

1. **API Key安全**：所有API Key都在服务端使用，不要暴露到客户端
2. **成本追踪**：每次AI调用都会记录到 `api_usage` 表
3. **优雅降级**：如果API调用失败，会返回预设回复，不会白屏
4. **状态持久化**：使用Zustand的persist中间件，用户数据存储在localStorage

## ❓ 常见问题

### Q: AI调用失败怎么办？
A: 检查API Key是否正确配置，或查看服务端日志。系统有预设回复作为降级方案。

### Q: 如何修改角色名称？
A: 用户首次进入时会设置身份（角色称呼），已设置的用户可在管理后台看到但无法直接修改。

### Q: 如何添加新的AI模型？
A: 在 `src/lib/models.ts` 中添加模型价格配置，在 `src/lib/ai-engine.ts` 中添加API调用逻辑。

### Q: 数据库连接失败？
A: 检查 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 是否正确。

## 📄 License

MIT License - 可自由使用和修改
