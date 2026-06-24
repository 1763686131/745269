<template>
  <div class="site-root-container">
    
    <header class="global-navbar">
      <div class="navbar-inner">
        
        <div class="navbar-left">
          
          <div class="site-logo">
            <span class="text-dark">745269</span><span class="text-blue">.com</span>
          </div>

          <nav class="category-nav hide-on-mobile">
            <a href="#" class="nav-item">
              <svg class="cute-icon color-single" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M5.5 21v-2a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v2"></path>
              </svg>
              {{ t.single }}
            </a>

            <a href="#" class="nav-item">
              <svg class="cute-icon color-double" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {{ t.double }}
            </a>

            <a href="#" class="nav-item">
              <svg class="cute-icon color-multi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
                <path d="M6 21v-2a6 6 0 0 1 12 0v2"></path>
                <path d="M4.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
                <path d="M2 19v-1.5a4.5 4.5 0 0 1 3-4.2"></path>
                <path d="M19.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
                <path d="M22 19v-1.5a4.5 4.5 0 0 0-3-4.2"></path>
              </svg>
              {{ t.multi }}
            </a>

            <a href="#" class="nav-item">
              <svg class="cute-icon color-classic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="4" ry="4"></rect>
                <path d="M6 12h4"></path>
                <path d="M8 10v4"></path>
                <path d="M15 13h.01"></path>
                <path d="M18 11h.01"></path>
              </svg>
              {{ t.classic }}
            </a>

            <a href="#" class="nav-item">
              <svg class="cute-icon color-goty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
              {{ t.goty }}
            </a>
          </nav>
        </div>

        <div class="navbar-right">
          
          <button class="lang-toggle-btn" @click="toggleLang">
            {{ currentLang === 'zh' ? 'EN' : '中文' }}
          </button>

          <nav class="desktop-navigation hide-on-mobile">
            <button class="platform-btn" @click="handlePlatformClick('SWITCH')">SWITCH</button>
            <button class="platform-btn" @click="handlePlatformClick('PC')">PC</button>
            <button class="platform-btn" @click="handlePlatformClick('PS4')">PS4</button>
          </nav>

          <button 
            class="mobile-hamburger-trigger" 
            :class="{ 'menu-is-active': isMobileMenuOpen }"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <span class="bar-line"></span>
            <span class="bar-line"></span>
            <span class="bar-line"></span>
          </button>
        </div>

      </div>

      <transition name="menu-slide">
        <div v-if="isMobileMenuOpen" class="mobile-dropdown-menu">
          
          <div class="mobile-categories">
            <a href="#" class="mobile-nav-item">
              <svg class="cute-icon color-single" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="7" r="4"></circle><path d="M5.5 21v-2a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v2"></path>
              </svg> 
              {{ t.single }}
            </a>
            <a href="#" class="mobile-nav-item">
              <svg class="cute-icon color-double" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg> 
              {{ t.double }}
            </a>
            <a href="#" class="mobile-nav-item">
              <svg class="cute-icon color-multi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path><path d="M6 21v-2a6 6 0 0 1 12 0v2"></path><path d="M4.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M2 19v-1.5a4.5 4.5 0 0 1 3-4.2"></path><path d="M19.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M22 19v-1.5a4.5 4.5 0 0 0-3-4.2"></path>
              </svg> 
              {{ t.multi }}
            </a>
            <a href="#" class="mobile-nav-item">
              <svg class="cute-icon color-classic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="4" ry="4"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><path d="M15 13h.01"></path><path d="M18 11h.01"></path>
              </svg> 
              {{ t.classic }}
            </a>
            <a href="#" class="mobile-nav-item">
              <svg class="cute-icon color-goty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg> 
              {{ t.goty }}
            </a>
          </div>

          <div class="mobile-divider"></div>

          <div class="mobile-platforms">
            <button class="mobile-menu-item" @click="handlePlatformClick('SWITCH'); isMobileMenuOpen = false">SWITCH</button>
            <button class="mobile-menu-item" @click="handlePlatformClick('PC'); isMobileMenuOpen = false">PC</button>
            <button class="mobile-menu-item" @click="handlePlatformClick('PS4'); isMobileMenuOpen = false">PS4</button>
          </div>

        </div>
      </transition>
    </header>

    <main class="center-search-section">
      <div class="search-content-wrapper">
        
        <div class="brand-title-zone">
          <h1 class="brand-glitch-title" data-text="745269.com">745269.com</h1>
        </div>

        <div class="capsule-search-bar">
          <div class="search-icon-box">
            <svg class="magnifier-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input 
            v-model="searchQuery"
            type="text"
            :placeholder="t.placeholder"
            class="search-core-input"
            @keyup.enter="executeSearch"
          />
          
          <button class="search-go-btn" @click="executeSearch">GO</button>
        </div>

      </div>
    </main>

    <footer class="global-footer">
      <p>{{ t.footer }}</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const isMobileMenuOpen = ref(false)

