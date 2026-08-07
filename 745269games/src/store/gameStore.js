import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE_URL = 'http://localhost:8787'

export const useGameStore = defineStore('game', () => {
  const isLoading = ref(false)
  const allGames = ref([])

  // ================= 1. 获取游戏列表 =================
  const fetchGames = async () => {
    isLoading.value = true
    try {
      const response = await fetch(`${API_BASE_URL}/api/games`)
      if (!response.ok) throw new Error('网络请求失败')
      allGames.value = await response.json()
    } catch (error) {
      console.error('获取游戏列表失败:', error)
      alert('获取数据失败，请检查服务端是否已启动')
    } finally {
      isLoading.value = false
    }
  }

  // ================= 2. 保存/更新游戏 =================
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
        await fetchGames()
        return true 
      } else {
        throw new Error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存游戏失败:', error)
      alert('保存失败: ' + error.message)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ================= 3. 删除游戏 =================
  const deleteGame = async (id) => {
    if (!confirm('🚨 确定要下架并永久删除这款游戏吗？该操作不可逆！')) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        allGames.value = allGames.value.filter(game => game.id !== id)
      } else {
        throw new Error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除游戏失败:', error)
      alert('删除失败: ' + error.message)
    }
  }

  // ================= 4. 上传单张图片 =================
  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (result.success) return result.url 
      return null
    } catch (error) {
      console.error('图片上传失败:', error)
      return null
    }
  }

  // ================= 🌟 5. 全局公共搜索方法 (前后台通用) =================
  const searchGames = (keyword) => {
    // 如果没有输入关键字，直接返回完整列表
    if (!keyword || !keyword.trim()) return allGames.value
    
    // 把用户输入的关键字转成小写，去掉首尾空格
    const lowerKw = keyword.trim().toLowerCase()
    
    return allGames.value.filter(game => {
      // 提取数据库中的中英文标题，并同样转成小写
      const zh = (game.title?.zh_CN || '').toLowerCase()
      const en = (game.title?.en_US || '').toLowerCase()
      
      // 只要中文包含该关键字，或者英文包含该关键字，就通过过滤
      return zh.includes(lowerKw) || en.includes(lowerKw)
    })
  }

  // ================= 🌟 6. 后台表格数据清洗引擎 =================
  // 为了让搜索后的数据能正确渲染在后台表格上，把原先的 computed 抽成清洗方法
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
      downloadCount: game.download_count || 0 // 对接未来的真实点击量字段
    }))
  }

  return {
    isLoading,
    allGames,
    fetchGames,
    saveGame,
    deleteGame,
    uploadImage,
    searchGames,         // 对外暴露公共搜索方法
    formatAdminTableData // 对外暴露清洗引擎
  }
})