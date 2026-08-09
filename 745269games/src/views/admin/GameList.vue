<template>
  <div class="login-guard-container" v-if="!gameStore.isAdminLoggedIn">
    <div class="login-card">
      <div class="login-logo">
        <span class="glitch-text">745269</span> CMS
      </div>
      <p class="login-subtitle">核心数据库管理系统</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>超级管理员账号</label>
          <input type="text" v-model="loginForm.username" placeholder="请输入 Admin 账号" required />
        </div>

        <div class="input-group">
          <label>授权秘钥 (Password)</label>
          <input type="password" v-model="loginForm.password" placeholder="••••••••" required />
        </div>

        <div class="input-group captcha-group" v-if="requireCaptcha">
          <label>人机验证防爆破</label>
          <div class="captcha-box">
            <span class="math-question">{{ mathQuestion.num1 }} + {{ mathQuestion.num2 }} = ?</span>
            <input type="number" v-model="loginForm.captcha" placeholder="输入计算结果" required />
            <button type="button" class="btn-refresh-captcha" @click="generateCaptcha" title="换一题">🔄</button>
          </div>
        </div>

        <div class="error-msg" v-if="loginError">⚠️ {{ loginError }}</div>

        <button type="submit" class="btn-login" :disabled="isLoggingIn">
          {{ isLoggingIn ? '验证中...' : '接入系统 (ENTER)' }}
        </button>
      </form>
    </div>
  </div>

  <div class="admin-layout" v-else>
    <aside class="sidebar">
      <div class="logo-area">
        <div class="logo-box">745269</div>
        <span class="logo-text">后台管理系统</span>
      </div>

      <nav class="menu-container">
        <div class="menu-group">
          <div class="menu-parent">
            <span class="menu-title">主菜单</span>
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          <div class="sub-menu-list">
            <a href="#" class="sub-item" :class="{ active: activeTab === 'games' }" @click.prevent="activeTab = 'games'">游戏列表</a>
            <a href="#" class="sub-item" :class="{ active: activeTab === 'feedback' }" @click.prevent="activeTab = 'feedback'">游客反馈</a>
            <a href="#" class="sub-item" :class="{ active: activeTab === 'users' }" @click.prevent="activeTab = 'users'">用户列表</a>
            <a href="#" class="sub-item" :class="{ active: activeTab === 'analytics' }" @click.prevent="activeTab = 'analytics'">访问数据</a>
          </div>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <div class="breadcrumb">
          <span class="text-gray">主菜单</span>
          <span class="divider">/</span>
          <span class="text-bold">{{ getTabName(activeTab) }}</span>
        </div>

        <div class="header-actions">
          <div class="search-wrapper" v-if="activeTab === 'games'">
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" v-model="searchInput" @keyup.enter="handleSearch" placeholder="在此处输入中/英文搜索..." class="search-input">
            </div>
            <button class="btn-search" :class="{ 'is-disabled': searchCooldown > 0 }" @click="handleSearch">
              {{ searchCooldown > 0 ? `搜索(${searchCooldown}s)` : '搜索' }}
            </button>
          </div>
          <button class="action-btn logout-btn" @click="gameStore.adminLogout()">🚪 退出系统</button>
        </div>
      </header>

      <div class="workspace">
        <template v-if="activeTab === 'games'">
          <div class="action-bar">
            <button class="btn-upload" @click="openAddModal">上传游戏</button>
          </div>

          <div class="data-card">
            <h2 class="card-title">游戏列表</h2>
            <div class="table-container">
              <div class="table-header">
                <div class="col-game">游戏</div>
                <div class="col-date">上架日期</div>
                <div class="col-platform">平台</div>
                <div class="col-cat">分类</div> 
                <div class="col-disk">网盘资源</div> 
                <div class="col-downloads">真实下载量</div> 
                <div class="col-actions">管理</div>
              </div>

              <div class="table-row" v-for="game in displayedData" :key="game.id">
                <div class="col-game game-info">
                  <img :src="game.cover" class="game-cover" alt="cover">
                  <div class="game-text">
                    <h3>{{ game.nameZh }}</h3>
                    <p>{{ game.nameEn }}</p>
                  </div>
                </div>
                <div class="col-date date-text">{{ game.date }}</div>
                
                <div class="col-platform cat-text">
                  <strong v-for="plat in game.platforms" :key="plat">{{ plat }} </strong>
                  <span v-if="!game.platforms || game.platforms.length === 0" class="empty-text">-</span>
                </div>
                
                <div class="col-cat">
                  <div class="cat-tags-grid">
                    <span v-for="(tag, tIdx) in formatTags(game.tags)" :key="tIdx" class="cat-tag">[{{ tag }}]</span>
                  </div>
                  <span v-if="formatTags(game.tags).length === 0" class="empty-text">-</span>
                </div>

                <div class="col-disk version-disk-list">
                  <div v-for="(versionGroup, idx) in getVersionedDisks(game.id)" :key="idx" class="version-disk-item">
                    <div class="version-label"><span class="dot">•</span>{{ versionGroup.versionLabel }}</div>
                    <div class="disk-tags-small">
                      <span v-for="disk in versionGroup.disks" :key="disk" :class="['disk-tag', getDiskClass(disk)]">[{{ disk }}]</span>
                    </div>
                  </div>
                  <span v-if="getVersionedDisks(game.id).length === 0" class="empty-text">-</span>
                </div>

                <div class="col-downloads download-count-text">{{ game.downloadCount || 0 }} <span class="unit">次</span></div>

                <div class="col-actions btn-group">
                  <button class="btn-modify" @click="openEditModal(game.id)">修改</button>
                  <button class="btn-delete" @click="gameStore.deleteGame(game.id)">下架</button>
                </div>
              </div>

              <div class="load-more-wrapper" v-if="!activeSearchKeyword && gameStore.hasMore && displayedData.length >= 10">
                <button class="btn-load-more" @click="gameStore.fetchGames(true)">
                  {{ gameStore.isLoading ? '加载中...' : '加载更多条目 ⚡' }}
                </button>
              </div>

              <div v-if="gameStore.isLoading && displayedData.length === 0" class="loading-tip">数据同步中...</div>
              <div v-if="!gameStore.isLoading && displayedData.length === 0 && !activeSearchKeyword" class="loading-tip">暂无游戏数据，请点击上方“上传游戏”</div>
            </div>
          </div>
        </template>

        <FeedbackList v-else-if="activeTab === 'feedback'" />
        <UserList v-else-if="activeTab === 'users'" />
        <AccessStats v-else-if="activeTab === 'analytics'" />
      </div>
    </main>

    <GameFormModal :visible="isModalVisible" :gameData="currentEditData" @update:visible="isModalVisible = $event" @submit="handleSave"/>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useGameStore } from '@/store/gameStore'
