<template>
  <div class="lottery-overlay" v-if="isVisible" @click="handleOverlayClick">
    <div class="lottery-modal" @click.stop>
      <!-- 标题区域 -->
      <div class="modal-header">
        <h2 class="modal-title">每日游戏抽奖</h2>
        <button class="close-btn" @click="closeLottery">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 🌟 加载状态 -->
      <div v-if="isLoading" class="loading-section">
        <div class="loading-animation">
          <div class="stars-container">
            <span class="star">⭐</span>
            <span class="star">✨</span>
            <span class="star">🌟</span>
          </div>
          <h3 class="loading-text">探索星辰大海中...</h3>
          <p class="loading-hint">系统正在为你寻找最适合的游戏...</p>
        </div>
      </div>

      <!-- 问答阶段（两个问题在同一页） -->
      <div v-else-if="currentStep === 'question'" class="question-section">
        <!-- 问题1：游戏类型 -->
        <div class="question-block">
          <h3 class="question-title">
            <span class="question-number">1️⃣</span>
            你喜欢什么类型的游戏？
          </h3>
          <p class="question-hint">可以多选哦~</p>

          <div class="options-grid">
            <label
              v-for="genre in availableGenres"
              :key="genre"
              class="option-checkbox"
              :class="{ 'is-selected': selectedGenres.includes(genre) }"
            >
              <input
                type="checkbox"
                :value="genre"
                v-model="selectedGenres"
              />
              <span class="option-label">{{ genre }}</span>
            </label>
          </div>
        </div>

        <!-- 问题2：游戏人数 -->
        <div class="question-block">
          <h3 class="question-title">
            <span class="question-number">2️⃣</span>
            你希望几个人一起玩？
          </h3>
          <p class="question-hint">选择你的游戏方式</p>

          <div class="player-options">
            <label
              v-for="option in playerOptions"
              :key="option.value"
              class="player-option"
              :class="{ 'is-selected': selectedPlayers === option.value }"
            >
              <input
                type="radio"
                name="players"
                :value="option.value"
                v-model="selectedPlayers"
              />
              <span class="option-icon">{{ option.icon }}</span>
              <span class="option-text">{{ option.label }}</span>
            </label>
          </div>
        </div>

        <!-- 问题3：游戏平台 -->
        <div class="question-block">
          <h3 class="question-title">
            <span class="question-number">3️⃣</span>
            你想玩哪个平台的游戏？
          </h3>
          <p class="question-hint">选择你的游戏平台</p>

          <div class="player-options">
            <label
              v-for="option in platformOptions"
              :key="option.value"
              class="player-option"
              :class="{ 'is-selected': selectedPlatform === option.value }"
            >
              <input
                type="radio"
                name="platform"
                :value="option.value"
                v-model="selectedPlatform"
              />
              <span class="option-icon">{{ option.icon }}</span>
              <span class="option-text">{{ option.label }}</span>
            </label>
          </div>
        </div>

        <!-- 探索游戏按钮 -->
        <button
          class="explore-btn"
          :disabled="selectedGenres.length === 0 || !selectedPlayers || !selectedPlatform"
          @click="generateCards"
        >
          🚀 探索游戏
        </button>
      </div>

      <!-- 卡片翻转阶段 -->
      <div v-else-if="currentStep === 'cards'" class="cards-section">
        <p class="cards-hint">系统为你准备了4个命运之选，点击翻开查看！</p>

        <div class="cards-grid">
          <div
            v-for="(card, index) in cards"
            :key="index"
            class="card-wrapper"
            :class="{
              'is-flipped': card.isFlipped,
              [`rarity-${card.rarity}`]: card.isFlipped
            }"
            @click="flipCard(index)"
          >
            <div class="card-inner">
              <!-- 卡片背面 -->
              <div class="card-back">
                <div class="card-pattern">
                  <svg class="mystery-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span class="mystery-text">?</span>
                </div>
              </div>

              <!-- 卡片正面 -->
              <div class="card-front">
                <!-- 游戏封面 -->
                <div class="card-image-wrapper">
                  <img v-if="card.game?.media?.cover" :src="card.game.media.cover" :alt="card.game.title?.zh_CN" class="game-cover-img" />
                  <div v-else class="image-placeholder"><span class="placeholder-text">暂无封面</span></div>
                </div>

                <!-- 游戏信息 -->
                <div class="card-content">
                  <h2 class="game-title">{{ card.game?.title?.zh_CN || '神秘游戏' }}</h2>
                  <p class="game-desc">{{ card.game?.description || '暂无简介，尽情探索吧！' }}</p>

                  <!-- 标签 -->
                  <div class="card-tags">
                    <!-- 平台标签 -->
                    <span
                      v-for="(platform, idx) in card.game?.metadata?.platforms?.slice(0, 2)"
                      :key="'p-'+idx"
                      class="cute-tag-pill bg-blue"
                    >
                      {{ platform.toUpperCase() }}
                    </span>
                    <!-- 类型标签 -->
                    <span
                      v-for="(genre, idx) in card.game?.metadata?.genres?.slice(0, 2)"
                      :key="'g-'+idx"
                      class="cute-tag-pill bg-pink"
                    >
                      {{ genre }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 重新占卜按钮：仅管理员可见 -->
        <button v-if="isAdmin" class="reset-btn" @click="resetToQuestions">
          🔄 重新占卜
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore } from '@/store/gameStore'
import { useRouter, useRoute } from 'vue-router'

