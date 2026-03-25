---
title:
  zh: TCP 协议详解
  en: TCP Protocol Deep Dive
date: 2024-02-08
category: 术
subcategory: 网络
tags: [TCP, 网络协议, 传输层]
description:
  zh: 深入了解 TCP 协议的工作原理、三次握手和流量控制机制。
  en: Deep dive into TCP protocol principles, three-way handshake, and flow control mechanisms.
author: shaynewq
draft: false
---

# TCP 协议详解

TCP（Transmission Control Protocol）是传输层的重要协议，提供可靠的、面向连接的字节流服务。

## TCP 特性

### 核心特性

- **可靠传输**: 确认和重传机制
- **面向连接**: 建立连接后传输数据
- **字节流**: 以字节流方式传输数据
- **全双工**: 双向同时传输
- **流量控制**: 滑动窗口机制
- **拥塞控制**: 慢启动、拥塞避免
- **有序传输**: 使用序列号保证顺序

## 建立连接

### 三次握手

```
客户端                              服务器
  |                                   |
  |  --- SYN, Seq=x ----------------> |
  |                                   | SYN_RCVD
  |  <--- SYN, ACK, Seq=y, Ack=x+1 --|
  |  ESTABLISHED                      |
  |  --- ACK, Ack=y+1 --------------> |
  |  ESTABLISHED                      |
```

**为什么需要三次握手？**

1. 确认双方的接收和发送能力正常
2. 防止已失效的连接请求突然传到服务端
3. 同步双方的初始序列号

### 使用 Wireshark 分析

```bash
# 使用 tcpdump 抓包
sudo tcpdump -i any -n 'tcp[tcpflags] & (tcp-syn|tcp-ack) != 0 and port 80'

# 使用 tshark 解析
tshark -i any -Y 'tcp.flags.syn==1 or tcp.flags.ack==1' -V
```

## 数据传输

### 序列号和确认号

```python
# TCP 报文段结构
class TCPSegment:
    def __init__(self):
        self.src_port = 0          # 源端口
        self.dst_port = 0          # 目标端口
        self.seq_num = 0           # 序列号
        self.ack_num = 0           # 确认号
        self.data_offset = 5       # 数据偏移
        self.flags = 0             # 标志位
        self.window_size = 0       # 窗口大小
        self.checksum = 0          # 校验和
        self.urgent_ptr = 0        # 紧急指针
        self.data = b''            # 数据

    # 标志位定义
    FIN = 0x01    # 结束连接
    SYN = 0x02    # 同步序列号
    RST = 0x04    # 重置连接
    PSH = 0x08    # 推送
    ACK = 0x10    # 确认
    URG = 0x20    # 紧急

# 计算序列号
def calculate_seq_num(base_seq, data_len):
    return base_seq + data_len

# 计算确认号
def calculate_ack_num(received_seq, received_len):
    return received_seq + received_len
```

### 滑动窗口

```python
class SlidingWindow:
    """滑动窗口实现"""

    def __init__(self, window_size):
        self.window_size = window_size
        self.send_base = 0        # 发送窗口下界
        self.next_seq_num = 0     # 下一个序列号
        self.received_ack = {}    # 收到的 ACK
        self.buffer = {}          # 发送缓冲区

    def can_send(self):
        """检查是否可以发送"""
        return self.next_seq_num < self.send_base + self.window_size

    def send_data(self, data):
        """发送数据"""
        if self.can_send():
            seq_num = self.next_seq_num
            self.buffer[seq_num] = data
            self.next_seq_num += len(data)
            return seq_num
        return None

    def receive_ack(self, ack_num):
        """接收 ACK"""
        if ack_num > self.send_base:
            # 滑动窗口
            for seq in range(self.send_base, ack_num):
                if seq in self.buffer:
                    del self.buffer[seq]
            self.send_base = ack_num
            self.received_ack[ack_num] = True
            return True
        return False

    def retransmit(self, ack_num):
        """重传丢失的数据"""
        lost_seq = ack_num
        if lost_seq in self.buffer:
            return lost_seq, self.buffer[lost_seq]
        return None, None
```

## 控制机制

### 流量控制

```python
class FlowControl:
    """流量控制 - 滑动窗口调整"""

    def __init__(self, max_window_size=65535):
        self.max_window_size = max_window_size
        self.current_window = max_window_size
        self.unacked_bytes = 0
        self.buffer_size = max_window_size

    def update_window(self, new_window):
        """更新窗口大小"""
        self.current_window = min(new_window, self.max_window_size)

    def can_send(self, data_size):
        """检查是否可以发送"""
        return self.unacked_bytes + data_size <= self.current_window

    def bytes_sent(self, data_size):
        """记录已发送但未确认的字节"""
        self.unacked_bytes += data_size

    def bytes_acked(self, acked_bytes):
        """记录已确认的字节"""
        self.unacked_bytes = max(0, self.unacked_bytes - acked_bytes)
```

