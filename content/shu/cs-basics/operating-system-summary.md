---
title:
  zh: 操作系统总结
  en: Operating System Summary
date: 2024-02-12
category: shu
subcategory: cs-basics
tags: [操作系统, OS, 计算机系统]
description:
  zh: 操作系统核心概念和重要机制，包括进程管理、内存管理和文件系统。
  en: Operating system core concepts and important mechanisms, including process management, memory management, and file systems.
author: shaynewq
draft: false
---

# 操作系统总结

操作系统是计算机系统的基础软件，管理计算机硬件和软件资源，为应用程序提供服务。

## 进程管理

### 进程状态

```
                    创建
                      ↓
    ┌────────────────就绪────────────────┐
    │                                    ↓
    ↓                                  运行
    ↖  ┌────────↗  ←─────────────────↙  │
  阻塞 │   时间片用完 / 抢占   I/O 请求 │
    ↓  └─────────┴─────────────────────┘
    事件完成（I/O 完成）
```

### 进程创建

```python
import os
import time

# 进程创建示例
def child_process():
    """子进程"""
    print(f"子进程 PID: {os.getpid()}")
    print(f"父进程 PID: {os.getppid()}")
    time.sleep(2)

def main():
    """创建子进程"""
    print(f"主进程 PID: {os.getpid()}")

    pid = os.fork()

    if pid == 0:
        # 子进程
        child_process()
    else:
        # 父进程
        print(f"创建了子进程 PID: {pid}")
        os.waitpid(pid, 0)  # 等待子进程结束
        print("子进程已结束")

if __name__ == "__main__":
    main()
```

### 进程间通信

```python
import multiprocessing as mp

def sender(queue):
    """发送者进程"""
    messages = ["消息 1", "消息 2", "消息 3"]
    for msg in messages:
        queue.put(msg)
        print(f"发送: {msg}")

def receiver(queue):
    """接收者进程"""
    while True:
        msg = queue.get()
        print(f"接收: {msg}")
        if msg == "消息 3":
            break

if __name__ == "__main__":
    # 创建通信队列
    queue = mp.Queue()

    # 创建进程
    p1 = mp.Process(target=sender, args=(queue,))
    p2 = mp.Process(target=receiver, args=(queue,))

    # 启动进程
    p1.start()
    p2.start()

    # 等待进程结束
    p1.join()
    p2.join()
```

## 线程管理

### 线程同步

```python
import threading
import time

class Counter:
    """线程安全的计数器"""
    def __init__(self):
        self.value = 0
        self.lock = threading.Lock()

    def increment(self):
        """增加计数器值"""
        with self.lock:
            self.value += 1

def worker(counter, num_increments):
    """工作线程"""
    for _ in range(num_increments):
        counter.increment()

# 创建计数器
counter = Counter()

# 创建多个线程
threads = []
for i in range(10):
    t = threading.Thread(target=worker, args=(counter, 10000))
    threads.append(t)
    t.start()

# 等待所有线程完成
for t in threads:
    t.join()

print(f"最终计数: {counter.value}")
```

### 线程池

```python
from concurrent.futures import ThreadPoolExecutor
import time

def task(task_id):
    """模拟任务"""
    print(f"任务 {task_id} 开始")
    time.sleep(1)
    print(f"任务 {task_id} 完成")
    return f"结果 {task_id}"

def main():
    # 创建线程池
    with ThreadPoolExecutor(max_workers=3) as executor:
        # 提交任务
        future1 = executor.submit(task, 1)
        future2 = executor.submit(task, 2)
        future3 = executor.submit(task, 3)

        # 获取结果
        results = [future1.result(), future2.result(), future3.result()]
        print(f"所有任务完成: {results}")

if __name__ == "__main__":
    main()
```

## 内存管理

### 虚拟内存

```python
# 内存分配算法
class MemoryAllocator:
    """内存分配器"""

    def __init__(self, total_memory):
        self.total_memory = total_memory
        self.memory_blocks = [(0, total_memory, False)]  # (start, size, used)

    def allocate(self, size):
        """分配内存块（首次适应算法）"""
        for i, (start, block_size, used) in enumerate(self.memory_blocks):
            if not used and block_size >= size:
                # 找到合适的空闲块
                remaining = block_size - size
                self.memory_blocks[i] = (start, size, True)

                if remaining > 0:
                    # 分割剩余空间
                    self.memory_blocks.insert(i + 1, (start + size, remaining, False))

                return start + i * 1000  # 返回虚拟地址

        raise MemoryError("内存不足")

    def deallocate(self, address):
        """释放内存块"""
        # 简化实现：标记为未使用
        for i, (start, size, used) in enumerate(self.memory_blocks):
            if used and start + i * 1000 == address:
                self.memory_blocks[i] = (start, size, False)
                # 合并相邻的空闲块（略）
                return

        raise ValueError("无效的内存地址")

# 使用示例
allocator = MemoryAllocator(1024)
addr1 = allocator.allocate(256)
print(f"分配地址: {addr1}")

allocator.deallocate(addr1)
print("内存已释放")
```

### 页面置换算法