import GameFormModal from '@/components/admin/GameFormModal.vue' 
import FeedbackList from '@/components/admin/FeedbackList.vue'
import UserList from '@/components/admin/UserList.vue'
import AccessStats from '@/components/admin/AccessStats.vue'

const gameStore = useGameStore()

// ================== 🔐 登录系统逻辑 ==================
const loginForm = ref({ username: '', password: '', captcha: '' })
const loginError = ref('')
const isLoggingIn = ref(false)
const requireCaptcha = ref(false)
const mathQuestion = ref({ num1: 0, num2: 0, answer: 0 })

// 生成随机加法验证码
const generateCaptcha = () => {
  mathQuestion.value.num1 = Math.floor(Math.random() * 10) + 1
  mathQuestion.value.num2 = Math.floor(Math.random() * 10) + 1
  mathQuestion.value.answer = mathQuestion.value.num1 + mathQuestion.value.num2
  loginForm.value.captcha = '' // 清空输入框
}

const handleLogin = async () => {
  // 1. 验证码校验（如果被触发了的话）
  if (requireCaptcha.value) {
    if (parseInt(loginForm.value.captcha) !== mathQuestion.value.answer) {
      loginError.value = "人机验证码计算错误，请重新计算！"
      generateCaptcha()
      return
    }
  }

  isLoggingIn.value = true
  loginError.value = ''

  // 2. 请求服务端验证
  const res = await gameStore.adminLogin(loginForm.value.username, loginForm.value.password)
  
  isLoggingIn.value = false

  if (!res.success) {
    loginError.value = res.error
    // 如果后端说错误次数过多，触发验证码防爆破
    if (res.requireCaptcha) {
      requireCaptcha.value = true
      generateCaptcha()
    }
  } else {
    // 登录成功，重置表单并加载数据
    loginForm.value = { username: '', password: '', captcha: '' }
    requireCaptcha.value = false
    gameStore.fetchGames(false)
  }
}
// ======================================================

