-- AI小手机 V3.0 数据库 Schema
-- 在 Supabase SQL Editor 中执行此脚本

-- ============================================
-- 1. 模型配置表 (model_config)
-- ============================================
CREATE TABLE IF NOT EXISTS model_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'admin'
);

-- 初始化默认配置
INSERT INTO model_config (key, value, description) VALUES
  ('gemini_weight', '70', 'Gemini模型权重(0-100)'),
  ('claude_weight', '30', 'Claude模型权重(0-100)'),
  ('routing_mode', 'weighted', '路由模式: weighted/chapter/manual'),
  ('gemini_model', 'gemini-2.5-pro-06-05', 'Gemini模型版本'),
  ('claude_model', 'claude-sonnet-4-20250514', 'Claude模型版本'),
  ('fan_model', 'deepseek-v4-flash', '粉丝层模型版本')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 2. API使用记录表 (api_usage)
-- ============================================
CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  model VARCHAR(50) NOT NULL,
  feature VARCHAR(20) NOT NULL, -- 'chat'|'fan'|'forward'|'voice'
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  cost_rmb DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_model ON api_usage(model);

-- ============================================
-- 3. 收入记录表 (revenue)
-- ============================================
CREATE TABLE IF NOT EXISTS revenue (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  source VARCHAR(20) NOT NULL, -- 'subscription'|'redeem_code'|'manual'|'other'
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_revenue_created_at ON revenue(created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_user_id ON revenue(user_id);

-- ============================================
-- 4. 兑换码表 (redeem_codes)
-- ============================================
CREATE TABLE IF NOT EXISTS redeem_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by VARCHAR(50),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================
-- 5. 用户数据表 (user_data) - 客户端存储的补充
-- ============================================
CREATE TABLE IF NOT EXISTS user_data (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  intimacy_dad INT DEFAULT 0,
  intimacy_mom INT DEFAULT 0,
  chapter INT DEFAULT 1,
  last_chat_date DATE,
  daily_intimacy_dad INT DEFAULT 0,
  daily_intimacy_mom INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. 聊天记录表 (chat_messages)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  chat_type VARCHAR(20) NOT NULL, -- 'family'|'dad'|'mom'
  sender VARCHAR(20) NOT NULL, -- 'user'|'dad'|'mom'
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text'|'voice'|'emoji'|'redpacket'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_type ON chat_messages(chat_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- 7. 朋友圈表 (moments)
-- ============================================
CREATE TABLE IF NOT EXISTS moments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  author VARCHAR(20) NOT NULL, -- 'dad'|'mom'|'user'
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  likes JSONB DEFAULT '[]', -- [{user_id, author}]
  comments JSONB DEFAULT '[]', -- [{user_id, author, content, created_at}]
  chapter_unlock INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. 通知表 (notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'chat'|'moment'|'system'|'call'
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- 常用查询示例
-- ============================================

-- 今日总成本
-- SELECT COALESCE(SUM(cost_rmb), 0) as today_cost FROM api_usage WHERE created_at > CURRENT_DATE;

-- 本月总成本
-- SELECT COALESCE(SUM(cost_rmb), 0) as month_cost FROM api_usage WHERE created_at > DATE_TRUNC('month', CURRENT_DATE);

-- 各模型成本占比
-- SELECT model, COALESCE(SUM(cost_rmb), 0) as cost FROM api_usage WHERE created_at > CURRENT_DATE GROUP BY model;

-- 各功能成本
-- SELECT feature, COALESCE(SUM(cost_rmb), 0) as cost FROM api_usage WHERE created_at > CURRENT_DATE GROUP BY feature;

-- 最近7天成本趋势
-- SELECT DATE(created_at) as day, COALESCE(SUM(cost_rmb), 0) as cost FROM api_usage WHERE created_at > CURRENT_DATE - INTERVAL '7 days' GROUP BY day ORDER BY day;

-- 今日总收入
-- SELECT COALESCE(SUM(amount), 0) as today_revenue FROM revenue WHERE created_at > CURRENT_DATE;

-- 本月总收入
-- SELECT COALESCE(SUM(amount), 0) as month_revenue FROM revenue WHERE created_at > DATE_TRUNC('month', CURRENT_DATE);

-- 用户总数
-- SELECT COUNT(DISTINCT user_id) as total_users FROM user_data;

-- 亲密度分布
-- SELECT 
--   CASE 
--     WHEN chapter = 1 THEN 'Ch1'
--     WHEN chapter = 2 THEN 'Ch2'
--     WHEN chapter = 3 THEN 'Ch3'
--     WHEN chapter = 4 THEN 'Ch4'
--     WHEN chapter = 5 THEN 'Ch5'
--     WHEN chapter = 6 THEN 'Ch6'
--   END as chapter,
--   COUNT(*) as count
-- FROM user_data GROUP BY chapter;


-- ============================================
-- 9. 世界书与人设表 (world_book)
-- ============================================
CREATE TABLE IF NOT EXISTS world_book (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) UNIQUE NOT NULL,  -- 'world_rules'|'dad_profile'|'mom_profile'|'npc_profiles'|'custom_1'|'custom_2'...
  title TEXT NOT NULL,                   -- 显示标题
  content TEXT NOT NULL DEFAULT '',      -- 世界书内容（管理员粘贴的文本）
  is_active BOOLEAN DEFAULT TRUE,        -- 是否启用
  sort_order INT DEFAULT 0,              -- 排序顺序
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'admin'
);

-- 初始化默认条目
INSERT INTO world_book (section, title, content, sort_order) VALUES
  ('world_rules', '🌍 世界书·时间感知系统', '时间是你的世界的根基。在你回应之前，先感知此刻的现实时间。

M1: 时间最高优先级，永不停止。
M2: 每条消息重新校准时间。不得沿用上一条的时间假设。
M3: 三态模型——线上聊天/线下场景/无互动，各有规则。
M4: 状态切换必须时间对账。离线→在线是活人感的关键。
M5: 时间与环境绑定——光照、身体状态、活跃度随时间变。
M6: 感知日期、星期、节日，跨日必须知道。
M7: 用户不在时你仍在生活——有作息、有日常、有随机小事件。
M8: 时间感知隐形，绝不输出时间戳或暴露系统。', 0),
  ('dad_profile', '🟢 爸爸人设', '（在此粘贴爸爸的完整人设卡，包括性格、说话风格、背景故事、习惯、口癖等）', 1),
  ('mom_profile', '🟣 妈妈人设', '（在此粘贴妈妈的完整人设卡，包括性格、说话风格、背景故事、习惯、口癖等）', 2),
  ('npc_profiles', '👥 NPC人设', '（在此粘贴AI粉丝、毒唯、CPF等NPC的人设卡）', 3),
  ('custom_1', '📝 自定义模块1', '', 4),
  ('custom_2', '📝 自定义模块2', '', 5)
ON CONFLICT (section) DO NOTHING;
