# 个人知识库

一个简洁优雅的个人知识库系统，基于 Node.js 构建，支持 Markdown 内容管理，通过 GitHub Actions 自动部署到 GitHub Pages。

## 项目简介

本项目是一个轻量级的静态站点生成器，使用 Node.js 和 npm 进行构建，具有以下特点：

- 🎯 **简单高效**：基于 Node.js 原生模块，无复杂依赖
- 📝 **Markdown 支持**：使用 `gray-matter` 解析 frontmatter，`marked` 渲染 Markdown
- 🌙 **主题切换**：支持明亮/暗黑模式
- 🌍 **国际化**：支持中/英文切换
- 🔍 **搜索功能**：客户端实时搜索
- 📱 **响应式设计**：完美适配各种屏幕尺寸
- 🚀 **自动部署**：通过 GitHub Actions 自动构建和部署

## 功能特性

- 基于 Node.js + npm 的构建系统
- Markdown 文章内容管理
- Frontmatter 元数据支持（标题、日期、标签、分类等）
- 代码语法高亮（使用 highlight.js）
- 代码块复制功能
- 文章分类和子分类
- 文章搜索功能
- 主题切换（明亮/暗黑）
- 国际化支持（中文/英文）
- 响应式布局设计

## 项目结构

```
├── content/              # Markdown 内容目录
│   ├── 器/
│   ├── 术/
│   ├── 道/
│   └── 关于/
├── templates/            # HTML 模板目录
│   ├── layout.html      # 主布局模板
│   ├── home.html        # 首页模板
│   └── ...
├── scripts/              # 构建脚本
│   ├── build.js         # 主构建脚本
│   ├── markdown.js      # Markdown 处理
│   └── utils.js         # 工具函数
├── src/                  # 源文件目录
├── dist/                 # 构建输出目录（自动生成）
├── public/               # 静态资源目录
├── .github/workflows/    # GitHub Actions 工作流
├── package.json
└── README.md
```

## 安装指南

### 前置要求

- Node.js >= 16.0.0
- npm

### 本地开发

1. 克隆仓库
```bash
git clone https://github.com/shaynewq/shaynewq.github.io.git
cd shaynewq.github.io
```

2. 安装依赖
```bash
npm install
```

3. 构建项目
```bash
npm run build
```

4. 本地预览（可选）
```bash
npm run serve
```
访问 http://localhost:4000

### GitHub 部署

1. 推送代码到 GitHub 仓库
2. 在仓库设置中启用 Pages
3. 选择 GitHub Actions 作为部署源
4. GitHub Actions 将自动构建和部署

## 内容管理

### 添加文章

在 `content/` 目录下按分类添加 Markdown 文件，例如：
```
content/器/开发/我的第一篇文章.md
```

### Frontmatter

每篇文章需要在开头包含 frontmatter 元数据：

```yaml
---
title: 文章标题
en_title: Article Title
description: 文章描述
en_description: Article Description
date: 2024-01-01
category: 器
subcategory: 开发
tags:
  - JavaScript
  - Node.js
author: 作者名
draft: false
priority: 0
lang: zh
---
```

### 分类配置

分类配置位于 `scripts/utils.js` 的 `getCategoryConfig()` 函数中。

## 技术栈

- **后端构建**：Node.js, npm
- **Markdown 解析**：gray-matter, marked
- **代码高亮**：highlight.js
- **样式框架**：Tailwind CSS (CDN)
- **图标库**：Font Awesome (CDN)
- **字体**：Noto Sans SC (Google Fonts)

## 构建脚本

```bash
npm run build    # 构建项目
npm run dev      # 开发模式（监视文件变化）
npm run serve    # 本地服务器预览
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- GitHub: [shaynewq](https://github.com/shaynewq)
