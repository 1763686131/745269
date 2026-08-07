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
                <circle cx="12" cy="7" r="4"></circle><path d="M5.5 21v-2a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v2"></path>
              </svg>
              {{ t.single }}
            </a>
            <a href="#" class="nav-item">
              <svg class="cute-icon color-double" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {{ t.double }}
            </a>
            <a href="#" class="nav-item">
              <svg class="cute-icon color-multi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path><path d="M6 21v-2a6 6 0 0 1 12 0v2"></path><path d="M4.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M2 19v-1.5a4.5 4.5 0 0 1 3-4.2"></path><path d="M19.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M22 19v-1.5a4.5 4.5 0 0 0-3-4.2"></path>
              </svg>
              {{ t.multi }}
            </a>
            <a href="#" class="nav-item">
              <svg class="cute-icon color-classic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="4" ry="4"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><path d="M15 13h.01"></path><path d="M18 11h.01"></path>
              </svg>
              {{ t.classic }}
            </a>
            <a href="#" class="nav-item">
              <svg class="cute-icon color-goty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
              {{ t.goty }}
            </a>
          </nav>
        </div>

        <div class="navbar-right">

          <!-- 主题切换按钮 -->
          <button 
            @click="toggleTheme" 
            class="theme-toggle-btn"
            title="切换主题"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2.5" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            >
              <path d="M20.38 3.46 16 2a8.5 8.5 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </button>

          <button class="lang-toggle-btn" @click="toggleLang">
            {{ currentLang === 'zh' ? 'EN' : '中文' }}
          </button>
          <!-- <nav class="desktop-navigation hide-on-mobile">
            <button class="platform-btn" @click="handlePlatformClick('SWITCH')">SWITCH</button>
            <button class="platform-btn" @click="handlePlatformClick('PC')">PC</button>
            <button class="platform-btn" @click="handlePlatformClick('PS4')">PS4</button>
          </nav> -->
          <button class="mobile-hamburger-trigger" :class="{ 'menu-is-active': isMobileMenuOpen }" @click="isMobileMenuOpen = !isMobileMenuOpen">
            <span class="bar-line"></span><span class="bar-line"></span><span class="bar-line"></span>
          </button>
        </div>
      </div>


      <!-- 移动端下拉菜单 -->
      <transition name="menu-slide">
        <div v-if="isMobileMenuOpen" class="mobile-dropdown-menu">
          <div class="mobile-categories">
            <a href="#" class="mobile-nav-item">{{ t.single }}</a>
            <a href="#" class="mobile-nav-item">{{ t.double }}</a>
            <a href="#" class="mobile-nav-item">{{ t.multi }}</a>
            <a href="#" class="mobile-nav-item">{{ t.classic }}</a>
            <a href="#" class="mobile-nav-item">{{ t.goty }}</a>
          </div>
          <div class="mobile-divider"></div>
          <!-- <div class="mobile-platforms">
            <button class="mobile-menu-item" @click="handlePlatformClick('SWITCH'); isMobileMenuOpen = false">SWITCH</button>
            <button class="mobile-menu-item" @click="handlePlatformClick('PC'); isMobileMenuOpen = false">PC</button>
            <button class="mobile-menu-item" @click="handlePlatformClick('PS4'); isMobileMenuOpen = false">PS4</button>
          </div> -->
        </div>
      </transition>
    </header>

    <main class="center-search-section">
      <div class="search-content-wrapper" :class="{ 'is-searched': hasSearched }">
        
        <div class="brand-title-zone" :class="{ 'is-hidden': hasSearched }">
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
          
          <button 
            class="search-go-btn" 
            :class="{ 'is-disabled': searchCooldown > 0 || isSearching }"
            @click="executeSearch"
          >
            {{ searchCooldown > 0 ? `${searchCooldown}s` : 'GO' }}
          </button>
        </div>

        <div class="results-display-zone" v-if="hasSearched">
          
          <div v-if="isSearching" class="loading-state">
            <div class="loading-spinner"></div>
            <p class="result-text">{{ t.loading }}</p>
          </div>

          <div v-else-if="searchResults.length === 0" class="not-found-state">
            <p class="result-text">
              {{ t.notFound1 }}<span class="highlight">{{ lastSearchedKeyword }}</span>{{ t.notFound2 }}
            </p>
          </div>

          <div v-else class="success-state">
            <p class="result-text title-spacing">
              {{ t.found1 }}<span class="highlight text-blue">{{ searchResults.length }}</span>{{ t.found2 }}
            </p>
            
            <div class="game-grid-layout">
              <article 
                class="game-card" 
                v-for="game in searchResults" 
                :key="game.id"
              >
                <div class="card-image-wrapper">
                  <img v-if="game.media?.cover" :src="game.media.cover" alt="cover" class="actual-cover-image">
                  <div v-else class="image-placeholder">
                    <span class="placeholder-text">暂无封面</span>
                  </div>
                  <div class="rating-badge" v-if="game.download_count > 0">🔥 {{ game.download_count }} 下载</div>
                </div>
                
                <div class="card-content">
                  
                  <div class="title-row">
                    <h2 class="game-title">{{ game.title?.zh_CN || game.title?.en_US || '未命名游戏' }}</h2>
                    <!-- <span class="hardcode-rating">⭐ 9.8</span> -->
                  </div>

                  <p class="game-desc">{{ game.description || '暂无简介，尽情探索吧！' }}</p>
                  
                  <div class="card-tags-container">
                    
                    <div class="tag-row" v-if="getPlatformGroups(game).length > 0">
                      <template v-for="group in getPlatformGroups(game)" :key="group.platform">
                        <span class="cute-tag-pill bg-blue">{{ group.platform }}</span>
                        <span v-for="ver in group.versions" :key="ver" class="cute-tag-pill bg-purple">{{ ver }}</span>
                      </template>
                    </div>

                    <div class="tag-row" v-if="game.aliases && game.aliases.length > 0">
                      <span 
                        v-for="lang in game.aliases" 
                        :key="'l-'+lang" 
                        class="cute-tag-pill bg-green"
                      >
                        {{ lang.replace(/,|，/g, ' ') }}
                      </span>
                    </div>

                    <div class="tag-row" v-if="game.metadata?.genres && game.metadata.genres.length > 0">
                      <span 
                        v-for="genre in game.metadata.genres" 
                        :key="'g-'+genre" 
                        class="cute-tag-pill bg-pink"
                      >
                        {{ genre.replace(/,|，/g, ' ') }}
                      </span>
                    </div>

                  </div>

                </div>
              </article>
            </div>
          </div>

        </div>
      </div>
    </main>

    <footer class="global-footer">
      <p>{{ t.footer }}</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/store/gameStore'


