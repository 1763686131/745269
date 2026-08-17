<template>
  <div class="super-root-container">
    
    <div class="page-header-container">
      <div class="header-content">
        <h1 class="category-title">
          <span class="cyber-accent" @click="$router.push('/')" title="返回首页">⬅</span> 
          {{ currentCategory.title }}
        </h1>
        <p class="category-subtitle">已从服务器为您搬运 {{ totalCount }} 款游戏入库</p>
      </div>

      <div class="filter-bar">
        <span class="filter-label">排序方式：</span>
        <div class="sort-buttons">
          <button class="sort-btn" :class="{ active: sortOrder === 'newest' }" @click="setSortOrder('newest')">最新发布</button>
          <button class="sort-btn" :class="{ active: sortOrder === 'oldest' }" @click="setSortOrder('oldest')">最早发布</button>
          <button class="sort-btn hot-btn" :class="{ active: sortOrder === 'hot' }" @click="setSortOrder('hot')">🔥 热门下载</button>
          <button class="sort-btn likes-btn" :class="{ active: sortOrder === 'likes' }" @click="setSortOrder('likes')">👍 赞爆最多</button>
        </div>
      </div>
    </div>

    <div class="advanced-filter-container" v-if="availablePlatforms.length > 1 || availableGenres.length > 1">
      
      <div class="filter-row" v-if="availablePlatforms.length > 1">
        <span class="filter-label">支持平台：</span>
        <div class="genre-buttons">
          <button 
            v-for="plat in availablePlatforms" 
            :key="plat"
            class="genre-btn plat-btn"
            :class="{ active: selectedPlatform === plat }"
            @click="setPlatform(plat)"
          >
            {{ plat }}
          </button>
        </div>
      </div>

      <div class="filter-row" v-if="availableGenres.length > 1">
        <span class="filter-label">游戏玩法：</span>
        <div class="genre-buttons">
          <button 
            v-for="genre in availableGenres" 
            :key="genre"
            class="genre-btn"
            :class="{ active: selectedGenre === genre }"
            @click="setGenre(genre)"
          >
            {{ genre }}
          </button>
        </div>
      </div>

    </div>

    <div class="empty-state-box" v-if="!gameStore.isLoading && totalCount === 0">
      <div class="empty-icon">📭</div>
      <h3>未找到相关游戏</h3>
      <p>在“{{ currentCategory.title }}”分类下，服务器暂无任何数据。</p>
      <button class="back-home-btn" @click="$router.push('/')">返回首页</button>
    </div>

    <div class="empty-state-box local-empty" v-if="totalCount > 0 && displayedGames.length === 0">
      <div class="empty-icon">🔍</div>
      <h3>当前筛选暂无数据</h3>
      <p>
        未找到属于平台“<span class="highlight-text">{{ selectedPlatform }}</span>” 
        且分类为“<span class="highlight-text">{{ selectedGenre }}</span>” 的游戏。
      </p>
      <p class="hint-text">您可以尝试【加载更多】从服务器获取新数据，或者放宽筛选条件。</p>
    </div>

    <div class="game-grid-layout" v-if="displayedGames.length > 0">
      <article class="game-card" v-for="game in paginatedGames" :key="game.id" @click="$router.push(`/game/${game.id}`)">
        <div class="card-image-wrapper">
          <img v-if="game.cover" :src="game.cover" :alt="game.title" class="game-cover-img" />
          <div v-else class="image-placeholder"><span class="placeholder-text">暂无封面</span></div>
          <div class="rating-badge" v-if="sortOrder === 'hot' || sortOrder === 'likes'">
            {{ sortOrder === 'hot' ? `🔥 ${game.downloadsCount} 下载` : `👍 ${game.likesCount} 赞爆` }}
          </div>
          <div class="rating-badge" v-else-if="game.rating">⭐ {{ game.rating }}</div>
        </div>
        
        <div class="card-content">
          <h2 class="game-title">{{ game.title }}</h2>
          <p class="game-desc">{{ game.desc }}</p>
          <div class="card-tags">
            <span v-for="(tag, index) in game.tags" :key="index" class="cute-tag-pill" :class="tag.type === 'mode' ? 'bg-pink' : 'bg-blue'">
              {{ tag.name }}
            </span>
          </div>
        </div>
      </article>
    </div>

    <div class="load-more-container" v-if="gameStore.hasMore">
      <button class="load-more-btn" @click="loadMore" :disabled="gameStore.isLoading">
        <span v-if="!gameStore.isLoading">⬇️ 从服务器加载更多 (当前已载入 {{ totalCount }} 条)</span>
        <span v-else class="loading-flex"><span class="mini-spinner"></span> 正在努力搬运中...</span>
      </button>
    </div>
    
    <div class="all-loaded-hint" v-else-if="!gameStore.hasMore && totalCount > 0">
      🎮 服务器数据已全部加载至本地啦，尽情筛选吧！
    </div>
    <Pagination 
      v-model:currentPage="currentPage" 
      :totalItems="displayedGames.length" 
      :pageSize="pageSize" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '@/store/gameStore.js' 
