<template>
  <div class="game-detail-container" v-if="game">
    
    <header class="detail-top-header">
      <button class="back-btn" @click="goBack">
        <span class="back-arrow">⬅️</span> 返回列表
      </button>

      <div class="center-title-box">
        <h1 class="main-title-zh">{{ game.title?.zh_CN || '未命名游戏' }}</h1>
        <p class="sub-title-en" v-if="game.title?.en_US">{{ game.title?.en_US }}</p>
      </div>

      <div class="header-placeholder"></div>
    </header>

    <main class="middle-main-layout">
      
      <section class="left-info-column">
        <div class="poster-card">
          <img v-if="game.media?.cover" :src="game.media.cover" :alt="game.title?.zh_CN" class="poster-img" />
          <div v-else class="poster-placeholder">暂无封面图</div>
          
          <div class="poster-badge-row">
            <span class="mini-badge rating" v-if="game.metadata?.rating">⭐ {{ game.metadata.rating }} 分</span>
            <span class="mini-badge" v-for="(p, i) in game.metadata?.platforms" :key="i">
              {{ String(p).toUpperCase() }}
            </span>
          </div>
        </div>

        <div class="desc-card">
          <h3 class="section-title">游戏简介</h3>
          <p class="desc-text">{{ game.description || '暂无详细文字介绍...' }}</p>
          
          <div class="genre-tags-list" v-if="game.metadata?.genres && game.metadata.genres.length > 0">
            <span v-for="(g, idx) in game.metadata.genres" :key="idx" class="genre-tag-pill">
              # {{ g }}
            </span>
          </div>
        </div>
      </section>

      <section class="right-banner-column">
        <div class="banner-card" @mouseenter="stopBannerTimer" @mouseleave="startBannerTimer">
          <h3 class="section-title">精彩实机画赏</h3>
          
          <div class="main-banner-viewer" v-if="game.media?.screenshots && game.media.screenshots.length > 0">
            <img :src="game.media.screenshots[activeImageIndex]" alt="游戏截图" class="active-banner-img fade-transition" :key="activeImageIndex" />
            <div class="image-counter">{{ activeImageIndex + 1 }} / {{ game.media.screenshots.length }}</div>
          </div>
          <div class="banner-placeholder" v-else>
            🖼️ 暂无游戏截图
          </div>

          <div class="thumbnails-track" v-if="game.media?.screenshots && game.media.screenshots.length > 1">
            <div 
              v-for="(img, idx) in game.media.screenshots" 
              :key="idx"
              class="thumb-item"
              :class="{ active: activeImageIndex === idx }"
              @click="handleManualChange(idx)"
            >
              <img :src="img" alt="缩略图" />
            </div>
          </div>
        </div>
      </section>

    </main>

    <footer class="bottom-action-layout">
      
      <div class="interaction-bar-card">
        <div class="stats-left">
          <span class="stat-item">🔥 下载量：<strong>{{ game.download_count || 0 }}</strong> 次</span>
          <span class="stat-item">📅 上架时间：<strong>{{ formatDate(game.system?.created_at) }}</strong></span>
        </div>

        <button class="like-action-btn" :class="{ liked: isLiked }" @click="toggleLike">
          <span class="like-icon">👍</span> 
          <span>{{ isLiked ? '已赞爆该游戏' : '给游戏赞爆' }}</span>
          <span class="like-count">({{ (game.likes || 0) + (isLiked ? 1 : 0) }})</span>
        </button>
      </div>

      <div class="resources-grid-row">
        
        <div class="resource-card download-box">
          <h3 class="card-head-title">⚡ 资源网盘下载</h3>
          
          <div class="download-list" v-if="game.downloads && game.downloads.length > 0">
            <div v-for="(dl, idx) in game.downloads" :key="idx" class="dl-group-item">
              <div class="dl-plat-tag">{{ dl.platform || '通用版本' }} {{ dl.version ? `(${dl.version})` : '' }}</div>
              
              <div class="dl-sources" v-if="dl.sources && dl.sources.length > 0">
                <div v-for="(src, sIdx) in dl.sources" :key="sIdx" class="source-row">
                  <span class="source-name">{{ src.name || '网盘直链' }}</span>
                  <div class="source-right">
                    <button class="copy-code-btn" v-if="src.code || src.password" @click="copyCode(src.code || src.password)">
                      提取码: {{ src.code || src.password }} 📋
                    </button>
                    <a :href="src.url" target="_blank" class="download-link-btn">立即前往下载</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-hint" v-else>
            🔒 暂无可用下载资源
          </div>
        </div>

        <div class="resource-card forum-box">
          <h3 class="card-head-title">💬 玩家交流社区</h3>
          <div class="forum-content">
            <p class="forum-desc">遇到解压问题、通关卡关或游戏补丁报错？可以在这里与大家交流：</p>
            <div class="forum-action-area">
              <button class="forum-btn" @click="alert('论坛社区功能开发中，敬请期待！')">
                💬 进入《{{ game.title?.zh_CN || '本游戏' }}》讨论区
              </button>
            </div>
          </div>
        </div>

      </div>

    </footer>

  </div>

  <div class="status-box" v-else-if="isLoading">
    <div class="spinner"></div>
    <p>正在读取游戏数据...</p>
  </div>
  <div class="status-box" v-else>
    <h2>📭 未找到相关游戏档案</h2>
    <button class="back-home-btn" @click="$router.push('/')">返回首页</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore' 

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const game = ref(null)
const isLoading = ref(true)
const isLiked = ref(false)
const activeImageIndex = ref(0)

