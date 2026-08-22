<template>
  <div class="game-manager-container">
    <div class="action-bar">
      <button class="btn-upload" @click="openAddModal">上传游戏</button>
      
      <!-- 🌟 平台赛选滑块 -->
      <div class="platform-slider">
        <div class="slider-bg" :class="filterPlatform.toLowerCase()"></div>
        <button :class="{ active: filterPlatform === 'all' }" @click="filterPlatform = 'all'">全平台</button>
        <button :class="{ active: filterPlatform === 'Switch' }" @click="filterPlatform = 'Switch'">Switch</button>
        <button :class="{ active: filterPlatform === 'PC' }" @click="filterPlatform = 'PC'">PC</button>
        <button :class="{ active: filterPlatform === 'PS4' }" @click="filterPlatform = 'PS4'">PS4</button>
        <button :class="{ active: filterPlatform === 'PS5' }" @click="filterPlatform = 'PS5'">PS5</button>
      </div>

      <!-- 🌟 上下架状态筛选滑块 -->
      <div class="status-slider">
        <div class="slider-bg" :class="filterStatus"></div>
        <button :class="{ active: filterStatus === 'all' }" @click="filterStatus = 'all'">全部</button>
        <button :class="{ active: filterStatus === 'published' }" @click="filterStatus = 'published'">已上架</button>
        <button :class="{ active: filterStatus === 'unpublished' }" @click="filterStatus = 'unpublished'">已下架</button>
      </div>

    <!-- 🌟 新增：今日工作量统计面板 (滑块同款UI) -->
      <div class="daily-op-counter" title="记录今日上传/修改数量，过12点自动清零，同一游戏重复修改不叠加">
        <span class="op-label">今日进度</span>
        <div class="op-value-bg">
          <span class="op-number">{{ dailyOpCount }}</span>
          <span class="op-unit">项</span>
        </div>
      </div>
    </div>

    <div class="data-card">
      <h2 class="card-title">游戏列表</h2>

      <div v-if="gameStore.isLoading && gameStore.allGames.length === 0" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">游戏数据量较大，正在努力加载中，请稍候...</p>
      </div>

      <template v-else>
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

        <div class="table-row" v-for="(game) in paginatedData" :key="game.id">
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
            <button
              :class="game.isActive ? 'btn-delete' : 'btn-publish'"
              @click="handleToggleStatus(game.id, game.isActive)"
            >
              {{ game.isActive ? '下架' : '上架' }}
            </button>
          </div>
        </div>

        <div v-if="paginatedData.length === 0" class="loading-tip">
          暂无符合该多重筛选条件的游戏数据
        </div>

        <Pagination
          v-model:currentPage="currentPage"
          :totalItems="displayedData.length"
          :pageSize="pageSize"
        />
      </template>

    </div>
    
    <GameFormModal :visible="isModalVisible" :gameData="currentEditData" @update:visible="isModalVisible = $event" @submit="handleSave"/>
    
    <ConfirmModal ref="confirmModalRef" :visible="showConfirm" :title="confirmConfig.title" :message="confirmConfig.message" :type="confirmConfig.type" @update:visible="showConfirm = $event" @confirm="executeToggle" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue' // 🌟 引入 onMounted
import { useGameStore } from '@/store/gameStore'
import GameFormModal from '@/components/admin/GameFormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import Pagination from '@/components/common/Pagination.vue'

const props = defineProps({
  activeSearchKeyword: { type: String, default: '' },
  adminSearchResults: { type: Array, default: () => [] }
})

const currentPage = ref(1)
const pageSize = 50 

const showConfirm = ref(false)
const confirmModalRef = ref(null)
const confirmConfig = ref({
  title: '',
  message: '',
  type: 'primary',
  idToProcess: null,
  statusToProcess: null
})

const gameStore = useGameStore()
const isModalVisible = ref(false)
const currentEditData = ref(null)

const filterStatus = ref('all')
const filterPlatform = ref('all') 

// ==========================================
// 🌟 新增核心：今日工作量统计引擎 (纯本地)
// ==========================================
const dailyOpCount = ref(0)
let processedIds = [] // 存放在内存里的去重 ID 数组

// 校验是否过12点并初始化数据
const checkAndResetDailyCounter = () => {
  const today = new Date().toLocaleDateString() // 格式如：2026/8/19
  const stored = JSON.parse(localStorage.getItem('admin_daily_op') || '{}')
  
  // 核心：如果存储的日期不是今天，代表过了晚上 12 点，立刻重置清空！
  if (stored.date !== today) {
    processedIds = []
    localStorage.setItem('admin_daily_op', JSON.stringify({ date: today, ids: [] }))
    dailyOpCount.value = 0
  } else {
    processedIds = stored.ids || []
    dailyOpCount.value = processedIds.length
  }
}

// 记录一次成功操作
const recordDailyOp = (gameId) => {
  checkAndResetDailyCounter() // 每次记录前都防御性检查一次是否跨天了
  
  // 去重逻辑：如果这个游戏 ID 之前没被记录过，才计入
  if (!processedIds.includes(gameId)) {
    processedIds.push(gameId)
    const today = new Date().toLocaleDateString()
    localStorage.setItem('admin_daily_op', JSON.stringify({ date: today, ids: processedIds }))
    dailyOpCount.value = processedIds.length
  }
}

// 页面一加载就校验展示
onMounted(() => {
  checkAndResetDailyCounter()
})
// ==========================================

watch([filterStatus, filterPlatform, () => props.activeSearchKeyword], () => {
  currentPage.value = 1
})