const gameStore = useGameStore()
const router = useRouter()
const route = useRoute()

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'open'])

// localStorage 的键名
const LOTTERY_STORAGE_KEY = 'daily_lottery_data'

// 记录抽卡完成后的路由路径，用于返回时恢复弹窗
const lotteryCompletePath = ref(null)

// 当前步骤：question 问答 / loading 加载 / cards 翻卡
const currentStep = ref('question')
// 加载状态
const isLoading = ref(false)

// 检查是否是管理员（从 gameStore 获取）
const isAdmin = computed(() => {
  return gameStore.isAdminLoggedIn || false
})

// 用户选择
const selectedGenres = ref([]) // 选择的游戏类型（多选）
const selectedPlayers = ref('') // 选择的人数模式（单选）
const selectedPlatform = ref('') // 选择的游戏平台（单选）

// 固定的游戏类型（6个分类）
const availableGenres = [
  '动作',
  '冒险',
  '模拟',
  '角色扮演',
  '休闲',
  '其他'
]

// 人数选项
const playerOptions = [
  { value: 'single', label: '单人游戏', icon: '🎮' },
  { value: 'multi', label: '多人游戏', icon: '👥' },
  { value: 'lan', label: '局域网联机', icon: '🌐' }
]

// 游戏平台选项
const platformOptions = [
  { value: 'SWITCH', label: 'Switch', icon: '🎮' },
  { value: 'PC', label: 'PC', icon: '💻' },
  { value: 'PS4', label: 'PS4', icon: '🎯' }
]

// 卡片数据
const cards = ref([])

// 获取今天的日期字符串（YYYY-MM-DD）
const getTodayString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 从 localStorage 加载今日抽卡数据
const loadTodayLottery = () => {
  try {
    const stored = localStorage.getItem(LOTTERY_STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored)
    const today = getTodayString()

    // 如果日期不是今天，清除过期数据并返回 null
    if (data.date !== today) {
      localStorage.removeItem(LOTTERY_STORAGE_KEY)
      console.log('清除过期的抽卡数据')
      return null
    }

    return data
  } catch (error) {
    console.error('加载本地存储数据失败：', error)
    return null
  }
}

// 保存抽卡数据到 localStorage
const saveLotteryToStorage = (cardsData) => {
  try {
    const today = getTodayString()
    const data = {
      date: today,
      cards: cardsData.map(card => ({
        gameId: card.game?.id,
        game: card.game,
        rarity: card.rarity,
        isFlipped: card.isFlipped ? 1 : 0 // 0 = 未翻开，1 = 已翻开
      }))
    }
    localStorage.setItem(LOTTERY_STORAGE_KEY, JSON.stringify(data))
    console.log('抽卡数据已保存到本地存储')
  } catch (error) {
    console.error('保存本地存储数据失败：', error)
  }
}

// 从存储的数据恢复卡片
const restoreCardsFromStorage = (storedData) => {
  cards.value = storedData.cards.map(card => ({
    game: card.game,
    rarity: card.rarity,
    isFlipped: card.isFlipped === 1 // 根据存储的状态恢复
  }))
  currentStep.value = 'cards'
  console.log('已从本地存储恢复卡片数据')
}