### 拥塞控制

```python
class CongestionControl:
    """拥塞控制"""

    def __init__(self):
        self.cwnd = 1              # 拥塞窗口
        self.ssthresh = 65535      # 慢启动阈值
        self.state = 'slow_start'  # 状态: slow_start, congestion_avoidance, fast_recovery

    def on_ack(self):
        """收到 ACK 时的处理"""
        if self.state == 'slow_start':
            # 慢启动: 窗口指数增长
            self.cwnd *= 2
        elif self.state == 'congestion_avoidance':
            # 拥塞避免: 窗口线性增长
            self.cwnd += 1
        elif self.state == 'fast_recovery':
            # 快速恢复
            self.cwnd += 1

        # 检查是否进入拥塞避免
        if self.cwnd >= self.ssthresh and self.state == 'slow_start':
            self.state = 'congestion_avoidance'

    def on_timeout(self):
        """超时处理"""
        # 降低阈值
        self.ssthresh = max(1, self.cwnd // 2)
        # 重置窗口
        self.cwnd = 1
        # 进入慢启动
        self.state = 'slow_start'

    def on_triple_dup_ack(self):
        """三次重复 ACK 处理"""
        if self.state != 'fast_recovery':
            # 降低阈值
            self.ssthresh = max(1, self.cwnd // 2)
            # 设置窗口大小为阈值 + 3
            self.cwnd = self.ssthresh + 3
            # 进入快速恢复
            self.state = 'fast_recovery'
        else:
            self.cwnd += 1
```

## 测试工具

### 使用 Python 测试 TCP 连接

```python
import socket
import time

def test_tcp_connection(host, port, timeout=5):
    """测试 TCP 连接"""

    try:
        # 创建 socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)

        # 记录开始时间
        start_time = time.time()

        # 建立连接
        sock.connect((host, port))

        # 记录连接时间
        connect_time = time.time() - start_time

        # 发送数据
        sock.send(b"GET / HTTP/1.1\r\nHost: {}\r\n\r\n".format(host.encode()))

        # 接收响应
        response = sock.recv(4096)

        # 关闭连接
        sock.close()

        return {
            'success': True,
            'connect_time': connect_time,
            'response_length': len(response)
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# 测试连接
result = test_tcp_connection('example.com', 80)
print(result)
```

### 使用 Netstat 查看 TCP 连接

```bash
# 查看所有 TCP 连接
netstat -ant

# 查看监听端口
netstat -antl

# 查看连接状态统计
netstat -ant | awk '{print $6}' | sort | uniq -c | sort -rn
```

## 性能优化

### TCP 调优参数

```bash
# /etc/sysctl.conf

# 增加 TCP 接收缓冲区
net.core.rmem_max = 12582912
net.core.rmem_default = 65536
net.ipv4.tcp_rmem = 4096 87380 12582912

# 增加 TCP 发送缓冲区
net.core.wmem_max = 12582912
net.core.wmem_default = 65536
net.ipv4.tcp_wmem = 4096 65536 12582912

# 启用 TCP 时间戳
net.ipv4.tcp_timestamps = 1

# 启用 TCP 选择性确认
net.ipv4.tcp_sack = 1

# 增加 TCP 支持的最大连接数
net.ipv4.tcp_max_syn_backlog = 8192
net.core.somaxconn = 8192

# 减少超时重传时间
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1800
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_intvl = 30
```

## 常见问题

### TIME_WAIT 状态过多

```bash
# 查看 TIME_WAIT 连接
netstat -ant | grep TIME_WAIT | wc -l

# 减少TIME_WAIT 超时时间
echo 30 > /proc/sys/net/ipv4/tcp_fin_timeout

# 快速回收 TIME_WAIT sockets
echo 1 > /proc/sys/net/ipv4/tcp_tw_recycle
```

### 连接重置

```bash
# 查看连接重置
netstat -ant | grep RST

# 检查防火墙规则
iptables -L -n -v

# 检查路由表
route -n
```

## 最佳实践

1. **合理设置窗口大小**: 根据网络状况调整
2. **启用 TCP 优化**: 时间戳、SACK 等
3. **监控连接状态**: 及时发现异常
4. **合理设置超时**: 避免资源浪费
5. **使用连接池**: 减少连接建立开销
6. **错误处理**: 完善的错误处理和重试机制