// ---------- 主题切换核心逻辑 ----------
const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark') // 激活 theme.css 里的 html.dark
    localStorage.setItem('745269_theme', 'dark')   // 存入本地浏览器
  } else {
    document.documentElement.classList.remove('dark') // 变回白天
    localStorage.setItem('745269_theme', 'light')     
  }
}

const gameStore = useGameStore()
const searchQuery = ref('')
const isMobileMenuOpen = ref(false)

const hasSearched = ref(false)        
const isSearching = ref(false)        
const searchResults = ref([])         
const lastSearchedKeyword = ref('')   

const searchCooldown = ref(0)
let cooldownTimer = null

onMounted(() => {
  const savedTheme = localStorage.getItem('745269_theme')
  // 如果之前存过 dark，或者玩家系统本身就是深色模式
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  const untilTime = localStorage.getItem('frontSearchCooldownUntil')
  if (untilTime) {
    const now = Date.now()
    const remaining = Math.ceil((parseInt(untilTime) - now) / 1000)
    if (remaining > 0) {
      startCooldown(remaining)
    } else {
      localStorage.removeItem('frontSearchCooldownUntil')
    }
  }
})

const startCooldown = (secondsRemaining) => {
  searchCooldown.value = secondsRemaining
  if (cooldownTimer) clearInterval(cooldownTimer)
  
  cooldownTimer = setInterval(() => {
    searchCooldown.value--
    if (searchCooldown.value <= 0) {
      clearInterval(cooldownTimer)
      localStorage.removeItem('frontSearchCooldownUntil')
    }
  }, 1000)
}

const executeSearch = async () => {
  if (!searchQuery.value.trim()) return

  if (searchCooldown.value > 0 || isSearching.value) {
    if (searchCooldown.value > 0) alert(`搜索引擎充能中，请等待 ${searchCooldown.value} 秒！`)
    return
  }

  hasSearched.value = true
  isSearching.value = true
  lastSearchedKeyword.value = searchQuery.value 
  searchResults.value = [] 

  const until = Date.now() + 10000 
  localStorage.setItem('frontSearchCooldownUntil', until.toString())
  startCooldown(10)

  // 请求服务端数据
  const results = await gameStore.fetchSearchFromServer(searchQuery.value)
  
  isSearching.value = false
  searchResults.value = results

  if (results.length > 0) {
    console.log('%c👉 数据库匹配成功，完整源数据如下：', 'color: #10b981; font-weight: bold;', results)
  } else {
    console.log('%c⚠️ 未找到任何匹配数据。', 'color: #ef4444; font-weight: bold;')
  }
}

