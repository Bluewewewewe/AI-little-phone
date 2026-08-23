-- 米米宇宙 Supabase Schema v2
-- 包含用户、邀请码、应用商店、论坛、官方公告、Bug反馈等表

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    weibo_name TEXT,
    weibo_link TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verify_status TEXT NOT NULL DEFAULT 'pending' CHECK (verify_status IN ('pending', 'verified', 'rejected')),
    user_bio TEXT DEFAULT '',
    invite_code_used UUID REFERENCES public.users(id) ON DELETE SET NULL,
    referrer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_result TEXT,
    review_reason TEXT,
    grace_period_end TIMESTAMPTZ,
    grace_period_notes TEXT,
    ban_status VARCHAR DEFAULT 'none',
    ban_reason TEXT,
    ban_until TIMESTAMPTZ,
    banned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    banned_at TIMESTAMPTZ,
    violation_count INTEGER NOT NULL DEFAULT 0,
    invite_quota INTEGER NOT NULL DEFAULT 10,
    admin_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    vote_weight NUMERIC NOT NULL DEFAULT 1.0,
    is_default_password BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 用户会话表
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 邀请码表
CREATE TABLE IF NOT EXISTS public.invite_codes (
    code TEXT PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    role_type TEXT NOT NULL DEFAULT 'user' CHECK (role_type IN ('user', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
    used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

-- 应用商店表
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    developer TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    features TEXT[] NOT NULL DEFAULT '{}',
    screenshots TEXT[] NOT NULL DEFAULT '{}',
    version TEXT NOT NULL DEFAULT '1.0.0',
    status TEXT NOT NULL DEFAULT 'development' CHECK (status IN ('hidden', 'development', 'beta', 'published')),
    eta_date TEXT,
    beta_quota INTEGER NOT NULL DEFAULT 0,
    beta_notes TEXT NOT NULL DEFAULT '',
    beta_wipe BOOLEAN NOT NULL DEFAULT false,
    rating REAL NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 应用内测邀请码表
CREATE TABLE IF NOT EXISTS public.app_beta_codes (
    code TEXT PRIMARY KEY,
    app_id TEXT NOT NULL REFERENCES public.apps(app_id) ON DELETE CASCADE,
    max_uses INTEGER NOT NULL DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

-- 论坛帖子表
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'general',
    images TEXT[] NOT NULL DEFAULT '{}',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_essence BOOLEAN NOT NULL DEFAULT false,
    likes INTEGER NOT NULL DEFAULT 0,
    replies INTEGER NOT NULL DEFAULT 0,
    favorites INTEGER NOT NULL DEFAULT 0,
    bug_status TEXT CHECK (bug_status IN ('pending', 'fixed', 'wontfix')),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 论坛回复表
CREATE TABLE IF NOT EXISTS public.forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 论坛点赞表
CREATE TABLE IF NOT EXISTS public.forum_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 论坛收藏表
CREATE TABLE IF NOT EXISTS public.forum_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Bug反馈独立表（用于更完整的Bug跟踪）
CREATE TABLE IF NOT EXISTS public.bug_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reporter_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fixed', 'wontfix')),
    admin_reply TEXT,
    replied_by TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_invite_codes_owner ON public.invite_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON public.invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_apps_status ON public.apps(status);
CREATE INDEX IF NOT EXISTS idx_app_beta_codes_app ON public.app_beta_codes(app_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_section ON public.forum_posts(section);
CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned ON public.forum_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON public.forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_post_user ON public.forum_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_forum_favorites_post_user ON public.forum_favorites(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON public.apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bug_reports_updated_at BEFORE UPDATE ON public.bug_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 启用
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_beta_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- 服务角色绕过策略（应用后端使用 service_role key）
CREATE POLICY service_users_all ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_sessions_all ON public.user_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_invite_codes_all ON public.invite_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_apps_all ON public.apps FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_app_beta_codes_all ON public.app_beta_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_forum_posts_all ON public.forum_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_forum_replies_all ON public.forum_replies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_forum_likes_all ON public.forum_likes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_forum_favorites_all ON public.forum_favorites FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_bug_reports_all ON public.bug_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 匿名用户只读公开论坛（可选）
CREATE POLICY anon_read_published_apps ON public.apps FOR SELECT TO anon USING (status = 'published');
CREATE POLICY anon_read_forum_posts ON public.forum_posts FOR SELECT TO anon USING (deleted_at IS NULL);
CREATE POLICY anon_read_forum_replies ON public.forum_replies FOR SELECT TO anon USING (true);

-- ============================================================================
-- 迁移脚本：兼容已有数据库，统一列类型并补齐缺失字段
-- ============================================================================

-- users 字段迁移
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password') THEN
    ALTER TABLE public.users ADD COLUMN password TEXT NOT NULL DEFAULT '';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password_hash') THEN
    UPDATE public.users SET password = password_hash WHERE password = '' OR password IS NULL;
    ALTER TABLE public.users DROP COLUMN password_hash;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='verify_status') THEN
    ALTER TABLE public.users ADD COLUMN verify_status TEXT NOT NULL DEFAULT 'pending' CHECK (verify_status IN ('pending', 'verified', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='user_bio') THEN
    ALTER TABLE public.users ADD COLUMN user_bio TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='invite_code_used') THEN
    ALTER TABLE public.users ADD COLUMN invite_code_used UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='referrer_id') THEN
    ALTER TABLE public.users ADD COLUMN referrer_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='reviewed_by') THEN
    ALTER TABLE public.users ADD COLUMN reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='reviewed_at') THEN
    ALTER TABLE public.users ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='review_result') THEN
    ALTER TABLE public.users ADD COLUMN review_result TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='review_reason') THEN
    ALTER TABLE public.users ADD COLUMN review_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='grace_period_end') THEN
    ALTER TABLE public.users ADD COLUMN grace_period_end TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='grace_period_notes') THEN
    ALTER TABLE public.users ADD COLUMN grace_period_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='ban_status') THEN
    ALTER TABLE public.users ADD COLUMN ban_status VARCHAR DEFAULT 'none';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='ban_reason') THEN
    ALTER TABLE public.users ADD COLUMN ban_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='ban_until') THEN
    ALTER TABLE public.users ADD COLUMN ban_until TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='banned_by') THEN
    ALTER TABLE public.users ADD COLUMN banned_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='banned_at') THEN
    ALTER TABLE public.users ADD COLUMN banned_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='violation_count') THEN
    ALTER TABLE public.users ADD COLUMN violation_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='invite_quota') THEN
    ALTER TABLE public.users ADD COLUMN invite_quota INTEGER NOT NULL DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='admin_permissions') THEN
    ALTER TABLE public.users ADD COLUMN admin_permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='vote_weight') THEN
    ALTER TABLE public.users ADD COLUMN vote_weight NUMERIC NOT NULL DEFAULT 1.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='is_default_password') THEN
    ALTER TABLE public.users ADD COLUMN is_default_password BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 修正 users 列类型（兼容旧 VARCHAR 列）
