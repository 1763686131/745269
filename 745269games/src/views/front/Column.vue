<template>
  <div class="super-root-container">
    
    <div class="page-header-container">
      <div class="header-content">
        <h1 class="category-title">
          <span class="cyber-accent">⬅️</span> {{ currentCategory.title }}
        </h1>
        <p class="category-subtitle">为您找到 {{ totalCount }} 款精彩游戏</p>
      </div>

      <div class="filter-bar">
        <span class="filter-label">排序方式：</span>
        <div class="sort-buttons">
          <button class="sort-btn" :class="{ active: sortOrder === 'newest' }" @click="setSortOrder('newest')">最新发布</button>
          <button class="sort-btn" :class="{ active: sortOrder === 'oldest' }" @click="setSortOrder('oldest')">最早发布</button>
        </div>
      </div>
    </div>

    <div class="empty-state-box" v-if="!gameStore.isLoading && totalCount === 0">
      <div class="empty-icon">📭</div>
      <h3>未找到相关游戏</h3>
      <p>在“{{ currentCategory.title }}”分类下，暂未检索到任何数据 (找到 0 条数据)。</p>
      <button class="back-home-btn" @click="$router.push('/')">返回首页</button>
    </div>

    <div class="game-grid-layout" v-if="totalCount > 0">
      <article class="game-card" v-for="game in displayedGames" :key="game.id" @click="$router.push(`/game/${game.id}`)">
        <div class="card-image-wrapper">
          <img v-if="game.cover" :src="game.cover" :alt="game.title" class="game-cover-img" />
          <div v-else class="image-placeholder"><span class="placeholder-text">暂无封面</span></div>
          <div class="rating-badge" v-if="game.rating">⭐ {{ game.rating }}</div>
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

    <div class="load-more-container" v-if="gameStore.hasMore && totalCount > 0">
      <button class="load-more-btn" @click="loadMore" :disabled="gameStore.isLoading">
        <span v-if="!gameStore.isLoading">⬇️ 发现更多好游戏</span>
        <span v-else class="loading-flex"><span class="mini-spinner"></span> 正在努力搬运中...</span>
      </button>
    </div>
    <div class="all-loaded-hint" v-else-if="!gameStore.hasMore && totalCount > 0">
      🎮 已经到底啦，没有更多游戏了哦~
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '@/store/gameStore.js' 

const route = useRoute()
const gameStore = useGameStore()
const sortOrder = ref('newest')

// 💡 1. 定义核心路由映射字典
const categoryMap = {
  'single': { title: '大型单人游戏', tags: '单人' },
  'double': { title: '双人/多人同屏', tags: '双人,多人同屏' }, // 逗号隔开，传给后端
  'multi': { title: '局域网联机', tags: '局域网' },
  'classic': { title: '体感游戏', tags: '体感' },
  'goty': { title: '年度最佳', tags: '年度最佳' }
}

// 💡 2. 计算当前应该显示的标题和向服务器请求的标签
const currentCategory = computed(() => {
  return categoryMap[route.params.id] || { title: '全部游戏库', tags: '' }
})

// 💡 3. 初始化加载 & 监听路由变化自动重新拉取数据
const fetchCurrentCategoryGames = () => {
  // 把对应栏目的 tags 传给 Pinia 去服务端拉取
  gameStore.fetchGames(false, currentCategory.value.tags)
}

onMounted(() => {
  fetchCurrentCategoryGames()
})

// 当用户直接在顶栏切换不同栏目时，触发重新获取数据
watch(() => route.params.id, () => {
  if (route.name === 'Column') {
    fetchCurrentCategoryGames()
  }
})

const setSortOrder = (order) => { sortOrder.value = order }
const loadMore = () => { gameStore.fetchGames(true, currentCategory.value.tags) }

const displayedGames = computed(() => {
  let games = [...gameStore.allGames]
  games.sort((a, b) => {
    const timeA = new Date(a.system?.created_at || 0).getTime()
    const timeB = new Date(b.system?.created_at || 0).getTime()
    return sortOrder.value === 'newest' ? timeB - timeA : timeA - timeB
  })

  return games.map(game => {
    const tags = []
    if (game.metadata?.platforms) game.metadata.platforms.forEach(p => tags.push({ name: p, type: 'platform' }))
    if (game.metadata?.genres) game.metadata.genres.forEach(g => tags.push({ name: g, type: 'mode' }))
    return {
      id: game.id,
      title: game.title?.zh_CN || game.title?.en_US || '未命名游戏',
      desc: game.description || '暂无游戏简介...',
      cover: game.media?.cover || '',
      rating: game.metadata?.rating || null,
      tags: tags
    }
  })
})