// 清除本地存储（重新占卜时使用）
const clearLotteryStorage = () => {
  try {
    localStorage.removeItem(LOTTERY_STORAGE_KEY)
    console.log('本地存储已清除')
  } catch (error) {
    console.error('清除本地存储失败：', error)
  }
}

// 根据用户选择生成卡片（添加加载动画）
const generateCards = async () => {
  // 🌟 首先检查本地存储是否有今日数据
  const todayData = loadTodayLottery()
  if (todayData) {
    console.log('从本地存储加载今日抽卡数据')
    restoreCardsFromStorage(todayData)
    return
  }

  // 显示加载状态
  isLoading.value = true

  // 如果本地没有数据，先从服务器获取
  if (gameStore.allGames.length === 0) {
    await gameStore.fetchGames(false, '') // 获取所有游戏
  }

  // 模拟加载延迟（让用户看到"探索星辰大海"的动画）
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 定义主要类型
  const mainGenres = ['动作', '冒险', '模拟', '角色扮演', '休闲']

  console.log('开始筛选，当前游戏总数：', gameStore.allGames.length)
  console.log('筛选条件 - 类型：', selectedGenres.value)
  console.log('筛选条件 - 人数：', selectedPlayers.value)
  console.log('筛选条件 - 平台：', selectedPlatform.value)

  // 根据用户选择筛选游戏
  let filteredGames = gameStore.allGames.filter(game => {
    // 筛选条件1：游戏类型
    let hasMatchingGenre = false

    if (selectedGenres.value.length === 0) {
      hasMatchingGenre = true
    } else {
      const gameGenres = game.metadata?.genres || []

      // 检查是否选择了"其他"
      const hasOtherSelected = selectedGenres.value.includes('其他')
      // 检查游戏是否属于主要类型
      const belongsToMainGenres = gameGenres.some(g => mainGenres.includes(g))

      // 遍历用户选择的类型
      for (const selectedGenre of selectedGenres.value) {
        if (selectedGenre === '其他') {
          // 如果选了"其他"，匹配不属于主要类型的游戏
          if (!belongsToMainGenres) {
            hasMatchingGenre = true
            break
          }
        } else {
          // 匹配具体类型
          if (gameGenres.includes(selectedGenre)) {
            hasMatchingGenre = true
            break
          }
        }
      }
    }

    // 筛选条件2：游戏人数（根据栏目分类）
    let matchesPlayerMode = true
    if (selectedPlayers.value) {
      const category = game.metadata?.category || ''

      if (selectedPlayers.value === 'single') {
        matchesPlayerMode = category === 'single'
      } else if (selectedPlayers.value === 'multi') {
        matchesPlayerMode = category === 'double' || category === 'multi'
      } else if (selectedPlayers.value === 'lan') {
        matchesPlayerMode = category === 'multi'
      }
    }

    // 筛选条件3：游戏平台
    let matchesPlatform = true
    if (selectedPlatform.value) {
      const platforms = game.metadata?.platforms || []
      // 使用与 Column.vue 一致的筛选逻辑
      matchesPlatform = platforms.some(p => {
        const platformUpper = (p || '').toString().toUpperCase()
        return platformUpper.includes(selectedPlatform.value)
      })
    }

    return hasMatchingGenre && matchesPlayerMode && matchesPlatform
  })

  console.log('筛选后游戏数量：', filteredGames.length)
  if (filteredGames.length > 0) {
    console.log('筛选结果示例（前3个）：', filteredGames.slice(0, 3).map(g => ({
      title: g.title?.zh_CN,
      platforms: g.metadata?.platforms
    })))
  }

  // 如果筛选结果少于4个，从所有游戏中补充
  if (filteredGames.length < 4) {
    filteredGames = gameStore.allGames.slice(0)
  }

  // 🌟 如果数据库返回的数据小于4条，显示"补充中..."提示
  if (filteredGames.length < 4) {
    alert('符合条件的游戏不足4款，正在补充中...')
    isLoading.value = false
    currentStep.value = 'question' // 返回问答界面
    return
  }

  // 如果还是没有数据（数据库为空的情况）
  if (filteredGames.length === 0) {
    alert('暂无游戏数据，请稍后再试')
    isLoading.value = false
    return
  }

  // 随机抽取4个游戏（如果不足4个就全部取）
  const shuffled = filteredGames.sort(() => 0.5 - Math.random())
  const selectedGames = shuffled.slice(0, Math.min(4, filteredGames.length))

  // 随机指定一张金色传说
  const legendaryIndex = Math.floor(Math.random() * selectedGames.length)

  // 生成卡片
  cards.value = selectedGames.map((game, index) => {
    let rarity
    if (index === legendaryIndex) {
      rarity = 'legendary'
    } else {
      const rarities = ['common', 'rare', 'epic']
      rarity = rarities[Math.floor(Math.random() * rarities.length)]
    }

    return {
      game: game,
      isFlipped: false,
      rarity: rarity
    }
  })

  // 保存到本地存储
  saveLotteryToStorage(cards.value)

  // 隐藏加载，显示卡片
  isLoading.value = false
  currentStep.value = 'cards'
}

