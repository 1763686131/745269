import { createRouter, createWebHistory } from 'vue-router'
// 导入你的页面组件
import GameList from '../views/admin/GameList.vue'
import GamesHome from '../views/front/gamesHome.vue' // 前台首页组件
import GameDetail from '../views/front/GameDetail.vue' // 游戏详情组件
import Column from '../views/front/Column.vue' // 游戏栏目组件

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
  },
  // 动态路由，:id 代表将会接收一个具体的游戏编号
  { 
    path: '/game/:id', 
    component: GameDetail
  },
  {
    path: '/Column/:id', // 匹配所有未定义的路由
    name: 'Column', // 游戏栏目
    component: Column 
  },
  // 🌟 5. 兜底路由：捕获所有未匹配的错误/乱码路径，统一重定向回首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 模式的路由 (不带 # 号)
  routes,
})

export default router