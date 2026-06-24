
// router/index.js (举例)
import { createRouter, createWebHistory } from 'vue-router'
// import Home from '../views/Home.vue' // 你写的第一个组件
import CategoryDetail from "../Router/CategoryDetail.vue" // 你写的第二个组件

const routes = [
  { path: '/', name: 'Home', component: Home },
  // 这里配置带动态参数的路由，:categoryId 就是分类的传值口
  { path: '/category/:categoryId', name: 'Category', component: CategoryDetail }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
export default router