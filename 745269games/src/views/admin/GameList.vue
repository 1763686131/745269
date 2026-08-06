<template>
  
  <div class="admin-layout">
    
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
            <a href="#" class="sub-item active">游戏列表</a>
            <a href="#" class="sub-item">用户列表</a>
            <a href="#" class="sub-item">访问数据</a>
            <a href="#" class="sub-item">下载次数</a>
          </div>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      
      <header class="top-header">
        <div class="breadcrumb">
          <span class="text-gray">主菜单</span>
          <span class="divider">/</span>
          <span class="text-bold">游戏列表</span>
        </div>

        <div class="header-actions">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="在此处输入..." class="search-input">
          </div>
          <button class="action-btn login-btn">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            登录
          </button>
          <button class="action-btn">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button class="action-btn">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </div>
      </header>

      <div class="workspace">
        <div class="action-bar">
          <button class="btn-upload" @click="openAddModal">上传游戏</button>
        </div>

        <div class="data-card">
          <h2 class="card-title">游戏列表</h2>

          <div class="table-container">
            <div class="table-header">
              <div class="col-game">游戏</div>
              <div class="col-date">上架日期</div>
              <div class="col-cat">平台/分类</div>
              <div class="col-downloads">下载量</div>
              <div class="col-actions">管理</div>
            </div>

            <div 
              class="table-row" 
              v-for="game in gameStore.adminTableData" 
              :key="game.id"
            >
              <div class="col-game game-info">
                <img :src="game.cover" class="game-cover" alt="cover">
                <div class="game-text">
                  <h3>{{ game.nameZh }}</h3>
                  <p>{{ game.nameEn }}</p>
                </div>
              </div>
              <div class="col-date date-text">{{ game.date }}</div>
              <div class="col-cat cat-text">
                <strong v-for="plat in game.platforms" :key="plat">{{ plat }} </strong>
                <p><span v-for="tag in game.tags" :key="tag">[{{ tag }}] </span></p>
              </div>
              <div class="col-downloads empty-text">{{ game.downloads || '-' }}</div>
              <div class="col-actions btn-group">
                <button class="btn-modify" @click="openEditModal(game.id)">修改</button>
                <button class="btn-delete" @click="gameStore.deleteGame(game.id)">下架</button>
              </div>
            </div>

            <div v-if="gameStore.isLoading" class="loading-tip">数据加载中...</div>
          </div>
        </div>
      </div>
      <!-- 游戏表单弹窗 -->
      <GameFormModal :visible="isModalVisible" :gameData="currentEditData" @update:visible="val => isModalVisible = val" @submit="handleSave"/>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue' // 补充引入 ref
import { useGameStore } from '@/store/gameStore'
import GameFormModal from '@/components/admin/GameFormModal.vue' // 👈 引入表单组件

const gameStore = useGameStore()

// 控制弹窗显示隐藏
const isModalVisible = ref(false)
// 传入弹窗的当前编辑数据 (null 代表新增)
const currentEditData = ref(null)

onMounted(() => {
  gameStore.fetchGames()
})

// 点击“上传游戏”按钮
const openAddModal = () => {
  currentEditData.value = null // 清空数据，进入新增模式
  isModalVisible.value = true
}

// 点击表格中的“修改”按钮
const openEditModal = (gameId) => {
  // 从原始数据源中找到完整结构
  const targetGame = gameStore.allGames.find(g => g.id === gameId)
  currentEditData.value = targetGame // 传入数据，进入修改模式
  isModalVisible.value = true
}

