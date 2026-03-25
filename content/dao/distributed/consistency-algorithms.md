---
title:
  zh: 一致性算法
  en: Consistency Algorithms
date: 2024-02-25
category: dao
subcategory: distributed
tags: [一致性算法, Raft, Paxos, 分布式]
description:
  zh: 深入了解分布式一致性算法，包括 Raft、Paxos 等。
  en: Deep dive into distributed consistency algorithms, including Raft, Paxos, and more.
author: shaynewq
draft: false
---

# 一致性算法

分布式系统中的一致性算法确保多个节点在面临网络分区等故障时，仍能保持数据的一致性。

## 分布式一致性

### FLP 不可能定理

FLP 定理指出了在异步分布式系统中，即使只有一个进程失败，也不存在能够保证一致性的确定性算法。

### 分布式系统的挑战

- **网络分区**: 节点间无法通信
- **节点故障**: 节点宕机或响应超时
- **消息丢失**: 消息可能丢失或重复
- **时钟同步**: 不同节点时钟不一致

## Raft 算法

### 算法概述

Raft 是一种易于理解的分布式一致性算法，主要用于管理日志复制。

### 核心组件

```python
import time
import copy
from enum import Enum

class NodeState(Enum):
    """节点状态"""
    FOLLOWER = 'follower'
    CANDIDATE = 'candidate'
    LEADER = 'leader'

class LogEntry:
    """日志条目"""
    def __init__(self, term, index, command):
        self.term = term
        self.index = index
        self.command = command

class RaftNode:
    """Raft 节点"""

    def __init__(self, node_id, peers):
        self.node_id = node_id
        self.peers = peers  # 其他节点列表

        # 持久化状态
        self.current_term = 0
        self.voted_for = None
        self.log = []  # 日志条目数组

        # 易失性状态
        self.state = NodeState.FOLLOWER
        self.commit_index = 0
        self.last_applied = 0

        # Leader 特有状态
        self.next_index = {}  # 发送给 follower 的下一个日志索引
        self.match_index = {}  # follower 已复制的最高日志索引

        # 超时时间
        self.election_timeout = 3  # 选举超时
        self.heartbeat_timeout = 0.1  # 心跳超时

        # 定时器
        self.last_heartbeat = time.time()
        self.last_vote_time = time.time()

        # 领导者
        self.leader_id = None

        # 初始化 next_index 和 match_index
        self._init_leader_state()

    def _init_leader_state(self):
        """初始化 Leader 状态"""
        for peer in self.peers:
            self.next_index[peer] = len(self.log) + 1
            self.match_index[peer] = 0

    def tick(self):
        """每个时钟周期调用"""
        if self.state == NodeState.LEADER:
            self._send_heartbeat()
        elif self.state == NodeState.FOLLOWER:
            if time.time() - self.last_heartbeat > self.election_timeout:
                self._become_candidate()
        elif self.state == NodeState.CANDIDATE:
            if time.time() - self.last_vote_time > self.election_timeout:
                self._become_candidate()

    def _become_candidate(self):
        """成为候选人"""
        self.state = NodeState.CANDIDATE
        self.current_term += 1
        self.voted_for = self.node_id
        self.last_vote_time = time.time()
        print(f"Node {self.node_id}: Becoming candidate for term {self.current_term}")

        # 开始选举
        self._request_vote()

    def _request_vote(self):
        """请求投票"""
        votes = 1  # 自己的票

        for peer in self.peers:
            if self._send_request_vote(peer):
                votes += 1

        # 如果获得大多数票，成为 Leader
        majority = len(self.peers) // 2 + 1
        if votes >= majority:
            self._become_leader()
        else:
            # 选举失败，重新开始
            self.state = NodeState.FOLLOWER

    def _send_request_vote(self, peer):
        """向 peer 发送投票请求"""
        # 简化实现：假设总是收到投票
        print(f"Node {self.node_id} requesting vote from {peer}")
        # 实际实现中需要通过网络发送请求
        return True

    def _become_leader(self):
        """成为 Leader"""
        self.state = NodeState.LEADER
        self.leader_id = self.node_id
        print(f"Node {self.node_id}: Becoming leader for term {self.current_term}")
        self._init_leader_state()
        self._send_heartbeat()

    def _send_heartbeat(self):
        """发送心跳"""
        if time.time() - self.last_heartbeat < self.heartbeat_timeout:
            return

        self.last_heartbeat = time.time()
        print(f"Node {self.node_id}: Sending heartbeat")

        for peer in self.peers:
            self._append_entries(peer)

        # 串行提交未提交的日志
        self._commit_logs()

    def _append_entries(self, peer):
        """追加日志条目"""
        next_idx = self.next_index[peer]

        if next_idx <= 0:
            entries = []
            prev_log_index = 0
            prev_log_term = 0
        else:
            entries = self.log[next_idx - 1:]
            prev_log_index = next_idx - 1
            prev_log_term = self.log[prev_log_index - 1].term if prev_log_index > 0 else 0

        print(f"Node {self.node_id}: Sending entries to {peer}, entries: {entries}")

        # 简化实现：假设总是成功
        if entries:
            self.match_index[peer] = next_idx + len(entries) - 1
            self.next_index[peer] = next_idx + len(entries)

    def _commit_logs(self):
        """提交日志"""
        # 找到大多数节点都已复制的日志索引
        for idx in range(len(self.log), -1, -1):
            if self._is_quorum_replicated(idx):
                if idx > self.commit_index and self.log[idx - 1].term == self.current_term:
                    self.commit_index = idx
                    print(f"Node {self.node_id}: Committing log at index {idx}")
                break

    def _is_quorum_replicated(self, index):
        """检查日志是否被大多数节点复制"""
        count = 1  # Leader 自己

        for peer in self.peers:
            if self.match_index[peer] >= index:
                count += 1

        return count > len(self.peers) // 2

    def receive_append_entries(self, leader_id, term, prev_log_index, prev_log_term, entries, leader_commit):
        """接收 AppendEntries 消息"""
        if term < self.current_term:
            return False  # 拒绝旧 Term 的请求

        if term > self.current_term:
            self.current_term = term

        self.state = NodeState.FOLLOWER
        self.leader_id = leader_id
        self.last_heartbeat = time.time()

        # 检查日志一致性
        if prev_log_index > 0:
            if len(self.log) < prev_log_index or self.log[prev_log_index - 1].term != prev_log_term:
                return False

        # 追加日志
        if entries:
            self.log.extend([LogEntry(e['term'], e['index'], e['command']) for e in entries])

        # 更新提交索引
        if leader_commit > self.commit_index:
            self.commit_index = min(leader_commit, len(self.log))

        return True

    def receive_request_vote(self, candidate_id, term, last_log_index, last_log_term):
        """接收投票请求"""
        if term < self.current_term:
            return False

        if term > self.current_term:
            self.current_term = term
            self.voted_for = None

        if self.voted_for is None or self.voted_for == candidate_id:
            # 检查日志是否至少一样新
            my_last_index = len(self.log)
            my_last_term = self.log[-1].term if self.log else 0

            if last_log_term > my_last_term or (last_log_term == my_last_term and last_log_index >= my_last_index):
                self.voted_for = candidate_id
                print(f"Node {self.node_id}: Voting for {candidate_id}")
                return True

        return False

    def apply_command(self, command):
        """应用命令"""
        if self.state == NodeState.LEADER:
            new_entry = LogEntry(
                term=self.current_term,
                index=len(self.log) + 1,
                command=command
            )
            self.log.append(new_entry)
            print(f"Node {self.node_id}: Command '{command}' added to log at index {new_entry.index}")
            return True
        else:
            print(f"Node {self.node_id}: Cannot apply command, not a Leader")
            return False

# 使用示例
def simulate_raft_cluster():
    """模拟 Raft 集群"""
    nodes = {}
    node_ids = ['node1', 'node2', 'node3', 'node4', 'node5']

    # 创建节点
    for node_id in node_ids:
        peers = [n for n in node_ids if n != node_id]
        nodes[node_id] = RaftNode(node_id, peers)

    # 模拟选举
    for i in range(10):
        for node_id, node in nodes.items():
            node.tick()

    return nodes

print("Raft 集群模拟:")
cluster = simulate_raft_cluster()
```

