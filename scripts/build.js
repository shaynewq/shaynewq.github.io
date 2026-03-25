#!/usr/bin/env node

/**
 * 主构建脚本
 * 读取 Markdown 文件并生成静态 HTML
 */

const fs = require('fs');
const path = require('path');
const {
  ensureDir,
  getAllMarkdownFiles,
  groupByCategory,
  getCategoryConfig,
  formatDate
} = require('./utils');
const { parseMarkdown, parseFrontmatter, articleToLightData, generateExcerpt } = require('./markdown');

const CONTENT_DIR = path.join(__dirname, '../content');
const DIST_DIR = path.join(__dirname, '../dist');
const TEMPLATE_DIR = path.join(__dirname, '../templates');

/**
 * 加载所有 MD 文件
 */
function loadAllArticles() {
  const files = getAllMarkdownFiles(CONTENT_DIR);
  const articles = [];

  files.forEach(file => {
    try {
      const parsed = parseMarkdown(file.path);
      const front = parseFrontmatter(parsed.frontmatter);

      if (front.draft) return;

      const article = {
        ...front,
        title: front.title,
        description: front.description,
        url: `#${front.category}/${front.subcategory}/${path.basename(file.path, '.md')}`,
        content: parsed.content,
        html: parsed.html,
        excerpt: generateExcerpt(parsed.content, 150)
      };

      articles.push(article);
    } catch (error) {
      console.error(`Error parsing ${file.path}:`, error.message);
    }
  });

  // 按日期降序排序
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  return articles;
}

/**
 * 加载模板文件（使用内联模板）
 */
