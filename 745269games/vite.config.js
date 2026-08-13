import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },


  // 配置开发服务器的代理，解决跨域问题
  server: {
    port: 5173, // 前端开发服务器端口
    proxy: {
      // 拦截所有以 /api 开头的请求
      '/api': {
        target: 'http://localhost:1233', // 转发到你的真实后端（Docker 容器或本地 Node）
        changeOrigin: true, // 允许跨域
      }
    }
  }
})