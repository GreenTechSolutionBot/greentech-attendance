# 依赖安装阶段
FROM node:18-alpine AS deps

# 安装 libc6-compat 以兼容某些 npm 包
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，构建时需要）
RUN npm ci

# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制配置文件
COPY next.config.js ./
COPY tsconfig.json ./
COPY package*.json ./

# 复制源代码
COPY src ./src

# 创建 .env.local 文件
RUN echo "NEXT_PUBLIC_API_URL=http://localhost:8081/api" > .env.local

# 禁用遥测
ENV NEXT_TELEMETRY_DISABLED 1

# 构建应用
RUN npm run build

# 运行阶段
FROM node:18-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 更改所有者
RUN chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 运行应用
CMD ["node", "server.js"]
