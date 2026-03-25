# 个人知识库

一个基于 Tailwind CSS 构建的个人知识库页面，用于记录学习心得和分享技术经验。

## 项目简介

本项目是一个单页面应用，使用语义化 HTML5 标签和 Tailwind CSS 进行开发，具有响应式设计，可完美适配移动端、平板和 PC 端。

### 功能特性

- 响应式设计，适配各种屏幕尺寸
- 语义化 HTML5 标签，确保无障碍访问（A11y）
- 使用 Tailwind CSS v3+ 进行样式开发，无冗余 CSS 文件
- 平滑的微交互效果，提升用户体验
- 零配置部署，所有资源使用公共 CDN
- 支持日光/黑夜模式切换
- 支持中文/英文国际化切换
- 支持文章搜索功能
- 基于 GitHub Action 自动构建和部署

## 安装指南

### 方法一：基于 GitHub Action 自动部署

1. 克隆本仓库到本地
2. 进入仓库目录
3. 推送代码到 GitHub 仓库
4. 在 GitHub 仓库设置中启用 GitHub Pages，选择 `gh-pages` 分支作为源
5. GitHub Action 会自动构建并部署代码
6. 访问生成的 GitHub Pages URL

### 方法二：本地预览

1. 克隆本仓库到本地
2. 进入仓库目录
3. 直接在浏览器中打开 `index.html` 文件

## 技术栈

- HTML5
- Tailwind CSS v3+
- Font Awesome
- Google Fonts (Inter)
- GitHub Actions

## 项目结构

```
├── index.html          # 主页面文件
├── package.json        # 项目配置和构建脚本
├── README.md           # 项目说明文档
├── LICENSE             # 许可证文件
├── .gitignore          # Git 忽略文件
└── .github/
    └── workflows/
        └── build.yml   # GitHub Action 配置文件
```

## 后续 Markdown 内容更新

### 目录结构

如果需要添加或更新 Markdown 内容，请按照以下目录结构组织：

```
└── content/
    ├── 器/
    │   ├── 云原生/
    │   ├── 大数据/
    │   ├── 存储/
    │   ├── 开发/
    │   └── 运维/
    ├── 术/
    │   ├── AI/
    │   ├── 网络/
    │   └── 计算机基础/
    ├── 道/
    │   └── 分布式/
    └── 关于/
        └── 个人简历/
```

### 更新流程

1. 在对应分类目录下添加或更新 Markdown 文件
2. 推送代码到 GitHub 仓库
3. GitHub Action 会自动构建并部署更新后的内容

## 许可证

本项目采用 CSDN 博客 GitHub 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 联系方式

- GitHub: [shaynewq](https://github.com/shaynewq)
- Email: email@example.com
