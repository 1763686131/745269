<template>
  <div class="site-root-container">
    
    <header class="global-navbar">
      <div class="navbar-inner">
        
        <div class="site-logo">
          <span class="text-dark">745269</span><span class="text-blue">.com</span>
        </div>

        <nav class="desktop-navigation">
          <button class="platform-btn" @click="handlePlatformClick('SWITCH')">SWITCH</button>
          <button class="platform-btn" @click="handlePlatformClick('PC')">PC</button>
          <button class="platform-btn" @click="handlePlatformClick('PS4')">PS4</button>
        </nav>

        <button 
          class="mobile-hamburger-trigger" 
          :class="{ 'menu-is-active': isMobileMenuOpen }"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <span class="bar-line"></span>
          <span class="bar-line"></span>
          <span class="bar-line"></span>
        </button>

      </div>

      <transition name="menu-slide">
        <div v-if="isMobileMenuOpen" class="mobile-dropdown-menu">
          <button class="mobile-menu-item" @click="handlePlatformClick('SWITCH'); isMobileMenuOpen = false">SWITCH</button>
          <button class="mobile-menu-item" @click="handlePlatformClick('PC'); isMobileMenuOpen = false">PC</button>
          <button class="mobile-menu-item" @click="handlePlatformClick('PS4'); isMobileMenuOpen = false">PS4</button>
        </div>
      </transition>
    </header>

    <main class="center-search-section">
      <div class="search-content-wrapper">
        
        <div class="brand-title-zone">
          <h1 class="brand-glitch-title" data-text="745269.com">745269.com</h1>
        </div>

        <div class="capsule-search-bar">
          <div class="search-icon-box">
            <svg class="magnifier-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="搜索游戏、攻略、密令..."
            class="search-core-input"
            @keyup.enter="executeSearch"
          />
          
          <button class="search-go-btn" @click="executeSearch">GO</button>
        </div>

      </div>
    </main>

    <footer class="global-footer">
      <p>&copy; 2026 745269.COM. All Rights Reserved.</p>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const searchQuery = ref('')
const isMobileMenuOpen = ref(false)

const handlePlatformClick = (platform) => {
  console.log(`已选择平台: ${platform}`)
}

const executeSearch = () => {
  if (!searchQuery.value.trim()) return
  alert(`正在为您检索: ${searchQuery.value}`)
}
</script>

<style scoped>
/* ==================== 🛠️ 全局样式强力渗透与重置 ==================== */
:global(html), :global(body), :global(#app) {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 100vh !important;
  background-color: #ffffff !important;
}

/* 组件根容器 */
.site-root-container {
  width: 100% !important;
  min-height: 100vh !important;
  background-color: #ffffff !important;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
  position: relative;
}

.site-root-container * {
  box-sizing: border-box;
}