const totalCount = computed(() => gameStore.allGames.length)
</script>

<style>

/* 清除 Vite 默认样式，接管全屏，并绑定主题大背景 */
html, body, #app {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  min-height: 100vh !important;
  background-color: var(--bg-body) !important;
  display: block !important; 
  transition: background-color 0.3s ease; /* 切换主题时增加平滑过渡动画 */
}
</style>

<style scoped>
/* =========================================
 * 🌟 核心替换：全面接入 theme.css 变量体系 
 * ========================================= */
.super-root-container {
  min-height: 100vh;
  background-color: var(--bg-body); /* 原 #f8fafc */
  padding: 40px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-main); /* 原 #0f172a */
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.super-root-container * {
  box-sizing: border-box;
}

/* 顶部区域 */
.page-header-container {
  max-width: 1400px;
  margin: 0 auto 40px auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid var(--border-main); /* 原 #e2e8f0 */
  padding-bottom: 20px;
}

.category-title {
  font-size: 36px;
  font-weight: 900;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
  color: var(--text-heading);
}
.cyber-accent { color: var(--color-primary); margin-right: 8px; }
.category-subtitle { margin: 0; color: var(--text-muted); font-size: 15px; }

.filter-bar { display: flex; align-items: center; gap: 16px; }
.filter-label { font-size: 14px; font-weight: 700; color: var(--text-light); }
.sort-buttons {
  display: flex; 
  background-color: var(--border-main); 
  border-radius: 8px; 
  padding: 4px;
}
.sort-btn {
  border: none; background: transparent; padding: 8px 16px; border-radius: 6px;
  font-size: 14px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s ease;
}
.sort-btn:hover { color: var(--text-heading); }
.sort-btn.active {
  background-color: var(--bg-card); 
  color: var(--color-primary); 
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* 卡片网格布局 */
.game-grid-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 32px;
}

