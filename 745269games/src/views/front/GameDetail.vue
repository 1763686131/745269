<template>
  <div class="game-detail-container" v-if="game">
    
    <header class="detail-top-header">
      <div class="header-left-actions">
        <button class="nav-action-btn back-list-btn" @click="goBack" title="返回上页列表">
          <span class="btn-icon">⬅️</span>
          <span>返回列表</span>
        </button>
        <button class="nav-action-btn go-home-btn" @click="$router.push('/')" title="返回网站首页">
          <span class="btn-icon">🏠</span>
          <span>返回首页</span>
        </button>
      </div>

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
            <span class="mini-badge" v-for="(p, i) in game.metadata?.platforms" :key="i">{{ String(p).toUpperCase() }}</span>
          </div>
        </div>
        
        <div class="desc-card">
          <h3 class="section-title">📖 游戏简介</h3>
          <p class="desc-text" :title="game.description">{{ game.description || '暂无详细文字介绍...' }}</p>

          <div class="genre-tags-list" v-if="(game.aliases && game.aliases.length > 0) || (game.metadata?.genres && game.metadata.genres.length > 0)">
            <span v-for="(lang, idx) in game.aliases" :key="'lang-'+idx" class="lang-tag-pill">
              🌐 {{ lang.replace(/,|，/g, ' ') }}
            </span>
            <span v-for="(g, idx) in game.metadata?.genres" :key="'g-'+idx" class="genre-tag-pill">
              # {{ g }}
            </span>
          </div>
        </div>
      </section>

      <section class="right-banner-column">
        <div class="banner-card">
          <h3 class="section-title">
            📸 精彩画赏与预告片 
            <span class="playing-tag" v-if="currentMedia?.type === 'video'">🎬 视频预览 (已自动锁定轮播)</span>
          </h3>
          
          <div class="main-banner-viewer" v-if="mediaList.length > 0">
            <iframe 
              v-if="currentMedia?.type === 'video'" 
              :src="currentMedia.src" 
              class="bilibili-iframe"
              scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"
            ></iframe>
            <img v-else-if="currentMedia?.type === 'image'" :src="currentMedia.src" class="active-banner-img fade-transition" :key="activeMediaIndex" />
            <div class="image-counter">{{ activeMediaIndex + 1 }} / {{ mediaList.length }}</div>
          </div>
          <div class="banner-placeholder" v-else>🖼️ 暂无游戏视频或截图</div>

          <div class="thumbnails-track" v-if="mediaList.length > 1">
            <div 
              v-for="(item, idx) in mediaList" :key="idx"
              class="thumb-item" :class="{ active: activeMediaIndex === idx, 'is-video-thumb': item.type === 'video' }"
              @click="handleManualChange(idx)"
            >
              <div v-if="item.type === 'video'" class="video-thumb-overlay">
                <span class="play-icon">▶️</span><span class="video-label">预告片</span>
              </div>
              <img v-else :src="item.src" alt="缩略图" />
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="bottom-action-layout">
      <div class="interaction-bar-card">
        <div class="stats-left">
          <span class="stat-item">🔥 下载量：<strong class="highlight-num">{{ game.download_count || 0 }}</strong> 次</span>
          <span class="stat-item date-stat">📅 上架时间：<strong class="date-badge">{{ formatDate(game.system?.created_at || game.created_at) }}</strong></span>
        </div>
        <button class="like-action-btn" :class="{ liked: isLiked }" @click="handleInteraction('like')">
          <span class="like-icon">👍</span> 
          <span>{{ isLiked ? '已赞爆该游戏' : '给游戏赞爆' }}</span>
          <span class="like-count">({{ game.likesCount || 0 }})</span>
        </button>
      </div>

      <div class="resources-grid-row" :class="hasSystemConfig ? 'grid-3-cols' : 'grid-2-cols'">
        
        <!-- 1. 网盘下载区 -->
        <div class="resource-card download-box">
          <div class="card-head-row">
            <h3 class="card-head-title mb-0">⚡ 资源网盘下载</h3>
            <div class="cloud-warning">⚠️ 网盘链接有可能会失效，请及时转存在自己网盘。</div>
          </div>

          <div class="download-list" v-if="game.downloads && game.downloads.length > 0">
            <div v-for="(dl, idx) in game.downloads" :key="idx" class="dl-group-item">
              <div class="dl-plat-header">
                <div class="dl-plat-tag">{{ dl.platform || '通用版本' }}</div>
                <div class="dl-meta-info" v-if="dl.edition || dl.file_size_display">
                  <span class="dl-meta-badge" v-if="dl.edition">🏷️ {{ dl.edition }}</span>
                  <span class="dl-meta-badge" v-if="dl.file_size_display">💾 {{ dl.file_size_display }}</span>
                </div>
              </div>
              <div class="dl-sources" v-if="dl.sources && dl.sources.length > 0">
                <div v-for="(src, sIdx) in dl.sources" :key="sIdx" class="source-row">
                  <span class="source-name">{{ src.name || '网盘直链' }}</span>
                  
                  <div class="source-right">
                    
                    <!-- 🌟 核心修改：在点击扫码时，同时执行呼出弹窗和记录下载量的指令 -->
                    <button 
                      class="action-btn qr-btn" 
                      v-if="src.qr_code" 
                      @click="activeQrCode = src.qr_code; handleInteraction('download')"
                    >
                      📱 二维码资源
                    </button>
                    
                    <button class="action-btn copy-link" v-if="src.url" @click="handleCopy(src.url, '网盘链接')">🔗 复制链接</button>
                    <button class="action-btn copy-code" v-if="src.code || src.password" @click="handleCopy(src.code || src.password, '提取码')">📋 提取码: {{ src.code || src.password }}</button>
                    <a :href="src.url" target="_blank" class="download-link-btn" @click="handleInteraction('download')">直接前往</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="empty-hint" v-else>🔒 暂无可用下载资源</div>
        </div>

        <!-- 2. 最低配置区 -->
        <div class="resource-card sys-req-box" v-if="hasSystemConfig">
          <h3 class="card-head-title">💻 最低运行配置</h3>
          <div class="sys-req-content">
            <template v-for="(dl, idx) in game.downloads" :key="'req-'+idx">
              <div class="req-group" v-if="dl.minimum_config">
                <div class="req-plat-tag">
                  {{ dl.platform || '通用' }} <span class="req-edition" v-if="dl.edition">[{{ dl.edition }}]</span>
                </div>
                <div class="req-text">{{ dl.minimum_config }}</div>
              </div>
            </template>
          </div>
        </div>

        <!-- 3. 玩家交流社区 -->
        <div class="resource-card forum-box">
          <h3 class="card-head-title">💬 玩家交流社区</h3>
          <div class="forum-content">
            <p class="forum-desc">遇到解压问题、通关卡关或游戏补丁报错？可以在这里与大家交流：</p>
            <div class="forum-action-area">
              <button class="forum-btn" @click="alert('论坛社区功能开发中，敬请期待！')">💬 进入《{{ game.title?.zh_CN || '本游戏' }}》讨论区</button>
              <button class="feedback-btn" @click="showFeedbackModal = true">⚠️ 链接失效 / 游戏报错反馈</button>
            </div>
          </div>
        </div>

      </div>
    </footer>

    <!-- 🌟 专属的居中二维码预览弹窗 -->
    <transition name="modal-fade">
      <div v-if="activeQrCode" class="qr-modal-overlay" @click.self="activeQrCode = null">
        <div class="qr-modal-content">
          <button class="qr-close-btn" @click="activeQrCode = null" title="关闭">✕</button>
          
          <img :src="activeQrCode" alt="资源二维码" class="qr-modal-img" />
          <p class="qr-modal-tip">📱 请使用手机扫码转存</p>
        </div>
      </div>
    </transition>

    <FeedbackModal 
      v-if="showFeedbackModal" 
      :gameId="game.id" 
      :gameName="game.title?.zh_CN || game.title?.en_US" 
      @close="showFeedbackModal = false" 
    />

  </div>

  <div class="status-box" v-else-if="isLoading"><div class="spinner"></div><p>正在读取游戏数据...</p></div>
  <div class="status-box" v-else><h2>📭 未找到相关游戏档案</h2><button class="back-home-btn" @click="$router.push('/')">返回首页</button></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore'
