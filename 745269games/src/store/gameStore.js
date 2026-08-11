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
      
      const fetchLimit = 20; 
      let url = `${API_BASE_URL}/api/games?limit=${fetchLimit}&offset=${currentOffset.value}`
      if (tags) {
        url += `&tags=${encodeURIComponent(tags)}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('网络请求失败')
      const data = await response.json()
      
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

  // 2. 保存游戏
  const saveGame = async (gameData) => {
    isLoading.value = true
    try {
      const isEdit = !!gameData.id
      const url = isEdit ? `${API_BASE_URL}/api/games/${gameData.id}` : `${API_BASE_URL}/api/games`
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      })
      const result = await response.json()
      if (result.success) {
        await fetchGames(false)
        return true 
      } else {
        throw new Error(result.error || '保存失败')
      }
    } catch (error) {
      alert('保存失败: ' + error.message)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 3. 删除游戏
  const deleteGame = async (id) => {
    if (!confirm('🚨 确定要下架并永久删除这款游戏吗？该操作不可逆！')) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        allGames.value = allGames.value.filter(game => game.id !== id)
      }
    } catch (error) {}
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
      const response = await fetch(`${API_BASE_URL}/api/games/search?q=${encodeURIComponent(keyword)}`)
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
      downloadCount: game.download_count || 0 
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
      
      // 如果后端判定一天内提交过了，或者有其他错误，抛出给前端弹窗
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
      const response = await fetch(`${API_BASE_URL}/api/feedbacks`)
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
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API_BASE_URL}/api/feedbacks/${id}`, { method: 'DELETE' })
      return true
    } catch (error) {
      return false
    }
  }

  // 🌟 13. 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`)
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
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' })
      return true
    } catch (error) {
      return false
    }
  }

  // 🌟 16. 获取访问统计数据概要
  const fetchAnalyticsSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/summary`)
      if (!res.ok) throw new Error('获取流量概要失败')
      return await res.json()
    } catch (error) {
      return { todayPv: 0, todayUv: 0, totalVisits: 0, totalDownloads: 0 }
    }
  }

  // 🌟 17. 获取实时访问日志明细
  const fetchAccessLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/logs`)
      if (!res.ok) throw new Error('获取访问日志失败')
      return await res.json()
    } catch (error) {
      return []
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

  // 🌟 19. 退出登录
  const adminLogout = () => {
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

  const saveTags = async (tagsArray) => {
    try {
      await fetch(`${API_BASE_URL}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    adminLogout
  }
})