import Pagination from '@/components/common/Pagination.vue'

const route = useRoute()
const gameStore = useGameStore()

// ==========================================
// 🌟 1. 变量声明必须放在最前面 (先买菜)
// ==========================================

// 智能读取记忆的筛选状态
const getInitialFilter = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem('column_filter_state') || '{}')
    if (saved && saved.categoryId === route.params.id) {
      return saved
    }
  } catch (e) {}
  return { platform: '全部', genre: '全部', sortOrder: 'newest' }
}

const initialFilter = getInitialFilter()

const selectedPlatform = ref(initialFilter.platform || '全部')
const selectedGenre = ref(initialFilter.genre || '全部')
const sortOrder = ref(initialFilter.sortOrder || 'newest')

const currentPage = ref(1)
const pageSize = 20

// ==========================================
// 🌟 2. 监听器和方法放到后面 (再炒菜)
// ==========================================

// 监听筛选条件，只要用户切了分类、换了排序，立刻自动回到第 1 页！
watch([selectedPlatform, selectedGenre, sortOrder], () => {
  currentPage.value = 1
})

const saveFilterState = () => {
  const state = {
    categoryId: route.params.id,
    platform: selectedPlatform.value,
    genre: selectedGenre.value,
    sortOrder: sortOrder.value
  }
  sessionStorage.setItem('column_filter_state', JSON.stringify(state))
}

// 监听一级平台变化：重置二级玩法并更新状态
watch(selectedPlatform, (newVal) => {
  selectedGenre.value = '全部'
  saveFilterState()
})

const categoryMap = {
  'single': { title: '大型单人游戏', tags: '单人' },
  'double': { title: '双人/多人同屏', tags: '双人,多人同屏' }, 
  'multi': { title: '局域网联机', tags: '局域网' },
  'classic': { title: '体感游戏', tags: '体感' },
  'goty': { title: '年度最佳', tags: '年度最佳' }
}

const currentCategory = computed(() => {
  return categoryMap[route.params.id] || { title: '全部游戏库', tags: '' }
})

// === 支持平台 ===
const availablePlatforms = computed(() => {
  const platforms = new Set()
  gameStore.allGames.forEach(game => {
    if (game.metadata?.platforms && Array.isArray(game.metadata.platforms)) {
      game.metadata.platforms.forEach(p => {
        const cleanTag = p.replace(/,|，/g, ' ').trim()
        if (cleanTag) platforms.add(cleanTag.toUpperCase())
      })
    }
  })
  return ['全部', ...Array.from(platforms)]
})

// === 游戏玩法 ===
const availableGenres = computed(() => {
  const genres = new Set()
  let gamesToExtract = gameStore.allGames
  
  if (selectedPlatform.value !== '全部') {
    gamesToExtract = gamesToExtract.filter(game => {
      const pTags = game.metadata?.platforms || []
      return pTags.some(tag => tag.toUpperCase().includes(selectedPlatform.value))
    })
  }

  gamesToExtract.forEach(game => {
    if (game.metadata?.genres && Array.isArray(game.metadata.genres)) {
      game.metadata.genres.forEach(g => {
        const cleanTag = g.replace(/,|，/g, ' ').trim()
        if (cleanTag) genres.add(cleanTag)
      })
    }
  })
  return ['全部', ...Array.from(genres)]
})

const setGenre = (genre) => { 
  selectedGenre.value = genre 
  saveFilterState()
}

const setPlatform = (plat) => { 
  selectedPlatform.value = plat 
}

const setSortOrder = (order) => { 
  sortOrder.value = order 
  saveFilterState()
}

