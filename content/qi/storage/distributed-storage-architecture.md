---
title:
  zh: 分布式存储架构
  en: Distributed Storage Architecture
date: 2024-01-25
category: qi
subcategory: storage
tags: [分布式存储, 架构设计, CAP]
description:
  zh: 深入了解分布式存储系统的设计原理和实现方案。
  en: Deep dive into the design principles and implementation approaches of distributed storage systems.
author: shaynewq
draft: false
---

# 分布式存储架构

分布式存储系统通过将数据分散存储在多个节点上，实现高可用、高性能和可扩展性。

## 核心理论

### CAP 定理

```
一致性 (Consistency)
    ↓
可用性 (Availability)
    ↓
分区容错 (Partition Tolerance)
```

CAP 定理指出，在分布式系统中，这三个特性最多只能同时满足两个。

### 一致性模型

| 类型 | 描述 | 示例 |
|------|------|------|
| 强一致性 | 任何时刻所有节点数据一致 | Zookeeper |
| 最终一致性 | 经过一段时间后达到一致 | Dynamo |
| 弱一致性 | 不保证一致性 | DNS |

### BASE 理论

- **基本可用**: 系统保证基本功能可用
- **软状态**: 允许数据在不同节点间存在中间状态
- **最终一致性**: 经过一定时间后达到一致

## 数据分布策略

### 哈希分布

```python
def hash_partition(key, node_count):
    """基于哈希的分区"""
    hash_value = hash(key)
    partition = hash_value % node_count
    return partition

# 示例
node = hash_partition("user_123", 10)
```

### 一致性哈希

```python
class ConsistentHashing:
    def __init__(self, nodes, replicas=3):
        self.ring = {}
        self.sorted_keys = []
        self.replicas = replicas

        for node in nodes:
            self.add_node(node)

    def add_node(self, node):
        for i in range(self.replicas):
            key = self._hash(f"{node}:{i}")
            self.ring[key] = node
            self.sorted_keys.append(key)
        self.sorted_keys.sort()

    def get_node(self, key):
        if not self.ring:
            return None

        hash_value = self._hash(key)
        idx = bisect.bisect(self.sorted_keys, hash_value)
        return self.ring[self.sorted_keys[idx % len(self.ring)]]
```

### 范围分区

```sql
-- 按用户 ID 范围分区
SELECT * FROM users
WHERE user_id >= 0 AND user_id < 10000;  -- 节点 1

SELECT * FROM users
WHERE user_id >= 10000 AND user_id < 20000;  -- 节点 2
```

## 数据复制

### 主从复制

```
写操作 → 主节点 → 同步到从节点
               ↓
           从节点 1
           从节点 2
```

### 多主复制

```
主节点 1 ←→ 主节点 2 ←→ 主节点 3
   ↓           ↓           ↓
 从节点     从节点     从节点
```

### Quorum 机制

```
W + R > N

W: 写成功的节点数
R: 读成功的节点数
N: 副本总数
```

## 常见架构

### GFS 架构

```
Client
   ↓
Master (元数据管理)
   ↓
ChunkServer 1  ChunkServer 2  ChunkServer 3
```

### HDFS 架构

```
Client
   ↓
NameNode (元数据)
   ↓
DataNode 1  DataNode 2  DataNode 3
```

### CEPH 架构

```
Client
   ↓
RADOS (Reliable Autonomic Distributed Object Store)
   ↓
 OSD 1  OSD 2  OSD 3
   ↓
Monitor (集群监控)
```

## 一致性协议

### Paxos

```
1. Prepare 阶段
   Proposer 向多数 Acceptor 发送 prepare 消息

2. Accept 阶段
   Acceptor 返回承诺，Proposer 发送 accept 消息

3. Learn 阶段
   Learner 学习已选中的值
```

### Raft

```
1. Leader 选举
   - Follower 超时成为 Candidate
   - 获得过半投票成为 Leader

2. 日志复制
   - Leader 接收客户端请求
   - Leader 复制日志到 Follower
   - 等待过半 Follower 响应

3. 安全性
   -日志连续性
   - 选举限制
```

## 性能优化

### 缓存策略

```python
class Cache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.lru = []

    def get(self, key):
        if key in self.cache:
            self.lru.remove(key)
            self.lru.append(key)
            return self.cache[key]
        return None

    def put(self, key, value):
        if len(self.cache) >= self.capacity:
            removed = self.lru.pop(0)
            del self.cache[removed]
        self.cache[key] = value
        self.lru.append(key)
```

### 数据压缩

```python
import gzip

# 压缩数据
compressed_data = gzip.compress(data.encode())

# 解压数据
original_data = gzip.decompress(compressed_data).decode()
```

### 分片索引

```sql
-- 创建分片索引
CREATE TABLE users_shard (
    user_id BIGINT,
    shard_id INT,
    user_info JSON
) PARTITION BY HASH(shard_id) PARTITIONS 16;

-- 查询时定位分片
SELECT * FROM users_shard
WHERE shard_id = user_id % 16;
```

## 监控和运维

### 健康检查

```python
def check_node_health(node):
    """检查节点健康状态"""
    try:
        response = requests.get(f"{node}/health", timeout=3)
        return response.status_code == 200
    except:
        return False

# 定期检查
for node in nodes:
    for attempt in range(3):
        if check_node_health(node):
            break
    else:
        mark_node_unhealthy(node)
```

### 数据平衡

```python
def rebalance_data(nodes):
    """重新平衡数据"""
    load = get_node_load(nodes)
    overloaded = [n for n in nodes if load[n] > threshold]
    underloaded = [n for n in nodes if load[n] < threshold]

    for src, dst in zip(overloaded, underloaded):
        move_data(src, dst)
```