function loadTemplate(templateName) {
  const templates = {
    layout: `<!DOCTYPE html>
<html lang="zh-CN" class="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <style>
    /* 主题变量 */
    :root {
      --bg-primary: #F9FAFB;
      --bg-secondary: #FFFFFF;
      --text-primary: #111827;
      --text-secondary: #6B7280;
      --accent: #3B82F6;
      --accent-hover: #2563EB;
      --border: #E5E7EB;
    }

    .dark {
      --bg-primary: #111827;
      --bg-secondary: #1F2937;
      --text-primary: #F9FAFB;
      --text-secondary: #D1D5DB;
      --accent: #60A5FA;
      --accent-hover: #3B82F6;
      --border: #374151;
    }

    * {
      transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
    }

    .card {
      background-color: var(--bg-secondary);
      border-color: var(--border);
    }

    .hover-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transform: translateY(-2px);
    }

    /* 代码高亮 */
    pre {
      background-color: #1e1e1e;
      border-radius: 0.5rem;
      padding: 1rem;
      overflow-x: auto;
    }

    pre code {
      color: #d4d4d4;
    }

    /* 导航栏 */
    .navbar {
      background-color: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border-bottom-color: var(--border);
    }

    .dark .navbar {
      background-color: rgba(17, 24, 39, 0.9);
    }

    /* 文章内容样式 */
    .article-content h1 { font-size: 2em; font-weight: 700; margin: 1.5em 0 0.5em; }
    .article-content h2 { font-size: 1.5em; font-weight: 600; margin: 1.2em 0 0.4em; }
    .article-content h3 { font-size: 1.25em; font-weight: 700; margin: 1em 0 0.3em; }
    .article-content h4 { font-size: 1.1em; font-weight: 600; margin: 0.8em 0 0.2em; }
    .article-content p { margin: 0.8em 0; line-height: 1.8; }
    .article-content ul, .article-content ol { margin: 0.8em 0; padding-left: 1.5em; }
    .article-content li { margin: 0.4em 0; }
    .article-content blockquote { border-left: 4px solid var(--accent); padding-left: 1em; margin: 1em 0; opacity: 0.8; }
    .article-content a { color: var(--accent); text-decoration: underline; }
    .article-content a:hover { color: var(--accent-hover); }
    .article-content code { background-color: rgba(59, 130, 246, 0.1); padding: 0.2em 0.4em; border-radius: 0.25rem; font-size: 0.9em; }
    .article-content table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    .article-content th, .article-content td { border: 1px solid var(--border); padding: 0.75em; text-align: left; }
    .article-content th { background-color: var(--border); font-weight: 600; }

    /* 搜索结果 */
    .search-result {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* 滚动条 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--bg-primary);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--text-secondary);
      border-radius: 4px;
    }
  </style>
</head>
<body>
  {{content}}
  <script>
    // 应用状态
    const state = {
      theme: localStorage.getItem('theme') || 'light',
      lang: localStorage.getItem('lang') || 'zh',
      articles: {{articles}},
      currentCategory: null,
      searchQuery: ''
    };

    // 国际化字典
    const i18n = {
      zh: {
        search: '搜索文章...',
        browse: '浏览文章',
        categories: '知识分类',
        articles: '最新文章',
        about: '关于',
        home: '首页',
        readMore: '阅读更多',
        noResults: '没有找到相关文章',
        tags: '标签',
        date: '发布于',
        author: '作者',
        related: '相关文章',
        backToTop: '返回顶部'
      },
      en: {
        search: 'Search articles...',
        browse: 'Browse Articles',
        categories: 'Knowledge Categories',
        articles: 'Latest Articles',
        about: 'About',
        home: 'Home',
        readMore: 'Read More',
        noResults: 'No articles found',
        tags: 'Tags',
        date: 'Published on',
        author: 'Author',
        related: 'Related Articles',
        backToTop: 'Back to Top'
      }
    };

    // 获取国际化文本
    function t(key) {
      return i18n[state.lang][key] || key;
    }

    // 主题切换
    function toggleTheme() {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
      localStorage.setItem('theme', state.theme);
      updateThemeIcon();
    }

    function updateThemeIcon() {
      const icon = document.getElementById('theme-icon');
      const mobileIcon = document.getElementById('mobile-theme-icon');
      const newClass = state.theme === 'light' ? 'fa-moon-o' : 'fa-sun-o';
      if (icon) icon.className = 'fa ' + newClass;
      if (mobileIcon) mobileIcon.className = 'fa ' + newClass;
    }

    // 语言切换
    function toggleLanguage() {
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
      localStorage.setItem('lang', state.lang);
      updateLanguageText();
      renderAll();
    }

    function updateLanguageText() {
      const langText = state.lang === 'zh' ? '中文' : 'EN';
      const elements = ['#current-language', '#mobile-current-language'];
      elements.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.textContent = langText;
      });
    }

    // 搜索功能
    function searchArticles(query) {
      state.searchQuery = query;
      const lowerQuery = query.toLowerCase();
      const results = state.articles.filter(article => {
        const searchFields = [
          article.title[state.lang] || article.title.zh || '',
          article.description ? (article.description[state.lang] || article.description.zh || '') : '',
          article.tags ? article.tags.join(' ') : '',
          article.category || '',
          article.subcategory || ''
        ];
        return searchFields.some(field => field.toLowerCase().includes(lowerQuery));
      });
      renderSearchResults(results);
    }

    function renderSearchResults(results) {
      const container = document.getElementById('search-results');
      if (!container) return;

      if (state.searchQuery.length === 0) {
        container.innerHTML = '';
        return;
      }

      if (results.length === 0) {
        container.innerHTML = \`<div class="text-center py-12 text-secondary">
          <i class="fa fa-search text-4xl mb-4"></i>
          <p>\${t('noResults')}</p>
        </div>\`;
        return;
      }

      container.innerHTML = results.map(article => \`
        <div class="search-result card border rounded-lg p-4 hover-card cursor-pointer transition-transform duration-300"
             onclick="showArticle('\${article.url}')">
          <h3 class="font-semibold text-lg mb-2 hover:text-[var(--accent)] transition-colors">
            \${article.title[state.lang] || article.title.zh}
          </h3>
          <p class="text-sm text-secondary mb-2">\${article.description ? (article.description[state.lang] || article.description.zh) : article.excerpt}</p>
          <div class="flex items-center justify-between text-xs text-secondary">
            <span>\${article.category} / \${article.subcategory}</span>
            <span>\${article.date}</span>
          </div>
        </div>
      \`).join('');
    }

    // 显示文章
    function showArticle(url) {
      const article = state.articles.find(a => a.url === url);
      if (!article) return;

      window.location.href = url;
    }

    // 渲染所有内容
    function renderAll() {
      // 更新导航文本
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
      });

      // 更新占位符
      const searchInputs = document.querySelectorAll('#search-input, #mobile-search-input');
      searchInputs.forEach(input => {
        input.placeholder = t('search');
      });
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
      // 应用保存的主题
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      updateThemeIcon();
      updateLanguageText();

      // 绑定事件
      const themeToggle = document.getElementById('theme-toggle');
      const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
      const langToggle = document.getElementById('language-toggle');
      const mobileLangToggle = document.getElementById('mobile-language-toggle');
      const searchInput = document.getElementById('search-input');
      const mobileSearchInput = document.getElementById('mobile-search-input');
      const mobileMenu = document.getElementById('mobile-menu');
      const mobileMenuBtn = document.getElementById('mobile-menu-button');

      if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
      if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);
      if (langToggle) langToggle.addEventListener('click', toggleLanguage);
      if (mobileLangToggle) mobileLangToggle.addEventListener('click', toggleLanguage);
      if (searchInput) {
        searchInput.addEventListener('input', (e) => searchArticles(e.target.value));
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') searchArticles(e.target.value);
        });
      }
      if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => searchArticles(e.target.value));
        mobileSearchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') searchArticles(e.target.value);
        });
      }
      if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
          mobileMenu.classList.toggle('hidden');
        });
      }

      renderAll();

      // 处理 URL hash
      window.addEventListener('hashchange', handleHashChange);
      handleHashChange();
    });

    function handleHashChange() {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#')) {
        const [category, subcategory, slug] = hash.substring(1).split('/');
        showArticleDetail(category, subcategory, slug);
      }
    }

    function showArticleDetail(category, subcategory, slug) {
      const url = \`#\${category}/\${subcategory}/\${slug}\`;
      const article = state.articles.find(a => a.url === url);
      if (!article) return;

      const detailContainer = document.getElementById('article-detail');
      const mainContent = document.getElementById('main-content');

      if (detailContainer && mainContent) {
        mainContent.style.display = 'none';
        detailContainer.style.display = 'block';
        detailContainer.innerHTML = \`
          <div class="container mx-auto px-4 py-8 max-w-4xl">
            <button onclick="backToMain()" class="mb-6 text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center">
              <i class="fa fa-arrow-left mr-2"></i>
              \${t('home')}
            </button>
            <article class="article-content">
              <h1 class="text-3xl md:text-4xl font-bold mb-4">\${article.title[state.lang] || article.title.zh}</h1>
              <div class="flex flex-wrap items-center gap-4 text-sm text-secondary mb-8 border-b pb-4">
                <span><i class="fa fa-calendar mr-1"></i> \${article.date}</span>
                <span><i class="fa fa-folder mr-1"></i> \${article.category} / \${article.subcategory}</span>
                \${article.author ? \`<span><i class="fa fa-user mr-1"></i> \${article.author}</span>\` : ''}
              </div>
              \${article.html}
            </article>
          </div>
        \`;
      }
    }

    function backToMain() {
      const detailContainer = document.getElementById('article-detail');
      const mainContent = document.getElementById('main-content');
      if (detailContainer) detailContainer.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';
      window.location.hash = '';
    }
  </script>
</body>
</html>`
  };

  return templates[templateName];
}