// 翻牌方法（每天只能翻一次，翻开后更新本地存储）
const flipCard = (index) => {
  const card = cards.value[index]

  if (!card.isFlipped) {
    // 第一次点击：翻开卡片
    card.isFlipped = true
    // 更新本地存储，保存翻开状态
    saveLotteryToStorage(cards.value)
  } else {
    // 第二次点击：跳转到游戏详情页并关闭弹窗
    if (card.game && card.game.id) {
      // 记录当前路由路径，用于返回时恢复弹窗
      lotteryCompletePath.value = route.path
      // 关闭弹窗
      emit('close')
      // 跳转到详情页
      router.push(`/game/${card.game.id}`)
    }
  }
}

// 获取游戏描述
const getGameDescription = (game) => {
  if (!game) return '神秘的游戏'

  const platforms = game.metadata?.platforms?.join(' / ') || ''
  const rating = game.metadata?.rating ? `⭐ ${game.metadata.rating}` : ''

  return `${platforms} ${rating}`.trim() || game.description || '点击卡片查看详情'
}

// 获取稀有度文字
const getRarityText = (rarity) => {
  const rarityMap = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return rarityMap[rarity] || '未知'
}

// 重置到问答阶段（管理员专用：重新占卜）
const resetToQuestions = () => {
  // 清除本地存储
  clearLotteryStorage()
  // 重置状态
  currentStep.value = 'question'
  isLoading.value = false
  selectedGenres.value = []
  selectedPlayers.value = ''
  selectedPlatform.value = ''
  cards.value = []
}

// 关闭弹窗（不删除本地存储，只关闭界面）
const closeLottery = () => {
  emit('close')
  // 不再调用 resetToQuestions()，保持数据不变
}

// 点击遮罩层关闭
const handleOverlayClick = () => {
  closeLottery()
}

// 监听弹窗打开
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    // 弹窗打开时，检查是否有今日数据
    const todayData = loadTodayLottery()
    if (todayData) {
      // 如果有今日数据，直接显示卡片
      restoreCardsFromStorage(todayData)
    } else {
      // 否则重置到问答界面
      resetToQuestions()
    }
  }
})

// 监听路由变化，从详情页返回时重新打开弹窗
watch(() => route.path, (newPath, oldPath) => {
  // 如果记录了抽卡完成路径，且当前路径回到了该路径，且弹窗未打开
  if (lotteryCompletePath.value && newPath === lotteryCompletePath.value && !props.isVisible) {
    // 从详情页返回到抽卡页面，重新打开弹窗显示已翻开的卡片
    const todayData = loadTodayLottery()
    if (todayData) {
      // 恢复卡片数据
      restoreCardsFromStorage(todayData)
      // 重新打开弹窗
      emit('open')
    }
  }

  // 如果离开了抽卡完成路径，清除记录
  if (lotteryCompletePath.value && newPath !== lotteryCompletePath.value && !newPath.startsWith('/game/')) {
    lotteryCompletePath.value = null
  }
})
</script>

<style scoped>
/* ==================== 遮罩层 ==================== */
.lottery-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ==================== 弹窗主体 ==================== */
.lottery-modal {
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: auto;
  background-color: var(--bg-card);
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
  padding: 24px;
  animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 2px solid var(--border-light);
  position: relative;
  box-sizing: border-box;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(40px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ==================== 标题栏 ==================== */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-heading);
  margin: 0;
  letter-spacing: -0.5px;
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: transparent;
  border: 2px solid var(--border-main);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-dark);
  color: var(--text-heading);
  transform: rotate(90deg);
}

