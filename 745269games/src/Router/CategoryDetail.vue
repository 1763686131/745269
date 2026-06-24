<template>
  <div class="category-page-root">
    
    <div class="page-header-container">
      <div class="header-content">
        <h1 class="category-title">
          <span class="cyber-accent">/</span> {{ currentCategoryName }}
        </h1>
        <p class="category-subtitle">为您找到 {{ gameList.length }} 款精彩游戏</p>
      </div>

      <div class="filter-bar">
        <span class="filter-label">排序方式：</span>
        <div class="sort-buttons">
          <button 
            class="sort-btn" 
            :class="{ active: sortOrder === 'newest' }" 
            @click="handleSort('newest')"
          >
            最新发布
          </button>
          <button 
            class="sort-btn" 
            :class="{ active: sortOrder === 'oldest' }" 
            @click="handleSort('oldest')"
          >
            最早发布
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loader-spinner"></div>
      <p>正在连接数据库引擎...</p>
    </div>

    <div v-else class="game-grid-layout">
      <article 
        v-for="game in gameList" 
        :key="game.id" 
        class="game-card"
      >
        <div class="card-image-wrapper">
          <div class="image-placeholder">
            <span class="placeholder-text">封面载入中...</span>
          </div>
          <div class="rating-badge" v-if="game.rating">⭐ {{ game.rating }}</div>
        </div>

        <div class="card-content">
          <h2 class="game-title">{{ game.title }}</h2>
          
          <p class="game-desc">{{ game.description }}</p>
          
          <div class="card-tags">
            <span class="tag-pill tag-mode">【双人】</span>
            <span class="tag-pill tag-platform">【SWITCH】</span>
            <span class="tag-pill tag-platform">【PC】</span>
          </div>
        </div>
      </article>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

// 1. 路由与基础状态
const route = useRoute()
const currentCategoryName = ref('')
const isLoading = ref(false)
const sortOrder = ref('newest') // 默认排序：最新发布
const gameList = ref([])

// 2. 模拟向后端请求数据的接口函数
const fetchGamesFromBackend = async (categoryKey, order) => {
  isLoading.value = true
  
  // 模拟网络延迟 600ms
  await new Promise(resolve => setTimeout(resolve, 600))
  
  // 模拟从数据库拿到的一组假数据
  const mockData = [
    {
      id: 1,
      title: '赛博朋克：边缘行者',
      description: '在这款开放世界动作冒险 RPG 中，你将扮演一名赛博朋克雇佣兵。探索夜之城，这座沉迷于力量、魅力和身体改造的超级大都会。游戏包含了极其丰富的支线任务和跌宕起伏的主线剧情。',
      rating: '9.5',
      releaseDate: '2023-10-01'
    },
    {
      id: 2,
      title: '双人成行 (It Takes Two)',
      description: '踏上生命中最疯狂的旅程。邀请好友通过远程同乐一起免费游玩，体验各种搞笑而混乱的合作游戏挑战。这是一场纯粹为合作而生的冒险。',
      rating: '9.8',
      releaseDate: '2021-03-26'
    },
    {
      id: 3,
      title: '空洞骑士 (Hollow Knight)',
      description: '在宏大的地下废墟中探险。躲避陷阱，击败游荡的虫子，解开古老的谜团。这是一款画面绝美的经典 2D 动作冒险游戏。',
      rating: '9.6',
      releaseDate: '2017-02-24'
    },
    {
      id: 4,
      title: '马力欧卡丁车 8 豪华版',
      description: '全系列收录赛道最多！角色最多！朋友聚会、家庭同乐的必备神作。支持本地多屏以及网络对战，享受随时随地的竞速乐趣。',
      rating: '9.2',
      releaseDate: '2017-04-28'
    }
  ]

  // 模拟后端的排序逻辑
  let sortedData = [...mockData]
  if (order === 'newest') {
    sortedData.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
  } else {
    sortedData.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))
  }

  gameList.value = sortedData
  isLoading.value = false
}

