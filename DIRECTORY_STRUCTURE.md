# 个人知识库目录结构

```
shaynewq.github.io/
├── .github/
│   └── workflows/
│       └── build.yml           # GitHub Actions 自动构建配置
├── content/                    # Markdown 内容源文件（在此更新博客）
│   ├── 器/                     # 器分类
│   │   ├── 云原生/
│   │   │   ├── kubernetes入门.md
│   │   │   └── docker最佳实践.md
│   │   ├── 大数据/
│   │   │   ├── spark性能调优.md
│   │   │   └── 数仓设计.md
│   │   ├── 存储/
│   │   │   ├── 分布式存储架构.md
│   │   │   └── Redis持久化机制.md
│   │   ├── 开发/
│   │   │   ├── go并发编程.md
│   │   │   └── 前端性能优化.md
│   │   └── 运维/
│   │       ├── 监控告警系统.md
│   │       └── CI/CD最佳实践.md
│   ├── 术/                     # 术分类
│   │   ├── AI/
│   │   │   ├── 大语言模型原理.md
│   │   │   └── 机器学习基础.md
│   │   ├── 网络/
│   │   │   ├── TCP协议详解.md
│   │   │   └── HTTP/3特性.md
│   │   └── 计算机基础/
│   │       ├── 操作系统总结.md
│   │       └── 数据结构算法.md
│   ├── 道/                     # 道分类
│   │   └── 分布式/
│   │       ├── 分布式系统设计.md
│   │       └── 一致性算法.md
│   └── 关于/                   # 关于分类
│       └── 个人简历.md
├── public/                     # 静态资源
│   ├── css/
│   ├── js/
│   └── images/
├── scripts/                    # 构建脚本
│   ├── build.js                # 主构建脚本
│   ├── markdown.js             # Markdown 处理工具
│   └── utils.js                # 工具函数
├── templates/                  # HTML 模板
│   ├── layout.html             # 布局模板
│   ├── home.html               # 首页模板
│   ├── article.html            # 文章模板
│   └── category.html           # 分类模板
├── index.html                  # 主页面（自动生成）
├── package.json                # Node.js 依赖配置
├── README.md                   # 项目说明
└── .gitignore
```

## 如何更新博客内容

1. **添加新文章**：在 `content/[分类]/[子分类]/` 目录下创建新的 `.md` 文件
2. **编辑现有文章**：直接编辑对应的 `.md` 文件
3. **提交并推送**：运行 `git add`、`git commit` 和 `git push`
4. **自动部署**：GitHub Actions 会自动构建并部署到 GitHub Pages

## Markdown 文件格式

每篇 Markdown 文件开头需要包含以下 Front Matter：

```markdown
---
title: 文章标题
date: YYYY-MM-DD
category: 器
subcategory: 云原生
tags: [kubernetes, docker, 容器]
description: 文章简短描述
author: shaynewq
---
```
