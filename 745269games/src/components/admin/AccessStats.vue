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
        <h2 class="card-title">🌐 实时访客轨迹日志 (最近50条)</h2>
        <button class="btn-refresh" @click="loadData">刷新数据 🔄</button>
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

        <div class="table-row" v-for="log in accessLogs" :key="log.id">
          <div class="col-id id-text">#{{ log.id }}</div>
          <div class="col-ip ip-code">{{ log.user_ip || '127.0.0.1' }}</div>
          <div class="col-location location-text">
            {{ locationMap[log.user_ip] || '正在定位...' }}
          </div>
          <div class="col-path path-pill">
            <code>{{ log.path || '/' }}</code>
          </div>
          <div class="col-device device-text">{{ parseUserAgent(log.user_agent) }}</div>
          <div class="col-time date-text">{{ formatDate(log.created_at) }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/store/gameStore'

const gameStore = useGameStore()

const isLoading = ref(true)
const summary = ref({ todayPv: 0, todayUv: 0, totalVisits: 0, totalDownloads: 0 })
const accessLogs = ref([])
// 🌟 1. 新增：用来存储 IP 对应城市的字典
const locationMap = ref({})

// 🌟 2. 新增：高并发 IP 定位引擎
const fetchLocations = async (logs) => {
  // 提取所有不重复的 IP，避免同一个 IP 请求好几次 API
  const uniqueIps = [...new Set(logs.map(log => log.user_ip))];
  
  for (const ip of uniqueIps) {
    // 过滤掉内网和未知 IP
    if (!ip || ip === 'unknown_ip' || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('172.')) {
      locationMap.value[ip] = '局域网/本地';
      continue;
    }
    
    // 调用免费的 IP 归属地接口 (使用 https 防止混合内容报错)
    try {
      const response = await fetch(`https://demo.ip-api.com/json/${ip}?lang=zh-CN`);
      const data = await response.json();
      if (data.status === 'success') {
        // 拼接成 "广东省 深圳市" 这种格式
        locationMap.value[ip] = `${data.regionName} ${data.city}`;
      } else {
        locationMap.value[ip] = '中国';
      }
    } catch (error) {
      locationMap.value[ip] = '中国';
    }
  }
}

const loadData = async () => {
  isLoading.value = true
  const [sumRes, logsRes] = await Promise.all([
    gameStore.fetchAnalyticsSummary(),
    gameStore.fetchAccessLogs()
  ])
  summary.value = sumRes
  accessLogs.value = logsRes
  isLoading.value = false
  
  // 🌟 3. 拿到日志后，立刻启动定位引擎
  if (accessLogs.value.length > 0) {
    fetchLocations(accessLogs.value);
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

// 🌟 完美时区转换引擎
const formatDate = (str) => {
  if (!str) return '-'
  
  // 核心修复：把 SQLite 返回的 "2026-08-15 15:00:00" 
  // 替换为标准 ISO 格式 "2026-08-15T15:00:00Z"
  // 末尾的 'Z' 是最关键的魔法，它告诉浏览器：“这是国际零时区时间！”
  // 浏览器接到后，会自动为你加上 8 小时，变成完美的北京时间！
  let cleanStr = str;
  if (!str.includes('Z') && !str.includes('T')) {
    cleanStr = str.replace(' ', 'T') + 'Z';
  }

  return new Date(cleanStr).toLocaleString('zh-CN', {
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false // 强制 24 小时制，看着更专业
  })
}
</script>

<style scoped>
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
.btn-refresh { background: var(--bg-hover); border: 1px solid var(--border-main); color: var(--text-muted); padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-refresh:hover { color: var(--color-admin-primary, #14B8A6); border-color: var(--color-admin-primary, #14B8A6); }

.table-container { width: 100%; }
.table-header { display: grid; grid-template-columns: 0.6fr 1.5fr 1fr 2.5fr 1.5fr 1.5fr; padding-bottom: 16px; border-bottom: 1px solid var(--border-light); font-size: 12px; font-weight: 800; color: var(--text-light); }
.table-row { display: grid; grid-template-columns: 0.6fr 1.5fr 1fr 2.5fr 1.5fr 1.5fr; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--bg-hover); transition: background-color 0.2s; }
.table-row:hover { background-color: var(--bg-hover); }

.id-text { font-size: 13px; font-weight: 800; color: var(--text-light); }
.ip-code { font-size: 13px; font-weight: 800; color: var(--color-admin-primary, #14B8A6); font-family: monospace; }
.location-text { font-size: 13px; color: var(--text-muted); font-weight: 600; }
.path-pill code { background: var(--bg-hover); color: var(--text-heading); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; border: 1px solid var(--border-light); }
.device-text { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.date-text { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.loading-tip { text-align: center; padding: 40px; color: var(--text-light); font-weight: 600; }
</style>