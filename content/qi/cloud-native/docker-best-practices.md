---
title:
  zh: Docker 最佳实践
  en: Docker Best Practices
date: 2024-01-10
category: qi
subcategory: cloud-native
tags: [docker, 容器, 最佳实践]
description:
  zh: 深入了解 Docker 的使用技巧和最佳实践，提升容器化应用的性能和安全性。
  en: Deep dive into Docker tips and best practices to improve performance and security of containerized applications.
author: shaynewq
draft: false
---

# Docker 最佳实践

Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中。

## Dockerfile 最佳实践

### 使用多阶段构建

```dockerfile
# 构建阶段
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### 最小化镜像大小

```dockerfile
# 使用 Alpine 作为基础镜像
FROM alpine:3.18

# 安装必要的包
RUN apk add --no-cache nodejs npm

# 合并 RUN 命令
RUN apk add --no-cache git \
    && git clone https://github.com/example/repo.git /app

# 清理缓存
RUN npm install --production
```

## 镜像管理

### 镜像标签规范

```bash
# 使用语义化版本
docker tag myapp:latest myapp:1.0.0

# 使用 Git commit SHA
docker tag myapp:latest myapp:abc123def

# 使用日期
docker tag myapp:latest myapp:20240110
```

### 镜像安全扫描

```bash
# 使用 Trivy 扫描镜像
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image myapp:latest

# 使用 Docker 内置扫描
docker scout cves myapp:latest
```

## 容器运行最佳实践

### 资源限制

```bash
# 限制 CPU 和内存使用
docker run -d \
    --name myapp \
    --cpus="1.5" \
    --memory="1g" \
    myapp:latest
```

### 健康检查

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8080/health || exit 1
```

### 安全配置

```bash
# 使用非 root 用户运行
docker run --user 1000:1000 myapp:latest

# 只读文件系统
docker run --read-only myapp:latest

# 限制权限
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp:latest
```

## 网络配置

```bash
# 创建自定义网络
docker network create my-network

# 连接容器到网络
docker network connect my-network container1
docker network connect my-network container2

# 查看网络配置
docker network inspect my-network
```

## 数据卷管理

```bash
# 创建命名卷
docker volume create my-data

# 使用数据卷
docker run -d --name myapp -v my-data:/data myapp:latest

# 备份数据卷
docker run --rm -v my-data:/data -v $(pwd):/backup \
    alpine tar czf /backup/data-backup.tar.gz /data
```

## 常用命令速查

```bash
# 镜像操作
docker build -t myapp:latest .
docker tag myapp:latest registry.example.com/myapp:latest
docker push registry.example.com/myapp:latest
docker image prune -a

# 容器操作
docker run -d -p 80:80 --name web-server nginx
docker exec -it web-server /bin/bash
docker logs -f web-server
docker stats web-server
docker stop web-server
docker rm web-server

# 清理
docker container prune
docker volume prune
docker network prune
docker system prune -a
```
