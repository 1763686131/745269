<template>
  <div class="single-page-wrapper">
    <div class="detail-container">
      
      <aside class="left-aside white-card-box">
        <button @click="goBack" class="btn-back">
          返回上一级
        </button>

        <div class="download-container mt-2" v-if="game && game.downloads && game.downloads.length">
          <div v-for="(dl, index) in game.downloads" :key="index" class="version-block">
            <div class="version-title">
              {{ dl.platform }} {{ dl.version }}版本
            </div>
            
            <div class="source-rows">
              <div v-for="(source, sIdx) in dl.sources" :key="sIdx" class="source-item">
                <a :href="source.url" target="_blank" class="btn-dl">
                  {{ source.name || '百度网盘' }}
                </a>
                <button @click="copyLink(source.url, source.password)" class="btn-dl">
                  复制链接
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="right-main">
        
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p class="text-muted text-sm mt-2">正在载入游戏详情...</p>
        </div>

        <template v-else-if="game">
          <div class="hero-grey-box">
            <div class="hero-top-btns">
              <button class="btn-pill-action">论坛</button>
              <button class="btn-pill-action">金手指</button>
            </div>

            <div class="platform-icons-group flex gap-3">
              <template v-for="icon in platformIcons" :key="icon.name">
                <img 
                  v-if="icon.src" 
                  :src="icon.src" 
                  :title="icon.name"
                  class="platform-icon-img" 
                />
                <span v-else class="fallback-icon-text">{{ icon.name }}</span>
              </template>
            </div>

            <div class="hero-content">
              <div class="cover-wrapper">
                <img 
                  :src="game.media?.cover" 
                  :alt="game.title?.zh_CN" 
                  class="cover-image" 
                />
              </div>

              <div class="meta-wrapper flex-1">
                
                <div class="title-group w-full pr-32">
                  <h1 class="title-zh">{{ formatNoComma(game.title?.zh_CN) }}</h1>
                  <h2 class="title-en">{{ formatNoComma(game.title?.en_US) }}</h2>
                </div>

                <div class="tag-group mt-3">
                  <span v-for="lang in safeArray(game.aliases, ['简体中文', '英文'])" :key="lang" class="pill-tag">
                    {{ formatNoComma(lang) }}
                  </span>
                </div>

                <div class="tag-group mt-2">
                  <span v-for="genre in safeArray(game.metadata?.genres, ['冒险', '动作', '解密', '开放世界'])" :key="genre" class="pill-tag">
                    {{ formatNoComma(genre) }}
                  </span>
                </div>

                <div class="tag-group mt-2">
                  <span class="pill-tag">
                    switch版本: {{ formatNoComma(game.downloads?.[0]?.edition || '标准版') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="section-screenshot" v-if="game.media?.screenshots?.length">
            <h3 class="section-title">游戏截图</h3>
            <div class="screenshot-grey-box">
              <div class="screenshot-grid">
                <div 
                  v-for="(img, idx) in game.media.screenshots.slice(0, 3)" 
                  :key="idx" 
                  class="screenshot-item cursor-pointer hover:opacity-80 transition-opacity"
                  @click="openPreview(idx)"
                >
                  <img :src="img" :alt="`截图 ${idx + 1}`" class="screenshot-img" />
                </div>
              </div>
            </div>
          </div>

          <div class="section-desc">
            <h3 class="section-title">简介</h3>
            <div class="desc-white-box">
              <p class="desc-paragraph">
                {{ formatNoComma(game.description || '暂无详细简介') }}
              </p>
            </div>
          </div>
        </template>

        <div v-else class="empty-state">
          <p class="text-base font-bold">未能检索到该游戏数据</p>
          <button @click="goBack" class="btn-back mt-3">返回上一级</button>
        </div>

      </main>
    </div>

    <div v-if="isPreviewOpen" class="lightbox-overlay" @click.self="closePreview">
      <button class="lightbox-close" @click="closePreview">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button class="lightbox-btn prev" @click.stop="prevPreview">❮</button>
      
      <div class="relative">
        <img :src="game.media?.screenshots[currentPreviewIndex]" class="lightbox-img" />
        <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-white text-sm tracking-widest opacity-70">
          {{ currentPreviewIndex + 1 }} / {{ game.media?.screenshots.length }}
        </span>
      </div>
      
      <button class="lightbox-btn next" @click.stop="nextPreview">❯</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const game = ref(null)
const isLoading = ref(true)

const platformIcons = computed(() => {
  if (!game.value?.downloads || game.value.downloads.length === 0) return []
  const uniquePlatforms = [...new Set(game.value.downloads.map(d => String(d.platform || '').toUpperCase()))]
  return uniquePlatforms.map(p => {
    if (p.includes('SWITCH')) return { name: p, src: '../../../dist/icon/switch.png' }
    if (p.includes('PC')) return { name: p, src: '../../../dist/icon/pc.png' }
    if (p.includes('PS4') || p.includes('PS5')) return { name: p, src: '../../../dist/icon/playstation.png' }
    return { name: p, src: null }
  })
})

const isPreviewOpen = ref(false)
const currentPreviewIndex = ref(0)
const openPreview = (index) => { currentPreviewIndex.value = index; isPreviewOpen.value = true }
const closePreview = () => { isPreviewOpen.value = false }
const nextPreview = () => {
  if (!game.value?.media?.screenshots || game.value.media.screenshots.length === 0) return
  currentPreviewIndex.value = (currentPreviewIndex.value + 1) % game.value.media.screenshots.length
}
const prevPreview = () => {
  if (!game.value?.media?.screenshots || game.value.media.screenshots.length === 0) return
  const total = game.value.media.screenshots.length
  currentPreviewIndex.value = (currentPreviewIndex.value - 1 + total) % total
}

const formatNoComma = (text) => {
  if (!text) return ''
  return String(text).replace(/,|，/g, ' ')
}

const safeArray = (data, fallback) => {
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const arr = JSON.parse(data)
      if (Array.isArray(arr)) return arr
    } catch {
      return data.split(/,|，/)
    }
  }
  return fallback
}

