---
title:
  zh: Go 并发编程
  en: Go Concurrency Programming
date: 2024-01-28
category: 器
subcategory: 开发
tags: [golang, go, 并发编程]
description:
  zh: 深入了解 Go 语言的并发编程模型，掌握 Goroutine 和 Channel 的使用。
  en: Deep dive into Go language concurrency model, master Goroutine and Channel usage.
author: shaynewq
draft: false
---

# Go 并发编程

Go 语言的并发模型基于 CSP（Communicating Sequential Processes）理论，主要通过 Goroutine 和 Channel 实现。

## Goroutine

### 基本使用

```go
package main

import (
    "fmt"
    "time"
)

func sayHello(name string) {
    for i := 0; i < 5; i++ {
        fmt.Printf("Hello, %s!\n", name)
        time.Sleep(100 * time.Millisecond)
    }
}

func main() {
    // 启动 goroutine
    go sayHello("Alice")
    go sayHello("Bob")

    // 等待 goroutine 完成
    time.Sleep(1 * time.Second)
}
```

### 等待 Goroutine 完成

```go
package main

import (
    "fmt"
    "sync"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Printf("Worker %d starting\n", id)
    // 模拟工作
    time.Sleep(time.Second)
    fmt.Printf("Worker %d done\n", id)
}

func main() {
    varsync.WaitGroup{}

    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go worker(i, &wg)
    }

    wg.Wait()
    fmt.Println("All workers completed")
}
```

## Channel

### 创建和使用 Channel

```go
package main

import "fmt"

func main() {
    // 创建无缓冲 channel
    ch := make(chan int)

    go func() {
        ch <- 42  // 发送数据
    }()

    val := <-ch  // 接收数据
    fmt.Println("Received:", val)
}
```

### 缓冲 Channel

```go
package main

import "fmt"

func main() {
    // 创建缓冲 channel
    ch := make(chan int, 3)

    ch <- 1
    ch <- 2
    ch <- 3

    fmt.Println(<-ch)
    fmt.Println(<-ch)
    fmt.Println(<-ch)
}
```

### Channel 方向

```go
// 只发送
func sendOnly(ch chan<- int) {
    ch <- 42
}

// 只接收
func receiveOnly(ch <-chan int) {
    val := <-ch
    fmt.Println(val)
}
```

## Select 语句

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    go func() {
        time.Sleep(time.Second)
        ch1 <- "from ch1"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "from ch2"
    }()

    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println(msg1)
        case msg2 := <-ch2:
            fmt.Println(msg2)
        case <-time.After(3 * time.Second):
            fmt.Println("timeout")
        }
    }
}
```

## Context

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func worker(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d: %v\n", id, ctx.Err())
            return
        default:
            fmt.Printf("Worker %d working...\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())

    for i := 1; i <= 3; i++ {
        go worker(ctx, i)
    }

    time.Sleep(2 * time.Second)
    cancel()  // 取消所有 goroutine
    time.Sleep(time.Second)
    fmt.Println("All workers stopped")
}
```

## 常见模式

### Worker Pool

```go
package main

import "fmt"

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("Worker %d started job %d\n", id, j)
        time.Sleep(time.Second)
        results <- j * 2
        fmt.Printf("Worker %d finished job %d\n", id, j)
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    // 启动 3 个 worker
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }

    // 发送 5 个任务
    for j := 1; j <= 5; j++ {
        jobs <- j
    }
    close(jobs)

    // 获取结果
    for r := 1; r <= 5; r++ {
        <-results
    }
}
```

### 信号广播

```go
package main

import (
    "fmt"
    "sync"
)

func broadcast(broadcastChan chan struct{}, wg *sync.WaitGroup) {
    defer wg.Done()
    time.Sleep(time.Second)
    fmt.Println("Broadcasting signal...")
    close(broadcastChan)
}

func receiver(id int, broadcastChan <-chan struct{}, wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Printf("Receiver %d waiting...\n", id)
    <-broadcastChan
    fmt.Printf("Receiver %d received signal!\n", id)
}

func main() {
    var wg sync.WaitGroup
    broadcastChan := make(chan struct{})

    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go receiver(i, broadcastChan, &wg)
    }

    wg.Add(1)
    go broadcast(broadcastChan, &wg)

    wg.Wait()
    fmt.Println("All receivers notified")
}
```

## 最佳实践

1. **避免共享内存**: 使用通道通信，而不是共享内存
2. **正确关闭 channel**: 发送方负责关闭 channel
3. **处理 panic**: 在 goroutine 中使用 recover
4. **使用 Context**: 优雅地取消和超时控制
5. **限制并发数**: 使用 worker pool 控制并发度
