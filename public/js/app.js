/**
 * Site JavaScript
 * Handles theme toggle, language toggle, search, and article navigation
 */

const state = {
  theme: localStorage.getItem('theme') || 'light',
  lang: localStorage.getItem('lang') || 'zh',
  articles: window.ARTICLES || [],
  searchQuery: ''
};

// 导入配置
const Config = window.Config;

// 导入i18n配置
const i18n = window.I18N || {
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

function t(key) {
  return i18n[state.lang][key] || key;
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', state.theme === 'dark');
  localStorage.setItem('theme', state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  const mobileIcon = document.getElementById('mobile-theme-icon');
  if (icon) icon.className = `fa fa-${state.theme === 'light' ? 'moon-o' : 'sun-o'}`;
  if (mobileIcon) mobileIcon.className = `fa fa-${state.theme === 'light' ? 'moon-o' : 'sun-o'}`;
}

function toggleLanguage() {
  state.lang = state.lang === 'zh' ? 'en' : 'zh';
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  localStorage.setItem('lang', state.lang);
  updateLanguageText();
  renderAll();
  
  // Re-render current content based on language
  const hash = window.location.hash;
  if (hash && hash.startsWith('#') && !['#categories', '#articles', '#section-about'].includes(hash) && !hash.startsWith('#!')) {
    const parts = hash.substring(1).split('/');
    if (parts.length === 3) {
      // Re-render article detail
      showArticleDetail(parts[0], parts[1], parts[2]);
    } else if (parts.length === 2) {
      // Re-render subcategory articles
      showSubcategoryArticles(parts[0], parts[1]);
    }
  }
}

function updateLanguageText() {
  const langText = state.lang === 'zh' ? '中文' : 'EN';
  ['current-language', 'mobile-current-language'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = langText;
  });
}

function searchArticles(query) {
  state.searchQuery = query;
  const lowerQuery = query.toLowerCase();
  const results = state.articles.filter(article => {
    const fields = [
      article.title?.[state.lang] || article.title?.zh || '',
      article.description?.[state.lang] || article.description?.zh || '',
      article.tags?.join(' ') || '',
      article.category || '',
      article.subcategory || ''
    ];
    return fields.some(f => f.toLowerCase().includes(lowerQuery));
  });
  renderSearchResults(results);
}

function renderSearchResults(results) {
  const container = document.getElementById('search-results');
  if (!container) return;

  if (!state.searchQuery) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');

  if (!results.length) {
    container.innerHTML = `
      <div class="text-center py-12 text-[var(--text-secondary)]">
        <i class="fa fa-search text-3xl mb-3"></i>
        <p>${t('noResults')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = results.map((a, i) => `
    <div class="search-result card card-hover p-4 mb-3 cursor-pointer animate-fadeIn"
         style="animation-delay: ${i * 50}ms">
      <h3 class="font-semibold mb-2 hover:text-[var(--accent)]">
        ${a.title?.[state.lang] || a.title?.zh}
      </h3>
      <p class="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">
        ${a.description?.[state.lang] || a.description?.zh || a.excerpt}
      </p>
      <div class="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span class="tag">${Config.categoryNameMap[a.category] || a.category}/${Config.subcategoryNameMap[a.subcategory] || a.subcategory}</span>
        <time>${a.date}</time>
      </div>
    </div>
  `).join('');

  // Add click handlers to search results
  container.querySelectorAll('.search-result').forEach((el, i) => {
    el.addEventListener('click', () => {
      const url = results[i].url;
      window.location.hash = url;
    });
  });
}

function showArticle(url) {
  console.log('showArticle called with URL:', url);
  // Update address bar
  window.location.hash = url;
  // Extract category, subcategory, and slug from URL
  const parts = url.substring(1).split('/');
  console.log('URL parts:', parts);
  if (parts.length === 3) {
    showArticleDetail(parts[0], parts[1], parts[2]);
  }
}

function renderAll() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  ['search-input', 'mobile-search-input'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.placeholder = t('searchPlaceholder');
  });
}

function handleBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function handleHashChange() {
  const hash = window.location.hash;
  console.log('Hash changed:', hash);
  if (hash && hash.startsWith('#') && !['#categories', '#articles', '#section-about'].includes(hash) && !hash.startsWith('#!')) {
    const parts = hash.substring(1).split('/');
    console.log('Hash parts:', parts);
    if (parts.length === 3 && parts[0] !== 'tag') {
      showArticleDetail(parts[0], parts[1], parts[2]);
    } else if (parts.length === 2 && parts[0] !== 'tag') {
      // Handle subcategory navigation
      showSubcategoryArticles(parts[0], parts[1]);
    } else if (parts.length === 1 && parts[0] !== 'tag') {
      // Handle category navigation
      showCategoryArticles(parts[0], parts[0]);
    } else if (parts.length === 2 && parts[0] === 'tag') {
      // Handle tag navigation
      showTagArticles(decodeURIComponent(parts[1]));
    } else {
      console.log('Hash parts length is not 3, 2, or 1:', parts.length);
    }
  } else {
    console.log('Back to main');
    backButtonToMain();
  }
}

function showArticleDetail(category, subcategory, slug) {
  const url = `#${category}/${subcategory}/${slug}`;
  console.log('Looking for article with URL:', url);
  
  // Debug: Check if state.articles is populated
  console.log('State articles length:', state.articles.length);
  
  // Try to find the article
  const article = state.articles.find(a => a.url === url);
  if (!article) {
    console.log('Article not found for URL:', url);
    // Try to find by partial match
    const partialMatch = state.articles.find(a => a.url.includes(category) && a.url.includes(subcategory) && a.url.includes(slug));
    if (partialMatch) {
      console.log('Found partial match:', partialMatch.url);
    }
    return;
  }
  console.log('Found article:', article.title);

  // Get DOM elements
  const detailContainer = document.getElementById('article-detail');
  const mainContent = document.getElementById('main-content');
  console.log('Detail container:', detailContainer);
  console.log('Main content:', mainContent);

  if (detailContainer && mainContent) {
    // Hide main content and show article detail
    mainContent.style.display = 'none';
    detailContainer.style.display = 'block';
    detailContainer.classList.remove('hidden');
    detailContainer.removeAttribute('hidden');
    
    // Get the Chinese category name
    const chineseCategory = Config.categoryNameMap[category] || category;
    
    // Get the subcategory display name
    const subcategoryDisplayName = Config.subcategoryNameMap[subcategory] || subcategory;
    
    // Create article content
    const articleContent = `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <button id="back-button" class="mb-4 text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium inline-flex items-center">
          <i class="fa fa-arrow-left mr-2"></i>
          ${t('home')}
        </button>
        <div class="mb-6 text-sm text-[var(--text-secondary)]">
          <a href="#" class="hover:text-[var(--accent)]">${t('home')}</a>
          <span class="mx-2">/</span>
          <a href="#${category}" class="hover:text-[var(--accent)]">${chineseCategory}</a>
          <span class="mx-2">/</span>
          <a href="#${category}/${subcategory}" class="hover:text-[var(--accent)]">${subcategoryDisplayName}</a>
        </div>
        <article class="article-content">
          <h1>${article.title?.[state.lang] || article.title?.zh}</h1>
          <div class="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] mb-8 py-4 border-b border-[var(--border)]">
            <time>${formatDate(article.date)}</time>
            <span class="tag">${chineseCategory}/${subcategoryDisplayName}</span>
            ${article.author ? `<span>${article.author}</span>` : ''}
            ${article.tags?.length ? `<span class="flex gap-2">${article.tags.map(tag => `<span class="tag text-xs">${tag}</span>`).join('')}</span>` : ''}
          </div>
          ${article.html}
        </article>
      </div>
    `;
    
    console.log('Setting article content...');
    detailContainer.innerHTML = articleContent;
    console.log('Article content set successfully');
    
    window.scrollTo(0, 0);

    // Add click handler for back button
    setTimeout(() => {
      const backBtn = document.getElementById('back-button');
      if (backBtn) {
        console.log('Adding back button listener');
        backBtn.addEventListener('click', backButtonToMain);
      } else {
        console.log('Back button not found');
      }
    }, 100);
  } else {
    console.log('DOM elements not found');
  }
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('zh-CN');
  } catch (e) {
    return dateStr;
  }
}

function backButtonToMain() {
  const detailContainer = document.getElementById('article-detail');
  const mainContent = document.getElementById('main-content');
  if (detailContainer) {
    detailContainer.classList.add('hidden');
    detailContainer.setAttribute('hidden', 'hidden');
    detailContainer.style.display = 'none';
  }
  if (mainContent) {
    mainContent.classList.remove('hidden');
    mainContent.style.display = 'block';
  }
  window.location.hash = '';
}

function init() {
  // Initialize theme
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  updateThemeIcon();
  updateLanguageText();

  // Debug: Check if articles are loaded
  console.log('Initializing app...');
  console.log('Window.ARTICLES:', window.ARTICLES);
  console.log('State articles:', state.articles);
  console.log('Number of articles:', state.articles.length);

  // Initialize event listeners
  const toggleHandlers = [
    { id: 'theme-toggle', fn: toggleTheme },
    { id: 'mobile-theme-toggle', fn: toggleTheme },
    { id: 'language-toggle', fn: toggleLanguage },
    { id: 'mobile-language-toggle', fn: toggleLanguage }
  ];

  toggleHandlers.forEach(({ id, fn }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  });

  // Add click handler to logo for back to main
  const logo = document.querySelector('.navbar a[aria-label="回到首页"]');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      backButtonToMain();
    });
  }

  const searchInputs = ['search-input', 'mobile-search-input'];
  searchInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', (e) => searchArticles(e.target.value));
  });

  const mobileMenuBtn = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Initialize hash handling
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  // Initialize other features
  renderAll();
  handleBackToTop();

  // Add click handlers to article cards
  initArticleCardListeners();
  
  // Add click handlers to subcategory cards
  initSubcategoryListeners();
  
  // Add click handlers to category headings
  initCategoryListeners();
  
  // Generate tags
  generateTags();
}