// 🌟 核心升级引擎：精确将平台和它自己的版本号绑定在一起
const getPlatformGroups = (game) => {
  const groups = []
  const downloads = game.downloads || []
  const platforms = game.metadata?.platforms || []

  // 建立映射表
  const platMap = new Map()

  // 1. 打底操作：确保在后台选了平台但没写网盘的，也能展示平台蓝标
  platforms.forEach(p => {
    platMap.set(p.toUpperCase(), { name: p, versions: new Set() })
  })

  // 2. 遍历网盘下载源，精准提取平台对应的版本号，自动干掉逗号
  downloads.forEach(dl => {
    if (!dl.platform) return
    const pKey = dl.platform.toUpperCase()
    
    // 兼容脏数据：网盘里填了某个平台，但分类没选，我们依然帮它显示
    if (!platMap.has(pKey)) {
      platMap.set(pKey, { name: dl.platform.toUpperCase(), versions: new Set() })
    }
    
    if (dl.edition) {
      platMap.get(pKey).versions.add(dl.edition.replace(/,|，/g, ' '))
    }
  })

  // 3. 转成渲染专用的数组
  platMap.forEach(val => {
    groups.push({
      platform: val.name,
      versions: Array.from(val.versions) // Array.from + Set 原生自动去重！
    })
  })

  return groups
}


const currentLang = ref('zh') 

const i18n = {
  zh: {
    single: '大型单人',
    double: '双人同屏',
    multi: '多人局域网',
    classic: '体感游戏',
    goty: '年度最佳',
    placeholder: '搜索游戏、攻略、密令...',
    footer: '© 2026 745269.COM. 保留所有权利。',
    loading: '正在连接服务器，检索核心数据库...',
    notFound1: '未找到关于 “',
    notFound2: '” 的相关信息。',
    found1: '成功为您检索到 ',
    found2: ' 款相关游戏：'
  },
  en: {
    single: 'Single Player',
    double: 'Co-op Split',
    multi: 'LAN Party',
    classic: 'Retro Games',
    goty: 'GOTY',
    placeholder: 'Search games, guides, codes...',
    footer: '© 2026 745269.COM. All Rights Reserved.',
    loading: 'Connecting to server, retrieving database...',
    notFound1: 'No info found for "',
    notFound2: '".',
    found1: 'Successfully retrieved ',
    found2: ' related games:'
  }
}

const t = computed(() => i18n[currentLang.value])

const toggleLang = () => {
  currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh'
}

const handlePlatformClick = (platform) => {
  console.log(`已选择平台: ${platform}`)
}
</script>

<style scoped>
/* ==================== 全局重置 ==================== */
:global(html), :global(body), :global(#app) {
  margin: 0 !important; padding: 0 !important; width: 100% !important;
  height: 100% !important; min-height: 100vh !important;
  background-color: var(--bg-body) !important; /* <--- 关键修改 */
}

.site-root-container {
  width: 100% !important; min-height: 100vh !important; 
  background-color: var(--bg-body) !important; /* <--- 关键修改 */
  display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box; position: relative;
}

/* ==================== 顶部导航栏 ==================== */
.global-navbar {
  width: 100%; height: 120px; 
  background-color: var(--bg-body); /* <--- 改掉纯白 */
  border-bottom: 1px solid var(--border-light); /* <--- 改掉死灰 */
  position: relative; z-index: 999;
}
/* 主题按钮悬浮样式 */
.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: transparent;
  color: var(--text-muted);
  border: 2px solid var(--border-main); /* 与语言按钮保持一致的边框 */
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-right: 12px; /* 和旁边的语言按钮拉开合适间距 */
}




.navbar-inner {
  max-width: 1600px; height: 100%; margin: 0 auto; padding: 0 32px;
  display: flex; align-items: center; justify-content: space-between;
}

