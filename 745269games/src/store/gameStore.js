import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE_URL = 'http://localhost:8787'

export const useGameStore = defineStore('game', () => {
  const isLoading = ref(false)
  const allGames = ref([]) 
  
  const currentOffset = ref(0)
  const hasMore = ref(true)

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
      allGames.value.push(...data)
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

  // ================= 🌟 5. 真实服务端搜索 API 请求 (带错误深度侦测) =================
  const fetchSearchFromServer = async (keyword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/search?q=${encodeURIComponent(keyword)}`)
      
      // 如果后端没返回 200，截获真实报错文本！
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`[HTTP 状态码: ${response.status}] 详情: ${errText}`)
      }
      
      return await response.json()
    } catch (error) {
      // 在控制台用大红字打印到底是因为啥失败的
      console.error('%c🚨 服务端搜索崩溃了！具体错误原因如下：', 'color: white; background: red; font-size: 14px; padding: 4px;', error.message)
      return [] 
    }
  }

  // 6. 后台表格数据清洗引擎
  const formatAdminTableData = (rawGamesArray) => {
    return rawGamesArray.map(game => ({
      id: game.id,
      cover: game.media?.cover || '',
      nameZh: game.title?.zh_CN || '未命名',
      nameEn: game.title?.en_US || '',
      date: game.system?.created_at ? new Date(game.system.created_at).toLocaleDateString() : '-',
      platforms: game.metadata?.platforms || [],
      tags: game.metadata?.genres || [],
      downloads: game.downloads?.length || 0,
      downloadCount: game.download_count || 0 
    }))
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
    formatAdminTableData 
  }
})