// 弹窗点击保存
const handleSave = (formData) => {
  gameStore.saveGame(formData) // 调用 Store 的保存方法
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.admin-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: var(--bg-admin-body, #F6F8FA); 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-main, #334155);
  overflow: hidden;
  text-align: left !important; 
}

/* ================= 左侧导航栏 ================= */
.sidebar {
  width: 260px;
  background-color: var(--bg-card, #FFFFFF);
  border-right: 1px solid var(--border-light, #F1F5F9);
  display: flex;
  flex-direction: column;
}

.logo-area {
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 12px;
}

.logo-box {
  background-color: var(--text-heading, #1E293B);
  color: var(--text-white, #FFFFFF);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 1px;
}

.logo-text {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--text-heading, #0F172A);
}

.menu-container {
  flex: 1;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.menu-group {
  display: flex;
  flex-direction: column;
}

.menu-parent {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  color: var(--text-heading, #1E293B);
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: var(--text-light, #94A3B8);
}

.sub-menu-list {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
}

.sub-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 24px 10px 48px;
  text-decoration: none;
  color: var(--text-muted, #64748B);
  font-weight: 600;
  font-size: 14px;
  border-radius: 0 100px 100px 0;
  margin-right: 16px;
  transition: all 0.2s ease;
  text-align: left;
}

.sub-item::before {
  content: '';
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--border-dark, #CBD5E1);
  transition: all 0.2s;
}

.sub-item:hover {
  color: var(--text-heading, #0F172A);
  background-color: var(--bg-hover, #F8FAFC);
}

.sub-item.active {
  background-color: #E6FFF9; 
  color: var(--color-admin-primary, #14B8A6); 
}

.sub-item.active::before {
  background-color: var(--color-admin-primary, #14B8A6);
  height: 12px;
  border-radius: 2px;
}

/* ================= 右侧主区域 ================= */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部 Header */
.top-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
}

.breadcrumb {
  font-size: 14px;
  display: flex;
  gap: 8px;
}
.text-gray { color: var(--text-light, #94A3B8); font-weight: 600; }
.divider { color: var(--border-dark, #CBD5E1); }
.text-bold { color: var(--text-heading, #1E293B); font-weight: 800; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.search-box {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-light, #94A3B8);
}
.search-input {
  width: 260px;
  height: 40px;
  padding: 0 16px 0 40px;
  border: 1px solid var(--border-main, #E2E8F0);
  border-radius: 100px;
  background-color: var(--bg-card, #FFFFFF);
  font-size: 13px;
  outline: none;
  transition: all 0.3s;
  text-align: left;
}
.search-input:focus {
  border-color: var(--color-admin-primary, #2DD4BF);
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #64748B);
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.action-btn:hover { color: var(--text-heading, #1E293B); }
.login-btn { font-size: 14px; font-weight: 600; }
.icon-svg {
  width: 20px;
  height: 20px;
}

/* 核心工作区 */
.workspace {
  flex: 1;
  overflow-y: auto;
  padding: 0 40px 40px 40px;
}

.action-bar {
  margin-top: 10px;
  margin-bottom: 30px;
  display: flex;
  justify-content: flex-start;
}
.btn-upload {
  background: linear-gradient(135deg, var(--color-admin-primary, #2DD4BF) 0%, var(--color-admin-hover, #34D399) 100%);
  color: var(--text-white, #FFFFFF);
  font-size: 16px;
  font-weight: 800;
  border: none;
  padding: 12px 36px;
  border-radius: 100px;
  cursor: pointer;
  box-shadow: 0 8px 20px -6px rgba(52, 211, 153, 0.5);
  transition: all 0.2s ease;
}
.btn-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -6px rgba(52, 211, 153, 0.6);
}

.data-card {
  background-color: var(--bg-card, #FFFFFF);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid var(--border-light, #F1F5F9);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.card-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-heading, #1E293B);
  margin-bottom: 24px;
  text-align: left;
}

/* 表格布局 */
.table-container { width: 100%; text-align: left; }

.table-header {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1.5fr 1fr 1.5fr;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light, #F1F5F9);
  font-size: 12px;
  font-weight: 800;
  color: var(--text-light, #94A3B8);
}

.table-row {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1.5fr 1fr 1.5fr;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--bg-hover, #F8FAFC);
  transition: background-color 0.2s;
}
.table-row:hover {
  background-color: var(--bg-hover, #F8FAFC);
}

.col-game, .col-date, .col-cat, .col-downloads {
  text-align: left;
}

.game-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.game-cover {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}
.game-text h3 {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-heading, #1E293B);
  margin-bottom: 4px;
}
.game-text p {
  font-size: 12px;
  color: var(--text-light, #94A3B8);
  font-weight: 600;
}

.date-text { font-size: 13px; font-weight: 800; color: var(--text-main, #334155); }
.cat-text strong { font-size: 13px; color: var(--text-main, #334155); display: inline-block; margin-right: 6px; }
.cat-text p { font-size: 12px; color: var(--text-light, #94A3B8); font-weight: 600; }
.empty-text { font-size: 14px; font-weight: 800; color: var(--text-light, #94A3B8); }

.col-actions { text-align: left; }
.btn-group {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
}
.btn-group button {
  padding: 6px 16px;
  border: none;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-white, #FFFFFF);
  cursor: pointer;
  transition: all 0.2s;
}
.btn-modify {
  background-color: var(--color-danger, #EF4444); 
  box-shadow: 0 4px 10px -2px rgba(239, 68, 68, 0.3);
}
.btn-modify:hover { opacity: 0.9; }

.btn-delete {
  background-color: var(--color-orange, #F97316); 
  box-shadow: 0 4px 10px -2px rgba(249, 115, 22, 0.3);
}
.btn-delete:hover { opacity: 0.9; }

.loading-tip {
  text-align: center;
  padding: 20px;
  color: var(--text-light, #94A3B8);
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-dark, #CBD5E1); border-radius: 100px; }
</style>