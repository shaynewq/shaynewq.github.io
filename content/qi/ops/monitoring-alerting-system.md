---
title:
  zh: 监控告警系统
  en: Monitoring and Alerting System
date: 2024-01-30
category: qi
subcategory: ops
tags: [监控, 告警, 运维自动化]
description:
  zh: 构建企业级监控告警系统，保障系统稳定运行。
  en: Building enterprise-level monitoring and alerting systems to ensure system stability.
author: shaynewq
draft: false
---

# 监控告警系统

完善的监控告警系统是保障服务稳定运行的基础，能够及时发现和解决问题。

## 监控体系架构

### 三层监控模型

```
基础设施监控
    ↓
应用层监控
    ↓
业务层监控
```

### 核心组件

```yaml
# 监控架构
components:
  metrics_collection:
    - prometheus      # 指标采集
    - node_exporter   # 采集主机指标
    - custom_exporter # 自定义指标

  metrics_storage:
    - prometheus      # 时序数据库
    - victoria_metrics # 高性能时序数据库

  visualization:
    - grafana         # 可视化Dashboard

  alerting:
    - alertmanager    # 告警管理
    - pagerduty       # 告警分发
```

## Prometheus 配置

### 基础配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    env: 'prod'

scrape_configs:
  # 监控 Prometheus 自身
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # 监控 Node Exporter
  - job_name: 'node'
    static_configs:
      - targets: ['node1:9100', 'node2:9100']
```

### 服务发现

```yaml
# Kubernetes 服务发现
- job_name: 'kubernetes-pods'
  kubernetes_sd_configs:
    - role: pod
  relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
```

## 告警规则

### CPU 使用率告警

```yaml
# cpu_alerts.yml
groups:
  - name: cpu_alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU使用率过高"
          description: "实例 {{ $labels.instance }} CPU使用率超过 80%"

      - alert: CriticalCPUUsage
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 95
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "CPU使用率严重过高"
          description: "实例 {{ $labels.instance }} CPU使用率超过 95%"
```

### 内存使用率告警

```yaml
- name: memory_alerts
  rules:
    - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "内存使用率过高"
          description: "实例 {{ $labels.instance }} 内存使用率超过 85%"

      - alert: OOMRisk
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 95
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "OOM 风险"
          description: "实例 {{ $labels.instance }} 可能发生 OOM"
```

### 应用指标告警

```yaml
- name: application_alerts
  rules:
    - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "HTTP 错误率过高"
          description: "服务 {{ $labels.job }} 错误率超过 5%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API 延迟过高"
          description: "服务 {{ $labels.job }} P95 延迟超过 1s"
```

## Grafana Dashboard

### 创建面板

```json
{
  "dashboard": {
    "title": "系统监控",
    "panels": [
      {
        "title": "CPU 使用率",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{instance}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "内存使用率",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "{{instance}}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

## Alertmanager 配置

### 路由配置

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: 'default'
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

  routes:
    - match:
        severity: critical
      receiver: 'critical'
      group_wait: 10s
      repeat_interval: 5m

    - match:
        severity: warning
      receiver: 'warning'
      group_wait: 30s
      repeat_interval: 2h

receivers:
  - name: 'default'
    email_configs:
      - to: 'default@example.com'
        headers:
          Subject: '[告警] {{ .GroupLabels.alertname }}'

  - name: 'critical'
    email_configs:
      - to: 'critical@example.com'
    webhook_configs:
      - url: 'http://alertmanager-webhook:8080/critical'
    pagerduty_configs:
      - service_key: 'YOUR_SERVICE_KEY'

  - name: 'warning'
    email_configs:
      - to: 'warning@example.com'
```

## 最佳实践

1. **告警分级**: critical、warning、info 三级告警
2. **告警收敛**: 避免告警风暴
3. **告警确认**: 告警升级机制
4. **告警抑制**: 相关告警合并
5. **告警测试**: 定期测试告警规则

## 告警抑制示例

```yaml
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']

  - source_match:
      alertname: 'NodeDown'
    target_match_re:
      alertname: 'Node.*'
    equal: ['instance']
```

## 运维自动化

### 自动修复脚本

```python
#!/usr/bin/env python3
import requests
import subprocess

def check_alert():
    """检查告警并自动处理"""
    # 获取告警数据
    response = requests.get('http://alertmanager:9093/api/v1/alerts')
    alerts = response.json()['data']

    for alert in alerts:
        if alert['labels']['severity'] == 'critical':
            alert_name = alert['labels']['alertname']

            # 自动重启服务
            if 'service_down' in alert_name:
                restart_service(alert['labels']['service'])

def restart_service(service_name):
    """重启服务"""
    try:
        subprocess.run(['systemctl', 'restart', service_name], check=True)
        print(f"Service {service_name} restarted successfully")
    except subprocess.CalledProcessError as e:
        print(f"Failed to restart service: {e}")
```

## 监控告警最佳实践

1. **明确监控目标**: 业务关键指标优先
2. **合理设置阈值**: 避免误报和漏报
3. **告警分级管理**: 不同级别对应不同响应策略
4. **告警通知渠道**: 邮件、短信、电话、IM 多渠道
5. **定期优化规则**: 根据实际情况调整告警规则
6. **告警记录分析**: 持续改进告警策略
