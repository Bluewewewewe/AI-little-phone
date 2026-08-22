# 米米宇宙部署指南

## 一、Zeabur 部署步骤

1. 在 [Zeabur](https://zeabur.com) 登录并创建新项目。
2. 进入项目 → **Deploy New Service** → **Deploy your source code** → 选择 GitHub 仓库 `Bluewewewewe/AI-little-phone`。
3. Zeabur 会自动识别为 Node.js 项目。本仓库已提供 `zeabur.json`，构建与启动命令如下：
   - Build: `bash ./scripts/build.sh`
   - Start: `bash ./scripts/start.sh`
4. 在 Zeabur 服务 **Variables** 中配置下方环境变量。
5. 部署完成后，访问 `/api/health` 确认后端状态。

> 提示：香港节点访问大陆 Supabase 通常比美西节点更稳定。

---

## 二、环境变量清单

| 变量名 | 必填 | 说明 | 示例值 |
|---|---|---|---|
| `SUPABASE_URL` | 是 | Supabase 项目 URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | Supabase service_role key（拥有最高权限） | `eyJhbG...` |
| `SUPABASE_SECRET_KEY` | 否 | 兼容旧名，当 `SUPABASE_SERVICE_ROLE_KEY` 不存在时作为 fallback | `eyJhbG...` |
| `NODE_ENV` | 是 | 生产环境必须设置为 `production` | `production` |
| `BOOTSTRAP_ADMIN_USERNAME` | 是 | 首次启动时自动创建的管理员用户名 | `admin` |
| `BOOTSTRAP_ADMIN_PASSWORD` | 是 | 首次启动时自动创建的管理员密码（bcrypt 哈希存储） | `YourStrongP@ssw0rd` |
| `PORT` | 否 | Zeabur 自动注入，一般无需手动配置 | `8080` |
| `COZE_PROJECT_ENV` | 否 | 部署平台环境标识 | `PROD` |

### 密码强度要求
`BOOTSTRAP_ADMIN_PASSWORD` 建议至少 12 位，包含大小写字母、数字和特殊字符。

---

## 三、Supabase 数据库初始化

1. 打开 Supabase Dashboard → SQL Editor。
2. 新建 Query，粘贴并执行 `supabase-schema-v2.sql` 全部内容。
3. 再新建 Query，粘贴并执行 `seed-data.sql` 插入初始公告和示例帖。
4. 确认表已创建：
   - `public.users`
   - `public.user_sessions`
   - `public.invite_codes`
   - `public.apps`
   - `public.app_beta_codes`
   - `public.forum_posts`
   - `public.forum_replies`
   - `public.forum_likes`
   - `public.forum_favorites`
   - `public.bug_reports`
   - `public.weibo_verification`

---

## 四、RLS 策略说明

本项目通过 **Service Role Key** 在后端 API 中访问 Supabase，不依赖客户端直连数据库，因此表中未启用 RLS。所有权限控制均在 `/api/*` 路由层完成（token 校验、admin 角色校验等）。

如果未来需要让前端直接访问 Supabase，请为每张表补充 RLS 策略，并改用 Anon Key + Row Level Security。

---

## 五、部署后验证清单

| 检查项 | 操作 | 期望结果 |
|---|---|---|
| 后端健康 | `GET /api/health` | `{ "status": "ok", "env": "production", "supabase": "connected" }` |
| 注册流程 | 使用有效邀请码注册新账号 | 返回 pending 状态，等待管理员审核 |
| 管理员登录 | 用 `BOOTSTRAP_ADMIN_USERNAME` 登录 | 进入新版管理后台 |
| 用户审核 | 在管理后台通过新注册账号 | 用户状态变为 approved |
| 论坛发帖 | 登录后发帖/回复/点赞 | 数据写入 Supabase 并持久化 |
| 官方公告 | 访问论坛首页 | 顶部置顶显示「欢迎来到米米小作坊」 |

---

## 六、常见问题排查

### 1. 环境变量不匹配
- 确保 `SUPABASE_SERVICE_ROLE_KEY` 不是 Anon Key。
- 如果只有 `SUPABASE_SECRET_KEY`，系统会自动 fallback，但建议统一使用 `SUPABASE_SERVICE_ROLE_KEY`。

### 2. 数据库连接失败
- 检查 `/api/health` 返回的 `supabase` 字段是否为 `connected`。
- 确认 `SUPABASE_URL` 没有拼写错误，且 Service Role Key 有效。
- 检查 Supabase 项目是否启用了 IP 白名单，需要将 Zeabur 出口 IP 加入白名单。

### 3. 构建失败
- 查看 Zeabur build logs，确认 `pnpm install` 和 `pnpm next build` 是否成功。
- 本地可运行 `pnpm run build` 复现。
- 确保没有新增非 pnpm 的 lock 文件（`package-lock.json`、`yarn.lock` 会被 `preinstall` 脚本拒绝）。

### 4. 启动失败 / 端口未监听
- 检查 start logs 中 `Port` 是否与 Zeabur 注入的 `PORT` 一致。
- `scripts/start.sh` 已优先使用 `PORT` 环境变量，无需手动修改。

### 5. 注册提示邀请码无效
- 确认已执行 `seed-data.sql` 后，管理员已在后台生成邀请码。
- 邀请码不区分大小写，但需去除前后空格。

### 6. 首次登录没有管理员权限
- 确认环境变量中 `BOOTSTRAP_ADMIN_USERNAME` 和 `BOOTSTRAP_ADMIN_PASSWORD` 已设置。
- 只有当 `users` 表中不存在任何 `admin`/`super_admin` 角色用户时，系统才会自动创建 bootstrap admin。

---

## 七、目录约定

- `scripts/build.sh`：安装依赖 + Next.js 构建 + tsup 打包 server.ts
- `scripts/start.sh`：启动生产服务
- `src/server.ts`：自定义 Next.js HTTP 服务端入口
- `supabase-schema-v2.sql`：数据库建表语句
- `seed-data.sql`：示例初始数据
- `zeabur.json`：Zeabur 构建/启动命令声明