## Paxos 算法

### 算法概述

Paxos 是一种基于消息传递的分布式一致性算法，用于在不可靠的分布式系统中达成一致。

### 算法实现

```python
class PaxosNode:
    """Paxos 节点"""

    def __init__(self, node_id):
        self.node_id = node_id
        self.proposed_value = None
        self.promised_proposal = None
        self.accepted_proposal = None
        self.accepted_value = None

    def prepare(self, proposal_number):
        """Prepare 阶段"""
        print(f"Node {self.node_id}: Prepare with proposal {proposal_number}")

        if self.promised_proposal is None or proposal_number > self.promised_proposal:
            self.promised_proposal = proposal_number
            return (True, self.accepted_proposal, self.accepted_value)
        else:
            return (False, self.accepted_proposal, self.accepted_value)

    def accept(self, proposal_number, value):
        """Accept 阶段"""
        print(f"Node {self.node_id}: Accept {value} with proposal {proposal_number}")

        if proposal_number >= self.promised_proposal:
            self.accepted_proposal = proposal_number
            self.accepted_value = value
            return True
        else:
            return False

class Paxos:
    """Paxos 协调者"""

    def __init__(self, nodes):
        self.nodes = nodes
        self.proposal_number = 0

    def propose(self, value):
        """提议值"""
        self.proposal_number += 1
        print(f"\nStarting Paxos round {self.proposal_number} for value '{value}'")

        # Prepare 阶段
        promises = []
        accepted_proposal = None
        accepted_value = None

        for node in self.nodes:
            result, acc_prop, acc_val = node.prepare(self.proposal_number)
            if result:
                promises.append(node)
                if acc_val is not None:
                    accepted_value = acc_val
                    accepted_proposal = acc_prop

        # 检查是否获得多数承诺
        majority = len(self.nodes) // 2 + 1
        if len(promises) < majority:
            print(f"Failed: Only {len(promises)} promises, need {majority}")
            return None

        # 如果有节点已经接受了值，使用该值
        if accepted_value is not None:
            value = accepted_value

        # Accept 阶段
        acceptances = 0
        for node in promises:
            if node.accept(self.proposal_number, value):
                acceptances += 1

        # 检查是否达成一致
        if acceptances >= majority:
            print(f"Consensus reached! Value '{value}' accepted")
            return value
        else:
            print(f"Failed: Only {acceptances} acceptances, need {majority}")
            return None

# 使用示例
def simulate_paxos():
    """模拟 Paxos 算法"""
    nodes = [PaxosNode(f"node{i}") for i in range(1, 6)]
    paxos = Paxos(nodes)

    # 第一次提议
    result1 = paxos.propose("X")
    print(f"First proposal result: {result1}")

    # 第二次提议（冲突）
    result2 = paxos.propose("Y")
    print(f"Second proposal result: {result2}")

    return nodes

print("\nPaxos 算法模拟:")
simulate_paxos()
```