```python
class PageReplacement:
    """页面置换算法"""

    def __init__(self, frame_count):
        self.frame_count = frame_count
        self.frames = []

    def fifo(self, reference_string):
        """先进先出（FIFO）"""
        frames = []
        page_faults = 0
        page_queue = []

        for page in reference_string:
            if page not in frames:
                page_faults += 1
                if len(frames) < self.frame_count:
                    frames.append(page)
                    page_queue.append(page)
                else:
                    # 移除最早加入的页面
                    oldest = page_queue.pop(0)
                    frames.remove(oldest)
                    frames.append(page)
                    page_queue.append(page)

        return {
            'algorithm': 'FIFO',
            'page_faults': page_faults,
            'reference_length': len(reference_string),
            'frames': frames
        }

    def lru(self, reference_string):
        """最近最少使用（LRU）"""
        frames = []
        page_faults = 0
        page_timestamps = {}

        for i, page in enumerate(reference_string):
            if page not in frames:
                page_faults += 1
                if len(frames) < self.frame_count:
                    frames.append(page)
                else:
                    # 找出最久未使用的页面
                    lru_page = min(frames, key=lambda p: page_timestamps[p])
                    frames.remove(lru_page)
                    frames.append(page)
            page_timestamps[page] = i

        return {
            'algorithm': 'LRU',
            'page_faults': page_faults,
            'reference_length': len(reference_string),
            'frames': frames
        }

# 使用示例
reference = [1, 2, 3, 4, 2, 5, 1, 2, 3, 4, 5]
pr = PageReplacement(3)

print("\n页面置换算法比较:")
print(pr.fifo(reference))
print(pr.lru(reference))
```

## 文件系统

### 目录结构

```python
import os

class FileSystem:
    """简单的文件系统模拟"""

    def __init__(self, root_dir):
        self.root_dir = root_dir
        self.current_dir = root_dir

    def mkdir(self, dirname):
        """创建目录"""
        new_dir = os.path.join(self.current_dir, dirname)
        os.makedirs(new_dir, exist_ok=True)

    def touch(self, filename, content=""):
        """创建文件"""
        filepath = os.path.join(self.current_dir, filename)
        with open(filepath, 'w') as f:
            f.write(content)

    def ls(self):
        """列出当前目录内容"""
        items = os.listdir(self.current_dir)
        for item in sorted(items):
            path = os.path.join(self.current_dir, item)
            if os.path.isdir(path):
                print(f"[目录] {item}")
            else:
                print(f"[文件] {item}")

    def cd(self, dirname):
        """切换目录"""
        if dirname == "..":
            self.current_dir = os.path.dirname(self.current_dir)
        else:
            new_dir = os.path.join(self.current_dir, dirname)
            if os.path.exists(new_dir):
                self.current_dir = new_dir
            else:
                raise FileNotFoundError(f"目录不存在: {dirname}")

    def pwd(self):
        """打印当前目录"""
        print(self.current_dir)

# 使用示例
fs = FileSystem("/tmp/test_fs")
fs.mkdir("docs")
fs.mkdir("images")
fs.cd("docs")
fs.touch("readme.txt", "这是一个 README 文件")
fs.touch("guide.txt", "这是指南文档")
fs.ls()
fs.pwd()
```

### 文件权限

```python
import stat
import os

def display_permissions(filepath):
    """显示文件权限"""
    # 获取文件模式
    file_stat = os.stat(filepath)
    mode = file_stat.st_mode

    # 解析权限
    permissions = {
        'read_owner': bool(mode & stat.S_IRUSR),
        'write_owner': bool(mode & stat.S_IWUSR),
        'execute_owner': bool(mode & stat.S_IXUSR),
        'read_group': bool(mode & stat.S_IRGRP),
        'write_group': bool(mode & stat.S_IWGRP),
        'execute_group': bool(mode & stat.S_IXGRP),
        'read_other': bool(mode & stat.S_IROTH),
        'write_other': bool(mode & stat.S_IWOTH),
        'execute_other': bool(mode & stat.S_IXOTH)
    }

    # 转换为 ls -l 风格
    ls_style = []
    ls_style.append('d' if stat.S_ISDIR(mode) else '-')  # 目录标志

    # Owner 权限
    ls_style.extend([
        'r' if permissions['read_owner'] else '-',
        'w' if permissions['write_owner'] else '-',
        'x' if permissions['execute_owner'] else '-'
    ])

    # Group 权限
    ls_style.extend([
        'r' if permissions['read_group'] else '-',
        'w' if permissions['write_group'] else '-',
        'x' if permissions['execute_group'] else '-'
    ])

    # Other 权限
    ls_style.extend([
        'r' if permissions['read_other'] else '-',
        'w' if permissions['write_other'] else '-',
        'x' if permissions['execute_other'] else '-'
    ])

    return ''.join(ls_style)

# 使用示例
filename = "/tmp/test.txt"
with open(filename, 'w') as f:
    f.write("test")

print(f"文件权限: {display_permissions(filename)}")
```

## I/O 管理

### 异步 I/O

```python
import asyncio

async def handle_client(reader, writer):
    """处理客户端连接"""
    data = await reader.read(100)
    message = data.decode()
    print(f"收到消息: {message}")

    # 发送响应
    response = f"收到: {message}"
    writer.write(response.encode())
    await writer.drain()

    writer.close()
    await writer.wait_closed()

async def main():
    """异步服务器"""
    server = await asyncio.start_server(handle_client, '127.0.0.1', 8888)

    addr = server.sockets[0].getsockname()
    print(f"服务器运行在 {addr}")

    async with server:
        await server.serve_forever()

# 使用示例
# asyncio.run(main())
```

## 最佳实践

1. **进程管理**: 合理控制进程数量和优先级
2. **内存优化**: 及时释放内存，避免内存泄漏
3. **线程安全**: 使用锁保护共享资源
4. **文件操作**: 及时关闭文件，使用 with 语句
5. **错误处理**: 完善的异常处理机制
6. **性能监控**: 监控系统资源使用情况