onMounted(async () => {
  const targetId = String(route.params.id)
  
  // 1. 先从 Pinia 本地找
  let localGame = (gameStore.allGames || []).find(g => String(g.id) === targetId)

  if (localGame) {
    game.value = localGame
    isLoading.value = false
    return
  }

  // 2. 本地没有（按 F5 刷新了），调用 fetchGameById
  try {
    isLoading.value = true
    // store 内会自动用 parseGameData 解析并同步存入 gameStore.allGames，保证数据结构 100% 相同
    const fetchedGame = await gameStore.fetchGameById(targetId)
    if (fetchedGame) {
      game.value = fetchedGame
    }
  } catch (error) {
    console.error('拉取详情数据失败:', error)
  } finally {
    isLoading.value = false
  }
})

const goBack = () => router.back()
const copyLink = async (url, password) => {
  try {
    const text = password ? `链接: ${url} 提取码: ${password}` : url
    await navigator.clipboard.writeText(text)
    alert('链接及提取码已复制！')
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>


<style scoped>
.single-page-wrapper {
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  background-color: var(--bg-body, #f4f5f7);
  color: var(--text-main, #333333);
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

.detail-container {
  width: 100%;
  max-width: 1200px;
  height: 100%;
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 1.75rem;
  box-sizing: border-box;
}

.white-card-box {
  background-color: var(--bg-card, #ffffff);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  border: 1px solid var(--border-light, #f1f5f9);
}

.left-aside {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.btn-back {
  align-self: center;
  width: 80%;
  background-color: var(--bg-card, #ffffff);
  color: var(--text-heading, #111827);
  border: 1px solid var(--border-dark, #cbd5e1);
  border-radius: 0.375rem;
  padding: 0.45rem 0;
  font-size: 0.825rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-back:hover {
  border-color: var(--color-primary, #e60012);
  color: var(--color-primary, #e60012);
}

.download-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
}
.version-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-heading, #111827);
  margin-bottom: 0.35rem;
}
.source-rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.source-item { display: flex; gap: 0.35rem; }
.btn-dl {
  flex: 1;
  background-color: var(--bg-hover, #f8fafc);
  border: 1px solid var(--border-main, #e2e8f0);
  border-radius: 0.375rem;
  padding: 0.35rem 0.25rem;
  font-size: 0.75rem;
  color: var(--text-main, #374151);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.btn-dl:hover {
  border-color: var(--text-heading, #111827);
  color: var(--text-heading, #111827);
}

.right-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  height: 100%;
}

.hero-grey-box {
  position: relative;
  background-color: var(--bg-hover, #eaeaea);
  border-radius: 1rem;
  padding: 1.25rem;
}
.hero-top-btns {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  display: flex;
  gap: 0.4rem;
  z-index: 2;
}
.btn-pill-action {
  background-color: var(--bg-card, #ffffff);
  color: var(--text-heading, #111827);
  border: none;
  border-radius: 9999px;
  padding: 0.3rem 0.9rem;
  font-size: 0.775rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.platform-icons-group {
  position: absolute;
  bottom: 1.25rem;
  right: 1.25rem;
  z-index: 10;
}

.hero-content {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.cover-wrapper {
  flex-shrink: 0;
}
.cover-image {
  width: 350px;
  height: 210px;      
  object-fit: cover;  
  border-radius: 0.75rem;
  display: block;
}

.meta-wrapper {
  display: flex;
  flex-direction: column;
}
.title-zh {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-heading, #111827);
  line-height: 1.2;
}
.title-en {
  font-size: 0.85rem;
  color: var(--text-muted, #6b7280);
  margin-top: 0.15rem;
}

.platform-icon-img {
  width: 3.25rem;
  height: 3.25rem;
  object-fit: contain;
  border-radius: 0.65rem; 
  padding: 0.35rem;
}
.fallback-icon-text {
  font-size: 1rem;
  font-weight: 900;
  color: #e60012;
  padding: 0.5rem;
}

.tag-group { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.pill-tag {
  background-color: var(--bg-card, #ffffff);
  color: var(--text-main, #374151);
  padding: 0.2rem 0.75rem;
  margin-top: 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-heading, #111827);
  margin-bottom: 0.4rem;
}

.section-screenshot { display: flex; flex-direction: column; }
.screenshot-grey-box {
  background-color: var(--bg-hover, #eaeaea);
  border-radius: 1rem;
  padding: 0.6rem;
}
.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}
.screenshot-item {
  border-radius: 0.5rem;
  overflow: hidden;
  aspect-ratio: 16/9;
}
.screenshot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.section-desc {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.desc-white-box {
  flex: 1;
  background-color: var(--bg-card, #ffffff);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  overflow-y: auto;
}
.desc-paragraph {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-main, #4b5563);
  margin: 0;
}

.lightbox-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.88);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  user-select: none;
}

.lightbox-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  width: 3.5rem;
  height: 3.5rem;
  font-size: 1.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.lightbox-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%) scale(1.1);
}
.lightbox-btn.prev { left: 3rem; }
.lightbox-btn.next { right: 3rem; }

.lightbox-close {
  position: absolute;
  top: 2rem;
  right: 2.5rem;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  padding: 0.5rem;
}
.lightbox-close:hover { opacity: 1; }

.loading-state, .empty-state { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; }
.spinner { width: 2rem; height: 2rem; border: 3px solid var(--border-light, #e5e7eb); border-top-color: var(--color-primary, #e60012); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>