/* ==================== 提示文字 ==================== */
.lottery-hint {
  text-align: center;
  margin-bottom: 32px;
}

.lottery-hint p {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

/* ==================== 🌟 加载状态 ==================== */
.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 60px 20px;
}

.loading-animation {
  text-align: center;
}

.stars-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 32px;
}

.star {
  font-size: 48px;
  animation: starTwinkle 1.5s ease-in-out infinite;
  display: inline-block;
}

.star:nth-child(1) {
  animation-delay: 0s;
}

.star:nth-child(2) {
  animation-delay: 0.3s;
}

.star:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes starTwinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

.loading-text {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-heading);
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmerText 2s linear infinite;
}

@keyframes shimmerText {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

.loading-hint {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0;
}

/* ==================== 🌟 问答区域 ==================== */
.question-section {
  width: 100%;
}

.question-block {
  margin-bottom: 28px; /* 缩小间距 */
}

.question-block:last-of-type {
  margin-bottom: 24px; /* 缩小间距 */
}

.question-title {
  font-size: 18px; /* 缩小字号 */
  font-weight: 900;
  color: var(--text-heading);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 10px; /* 缩小间距 */
}

.question-number {
  font-size: 20px; /* 缩小字号 */
}

.question-hint {
  font-size: 13px; /* 缩小字号 */
  color: var(--text-muted);
  margin: 0 0 16px 0; /* 缩小间距 */
}

/* ==================== 游戏类型选项（多选） ==================== */
.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 改为3列，更紧凑 */
  gap: 10px; /* 缩小间距 */
  width: 100%;
  margin-bottom: 0; /* 移除底部间距 */
}

.option-checkbox {
  position: relative;
  cursor: pointer;
}

.option-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px; /* 缩小内边距 */
  background-color: var(--bg-body);
  border: 2px solid var(--border-main);
  border-radius: 12px;
  font-size: 13px; /* 缩小字号 */
  font-weight: 700;
  color: var(--text-main);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.option-checkbox:hover .option-label {
  border-color: var(--border-dark);
  background-color: var(--bg-hover);
}

.option-checkbox.is-selected .option-label {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* ==================== 游戏人数选项（单选） ==================== */
.player-options {
  display: flex;
  gap: 12px; /* 缩小间距 */
  width: 100%;
  margin-bottom: 0; /* 移除底部间距 */
}

.player-option {
  flex: 1;
  position: relative;
  cursor: pointer;
}

.player-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.player-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px; /* 缩小间距 */
  padding: 16px 12px; /* 缩小内边距 */
  background-color: var(--bg-body);
  border: 2px solid var(--border-main);
  border-radius: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.player-option:hover {
  border-color: var(--border-dark);
  background-color: var(--bg-hover);
  transform: translateY(-2px);
}

.player-option.is-selected {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-4px);
}

.option-icon {
  font-size: 40px; /* 缩小图标 */
}

.option-text {
  font-size: 14px; /* 缩小字号 */
  font-weight: 800;
  color: var(--text-heading);
}

.player-option.is-selected .option-text {
  color: #ffffff;
}

/* ==================== 按钮 ==================== */
.explore-btn,
.reset-btn {
  padding: 14px 40px; /* 缩小内边距 */
  font-size: 16px; /* 缩小字号 */
  font-weight: 900;
  color: #ffffff;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  width: 100%;
  margin-top: 24px; /* 缩小间距 */
}

.explore-btn:hover,
.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(245, 158, 11, 0.5);
}

.explore-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  box-shadow: none;
}

.reset-btn {
  margin-top: 24px;
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  box-shadow: 0 4px 16px rgba(107, 114, 128, 0.3);
}

/* ==================== 🌟 卡片阶段 ==================== */
.cards-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cards-hint {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0 0 32px 0;
  text-align: center;
}

/* ==================== 卡片网格 ==================== */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
  box-sizing: border-box;
}

