<template>
  <div class="feedback-workspace">
    <div class="data-card">
      <div class="card-header-row">
        <h2 class="card-title">💬 游客反馈与报错记录</h2>
        <button class="btn-refresh" @click="loadFeedbacks">刷新列表 🔄</button>
      </div>

      <div class="table-container">
        <div class="table-header">
          <div class="col-id">ID</div>
          <div class="col-game">关联游戏</div>
          <div class="col-content">反馈报错内容</div>
          <div class="col-contact">联系方式</div>
          <div class="col-ip">IP / 归属地</div>
          <div class="col-time">提交时间</div>
          <div class="col-status">状态</div>
          <div class="col-actions">操作</div>
        </div>

        <div v-if="isLoading" class="loading-tip">正在同步玩家反馈数据...</div>
        <div v-else-if="feedbacks.length === 0" class="loading-tip">🎉 暂无任何玩家反馈问题，一切正常！</div>

        <div 
          v-else 
          class="table-row" 
          v-for="item in feedbacks" 
          :key="item.id"
          :class="{ 'handled-row': item.is_handled }"
        >
          <div class="col-id id-text">#{{ item.id }}</div>
          <div class="col-game game-name-text">
            <strong>{{ item.game_name }}</strong>
            <span class="game-id-tag">(ID: {{ item.game_id || '通用' }})</span>
          </div>
          <div class="col-content content-box">{{ item.content }}</div>
          <div class="col-contact contact-text">{{ item.contact_info || '未留下' }}</div>
          
          <div class="col-ip ip-box">
            <span class="ip-code">{{ item.user_ip || '127.0.0.1' }}</span>
            <span class="ip-location">{{ gameStore.ipLocationMap[item.user_ip] || '正在定位...' }}</span>
          </div>
          
          <div class="col-time date-text">{{ formatDate(item.created_at) }}</div>
          
          <div class="col-status">
            <span class="status-badge" :class="item.is_handled ? 'bg-green' : 'bg-red'">
              {{ item.is_handled ? '已解决' : '待处理' }}
            </span>
          </div>

          <div class="col-actions btn-group">
            <button 
              class="btn-toggle" 
              :class="item.is_handled ? 'btn-unhandle' : 'btn-done'"
              @click="handleToggleStatus(item)"
            >
              {{ item.is_handled ? '标为未解决' : '已解决' }}
            </button>
            <button class="btn-delete" @click="handleDelete(item.id)">清除</button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/store/gameStore'

const gameStore = useGameStore()
const feedbacks = ref([])
const isLoading = ref(true)

const loadFeedbacks = async () => {
  isLoading.value = true
  feedbacks.value = await gameStore.fetchFeedbacks()
  isLoading.value = false

  // 🌟 数据加载完毕后，只需一句话，把提取出来的 IP 数组丢给全局库去查！
  if (feedbacks.value.length > 0) {
    const ipArray = feedbacks.value.map(item => item.user_ip)
    gameStore.parseIps(ipArray) 
  }
}

onMounted(() => {
  loadFeedbacks()
})

// 🌟 新增切换反馈状态功能
const handleToggleStatus = async (item) => {
  const newStatus = !item.is_handled
  const success = await gameStore.toggleFeedbackStatus(item.id, newStatus)
  if (success) {
    item.is_handled = newStatus
  }
}

// 🌟 新增删除反馈功能
const handleDelete = async (id) => {
  const success = await gameStore.deleteFeedback(id)
  if (success) {
    feedbacks.value = feedbacks.value.filter(f => f.id !== id)
  }
}

// 🌟 统一的时间格式化函数
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
.feedback-workspace { padding: 10px 0; width: 100%; text-align: left; }
.data-card { background-color: var(--bg-card, #FFFFFF); border-radius: 16px; padding: 32px; border: 1px solid var(--border-light, #F1F5F9); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); }
.card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.card-title { font-size: 18px; font-weight: 800; color: var(--text-heading, #1E293B); margin: 0; }
.btn-refresh { background: var(--bg-hover); border: 1px solid var(--border-main); color: var(--text-muted); padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-refresh:hover { color: var(--color-admin-primary, #14B8A6); border-color: var(--color-admin-primary, #14B8A6); }

.table-container { width: 100%; }
.table-header { display: grid; grid-template-columns: 0.6fr 1.5fr 3fr 1.2fr 1.5fr 1.2fr 0.8fr 1.5fr; padding-bottom: 16px; border-bottom: 1px solid var(--border-light, #F1F5F9); font-size: 12px; font-weight: 800; color: var(--text-light, #94A3B8); }
.table-row { display: grid; grid-template-columns: 0.6fr 1.5fr 3fr 1.2fr 1.5fr 1.2fr 0.8fr 1.5fr; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--bg-hover, #F8FAFC); transition: background-color 0.2s; }
.table-row:hover { background-color: var(--bg-hover, #F8FAFC); }
.handled-row { opacity: 0.6; }

.id-text { font-size: 13px; font-weight: 800; color: var(--text-light); }
.game-name-text strong { display: block; font-size: 14px; color: var(--text-heading); }
.game-id-tag { font-size: 11px; color: var(--text-light); }
.content-box { font-size: 13px; color: var(--text-main); line-height: 1.5; padding-right: 12px; white-space: pre-wrap; }
.contact-text { font-size: 13px; font-weight: 700; color: var(--color-primary, #2563EB); }
.ip-box { display: flex; flex-direction: column; }
.ip-code { font-size: 12px; font-weight: 800; color: var(--text-muted); font-family: monospace; }
.ip-location { font-size: 11px; color: var(--text-light); }
.date-text { font-size: 12px; color: var(--text-muted); font-weight: 600; }

.status-badge { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; display: inline-block; }
.bg-red { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.2); }
.bg-green { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

.btn-group { display: flex; gap: 8px; }
.btn-group button { padding: 6px 14px; border: none; border-radius: 100px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; white-space: nowrap; }
.btn-done { background-color: #10b981; color: #fff; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); }
.btn-done:hover { filter: brightness(1.1); }
.btn-unhandle { background-color: var(--bg-hover); color: var(--text-muted); border: 1px solid var(--border-main); }
.btn-delete { background-color: #f43f5e; color: #fff; box-shadow: 0 4px 10px rgba(244, 63, 94, 0.3); }
.btn-delete:hover { filter: brightness(1.1); }

.loading-tip { text-align: center; padding: 40px; color: var(--text-light); font-weight: 600; }
</style>