const activeTab = ref('games')
const isModalVisible = ref(false)
const currentEditData = ref(null)

const searchInput = ref('')
const activeSearchKeyword = ref('') 
const adminSearchResults = ref([])

const searchCooldown = ref(0)
let cooldownTimer = null

const startCooldown = (secondsRemaining) => {
  searchCooldown.value = secondsRemaining
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    searchCooldown.value--
    if (searchCooldown.value <= 0) {
      clearInterval(cooldownTimer)
      localStorage.removeItem('searchCooldownUntil')
    }
  }, 1000)
}

onMounted(() => {
  // 只有在已登录的情况下，才去拉取数据
  if (gameStore.isAdminLoggedIn) {
    gameStore.fetchGames(false)
  }
  
  const untilTime = localStorage.getItem('searchCooldownUntil')
  if (untilTime) {
    const now = Date.now()
    const remaining = Math.ceil((parseInt(untilTime) - now) / 1000)
    if (remaining > 0) startCooldown(remaining)
    else localStorage.removeItem('searchCooldownUntil')
  }
})

const getTabName = (tab) => {
  const map = { 'games': '游戏列表', 'feedback': '游客反馈', 'users': '用户列表', 'analytics': '访问数据' }
  return map[tab] || '管理面板'
}

const handleSearch = async () => {
  if (searchCooldown.value > 0) {
    alert(`搜索过于频繁，请等待 ${searchCooldown.value} 秒后再试！`)
    return
  }
  activeSearchKeyword.value = searchInput.value
  const until = Date.now() + 10000 
  localStorage.setItem('searchCooldownUntil', until.toString())
  startCooldown(10)

  if (activeSearchKeyword.value) {
    const rawResults = await gameStore.fetchSearchFromServer(activeSearchKeyword.value)
    adminSearchResults.value = rawResults
  } else {
    adminSearchResults.value = []
  }
}

const displayedData = computed(() => {
  if (activeSearchKeyword.value) return gameStore.formatAdminTableData(adminSearchResults.value)
  return gameStore.formatAdminTableData(gameStore.allGames)
})

const openAddModal = () => { currentEditData.value = null; isModalVisible.value = true; }
const openEditModal = (gameId) => {
  const sourceArray = activeSearchKeyword.value ? adminSearchResults.value : gameStore.allGames
  currentEditData.value = sourceArray.find(g => g.id === gameId)
  isModalVisible.value = true        
}

const handleSave = async (formData) => {
  const success = await gameStore.saveGame(formData)
  if (success) alert('游戏数据已成功入库并同步！')
}

const formatTags = (tags) => {
  if (!tags || tags.length === 0) return []
  return tags.join(',').split(/,|，/).map(t => t.trim()).filter(Boolean)
}

const getVersionedDisks = (gameId) => {
  const sourceArray = activeSearchKeyword.value ? adminSearchResults.value : gameStore.allGames
  const target = sourceArray.find(g => g.id === gameId)
  if (!target || !target.downloads) return []
  const result = []
  target.downloads.forEach(dl => {
    const validSources = (dl.sources || []).filter(src => src.name)
    if (validSources.length > 0) {
      const uniqueDisks = Array.from(new Set(validSources.map(src => src.name)))
      const platformName = dl.platform ? dl.platform.toUpperCase() : ''
      const editionName = dl.edition || '通用'
      let label = platformName ? `${platformName} ${editionName}` : editionName
      if (!label.endsWith('版本') && !label.endsWith('版')) label += ' 版本'
      result.push({ versionLabel: label, disks: uniqueDisks })
    }
  })
  return result
}