.navbar-left { display: flex; align-items: center; gap: 48px; }
.site-logo { font-size: 35px; font-weight: 900; letter-spacing: -0.5px; user-select: none; }
.text-dark { color: var(--text-heading); }
.text-blue { color: #2563eb; }

.category-nav { display: flex; gap: 32px; }
.nav-item {
  display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700;
  color: #64748b; text-decoration: none; transition: color 0.2s ease;
}
/* 鼠标悬浮效果 */
.nav-item:hover {
  color: var(--text-heading);
}

.cute-icon { width: 22px; height: 22px; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.nav-item:hover .cute-icon { transform: scale(1.15) rotate(-8deg); }
.color-single { color: #f59e0b; } .color-double { color: #ec4899; } .color-multi { color: #10b981; }  
.color-classic { color: #8b5cf6; } .color-goty { color: #eab308; }    

/* 语言切换按钮 */
.lang-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px; /* 强制两兄弟高度一致 */
  background: transparent;
  color: var(--text-muted);
  border: 2px solid var(--border-main);
  padding: 0 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-right: 24px;
}

/* 共同的悬浮发光与微反弹特效 */
.theme-toggle-btn:hover,
.lang-toggle-btn:hover {
  color: var(--text-heading);
  border-color: var(--border-dark);
  background-color: var(--bg-hover);
  transform: scale(1.05); /* 鼠标移上去会有轻微的放大灵动感 */
}

.navbar-right { display: flex; align-items: center; }
/* .desktop-navigation { display: flex; gap: 16px; } */

/* .platform-btn {
  background: transparent; color: #2563eb; border: 1px solid #e0f2fe;
  padding: 8px 24px; font-size: 20px; font-weight: 700; border-radius: 8px;
  cursor: pointer; letter-spacing: 0.5px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.platform-btn:hover { background-color: #2563eb; color: #ffffff; border-color: #2563eb; box-shadow: 0 4px 14px rgba(37, 99, 211, 0.18); } */

.mobile-hamburger-trigger { display: none; background: transparent; border: none; width: 26px; height: 18px; flex-direction: column; justify-content: space-between; padding: 0; cursor: pointer; }
.bar-line { display: block; width: 100%; height: 2.5px; background-color: #1e293b; transition: transform 0.3s ease, opacity 0.3s ease; }

/* ==================== 中间搜索区与动画 ==================== */
.center-search-section {
  flex-grow: 1; display: flex; flex-direction: column; align-items: center; padding: 0 40px;
}

.search-content-wrapper {
  width: 100%; max-width: 1400px; 
  margin-top: 22vh; transition: all 0.7s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex; flex-direction: column; align-items: center;
}

.search-content-wrapper.is-searched { margin-top: 20px; }

.brand-title-zone {
  margin-bottom: 40px; max-height: 150px; opacity: 1; transform: translateY(0);
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1); overflow: hidden;
}
.brand-title-zone.is-hidden { max-height: 0; margin-bottom: 0; opacity: 0; transform: translateY(20px) scale(0.95); pointer-events: none; }

.brand-glitch-title { 
  font-size: 72px; font-weight: 900; 
  color: var(--text-heading); /* <--- 标题颜色动态化 */
  letter-spacing: -2px; margin: 0; position: relative; display: inline-block; 
}

.capsule-search-bar {
  width: 100%; max-width: 780px; height: 64px; 
  background-color: var(--bg-card); /* <--- 搜索框背景动态化 */
  border: 2px solid var(--border-dark);
  border-radius: 100px; display: flex; align-items: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden;
}

.search-core-input {
  flex-grow: 1; height: 100%; border: none !important; background: transparent !important;
  padding: 0 20px; font-size: 18px; 
  color: var(--text-main); /* <--- 输入框文字颜色动态化 */
  outline: none !important;
}

.search-go-btn {
  background: #2563eb; color: #ffffff; border: none; height: 100%; padding: 0 40px;
  font-size: 18px; font-weight: 800; cursor: pointer; letter-spacing: 1px; transition: all 0.2s;
}
.search-go-btn:hover:not(.is-disabled) { background-color: #1d4ed8; }
.search-go-btn.is-disabled { background-color: #cbd5e1; color: #f8fafc; cursor: not-allowed; padding: 0 30px; }

/* ==================== 🌟 下方结果展示与网格布局 ==================== */
.results-display-zone {
  width: 100%; margin-top: 40px; text-align: left;
  animation: fadeUpIn 0.6s ease forwards;
}
@keyframes fadeUpIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-state, .not-found-state { text-align: center; margin-top: 60px; }

.loading-spinner {
  display: inline-block; width: 44px; height: 44px; border: 4px solid #e2e8f0;
  border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }


.title-spacing { margin-bottom: 30px; text-align: left; }

/* 结果文字样式 */
.result-text { 
  color: var(--text-muted); 
  font-size: 18px; 
  font-weight: 600; 
  line-height: 1.6; 
}

.result-text .highlight { 
  color: var(--text-heading); /* 关键修复：从死黑改为动态变量 */
  font-weight: 900; 
}

.text-blue { color: #2563eb !important; }

/* 游戏卡片网格样式 */
.game-grid-layout {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 32px;
}

.game-card {
  background: var(--bg-card); /* <--- 卡片背景动态化 */
  border-radius: 16px;
  overflow: hidden; 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--border-light); /* <--- 边框动态化 */
}
.game-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(37, 99, 211, 0.1);
  border-color: var(--border-hover);
}

.card-image-wrapper { width: 100%; aspect-ratio: 16 / 9; position: relative; overflow: hidden; }
.actual-cover-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.image-placeholder {
  width: 100%; height: 100%; background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
  display: flex; align-items: center; justify-content: center;
}
.placeholder-text { color: #94a3b8; font-size: 14px; font-weight: 600; letter-spacing: 1px; }

.rating-badge {
  position: absolute; top: 12px; right: 12px;
  background: rgba(15, 23, 42, 0.85); color: #fbbf24;
  padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 800; backdrop-filter: blur(4px);
}

.card-content { padding: 24px; }

/* 标题与评分同行的精美布局 */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}
/* 卡片标题 */
.game-title {
  font-size: 20px; font-weight: 800; 
  color: var(--text-heading); /* <--- 卡片标题颜色动态化 */
  margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 1; 
}

.hardcode-rating {
  font-size: 15px; font-weight: 900; color: #f59e0b;
  background: #fffbeb; border: 1px solid #fde68a;
  padding: 4px 8px; border-radius: 8px; white-space: nowrap; flex-shrink: 0;
}

.game-desc {
  font-size: 14px; 
  color: var(--text-muted); /* <--- 简介文字颜色动态化 */
  line-height: 1.6; margin: 0 0 20px 0; height: 44.8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* 🌟 分排标签的容器引擎 */
.card-tags-container {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 控制三排标签之间的垂直距离 */
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* 同一排标签之间的水平距离 */
  align-items: center;
}

.cute-tag-pill { font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 100px; }

/* 多彩专属标签体系 */
.bg-blue { background-color: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; } 
.bg-pink { background-color: #fdf2f8; color: #db2777; border: 1px solid #fce7f3; } 
.bg-purple { background-color: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; } 
.bg-green { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; } 

.global-footer { width: 100%; padding: 28px 0; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid var(--border-light); }

/* ==================== 📱 移动端自适应 ==================== */
@media (max-width: 992px) { 
  .hide-on-mobile { display: none !important; }
  .mobile-hamburger-trigger { display: flex !important; }
  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(1) { transform: translateY(8px) rotate(45deg); }
  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(2) { opacity: 0; }
  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

  .mobile-dropdown-menu {
    position: absolute; top: 120px; left: 0; width: 100%; background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); z-index: 998;
  }
  .lang-toggle-btn { margin-right: 16px; }
  .mobile-categories { display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }
  .mobile-nav-item { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 700; color: #475569; text-decoration: none; }
  .mobile-divider { width: 100%; height: 1px; background-color: #f1f5f9; margin-bottom: 20px; }

  /*  */
  /* .mobile-platforms { display: flex; flex-direction: column; gap: 14px; } */
  /* .mobile-menu-item { width: 100%; background-color: #f8fafc; color: #2563eb; border: 1px solid #e2e8f0; padding: 14px 0; font-size: 15px; font-weight: 700; border-radius: 10px; cursor: pointer; }
  .mobile-menu-item:active { background-color: #2563eb; color: #ffffff; } */

  .center-search-section { padding: 0 20px; }
  
  .search-content-wrapper { margin-top: 15vh; }
  .search-content-wrapper.is-searched { margin-top: 20px; }
  .magnifier-icon { width: 20px; height: 20px; }
  .search-go-btn { padding: 0 28px; font-size: 15px; }
/* 卡片 */
  .game-grid-layout { grid-template-columns: 1fr; } 
  .menu-slide-enter-active, .menu-slide-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
  .menu-slide-enter-from, .menu-slide-leave-to { opacity: 0; transform: translateY(-15px); }
}
</style>