// 🚀 本地超级计算引擎
const displayedGames = computed(() => {
  let games = [...gameStore.allGames]

  if (selectedPlatform.value !== '全部') {
    games = games.filter(game => {
      const pTags = game.metadata?.platforms || []
      return pTags.some(tag => tag.toUpperCase().includes(selectedPlatform.value))
    })
  }

  if (selectedGenre.value !== '全部') {
    games = games.filter(game => {
      const gTags = game.metadata?.genres || []
      return gTags.some(tag => tag.includes(selectedGenre.value))
    })
  }

  games.sort((a, b) => {
    if (sortOrder.value === 'newest') {
      return new Date(b.system?.created_at || 0).getTime() - new Date(a.system?.created_at || 0).getTime()
    } else if (sortOrder.value === 'oldest') {
      return new Date(a.system?.created_at || 0).getTime() - new Date(b.system?.created_at || 0).getTime()
    } else if (sortOrder.value === 'hot') {
      const dlA = a.download_count || 0
      const dlB = b.download_count || 0
      return dlB - dlA
    } else if (sortOrder.value === 'likes') {
      const likeA = a.likes || a.likesCount || 0
      const likeB = b.likes || b.likesCount || 0
      return likeB - likeA
    }
  })

  return games.map(game => {
    const tags = []
    if (game.metadata?.platforms) game.metadata.platforms.forEach(p => tags.push({ name: p.toUpperCase(), type: 'platform' }))
    if (game.metadata?.genres) game.metadata.genres.forEach(g => tags.push({ name: g, type: 'mode' }))
    return {
      id: game.id,
      title: game.title?.zh_CN || game.title?.en_US || '未命名游戏',
      desc: game.description || '暂无游戏简介...',
      cover: game.media?.cover || '',
      rating: game.metadata?.rating || null,
      downloadsCount: game.download_count || 0,
      likesCount: game.likes || game.likesCount || 0,
      tags: tags
    }
  })
})

// 🌟 本地分页切割引擎
const paginatedGames = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return displayedGames.value.slice(start, end)
})

const totalCount = computed(() => gameStore.allGames.length)

const fetchCurrentCategoryGames = () => {
  gameStore.fetchGames(false, currentCategory.value.tags)
}

onMounted(() => {
  fetchCurrentCategoryGames()
})

watch(() => route.params.id, () => {
  if (route.name === 'Column') {
    selectedGenre.value = '全部'
    selectedPlatform.value = '全部'
    sortOrder.value = 'newest'
    saveFilterState()
    fetchCurrentCategoryGames()
  }
})

const loadMore = () => { gameStore.fetchGames(true, currentCategory.value.tags) }
</script>


<style scoped>
@import '@/assets/styles/theme.css'; 