const getDiskClass = (diskName) => {
  if (diskName.includes('百度')) return 'tag-baidu'
  if (diskName.includes('夸克')) return 'tag-quark'
  if (diskName.includes('阿里')) return 'tag-ali'
  if (diskName.includes('天翼') || diskName.includes('迅雷')) return 'tag-tianyi'
  return 'tag-default'
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

/* ================= 🔐 登录系统专属样式 ================= */
.login-guard-container {
  display: flex; justify-content: center; align-items: center;
  width: 100vw; height: 100vh; background-color: #0f172a;
  background-image: radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent 40%),
                    radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.1), transparent 40%);
}

.login-card {
  background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 48px;
  width: 100%; max-width: 440px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.login-logo { font-size: 32px; font-weight: 900; color: #fff; letter-spacing: 1px; margin-bottom: 8px; }
.glitch-text { color: #2DD4BF; text-shadow: 0 0 15px rgba(45, 212, 191, 0.4); }
.login-subtitle { font-size: 14px; color: #94a3b8; font-weight: 600; margin-bottom: 32px; letter-spacing: 2px; }

.login-form { display: flex; flex-direction: column; gap: 20px; text-align: left; }
.input-group label { display: block; font-size: 13px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px; }
.input-group input { 
  width: 100%; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); 
  color: #fff; padding: 14px 16px; border-radius: 12px; font-size: 15px; transition: 0.2s; outline: none; 
}
.input-group input:focus { border-color: #2DD4BF; box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.15); background: rgba(15, 23, 42, 0.9); }

.captcha-box { display: flex; gap: 12px; }
.math-question { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 0 16px; border-radius: 12px; font-size: 18px; font-weight: 900; display: flex; align-items: center; justify-content: center; min-width: 110px; font-family: monospace; letter-spacing: 2px; }
.btn-refresh-captcha { background: rgba(255, 255, 255, 0.1); border: none; border-radius: 12px; width: 50px; cursor: pointer; font-size: 18px; transition: 0.2s; }
.btn-refresh-captcha:hover { background: rgba(255, 255, 255, 0.2); transform: rotate(180deg); }

.error-msg { font-size: 13px; color: #f43f5e; font-weight: 700; background: rgba(244, 63, 94, 0.1); padding: 10px; border-radius: 8px; text-align: center; border: 1px solid rgba(244, 63, 94, 0.2); }

.btn-login { 
  margin-top: 10px; background: linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%); 
  color: #fff; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 900; 
  cursor: pointer; transition: 0.2s; box-shadow: 0 10px 20px -5px rgba(45, 212, 191, 0.4); 
}
.btn-login:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(45, 212, 191, 0.5); }
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; }


/* ================= 💻 后台原有样式 ================= */
.admin-layout { display: flex; width: 100%; height: 100vh; background-color: var(--bg-admin-body, #F6F8FA); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: var(--text-main, #334155); overflow: hidden; text-align: left !important; }
.sidebar { width: 260px; background-color: var(--bg-card, #FFFFFF); border-right: 1px solid var(--border-light, #F1F5F9); display: flex; flex-direction: column; }
.logo-area { height: 80px; display: flex; align-items: center; padding: 0 24px; gap: 12px; border-bottom: 1px solid var(--border-light, #F1F5F9); }
.logo-box { background-color: var(--text-heading, #1E293B); color: var(--bg-card, #FFFFFF); padding: 4px 8px; border-radius: 6px; font-weight: 900; font-size: 14px; letter-spacing: 1px; }
.logo-text { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; color: var(--text-heading, #0F172A); }
.menu-container { flex: 1; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.menu-group { display: flex; flex-direction: column; }
.menu-parent { display: flex; align-items: center; justify-content: space-between; padding: 10px 24px; color: var(--text-heading, #1E293B); font-weight: 800; font-size: 14px; cursor: pointer; }
.chevron-icon { width: 16px; height: 16px; color: var(--text-light, #94A3B8); }
.sub-menu-list { display: flex; flex-direction: column; margin-top: 4px; }
.sub-item { position: relative; display: flex; align-items: center; padding: 10px 24px 10px 48px; text-decoration: none; color: var(--text-muted, #64748B); font-weight: 600; font-size: 14px; border-radius: 0 100px 100px 0; margin-right: 16px; transition: all 0.2s ease; text-align: left; }
.sub-item::before { content: ''; position: absolute; left: 28px; top: 50%; transform: translateY(-50%); width: 4px; height: 4px; border-radius: 50%; background-color: var(--border-dark, #CBD5E1); transition: all 0.2s; }
.sub-item:hover { color: var(--text-heading, #0F172A); background-color: var(--bg-hover, #F8FAFC); }
.sub-item.active { background-color: rgba(45, 212, 191, 0.1); color: var(--color-admin-primary, #14B8A6); }
.sub-item.active::before { background-color: var(--color-admin-primary, #14B8A6); height: 12px; border-radius: 2px; }

.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.top-header { height: 80px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
.breadcrumb { font-size: 14px; display: flex; gap: 8px; }
.text-gray { color: var(--text-light, #94A3B8); font-weight: 600; }
.divider { color: var(--border-dark, #CBD5E1); }
.text-bold { color: var(--text-heading, #1E293B); font-weight: 800; }
.header-actions { display: flex; align-items: center; gap: 24px; }
.search-wrapper { display: flex; align-items: center; gap: 12px; }
.search-box { position: relative; }
.search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-light, #94A3B8); }
.search-input { width: 220px; height: 40px; padding: 0 16px 0 40px; border: 1px solid var(--border-main, #E2E8F0); border-radius: 100px; background-color: var(--bg-card, #FFFFFF); color: var(--text-main, #334155); font-size: 13px; outline: none; transition: all 0.3s; text-align: left; }
.search-input:focus { border-color: var(--color-admin-primary, #2DD4BF); box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1); width: 260px; }
.btn-search { background-color: var(--text-heading, #1E293B); color: var(--bg-card, #ffffff); border: none; padding: 0 24px; height: 40px; border-radius: 100px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
.btn-search:hover:not(.is-disabled) { background-color: var(--color-admin-primary, #2DD4BF); color: #ffffff; box-shadow: 0 4px 12px -2px rgba(45, 212, 191, 0.4); }
.btn-search.is-disabled { background-color: var(--border-dark, #CBD5E1); color: var(--text-main, #334155); cursor: not-allowed; opacity: 0.8; }

.logout-btn { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.2); padding: 8px 16px; border-radius: 100px; font-weight: 700; transition: 0.2s; cursor: pointer; }
.logout-btn:hover { background: #f43f5e; color: #fff; transform: translateY(-1px); }

.workspace { flex: 1; overflow-y: auto; padding: 0 40px 40px 40px; }
.action-bar { margin-top: 10px; margin-bottom: 30px; display: flex; justify-content: flex-start; }
.btn-upload { background: linear-gradient(135deg, var(--color-admin-primary, #2DD4BF) 0%, var(--color-admin-hover, #34D399) 100%); color: #ffffff; font-size: 16px; font-weight: 800; border: none; padding: 12px 36px; border-radius: 100px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(52, 211, 153, 0.5); transition: all 0.2s ease; }
.btn-upload:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px rgba(52, 211, 153, 0.6); }

.data-card { background-color: var(--bg-card, #FFFFFF); border-radius: 16px; padding: 32px; border: 1px solid var(--border-light, #F1F5F9); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); }
.card-title { font-size: 18px; font-weight: 800; color: var(--text-heading, #1E293B); margin-bottom: 24px; text-align: left; }
.table-container { width: 100%; text-align: left; }
.table-header { display: grid; grid-template-columns: 2fr 1fr 0.8fr 1.2fr 2fr 0.8fr 1fr; padding-bottom: 16px; border-bottom: 1px solid var(--border-light, #F1F5F9); font-size: 12px; font-weight: 800; color: var(--text-light, #94A3B8); }
.table-row { display: grid; grid-template-columns: 2fr 1fr 0.8fr 1.2fr 2fr 0.8fr 1fr; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--bg-hover, #F8FAFC); transition: background-color 0.2s; }
.table-row:hover { background-color: var(--bg-hover, #F8FAFC); }

.col-game, .col-date, .col-platform, .col-cat, .col-disk, .col-downloads { text-align: left; }
.game-info { display: flex; align-items: center; gap: 16px; }
.game-cover { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; background-color: var(--border-light); }
.game-text h3 { font-size: 14px; font-weight: 800; color: var(--text-heading, #1E293B); margin-bottom: 4px; }
.game-text p { font-size: 12px; color: var(--text-light, #94A3B8); font-weight: 600; }
.date-text { font-size: 13px; font-weight: 800; color: var(--text-main, #334155); }
.cat-text strong { font-size: 13px; color: var(--text-main, #334155); display: inline-block; margin-right: 6px; }
.cat-tags-grid { display: grid; grid-template-columns: repeat(3, max-content); gap: 4px 6px; }
.cat-tag { font-size: 12px; color: var(--text-light, #94A3B8); font-weight: 600; white-space: nowrap; }
.empty-text { font-size: 14px; font-weight: 800; color: var(--text-light, #94A3B8); }
.download-count-text { font-size: 15px; font-weight: 800; color: var(--color-admin-primary, #2DD4BF); }
.download-count-text .unit { font-size: 12px; color: var(--text-light, #94A3B8); font-weight: 600; margin-left: 2px; }

.version-disk-list { display: flex; flex-direction: column; gap: 12px; }
.version-disk-item { display: flex; flex-direction: column; gap: 4px; }
.version-label { font-size: 12px; color: var(--text-main, #334155); font-weight: 700; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.version-label .dot { color: var(--color-admin-primary, #2DD4BF); font-size: 14px; font-weight: bold; }
.disk-tags-small { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding-left: 12px; }
.disk-tag { padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 800; white-space: nowrap; }
.tag-baidu { background-color: #EFF6FF; color: #3B82F6; border: 1px solid #BFDBFE; }
.tag-quark { background-color: #FEF2F2; color: #E11D48; border: 1px solid #FECDD3; }
.tag-ali { background-color: #FDF4FF; color: #D946EF; border: 1px solid #FBCFE8; }
.tag-tianyi { background-color: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
.tag-default { background-color: var(--bg-hover); color: var(--text-muted); border: 1px solid var(--border-main); }

.col-actions { text-align: left; }
.btn-group { display: flex; gap: 12px; justify-content: flex-start; }
.btn-group button { padding: 6px 16px; border: none; border-radius: 100px; font-size: 12px; font-weight: 800; color: #FFFFFF; cursor: pointer; transition: all 0.2s; }
.btn-modify { background-color: var(--color-danger, #EF4444); box-shadow: 0 4px 10px -2px rgba(239, 68, 68, 0.3); }
.btn-modify:hover { opacity: 0.9; }
.btn-delete { background-color: var(--color-orange, #F97316); box-shadow: 0 4px 10px -2px rgba(249, 115, 22, 0.3); }
.btn-delete:hover { opacity: 0.9; }

.load-more-wrapper { display: flex; justify-content: center; padding: 30px 0 10px 0; }
.btn-load-more { background: var(--bg-hover, #F8FAFC); border: 1px solid var(--border-dark, #CBD5E1); color: var(--text-main, #334155); padding: 10px 32px; border-radius: 100px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s ease; }
.btn-load-more:hover { background: var(--bg-card, #F1F5F9); border-color: var(--color-admin-primary, #94A3B8); color: var(--color-admin-primary); }

.loading-tip { text-align: center; padding: 40px; color: var(--text-light, #94A3B8); font-weight: 600; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-dark, #CBD5E1); border-radius: 100px; }
</style>