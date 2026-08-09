<template>
  <div class="game-detail-container" v-if="game">
    
    <header class="detail-top-header">
      <button class="back-btn" @click="goBack"><span class="back-arrow">⬅️</span> 返回列表</button>
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
          <p class="desc-text">{{ game.description || '暂无详细文字介绍...' }}</p>

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
          <span class="stat-item">🔥 下载量：<strong>{{ game.download_count || 0 }}</strong> 次</span>
          <span class="stat-item">📅 上架时间：<strong>{{ formatDate(game.system?.created_at || game.created_at) }}</strong></span>
        </div>
        <button class="like-action-btn" :class="{ liked: isLiked }" @click="handleInteraction('like')">
          <span class="like-icon">👍</span> 
          <span>{{ isLiked ? '已赞爆该游戏' : '给作者赞爆' }}</span>
          <span class="like-count">({{ game.likesCount || 0 }})</span>
        </button>
      </div>

      <div class="resources-grid-row">
        <div class="resource-card download-box">
          <h3 class="card-head-title">⚡ 资源网盘下载</h3>
          
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

    <transition name="modal-fade">
      <div v-if="showFeedbackModal" class="modal-overlay" @click.self="showFeedbackModal = false">
        <div class="feedback-modal-container">
          <header class="modal-header">
            <h3>📝 提交问题反馈</h3>
            <div class="cf-turnstile" data-sitekey="0x4AAAAAAAiF-A9hD0fS1rB2"></div>
            <button class="close-btn" @click="showFeedbackModal = false">✕</button>
          </header>
          <div class="modal-body">
            <p class="feedback-hint">如果您遇到游戏报错、网盘失效或解压密码错误等问题，请在下方反馈，站长会火速处理！</p>
            <div class="form-item">
              <label>联系方式 <span class="optional">(选填，QQ / 微信 / 邮箱)</span></label>
              <input type="text" v-model="feedbackForm.contact" placeholder="留下您的联系方式，方便给您回复">
            </div>
            <div class="form-item">
              <label>反馈内容 <span class="required">*</span></label>
              <textarea v-model="feedbackForm.content" rows="4" placeholder="请详细描述您遇到的问题..."></textarea>
            </div>
          </div>
          <footer class="modal-footer">
            <button class="btn-cancel" @click="showFeedbackModal = false">取消</button>
            <button class="btn-submit" :disabled="isSubmittingFeedback" @click="submitFeedbackHandler">
              {{ isSubmittingFeedback ? '正在发送...' : '提交给站长' }}
            </button>
          </footer>
        </div>
      </div>
    </transition>

  </div>

  <div class="status-box" v-else-if="isLoading"><div class="spinner"></div><p>正在读取游戏数据...</p></div>
  <div class="status-box" v-else><h2>📭 未找到相关游戏档案</h2><button class="back-home-btn" @click="$router.push('/')">返回首页</button></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore' 

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const game = ref(null)
const isLoading = ref(true)
const isLiked = ref(false)

const activeMediaIndex = ref(0)
let bannerTimer = null

// ==================== 🌟 用户反馈表单逻辑 ====================
const showFeedbackModal = ref(false)
const isSubmittingFeedback = ref(false)
const feedbackForm = ref({
  contact: '',
  content: ''
})

const submitFeedbackHandler = async () => {
  if (!feedbackForm.value.content.trim()) {
    alert('反馈内容不能为空哦！请描述一下您遇到的问题。')
    return
  }

  isSubmittingFeedback.value = true
  
  const payload = {
    game_id: game.value.id,
    game_name: game.value.title?.zh_CN || game.value.title?.en_US || '未知游戏',
    contact_info: feedbackForm.value.contact.trim(),
    content: feedbackForm.value.content.trim()
  }

  const res = await gameStore.submitFeedback(payload)
  isSubmittingFeedback.value = false
  
  if (res.success) {
    alert('✅ 反馈提交成功！站长已经收到通知，会尽快处理哒！')
    showFeedbackModal.value = false
    feedbackForm.value.contact = ''
    feedbackForm.value.content = ''
  } else {
    // 这里会精准拦截出“一天只能提交一次”的后台警告
    alert(`❌ ${res.error}`)
  }
}
// =========================================================

