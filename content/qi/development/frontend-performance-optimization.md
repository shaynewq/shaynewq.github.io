---
title:
  zh: 前端性能优化
  en: Frontend Performance Optimization
date: 2024-01-25
category: qi
subcategory: development
tags: [前端, 性能优化, web]
description:
  zh: 全面了解前端性能优化策略，提升网站加载速度和用户体验。
  en: Comprehensive frontend performance optimization strategies to improve website load speed and user experience.
author: shaynewq
draft: false
---

# 前端性能优化

前端性能优化是提升用户体验的关键，从网络请求、资源加载到代码执行都需要优化。

## 网络优化

### 减少 HTTP 请求

```javascript
// 合并多个小文件
// 之前：请求 10 个小图片
// 之后：使用雪碧图或 icon font

// 使用内联小文件
<style>
  .icon { background-image: url('data:image/svg+xml;...'); }
</style>
```

### 压缩资源

```javascript
// Gzip 压缩
// .htaccess
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/javascript
</IfModule>
```

### 使用 CDN

```html
<!-- 使用 CDN 加载常用库 -->
<script src="https://cdn.jsdelivr.net/npm/axios@0.27.2/dist/axios.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet">
```

## 资源加载优化

### 图片优化

```html
<!-- 使用 WebP 格式 -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="描述">
</picture>

<!-- 延迟加载 -->
<img src="placeholder.jpg" data-src="real-image.jpg" loading="lazy" alt="描述">

<script>
  // 也可以使用 Intersection Observer
  const lazyImages = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));
</script>
```

### 代码分割

```javascript
// 使用动态 import
const loadChart = async () => {
  const chartModule = await import('./chart.js');
  chartModule.drawChart();
};

// React 中的代码分割
import React, { Suspense } from 'react';

const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 预加载和预连接

```html
<!-- 预连接 -->
<link rel="preconnect" href="https://api.example.com">
<link rel="preconnect" href="https://cdn.example.com">

<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://api.example.com">

<!-- 预加载 -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="critical.js" as="script">

<!-- 预获取 -->
<link rel="prefetch" href="next-page.js" as="script">
```

## 渲染优化

### 避免重排重绘

```javascript
// 批量 DOM 操作
const fragment = document.createDocumentFragment();

for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div');
  div.textContent = `Item ${i}`;
  fragment.appendChild(div);
}

document.body.appendChild(fragment);  // 一次性插入

// 使用 CSS 批处理
.element {
  transform: translateZ(0);  // 启用 GPU 加速
  will-change: transform;    // 提示浏览器优化
}

// 使用 DocumentFragment
const list = document.getElementById('list');
const fragment = document.createDocumentFragment();

// 添加元素到 fragment
fragment.appendChild(childElement);

// 一次性添加到 DOM
list.appendChild(fragment);
```

### 虚拟滚动

```javascript
class VirtualScroll {
  constructor(container, itemHeight, totalCount) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalCount = totalCount;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight);

    container.addEventListener('scroll', this.onScroll.bind(this));
    this.render();
  }

  onScroll() {
    const startIndex = Math.floor(this.container.scrollTop / this.itemHeight);
    this.render(startIndex);
  }

  render(startIndex = 0) {
    const endIndex = Math.min(startIndex + this.visibleCount, this.totalCount);

    this.container.innerHTML = '';

    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.style.height = `${this.itemHeight}px`;
      item.textContent = `Item ${i}`;
      this.container.appendChild(item);
    }
  }
}
```

## 内存优化

### 事件委托

```javascript
// 事件委托
document.getElementById('list').addEventListener('click', (e) => {
  if (e.target.classList.contains('item')) {
    console.log('Item clicked:', e.target.textContent);
  }
});

// 而不是
items.forEach(item => {
  item.addEventListener('click', handleClick);
});
```

### 及时清理引用

```javascript
// 移除事件监听
function addEventHandler() {
  function handleClick() { /* ... */ }
  element.addEventListener('click', handleClick);
  return () => element.removeEventListener('click', handleClick);
}

// 清理定时器
let timerId = setInterval(() => {
  // ...
}, 1000);

// 清理时
clearInterval(timerId);
```

## 性能监控

```javascript
// 页面加载性能
window.addEventListener('load', () => {
  const timing = performance.timing;

  console.log('页面加载时间:', {
    DNS查询: timing.domainLookupEnd - timing.domainLookupStart,
    TCP连接: timing.connectEnd - timing.connectStart,
    请求响应: timing.responseEnd - timing.requestStart,
    DOM解析: timing.domComplete - timing.domLoading,
    完整加载: timing.loadEventEnd - timing.navigationStart
  });
});

// Resource Timing API
performance.getEntriesByType('resource').forEach(resource => {
  console.log(resource.name, resource.duration);
});

// User Timing API
performance.mark('startTask');
// 执行任务
performance.mark('endTask');
performance.measure('task', 'startTask', 'endTask');
```

## 最佳实践

1. **优先加载关键资源**: 使用内联关键 CSS
2. **延迟加载非关键资源**: defer、async、动态 import
3. **优化图片**: 使用合适的格式和尺寸
4. **使用 Web Workers**: 处理 CPU 密集型任务
5. **启用 HTTP/2**: 支持多路复用
6. **使用 Service Worker**: 缓存策略
7. **监控和分析**: 定期检查性能指标

## 性能指标

```javascript
// 核心 Web 指标
const webVitals = {
  LCP: 2.5,  // Largest Contentful Paint < 2.5s
  FID: 100,  // First Input Delay < 100ms
  CLS: 0.1   // Cumulative Layout Shift < 0.1
};

// 使用 web-vitals 库
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```
