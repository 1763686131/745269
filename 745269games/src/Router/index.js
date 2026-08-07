import { createRouter, createWebHistory } from 'vue-router'
// 导入你的页面组件
import GameList from '../views/admin/GameList.vue'
import GamesHome from '../views/front/gamesHome.vue' // 假设这是你的前台首页组件

const routes = [
  // 1. 前台首页路由 (访问 http://localhost:5173/)
  {
    path: '/',
    name: 'Home',
    component: GamesHome
  },
  // 2. 后台上传路由 (访问 http://localhost:5173/admin/shangchuan)
  {
    path: '/admin/shangchuan',
    name: 'AdminUpload', // 后台管理页面
    component: GameList
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 模式的路由 (不带 # 号)
  routes,
})

export default router