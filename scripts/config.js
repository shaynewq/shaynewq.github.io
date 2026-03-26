/**
 * 配置文件
 * 存储目录中英文的映射关系和其他配置
 */

// 分类名称映射（英文 -> 中文）
const categoryNameMap = {
  'qi': '器',
  'shu': '术',
  'dao': '道',
  'about': '关于'
};

// 分类显示名称映射（中文 -> 英文）
const categoryDisplayNameMap = {
  '器': 'qi',
  '术': 'shu',
  '道': 'dao',
  '关于': 'about',
  'Tools (器)': 'qi',
  'Techniques (术)': 'shu',
  'Philosophy (道)': 'dao',
  'About': 'about'
};

// 子分类名称映射（英文 -> 中文）
const subcategoryNameMap = {
  'resume': '个人简历',
  'distributed': '分布式',
  'cloud-native': '云原生',
  'devops': 'DevOps',
  'data-structures-algorithms': '数据结构与算法',
  'computer-networking': '计算机网络',
  'operating-system': '操作系统',
  'database': '数据库',
  'cs-basics': '计算机基础',
  'network': '网络',
  'AI': 'AI',
  'ops': '运维',
  'big-data': '大数据',
  'storage': '存储',
  'development': '开发'
};

// 子分类显示名称映射（中文 -> 英文）
const subcategoryDisplayNameMap = {
  '个人简历': 'resume',
  '分布式': 'distributed',
  '云原生': 'cloud-native',
  'DevOps': 'devops',
  '数据结构与算法': 'data-structures-algorithms',
  '计算机网络': 'computer-networking',
  '操作系统': 'operating-system',
  '数据库': 'database',
  '计算机基础': 'cs-basics',
  '网络': 'network',
  'AI': 'AI',
  '运维': 'ops',
  '大数据': 'big-data',
  '存储': 'storage',
  '开发': 'development'
};

// 分类图标映射
const categoryIconMap = {
  'qi': 'fa-cubes',
  'shu': 'fa-flask',
  'dao': 'fa-compass',
  'about': 'fa-user'
};

// 分类排序映射
const categoryOrderMap = {
  'qi': 1,
  'shu': 2,
  'dao': 3,
  'about': 4
};

// i18n配置
const i18n = {
  zh: {
    search: '搜索文章...',
    categories: '知识分类',
    articles: '最新文章',
    aboutCategory: '关于',
    about: '关于',
    home: '首页',
    readMore: '阅读更多',
    noResults: '没有找到相关文章',
    backToTop: '返回顶部',
    searchPlaceholder: '输入关键词搜索...',
    browse: '浏览文章'
  },
  en: {
    search: 'Search articles...',
    categories: 'Knowledge Categories',
    articles: 'Latest Articles',
    aboutCategory: 'About',
    about: 'About',
    home: 'Home',
    readMore: 'Read More',
    noResults: 'No articles found',
    backToTop: 'Back to Top',
    searchPlaceholder: 'Type to search...',
    browse: 'Browse Articles'
  }
};

// 为i18n添加分类名称
for (const [key, value] of Object.entries(categoryNameMap)) {
  i18n.zh[key] = value;
  i18n.en[key] = Object.keys(categoryDisplayNameMap).find(k => categoryDisplayNameMap[k] === key) || key;
}

module.exports = {
  categoryNameMap,
  categoryDisplayNameMap,
  subcategoryNameMap,
  subcategoryDisplayNameMap,
  categoryIconMap,
  categoryOrderMap,
  i18n
};