/* ==================== 顶部导航栏 ==================== */
.global-navbar {
  width: 100%;
  height: 70px; /* 略微拉高，更显大气 */
  background-color: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  z-index: 999;
}
.navbar-inner {
  max-width: 1400px; /* 放宽内衬 */
  height: 100%;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-logo {
  font-size: 24px; /* 放大Logo */
  font-weight: 900;
  letter-spacing: -0.5px;
  user-select: none;
}
.text-dark { color: #0f172a; }
.text-blue { color: #2563eb; }

/* 电脑端菜单 */
.desktop-navigation {
  display: flex;
  gap: 16px;
}
.platform-btn {
  background: transparent;
  color: #2563eb;
  border: 1px solid #e0f2fe;
  padding: 8px 24px; /* 增大按钮 */
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.platform-btn:hover {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 4px 14px rgba(37, 99, 211, 0.18);
}

/* 移动端汉堡按钮：电脑端隐藏 */
.mobile-hamburger-trigger {
  display: none;
  background: transparent;
  border: none;
  width: 26px;
  height: 18px;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  cursor: pointer;
}
.bar-line {
  display: block;
  width: 100%;
  height: 2.5px;
  background-color: #1e293b;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* ==================== 核心搜索区域（大格局重构） ==================== */
.center-search-section {
  flex-grow: 1;
  display: flex;
  align-items: center;     /* 真正的物理垂直居中 */
  justify-content: center;   /* 真正的水平居中 */
  padding: 0 40px;
}
.search-content-wrapper {
  width: 100%;
  max-width: 780px; /* 💡 关键修改：从580px大幅拉宽至780px，尽显大气 */
  text-align: center;
  transform: translateY(-35px); /* 减去顶部导航对视觉重心的遮挡，达到纯视觉意义上的绝对中央 */
}

/* 品牌大标题 */
.brand-title-zone {
  margin-bottom: 40px; /* 拉开间距 */
}
.brand-glitch-title {
  font-size: 72px; /* 💡 关键修改：从46px直接暴增到72px！极具视觉冲击力 */
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2px;
  margin: 0;
  position: relative;
  display: inline-block;
}
/* 红蓝立体科技阴影 */
.brand-glitch-title::before,
.brand-glitch-title::after {
  content: attr(data-text);
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
}
.brand-glitch-title::before { left: -2px; text-shadow: 2px 0 rgba(239, 68, 68, 0.18); }
.brand-glitch-title::after { left: 2px; text-shadow: -2px 0 rgba(37, 99, 211, 0.18); }

/* 奢华尺寸的胶囊输入框 */
.capsule-search-bar {
  width: 100%;
  height: 64px; /* 💡 关键修改：高度从54px增加到64px，更加舒展高级 */
  background-color: #ffffff;
  border: 2px solid #cbd5e1; /* 颜色略微加深，强化边缘存在感 */
  border-radius: 100px;
  display: flex;
  align-items: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.capsule-search-bar:focus-within {
  border-color: #2563eb;
  box-shadow: 0 16px 45px rgba(37, 99, 211, 0.16);
  transform: scale(1.01); /* 聚焦时微微放大，动效极高级 */
}

.search-icon-box {
  padding-left: 24px;
  display: flex;
  align-items: center;
}
.magnifier-icon {
  width: 24px; /* 图标同步变大 */
  height: 24px;
  color: #94a3b8;
  transition: color 0.3s;
}
.capsule-search-bar:focus-within .magnifier-icon {
  color: #2563eb;
}

.search-core-input {
  flex-grow: 1;
  height: 100%;
  border: none !important;
  background: transparent !important;
  padding: 0 20px;
  font-size: 18px; /* 字体增大到18px */
  color: #0f172a;
  outline: none !important;
}
.search-core-input::placeholder {
  color: #94a3b8;
}

.search-go-btn {
  background: #2563eb;
  color: #ffffff;
  border: none;
  height: 100%;
  padding: 0 40px; /* 宽度加宽 */
  font-size: 18px; /* 字体加大 */
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 1px;
  transition: background-color 0.2s;
}
.search-go-btn:hover {
  background-color: #1d4ed8;
}

/* 页脚 */
.global-footer {
  width: 100%;
  padding: 28px 0;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  border-top: 1px solid #f8fafc;
}

/* ==================== 📱 移动端完美适配与强制居中 (断点: 768px) ==================== */
@media (max-width: 768px) {
  /* 隐藏电脑端菜单 */
  .desktop-navigation {
    display: none !important;
  }

  /* 显示移动端汉堡按钮 */
  .mobile-hamburger-trigger {
    display: flex !important;
  }

  /* 汉堡按钮变交叉动画 */
  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }
  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(2) {
    opacity: 0;
  }
  .mobile-hamburger-trigger.menu-is-active .bar-line:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }

  /* 手机端下拉菜单 */
  .mobile-dropdown-menu {
    position: absolute;
    top: 70px;
    left: 0;
    width: 100%;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
    z-index: 998;
  }
  .mobile-menu-item {
    width: 100%;
    background-color: #f8fafc;
    color: #2563eb;
    border: 1px solid #e2e8f0;
    padding: 14px 0;
    font-size: 15px;
    font-weight: 700;
    border-radius: 10px;
    cursor: pointer;
  }
  .mobile-menu-item:active {
    background-color: #2563eb;
    color: #ffffff;
  }

  /* 💡 移动端重置：剔除所有对顶部的偏置，利用Flex达成绝对上下正中央居中 */
  .center-search-section {
    padding: 0 20px;
  }
  .search-content-wrapper {
    transform: translateY(0); /* 清除偏移，回归完全居中位置 */
  }
  .brand-glitch-title {
    font-size: 40px; /* 移动端标题保持精细适中 */
    letter-spacing: -1px;
  }
  .capsule-search-bar {
    height: 52px; /* 移动端搜索框高度回缩，确保舒适的单手操作比例 */
  }
  .search-core-input {
    font-size: 15px;
    padding: 0 12px;
  }
  .magnifier-icon {
    width: 20px;
    height: 20px;
  }
  .search-go-btn {
    padding: 0 28px;
    font-size: 15px;
  }

  /* 下拉动画效果 */
  .menu-slide-enter-active, .menu-slide-leave-active {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .menu-slide-enter-from, .menu-slide-leave-to {
    opacity: 0;
    transform: translateY(-15px);
  }
}
</style>