import FeedbackModal from '@/components/common/FeedbackModal.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const game = ref(null)
const isLoading = ref(true)
const isLiked = ref(false)

const activeMediaIndex = ref(0)
let bannerTimer = null
const showFeedbackModal = ref(false)

const activeQrCode = ref(null)

const interactState = { download: { timer: null, pending: false }, like: { timer: null, pending: false } }
const handleInteraction = (type) => {
  if (!game.value) return
  if (type === 'download' && !interactState.download.pending) {
    game.value.download_count = (game.value.download_count || 0) + 1
    interactState.download.pending = true
  } else if (type === 'like' && !interactState.like.pending) {
    game.value.likesCount = (game.value.likesCount || 0) + 1
    isLiked.value = true
    interactState.like.pending = true
  }
  if (interactState[type].timer) clearTimeout(interactState[type].timer)
  interactState[type].timer = setTimeout(() => {
    gameStore.recordInteraction(game.value.id, type)
    interactState[type].pending = false
    interactState[type].timer = null
  }, 10000)
}

const handleCopy = async (text, typeName) => {
  handleInteraction('download')

  // 优先使用现代 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${typeName} [ ${text} ] 已成功复制！`)
      return
    } catch (err) {
      console.warn('Clipboard API 失败，尝试降级方案:', err)
    }
  }

  // 降级方案：使用传统的 document.execCommand
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)

    // 选中文本
    textArea.focus()
    textArea.select()

    // 尝试复制
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      alert(`${typeName} [ ${text} ] 已成功复制！`)
    } else {
      alert(`复制失败，请手动复制：${text}`)
    }
  } catch (err) {
    console.error('复制失败:', err)
    alert(`复制失败，请手动复制：${text}`)
  }
}