/* 🍏 苹果级毛玻璃卡片样式 (完美融合深浅主题) */
.game-card {
  background: var(--bg-card); /* 主题背景变量 */
  border-radius: 16px;
  overflow: hidden; 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--border-light); /* 原 #f1f5f9 */
}
.game-card:hover {
  transform: translateY(-8px) scale(1.015);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

/* 图片占位与真实图片 */
.card-image-wrapper { width: 100%; aspect-ratio: 16 / 9; position: relative; overflow: hidden; }
.game-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.game-card:hover .game-cover-img {
  transform: scale(1.05);
}
.image-placeholder {
  width: 100%; height: 100%; 
  background: var(--bg-hover); /* 主题占位色 */
  display: flex; align-items: center; justify-content: center;
}
.placeholder-text { color: var(--text-light); font-size: 14px; font-weight: 600; letter-spacing: 1px; }

/* 评分角标 (保留原色彩块以做突出) */
.rating-badge {
  position: absolute; top: 12px; right: 12px;
  background: rgba(15, 23, 42, 0.85); color: #fbbf24;
  padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 800; backdrop-filter: blur(4px);
}

/* 文字内容区 */
.card-content { padding: 24px; }
.game-title {
  font-size: 20px; font-weight: 800; 
  color: var(--text-heading); 
  margin: 0 0 12px 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.game-desc {
  font-size: 14px; 
  color: var(--text-muted); 
  line-height: 1.6; margin: 0 0 20px 0; height: 44.8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* 🏷️ 精美内发光标签 (基于透明度，白天黑夜通吃) */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cute-tag-pill {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 12px; 
  border-radius: 100px; 
  letter-spacing: 0.5px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}
/* 玩法分类类标签 */
.bg-pink {
  background-color: rgba(236, 72, 153, 0.1); 
  color: var(--color-pink); 
  border: 1px solid rgba(236, 72, 153, 0.2);
}
/* 平台类标签 */
.bg-blue {
  background-color: rgba(37, 99, 235, 0.1); 
  color: var(--color-primary); 
  border: 1px solid rgba(37, 99, 235, 0.2);
}

/* ==================== ⬇️ 加载更多按钮样式 ==================== */
.load-more-container {
  max-width: 1400px;
  margin: 50px auto 20px auto;
  text-align: center;
}
.load-more-btn {
  background-color: var(--bg-card);
  color: var(--color-primary);
  border: 2px solid var(--border-main);
  padding: 12px 36px;
  border-radius: 100px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.load-more-btn:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: var(--text-white); /* 悬浮时字体变纯白 */
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 211, 0.15);
}
.load-more-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

/* 按钮内部的 Flex 对齐和转圈小动画 */
.loading-flex {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mini-spinner {
  width: 16px;
  height: 16px;
  border: 3px solid var(--border-main);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 到底提示语 */
.all-loaded-hint {
  text-align: center;
  margin: 50px 0 20px 0;
  font-size: 14px;
  color: var(--text-light);
  font-weight: 700;
}

/* 📱 移动端适配 */
@media (max-width: 768px) {
  .super-root-container { padding: 20px; }
  .page-header-container { flex-direction: column; align-items: flex-start; gap: 20px; }
  .category-title { font-size: 28px; }
  .game-grid-layout { grid-template-columns: 1fr; } 
  .load-more-btn { width: 100%; } 
}



/* @import '@/assets/styles/theme.css'; 确保能拿到变量，视你具体路径而定 */

.super-root-container {
  min-height: 100vh; background-color: var(--bg-body); padding: 40px; color: var(--text-main); transition: all 0.3s ease;
}
.page-header-container { max-width: 1400px; margin: 0 auto 40px auto; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid var(--border-main); padding-bottom: 20px; }
.category-title { font-size: 36px; font-weight: 900; margin: 0 0 8px 0; color: var(--text-heading); }
.cyber-accent { color: var(--color-primary); margin-right: 8px; }
.category-subtitle { margin: 0; color: var(--text-muted); font-size: 15px; }

/* ======== 🌟 新增的空状态样式 ======== */
.empty-state-box {
  max-width: 600px;
  margin: 80px auto;
  text-align: center;
  background: var(--bg-card);
  border: 1px dashed var(--border-dark);
  border-radius: 16px;
  padding: 60px 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.02);
}
.empty-icon { font-size: 64px; margin-bottom: 20px; opacity: 0.8; }
.empty-state-box h3 { color: var(--text-heading); font-size: 22px; margin-bottom: 10px; }
.empty-state-box p { color: var(--text-muted); font-size: 15px; margin-bottom: 30px; }
.back-home-btn {
  background-color: var(--color-primary, #2563eb); color: #fff; border: none; padding: 12px 30px;
  border-radius: 100px; font-size: 15px; font-weight: 800; cursor: pointer; transition: 0.3s;
}
.back-home-btn:hover { background-color: #1d4ed8; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.2); }

/* 原有其余网格和卡片样式略过...（请补全你原有的 CSS，或者直接用上面的覆盖，只需加上 .empty-state-box） */
.filter-bar { display: flex; align-items: center; gap: 16px; }
.filter-label { font-size: 14px; font-weight: 700; color: var(--text-light); }
.sort-buttons { display: flex; background-color: var(--border-main); border-radius: 8px; padding: 4px; }
.sort-btn { border: none; background: transparent; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s ease; }
.sort-btn.active { background-color: var(--bg-card); color: var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.game-grid-layout { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 32px; }
.game-card { background: var(--bg-card); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); backdrop-filter: blur(20px); transition: 0.3s; cursor: pointer; border: 1px solid var(--border-light); }
.game-card:hover { transform: translateY(-8px) scale(1.015); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1); border-color: var(--color-primary); }
.card-image-wrapper { width: 100%; aspect-ratio: 16 / 9; position: relative; overflow: hidden; }
.game-cover-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.image-placeholder { width: 100%; height: 100%; background: var(--bg-hover); display: flex; align-items: center; justify-content: center; }
.card-content { padding: 24px; }
.game-title { font-size: 20px; font-weight: 800; color: var(--text-heading); margin: 0 0 12px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.game-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin: 0 0 20px 0; height: 44.8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.cute-tag-pill { font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 100px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1); }
.bg-pink { background-color: rgba(236, 72, 153, 0.1); color: var(--color-pink); border: 1px solid rgba(236, 72, 153, 0.2); }
.bg-blue { background-color: rgba(37, 99, 235, 0.1); color: var(--color-primary); border: 1px solid rgba(37, 99, 235, 0.2); }
.load-more-container { max-width: 1400px; margin: 50px auto 20px auto; text-align: center; }
.load-more-btn { background-color: var(--bg-card); color: var(--color-primary); border: 2px solid var(--border-main); padding: 12px 36px; border-radius: 100px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.3s; }
.load-more-btn:hover:not(:disabled) { background-color: var(--color-primary); color: #fff; border-color: var(--color-primary); transform: translateY(-2px); }
.all-loaded-hint { text-align: center; margin: 50px 0 20px 0; font-size: 14px; color: var(--text-light); font-weight: 700; }
</style>


