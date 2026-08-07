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
            <input type="text" placeholder="在此处搜索游戏..." class="search-input">
          </div>
          <button class="action-btn login-btn">管理账号</button>
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

            <div v-if="gameStore.isLoading" class="loading-tip">数据同步中...</div>
            <div v-if="!gameStore.isLoading && gameStore.adminTableData.length === 0" class="loading-tip">暂无游戏数据，请点击上方“上传游戏”</div>
          </div>
        </div>
      </div>

    </main>

    <GameFormModal :visible="isModalVisible" :gameData="currentEditData" @update:visible="val => isModalVisible = val" @submit="handleSave"/>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useGameStore } from '@/store/gameStore'
import GameFormModal from '@/components/admin/GameFormModal.vue' 

const gameStore = useGameStore()

// 控制弹窗的显示隐藏
const isModalVisible = ref(false)
// 当前编辑的数据（null 表示处于新增模式）
const currentEditData = ref(null)

// 页面挂载时拉取服务端最新数据
onMounted(() => {
  gameStore.fetchGames()
})

// 1. 打开新增弹窗
const openAddModal = () => {
  console.log("👉 触发了上传游戏按钮，准备打开弹窗！")
  currentEditData.value = null 
  isModalVisible.value = true  
}

// 2. 打开修改弹窗
const openEditModal = (gameId) => {
  console.log("👉 触发了修改游戏按钮，准备修改 ID:", gameId)
  const targetGame = gameStore.allGames.find(g => g.id === gameId)
  currentEditData.value = targetGame 
  isModalVisible.value = true        
}

// 3. 监听弹窗内部点击“确认保存”抛出的事件
const handleSave = async (formData) => {
  console.log("👉 接收到了弹窗传来的数据，准备提交给服务端：", formData)
  const success = await gameStore.saveGame(formData)
  if (success) {
    alert('游戏数据已成功入库并同步！')
  }
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
  background-color: var(--border-light);
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
  padding: 40px;
  color: var(--text-light, #94A3B8);
  font-weight: 600;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-dark, #CBD5E1); border-radius: 100px; }
</style>