## ZAB 协议

### ZAB 概述

ZAB (ZooKeeper Atomic Broadcast) 是 ZooKeeper 用于保证分布式一致性的原子广播协议。

### 核心机制

```python
class ZABNode:
    """ZAB 节点"""

    def __init__(self, node_id, peers):
        self.node_id = node_id
        self.peers = peers
        self.state = 'follower'  # follower, leader, electing_follower
        self.epoch = 0
        self.history = {}  # 事务历史
        self.last_zxid = 0

    def broadcast_proposal(self, proposal):
        """广播提议"""
        if self.state != 'leader':
            return False

        self.last_zxid = self._new_zxid()
        print(f"Node {self.node_id}: Broadcasting proposal {proposal} with ZXID {self.last_zxid}")

        # 等待多数确认
        acknowledgments = 0
        for peer in self.peers:
            if peer._receive_proposal(self.last_zxid, proposal):
                acknowledgments += 1

        majority = len(self.peers) // 2 + 1
        if acknowledgments >= majority:
            self._commit_proposal(self.last_zxid)
            return True
        return False

    def _receive_proposal(self, zxid, proposal):
        """接收提议"""
        print(f"Node {self.node_id}: Received proposal {proposal} with ZXID {zxid}")
        self.history[zxid] = proposal
        return True

    def _commit_proposal(self, zxid):
        """提交提议"""
        print(f"Node {self.node_id}: Committing proposal with ZXID {zxid}")

    def _new_zxid(self):
        """生成新的 ZXID"""
        return self.epoch << 32 + 1

    def leader_election(self):
        """领导者选举"""
        self.state = 'electing_follower'
        self.epoch += 1
        # 简化选举过程
        candidates = sorted(self.peers + [self], key=lambda n: n.node_id)
        leader = candidates[0]

        # 所有节点跟随新的领导者
        for node in self.peers + [self]:
            if node == leader:
                node.state = 'leader'
            else:
                node.state = 'follower'
                node.leader_id = leader.node_id

        print(f"Node {self.node_id}: New epoch {self.epoch}, Leader is {leader.node_id}")
```

## 最佳实践

1. **算法选择**: 根据场景选择合适的一致性算法
2. **日志持久化**: 确保日志正确持久化
3. **网络分区**: 正确处理网络分区情况
4. **性能优化**: 优化算法性能
5. **监控告警**: 监控集群状态
6. **故障恢复**: 完善的故障恢复机制
7. **测试验证**: 充分的测试覆盖