// ==================== 🌐 语言包与切换逻辑 ====================
const currentLang = ref('zh') // 默认中文

const i18n = {
  zh: {
    single: '大型单人',
    double: '双人同屏',
    multi: '多人局域网',
    classic: '经典游戏',
    goty: '年度最佳',
    placeholder: '搜索游戏、攻略、密令...',
    footer: '© 2026 745269.COM. 保留所有权利。',
    searching: '正在为您检索'
  },
  en: {
    single: 'Single Player',
    double: 'Co-op Split',
    multi: 'LAN Party',
    classic: 'Retro Games',
    goty: 'GOTY',
    placeholder: 'Search games, guides, codes...',
    footer: '© 2026 745269.COM. All Rights Reserved.',
    searching: 'Searching for'
  }
}

// 自动响应当前语言的计算属性
const t = computed(() => i18n[currentLang.value])

// 切换语言的方法
const toggleLang = () => {
  currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh'
}
// =========================================================

const handlePlatformClick = (platform) => {
  console.log(`已选择平台: ${platform}`)
}

const executeSearch = () => {
  if (!searchQuery.value.trim()) return
  alert(`${t.value.searching}: ${searchQuery.value}`)
}
</script>

<style scoped>
/* ==================== 全局重置 ==================== */
:global(html), :global(body), :global(#app) {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 100vh !important;
  background-color: #ffffff !important;
}

.site-root-container {
  width: 100% !important;
  min-height: 100vh !important;
  background-color: #ffffff !important;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
  position: relative;
}
.site-root-container * { box-sizing: border-box; }

/* ==================== 顶部导航栏 ==================== */
.global-navbar {
  width: 100%;
  height: 120px; /* 您修改的高尺寸 */
  background-color: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  z-index: 999;
}
.navbar-inner {
  max-width: 1600px; 
  height: 100%;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 48px; 
}