const mediaList = computed(() => {
  const list = []
  if (!game.value) return list
  const rawVideo = game.value.media?.video || game.value.video_url || ''
  if (rawVideo) {
    let videoUrl = rawVideo
    const match = videoUrl.match(/src=["']([^"']+)["']/)
    if (match && match[1]) videoUrl = match[1]
    if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl
    if (videoUrl.includes('bilibili.com')) {
      videoUrl = videoUrl.replace(/[?&]autoplay=[^&]*/g, '')
      videoUrl += (videoUrl.includes('?') ? '&' : '?') + 'danmaku=0&high_quality=1&as_wide=1'
    }
    list.push({ type: 'video', src: videoUrl })
  }
  const screenshots = game.value.media?.screenshots || []
  if (Array.isArray(screenshots)) screenshots.forEach(img => { if (img) list.push({ type: 'image', src: img }) })
  return list
})
const currentMedia = computed(() => mediaList.value[activeMediaIndex.value] || null)

const hasSystemConfig = computed(() => {
  if (!game.value || !game.value.downloads) return false
  return game.value.downloads.some(d => d.minimum_config && String(d.minimum_config).trim() !== '')
})

const stopBannerTimer = () => { if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null } }
const startBannerTimer = () => {
  stopBannerTimer()
  if (currentMedia.value?.type === 'video' || mediaList.value.length <= 1) return
  bannerTimer = setInterval(() => {
    if (currentMedia.value?.type === 'video') return stopBannerTimer()
    const nextIndex = (activeMediaIndex.value + 1) % mediaList.value.length
    activeMediaIndex.value = nextIndex
    if (mediaList.value[nextIndex]?.type === 'video') stopBannerTimer()
  }, 5000)
}
const handleManualChange = (idx) => {
  activeMediaIndex.value = idx
  stopBannerTimer()
  if (mediaList.value[idx]?.type !== 'video') startBannerTimer()
}

