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
  getCategoryConfig
} = require('./utils');
const { parseMarkdown, parseFrontmatter, generateExcerpt } = require('./markdown');

const CONTENT_DIR = path.join(__dirname, '../content');
const DIST_DIR = path.join(__dirname, '../dist');
const TEMPLATE_DIR = path.join(__dirname, '../templates');

/**
 * 加载模板文件
 */
function loadTemplate(templateName) {
  const templatePath = path.join(TEMPLATE_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  return fs.readFileSync(templatePath, 'utf8');
}

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
 * 生成分类 HTML
 */
function generateCategoriesHtml(groupedArticles, categoryConfig) {
  return Object.entries(categoryConfig)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([name, config]) => `
    <section class="mb-12" aria-labelledby="${name}-heading">
      <div class="flex items-center mb-6">
        <div class="category-icon mr-3" aria-hidden="true">
          <i class="fa ${config.icon}"></i>
        </div>
        <h3 id="${name}-heading" class="text-2xl font-semibold">
          <span data-i18n="${name}">${name}</span>
        </h3>
      </div>
      <ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" role="list">
        ${config.subcategories.map(sub => {
          const subArticles = groupedArticles[name]?.[sub] || [];
          return `
            <li>
              <article class="card card-hover p-5" tabindex="0" role="button">
                <h4 class="font-semibold mb-2 hover:text-[var(--accent)] transition-colors">
                  ${sub}
                </h4>
                <p class="text-sm text-[var(--text-secondary)]">${subArticles.length} 篇文章</p>
                ${subArticles.length > 0 ? `
                  <ul class="mt-4 space-y-2 text-sm" role="list">
                    ${subArticles.slice(0, 3).map(article => `
                      <li class="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate">
                        <a href="${article.url}">${article.title.zh || article.title}</a>
                      </li>
                    `).join('')}
                    ${subArticles.length > 3 ? `<li class="text-[var(--accent)] text-xs font-medium">+${subArticles.length - 3} 更多</li>` : ''}
                  </ul>
                ` : ''}
              </article>
            </li>
          `;
        }).join('')}
      </ul>
    </section>
  `).join('');
}

/**
 * 生成文章列表 HTML
 */
function generateArticlesHtml(articles) {
  return articles.slice(0, 6).map((article, index) => `
    <article class="card card-hover p-6" role="article">
      <div class="flex items-start justify-between mb-4">
        <span class="tag" aria-label="分类: ${article.category} / ${article.subcategory}">
          ${article.category} / ${article.subcategory}
        </span>
        <time class="text-sm text-[var(--text-muted)]" datetime="${article.date}">${article.date}</time>
      </div>
      <h3 class="font-semibold text-lg mb-3 hover:text-[var(--accent)] transition-colors line-clamp-2">
        <a href="${article.url}">${article.title.zh || article.title}</a>
      </h3>
      <p class="text-sm text-[var(--text-secondary)] mb-4 line-clamp-3 min-h-[4.8rem]">
        ${article.description ? (article.description.zh || article.description) : article.excerpt}
      </p>
      <a href="${article.url}" class="text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm font-medium inline-flex items-center transition-colors focus:outline-none focus:underline" aria-label="阅读全文: ${article.title.zh || article.title}">
        <span data-i18n="readMore">阅读更多</span>
        <i class="fa fa-arrow-right ml-2" aria-hidden="true"></i>
      </a>
    </article>
  `).join('');
}

/**
 * 生成主页 HTML
 */
function generateHomePage(articles) {
  const categoryConfig = getCategoryConfig();
  const groupedArticles = groupByCategory(articles);

  const layoutTemplate = loadTemplate('layout.html');
  const homeTemplate = loadTemplate('home.html');

  const categoriesHtml = generateCategoriesHtml(groupedArticles, categoryConfig);
  const articlesHtml = generateArticlesHtml(articles);

  const content = homeTemplate
    .replace('{{categories}}', categoriesHtml)
    .replace('{{articles}}', articlesHtml);

  return layoutTemplate
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

  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  ensureDir(DIST_DIR);

  const articles = loadAllArticles();
  console.log(`📝 Loaded ${articles.length} articles`);

  const indexHtml = generateHomePage(articles);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf8');
  console.log('✅ Generated index.html');

  console.log('🎉 Build completed successfully!');
}

if (require.main === module) {
  build().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
}

module.exports = { build };
