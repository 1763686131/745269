<template>
  <div class="game-manager-container">
    <div class="action-bar">
      <button class="btn-upload" @click="openAddModal">上传游戏</button>
      
      <!-- 🌟 新增：动态丝滑筛选滑块 -->
      <div class="status-slider">
        <!-- 物理背景滑块 -->
        <div class="slider-bg" :class="filterStatus"></div>
        <!-- 三个状态选项 -->
        <button 
          :class="{ active: filterStatus === 'all' }" 
          @click="filterStatus = 'all'"
        >全部</button>
        <button 
          :class="{ active: filterStatus === 'published' }" 
          @click="filterStatus = 'published'"
        >已上架</button>
        <button 
          :class="{ active: filterStatus === 'unpublished' }" 
          @click="filterStatus = 'unpublished'"
        >已下架</button>
      </div>
    </div>

    <div class="data-card">
      <h2 class="card-title">游戏列表</h2>
      <div class="table-header">
        <div class="col-index">序号</div>
        <div class="col-game">游戏</div>
        <div class="col-date">上架日期</div>
        <div class="col-platform">平台</div>
        <div class="col-cat">分类</div> 
        <div class="col-disk">网盘资源</div> 
        <div class="col-downloads">真实下载量</div> 
        <div class="col-actions">管理</div>
      </div>

      <!-- 🌟 核心修改：v-for 改为遍历分页后的数据 paginatedData -->
      <div class="table-row" v-for="(game) in paginatedData" :key="game.id">
        <!-- 🌟 渲染序号 -->
        <div class="col-index">{{ game.id }}</div>
        
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
          <!-- 🌟 双状态上下架按钮 -->
          <button 
            :class="game.isActive ? 'btn-delete' : 'btn-publish'" 
            @click="handleToggleStatus(game.id, game.isActive)"
          >
            {{ game.isActive ? '下架' : '上架' }}
          </button>
        </div>
      </div>
      
      <!-- 🌟 无数据空状态兜底 -->
      <div v-if="paginatedData.length === 0" class="loading-tip">
        暂无符合该状态的游戏数据
      </div>

      <!-- 🌟 引入刚封装的公共分页组件 -->
      <!-- 这里传给总条数的是 displayedData.length (当前筛选条件下的总数) -->
      <Pagination 
        v-model:currentPage="currentPage" 
        :totalItems="displayedData.length" 
        :pageSize="pageSize" 
      />

    </div>
    
    <!-- 游戏表单弹窗 -->
    <GameFormModal :visible="isModalVisible" :gameData="currentEditData" @update:visible="isModalVisible = $event" @submit="handleSave"/>
    
    <ConfirmModal ref="confirmModalRef" :visible="showConfirm" :title="confirmConfig.title" :message="confirmConfig.message" :type="confirmConfig.type" @update:visible="showConfirm = $event" @confirm="executeToggle"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue' // 🌟 引入 watch
import { useGameStore } from '@/store/gameStore'
import GameFormModal from '@/components/admin/GameFormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import Pagination from '@/components/common/Pagination.vue' // 🌟 引入分页组件

// 接收父框架传来的搜索数据
const props = defineProps({
  activeSearchKeyword: { type: String, default: '' },
  adminSearchResults: { type: Array, default: () => [] }
})

// 🌟 新增：分页相关的状态变量
const currentPage = ref(1)
const pageSize = 50 // 默认每页展示50条数据

const showConfirm = ref(false)

const confirmModalRef = ref(null)
const confirmConfig = ref({
  title: '',
  message: '',
  type: 'primary',
  idToProcess: null,     // 记录是哪个数据被点击了
  statusToProcess: null  // 记录是要上架还是下架
})


const gameStore = useGameStore()
const isModalVisible = ref(false)
const currentEditData = ref(null)

// 🌟 新增：状态过滤器标识 ('all', 'published', 'unpublished')
const filterStatus = ref('all')

// 🌟 监听过滤状态或搜索关键词的变化，只要发生变化，就自动切回第一页！
watch([filterStatus, () => props.activeSearchKeyword], () => {
  currentPage.value = 1
})

// 🌟 原始计算属性：带有本地拦截过滤功能的 displayedData (表示所有的满足条件的数据总池)
const displayedData = computed(() => {
  // 1. 确定数据源
  const baseData = props.activeSearchKeyword ? props.adminSearchResults : gameStore.allGames
  
  // 2. 先清洗格式化
  let formattedData = gameStore.formatAdminTableData(baseData)

  // 3. 本地零延迟过滤：拦截未命中状态的数据
  if (filterStatus.value === 'published') {
    formattedData = formattedData.filter(game => game.isActive === true)
  } else if (filterStatus.value === 'unpublished') {
    formattedData = formattedData.filter(game => game.isActive === false)
  }

  return formattedData
})

// 🌟 新增计算属性：本地分页切割引擎 (只取当前页的 50 条去渲染)
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  // 从总的过滤数据中，切出一块当前页需要展示的数据
  return displayedData.value.slice(start, end)
})