// 🌟 自动轮播相关逻辑
let bannerTimer = null


// 1. 停止定时器的方法保持不变
const stopBannerTimer = () => {
  if (bannerTimer) {
    clearInterval(bannerTimer)
    bannerTimer = null
  }
}

// 2. 🚨 核心修复：启动定时器
const startBannerTimer = () => {
  // 👉 关键点：每次启动前，必定先手起刀落把旧的干掉！绝不让两个定时器同时存在。
  stopBannerTimer() 

  // 如果没有图片或者只有1张图片，不开启轮播
  if (!game.value?.media?.screenshots || game.value.media.screenshots.length <= 1) return
  
  // 重新开启干干净净的 5 秒倒计时
  bannerTimer = setInterval(() => {
    activeImageIndex.value = (activeImageIndex.value + 1) % game.value.media.screenshots.length
  }, 5000)
}



// 玩家手动点击缩略图时，切换图片并“重置” 5秒倒计时
const handleManualChange = (idx) => {
  activeImageIndex.value = idx
  // 手动点击后直接重启，因为 startBannerTimer 内部现在已经自带了 stop 功能
  startBannerTimer()
}

onMounted(async () => {
  const targetId = String(route.params.id)
  
  let localGame = (gameStore.allGames || []).find(g => String(g.id) === targetId)

  if (localGame) {
    game.value = localGame
    isLoading.value = false
    startBannerTimer() // 👈 获取数据成功后开启轮播
    return
  }

  try {
    isLoading.value = true
    const fetchedGame = await gameStore.fetchGameById(targetId)
    if (fetchedGame) {
      game.value = fetchedGame
      startBannerTimer() // 👈 获取数据成功后开启轮播
    }
  } catch (error) {
    console.error('拉取详情数据失败:', error)
  } finally {
    isLoading.value = false
  }
})

// 组件销毁前（比如退回到首页时），务必清空定时器，防止内存泄漏
onUnmounted(() => {
  stopBannerTimer()
})

const goBack = () => {
  router.back()
}

const copyCode = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    alert(`提取码 [ ${code} ] 已成功复制！`)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
}

const formatDate = (str) => {
  if (!str) return '未知时间'
  return new Date(str).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
@import '@/assets/styles/theme.css';

.game-detail-container { max-width: 1400px; margin: 0 auto; padding: 30px 20px 80px 20px; color: var(--text-main); }
.detail-top-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--border-main); padding-bottom: 20px; margin-bottom: 30px; }
.back-btn { background: var(--bg-card); border: 1px solid var(--border-main); color: var(--text-muted); padding: 8px 18px; border-radius: 20px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
.back-btn:hover { color: var(--color-primary); border-color: var(--color-primary); transform: translateX(-3px); }
.center-title-box { text-align: center; }
.main-title-zh { font-size: 32px; font-weight: 900; margin: 0; color: var(--text-heading); letter-spacing: -0.5px; }
.sub-title-en { margin: 4px 0 0 0; font-size: 14px; color: var(--text-light); font-weight: 600; }
.header-placeholder { width: 100px; }

.middle-main-layout { display: grid; grid-template-columns: 380px 1fr; gap: 30px; margin-bottom: 30px; }
.left-info-column { display: flex; flex-direction: column; gap: 20px; }

.poster-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
.poster-img { width: 100%; aspect-ratio: 0 / 4; object-fit: cover; border-radius: 12px; display: block; }
.poster-placeholder { width: 100%; aspect-ratio: 3 / 4; background: var(--bg-hover); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
.poster-badge-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.mini-badge { background-color: rgba(37, 99, 235, 0.1); background-color: rgba(37, 99, 235, 0.1); font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-main); }
.mini-badge.rating { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }

.desc-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 20px; flex: 1; }
.section-title { font-size: 18px; font-weight: 800; color: var(--text-heading); margin: 0 0 14px 0; border-bottom: 1px solid var(--border-main); padding-bottom: 8px; }
.desc-text { font-size: 14px; line-height: 1.7; color: var(--text-muted); white-space: pre-line; margin: 0 0 16px 0; }
.genre-tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
.genre-tag-pill { font-size: 12px; color: var(--color-primary); font-weight: 700; background: rgba(37, 99, 235, 0.08); padding: 4px 10px; border-radius: 100px; }

