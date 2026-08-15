<template>
  <div class="analytics-workspace">
    
    <div class="stats-cards-grid">
      <div class="stat-card">
        <div class="card-icon bg-blue">📊</div>
        <div class="card-text">
          <p class="stat-title">今日 PV (浏览量)</p>
          <h2 class="stat-number">{{ summary.todayPv }} <span class="unit">次</span></h2>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-icon bg-green">👥</div>
        <div class="card-text">
          <p class="stat-title">今日 UV (独立访客)</p>
          <h2 class="stat-number">{{ summary.todayUv }} <span class="unit">人</span></h2>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-icon bg-purple">🚀</div>
        <div class="card-text">
          <p class="stat-title">全站累计访问</p>
          <h2 class="stat-number">{{ summary.totalVisits }} <span class="unit">次</span></h2>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-icon bg-orange">💾</div>
        <div class="card-text">
          <p class="stat-title">资源总转化下载</p>
          <h2 class="stat-number">{{ summary.totalDownloads }} <span class="unit">次</span></h2>
        </div>
      </div>
    </div>

    <div class="data-card">
      <div class="card-header-row">
        <!-- 动态显示当前数据量信息 -->
        <h2 class="card-title">🌐 实时访客轨迹日志 <span style="font-size: 14px; color: #94A3B8;">(总共 {{ totalLogs }} 条记录)</span></h2>
        <div class="header-btn-group">
          <button class="btn-action btn-refresh" @click="handleRefresh" :disabled="isLoading">
            刷新数据 🔄
          </button>
          <button class="btn-action btn-clear" @click="handleClearLogsClick" :disabled="isLoading || accessLogs.length === 0">
            清空日志 🗑️
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <div class="col-id">编号</div>
          <div class="col-ip">访客 IP</div>
          <div class="col-location">IP 归属地</div>
          <div class="col-path">访问页面路径</div>
          <div class="col-device">客户端/设备</div>
          <div class="col-time">访问时间</div>
        </div>

        <div v-if="isLoading" class="loading-tip">正在同步流量日志...</div>
        <div v-else-if="accessLogs.length === 0" class="loading-tip">暂无访问日志，上线部署后将实时捕捉玩家访问足迹！</div>

        <div v-else>
          <div class="table-row" v-for="log in accessLogs" :key="log.id">
            <div class="col-id id-text">#{{ log.id }}</div>
            <div class="col-ip ip-code">{{ log.user_ip || '127.0.0.1' }}</div>
            <div class="col-location location-text">
              {{ gameStore.ipLocationMap[log.user_ip] || '正在定位...' }}
            </div>
            <div class="col-path path-pill">
              <code>{{ log.path || '/' }}</code>
            </div>
            <div class="col-device device-text">{{ parseUserAgent(log.user_agent) }}</div>
            <div class="col-time date-text">{{ formatDate(log.created_at) }}</div>
          </div>
          
          <!-- 🌟 引入刚封装的公共分页组件 -->
          <Pagination 
            v-model:currentPage="currentPage" 
            :totalItems="totalLogs" 
            :pageSize="pageSize" 
            @change="loadData" 
          />
        </div>
      </div>
    </div>
    
    <!-- 🌟 引入公共确认弹窗组件 -->
    <ConfirmModal 
      ref="confirmModalRef"
      v-model:visible="showConfirm" 
      :title="confirmConfig.title" 
      :message="confirmConfig.message" 
      :type="confirmConfig.type" 
      @confirm="executeClearLogs" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/store/gameStore'
// 🌟 引入公共组件
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const gameStore = useGameStore()

const isLoading = ref(true)
const summary = ref({ todayPv: 0, todayUv: 0, totalVisits: 0, totalDownloads: 0 })
const accessLogs = ref([])

// 🌟 分页相关的状态变量
const currentPage = ref(1)
const pageSize = 100 // 默认每页展示100条
const totalLogs = ref(0) // 从后端拿到的总数据量

// 🌟 弹窗相关的状态变量
const confirmModalRef = ref(null)
const showConfirm = ref(false)
const confirmConfig = ref({ title: '', message: '', type: 'primary' })

// 核心加载数据方法
const loadData = async () => {
  isLoading.value = true
  
  // 计算 offset 偏移量: (当前页 - 1) * 每页数量
  const currentOffset = (currentPage.value - 1) * pageSize

  const [sumRes, logsRes] = await Promise.all([
    gameStore.fetchAnalyticsSummary(),
    gameStore.fetchAccessLogs(pageSize, currentOffset) // 👈 传入分页参数
  ])
  
  summary.value = sumRes
  
  // 🌟 后端现在返回了 { total, data }，这里需要解构赋值
  totalLogs.value = logsRes.total || 0
  accessLogs.value = logsRes.data || []
  
  isLoading.value = false
  
  // 调用全局 Store 里的 IP 解析引擎
  if (accessLogs.value.length > 0) {
    const ipArray = accessLogs.value.map(log => log.user_ip)
    gameStore.parseIps(ipArray)
  }
}

