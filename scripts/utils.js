/**
 * 工具函数库
 */

const fs = require('fs');
const path = require('path');

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 递归获取目录下所有 markdown 文件
 */
function getAllMarkdownFiles(dir, baseDir = dir) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.md') || item.endsWith('.markdown')) {
        const relativePath = path.relative(baseDir, fullPath);
        files.push({
          path: fullPath,
          relativePath,
          category: path.basename(path.dirname(path.dirname(fullPath))),
          subcategory: path.basename(path.dirname(fullPath))
        });
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * 解析文件路径获取分类信息
 */
function getCategoryInfo(filePath) {
  const parts = filePath.split(path.sep);
  return {
    category: parts[0],
    subcategory: parts[1],
    filename: parts[2]
  };
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 生成文章 URL
 */
function generateArticleUrl(article) {
  const categorySlug = article.category.toLowerCase();
  const subcategorySlug = article.subcategory.toLowerCase();
  const fileSlug = article.filename.replace(/\.md$/, '').replace(/\.markdown$/, '');
  return `#${categorySlug}/${subcategorySlug}/${fileSlug}`;
}

/**
 * 按分类组织文章
 */
function groupByCategory(articles) {
  const groups = {};

  articles.forEach(article => {
    const categoryKey = article.category;
    if (!groups[categoryKey]) {
      groups[categoryKey] = {};
    }
    if (!groups[categoryKey][article.subcategory]) {
      groups[categoryKey][article.subcategory] = [];
    }
    groups[categoryKey][article.subcategory].push(article);
  });

  return groups;
}

/**
 * 获取分类配置
 */
function getCategoryConfig() {
  return {
    '器': {
      icon: 'fa-cubes',
      subcategories: ['云原生', '大数据', '存储', '开发', '运维'],
      order: 1
    },
    '术': {
      icon: 'fa-flask',
      subcategories: ['AI', '网络', '计算机基础'],
      order: 2
    },
    '道': {
      icon: 'fa-compass',
      subcategories: ['分布式'],
      order: 3
    },
    '关于': {
      icon: 'fa-user',
      subcategories: ['个人简历'],
      order: 4
    }
  };
}

/**
 * 搜索文章
 */
function searchArticles(articles, query, lang = 'zh') {
  const lowerQuery = query.toLowerCase();
  return articles.filter(article => {
    const searchFields = [
      article.title[lang] || article.title.zh,
      article.tags ? article.tags.join(' ') : '',
      article.description ? (article.description[lang] || article.description.zh) : '',
      article.content ? article.content.substring(0, 200) : ''
    ];
    return searchFields.some(field => field.toLowerCase().includes(lowerQuery));
  });
}

module.exports = {
  ensureDir,
  getAllMarkdownFiles,
  getCategoryInfo,
  formatDate,
  generateArticleUrl,
  groupByCategory,
  getCategoryConfig,
  searchArticles
};