function initArticleCardListeners() {
  // Add click handlers to article cards in the article list
  console.log('Initializing article card listeners...');
  const cards = document.querySelectorAll('.article-card');
  console.log('Found article cards:', cards.length);
  
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = card.dataset.url;
      console.log('Card clicked, URL:', url);
      if (url) {
        console.log('Calling showArticle with URL:', url);
        showArticle(url);
      }
    });
  });
  
  // Also add listeners to direct links
  const links = document.querySelectorAll('a[href^="#"]');
  console.log('Found links:', links.length);
  links.forEach(link => {
    if (link.href.includes('#') && !['#categories', '#articles', '#section-about'].includes(link.hash)) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = link.hash;
        console.log('Link clicked, URL:', url);
        if (url) {
          console.log('Calling showArticle with URL:', url);
          showArticle(url);
        }
      });
    }
  });
}

function initCategoryListeners() {
  // Add click handlers to category headings
  console.log('Initializing category listeners...');
  const categoryHeadings = document.querySelectorAll('section h3');
  console.log('Found category headings:', categoryHeadings.length);
  
  categoryHeadings.forEach(heading => {
    // Make heading clickable
    heading.style.cursor = 'pointer';
    heading.style.userSelect = 'none';
    
    heading.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const categoryName = heading.textContent.trim();
      // Map the internationalized category name to the actual category value
      const category = Config.categoryDisplayNameMap[categoryName] || categoryName.toLowerCase();
      
      console.log('Category clicked:', categoryName, '->', category);
      
      // Show articles for this category
      showCategoryArticles(category, categoryName);
    });
  });
}

