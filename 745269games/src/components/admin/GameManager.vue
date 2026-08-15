<template>
  <div class="game-manager-container">
    <div class="action-bar">
      <button class="btn-upload" @click="openAddModal">上传游戏</button>
    </div>

    <div class="data-card">
      <h2 class="card-title">游戏列表</h2>
      <div class="table-header">
          <!-- 🌟 新增序号列 -->
          <div class="col-index">序号</div>
          <div class="col-game">游戏</div>
          <div class="col-date">上架日期</div>
          <div class="col-platform">平台</div>
          <div class="col-cat">分类</div> 
          <div class="col-disk">网盘资源</div> 
          <div class="col-downloads">真实下载量</div> 
          <div class="col-actions">管理</div>
        </div>

        <!-- 🌟 v-for 增加 index 索引 -->
        <div class="table-row" v-for="(game, index) in displayedData" :key="game.id">
          <!-- 🌟 渲染序号 (根据数组索引 + 1) -->
          <div class="col-index">{{ game.id}}</div>
          
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
            <!-- 🌟 核心改造：双状态上下架按钮 -->
            <button 
              :class="game.isActive ? 'btn-delete' : 'btn-publish'" 
              @click="handleToggleStatus(game.id, game.isActive)"
            >
              {{ game.isActive ? '下架' : '上架' }}
            </button>
          </div>
        </div>

    </div>
    
    <!-- 弹窗移到这里了 -->
    <GameFormModal :visible="isModalVisible" :gameData="currentEditData" @update:visible="isModalVisible = $event" @submit="handleSave"/>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/store/gameStore'
import GameFormModal from '@/components/admin/GameFormModal.vue'

// 接收父框架传来的搜索数据
const props = defineProps({
  activeSearchKeyword: { type: String, default: '' },
  adminSearchResults: { type: Array, default: () => [] }
})

const gameStore = useGameStore()
const isModalVisible = ref(false)
const currentEditData = ref(null)

const displayedData = computed(() => {
  if (props.activeSearchKeyword) return gameStore.formatAdminTableData(props.adminSearchResults)
  return gameStore.formatAdminTableData(gameStore.allGames)
})

const openAddModal = () => { currentEditData.value = null; isModalVisible.value = true; }
const openEditModal = (gameId) => {
  const sourceArray = props.activeSearchKeyword ? props.adminSearchResults : gameStore.allGames
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


// 🌟 切换上下架状态逻辑
const handleToggleStatus = async (id, currentStatus) => {
  // 如果当前是激活(1/true)，新状态就是 0；否则就是 1
  const newStatus = currentStatus ? 0 : 1; 
  const actionName = newStatus === 1 ? '上架' : '下架';
  
  if (confirm(`确定要将该游戏【${actionName}】吗？`)) {
    // 这里调用接下来我们要在 Store 里写的接口
    const success = await gameStore.toggleGameStatus(id, newStatus);
    if (success) {
      alert(`操作成功，游戏已${actionName}！`);
    }
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
/* 这里只保留游戏列表和卡片的专属CSS */
.game-manager-container { width: 100%; }
.action-bar { margin-top: 10px; margin-bottom: 30px; display: flex; justify-content: flex-start; }
.btn-upload { background: linear-gradient(135deg, var(--color-admin-primary, #2DD4BF) 0%, var(--color-admin-hover, #34D399) 100%); color: #ffffff; font-size: 16px; font-weight: 800; border: none; padding: 12px 36px; border-radius: 100px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(52, 211, 153, 0.5); transition: all 0.2s ease; }
.btn-upload:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px rgba(52, 211, 153, 0.6); }

.data-card { background-color: var(--bg-card, #FFFFFF); border-radius: 16px; padding: 32px; border: 1px solid var(--border-light, #F1F5F9); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); }
.card-title { font-size: 18px; font-weight: 800; color: var(--text-heading, #1E293B); margin-bottom: 24px; text-align: left; }
.table-container { width: 100%; text-align: left; }
.table-header { display: grid; grid-template-columns: 0.5fr 2fr 1fr 0.8fr 1.2fr 2fr 0.8fr 1fr; padding-bottom: 16px; border-bottom: 1px solid var(--border-light, #F1F5F9); font-size: 12px; font-weight: 800; color: var(--text-light, #94A3B8); }
.table-row { display: grid; grid-template-columns: 0.5fr 2fr 1fr 0.8fr 1.2fr 2fr 0.8fr 1fr; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--bg-hover, #F8FAFC); transition: background-color 0.2s; }

.table-row:hover { background-color: var(--bg-hover, #F8FAFC); }
/* 序号列样式 */
.col-index { text-align: left; font-size: 14px; font-weight: 800; color: var(--text-light, #94A3B8); padding-left: 8px; }

/* 🌟 上架按钮专属样式 (护眼绿) */
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