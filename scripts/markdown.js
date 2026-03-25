/**
 * Markdown 处理工具
 */

const { marked } = require('marked');
const matter = require('gray-matter');
const { ensureDir } = require('./utils');

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    require('highlight.js/lib/core');
    require('highlight.js/lib/common');
    const hljs = require('highlight.js');
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
});

/**
 * 解析 Markdown 文件
 */
function parseMarkdown(filePath) {
  const fileContent = require('fs').readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);

  return {
    frontmatter: data,
    content: content,
    html: marked.parse(content)
  };
}

/**
 * 解析 Front Matter 并提取国际化字段
 */
function parseFrontmatter(data, defaultLang = 'zh') {
  return {
    title: typeof data.title === 'string'
      ? { zh: data.title, en: data.en_title || data.title }
      : data.title || { zh: '', en: '' },
    date: data.date || new Date().toISOString().split('T')[0],
    category: data.category || '未分类',
    subcategory: data.subcategory || '',
    tags: data.tags || [],
    description: typeof data.description === 'string'
      ? { zh: data.description, en: data.en_description || data.description }
      : data.description || { zh: '', en: '' },
    author: data.author || '',
    draft: data.draft || false,
    priority: data.priority || 0,
    lang: data.lang || defaultLang
  };
}

/**
 * 将文章对象转换为轻量级数据
 */
function articleToLightData(article, language = 'zh') {
  return {
    title: article.title[language],
    url: article.url,
    date: article.date,
    category: article.category,
    subcategory: article.subcategory,
    description: article.description[language],
    tags: article.tags,
    author: article.author
  };
}

/**
 * 生成文章摘要
 */
function generateExcerpt(content, maxLength = 200) {
  const textContent = content.replace(/[#*`\[\]]/g, '').substring(0, maxLength);
  return textContent + (content.length > maxLength ? '...' : '');
}

module.exports = {
  parseMarkdown,
  parseFrontmatter,
  articleToLightData,
  generateExcerpt
};
