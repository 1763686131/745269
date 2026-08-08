<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 🎯 无论用户在哪个页面（首页/详情页/后台）按 F5 刷新，
  // 根组件 App.vue 都会第一时间读取本地缓存，恢复黑夜/白天模式！
  const savedTheme = localStorage.getItem('theme') || localStorage.getItem('745269_theme')
  
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
    // 如果你的主题是加在 body 上的，就用：document.body.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="gamesHome"> <component :is="Component" />
    </keep-alive>
  </router-view>
  <!-- <gameshome></gameshome> -->
      <!-- <Detail /> -->
    <!-- <GameList></GameList> -->
</template>

<style>

</style>
