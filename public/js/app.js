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

const i18n = {
  zh: {
    search: '搜索文章...',
    categories: '知识分类',
    articles: '最新文章',
    aboutCategory: '关于',
    about: '关于',
    qi: '器',
    shu: '术',
    dao: '道',
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
    qi: 'Tools (器)',
    shu: 'Techniques (术)',
    dao: 'Philosophy (道)',
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
        <span class="tag">${a.category}/${a.subcategory}</span>
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
    if (parts.length === 3) {
      showArticleDetail(parts[0], parts[1], parts[2]);
    } else {
      console.log('Hash parts length is not 3:', parts.length);
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
    
    // Create article content
    const articleContent = `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <button id="back-button" class="mb-6 text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium inline-flex items-center">
          <i class="fa fa-arrow-left mr-2"></i>
          ${t('home')}
        </button>
        <article class="article-content">
          <h1>${article.title?.[state.lang] || article.title?.zh}</h1>
          <div class="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] mb-8 py-4 border-b border-[var(--border)]">
            <time>${formatDate(article.date)}</time>
            <span class="tag">${article.category}/${article.subcategory}</span>
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
      const category = categoryHeading.textContent.trim();
      
      console.log('Subcategory clicked:', category, '/', subcategory);
      
      // Show articles for this subcategory
      showSubcategoryArticles(category, subcategory);
    });
  });
}

function showSubcategoryArticles(category, subcategory) {
  console.log('Showing articles for:', category, '/', subcategory);
  
  // Filter articles by category and subcategory
  const articles = state.articles.filter(article => 
    article.category === category && article.subcategory === subcategory
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
    
    // Create subcategory articles content
    const articlesContent = `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <button id="back-button" class="mb-6 text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium inline-flex items-center">
          <i class="fa fa-arrow-left mr-2"></i>
          ${t('home')}
        </button>
        <div class="mb-8">
          <h1 class="text-2xl font-bold mb-2">${category} / ${subcategory}</h1>
          <p class="text-sm text-[var(--text-secondary)]">${articles.length} 篇文章</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          ${articles.map(article => `
            <article class="card card-hover p-4 article-card" role="article" data-url="${article.url}">
              <h3 class="font-semibold text-sm mb-2 hover:text-[var(--accent)] transition-colors line-clamp-2">
                <a href="${article.url}">${article.title?.[state.lang] || article.title?.zh}</a>
              </h3>
              <p class="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">
                ${article.description ? (article.description.zh || article.description) : article.excerpt}
              </p>
              <time class="text-xs text-[var(--text-muted)]">${formatDate(article.date)}</time>
            </article>
          `).join('')}
        </div>
      </div>
    `;
    
    console.log('Setting subcategory articles content...');
    detailContainer.innerHTML = articlesContent;
    console.log('Subcategory articles content set successfully');
    
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
