<template>
  <div class="admin-layout">
    <main class="main-content">
      <div class="workspace">
        <div class="action-bar">
          <button class="btn-upload">上传游戏</button>
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
              <div class="col-downloads empty-text">{{ game.downloads }}</div>
              <div class="col-actions btn-group">
                <button class="btn-modify">修改</button>
                <button class="btn-delete" @click="gameStore.deleteGame(game.id)">下架</button>
              </div>
            </div>

            <div v-if="gameStore.isLoading" style="text-align:center; padding: 20px;">数据加载中...</div>

          </div>
        </div>
      </div>
    </main>
  </div>
</template>


<script setup>
import { onMounted } from 'vue'
import { useGameStore } from '@/store/gameStore' // 引入你的 store

// 实例化 store
const gameStore = useGameStore()

// 页面挂载时，触发获取数据的方法
onMounted(() => {
  gameStore.fetchGames()
})
</script>

<style scoped>
/* 🌟 核心优化：全部替换为主题变量 */
.admin-layout {
  background-color: var(--bg-admin-body); 
  color: var(--text-main);
}
.sidebar {
  background-color: var(--bg-card);
  border-right: 1px solid var(--border-light);
}
.sub-item.active {
  background-color: #E6FFF9; /* 可以提炼到变量 */
  color: var(--color-admin-primary); 
}
.btn-upload {
  background: linear-gradient(135deg, var(--color-admin-primary) 0%, var(--color-admin-hover) 100%);
  color: var(--text-white);
}
.table-header {
  border-bottom: 1px solid var(--border-light);
  color: var(--text-light);
}
.table-row:hover {
  background-color: var(--bg-hover);
}
.game-text h3 {
  color: var(--text-heading);
}
.game-text p {
  color: var(--text-light);
}
.btn-modify {
  background-color: var(--color-danger); 
}
.btn-delete {
  background-color: var(--color-orange); 
}
/* 其他样式保持之前的布局逻辑即可... */

/* ================= 全局重置与基础变量 ================= */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.admin-layout {
  display: flex;
  height: 100vh;
  background-color: #F6F8FA; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #334155;
  overflow: hidden;
  
  /* 💡 核心修复：强行覆盖 Vue/Vite 默认的居中样式，绝对靠左！ */
  text-align: left !important; 
}

/* ================= 左侧导航栏 ================= */
.sidebar {
  width: 260px;
  background-color: #FFFFFF;
  border-right: 1px solid #F1F5F9;
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
  background-color: #1E293B;
  color: #FFFFFF;
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
  color: #0F172A;
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
  color: #1E293B;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: #94A3B8;
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
  color: #64748B;
  font-weight: 600;
  font-size: 14px;
  border-radius: 0 100px 100px 0;
  margin-right: 16px;
  transition: all 0.2s ease;
  text-align: left; /* 菜单项绝对靠左 */
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
  background-color: #CBD5E1;
  transition: all 0.2s;
}

.sub-item:hover {
  color: #0F172A;
  background-color: #F8FAFC;
}

.sub-item.active {
  background-color: #E6FFF9; 
  color: #14B8A6; 
}

.sub-item.active::before {
  background-color: #14B8A6;
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

/* --- 顶部 Header --- */
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
.text-gray { color: #94A3B8; font-weight: 600; }
.divider { color: #CBD5E1; }
.text-bold { color: #1E293B; font-weight: 800; }

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
  color: #94A3B8;
}
.search-input {
  width: 260px;
  height: 40px;
  padding: 0 16px 0 40px;
  border: 1px solid #E2E8F0;
  border-radius: 100px;
  background-color: #FFFFFF;
  font-size: 13px;
  outline: none;
  transition: all 0.3s;
  text-align: left;
}
.search-input:focus {
  border-color: #2DD4BF;
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748B;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.action-btn:hover { color: #1E293B; }
.login-btn { font-size: 14px; font-weight: 600; }
.icon-svg {
  width: 20px;
  height: 20px;
}

/* --- 核心工作区 --- */
.workspace {
  flex: 1;
  overflow-y: auto;
  padding: 0 40px 40px 40px;
}

/* 💡 核心修复：上传按钮区域，强制使用 flex 并靠左贴齐 */
.action-bar {
  margin-top: 10px;
  margin-bottom: 30px;
  display: flex;
  justify-content: flex-start; /* 强制紧贴左边 */
}
.btn-upload {
  background: linear-gradient(135deg, #2DD4BF 0%, #34D399 100%);
  color: #FFFFFF;
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
.btn-upload:active {
  transform: scale(0.97);
}

/* 数据卡片与表格 */
.data-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #F1F5F9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.card-title {
  font-size: 18px;
  font-weight: 800;
  color: #1E293B;
  margin-bottom: 24px;
  text-align: left; /* 💡 标题绝对靠左 */
}

/* CSS Grid 表格布局 */
.table-container { width: 100%; text-align: left; }

.table-header {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1.5fr 2fr 1fr 1.5fr;
  padding-bottom: 16px;
  border-bottom: 1px solid #F1F5F9;
  font-size: 12px;
  font-weight: 800;
  color: #94A3B8;
}

.table-row {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1.5fr 2fr 1fr 1.5fr;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #F8FAFC;
  transition: background-color 0.2s;
}
.table-row:hover {
  background-color: #F8FAFC;
}

/* 单元格内容全部靠左，除了管理按钮组 */
.col-game, .col-date, .col-cat, .col-links, .col-downloads {
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
  color: #1E293B;
  margin-bottom: 4px;
}
.game-text p {
  font-size: 12px;
  color: #94A3B8;
  font-weight: 600;
}

.date-text { font-size: 13px; font-weight: 800; color: #334155; }
.cat-text strong { font-size: 13px; color: #334155; display: block; margin-bottom: 4px; }
.cat-text p { font-size: 12px; color: #94A3B8; font-weight: 600; }
.empty-text { font-size: 14px; font-weight: 800; color: #94A3B8; }

/* 标签靠左排列 */
.tags {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
}
.tag {
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 800;
}
.tag-blue { background-color: #EFF6FF; color: #3B82F6; }
.tag-green { background-color: #ECFDF5; color: #10B981; }
.tag-red { background-color: #FFF1F2; color: #F43F5E; }

/* 操作按钮组 (这里可以保持居中或靠左，目前设为靠左贴齐) */
.col-actions { text-align: left; }
.btn-group {
  display: flex;
  gap: 12px;
  justify-content: flex-start; /* 💡 修复：右侧按钮组也完全靠左排开 */
}
.btn-group button {
  padding: 6px 16px;
  border: none;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 800;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-modify {
  background-color: #EF4444; 
  box-shadow: 0 4px 10px -2px rgba(239, 68, 68, 0.3);
}
.btn-modify:hover { background-color: #DC2626; }

.btn-delete {
  background-color: #F97316; 
  box-shadow: 0 4px 10px -2px rgba(249, 115, 22, 0.3);
}
.btn-delete:hover { background-color: #EA580C; }

/* 全局滚动条美化 */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 100px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
</style>