import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // ================= 1. 状态 (State) =================
  const isLoading = ref(false)
  const allGames = ref([]) // 核心数据源

  // ================= 2. 动作 (Actions) =================
  // 模拟从后端/本地获取数据 (未来这里直接换成 axios 请求)
  const fetchGames = async () => {
    isLoading.value = true
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟你 games.json 的完整数据结构存入
    allGames.value = [
      {
        id: 1001,
        title: { zh_CN: "塞尔达传说：旷野之息", en_US: "The Legend of Zelda: Breath of the Wild" },
        metadata: { platforms: ["PC", "Switch"], genres: ["动作", "开放世界"] },
        media: { cover: "https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=100&h=100&fit=crop" },
        system: { created_at: "2026-06-23" },
        downloads: 12500 // 模拟下载量
      },
      {
        id: 1002,
        title: { zh_CN: "双人成行", en_US: "It Takes Two" },
        metadata: { platforms: ["PC", "PS5"], genres: ["双人", "冒险"] },
        media: { cover: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop" },
        system: { created_at: "2026-06-25" },
        downloads: 8300
      }
    ]
    isLoading.value = false
  }

  // 模拟删除游戏操作 (后台用)
  const deleteGame = (id) => {
    // 过滤掉被删除的 ID
    allGames.value = allGames.value.filter(game => game.id !== id)
    // 未来这里需要调用 api.delete(`/games/${id}`)
  }

  // ================= 3. 计算属性 (Getters) =================
  // 给后台列表用的数据格式 (清洗一下数据方便表格展示)
  const adminTableData = computed(() => {
    return allGames.value.map(game => ({
      id: game.id,
      cover: game.media.cover,
      nameZh: game.title.zh_CN,
      nameEn: game.title.en_US,
      date: game.system.created_at,
      platforms: game.metadata.platforms,
      tags: game.metadata.genres,
      downloads: game.downloads
    }))
  })

  // 暴露给组件使用
  return {
    isLoading,
    allGames,
    adminTableData,
    fetchGames,
    deleteGame
  }
})