const displayedData = computed(() => {
  const baseData = props.activeSearchKeyword ? props.adminSearchResults : gameStore.allGames
  let formattedData = gameStore.formatAdminTableData(baseData)

  if (filterPlatform.value !== 'all') {
    formattedData = formattedData.filter(game => {
      const pTags = game.platforms || []
      return pTags.some(tag => tag.toUpperCase().includes(filterPlatform.value.toUpperCase()))
    })
  }

  if (filterStatus.value === 'published') {
    formattedData = formattedData.filter(game => game.isActive === true)
  } else if (filterStatus.value === 'unpublished') {
    formattedData = formattedData.filter(game => game.isActive === false)
  }

  return formattedData
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return displayedData.value.slice(start, end)
})

const openAddModal = () => { currentEditData.value = null; isModalVisible.value = true; }
const openEditModal = (gameId) => {
  const sourceArray = props.activeSearchKeyword ? props.adminSearchResults : gameStore.allGames
  currentEditData.value = sourceArray.find(g => g.id === gameId)
  isModalVisible.value = true        
}

// 🌟 这里触发成功后的计数！
const handleSave = async (formData) => {
  const isEditMode = !!formData.id
  const success = await gameStore.saveGame(formData)
  
  if (success) {
    // 🌟 记录到本地存储计数器中 (如果是新上传没有ID，就给它生成一个随机唯一标记记录进去)
    const uniqueId = formData.id || `upload_${Date.now()}`
    recordDailyOp(uniqueId)

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

const handleToggleStatus = (id, currentStatus) => {
  const newStatus = currentStatus ? 0 : 1; 
  const actionName = newStatus === 1 ? '上架' : '下架';
  
  confirmConfig.value = {
    title: `${actionName}确认`,
    message: `确定要将该游戏【${actionName}】吗？`,
    type: newStatus === 1 ? 'primary' : 'danger',
    idToProcess: id,
    statusToProcess: newStatus
  }
  showConfirm.value = true 
}

const executeToggle = async () => {
  const { idToProcess, statusToProcess } = confirmConfig.value;
  const actionName = statusToProcess === 1 ? '上架' : '下架';

  const success = await gameStore.toggleGameStatus(idToProcess, statusToProcess);
  if (success) {
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
.game-manager-container { width: 100%; }

.action-bar { 
  margin-top: 10px; 
  margin-bottom: 30px; 
  display: flex; 
  justify-content: flex-start; 
  align-items: center; 
  gap: 24px; 
  flex-wrap: wrap;
}

.btn-upload { background: linear-gradient(135deg, var(--color-admin-primary, #2DD4BF) 0%, var(--color-admin-hover, #34D399) 100%); color: #ffffff; font-size: 16px; font-weight: 800; border: none; padding: 12px 36px; border-radius: 100px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(52, 211, 153, 0.5); transition: all 0.2s ease; }
.btn-upload:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px rgba(52, 211, 153, 0.6); }

/* =======================================
   🌟 每日工作量统计样式面板 (统一滑块风格)
======================================= */
.daily-op-counter {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  background-color: var(--bg-hover, #F1F5F9); /* 和滑块一样的凹槽底色 */
  border-radius: 100px;
  padding: 4px; /* 和滑块一样的内边距 */
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04); /* 和滑块一样的内阴影 */
  cursor: default;
}

.op-label {
  padding: 0 12px 0 12px;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-light, #94A3B8); /* 和滑块未选中时一样的灰色文字 */
}

.op-value-bg {
  display: inline-flex;
  align-items: baseline;
  background-color: var(--bg-card, #FFFFFF); /* 和滑块选中时一样的纯白滑块 */
  border-radius: 100px;
  padding: 4px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); /* 滑块同款立体阴影 */
}

.op-number {
  font-size: 15px;
  font-weight: 900;
  color: var(--color-admin-primary, #10B981); /* 醒目的主题绿 */
  line-height: 1;
}

.op-unit {
  font-size: 12px;
  margin-left: 4px;
  font-weight: 800;
  color: var(--text-light, #94A3B8);
}

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

.status-slider .slider-bg {
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

.status-slider .slider-bg.all { transform: translateX(0); }
.status-slider .slider-bg.published { transform: translateX(90px); }
.status-slider .slider-bg.unpublished { transform: translateX(180px); }

.platform-slider {
  position: relative;
  display: inline-flex;
  background-color: var(--bg-hover, #F1F5F9);
  border-radius: 100px;
  padding: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}

.platform-slider button {
  position: relative;
  z-index: 2;
  background: transparent;
  border: none;
  width: 80px; 
  height: 36px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-light, #94A3B8);
  cursor: pointer;
  transition: color 0.3s ease;
}

.platform-slider button.active {
  color: var(--color-admin-primary, #10B981);
}

.platform-slider .slider-bg {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 80px;
  height: 36px;
  background-color: var(--bg-card, #FFFFFF);
  border-radius: 100px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

.platform-slider .slider-bg.all { transform: translateX(0); }
.platform-slider .slider-bg.switch { transform: translateX(80px); }
.platform-slider .slider-bg.pc { transform: translateX(160px); }
.platform-slider .slider-bg.ps4 { transform: translateX(240px); }
.platform-slider .slider-bg.ps5 { transform: translateX(320px); }


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

.loading-tip { text-align: center; padding: 40px; color: var(--text-light, #94A3B8); font-weight: 600; }

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; }
.loading-spinner {
  width: 44px; height: 44px; border-radius: 50%;
  border: 4px solid var(--bg-hover, #F1F5F9);
  border-top-color: var(--color-admin-primary, #10B981);
  animation: game-manager-spin 0.8s linear infinite;
  margin-bottom: 16px;
}
.loading-text { font-size: 14px; font-weight: 700; color: var(--text-light, #94A3B8); }
@keyframes game-manager-spin { to { transform: rotate(360deg); } }
</style>