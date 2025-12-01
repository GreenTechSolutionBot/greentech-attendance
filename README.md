# Docker 快速使用指南

## 🚀 已成功启动！

所有服务已通过 Docker Compose 成功部署：

### 访问地址

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8081/api
- **PostgreSQL**: localhost:5432

### 默认管理员账号

- **用户名**: `admin`
- **密码**: `admin123`

## 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 重启服务
docker-compose restart

# 停止并删除容器（保留数据）
docker-compose down

# 停止并删除容器和数据卷（清空数据）
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build
```

## 当前状态

✅ **PostgreSQL 数据库**: 运行正常，数据库已初始化
✅ **Go 后端服务**: 运行在端口 8081，管理员账号已创建
✅ **Next.js 前端**: 运行在端口 3000，生产模式

## 注意事项

1. **端口占用**: 如果本地开发环境的服务（Go 后端或 PostgreSQL）还在运行，需要先停止它们
   ```bash
   # 停止本地 Go 后端
   pkill -f "go run main.go"
   
   # 停止本地 PostgreSQL（如果有）
   brew services stop postgresql
   ```

2. **数据持久化**: PostgreSQL 数据存储在 Docker volume 中，即使删除容器也不会丢失数据。只有使用 `docker-compose down -v` 才会删除数据。

3. **开发 vs 生产**:
   - 当前配置适合开发和测试环境
   - 生产环境需要修改密码和密钥（JWT_SECRET、POSTGRES_PASSWORD）
   - 建议在生产环境配置 HTTPS 和反向代理

4. **同时运行问题**: Docker 服务和本地开发服务不能同时运行（端口冲突）。选择其中一种：
   - **Docker 方式**: `docker-compose up -d`
   - **本地开发**: `cd backend && go run main.go` + `cd frontend && npm run dev`

## 故障排查

### 服务无法启动

检查端口是否被占用：
```bash
# 检查 8081 端口
lsof -i :8081

# 检查 3000 端口
lsof -i :3000

# 检查 5432 端口
lsof -i :5432
```

### 查看详细错误

```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs frontend

# 进入容器调试
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec postgres psql -U greentech -d greentech_attendance
```

### 重置系统

如果需要完全重置：
```bash
# 停止所有服务并删除数据
docker-compose down -v

# 清理镜像（可选）
docker-compose rm -f
docker rmi greentech-employee-management-backend greentech-employee-management-frontend

# 重新构建并启动
docker-compose up -d --build
```

## 开发建议

1. **本地开发**: 使用 `npm run dev` 和 `go run main.go` 以获得热重载功能
2. **测试部署**: 使用 Docker Compose 测试生产构建
3. **生产部署**: 参考 `DOCKER.md` 了解更多生产环境配置

## 更多信息

详细文档请查看 `DOCKER.md`