// 3. 排序按钮点击事件
const handleSort = (order) => {
  if (sortOrder.value === order) return
  sortOrder.value = order
  // 重新向后端发起带排序参数的请求
  fetchGamesFromBackend(route.params.categoryId, sortOrder.value)
}

// 4. 核心逻辑：监听路由参数变化并抓取数据
const initData = () => {
  // 假设路由传过来的参数叫 categoryId，或者通过 query 传的 name
  // 这里我们为了演示，直接取个名字
  const rawId = route.params.categoryId || 'unknown'
  
  // 简单做个参数到中文名字的映射转换（实际可能后端直接返回大类名字）
  const nameMap = {
    'single': '大型单人',
    'double': '双人同屏',
    'multi': '多人局域网',
    'classic': '经典游戏',
    'goty': '年度最佳'
  }
  currentCategoryName.value = nameMap[rawId] || '全部游戏'

  // 发起请求
  fetchGamesFromBackend(rawId, sortOrder.value)
}

// 组件挂载时初始化
onMounted(() => {
  initData()
})

// ⚠️ 极其关键：如果用户已经在单人游戏页，直接点击了导航栏的双人游戏，
// 此时组件不会重新挂载，只会改变路由参数。所以必须用 watch 监听路由变化重新拉取数据。
watch(() => route.params.categoryId, () => {
  initData()
})
</script>

<style scoped>
/* 整个页面背景设为极其淡的灰色，以突显白色卡片 */
.category-page-root {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 40px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #0f172a;
}

/* ==================== 顶部筛选区 ==================== */
.page-header-container {
  max-width: 1400px;
  margin: 0 auto 40px auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end; /* 底部对齐 */
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 20px;
}

.category-title {
  font-size: 36px;
  font-weight: 900;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}
.cyber-accent {
  color: #2563eb;
  margin-right: 8px;
}
.category-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 15px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
}
.filter-label {
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
}
.sort-buttons {
  display: flex;
  background-color: #e2e8f0;
  border-radius: 8px;
  padding: 4px;
}
.sort-btn {
  border: none;
  background: transparent;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sort-btn:hover {
  color: #0f172a;
}
.sort-btn.active {
  background-color: #ffffff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* ==================== 卡片网格布局 ==================== */
.game-grid-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  /* 响应式网格：最少280px宽，自动填充剩余空间 */
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 32px;
}

/* ==================== 独立卡片设计 ==================== */
.game-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden; /* 切除圆角外的图片 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid #f1f5f9;
}
/* 鼠标悬停卡片上浮 + 阴影加深 */
.game-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(37, 99, 211, 0.1);
  border-color: #dbeafe;
}

/* 图片占位区 */
.card-image-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9; /* 黄金游戏封面比例 */
  position: relative;
  overflow: hidden;
}
.image-placeholder {
  width: 100%;
  height: 100%;
  /* 高级的科技感紫蓝渐变占位背景 */
  background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-text {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 评分角标 */
.rating-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.85);
  color: #fbbf24;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
  backdrop-filter: blur(4px);
}

/* 文字内容区 */
.card-content {
  padding: 24px;
}
.game-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px 0;
  /* 标题如果太长，单行省略号 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 💡 核心要求：简介两行省略号 */
.game-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 20px 0;
  height: 44px; /* 行高1.6 * 14px * 2行 ≈ 44px 固定高度防抖动 */
  
  /* 多行文本截断神仙属性 */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 限制2行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部标签区 */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-pill {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 0;
  border-radius: 4px;
}
.tag-mode { color: #ec4899; }     /* 玩法标签：粉色 */
.tag-platform { color: #2563eb; } /* 平台标签：蓝色 */

/* 加载动画状态 */
.loading-state {
  text-align: center;
  padding: 80px 0;
  color: #94a3b8;
  font-weight: 600;
}
.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  margin: 0 auto 16px auto;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 📱 移动端适配 */
@media (max-width: 768px) {
  .category-page-root { padding: 20px; }
  .page-header-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  .category-title { font-size: 28px; }
  .game-grid-layout { grid-template-columns: 1fr; } /* 手机端单列铺满 */
}
</style>