import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义并导出一个名为 useGameStore 的仓库
export const useGameStore = defineStore('game', () => {
  
  // 1. 🌟 State (状态数据)：相当于原来的 data
  const isLoading = ref(false)
  const displayLimit = ref(10) // 默认显示10个
  const sortOrder = ref('newest') // 排序状态也存进仓库
  
  // 模拟从数据库拿到的完整数据
  const allGames = ref([
    { id: 1, title: '双人成行', desc: '踏上生命中最疯狂的旅程。邀请好友通过远程同乐一起免费游玩，体验各种搞笑而混乱的合作游戏挑战。', rating: '9.8', tags: [{name: '双人', type: 'mode'}, {name: 'SWITCH', type: 'platform'}, {name: 'PC', type: 'platform'}] },
    { id: 2, title: '赛博朋克：边缘行者', desc: '在这款开放世界动作冒险 RPG 中，你将扮演一名赛博朋克雇佣兵。探索夜之城。', rating: '9.5', tags: [{name: '单人', type: 'mode'}, {name: 'PC', type: 'platform'}, {name: 'PS5', type: 'platform'}] },
    { id: 3, title: '空洞骑士', desc: '在宏大的地下废墟中探险。躲避陷阱，击败游荡的虫子，解开古老的谜团。', rating: '9.6', tags: [{name: '单人', type: 'mode'}, {name: 'SWITCH', type: 'platform'}, {name: 'PC', type: 'platform'}] },
    { id: 4, title: '马力欧卡丁车 8', desc: '随时随地，享受竞速乐趣。', rating: '9.2', tags: [{name: '多人同屏', type: 'mode'}, {name: 'SWITCH', type: 'platform'}] },
    { id: 5, title: '胡闹厨房 2', desc: '带着全新的烹饪行动回来了！重返洋葱王国，组建多达四人的大厨团队。', rating: '8.9', tags: [{name: '多人合作', type: 'mode'}, {name: 'PC', type: 'platform'}, {name: 'SWITCH', type: 'platform'}] },
    { id: 6, title: '荒野大镖客：救赎 2', desc: '述说亚瑟·摩根和声名狼藉的范德林德帮派的传奇故事。', rating: '9.9', tags: [{name: '单人', type: 'mode'}, {name: 'PC', type: 'platform'}, {name: 'PS4', type: 'platform'}] },
    { id: 7, title: '塞尔达传说：旷野之息', desc: '醒来吧，林克。探索一个广阔、美丽、危险的开放世界。', rating: '10.0', tags: [{name: '单人开放世界', type: 'mode'}, {name: 'SWITCH', type: 'platform'}] },
    { id: 8, title: '星露谷物语', desc: '继承爷爷的农场，拿起工具和几枚硬币，开始你的新生活。', rating: '9.7', tags: [{name: '模拟经营', type: 'mode'}, {name: 'PC', type: 'platform'}, {name: 'SWITCH', type: 'platform'}] },
    { id: 9, title: '怪物猎人：世界', desc: '在新大陆上狩猎巨大的怪物，收集材料打造更强的武器和防具。', rating: '9.3', tags: [{name: '多人联机', type: 'mode'}, {name: 'PC', type: 'platform'}, {name: 'PS4', type: 'platform'}] },
    { id: 10, title: '泰拉瑞亚', desc: '挖掘，战斗，探索，建造！在这个充满无限可能的 2D 像素世界中创造属于你的冒险。', rating: '9.6', tags: [{name: '沙盒', type: 'mode'}, {name: 'PC', type: 'platform'}, {name: 'SWITCH', type: 'platform'}] },
    { id: 11, title: '极限竞速：地平线 5', desc: '在墨西哥充满活力和不断变化的开放世界中，驾驶上百辆世界级的顶级豪车。', rating: '9.4', tags: [{name: '竞速', type: 'mode'}, {name: 'PC', type: 'platform'}] },
    { id: 12, title: '死亡细胞', desc: '融合了类银河恶魔城与 Roguelite 元素的 2D 动作游戏。在一次次死亡中磨练技巧。', rating: '9.1', tags: [{name: '动作 Roguelite', type: 'mode'}, {name: 'PC', type: 'platform'}, {name: 'SWITCH', type: 'platform'}] },
  ])

  // 2. 🌟 Getters (计算属性)：帮你处理数据的逻辑
  const displayedGames = computed(() => allGames.value.slice(0, displayLimit.value))
  const hasMore = computed(() => displayLimit.value < allGames.value.length)
  const totalCount = computed(() => allGames.value.length)

  // 3. 🌟 Actions (动作方法)：修改数据或请求接口的地方
  const loadMore = () => {
    if (isLoading.value) return
    isLoading.value = true
    
    // 模拟网络请求延迟，未来你可以在这里用 axios.get() 替换
    setTimeout(() => {
      displayLimit.value += 10
      isLoading.value = false
    }, 800)
  }

  // 修改排序方式
  const setSortOrder = (order) => {
    sortOrder.value = order
    // 未来可以在这里重新向后端发起带排序参数的请求
  }

  // 必须把需要给页面使用的变量和方法 return 出去
  return {
    isLoading,
    sortOrder,
    allGames,
    displayedGames,
    hasMore,
    totalCount,
    loadMore,
    setSortOrder
  }
})