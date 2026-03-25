---
title:
  zh: CI/CD 最佳实践
  en: CI/CD Best Practices
date: 2024-02-01
category: 器
subcategory: 运维
tags: [CI/CD, devops, 自动化部署]
description:
  zh: 构建高效的持续集成和持续部署流程，提升软件交付效率。
  en: Build efficient continuous integration and deployment pipelines to improve software delivery efficiency.
author: shaynewq
draft: false
---

# CI/CD 最佳实践

CI/CD（Continuous Integration/Continuous Deployment）是现代软件开发的核心实践，能够显著提高交付速度和质量。

## CI 流水线

### 代码检查

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

# 代码质量检查
lint:
  stage: test
  script:
    - npm install
    - npm run lint
    - npm run format:check

# 单元测试
unit-test:
  stage: test
  script:
    - npm install
    - npm test -- --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
```

### 安全扫描

```yaml
# 依赖漏洞扫描
dependency-scan:
  stage: test
  script:
    - npm install -g snyk
    - snyk test --json > snyk-report.json
  artifacts:
    reports:
      dependency_scanning: snyk-report.json

# 容器镜像扫描
container-scan:
  stage: build
  image: aquasec/trivy:latest
  script:
    - trivy image --json --output container-report.json myapp:${CI_COMMIT_SHA}
  artifacts:
    reports:
      container_scanning: container-report.json
```

## Kubernetes 部署

### Helm Chart

```yaml
# values.yaml
replicaCount: 2

image:
  repository: registry.example.com/myapp
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  port: 80

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

### GitOps 部署

```yaml
# argocd 应用配置
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/myapp.git
    targetRevision: main
    path: kubernetes
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## 状态检查

### 健康检查

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: myapp
    image: myapp:latest
    livenessProbe:  # 存活探针
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:  # 就绪探针
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
```

### 金丝雀部署

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  service:
    port: 80
    targetPort: 8080
  analysis:
    interval: 1m
    threshold: 10
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
    - name: request-duration
      thresholdRange:
        max: 500
```

## 回滚策略

### 数据库迁移

```python
#!/usr/bin/env python3
"""
数据库迁移工具
支持可回滚的数据库变更
"""

import sys
from typing import List

class Migration:
    def __init__(self, name: str, version: int, up_sql: str, down_sql: str):
        self.name = name
        self.version = version
        self.up_sql = up_sql
        self.down_sql = down_sql

MIGRATIONS: List[Migration] = [
    Migration(
        name="create_users_table",
        version=1,
        up_sql="""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """,
        down_sql="DROP TABLE users;"
    ),
    Migration(
        name="add_user_status",
        version=2,
        up_sql="ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';",
        down_sql="ALTER TABLE users DROP COLUMN status;"
    )
]

def migrate_up(connection, target_version: int = None):
    """执行迁移"""
    current_version = get_current_version(connection)
    max_version = target_version or max(m.version for m in MIGRATIONS)

    for migration in MIGRATIONS:
        if current_version < migration.version <= max_version:
            print(f"Applying migration: {migration.name} (v{migration.version})")
            execute_sql(connection, migration.up_sql)
            record_migration(connection, migration.version)

def migrate_down(connection, target_version: int):
    """回滚迁移"""
    current_version = get_current_version(connection)

    for migration in reversed(MIGRATIONS):
        if current_version >= migration.version > target_version:
            print(f"Rolling back migration: {migration.name} (v{migration.version})")
            execute_sql(connection, migration.down_sql)
            remove_migration_record(connection, migration.version)
```

### Kubernetes 回滚

```bash
#!/bin/bash
# Kubernetes 回滚脚本

set -e

APP_NAME="${1:-myapp}"
NAMESPACE="${2:-production}"

# 获取当前版本
CURRENT_REVISION=$(kubectl get deployment $APP_NAME -n $NAMESPACE -o jsonpath='{.metadata.annotations.revision}')

# 检查回滚目标
echo "Current revision: $CURRENT_REVISION"

# 确认是否回滚
read -p "Rollback to previous revision? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Rolling back..."
    kubectl rollout undo deployment/$APP_NAME -n $NAMESPACE

    # 等待回滚完成
    kubectl rollout status deployment/$APP_NAME -n $NAMESPACE --timeout=5m

    echo "Rollback completed!"
else
    echo "Rollback cancelled"
fi
```

## 监控和告警

### 部署监控

```yaml
# Prometheus 监控指标
groups:
  - name: деплой
    rules:
      - alert: DeploymentFailed
        expr: |
          kube_deployment_status_replicas_unavailable > 0
          and on (namespace, deployment)
          kube_deployment_metadata_generation
            - kube_deployment_status_observed_generation == 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "部署失败"
          description: "命名空间 {{ $labels.namespace }} 中的部署 {{ $labels.deployment }} 失败"

      - alert: PodNotReady
        expr: |
          kube_pod_status_ready{condition="true"} == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pod 未就绪"
          description: "Pod {{ $labels.pod }} 已有 5 分钟未就绪"
```

### 部署通知

```yaml
# Webhook 通知配置
webhook:
  url: ${SLACK_WEBHOOK_URL}
  on_success: true
  on_failure: true

# 钉钉通知
notification:
  type: dingtalk
  webhook: ${DINGTALK_WEBHOOK_URL}
  secret: ${DINGTALK_SECRET}
  message:
    title: "CI/CD 通知"
    content: |
      ## 部署结果

      项目: ${CI_PROJECT_NAME}
      分支: ${CI_COMMIT_REF_NAME}
      提交: ${CI_COMMIT_SHORT_SHA}
      状态: ${CI_JOB_STATUS}

      [查看详情](${CI_JOB_URL})
```

## 最佳实践

1. **快速反馈**: CI 流水线应在 5 分钟内完成
2. **测试覆盖**: 单元测试、集成测试、E2E 测试
3. **代码审查**: 所有代码变更必须经过审查
4. **小步迭代**: 频繁提交、频繁部署
5. **自动化一切**: 减少手动操作
6. **回滚策略**: 确保可以快速回滚
7. **监控告警**: 及时发现部署问题
8. **文档完善**: 保持文档和代码同步