/**
 * 生成主页 HTML
 */
function generateHomePage(articles, categories) {
  const categoryConfig = getCategoryConfig();
  const groupedArticles = groupByCategory(articles);
  const template = loadTemplate('layout');

  const categoriesHtml = Object.entries(categoryConfig)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([name, config]) => `
      <div class="mb-12">
        <h3 class="text-2xl font-semibold mb-6 flex items-center">
          <i class="fa fa-${config.icon} text-[var(--accent)] mr-3"></i>
          <span data-i18n="${name}">${name}</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          ${config.subcategories.map(sub => {
            const subArticles = groupedArticles[name]?.[sub] || [];
            return `
              <div class="card border rounded-lg p-4 hover:card hover-card cursor-pointer transition-transform duration-300">
                <h4 class="font-semibold mb-2 hover:text-[var(--accent)] transition-colors">
                  ${sub}
                </h4>
                <p class="text-sm text-secondary">${subArticles.length} 篇文章</p>
                ${subArticles.length > 0 ? `
                  <ul class="mt-3 space-y-1 text-sm">
                    ${subArticles.slice(0, 3).map(article => `
                      <li class="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate">
                        <a href="${article.url}">${article.title.zh || article.title}</a>
                      </li>
                    `).join('')}
                    ${subArticles.length > 3 ? `<li class="text-[var(--accent)] text-xs">+${subArticles.length - 3} 更多</li>` : ''}
                  </ul>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

  const recentArticlesHtml = articles.slice(0, 6).map(article => `
    <article class="card border rounded-lg p-6 hover-card transition-transform duration-300">
      <div class="flex items-start justify-between mb-3">
        <span class="text-sm text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded">
          ${article.category} / ${article.subcategory}
        </span>
        <span class="text-sm text-secondary">${article.date}</span>
      </div>
      <h3 class="font-semibold text-lg mb-2 hover:text-[var(--accent)] transition-colors">
        <a href="${article.url}">${article.title.zh || article.title}</a>
      </h3>
      <p class="text-sm text-secondary mb-4 line-clamp-2">
        ${article.description ? (article.description.zh || article.description) : article.excerpt}
      </p>
      <a href="${article.url}" class="text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm font-medium flex items-center">
        <span data-i18n="readMore">阅读更多</span>
        <i class="fa fa-arrow-right ml-2"></i>
      </a>
    </article>
  `).join('');

  const content = `
    <!-- 导航栏 -->
    <nav class="navbar fixed top-0 z-50 w-full border-b">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <a href="#" class="flex items-center space-x-2">
            <i class="fa fa-book text-[var(--accent)] text-2xl"></i>
            <span class="text-xl font-semibold">个人知识库</span>
          </a>
          <div class="flex items-center space-x-2 sm:space-x-6">
            <div class="hidden sm:block relative">
              <input type="text" id="search-input" placeholder="搜索文章..."
                     class="pl-10 pr-4 py-2 rounded-full border bg-[var(--bg-primary)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all duration-300 w-48 md:w-64">
              <i class="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary"></i>
            </div>
            <button id="language-toggle" class="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors flex items-center space-x-1 px-2">
              <i class="fa fa-globe"></i>
              <span id="current-language">中文</span>
            </button>
            <button id="theme-toggle" class="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors px-2">
              <i class="fa fa-moon-o" id="theme-icon"></i>
            </button>
            <button id="mobile-menu-button" class="sm:hidden text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors px-2">
              <i class="fa fa-bars text-xl"></i>
            </button>
          </div>
        </div>
        <!-- 移动端菜单 -->
        <div id="mobile-menu" class="sm:hidden hidden pb-4">
          <div class="mb-4 relative">
            <input type="text" id="mobile-search-input" placeholder="搜索文章..."
                   class="w-full pl-10 pr-4 py-2 rounded-full border bg-[var(--bg-primary)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
            <i class="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary"></i>
          </div>
          <nav class="flex flex-col space-y-2">
            <a href="#categories" class="py-2 hover:text-[var(--accent)] transition-colors" data-i18n="categories">知识分类</a>
            <a href="#articles" class="py-2 hover:text-[var(--accent)] transition-colors" data-i18n="articles">最新文章</a>
            <a href="#about" class="py-2 hover:text-[var(--accent)] transition-colors" data-i18n="about">关于</a>
          </nav>
        </div>
      </div>
    </nav>

    <!-- 搜索结果 -->
    <div id="search-results" class="container mx-auto px-4 mt-20"></div>

    <!-- 主内容 -->
    <main id="main-content">
      <!-- 英雄区域 -->
      <section class="py-16 md:py-24 lg:py-32">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">个人知识库</h1>
          <p class="text-lg md:text-xl text-secondary mb-8 max-w-2xl mx-auto">
            记录学习心得，分享技术经验，构建个人知识体系
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#articles" class="px-6 py-3 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors font-medium">
              浏览文章
            </a>
            <a href="#categories" class="px-6 py-3 border border-[var(--border)] rounded-md hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-medium">
              查看分类
            </a>
          </div>
        </div>
      </section>

      <!-- 分类区域 -->
      <section id="categories" class="py-16 bg-[var(--bg-secondary)]">
        <div class="container mx-auto px-4">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4" data-i18n="categories">知识分类</h2>
            <p class="text-secondary">按主题组织的知识内容，方便快速定位和学习</p>
          </div>
          ${categoriesHtml}
        </div>
      </section>

      <!-- 最新文章 -->
      <section id="articles" class="py-16">
        <div class="container mx-auto px-4">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4" data-i18n="articles">最新文章</h2>
            <p class="text-secondary">最新的技术文章和学习笔记</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${recentArticlesHtml}
          </div>
        </div>
      </section>

      <!-- 关于 -->
      <section id="about" class="py-16 bg-[var(--bg-secondary)]">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-4" data-i18n="about">关于</h2>
          <p class="text-secondary mb-8 max-w-2xl mx-auto">
            这是一个基于 GitHub Actions 自动构建的静态博客系统，专注于技术知识分享和个人成长记录。
          </p>
          <div class="flex justify-center space-x-6">
            <a href="https://github.com/shaynewq" class="text-2xl hover:text-[var(--accent)] transition-colors">
              <i class="fa fa-github"></i>
            </a>
          </div>
        </div>
      </section>
    </main>

    <!-- 文章详情 -->
    <div id="article-detail" class="hidden"></div>

    <!-- 页脚 -->
    <footer class="bg-[var(--text-primary)] text-[var(--bg-primary)] py-12">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; 2024 个人知识库. All rights reserved.</p>
        <p class="text-sm text-[var(--bg-secondary)] mt-4 opacity-70">
          Built with ❤️ using GitHub Actions
        </p>
      </div>
    </footer>
  `;

  return template
    .replace('{{title}}', '个人知识库')
    .replace('{{content}}', content)
    .replace('{{articles}}', JSON.stringify(articles.map(a => ({
      title: a.title,
      url: a.url,
      date: a.date,
      category: a.category,
      subcategory: a.subcategory,
      description: a.description,
      excerpt: a.excerpt,
      tags: a.tags,
      author: a.author
    }))));
}

/**
 * 主构建函数
 */
async function build() {
  console.log('🚀 Starting build...');

  // 清理并创建输出目录
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  ensureDir(DIST_DIR);

  // 加载文章
  const articles = loadAllArticles();
  console.log(`📝 Loaded ${articles.length} articles`);

  // 生成主页
  const indexHtml = generateHomePage(articles, getCategoryConfig());
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf8');
  console.log('✅ Generated index.html');

  // 复制静态资源
  const publicDir = path.join(__dirname, '../public');
  if (fs.existsSync(publicDir)) {
    copyRecursive(publicDir, DIST_DIR);
    console.log('✅ Copied public assets');
  }

  console.log('🎉 Build completed successfully!');
}

/**
 * 递归复制目录
 */
function copyRecursive(src, dest) {
  const items = fs.readdirSync(src);

  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      ensureDir(destPath);
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// 执行构建
if (require.main === module) {
  build().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
}

module.exports = { build };