function generateTags() {
  // Generate tag cloud
  console.log('Generating tags...');
  const tagsContainer = document.getElementById('tags-container');
  if (!tagsContainer) {
    console.log('Tags container not found');
    return;
  }
  
  // Collect all tags from articles
  const tagCounts = {};
  state.articles.forEach(article => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  console.log('Tag counts:', tagCounts);
  
  // Generate tag elements
  const tags = Object.entries(tagCounts).map(([tag, count]) => {
    const tagElement = document.createElement('a');
    tagElement.href = `#tag/${encodeURIComponent(tag)}`;
    tagElement.className = 'tag inline-flex items-center px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] transition-colors';
    tagElement.textContent = `${tag} (${count})`;
    tagElement.addEventListener('click', (e) => {
      e.preventDefault();
      showTagArticles(tag);
    });
    return tagElement;
  });
  
  // Clear container and add tags
  tagsContainer.innerHTML = '';
  tags.forEach(tagElement => {
    tagsContainer.appendChild(tagElement);
  });
  
  console.log('Tags generated successfully');
}

function showTagArticles(tag) {
  console.log('Showing articles for tag:', tag);
  
  // Filter articles by tag
  const articles = state.articles.filter(article => 
    article.tags && Array.isArray(article.tags) && article.tags.includes(tag)
  );
  
  console.log('Found articles:', articles.length);
  
  // Get DOM elements
  const detailContainer = document.getElementById('article-detail');
  const mainContent = document.getElementById('main-content');
  
  if (detailContainer && mainContent) {
    // Hide main content and show article detail
    mainContent.style.display = 'none';
    detailContainer.style.display = 'block';
    detailContainer.classList.remove('hidden');
    detailContainer.removeAttribute('hidden');
    

    
    // Create tag articles content
    const articlesContent = `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <button id="back-button" class="mb-6 text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium inline-flex items-center">
          <i class="fa fa-arrow-left mr-2"></i>
          ${t('home')}
        </button>
        <div class="mb-8">
          <h1 class="text-2xl font-bold mb-2">标签: ${tag}</h1>
          <p class="text-sm text-[var(--text-secondary)]">${articles.length} 篇文章</p>
        </div>
        ${articles.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${articles.map(article => {
            // Get Chinese category name for the article
            const articleChineseCategory = Config.categoryNameMap[article.category] || article.category;
            
            // Get subcategory display name for the article
            const articleSubcategoryDisplayName = Config.subcategoryNameMap[article.subcategory] || article.subcategory;
            
            return `
            <article class="card card-hover p-4 article-card" role="article" data-url="${article.url}">
              <div class="flex items-center justify-between mb-2">
                <span class="tag text-xs">${articleChineseCategory} / ${articleSubcategoryDisplayName}</span>
                <time class="text-xs text-[var(--text-muted)]">${formatDate(article.date)}</time>
              </div>
              <h3 class="font-semibold text-sm mb-2 hover:text-[var(--accent)] transition-colors line-clamp-2">
                <a href="${article.url}">${article.title?.[state.lang] || article.title?.zh}</a>
              </h3>
              <p class="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">
                ${article.description?.[state.lang] || article.description?.zh || article.excerpt}
              </p>
            </article>
            `;
          }).join('')}
        </div>
        ` : `
        <div class="text-center py-12">
          <i class="fa fa-search text-4xl text-[var(--text-muted)] mb-4"></i>
          <p class="text-[var(--text-secondary)]">没有找到相关文章</p>
        </div>
        `}
      </div>
    `;
    
    console.log('Setting tag articles content...');
    detailContainer.innerHTML = articlesContent;
    console.log('Tag articles content set successfully');
    
    // Update address bar with tag path
    window.location.hash = `tag/${encodeURIComponent(tag)}`;
    
    window.scrollTo(0, 0);

    // Add click handler for back button
    setTimeout(() => {
      const backBtn = document.getElementById('back-button');
      if (backBtn) {
        console.log('Adding back button listener');
        backBtn.addEventListener('click', backButtonToMain);
      } else {
        console.log('Back button not found');
      }
      
      // Reinitialize article card listeners for the new articles
      initArticleCardListeners();
    }, 100);
  } else {
    console.log('DOM elements not found');
  }
}

function initSubcategoryListeners() {
  // Add click handlers to subcategory cards
  console.log('Initializing subcategory listeners...');
  const subcategoryCards = document.querySelectorAll('.card[tabindex="0"][role="button"]');
  console.log('Found subcategory cards:', subcategoryCards.length);
  
  subcategoryCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Extract category and subcategory from the card
      const h4 = card.querySelector('h4');
      const subcategory = h4.textContent.trim();
      
      // Find the parent category section
      const section = card.closest('section');
      const categoryHeading = section.querySelector('h3');
      const categoryName = categoryHeading.textContent.trim();
      
      // Map the internationalized category name to the actual category value
      const category = Config.categoryDisplayNameMap[categoryName] || categoryName.toLowerCase();
      
      console.log('Subcategory clicked:', categoryName, '->', category, '/', subcategory);
      
      // Show articles for this subcategory
      showSubcategoryArticles(category, subcategory);
    });
  });
}

function showCategoryArticles(category, categoryName) {
  console.log('Showing articles for category:', category, '/', categoryName);
  
  // Filter articles by category
  const articles = state.articles.filter(article => 
    article.category === category
  );
  
  console.log('Found articles:', articles.length);
  
  // Get DOM elements
  const detailContainer = document.getElementById('article-detail');
  const mainContent = document.getElementById('main-content');
  
  if (detailContainer && mainContent) {
    // Hide main content and show article detail
    mainContent.style.display = 'none';
    detailContainer.style.display = 'block';
    detailContainer.classList.remove('hidden');
    detailContainer.removeAttribute('hidden');
    
    // Get the Chinese category name
    const chineseCategory = Config.categoryNameMap[category] || category;
    
    // Create category articles content
    const articlesContent = `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <button id="back-button" class="mb-6 text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium inline-flex items-center">
          <i class="fa fa-arrow-left mr-2"></i>
          ${t('home')}
        </button>
        <div class="mb-8">
          <h1 class="text-2xl font-bold mb-2">${chineseCategory}</h1>
          <p class="text-sm text-[var(--text-secondary)]">${articles.length} 篇文章</p>
        </div>
        ${articles.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${articles.map(article => {
            // Get Chinese category name for the article
            const articleChineseCategory = Config.categoryNameMap[article.category] || article.category;
            
            // Get subcategory display name for the article
            const articleSubcategoryDisplayName = Config.subcategoryNameMap[article.subcategory] || article.subcategory;
            
            return `
            <article class="card card-hover p-4 article-card" role="article" data-url="${article.url}">
              <div class="flex items-center justify-between mb-2">
                <span class="tag text-xs">${articleChineseCategory} / ${articleSubcategoryDisplayName}</span>
                <time class="text-xs text-[var(--text-muted)]">${formatDate(article.date)}</time>
              </div>
              <h3 class="font-semibold text-sm mb-2 hover:text-[var(--accent)] transition-colors line-clamp-2">
                <a href="${article.url}">${article.title?.[state.lang] || article.title?.zh}</a>
              </h3>
              <p class="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">
                ${article.description?.[state.lang] || article.description?.zh || article.excerpt}
              </p>
            </article>
            `;
          }).join('')}
        </div>
        ` : `
        <div class="text-center py-12">
          <i class="fa fa-search text-4xl text-[var(--text-muted)] mb-4"></i>
          <p class="text-[var(--text-secondary)]">没有找到相关文章</p>
        </div>
        `}
      </div>
    `;
    
    console.log('Setting category articles content...');
    detailContainer.innerHTML = articlesContent;
    console.log('Category articles content set successfully');
    
    // Update address bar with category path
    window.location.hash = `${category}`;
    
    window.scrollTo(0, 0);

    // Add click handler for back button
    setTimeout(() => {
      const backBtn = document.getElementById('back-button');
      if (backBtn) {
        console.log('Adding back button listener');
        backBtn.addEventListener('click', backButtonToMain);
      } else {
        console.log('Back button not found');
      }
      
      // Reinitialize article card listeners for the new articles
      initArticleCardListeners();
    }, 100);
  } else {
    console.log('DOM elements not found');
  }
}

function showSubcategoryArticles(category, subcategory) {
  console.log('Showing articles for:', category, '/', subcategory);
  
  // Map the display subcategory name to the actual subcategory value
  const actualSubcategory = Config.subcategoryDisplayNameMap[subcategory] || subcategory.toLowerCase().replace(/\s+/g, '-');
  
  // Get the display subcategory name (Chinese)
  const displaySubcategory = Config.subcategoryNameMap[subcategory] || Config.subcategoryNameMap[actualSubcategory] || subcategory;
  
  console.log('Mapped subcategory:', subcategory, '->', actualSubcategory);
  
  // Filter articles by category and subcategory
  const articles = state.articles.filter(article => 
    article.category === category && article.subcategory === actualSubcategory
  );
  
  console.log('Found articles:', articles.length);
  
  // Get DOM elements
  const detailContainer = document.getElementById('article-detail');
  const mainContent = document.getElementById('main-content');
  
  if (detailContainer && mainContent) {
    // Hide main content and show article detail
    mainContent.style.display = 'none';
    detailContainer.style.display = 'block';
    detailContainer.classList.remove('hidden');
    detailContainer.removeAttribute('hidden');
    
    // Get the Chinese category name
    const chineseCategory = Config.categoryNameMap[category] || category;
    
    // Create subcategory articles content
    const articlesContent = `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <button id="back-button" class="mb-6 text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium inline-flex items-center">
          <i class="fa fa-arrow-left mr-2"></i>
          ${t('home')}
        </button>
        <div class="mb-8">
          <h1 class="text-2xl font-bold mb-2">${chineseCategory} / ${displaySubcategory}</h1>
          <p class="text-sm text-[var(--text-secondary)]">${articles.length} 篇文章</p>
        </div>
        ${articles.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${articles.map(article => {
            // Get Chinese category name for the article
            const articleChineseCategory = Config.categoryNameMap[article.category] || article.category;
            
            // Get subcategory display name for the article
            const articleSubcategoryDisplayName = Config.subcategoryNameMap[article.subcategory] || article.subcategory;
            
            return `
            <article class="card card-hover p-4 article-card" role="article" data-url="${article.url}">
              <div class="flex items-center justify-between mb-2">
                <span class="tag text-xs">${articleChineseCategory} / ${articleSubcategoryDisplayName}</span>
                <time class="text-xs text-[var(--text-muted)]">${formatDate(article.date)}</time>
              </div>
              <h3 class="font-semibold text-sm mb-2 hover:text-[var(--accent)] transition-colors line-clamp-2">
                <a href="${article.url}">${article.title?.[state.lang] || article.title?.zh}</a>
              </h3>
              <p class="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">
                ${article.description?.[state.lang] || article.description?.zh || article.excerpt}
              </p>
            </article>
            `;
          }).join('')}
        </div>
        ` : `
        <div class="text-center py-12">
          <i class="fa fa-search text-4xl text-[var(--text-muted)] mb-4"></i>
          <p class="text-[var(--text-secondary)]">没有找到相关文章</p>
        </div>
        `}
      </div>
    `;
    
    console.log('Setting subcategory articles content...');
    detailContainer.innerHTML = articlesContent;
    console.log('Subcategory articles content set successfully');
    
    // Update address bar with subcategory path
    window.location.hash = `${category}/${actualSubcategory}`;
    
    window.scrollTo(0, 0);

    // Add click handler for back button
    setTimeout(() => {
      const backBtn = document.getElementById('back-button');
      if (backBtn) {
        console.log('Adding back button listener');
        backBtn.addEventListener('click', backButtonToMain);
      } else {
        console.log('Back button not found');
      }
      
      // Reinitialize article card listeners for the new articles
      initArticleCardListeners();
    }, 100);
  } else {
    console.log('DOM elements not found');
  }
}

// Export functions for global access
window.SiteApp = {
  init,
  showArticle,
  backButtonToMain,
  toggleTheme,
  toggleLanguage
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