const openAddModal = () => { currentEditData.value = null; isModalVisible.value = true; }
const openEditModal = (gameId) => {
  const sourceArray = props.activeSearchKeyword ? props.adminSearchResults : gameStore.allGames
  currentEditData.value = sourceArray.find(g => g.id === gameId)
  isModalVisible.value = true        
}

const handleSave = async (formData) => {
  const isEditMode = !!formData.id
  const success = await gameStore.saveGame(formData)
  if (success) {
    // 🌟 无感顶部 Toast 提示成功，彻底告别浏览器原生 alert！
    confirmModalRef.value?.showToast(
      isEditMode ? '游戏配置已成功修改并同步！' : '新游戏已成功入库并发布！', 
      'success'
    )
  }
}
const formatTags = (tags) => {
  if (!tags || tags.length === 0) return []
  return tags.join(',').split(/,|，/).map(t => t.trim()).filter(Boolean)
}

const getVersionedDisks = (gameId) => {
  const sourceArray = props.activeSearchKeyword ? props.adminSearchResults : gameStore.allGames
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

// 🌟 2. 覆盖你原来的：现在点击按钮，只负责“唤起弹窗”并传入数据
const handleToggleStatus = (id, currentStatus) => {
  const newStatus = currentStatus ? 0 : 1; 
  const actionName = newStatus === 1 ? '上架' : '下架';
  
  confirmConfig.value = {
    title: `${actionName}确认`,
    message: `确定要将该游戏【${actionName}】吗？`,
    type: newStatus === 1 ? 'primary' : 'danger', // 上架用蓝绿主题，下架用红色警告主题
    idToProcess: id,
    statusToProcess: newStatus
  }
  showConfirm.value = true // 弹出组件！
}

// 🌟 3. 新增：当在弹窗里点击“确定”时，真正执行后端的请求
const executeToggle = async () => {
  const { idToProcess, statusToProcess } = confirmConfig.value;
  const actionName = statusToProcess === 1 ? '上架' : '下架';

  const success = await gameStore.toggleGameStatus(idToProcess, statusToProcess);
  if (success) {
    // 🌟 直接调用组件里的 showToast 方法！
    // 第一个参数是文字，第二个参数是颜色风格 ('success' 或 'danger')
    confirmModalRef.value.showToast(`操作成功，该游戏已${actionName}！`, statusToProcess === 1 ? 'success' : 'danger');
  }
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
/* 样式保留你原本的写法，不需要任何变动 */
.game-manager-container { width: 100%; }

.action-bar { 
  margin-top: 10px; 
  margin-bottom: 30px; 
  display: flex; 
  justify-content: flex-start; 
  align-items: center; 
  gap: 24px; 
}

.btn-upload { background: linear-gradient(135deg, var(--color-admin-primary, #2DD4BF) 0%, var(--color-admin-hover, #34D399) 100%); color: #ffffff; font-size: 16px; font-weight: 800; border: none; padding: 12px 36px; border-radius: 100px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(52, 211, 153, 0.5); transition: all 0.2s ease; }
.btn-upload:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px rgba(52, 211, 153, 0.6); }

.status-slider {
  position: relative;
  display: inline-flex;
  background-color: var(--bg-hover, #F1F5F9);
  border-radius: 100px;
  padding: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}

.status-slider button {
  position: relative;
  z-index: 2;
  background: transparent;
  border: none;
  width: 90px;
  height: 36px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-light, #94A3B8);
  cursor: pointer;
  transition: color 0.3s ease;
}

.status-slider button.active {
  color: var(--color-admin-primary, #10B981);
}

.slider-bg {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 90px;
  height: 36px;
  background-color: var(--bg-card, #FFFFFF);
  border-radius: 100px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

.slider-bg.all { transform: translateX(0); }
.slider-bg.published { transform: translateX(90px); }
.slider-bg.unpublished { transform: translateX(180px); }

.data-card { background-color: var(--bg-card, #FFFFFF); border-radius: 16px; padding: 32px; border: 1px solid var(--border-light, #F1F5F9); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); }
.card-title { font-size: 18px; font-weight: 800; color: var(--text-heading, #1E293B); margin-bottom: 24px; text-align: left; }
.table-container { width: 100%; text-align: left; }
.table-header { display: grid; grid-template-columns: 0.5fr 2fr 1fr 0.8fr 1.2fr 2fr 0.8fr 1fr; padding-bottom: 16px; border-bottom: 1px solid var(--border-light, #F1F5F9); font-size: 12px; font-weight: 800; color: var(--text-light, #94A3B8); }
.table-row { display: grid; grid-template-columns: 0.5fr 2fr 1fr 0.8fr 1.2fr 2fr 0.8fr 1fr; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--bg-hover, #F8FAFC); transition: background-color 0.2s; }

.table-row:hover { background-color: var(--bg-hover, #F8FAFC); }
.col-index { text-align: left; font-size: 14px; font-weight: 800; color: var(--text-light, #94A3B8); padding-left: 8px; }

.btn-publish { background-color: var(--color-admin-primary, #10B981); box-shadow: 0 4px 10px -2px rgba(16, 185, 129, 0.3); }
.btn-publish:hover { opacity: 0.9; }

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
</style>