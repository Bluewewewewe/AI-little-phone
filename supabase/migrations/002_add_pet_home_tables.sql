-- 🐾 宠物系统 + 🏠 家庭场景 + 🌽 换装 数据库表

CREATE TABLE IF NOT EXISTS pet_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id VARCHAR(20) NOT NULL,
  hunger INT DEFAULT 100, mood INT DEFAULT 100, health INT DEFAULT 100, energy INT DEFAULT 100,
  is_sleeping BOOLEAN DEFAULT FALSE,
  location VARCHAR(20) DEFAULT 'livingroom',
  activity TEXT DEFAULT '发呆',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pet_id)
);

CREATE TABLE IF NOT EXISTS pet_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id VARCHAR(20) NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  item_id VARCHAR(30),
  cost INT DEFAULT 0,
  stat_changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pet_furniture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  furniture_id VARCHAR(30) NOT NULL,
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, furniture_id)
);

CREATE TABLE IF NOT EXISTS pet_friendship_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id VARCHAR(30) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parent_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'home',
  location VARCHAR(20) DEFAULT '客厅',
  activity TEXT DEFAULT '在家',
  mood VARCHAR(20) DEFAULT 'happy',
  activity_since TIMESTAMPTZ DEFAULT NOW(),
  next_change_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, parent)
);

CREATE TABLE IF NOT EXISTS family_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  participants VARCHAR[] NOT NULL,
  snapshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peek_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent VARCHAR(10) NOT NULL,
  detail TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dressup_owned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id VARCHAR(30) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS dressup_equipped (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  top_item VARCHAR(30), hat_item VARCHAR(30), accessory_item VARCHAR(30),
  bottom_item VARCHAR(30), shoes_item VARCHAR(30), background_item VARCHAR(30),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beta_cost_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_api_calls INT DEFAULT 0, total_cost DECIMAL(10,4) DEFAULT 0,
  deepseek_flash_calls INT DEFAULT 0, gemini_calls INT DEFAULT 0, deepseek_v3_calls INT DEFAULT 0,
  avg_cost_per_user DECIMAL(10,4) DEFAULT 0,
  max_cost_user_id VARCHAR(50), max_cost_user_amount DECIMAL(10,4) DEFAULT 0,
  active_users INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- RLS
ALTER TABLE pet_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_furniture ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE dressup_owned ENABLE ROW LEVEL SECURITY;
ALTER TABLE dressup_equipped ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_pet_status" ON pet_status FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_pet_action" ON pet_action_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_pet_furniture" ON pet_furniture FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_parent_status" ON parent_status FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_dressup_owned" ON dressup_owned FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_dressup_equipped" ON dressup_equipped FOR ALL USING (auth.uid() = user_id);