/* 保持你的 CSS 完全不变... */
.super-root-container { min-height: 100vh; background-color: var(--bg-body); padding: 40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: var(--text-main); box-sizing: border-box; transition: all 0.3s ease; }
.super-root-container * { box-sizing: border-box; }
.page-header-container { max-width: 1400px; margin: 0 auto 20px auto; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid var(--border-main); padding-bottom: 20px; }
.category-title { font-size: 36px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -1px; color: var(--text-heading); }
.cyber-accent { color: var(--color-primary); margin-right: 8px; cursor: pointer; display: inline-block; transition: transform 0.2s ease; }
.cyber-accent:hover { transform: translateX(-4px) scale(1.1); }
.category-subtitle { margin: 0; color: var(--text-muted); font-size: 15px; }
.filter-bar { display: flex; align-items: center; gap: 16px; }
.filter-label { font-size: 14px; font-weight: 800; color: var(--text-light); white-space: nowrap; }
.sort-buttons { display: flex; background-color: var(--border-main); border-radius: 8px; padding: 4px; }
.sort-btn { border: none; background: transparent; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s ease; }
.sort-btn:hover { color: var(--text-heading); }
.sort-btn.active { background-color: var(--bg-card); color: var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.sort-btn.hot-btn.active { color: #f97316; } 
.sort-btn.likes-btn.active { color: #ec4899; } 
.advanced-filter-container { max-width: 1400px; margin: 0 auto 30px auto; display: flex; flex-direction: column; gap: 16px; padding: 20px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-light); box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
.filter-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.genre-buttons { display: flex; flex-wrap: wrap; gap: 10px; }
.genre-btn { background: var(--bg-hover); border: 1px solid var(--border-main); color: var(--text-muted); padding: 6px 18px; border-radius: 20px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.genre-btn:hover { color: var(--text-heading); border-color: var(--border-dark); transform: scale(1.05); }
.genre-btn.active { background: var(--color-primary, #2563eb); color: #fff; border-color: var(--color-primary, #2563eb); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); transform: scale(1.05); }
.plat-btn.active { background: #10b981; color: #fff; border-color: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
.empty-state-box { max-width: 600px; margin: 80px auto; text-align: center; background: var(--bg-card); border: 1px dashed var(--border-dark); border-radius: 16px; padding: 60px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
.empty-state-box.local-empty { border-style: solid; background: transparent; box-shadow: none; padding: 40px 20px; }
.empty-icon { font-size: 64px; margin-bottom: 20px; opacity: 0.8; }
.empty-state-box h3 { color: var(--text-heading); font-size: 22px; margin-bottom: 10px; }
.empty-state-box p { color: var(--text-muted); font-size: 15px; margin-bottom: 10px; }
.highlight-text { color: var(--color-primary); font-weight: 800; font-size: 16px; padding: 0 4px; }
.hint-text { font-size: 13px !important; color: var(--text-light) !important; margin-bottom: 30px !important; }
.back-home-btn { background-color: var(--color-primary, #2563eb); color: #fff; border: none; padding: 12px 30px; border-radius: 100px; font-size: 15px; font-weight: 800; cursor: pointer; transition: 0.3s; }
.back-home-btn:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.2); }
.game-grid-layout { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 32px; }
.game-card { background: var(--bg-card); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease; cursor: pointer; border: 1px solid var(--border-light); }
.game-card:hover { transform: translateY(-8px) scale(1.015); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1); border-color: var(--color-primary); }


.card-image-wrapper { 
  width: 100%; 
  aspect-ratio: 16 / 9; 
  position: relative; 
  overflow: hidden; 
}

.game-cover-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }

.game-card:hover .game-cover-img { transform: scale(1.05); }

.image-placeholder { width: 100%; height: 100%; background: var(--bg-hover); display: flex; align-items: center; justify-content: center; }
.placeholder-text { color: var(--text-light); font-size: 14px; font-weight: 600; letter-spacing: 1px; }
.rating-badge { position: absolute; top: 12px; right: 12px; background: rgba(15, 23, 42, 0.85); color: #fbbf24; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 800; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.1); }
.card-content { padding: 24px; }
.game-title { font-size: 20px; font-weight: 800; color: var(--text-heading); margin: 0 0 12px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.game-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin: 0 0 20px 0; height: 44.8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.cute-tag-pill { font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 100px; letter-spacing: 0.5px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1); }
.bg-pink { background-color: rgba(236, 72, 153, 0.1); color: var(--color-pink); border: 1px solid rgba(236, 72, 153, 0.2); }
.bg-blue { background-color: rgba(37, 99, 235, 0.1); color: var(--color-primary); border: 1px solid rgba(37, 99, 235, 0.2); }
.load-more-container { max-width: 1400px; margin: 50px auto 20px auto; text-align: center; }
.load-more-btn { background-color: var(--bg-card); color: var(--color-primary); border: 2px solid var(--border-main); padding: 12px 36px; border-radius: 100px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
.load-more-btn:hover:not(:disabled) { background-color: var(--color-primary); color: #fff; border-color: var(--color-primary); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37, 99, 211, 0.15); }
.load-more-btn:disabled { opacity: 0.8; cursor: not-allowed; }
.loading-flex { display: flex; align-items: center; gap: 10px; }
.mini-spinner { width: 16px; height: 16px; border: 3px solid var(--border-main); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.all-loaded-hint { text-align: center; margin: 50px 0 20px 0; font-size: 14px; color: var(--text-light); font-weight: 700; }
@media (max-width: 768px) {
  .super-root-container { padding: 20px; }
  .page-header-container { flex-direction: column; align-items: flex-start; gap: 20px; }
  .category-title { font-size: 28px; }
  .game-grid-layout { grid-template-columns: 1fr; } 
  .load-more-btn { width: 100%; } 
  .filter-bar { width: 100%; justify-content: space-between; flex-wrap: wrap;}
  .sort-buttons { flex-wrap: wrap; width: 100%; }
  .sort-btn { flex: 1 1 calc(50% - 10px); text-align: center; } 
}
</style>