ALTER TABLE public.users ALTER COLUMN invite_code_used TYPE UUID USING NULL;
ALTER TABLE public.users ALTER COLUMN referrer_id TYPE UUID USING NULL;
ALTER TABLE public.users ALTER COLUMN reviewed_by TYPE UUID USING NULL;
ALTER TABLE public.users ALTER COLUMN banned_by TYPE UUID USING NULL;

-- role 约束统一为 ('user', 'admin', 'super_admin')
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'super_admin'));

-- invite_codes 字段迁移
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invite_codes' AND column_name='owner_id') THEN
    ALTER TABLE public.invite_codes ADD COLUMN owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invite_codes' AND column_name='used_by') THEN
    ALTER TABLE public.invite_codes ADD COLUMN used_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invite_codes' AND column_name='status') THEN
    ALTER TABLE public.invite_codes ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invite_codes' AND column_name='role_type') THEN
    ALTER TABLE public.invite_codes ADD COLUMN role_type TEXT NOT NULL DEFAULT 'user' CHECK (role_type IN ('user', 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invite_codes' AND column_name='created_at') THEN
    ALTER TABLE public.invite_codes ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invite_codes' AND column_name='used_at') THEN
    ALTER TABLE public.invite_codes ADD COLUMN used_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invite_codes' AND column_name='revoked_at') THEN
    ALTER TABLE public.invite_codes ADD COLUMN revoked_at TIMESTAMPTZ;
  END IF;
END $$;

ALTER TABLE public.invite_codes ALTER COLUMN owner_id TYPE UUID USING NULL;
ALTER TABLE public.invite_codes ALTER COLUMN used_by TYPE UUID USING NULL;
ALTER TABLE public.invite_codes DROP CONSTRAINT IF EXISTS invite_codes_status_check;
ALTER TABLE public.invite_codes ADD CONSTRAINT invite_codes_status_check CHECK (status IN ('active', 'used', 'revoked'));

-- 操作日志表
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  operator_username TEXT,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON public.audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_operator ON public.audit_log(operator_username);

CREATE POLICY IF NOT EXISTS service_audit_log_all ON public.audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 审核队列表
CREATE TABLE IF NOT EXISTS public.review_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline        TIMESTAMPTZ,
  status          VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reassigned', 'reviewed')),
  reviewed_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_result   VARCHAR,
  reassigned_from UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reassigned_at   TIMESTAMPTZ,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_review_assignments_user_id ON public.review_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_assigned_to ON public.review_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_review_assignments_status ON public.review_assignments(status);
CREATE INDEX IF NOT EXISTS idx_review_assignments_deadline ON public.review_assignments(deadline) WHERE status = 'pending';

CREATE POLICY IF NOT EXISTS service_review_assignments_all ON public.review_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
