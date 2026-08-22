<template>
  <div class="login-guard-container" v-if="!gameStore.isAdminLoggedIn">
    <!-- 登录模块完全保留，未作修改 -->
    <div class="login-card">
      <div class="login-logo"><span class="glitch-text">745269</span> CMS</div>
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
          <button @click="toggleTheme" class="theme-toggle-btn" title="切换主题">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.38 3.46 16 2a8.5 8.5 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </button>
          <button class="action-btn logout-btn" @click="gameStore.adminLogout()">🚪 退出系统</button>
        </div>
      </header>

      <div class="workspace">
        <!-- 💡 核心改造：引入你刚刚抽离的 GameManager 组件 -->
        <GameManager 
          v-if="activeTab === 'games'" 
          :activeSearchKeyword="activeSearchKeyword"
          :adminSearchResults="adminSearchResults"
        />

        <FeedbackList v-else-if="activeTab === 'feedback'" />
        <UserList v-else-if="activeTab === 'users'" />
        <AccessStats v-else-if="activeTab === 'analytics'" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useGameStore } from '@/store/gameStore'
import GameManager from '@/components/admin/GameManager.vue' 
import FeedbackList from '@/components/admin/FeedbackList.vue'
import UserList from '@/components/admin/UserList.vue'
import AccessStats from '@/components/admin/AccessStats.vue'

const gameStore = useGameStore()
const activeTab = ref('games')

// ================== 🌗 主题切换逻辑 (从前台首页移植而来) ==================
const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('745269_theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('745269_theme', 'light')
  }
}
// ======================================================

// ================== 🔐 登录系统逻辑 (未作修改) ==================
const loginForm = ref({ username: '', password: '', captcha: '' })
const loginError = ref('')
const isLoggingIn = ref(false)
const requireCaptcha = ref(false)
const mathQuestion = ref({ num1: 0, num2: 0, answer: 0 })

const generateCaptcha = () => {
  mathQuestion.value.num1 = Math.floor(Math.random() * 10) + 1
  mathQuestion.value.num2 = Math.floor(Math.random() * 10) + 1
  mathQuestion.value.answer = mathQuestion.value.num1 + mathQuestion.value.num2
  loginForm.value.captcha = '' 
}

const handleLogin = async () => {
  if (requireCaptcha.value) {
    if (parseInt(loginForm.value.captcha) !== mathQuestion.value.answer) {
      loginError.value = "人机验证码计算错误，请重新计算！"
      generateCaptcha()
      return
    }
  }
  isLoggingIn.value = true
  loginError.value = ''
  const res = await gameStore.adminLogin(loginForm.value.username, loginForm.value.password)
  isLoggingIn.value = false

  if (!res.success) {
    loginError.value = res.error
    if (res.requireCaptcha) {
      requireCaptcha.value = true
      generateCaptcha()
    }
  } else {
    loginForm.value = { username: '', password: '', captcha: '' }
    requireCaptcha.value = false
    gameStore.fetchGames(false)
  }
}
// ======================================================

// 搜索栏逻辑 (保留在父框架内控制，传递数据给 GameManager)
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
  if (gameStore.isAdminLoggedIn) gameStore.fetchGames(false)

  const savedTheme = localStorage.getItem('745269_theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
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
</script>

<style scoped>
/* 这里只保留登录和后台布局大框架的 CSS，干干净净！ */
* { box-sizing: border-box; margin: 0; padding: 0; }

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
.input-group input { width: 100%; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 14px 16px; border-radius: 12px; font-size: 15px; transition: 0.2s; outline: none; }
.input-group input:focus { border-color: #2DD4BF; box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.15); background: rgba(15, 23, 42, 0.9); }
.captcha-box { display: flex; gap: 12px; }
.math-question { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 0 16px; border-radius: 12px; font-size: 18px; font-weight: 900; display: flex; align-items: center; justify-content: center; min-width: 110px; font-family: monospace; letter-spacing: 2px; }
.btn-refresh-captcha { background: rgba(255, 255, 255, 0.1); border: none; border-radius: 12px; width: 50px; cursor: pointer; font-size: 18px; transition: 0.2s; }
.btn-refresh-captcha:hover { background: rgba(255, 255, 255, 0.2); transform: rotate(180deg); }
.error-msg { font-size: 13px; color: #f43f5e; font-weight: 700; background: rgba(244, 63, 94, 0.1); padding: 10px; border-radius: 8px; text-align: center; border: 1px solid rgba(244, 63, 94, 0.2); }
.btn-login { margin-top: 10px; background: linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%); color: #fff; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 900; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 20px -5px rgba(45, 212, 191, 0.4); }
.btn-login:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(45, 212, 191, 0.5); }
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

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
.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: transparent;
  color: var(--text-muted, #64748B);
  border: 2px solid var(--border-main, #E2E8F0);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}
.theme-toggle-btn:hover {
  color: var(--color-admin-primary, #2DD4BF);
  border-color: var(--color-admin-primary, #2DD4BF);
  background-color: var(--bg-hover, #F8FAFC);
  transform: scale(1.05);
}

.logout-btn { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.2); padding: 8px 16px; border-radius: 100px; font-weight: 700; transition: 0.2s; cursor: pointer; }
.logout-btn:hover { background: #f43f5e; color: #fff; transform: translateY(-1px); }

.workspace { flex: 1; overflow-y: auto; padding: 0 40px 40px 40px; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-dark, #CBD5E1); border-radius: 100px; }
</style>