// 智能防抖引擎
const interactState = {
  download: { timer: null, pending: false },
  like: { timer: null, pending: false }
}

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

  if (interactState[type].timer) {
    clearTimeout(interactState[type].timer)
  }

  interactState[type].timer = setTimeout(() => {
    gameStore.recordInteraction(game.value.id, type)
    interactState[type].pending = false
    interactState[type].timer = null
  }, 10000)
}

const handleCopy = async (text, typeName) => {
  handleInteraction('download')
  try {
    await navigator.clipboard.writeText(text)
    alert(`${typeName} [ ${text} ] 已成功复制到剪贴板！`)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const mediaList = computed(() => {
  const list = []
  if (!game.value) return list

  const rawVideo = game.value.media?.video || game.value.video_url || ''
  if (rawVideo) {
    let videoUrl = rawVideo
    const match = videoUrl.match(/src=["']([^"']+)["']/)
    if (match && match[1]) { videoUrl = match[1] }
    if (videoUrl.startsWith('//')) { videoUrl = 'https:' + videoUrl }

    if (videoUrl.includes('bilibili.com')) {
      videoUrl = videoUrl.replace(/[?&]autoplay=[^&]*/g, '')
      videoUrl += (videoUrl.includes('?') ? '&' : '?') + 'danmaku=0&high_quality=1&as_wide=1'
    }
    list.push({ type: 'video', src: videoUrl })
  }

  const screenshots = game.value.media?.screenshots || []
  if (Array.isArray(screenshots)) {
    screenshots.forEach(imgUrl => {
      if (imgUrl) list.push({ type: 'image', src: imgUrl })
    })
  }
  return list
})

const currentMedia = computed(() => mediaList.value[activeMediaIndex.value] || null)

const stopBannerTimer = () => {
  if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null }
}

const startBannerTimer = () => {
  stopBannerTimer()
  if (currentMedia.value?.type === 'video' || mediaList.value.length <= 1) return

  bannerTimer = setInterval(() => {
    if (currentMedia.value?.type === 'video') {
      stopBannerTimer()
      return
    }
    const nextIndex = (activeMediaIndex.value + 1) % mediaList.value.length
    activeMediaIndex.value = nextIndex
    if (mediaList.value[nextIndex]?.type === 'video') {
      stopBannerTimer()
    }
  }, 5000)
}

const handleManualChange = (idx) => {
  activeMediaIndex.value = idx
  stopBannerTimer()
  if (mediaList.value[idx]?.type !== 'video') {
    startBannerTimer()
  }
}

onMounted(async () => {
  const targetId = String(route.params.id)
  let localGame = (gameStore.allGames || []).find(g => String(g.id) === targetId)

  if (localGame) {
    game.value = localGame
    isLoading.value = false
    if (currentMedia.value?.type !== 'video') startBannerTimer()
    return
  }
  try {
    isLoading.value = true
    const fetchedGame = await gameStore.fetchGameById(targetId)
    if (fetchedGame) {
      game.value = fetchedGame
      if (currentMedia.value?.type !== 'video') startBannerTimer()
    }
  } catch (error) {} finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  stopBannerTimer()
  if (interactState.download.timer) gameStore.recordInteraction(game.value.id, 'download')
  if (interactState.like.timer) gameStore.recordInteraction(game.value.id, 'like')
})

const goBack = () => { router.back() }
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
.mini-badge { background: var(--bg-hover); color: var(--text-muted); font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-main); }
.mini-badge.rating { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }

