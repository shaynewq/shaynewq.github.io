---
title:
  zh: Redis 持久化机制
  en: Redis Persistence Mechanism
date: 2024-01-22
category: 器
subcategory: 存储
tags: [redis, 持久化, 缓存]
description:
  zh: 深入了解 Redis 的持久化机制，包括 RDB 和 AOF 两种方式。
  en: Deep dive into Redis persistence mechanisms, including RDB and AOF methods.
author: shaynewq
draft: false
---

# Redis 持久化机制

Redis 提供了两种持久化方式：RDB（Redis Database）和 AOF（Append Only File），可以单独使用或组合使用。

## RDB 持久化

### 工作原理

RDB 是在指定的时间间隔内生成数据集的时间点快照。

```bash
# 配置 RDB 快照
save 900 1      # 900 秒内至少有 1 个 key 变化
save 300 10     # 300 秒内至少有 10 个 key 变化
save 60 10000   # 60 秒内至少有 10000 个 key 变化

# 禁用 RDB
save ""
```

### 手动触发 RDB

```bash
# 生成 RDB 快照
redis-cli BGSAVE    # 后台异步保存
redis-cli SAVE      # 前台同步保存（阻塞）

# 获取最后一次保存时间
redis-cli LASTSAVE
```

### RDB 配置参数

```bash
# RDB 文件名
dbfilename dump.rdb

# RDB 文件存放目录
dir /var/lib/redis

# RDB 压缩
rdbcompression yes

# RDB 校验
rdbchecksum yes
```

## AOF 持久化

### 工作原理

AOF 记录服务器接收到的每一个写操作命令，在服务器重启时，通过重新执行这些命令来恢复数据。

```bash
# 开启 AOF
appendonly yes

# AOF 文件名
appendfilename "appendonly.aof"
```

### AOF 同步策略

```bash
# AOF 同步策略
# always: 每次写操作都同步
# everysec: 每秒同步一次（推荐）
# no: 由操作系统决定何时同步
appendfsync everysec
```

### AOF 重写

```bash
# AOF 重写配置
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 手动触发重写
redis-cli BGREWRITEAOF
```

## 混合持久化

Redis 4.0+ 支持混合持久化，结合 RDB 和 AOF 的优点。

```bash
# 开启混合持久化
aof-use-rdb-preamble yes
```

## 持久化选择

### RDB 优点

- 文件紧凑，恢复速度快
- 适合备份
- 对性能影响小（异步）

### RDB 缺点

- 可能丢失最后一次快照后的数据
- fork 子进程时可能阻塞

### AOF 优点

- 数据安全性高
- 可读性好，可修改
- 自动重写防止文件过大

### AOF 缺点

- 文件体积大
- 恢复速度慢
- 对性能有一定影响

### 选择建议

| 场景 | 推荐方案 |
|------|---------|
| 生产环境 | RDB + AOF (混合持久化) |
| 数据安全性要求高 | 只用 AOF |
| 性能要求高 | 只用 RDB |
| 测试环境 | RDB 或都不用 |

## 性能优化

### 调整 fork 耗时

```bash
# 关闭 THP (Transparent Huge Pages)
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# 物理内存足够时优化
vm.overcommit_memory = 1

# 使用更快的磁盘
```

### AOF 性能优化

```bash
# 使用 everysec 策略
appendfsync everysec

# 开启无盘复制
repl-diskless-sync yes

# 调整重写触发阈值
auto-aof-rewrite-percentage 80
auto-aof-rewrite-min-size 128mb
```

## 监控和运维

### 监控持久化状态

```bash
# 查看持久化信息
redis-cli INFO persistence

# 检查 RDB 文件
redis-cli LASTSAVE
redis-cli DBSIZE

# 检查 AOF 文件
redis-cli INFO persistence | grep aof
```

### 备份策略

```bash
# 备份 RDB 文件
#!/bin/bash
DATE=$(date +%Y%m%d)
cp /var/lib/redis/dump.rdb /backup/redis/dump_${DATE}.rdb

# 远程备份
scp /var/lib/redis/dump.rdb user@backup-server:/backup/
```

### 恢复数据

```bash
# 从 RDB 恢复
1. 停止 Redis 服务
2. 将备份的 dump.rdb 文件放到 Redis 数据目录
3. 启动 Redis 服务

# 从 AOF 恢复
1. 停止 Redis 服务
2. 删除现有 AOF 文件
3. 将备份的 AOF 文件放到 Redis 数据目录
4. 启动 Redis 服务
```

## 故障排查

### RDB 失败

```bash
# 查看 Redis 日志
tail -f /var/log/redis/redis-server.log

# 检查磁盘空间
df -h

# 检查权限
ls -l /var/lib/redis/
```

### AOF 损坏

```bash
# 修复 AOF 文件
redis-cli --appendonly fix

# 检查 AOF 文件
redis-sha1sum appendonly.aof
```