.site-logo {
  font-size: 35px; /* 您修改的大尺寸 */
  font-weight: 900;
  letter-spacing: -0.5px;
  user-select: none;
}
.text-dark { color: #0f172a; }
.text-blue { color: #2563eb; }

.category-nav {
  display: flex;
  gap: 32px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px; 
  font-size: 20px;
  font-weight: 700;
  color: #64748b; 
  text-decoration: none;
  transition: color 0.2s ease;
}
.nav-item:hover { color: #0f172a; }

.cute-icon {
  width: 22px;
  height: 22px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
}
.nav-item:hover .cute-icon {
  transform: scale(1.15) rotate(-8deg); 
}

.color-single { color: #f59e0b; } 
.color-double { color: #ec4899; } 
.color-multi { color: #10b981; }  
.color-classic { color: #8b5cf6; } 
.color-goty { color: #eab308; }    

/* --- 🌐 新增：语言切换按钮样式 --- */
.lang-toggle-btn {
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 24px; /* 和右侧平台按钮拉开一点距离 */
}
.lang-toggle-btn:hover {
  color: #0f172a;
  border-color: #94a3b8;
  background-color: #f8fafc;
}

.navbar-right {
  display: flex;
  align-items: center;
}
.desktop-navigation {
  display: flex;
  gap: 16px;
}
.platform-btn {
  background: transparent;
  color: #2563eb;
  border: 1px solid #e0f2fe;
  padding: 8px 24px;
  font-size: 20px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.platform-btn:hover {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 4px 14px rgba(37, 99, 211, 0.18);
}

.mobile-hamburger-trigger {
  display: none;
  background: transparent;
  border: none;
  width: 26px;
  height: 18px;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  cursor: pointer;
}
.bar-line {
  display: block;
  width: 100%;
  height: 2.5px;
  background-color: #1e293b;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* ==================== 中间搜索区 ==================== */
.center-search-section {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
}
.search-content-wrapper {
  width: 100%;
  max-width: 780px;
  text-align: center;
  transform: translateY(-35px);
}
.brand-title-zone { margin-bottom: 40px; }
.brand-glitch-title {
  font-size: 72px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2px;
  margin: 0;
  position: relative;
  display: inline-block;
}
.brand-glitch-title::before, .brand-glitch-title::after {
  content: attr(data-text);
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
}
.brand-glitch-title::before { left: -2px; text-shadow: 2px 0 rgba(239, 68, 68, 0.18); }
.brand-glitch-title::after { left: 2px; text-shadow: -2px 0 rgba(37, 99, 211, 0.18); }

.capsule-search-bar {
  width: 100%;
  height: 64px;
  background-color: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 100px;
  display: flex;
  align-items: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.capsule-search-bar:focus-within {
  border-color: #2563eb;
  box-shadow: 0 16px 45px rgba(37, 99, 211, 0.16);
  transform: scale(1.01);
}
.search-icon-box {
  padding-left: 24px;
  display: flex;
  align-items: center;
}
.magnifier-icon {
  width: 24px;
  height: 24px;
  color: #94a3b8;
  transition: color 0.3s;
}
.capsule-search-bar:focus-within .magnifier-icon { color: #2563eb; }

.search-core-input {
  flex-grow: 1;
  height: 100%;
  border: none !important;
  background: transparent !important;
  padding: 0 20px;
  font-size: 18px;
  color: #0f172a;
  outline: none !important;
}
.search-core-input::placeholder { color: #94a3b8; }

.search-go-btn {
  background: #2563eb;
  color: #ffffff;
  border: none;
  height: 100%;
  padding: 0 40px;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 1px;
  transition: background-color 0.2s;
}
.search-go-btn:hover { background-color: #1d4ed8; }

.global-footer {
  width: 100%;
  padding: 28px 0;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  border-top: 1px solid #f8fafc;
}

/* ==================== 📱 移动端自适应完美收纳 ==================== */
@media (max-width: 992px) { 
  .hide-on-mobile {
    display: none !important;
  }
  .mobile-hamburger-trigger {
    display: flex !important;
  }

  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(1) { transform: translateY(8px) rotate(45deg); }
  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(2) { opacity: 0; }
  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

  .mobile-dropdown-menu {
    position: absolute;
    /* ⚠️ 这里的 top 必须与你修改后的 nav 高度保持一致，已帮你改为 120px */
    top: 120px; 
    left: 0;
    width: 100%;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 24px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
    z-index: 998;
  }

  /* 移动端把语言切换按钮挤近一点 */
  .lang-toggle-btn { margin-right: 16px; }

  .mobile-categories {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 20px;
  }
  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 700;
    color: #475569;
    text-decoration: none;
  }
  
  .mobile-divider {
    width: 100%;
    height: 1px;
    background-color: #f1f5f9;
    margin-bottom: 20px;
  }

  .mobile-platforms {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .mobile-menu-item {
    width: 100%;
    background-color: #f8fafc;
    color: #2563eb;
    border: 1px solid #e2e8f0;
    padding: 14px 0;
    font-size: 15px;
    font-weight: 700;
    border-radius: 10px;
    cursor: pointer;
  }
  .mobile-menu-item:active {
    background-color: #2563eb;
    color: #ffffff;
  }

  .center-search-section { padding: 0 20px; }
  .search-content-wrapper { transform: translateY(0); }
  .brand-glitch-title { font-size: 40px; letter-spacing: -1px; }
  .capsule-search-bar { height: 52px; }
  .search-core-input { font-size: 15px; padding: 0 12px; }
  .magnifier-icon { width: 20px; height: 20px; }
  .search-go-btn { padding: 0 28px; font-size: 15px; }

  .menu-slide-enter-active, .menu-slide-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
  .menu-slide-enter-from, .menu-slide-leave-to { opacity: 0; transform: translateY(-15px); }
}
</style>