// 刷新按钮：手动重置到第一页并加载
const handleRefresh = () => {
  currentPage.value = 1
  loadData()
}

// 🌟 1. 清空日志按钮点击事件 (唤起确认弹窗)
const handleClearLogsClick = () => {
  confirmConfig.value = {
    title: '🚨 清空访问日志确认',
    message: '确定要彻底清空数据库中所有的访客轨迹日志吗？此操作属于物理删除，无法撤销找回！',
    type: 'danger' // 红色警告风格
  }
  showConfirm.value = true
}

// 🌟 2. 弹窗内确认后，实际执行后端清空操作
const executeClearLogs = async () => {
  isLoading.value = true
  const res = await gameStore.clearAccessLogs()
  
  if (res.success) {
    // 调用 ConfirmModal 内置的 Toast 轻提示
    confirmModalRef.value?.showToast('数据库已清理，所有访问日志已被成功清空！', 'success')
    currentPage.value = 1
    await loadData() // 刷新页面数据
  } else {
    confirmModalRef.value?.showToast(`清空失败: ${res.error || '网络错误'}`, 'danger')
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const parseUserAgent = (ua) => {
  if (!ua) return 'PC / Chrome'
  if (ua.includes('iPhone') || ua.includes('Android')) return '📱 移动端/手机'
  if (ua.includes('Macintosh')) return '💻 Mac 电脑'
  return '💻 Windows 电脑'
}

const formatDate = (str) => {
  if (!str) return '-'
  let cleanStr = str;
  if (!str.includes('Z') && !str.includes('T')) {
    cleanStr = str.replace(' ', 'T') + 'Z';
  }
  return new Date(cleanStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
}
</script>

<style scoped>
/* 保持你原本的样式，没有任何改动 */
.analytics-workspace { width: 100%; text-align: left; display: flex; flex-direction: column; gap: 24px; }

/* 1. 顶部数据卡片网格 */
.stats-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
.stat-card { background: var(--bg-card, #FFFFFF); border-radius: 16px; padding: 20px 24px; border: 1px solid var(--border-light, #F1F5F9); display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: 0.2s; }
.stat-card:hover { transform: translateY(-2px); border-color: var(--border-main); }
.card-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.bg-blue { background: rgba(37, 99, 235, 0.1); }
.bg-green { background: rgba(16, 185, 129, 0.1); }
.bg-purple { background: rgba(139, 92, 246, 0.1); }
.bg-orange { background: rgba(249, 115, 22, 0.1); }

.stat-title { font-size: 13px; font-weight: 700; color: var(--text-muted, #64748B); margin: 0 0 4px 0; }
.stat-number { font-size: 24px; font-weight: 900; color: var(--text-heading, #0F172A); margin: 0; }
.stat-number .unit { font-size: 12px; color: var(--text-light); font-weight: 600; margin-left: 2px; }

/* 2. 下方表格样式 */
.data-card { background-color: var(--bg-card, #FFFFFF); border-radius: 16px; padding: 32px; border: 1px solid var(--border-light, #F1F5F9); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.card-title { font-size: 18px; font-weight: 800; color: var(--text-heading, #1E293B); margin: 0; }

/* 🌟 按钮组与红色危险清空按钮样式 */
.header-btn-group { display: flex; gap: 10px; align-items: center; }
.btn-action { border: 1px solid var(--border-main); padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }

.btn-refresh { background: var(--bg-hover); color: var(--text-muted); }
.btn-refresh:hover:not(:disabled) { color: var(--color-admin-primary, #14B8A6); border-color: var(--color-admin-primary, #14B8A6); transform: translateY(-1px); }

.btn-clear { background: rgba(244, 63, 94, 0.05); color: #f43f5e; border-color: rgba(244, 63, 94, 0.2); }
.btn-clear:hover:not(:disabled) { background: #f43f5e; color: #ffffff; border-color: #f43f5e; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(244, 63, 94, 0.25); }
.btn-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

.table-container { width: 100%; }
.table-header { display: grid; grid-template-columns: 0.6fr 1.5fr 1.2fr 2.3fr 1.5fr 1.5fr; padding-bottom: 16px; border-bottom: 1px solid var(--border-light); font-size: 12px; font-weight: 800; color: var(--text-light); }
.table-row { display: grid; grid-template-columns: 0.6fr 1.5fr 1.2fr 2.3fr 1.5fr 1.5fr; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--bg-hover); transition: background-color 0.2s; }
.table-row:hover { background-color: var(--bg-hover); }

.id-text { font-size: 13px; font-weight: 800; color: var(--text-light); }
.ip-code { font-size: 13px; font-weight: 800; color: var(--color-admin-primary, #14B8A6); font-family: monospace; }
.location-text { font-size: 13px; color: var(--text-muted); font-weight: 700; }
.path-pill code { background: var(--bg-hover); color: var(--text-heading); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; border: 1px solid var(--border-light); }
.device-text { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.date-text { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.loading-tip { text-align: center; padding: 40px; color: var(--text-light); font-weight: 600; }
</style>