/* ==================== 卡片容器（3D翻转效果） ==================== */
.card-wrapper {
  width: 100%;
  max-width: 100%;
  aspect-ratio: 3 / 4.2;
  perspective: 1200px;
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

/* 金色传说卡片翻转速度变慢 */
.card-wrapper.rarity-legendary .card-inner {
  transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-wrapper.is-flipped .card-inner {
  transform: rotateY(180deg);
}

/* ==================== 卡片正反面公共样式 ==================== */
.card-back,
.card-front {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-light);
  transition: all 0.3s ease;
  overflow: hidden; /* 确保子元素不会溢出圆角 */
}

/* ==================== 卡片背面 ==================== */
.card-back {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

/* 只在未翻开时才有悬浮效果 */
.card-wrapper:not(.is-flipped):hover .card-back {
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
  transform: translateY(-4px);
}

.card-pattern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.mystery-icon {
  width: 48px;
  height: 48px;
  opacity: 0.9;
}

.mystery-text {
  font-size: 64px;
  font-weight: 900;
  opacity: 0.8;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* ==================== 卡片正面 ==================== */
.card-front {
  background-color: transparent; /* 改为透明，移除背景色 */
  transform: rotateY(180deg);
  padding: 0; /* 移除内边距，让封面占满 */
  position: relative;
  overflow: hidden; /* 确保子元素不会溢出 */
  cursor: pointer;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

/* ==================== 🌟 游戏封面区域 ==================== */
.card-image-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
}

.game-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-placeholder {
  width: 100%;
  height: 100%;
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

/* ==================== 🌟 卡片内容区域 ==================== */
.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-body); /* 只给内容区域加背景 */
  overflow: hidden;
  min-height: 0;
}

.game-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-heading);
  margin: 0 0 8px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  max-height: 42px;
}

.game-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  max-height: 36px;
}

/* ==================== 🌟 标签区域 ==================== */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.cute-tag-pill {
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 100px;
  white-space: nowrap;
}

.bg-blue {
  background-color: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.bg-pink {
  background-color: rgba(236, 72, 153, 0.1);
  color: #ec4899;
  border: 1px solid rgba(236, 72, 153, 0.2);
}

/* ==================== 🌟 炉石传说风格发光特效 ==================== */
/* 传说卡片发光效果 */
.card-wrapper.rarity-legendary .card-front {
  border: 3px solid #ffd700;
  animation: legendaryBorderBlink 3s ease-in-out infinite;
}

@keyframes legendaryBorderBlink {
  0%, 20% {
    border-color: rgba(255, 215, 0, 0); /* 完全透明，不发光 */
  }
  50% {
    border-color: rgba(255, 215, 0, 1); /* 完全不透明，最亮 */
  }
  100% {
    border-color: rgba(255, 215, 0, 0); /* 回到透明 */
  }
}

/* 史诗卡片紫色边框 */
.card-wrapper.rarity-epic .card-front {
  border: 2px solid #8b5cf6;
}

/* 稀有卡片蓝色边框 */
.card-wrapper.rarity-rare .card-front {
  border: 2px solid #3b82f6;
}

/* ==================== 底部说明 ==================== */
.lottery-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-light);
}

.footer-tip {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0;
}

/* ==================== 📱 移动端适配 ==================== */
@media (max-width: 992px) {
  .lottery-modal {
    width: 95%;
    padding: 24px;
  }

  .modal-title {
    font-size: 18px;
  }

  /* 加载动画 */
  .loading-section {
    min-height: 300px;
    padding: 40px 20px;
  }

  .stars-container {
    gap: 12px;
  }

  .star {
    font-size: 36px;
  }

  .loading-text {
    font-size: 22px;
  }

  .loading-hint {
    font-size: 14px;
  }

  /* 问题区域 */
  .question-title {
    font-size: 18px;
  }

  .question-number {
    font-size: 20px;
  }

  .question-hint {
    font-size: 13px;
  }

  /* 游戏类型选项 */
  .options-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }

  .option-label {
    padding: 10px 12px;
    font-size: 13px;
  }

  /* 游戏人数选项 */
  .player-options {
    flex-direction: row;
    gap: 10px;
  }

  .player-option {
    padding: 16px 12px;
  }

  .option-icon {
    font-size: 36px;
  }

  .option-text {
    font-size: 13px;
  }

  /* 卡片改为2x2网格 */
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .reward-icon {
    font-size: 48px;
  }

  .reward-name {
    font-size: 16px;
  }

  .reward-desc {
    font-size: 13px;
  }

  .mystery-text {
    font-size: 48px;
  }

  .mystery-icon {
    width: 36px;
    height: 36px;
  }

  .game-cover {
    margin-bottom: 12px;
  }

  .explore-btn,
  .reset-btn {
    padding: 14px 32px;
    font-size: 16px;
  }
}
</style>