/* 右侧栏：大图轮播 */
.right-banner-column { height: 100%; }
.banner-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 20px; height: 100%; display: flex; flex-direction: column; }
.main-banner-viewer { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #000; border: 1px solid var(--border-main); }

/* 🌟 图片切换淡入淡出动画 */
.fade-transition {
  animation: fadeIn 0.4s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0.6; transform: scale(1.02); }
  to { opacity: 1; transform: scale(1); }
}

.active-banner-img { width: 100%; height: 100%; object-fit: contain; }
.image-counter { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; backdrop-filter: blur(4px); }
.banner-placeholder { width: 100%; aspect-ratio: 16 / 9; background: var(--bg-hover); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }

/* 缩略图滚动轨 */
.thumbnails-track { display: flex; gap: 12px; margin-top: 16px; overflow-x: auto; padding-bottom: 6px; }
/* 隐藏滚动条让它更美观 */
.thumbnails-track::-webkit-scrollbar { height: 6px; }
.thumbnails-track::-webkit-scrollbar-thumb { background: var(--border-dark); border-radius: 4px; }
.thumb-item { width: 100px; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; opacity: 0.6; transition: all 0.2s ease; flex-shrink: 0; }
.thumb-item img { width: 100%; height: 100%; object-fit: cover; }
.thumb-item:hover { opacity: 0.9; }
.thumb-item.active { border-color: var(--color-primary); opacity: 1; transform: scale(1.05); }

/* 底部操作区 */
.bottom-action-layout { display: flex; flex-direction: column; gap: 20px; }
.interaction-bar-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
.stats-left { display: flex; gap: 24px; font-size: 14px; color: var(--text-muted); }
.stat-item strong { color: var(--text-heading); }
.like-action-btn { background: var(--bg-hover); border: 2px solid var(--border-main); color: var(--text-heading); padding: 10px 24px; border-radius: 100px; font-size: 15px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.like-action-btn:hover { border-color: #ec4899; color: #ec4899; transform: scale(1.05); }
.like-action-btn.liked { background: #ec4899; color: #fff; border-color: #ec4899; box-shadow: 0 6px 20px rgba(236, 72, 153, 0.3); }

.resources-grid-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
.resource-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 24px; }
.card-head-title { font-size: 18px; font-weight: 800; color: var(--text-heading); margin: 0 0 16px 0; border-bottom: 2px solid var(--border-main); padding-bottom: 10px; }

.dl-group-item { background: var(--bg-hover); border-radius: 12px; padding: 14px; margin-bottom: 12px; border: 1px solid var(--border-main); }
.dl-plat-tag { font-size: 13px; font-weight: 800; color: var(--color-primary); margin-bottom: 8px; }
.source-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
.source-name { font-size: 14px; font-weight: 700; color: var(--text-main); }
.source-right { display: flex; gap: 10px; align-items: center; }
.copy-code-btn { background: rgba(236, 72, 153, 0.1); color: var(--color-pink); border: 1px solid rgba(236, 72, 153, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; cursor: pointer; }
.download-link-btn { background: var(--color-primary, #2563eb); color: #fff; text-decoration: none; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; transition: 0.2s; }
.download-link-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }

.forum-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px; }
.forum-btn { width: 100%; background: var(--bg-hover); border: 2px dashed var(--border-dark); color: var(--text-heading); padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; }
.forum-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--bg-card); }

.status-box { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); }
.back-home-btn { background: var(--color-primary); color: #fff; border: none; padding: 10px 24px; border-radius: 100px; font-weight: 800; cursor: pointer; margin-top: 16px; }
.spinner { width: 2.5rem; height: 2.5rem; border: 3px solid var(--border-main); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem;}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .middle-main-layout { grid-template-columns: 1fr; } 
  .resources-grid-row { grid-template-columns: 1fr; }
  .detail-top-header { flex-direction: column; gap: 10px; text-align: center; }
  .header-placeholder { display: none; }
  .interaction-bar-card { flex-direction: column; gap: 16px; align-items: stretch; text-align: center; }
  .stats-left { justify-content: center; }
  .like-action-btn { justify-content: center; }
}
</style>