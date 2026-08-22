import { defineStore } from 'pinia'
import { ref } from 'vue'

// 跨域请求的后端 API 地址，前端所有请求都通过这个地址转发到后端服务
const API_BASE_URL = ''

export const useGameStore = defineStore('game', () => {
  const isLoading = ref(false)
  const allGames = ref([]) 
  const isAdminLoggedIn = ref(localStorage.getItem('745269_admin_token') ? true : false)
  
  const currentOffset = ref(0)
  const hasMore = ref(true)

  // 🌟 统一的后台鉴权请求头：所有管理端接口都要带上登录令牌
  const getAuthHeaders = () => {
    const token = localStorage.getItem('745269_admin_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  // 💡 无敌组装机：自动把数据库散装字段 (title_zh, video_url 等) 100% 组装为标准结构
  const parseGameData = (rawGame) => {
    if (!rawGame) return null
    const game = { ...rawGame }
    
    // 1. 组装标题
    if (game.title_zh !== undefined || game.title_en !== undefined) {
      game.title = {
        zh_CN: game.title_zh || '',
        en_US: game.title_en || ''
      }
    }

    // 2. 组装媒体图片与视频 (防刷新丢失核心：多重提取 video)
    let screenshots = []
    if (game.media_screenshots_json) {
      try { screenshots = JSON.parse(game.media_screenshots_json) } catch (e) {}
    } else if (Array.isArray(game.media?.screenshots)) {
      screenshots = game.media.screenshots
    }

    const coverUrl = game.cover_url || game.media?.cover || ''
    const videoUrl = game.video_url || game.media?.video || ''

    game.media = {
      cover: coverUrl,
      screenshots: screenshots,
      video: videoUrl 
    }

    // 3. 组装下载列表
    if (game.downloads_json && typeof game.downloads_json === 'string') {
      try { game.downloads = JSON.parse(game.downloads_json) } catch (e) {}
    }

    // 4. 组装别名/语言
    if (game.aliases_json && typeof game.aliases_json === 'string') {
      try { game.aliases = JSON.parse(game.aliases_json) } catch (e) {}
    }

    // 5. 组装分类元数据
    if (game.metadata_json && typeof game.metadata_json === 'string') {
      try { game.metadata = JSON.parse(game.metadata_json) } catch (e) {}
    }

    // 🌟 6. 兜底兼容与互动数据补全 (必须放在最后执行！)
    const jsonFields = ['title', 'media', 'metadata', 'downloads', 'aliases']
    jsonFields.forEach(field => {
      if (typeof game[field] === 'string') {
        try {
          game[field] = JSON.parse(game[field])
        } catch (e) {
          console.error(`解析 ${field} 失败:`, e)
        }
      }
    })

    // 强行挂载互动数据，保证所有 UI 组件都能读到数字，不会变成 undefined
    game.likes = game.likes || 0;
    game.likesCount = game.likes; 
    game.download_count = game.download_count || 0;

    return game
  }

  // 1. 获取游戏列表
  const fetchGames = async (isLoadMore = false, tags = '') => {
    if (isLoading.value || (!hasMore.value && isLoadMore)) return
    isLoading.value = true
    try {
      if (!isLoadMore) {
        currentOffset.value = 0
        allGames.value = []
        hasMore.value = true
      }
      
      // 🌟 核心突破口：智能限流！
      // 如果是管理员，直接拉取 5000 条进内存，供后台零延迟分页、搜索和筛选！
      const fetchLimit = isAdminLoggedIn.value ? 10000 : 2000; 
      
      // 🌟 核心拆分：前台走公开通道，后台走专属鉴权通道
      let url = isAdminLoggedIn.value 
        ? `${API_BASE_URL}/api/admin/games?limit=${fetchLimit}&offset=${currentOffset.value}`
        : `${API_BASE_URL}/api/games?limit=${fetchLimit}&offset=${currentOffset.value}`
        
      if (tags) {
        url += `&tags=${encodeURIComponent(tags)}`
      }

      // 🌟 在请求头（Headers）中加入 Token 门票
      const headers = {}
      if (isAdminLoggedIn.value) {
        const token = localStorage.getItem('745269_admin_token')
        headers['Authorization'] = `Bearer ${token}`
      }

      // 发起请求
      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error('网络请求失败')
      const data = await response.json()
      
      // 如果拿回来的数据少于请求的限制，说明真的被掏空了，没有更多了
      if (data.length < fetchLimit) hasMore.value = false
      
      const parsedData = (Array.isArray(data) ? data : []).map(parseGameData)
      allGames.value.push(...parsedData)
      currentOffset.value += fetchLimit
    } catch (error) {
      console.error('获取游戏列表失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 2. 保存游戏 (🌟 纯本地内存秒切版)
  const saveGame = async (gameData) => {
    try {
      const isEdit = !!gameData.id
      // 🌟 修复关键：后端没有 /api/admin 的保存接口，统一发往原版的 /api/games 即可！
      const url = isEdit ? `${API_BASE_URL}/api/games/${gameData.id}` : `${API_BASE_URL}/api/games`

      const method = isEdit ? 'PUT' : 'POST'

      const headers = { 'Content-Type': 'application/json' }
      if (isAdminLoggedIn.value) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('745269_admin_token')}`
      }

      const response = await fetch(url, { method, headers, body: JSON.stringify(gameData) })
      const result = await response.json()
      
      if (result.success) {
        // 🌟 见证奇迹的时刻：直接在 Pinia 内存里光速洗牌！
        const formattedData = parseGameData(gameData)

        if (isEdit) {
          // 【修改模式】：原地瞬间覆盖
          const index = allGames.value.findIndex(g => g.id === gameData.id)
          if (index !== -1) {
            allGames.value[index] = { ...allGames.value[index], ...formattedData }
          }
        } else {
          // 【上传模式】：塞入时间戳当假ID，插入首行
          formattedData.id = Date.now() 
          formattedData.system = { is_active: 1, created_at: new Date().toISOString() }
          
          allGames.value.unshift(formattedData)
        }
        
        return true 
      } else {
        throw new Error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error) // 如果再失败，浏览器 F12 控制台会打印红字报错
      return false 
    }
  }

  // 3. 删除游戏
  const deleteGame = async (id) => {
    if (!confirm('🚨 确定要下架并永久删除这款游戏吗？该操作不可逆！')) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const result = await response.json()
      if (result.success) {
        allGames.value = allGames.value.filter(game => game.id !== id)
      }
    } catch (error) {}
  }

  // 🌟 状态切换：上下架
  const toggleGameStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ is_active: newStatus })
      })
      const result = await response.json()
      
      if (result.success) {
        // 接口成功后，直接在前端内存里修改状态，不需要重新请求全部数据，体验秒切！
        const targetGame = allGames.value.find(game => game.id === id)
        if (targetGame && targetGame.system) {
          targetGame.system.is_active = newStatus
        }
        return true
      }
    } catch (error) {
      console.error('状态切换请求失败:', error)
    }
    return false
  }

  // 4. 图片上传
  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, { method: 'POST', body: formData })
      const result = await response.json()
      if (result.success) return result.url 
      return null
    } catch (error) { return null }
  }

  // 5. 真实服务端搜索 API 请求
  const fetchSearchFromServer = async (keyword) => {
    try {
      // 🌟 核心拆分：搜索也分两套接口
      let url = isAdminLoggedIn.value 
        ? `${API_BASE_URL}/api/admin/games/search?q=${encodeURIComponent(keyword)}`
        : `${API_BASE_URL}/api/games/search?q=${encodeURIComponent(keyword)}`

      const headers = {}
      if (isAdminLoggedIn.value) {
        const token = localStorage.getItem('745269_admin_token')
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`[HTTP 状态码: ${response.status}] 详情: ${errText}`)
      }
      const data = await response.json()
      const parsedData = (Array.isArray(data) ? data : []).map(parseGameData)
      allGames.value = parsedData
      return parsedData
    } catch (error) {
      console.error('服务端搜索失败:', error.message)
      return [] 
    }
  }

  // 6. 按 ID 获取单条数据 (刷新防丢数据核心)
  const fetchGameById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/${id}`)
      if (!response.ok) throw new Error('未找到该游戏')
      
      const rawData = await response.json()
      const singleRaw = Array.isArray(rawData) ? rawData[0] : rawData
      const parsedGame = parseGameData(singleRaw)
      
      if (parsedGame) {
        allGames.value = [parsedGame]
      }
      return parsedGame
    } catch (error) {
      console.error('获取单条游戏失败:', error)
      return null
    }
  }

  // 7. 后台表格数据清洗
  const formatAdminTableData = (rawGamesArray) => {
    return rawGamesArray.map(game => ({
      id: game.id,
      cover: game.media?.cover || game.cover_url || '',
      nameZh: game.title?.zh_CN || game.title_zh || '未命名',
      nameEn: game.title?.en_US || game.title_en || '',
      date: game.system?.created_at || game.created_at ? new Date(game.system?.created_at || game.created_at).toLocaleDateString() : '-',
      platforms: game.metadata?.platforms || [],
      tags: game.metadata?.genres || [],
      downloads: game.downloads?.length || 0,
      downloadCount: game.download_count || 0,
      // 🌟 关键点：isActive 字段的判断逻辑，确保兼容不同数据结构
      isActive: game.system?.is_active !== undefined ? (game.system.is_active === 1 || game.system.is_active === true) : true
    }))
  }

  // 🌟 8. 互动接口：悄悄给服务器发送 +1 指令
  const recordInteraction = async (id, type) => {
    try {
      await fetch(`${API_BASE_URL}/api/games/${id}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }) // type 是 'download' 或者 'like'
      })
    } catch (error) {
      console.error('更新互动数据失败:', error)
    }
  }
  // 🌟 9. 提交用户反馈 (带错误拦截)
  const submitFeedback = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const result = await response.json()
    if (!response.ok || !result.success) {
      throw new Error(result.error || '提交失败，请稍后重试')
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

  // 🌟 10. 管理员获取反馈列表
  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedbacks`, { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('拉取反馈失败')
      return await response.json()
    } catch (error) {
      console.error('获取反馈失败:', error)
      return []
    }
  }

  // 🌟 11. 切换反馈处理状态 (已解决 / 未解决)
  const toggleFeedbackStatus = async (id, isHandled) => {
    try {
      await fetch(`${API_BASE_URL}/api/feedbacks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ is_handled: isHandled })
      })
      return true
    } catch (error) {
      return false
    }
  }

  // 🌟 12. 删除单条反馈
  const deleteFeedback = async (id) => {
    if (!confirm('确定要清除这条反馈记录吗？')) return false
    try {
      await fetch(`${API_BASE_URL}/api/feedbacks/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      return true
    } catch (error) {
      return false
    }
  }

  // 🌟 13. 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('获取用户失败')
      return await response.json()
    } catch (error) {
      console.error(error)
      return []
    }
  }

  // 🌟 14. 添加新用户
  const addUser = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(userData)
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || '添加失败')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 🌟 15. 删除用户
  const deleteUser = async (id) => {
    if (!confirm('🚨 警告：确定要永久删除该用户吗？此操作无法撤销！')) return false
    try {
      await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      return true
    } catch (error) {
      return false
    }
  }

  // 🌟 16. 获取访问统计数据概要
  const fetchAnalyticsSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/summary`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('获取流量概要失败')
      return await res.json()
    } catch (error) {
      return { todayPv: 0, todayUv: 0, totalVisits: 0, totalDownloads: 0 }
    }
  }

  // 🌟 17. 获取实时访问日志明细 (支持分页传参)
  const fetchAccessLogs = async (limit = 100, offset = 0) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/logs?limit=${limit}&offset=${offset}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('获取访问日志失败')
      return await res.json() // 这里现在返回的是 { total: Number, data: Array }
    } catch (error) {
      return { total: 0, data: [] }
    }
  }

  // 🌟 17.5 管理员清空访问日志
  const clearAccessLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/logs`, { method: 'DELETE', headers: getAuthHeaders() })
      if (!res.ok) throw new Error('清空日志失败')
      return await res.json()
    } catch (error) {
      console.error('清空日志失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 🌟 18. 后台登录校验与验证码触发
  const adminLogin = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const result = await response.json()
      
      if (result.success) {
        isAdminLoggedIn.value = true
        localStorage.setItem('745269_admin_token', result.token) // 签发本地门票
        return { success: true }
      } else {
        return { success: false, error: result.error, requireCaptcha: result.requireCaptcha }
      }
    } catch (error) {
      return { success: false, error: '网络错误，无法连接到验证服务器' }
    }
  }

  // 🌟 19. 退出登录（同时通知服务端撤销这个会话，而不是只清本地缓存）
  const adminLogout = () => {
    fetch(`${API_BASE_URL}/api/logout`, { method: 'POST', headers: getAuthHeaders() }).catch(() => {})
    isAdminLoggedIn.value = false
    localStorage.removeItem('745269_admin_token')
  }

  const historyTags = ref([])

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tags`)
      if (response.ok) {
        historyTags.value = await response.json()
      }
    } catch (error) {
      console.error('获取全局标签失败:', error)
    }
  }

  
// ====== 20 IP 定位功能 ======
const ipLocationMap = ref({})
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseIps = async (ipArray) => {
  // 1. 去重并过滤掉空数据
  const uniqueIps = [...new Set(ipArray.filter(Boolean))];
  
  for (const ip of uniqueIps) {
    // 2. 核心：如果这个 IP 之前已经查过了，直接跳过！极速秒开！
    if (ipLocationMap.value[ip]) continue;

    // 3. 拦截本地局域网 IP
    if (ip === 'unknown_ip' || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('172.')) {
      ipLocationMap.value[ip] = '局域网 / 本地';
      continue;
    }
    
    // 4. 发起 API 请求
    try {
      const response = await fetch(`https://ipwho.is/${ip}?lang=zh-CN`);
      const data = await response.json();
      
      if (data.success) {
        const prov = data.region || '';
        const city = data.city || '';
        const isp = data.connection?.isp ? ` (${data.connection.isp})` : '';
        ipLocationMap.value[ip] = prov === city ? `${city}${isp}` : `${prov} ${city}${isp}`;
      } else {
        ipLocationMap.value[ip] = '解析受限';
      }
    } catch (error) {
      ipLocationMap.value[ip] = '定位超时';
    }

    // 5. 每次查完歇 300 毫秒，完美绕过免费 API 接口的防刷拦截
    await sleep(300);
  }
}

  const saveTags = async (tagsArray) => {
    try {
      await fetch(`${API_BASE_URL}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ tags: tagsArray })
      })
      await fetchTags()
    } catch (error) {
      console.error('保存标签失败:', error)
    }
  }

  return {
    isLoading,
    allGames,
    hasMore,
    fetchGames,
    saveGame,
    deleteGame,
    uploadImage,
    fetchSearchFromServer, 
    fetchGameById,
    formatAdminTableData,
    historyTags,
    fetchTags,
    saveTags,
    recordInteraction,
    submitFeedback,
    fetchFeedbacks,
    toggleFeedbackStatus,
    deleteFeedback,
    fetchUsers,
    addUser,
    deleteUser,
    fetchAnalyticsSummary,
    fetchAccessLogs,
    isAdminLoggedIn,
    adminLogin,
    adminLogout,   //
    clearAccessLogs, // 新增清空访问日志方法
    ipLocationMap,  // 新增 IP 位置映射
    parseIps,      // 新增 IP 定位方法
    toggleGameStatus // 新增上下架状态切换方法
  }
})