.desc-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 20px; flex: 1; }
.section-title { font-size: 18px; font-weight: 800; color: var(--text-heading); margin: 0 0 14px 0; border-bottom: 1px solid var(--border-main); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.playing-tag { font-size: 12px; color: #ec4899; background: rgba(236, 72, 153, 0.1); padding: 2px 10px; border-radius: 100px; }

.desc-text { font-size: 14px; line-height: 1.7; color: var(--text-muted); white-space: pre-line; margin: 0 0 16px 0; }

.genre-tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
.genre-tag-pill { font-size: 12px; color: var(--color-primary); font-weight: 700; background: rgba(37, 99, 235, 0.08); padding: 4px 10px; border-radius: 100px; border: 1px solid rgba(37, 99, 235, 0.15); }
.lang-tag-pill { font-size: 12px; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.08); padding: 4px 10px; border-radius: 100px; border: 1px solid rgba(16, 185, 129, 0.2); }

.right-banner-column { height: 100%; }
.banner-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 20px; height: 100%; display: flex; flex-direction: column; }
.main-banner-viewer { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #000; border: 1px solid var(--border-main); }

.bilibili-iframe { width: 100%; height: 100%; border: none; display: block; }
.fade-transition { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0.6; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }

.active-banner-img { width: 100%; height: 100%; object-fit: contain; }
.image-counter { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; backdrop-filter: blur(4px); pointer-events: none; }
.banner-placeholder { width: 100%; aspect-ratio: 16 / 9; background: var(--bg-hover); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }

.thumbnails-track { display: flex; gap: 12px; margin-top: 16px; overflow-x: auto; padding-bottom: 6px; }
.thumbnails-track::-webkit-scrollbar { height: 6px; }
.thumbnails-track::-webkit-scrollbar-thumb { background: var(--border-dark); border-radius: 4px; }
.thumb-item { width: 100px; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; opacity: 0.6; transition: all 0.2s ease; flex-shrink: 0; position: relative; }
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
.stats-left { display: flex; gap: 24px; font-size: 14px; color: var(--text-muted); }
.stat-item strong { color: var(--text-heading); }
.like-action-btn { background: var(--bg-hover); border: 2px solid var(--border-main); color: var(--text-heading); padding: 10px 24px; border-radius: 100px; font-size: 15px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.like-action-btn:hover { border-color: #ec4899; color: #ec4899; transform: scale(1.05); }
.like-action-btn.liked { background: #ec4899; color: #fff; border-color: #ec4899; box-shadow: 0 6px 20px rgba(236, 72, 153, 0.3); }

.resources-grid-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
.resource-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 16px; padding: 24px; }
.card-head-title { font-size: 18px; font-weight: 800; color: var(--text-heading); margin: 0 0 16px 0; border-bottom: 2px solid var(--border-main); padding-bottom: 10px; }

.dl-group-item { background: var(--bg-hover); border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid var(--border-main); }
.dl-plat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px dashed var(--border-main); padding-bottom: 10px; }
.dl-plat-tag { font-size: 15px; font-weight: 900; color: var(--color-primary); }
.dl-meta-info { display: flex; gap: 8px; flex-wrap: wrap; }
.dl-meta-badge { font-size: 12px; background: var(--bg-card); color: var(--text-muted); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-light); font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

.source-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-radius: 8px; transition: 0.2s; }
.source-name { font-size: 14px; font-weight: 800; color: var(--text-main); }
.source-right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }

