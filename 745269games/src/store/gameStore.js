import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE_URL = 'http://localhost:8787'

export const useGameStore = defineStore('game', () => {
  const isLoading = ref(false)
  const allGames = ref([]) 
  
  const currentOffset = ref(0)
  const hasMore = ref(true)

  // 💡 无敌组装机：自动把数据库的散装字段 (title_zh, downloads_json) 
  // 100% 还原成首页的标准嵌套结构 (title: {zh_CN}, downloads: [])
  const parseGameData = (rawGame) => {
    if (!rawGame) return null
    const game = { ...rawGame }

    // ======== 🎯 核心修复：把扁平的数据库字段，组装成页面 v-for 需要的标准结构 ========
    
    // 1. 组装标题
    if (game.title_zh !== undefined || game.title_en !== undefined) {
      game.title = {
        zh_CN: game.title_zh || '',
        en_US: game.title_en || ''
      }
    }

    // 2. 组装媒体图片
    if (game.cover_url !== undefined || game.media_screenshots_json !== undefined) {
      let screenshots = []
      if (game.media_screenshots_json) {
        try { screenshots = JSON.parse(game.media_screenshots_json) } catch (e) {}
      }
      game.media = {
        cover: game.cover_url || '',
        screenshots: screenshots
      }
    }

    // 3. 组装下载列表
    if (game.downloads_json) {
      try { game.downloads = JSON.parse(game.downloads_json) } catch (e) {}
    }

    // 4. 组装别名
    if (game.aliases_json) {
      try { game.aliases = JSON.parse(game.aliases_json) } catch (e) {}
    }

    // 5. 组装分类元数据
    if (game.metadata_json) {
      try { game.metadata = JSON.parse(game.metadata_json) } catch (e) {}
    }

    // =====================================================================

    // 兜底兼容：如果是首页搜索返回的本来就是标准结构，确保里面的字符串被转成对象
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

    return game
  }

  // 1. 获取分页游戏列表
  const fetchGames = async (isLoadMore = false) => {
    if (isLoading.value || (!hasMore.value && isLoadMore)) return
    isLoading.value = true
    try {
      if (!isLoadMore) {
        currentOffset.value = 0
        allGames.value = []
        hasMore.value = true
      }
      const response = await fetch(`${API_BASE_URL}/api/games?limit=10&offset=${currentOffset.value}`)
      if (!response.ok) throw new Error('网络请求失败')
      const data = await response.json()
      if (data.length < 10) hasMore.value = false
      
      const parsedData = (Array.isArray(data) ? data : []).map(parseGameData)
      allGames.value.push(...parsedData)
      currentOffset.value += 10
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

  // ================= 🌟 5. 真实服务端搜索 API 请求 =================
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
      console.error('%c🚨 服务端搜索崩溃了！', 'color: white; background: red; font-size: 14px; padding: 4px;', error.message)
      return [] 
    }
  }

  // ================= 🌟 6. 按 ID 获取单条数据 =================
  const fetchGameById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/${id}`)
      if (!response.ok) throw new Error('未找到该游戏')
      
      const rawData = await response.json()
      const singleRaw = Array.isArray(rawData) ? rawData[0] : rawData
      
      // 🎯 无论数据库吐出来多丑的数据，直接被 parseGameData 组装成标准结构！
      const parsedGame = parseGameData(singleRaw)
      
      if (parsedGame) {
        allGames.value = [parsedGame] // 依然存进 Pinia 给你备用
      }
      return parsedGame
    } catch (error) {
      console.error('获取单条游戏失败:', error)
      return null
    }
  }

  // 7. 后台表格数据清洗引擎
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

  const historyTags = ref([])

  // 去服务器拉取全局标签
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

  // 把新标签存入服务器
  const saveTags = async (tagsArray) => {
    try {
      await fetch(`${API_BASE_URL}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: tagsArray })
      })
      await fetchTags() // 存完后重新拉取一次最新列表
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
    saveTags
  }
})