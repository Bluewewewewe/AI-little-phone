FROM node:20-slim

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# 暴露端口 - 使用 PORT 环境变量或默认 5000
EXPOSE 5000

# 启动服务 - 确保 PORT 是有效数字
CMD ["sh", "-c", "PORT=$(echo ${PORT:-5000} | grep -E '^[0-9]+$' || echo 5000) node dist/server.js"]
