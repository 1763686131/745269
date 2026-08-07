<template>
  <div class="super-root-container">
    
    <div class="page-header-container">
      <div class="header-content">
        <h1 class="category-title">
          <span class="cyber-accent">/</span> 游戏列表占位
        </h1>
        <p class="category-subtitle">为您找到 {{ gameStore.totalCount }} 款精彩游戏</p>
      </div>

      <div class="filter-bar">
        <span class="filter-label">排序方式：</span>
        <div class="sort-buttons">
          <button 
            class="sort-btn" 
            :class="{ active: gameStore.sortOrder === 'newest' }" 
            @click="gameStore.setSortOrder('newest')"
          >
            最新发布
          </button>
          <button 
            class="sort-btn" 
            :class="{ active: gameStore.sortOrder === 'oldest' }" 
            @click="gameStore.setSortOrder('oldest')"
          >
            最早发布
          </button>
        </div>
      </div>
    </div>

    <div class="game-grid-layout">
      
      <article 
        class="game-card" 
        v-for="game in gameStore.displayedGames" 
        :key="game.id"
      >
        <div class="card-image-wrapper">
          <div class="image-placeholder">
            <span class="placeholder-text">封面载入中...</span>
          </div>
          <div class="rating-badge" v-if="game.rating">⭐ {{ game.rating }}</div>
        </div>
        
        <div class="card-content">
          <h2 class="game-title">{{ game.title }}</h2>
          <p class="game-desc">{{ game.desc }}</p>
          
          <div class="card-tags">
            <span 
              v-for="(tag, index) in game.tags" 
              :key="index"
              class="cute-tag-pill"
              :class="tag.type === 'mode' ? 'bg-pink' : 'bg-blue'"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>
      </article>

    </div>

    <div class="load-more-container" v-if="gameStore.hasMore">
      <button 
        class="load-more-btn" 
        @click="gameStore.loadMore" 
        :disabled="gameStore.isLoading"
      >
        <span v-if="!gameStore.isLoading">⬇️ 发现更多好游戏</span>
        <span v-else class="loading-flex">
          <span class="mini-spinner"></span> 正在努力搬运中...
        </span>
      </button>
    </div>
    
    <div class="all-loaded-hint" v-else-if="gameStore.totalCount > 0">
      🎮 已经到底啦，没有更多游戏了哦~
    </div>

  </div>
</template>

<script setup>
// 仅仅只需要引入仓库，页面逻辑彻底减负！
import { useGameStore } from '@/store/gameStore.js'

// 实例化仓库
const gameStore = useGameStore()
</script>

<style>
/* 清除 Vite 默认样式，接管全屏 */
html, body, #app {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  min-height: 100vh !important;
  background-color: #f8fafc !important;
  display: block !important; 
}
</style>

<style scoped>
.super-root-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 40px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #0f172a;
  box-sizing: border-box;
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
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 20px;
}

.category-title {
  font-size: 36px;
  font-weight: 900;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}
.cyber-accent { color: #2563eb; margin-right: 8px; }
.category-subtitle { margin: 0; color: #64748b; font-size: 15px; }

.filter-bar { display: flex; align-items: center; gap: 16px; }
.filter-label { font-size: 14px; font-weight: 700; color: #94a3b8; }
.sort-buttons {
  display: flex; background-color: #e2e8f0; border-radius: 8px; padding: 4px;
}
.sort-btn {
  border: none; background: transparent; padding: 8px 16px; border-radius: 6px;
  font-size: 14px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s ease;
}
.sort-btn:hover { color: #0f172a; }
.sort-btn.active {
  background-color: #ffffff; color: #2563eb; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* 卡片网格布局 */
.game-grid-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 32px;
}

/* 卡片样式 */
.game-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden; 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid #f1f5f9;
}
.game-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(37, 99, 211, 0.1);
  border-color: #dbeafe;
}

/* 图片占位 */
.card-image-wrapper { width: 100%; aspect-ratio: 16 / 9; position: relative; overflow: hidden; }
.image-placeholder {
  width: 100%; height: 100%; background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
  display: flex; align-items: center; justify-content: center;
}
.placeholder-text { color: #94a3b8; font-size: 14px; font-weight: 600; letter-spacing: 1px; }

/* 评分角标 */
.rating-badge {
  position: absolute; top: 12px; right: 12px;
  background: rgba(15, 23, 42, 0.85); color: #fbbf24;
  padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 800; backdrop-filter: blur(4px);
}

/* 文字内容区 */
.card-content { padding: 24px; }
.game-title {
  font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.game-desc {
  font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 20px 0; height: 44.8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* 💡 重新设计的可爱标签样式 */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* 标签之间的间距 */
}
.cute-tag-pill {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 12px; /* 增加左右内边距，挤出饱满的胶囊感 */
  border-radius: 100px; /* 彻底圆润化 */
}
/* 马卡龙猛男粉：玩法类 */
.bg-pink {
  background-color: #fdf2f8; 
  color: #db2777; 
  border: 1px solid #fce7f3;
}
/* 马卡龙科技蓝：平台类 */
.bg-blue {
  background-color: #eff6ff; 
  color: #2563eb; 
  border: 1px solid #dbeafe;
}

/* ==================== ⬇️ 加载更多按钮样式 ==================== */
.load-more-container {
  max-width: 1400px;
  margin: 50px auto 20px auto;
  text-align: center;
}
.load-more-btn {
  background-color: #ffffff;
  color: #2563eb;
  border: 2px solid #dbeafe;
  padding: 12px 36px;
  border-radius: 100px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(37, 99, 211, 0.05);
}
.load-more-btn:hover:not(:disabled) {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
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
  border: 3px solid #bfdbfe;
  border-top-color: #2563eb;
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
  color: #94a3b8;
  font-weight: 700;
}

/* 📱 移动端适配 */
@media (max-width: 768px) {
  .super-root-container { padding: 20px; }
  .page-header-container { flex-direction: column; align-items: flex-start; gap: 20px; }
  .category-title { font-size: 28px; }
  .game-grid-layout { grid-template-columns: 1fr; } 
  .load-more-btn { width: 100%; } /* 手机上按钮拉满 */
}
</style>