onMounted(async () => {
  const targetId = String(route.params.id)
  let localGame = (gameStore.allGames || []).find(g => String(g.id) === targetId)
  if (localGame) {
    game.value = localGame
    isLoading.value = false
    preloadQrCodes() // 预加载二维码
    if (currentMedia.value?.type !== 'video') startBannerTimer()
    return
  }
  try {
    isLoading.value = true
    const fetchedGame = await gameStore.fetchGameById(targetId)
    if (fetchedGame) {
      game.value = fetchedGame
      preloadQrCodes() // 预加载二维码
      if (currentMedia.value?.type !== 'video') startBannerTimer()
    }
  } catch (error) {} finally { isLoading.value = false }
})

onUnmounted(() => {
  stopBannerTimer()
  if (interactState.download.timer) gameStore.recordInteraction(game.value.id, 'download')
  if (interactState.like.timer) gameStore.recordInteraction(game.value.id, 'like')
})

const goBack = () => { router.back() }

// 🌟 预加载所有二维码图片
const preloadQrCodes = () => {
  if (!game.value?.downloads) return

  const qrUrls = []
  game.value.downloads.forEach(dl => {
    if (dl.sources && Array.isArray(dl.sources)) {
      dl.sources.forEach(src => {
        if (src.qr_code) qrUrls.push(src.qr_code)
      })
    }
  })

  // 创建 Image 对象预加载
  qrUrls.forEach(url => {
    const img = new Image()
    img.src = url
  })
}

