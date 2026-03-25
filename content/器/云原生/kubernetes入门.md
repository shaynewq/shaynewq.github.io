---
title:
  zh: Kubernetes 入门实战
  en: Kubernetes Practical Guide
date: 2024-01-15
category: 器
subcategory: 云原生
tags: [kubernetes, k8s, 容器编排, 微服务]
description:
  zh: 从零开始学习 Kubernetes，了解核心概念和基本操作，掌握容器编排的精髓。
  en: Learn Kubernetes from scratch, understand core concepts and basic operations, master container orchestration.
author: shaynewq
draft: false
---

# Kubernetes 入门实战

Kubernetes（简称 K8s）是一个开源的容器编排平台，用于自动化部署、扩展和管理容器化应用程序。

## 核心概念

### Pod

Pod 是 Kubernetes 中最小的可部署单元，包含一个或多个容器。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    ports:
    - containerPort: 80
```

### Deployment

Deployment 管理无状态应用，提供声明式的更新机制。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
```

### Service

Service 为一组 Pod 提供稳定的网络端点。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

## 常用命令

```bash
# 查看集群状态
kubectl cluster-info

# 查看所有节点
kubectl get nodes

# 查看 Pod
kubectl get pods

# 查看所有资源
kubectl get all -n <namespace>

# 创建应用
kubectl apply -f deployment.yaml

# 扩容
kubectl scale deployment nginx-deployment --replicas=5

# 查看日志
kubectl logs <pod-name>

# 进入容器
kubectl exec -it <pod-name> -- /bin/bash
```

## 最佳实践

1. **使用命名空间**: 将不同的环境隔离开
2. **设置资源限制**: 防止容器占用过多资源
3. **使用健康检查**: 确保应用正常运行
4. **配置水平自动伸缩**: 根据负载自动调整副本数
5. **使用配置映射和密钥**: 管理配置和敏感信息
