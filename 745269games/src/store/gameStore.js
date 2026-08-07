import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 🌟 配置你的本地服务端基础地址 (上线后这里换成你的正式域名)
const API_BASE_URL = 'http://localhost:8787'

export const useGameStore = defineStore('game', () => {
  const isLoading = ref(false)
  const allGames = ref([])

  // ================= 1. 获取游戏列表 (GET) =================
  const fetchGames = async () => {
    isLoading.value = true
    try {
      const response = await fetch(`${API_BASE_URL}/api/games`)
      if (!response.ok) throw new Error('网络请求失败')
      const data = await response.json()
      // 直接把数据库洗好的真实数据存入 Pinia
      allGames.value = data
    } catch (error) {
      console.error('获取游戏列表失败:', error)
      alert('获取数据失败，请检查服务端是否已启动 (npx wrangler dev)')
    } finally {
      isLoading.value = false
    }
  }

  // ================= 2. 保存/更新游戏 (POST / PUT) =================
  const saveGame = async (gameData) => {
    isLoading.value = true
    try {
      // 判断是有 ID 还是没有 ID，决定是修改还是新增
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
        // 🌟 成功后，重新从数据库拉取一次最新列表，保证数据绝对同步
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

  // ================= 3. 删除游戏 (DELETE) =================
  const deleteGame = async (id) => {
    if (!confirm('🚨 确定要下架并永久删除这款游戏吗？该操作不可逆！')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/games/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        // 从本地列表中移除该项，页面会秒刷新
        allGames.value = allGames.value.filter(game => game.id !== id)
      } else {
        throw new Error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除游戏失败:', error)
      alert('删除失败: ' + error.message)
    }
  }

  // ================= 4. 上传单张图片 (POST) =================
  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData // FormData 不需要手动设 Content-Type，浏览器会自动处理
      })
      const result = await response.json()
      if (result.success) {
        return result.url // 返回云端图片的真实外链
      }
      return null
    } catch (error) {
      console.error('图片上传失败:', error)
      return null
    }
  }

  // ================= 5. 计算属性 (清洗给后台表格用) =================
  const adminTableData = computed(() => {
    return allGames.value.map(game => ({
      id: game.id,
      cover: game.media?.cover || '',
      nameZh: game.title?.zh_CN || '未命名',
      nameEn: game.title?.en_US || '',
      // 格式化数据库的 UTC 时间为本地时间
      date: game.system?.created_at ? new Date(game.system.created_at).toLocaleDateString() : '-',
      platforms: game.metadata?.platforms || [],
      tags: game.metadata?.genres || [],
      downloads: game.downloads?.length || 0
    }))
  })

  return {
    isLoading,
    allGames,
    adminTableData,
    fetchGames,
    saveGame,
    deleteGame,
    uploadImage // 暴露出图片上传方法给组件用
  }
})