.action-btn { background: var(--bg-card); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; border: 1px solid var(--border-main); color: var(--text-muted); display: inline-flex; align-items: center; }
.action-btn:hover { transform: translateY(-1px); }
.copy-link { color: #10b981; border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.05); }
.copy-link:hover { background: #10b981; color: #fff; }
.copy-code { color: var(--color-pink); border-color: rgba(236, 72, 153, 0.2); background: rgba(236, 72, 153, 0.05); }
.copy-code:hover { background: var(--color-pink); color: #fff; }

.download-link-btn { background: var(--color-primary, #2563eb); color: #fff; text-decoration: none; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; transition: 0.2s; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }
.download-link-btn:hover { filter: brightness(1.15); transform: translateY(-1px); box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3); }

.forum-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px; }
.forum-btn { width: 100%; background: var(--bg-hover); border: 2px dashed var(--border-dark); color: var(--text-heading); padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; }
.forum-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--bg-card); }

/* 🌟 反馈按钮样式 */
.feedback-btn { width: 100%; background: transparent; border: 2px dashed #f43f5e; color: #f43f5e; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; margin-top: 12px; }
.feedback-btn:hover { background: rgba(244, 63, 94, 0.05); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(244, 63, 94, 0.15); }

/* 🌟 反馈弹窗专属高级 CSS */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.feedback-modal-container { background: var(--bg-card); width: 90%; max-width: 500px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; border: 1px solid var(--border-light); transform: scale(1); transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .feedback-modal-container, .modal-fade-leave-to .feedback-modal-container { transform: scale(0.95); }

.feedback-modal-container .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
.feedback-modal-container .modal-header h3 { margin: 0; font-size: 18px; color: var(--text-heading); font-weight: 800; }
.feedback-modal-container .close-btn { background: transparent; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
.feedback-modal-container .close-btn:hover { color: #f43f5e; transform: rotate(90deg); }

.feedback-modal-container .modal-body { padding: 24px; }
.feedback-hint { font-size: 13px; color: var(--text-muted); margin: 0 0 20px 0; line-height: 1.6; }
.form-item { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.form-item label { font-size: 14px; font-weight: 700; color: var(--text-main); }
.form-item .required { color: #f43f5e; }
.form-item .optional { color: var(--text-light); font-size: 12px; font-weight: normal; }
.form-item input, .form-item textarea { width: 100%; background: var(--bg-body); border: 1px solid var(--border-main); color: var(--text-main); padding: 12px 16px; border-radius: 12px; font-size: 14px; transition: 0.2s; outline: none; box-sizing: border-box; resize: vertical; }
.form-item input:focus, .form-item textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

.feedback-modal-container .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--border-light); background: var(--bg-hover); }
.feedback-modal-container .btn-cancel { background: transparent; border: 1px solid var(--border-dark); color: var(--text-muted); padding: 10px 20px; border-radius: 100px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.feedback-modal-container .btn-cancel:hover { background: var(--border-light); color: var(--text-main); }
.feedback-modal-container .btn-submit { background: var(--color-primary); border: none; color: #fff; padding: 10px 24px; border-radius: 100px; font-weight: 800; cursor: pointer; transition: 0.2s; }
.feedback-modal-container .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.2); }
.feedback-modal-container .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.status-box { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); }
.back-home-btn { background: var(--color-primary); color: #fff; border: none; padding: 10px 24px; border-radius: 100px; font-weight: 800; cursor: pointer; margin-top: 16px; }
.spinner { width: 2.5rem; height: 2.5rem; border: 3px solid var(--border-main); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem;}
@keyframes spin { to { transform: rotate(360deg); } }

/* ==================== 📱 移动端自适应 ==================== */
@media (max-width: 768px) {
  .game-detail-container { padding: 16px 12px 60px 12px; }
  
  .detail-top-header { flex-direction: column; gap: 12px; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; }
  .center-title-box { text-align: left; width: 100%; }
  .main-title-zh { font-size: 22px; }
  .sub-title-en { font-size: 12px; }
  .header-placeholder { display: none; }
  .back-btn { font-size: 13px; padding: 6px 14px; }

  .middle-main-layout { grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px; }
  .poster-card { padding: 12px; }
  .poster-img { max-height: 320px; object-fit: cover; } 
  
  .desc-card, .banner-card, .resource-card { padding: 16px; border-radius: 12px; }
  .section-title, .card-head-title { font-size: 16px; margin-bottom: 12px; }
  
  .thumb-item { width: 80px; }

  .bottom-action-layout { gap: 16px; }
  .interaction-bar-card { flex-direction: column; gap: 12px; align-items: flex-start; padding: 16px; }
  .stats-left { flex-direction: column; gap: 6px; font-size: 13px; width: 100%; }
  .like-action-btn { width: 100%; justify-content: center; font-size: 14px; padding: 12px; }

  .resources-grid-row { grid-template-columns: 1fr; gap: 16px; }
  .dl-group-item { padding: 12px; }
  .dl-plat-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .source-row { flex-direction: column; align-items: flex-start; gap: 10px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; }
  .source-name { font-size: 14px; font-weight: 800; }
  .source-right { justify-content: flex-start; width: 100%; gap: 8px; }
  .action-btn, .download-link-btn { font-size: 12px; padding: 8px 12px; flex: 1; text-align: center; justify-content: center; }

  /* 移动端弹窗适配 */
  .feedback-modal-container { width: 95%; }
  .feedback-modal-container .modal-header { padding: 16px; }
  .feedback-modal-container .modal-body { padding: 16px; }
  .feedback-modal-container .modal-footer { padding: 12px 16px; }
}
</style>