const formatDate = (str) => {
  if (!str) return '未知时间'
  let cleanStr = str;
  if (!str.includes('Z') && !str.includes('T')) cleanStr = str.replace(' ', 'T') + 'Z';
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return '未知时间'
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style scoped>
@import '@/assets/styles/theme.css';

.game-detail-container { max-width: 1400px; margin: 0 auto; padding: 30px 20px 80px 20px; color: var(--text-main); }
.detail-top-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--border-main); padding-bottom: 20px; margin-bottom: 30px; }
.header-left-actions { display: flex; align-items: center; gap: 12px; }
.nav-action-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 100px; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); border: 1px solid var(--border-main); outline: none; }
.btn-icon { font-size: 16px; transition: transform 0.2s ease; }
.back-list-btn { background: var(--bg-card); color: var(--text-heading); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }
.back-list-btn:hover { border-color: var(--border-dark); color: var(--color-primary); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08); }
.back-list-btn:hover .btn-icon { transform: translateX(-3px); }
.go-home-btn { background: var(--color-primary, #2563eb); color: #ffffff; border-color: var(--color-primary, #2563eb); box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25); }
.go-home-btn:hover { filter: brightness(1.1); transform: translateY(-2px) scale(1.03); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35); }
.go-home-btn:hover .btn-icon { transform: scale(1.15) rotate(-10deg); }
.center-title-box { text-align: center; }
.main-title-zh { font-size: 32px; font-weight: 900; margin: 0; color: var(--text-heading); letter-spacing: -0.5px; }
.sub-title-en { margin: 4px 0 0 0; font-size: 14px; color: var(--text-light); font-weight: 600; }
.header-placeholder { width: 230px; }

.middle-main-layout { display: grid; grid-template-columns: 380px 1fr; gap: 30px; margin-bottom: 30px; }
.left-info-column { display: flex; flex-direction: column; gap: 20px; min-width: 0;}
.poster-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
.poster-img { width: 100%; aspect-ratio: 8 / 6; object-fit: cover; border-radius: 12px; display: block; }
.poster-placeholder { width: 100%; aspect-ratio: 3 / 4; background: var(--bg-hover); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
.poster-badge-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.mini-badge { background: var(--bg-hover); color: var(--text-muted); font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-main); }
.mini-badge.rating { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }

.desc-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 20px; flex: 1; }
.section-title { font-size: 18px; font-weight: 800; color: var(--text-heading); margin: 0 0 14px 0; border-bottom: 1px solid var(--border-main); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.playing-tag { font-size: 12px; color: #ec4899; background: rgba(236, 72, 153, 0.1); padding: 2px 10px; border-radius: 100px; }

.desc-text { font-size: 14px; line-height: 1.7; color: var(--text-muted); white-space: pre-line; margin: 0 0 16px 0; word-break: break-word; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; transition: all 0.3s ease; }
@media (min-width: 769px) { .desc-text { cursor: help; } }
@media (max-width: 768px) { .desc-text { display: block; -webkit-line-clamp: unset; overflow: visible; } }

.genre-tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
.genre-tag-pill { font-size: 12px; color: var(--color-primary); font-weight: 700; background: rgba(37, 99, 235, 0.08); padding: 4px 10px; border-radius: 100px; border: 1px solid rgba(37, 99, 235, 0.15); }
.lang-tag-pill { font-size: 12px; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.08); padding: 4px 10px; border-radius: 100px; border: 1px solid rgba(16, 185, 129, 0.2); }

.right-banner-column { height: 100%; min-width: 0;}
.banner-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 20px; height: 100%; display: flex; flex-direction: column; }
.main-banner-viewer { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #000; border: 1px solid var(--border-main); }
.bilibili-iframe { width: 100%; height: 100%; border: none; display: block; }
.fade-transition { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0.6; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
.active-banner-img { width: 100%; height: 100%; object-fit: contain; }
.image-counter { position: absolute; bottom: 240px; right: 12px; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; backdrop-filter: blur(4px); pointer-events: none; }
.banner-placeholder { width: 100%; aspect-ratio: 16 / 9; background: var(--bg-hover); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }

.thumbnails-track { display: flex; gap: 10px; margin-top: 20px; overflow-x: auto; padding-bottom: 6px; }
.thumbnails-track::-webkit-scrollbar { height: 6px; }
.thumbnails-track::-webkit-scrollbar-thumb { background: var(--border-dark); border-radius: 4px; }
.thumb-item { width: 100px; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; cursor: pointer; border: 3px solid transparent; opacity: 0.6; transition: all 0.2s ease; flex-shrink: 0; position: relative; }
.thumb-item img { width: 100%; height: 100%; object-fit: cover; }
.thumb-item:hover { opacity: 0.9; }
.thumb-item.active { border-color: var(--color-primary); opacity: 1; transform: scale(1.05); }
.thumb-item.is-video-thumb { background: #0f172a; border-color: rgba(236, 72, 153, 0.4); opacity: 0.85; }
.thumb-item.is-video-thumb.active { border-color: #ec4899; opacity: 1; }
.video-thumb-overlay { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; background: linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(37,99,235,0.3) 100%); }
.play-icon { font-size: 18px; margin-bottom: 2px; }
.video-label { font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }

.bottom-action-layout { display: flex; flex-direction: column; gap: 20px; }
.interaction-bar-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
.stats-left { display: flex; gap: 24px; font-size: 14px; color: var(--text-muted); align-items: center; }

.highlight-num { color: #f59e0b; font-size: 16px; font-family: monospace;}
.date-stat { display: flex; align-items: center; gap: 6px; }
.date-badge { background: rgba(37, 99, 235, 0.08); color: var(--color-primary); padding: 4px 10px; border-radius: 8px; font-weight: 800; border: 1px solid rgba(37, 99, 235, 0.2); }

.like-action-btn { background: var(--bg-hover); border: 2px solid var(--border-main); color: var(--text-heading); padding: 10px 24px; border-radius: 100px; font-size: 15px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.like-action-btn:hover { border-color: #ec4899; color: #ec4899; transform: scale(1.05); }
.like-action-btn.liked { background: #ec4899; color: #fff; border-color: #ec4899; box-shadow: 0 6px 20px rgba(236, 72, 153, 0.3); }

/* 🌟 资源容器基础样式 */
.resources-grid-row { display: grid; gap: 20px; }
.grid-3-cols { grid-template-columns: 2.4fr 1.2fr 1fr; }
.grid-2-cols { grid-template-columns: 2fr 1fr; }

.resource-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 24px; display: flex; flex-direction: column;}

.card-head-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-main); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.card-head-row .card-head-title { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
.cloud-warning { background: rgba(245, 158, 11, 0.1); color: #d97706; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; border: 1px solid rgba(245, 158, 11, 0.2); display: flex; align-items: center; }

.card-head-title { font-size: 18px; font-weight: 800; color: var(--text-heading); margin: 0 0 16px 0; border-bottom: 2px solid var(--border-main); padding-bottom: 10px; }
.dl-group-item { background: var(--bg-hover); border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid var(--border-main); }
.dl-plat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px dashed var(--border-main); padding-bottom: 10px; }
.dl-plat-tag { font-size: 15px; font-weight: 900; color: var(--color-primary); }
.dl-meta-info { display: flex; gap: 8px; flex-wrap: wrap; }
.dl-meta-badge { font-size: 12px; background: var(--bg-card); color: var(--text-muted); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-light); font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

/* 🌟 网盘下载行结构恢复为纯按钮在一行 */
.source-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-radius: 8px; transition: 0.2s; }
.source-name { font-size: 14px; font-weight: 800; color: var(--text-main); }
.source-right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }

.action-btn { background: var(--bg-card); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; border: 1px solid var(--border-main); color: var(--text-muted); display: inline-flex; align-items: center; }
.action-btn:hover { transform: translateY(-1px); }

/* 📱 扫码按钮专属样式 */
.qr-btn { color: #a855f7; border-color: rgba(168, 85, 247, 0.2); background: rgba(168, 85, 247, 0.05); }
.qr-btn:hover { background: #a855f7; color: #fff; }

.copy-link { color: #10b981; border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.05); }
.copy-link:hover { background: #10b981; color: #fff; }
.copy-code { color: var(--color-pink); border-color: rgba(236, 72, 153, 0.2); background: rgba(236, 72, 153, 0.05); }
.copy-code:hover { background: var(--color-pink); color: #fff; }
.download-link-btn { background: var(--color-primary, #2563eb); color: #fff; text-decoration: none; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; transition: 0.2s; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }
.download-link-btn:hover { filter: brightness(1.15); transform: translateY(-1px); box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3); }

/* 🌟 二维码专属居中点击弹窗 */
.qr-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center;
  z-index: 99999;
}
.qr-modal-content {
  background: #ffffff; padding: 24px; border-radius: 20px;
  display: flex; flex-direction: column; align-items: center;
  position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.25);
}
.qr-close-btn {
  position: absolute; top: -14px; right: -14px;
  width: 32px; height: 32px; border-radius: 50%;
  background: #ef4444; color: #fff; border: 2px solid #fff;
  font-size: 16px; font-weight: bold; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  padding: 0; outline: none;
}
.qr-close-btn:hover { transform: scale(1.1) rotate(90deg); }
.qr-modal-img { 
  width: 220px; height: 220px; object-fit: contain; 
  margin-bottom: 16px; border-radius: 8px; 
  border: 1px solid #e2e8f0; padding: 8px;
}
.qr-modal-tip { font-size: 15px; font-weight: 900; color: #334155; margin: 0; letter-spacing: 0.5px;}

/* 弹窗滑入滑出动画 */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.95); }


/* 最低配置展示真实数据样式 */
.sys-req-content { display: flex; flex-direction: column; gap: 16px; flex: 1; }
.req-group { background: var(--bg-hover); border-radius: 12px; padding: 16px; border: 1px solid var(--border-light); }
.req-plat-tag { font-size: 14px; font-weight: 900; color: var(--color-primary); margin-bottom: 10px; border-bottom: 1px dashed var(--border-main); padding-bottom: 8px; }
.req-edition { color: var(--text-muted); font-size: 12px; font-weight: 700; margin-left: 6px;}
.req-text { font-size: 13px; color: var(--text-main); line-height: 1.7; white-space: pre-line; word-break: break-word; }

.forum-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px; }
.forum-btn { width: 100%; background: var(--bg-hover); border: 2px dashed var(--border-dark); color: var(--text-heading); padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; }
.forum-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--bg-card); }
.feedback-btn { width: 100%; background: transparent; border: 2px dashed #f43f5e; color: #f43f5e; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; margin-top: 12px; }
.feedback-btn:hover { background: rgba(244, 63, 94, 0.05); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(244, 63, 94, 0.15); }

.status-box { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); }
.back-home-btn { background: var(--color-primary); color: #fff; border: none; padding: 10px 24px; border-radius: 100px; font-weight: 800; cursor: pointer; margin-top: 16px; }
.spinner { width: 2.5rem; height: 2.5rem; border: 3px solid var(--border-main); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem;}
@keyframes spin { to { transform: rotate(360deg); } }

/* 💻 中等屏幕响应式处理 */
@media (max-width: 1200px) {
  .grid-3-cols { grid-template-columns: 1fr 1fr; }
  .grid-3-cols .download-box { grid-column: span 2; }
  .grid-2-cols { grid-template-columns: 1fr; }
}

/* 📱 手机屏幕：全部垂直单列显示 */
@media (max-width: 768px) {
  .game-detail-container { padding: 16px 12px 60px 12px; }
  .detail-top-header { flex-direction: column; gap: 16px; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; }
  .header-left-actions { width: 100%; justify-content: space-between; }
  .nav-action-btn { flex: 1; justify-content: center; font-size: 13px; padding: 8px 12px; }
  .center-title-box { text-align: left; width: 100%; }
  .main-title-zh { font-size: 22px; }
  .sub-title-en { font-size: 12px; }
  .header-placeholder { display: none; }
  .middle-main-layout { grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px; }
  .poster-card { padding: 12px; }
  .poster-img { max-height: 320px; object-fit: cover; } 
  .desc-card, .banner-card, .resource-card { padding: 16px; border-radius: 12px; }
  .section-title, .card-head-title { font-size: 16px; margin-bottom: 12px; }
  .thumb-item { width: 80px; }
  .bottom-action-layout { gap: 16px; }
  .interaction-bar-card { flex-direction: column; gap: 12px; align-items: flex-start; padding: 16px; }
  .stats-left { flex-direction: column; gap: 6px; font-size: 13px; width: 100%; align-items: flex-start; }
  .like-action-btn { width: 100%; justify-content: center; font-size: 14px; padding: 12px; }
  
  .resources-grid-row { grid-template-columns: 1fr !important; gap: 16px; }
  .download-box { grid-column: span 1 !important; }
  
  .card-head-row { flex-direction: column; align-items: flex-start; }
  .dl-group-item { padding: 12px; }
  .dl-plat-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .source-row { flex-direction: column; align-items: flex-start; gap: 10px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; }
  .source-name { font-size: 14px; font-weight: 800; margin-top: 0;}
  .source-right { justify-content: flex-start; width: 100%; gap: 8px; }
  .action-btn, .download-link-btn { font-size: 12px; padding: 8px 12px; flex: 1; text-align: center; justify-content: center; }
}
</style>