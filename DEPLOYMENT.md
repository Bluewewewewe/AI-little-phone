# Zeabur 部署指南

## 前置条件
1. 拥有 GitHub 账户
2. 拥有 Zeabur 账户（https://zeabur.com）
3. 已安装 Git

## 步骤 1：推送代码到 GitHub

### 方式 A：使用现有仓库
项目已经配置了远程仓库：`https://github.com/Bluewewewewe/AI-little-phone.git`

在本地执行：
```bash
# 克隆现有仓库（如果是新设备）
git clone https://github.com/Bluewewewewe/AI-little-phone.git
cd AI-little-phone

# 或者如果已有本地代码，添加远程仓库
git remote add origin https://github.com/Bluewewewewe/AI-little-phone.git
git push -u origin main
```

### 方式 B：创建新仓库
1. 在 GitHub 创建新仓库（如 `ai-little-phone`）
2. 在本地执行：
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/ai-little-phone.git
git push -u origin main
```

## 步骤 2：在 Zeabur 部署

### 2.1 登录 Zeabur
访问 https://zeabur.com 并登录

### 2.2 创建新项目
1. 点击 "New Project"
2. 选择 "Deploy from Git"
3. 选择你的 GitHub 仓库 `AI-little-phone`

### 2.3 配置部署参数
Zeabur 会自动检测到 Dockerfile，使用以下配置：

**构建配置**：
- Build Command: `pnpm build`
- Start Command: `node dist/server.js`
- Port: `5000`

**区域选择**：
- 选择 **Hong Kong**（香港节点）

### 2.4 环境变量（可选）
如果需要，可以添加以下环境变量：
- `NODE_ENV`: `production`
- `COZE_PROJECT_ENV`: `PROD`

### 2.5 部署
点击 "Deploy" 开始部署，等待构建完成（通常需要 3-5 分钟）

## 步骤 3：访问应用

部署完成后，Zeabur 会提供一个域名，格式如：
`https://ai-little-phone-xxxx.zeabur.app`

## 故障排查

### 构建失败
1. 检查 Zeabur 构建日志
2. 确保 `pnpm-lock.yaml` 已提交到仓库
3. 检查 Node.js 版本是否兼容（推荐 Node 20）

### 启动失败
1. 检查端口配置是否为 5000
2. 检查 `dist/server.js` 是否正确生成
3. 查看 Zeabur 运行时日志

### 访问异常
1. 检查 Zeabur 域名是否正确解析
2. 尝试清除浏览器缓存
3. 检查 Zeabur 服务状态

## 自定义域名（可选）

Zeabur 支持绑定自定义域名：
1. 在 Zeabur 项目设置中找到 "Domains"
2. 点击 "Add Custom Domain"
3. 按提示配置 DNS 记录

## 项目结构说明

```
/workspace/projects/
├── Dockerfile              # Docker 构建文件
├── .dockerignore          # Docker 忽略文件
├── zeabur.json            # Zeabur 配置文件
├── package.json           # 项目依赖
├── pnpm-lock.yaml         # 依赖锁定文件
├── src/                   # 源代码
│   ├── app/              # Next.js 页面
│   ├── components/       # React 组件
│   └── server.ts         # 自定义服务器
└── scripts/              # 构建脚本
    ├── build.sh          # 构建脚本
    └── start.sh          # 启动脚本
```

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Package Manager**: pnpm
- **Node.js**: 20+

## 支持

如有问题，请参考：
- Zeabur 文档：https://docs.zeabur.com
- Next.js 文档：https://nextjs.org/docs
