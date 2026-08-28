<template>
  <div v-if="!isAdminRoute" class="floating-buttons-wrapper">
    <!-- 1. 返回顶部按钮 -->
    <transition name="fade">
      <button
        v-if="showScrollTop"
        class="float-btn btn-scroll-top"
        @click="scrollToTop"
        title="返回顶部"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
        <span class="tooltip">返回顶部</span>
      </button>
    </transition>

    <!-- 🎰 每日抽奖按钮 (🌟 在游戏详情页隐藏) -->
    <button
      v-if="!isGameDetailPage"
      class="float-btn lottery-btn"
      @click="openLotteryModal"
      title="每日抽奖"
    >
      <div class="lottery-card-icon"></div>
      <!-- 提示气泡 -->
      <transition name="tooltip-fade">
        <span v-if="showLotteryTip" class="lottery-tip">
          不知道玩啥？点击我吧
        </span>
      </transition>
    </button>

    <!-- 2. 加QQ群按钮 -->
    <button
      class="float-btn btn-qq"
      @click="openQQModal"
      title="加入官方QQ群"
    >
      <svg class="qq-icon-svg" viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12 2C7.38 2 5.09 5.27 5.09 8.66c0 1.53.47 2.38.83 3.09-.43.51-.76 1.12-.94 1.83-.34 1.37-.08 2.57.73 3.32 1.15 1.07 3.05.5 4.19-.13.7.35 1.48.56 2.31.56 1.16 0 2.22-.4 3.11-1.07.64.38 1.53.76 2.37.76.62 0 1.17-.22 1.53-.63.78-.9 1-2.42.54-3.83-.2-.61-.51-1.14-.88-1.58.4-.73.91-1.63.91-3.21C20.18 5.41 17.52 2 12 2zm3.3 10c-.72 0-1.3-.58-1.3-1.3s.58-1.3 1.3-1.3 1.3.58 1.3 1.3-.58 1.3-1.3 1.3zm-6.6 0c-.72 0-1.3-.58-1.3-1.3s.58-1.3 1.3-1.3 1.3.58 1.3 1.3-.58 1.3-1.3 1.3z"/>
      </svg>
      <span class="tooltip">交流QQ群</span>
    </button>

    <!-- 3. 反馈问题按钮 -->
    <button
      class="float-btn btn-feedback"
      @click="openFeedbackModal"
      title="反馈问题 / 跪求资源"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="tooltip">反馈求资源</span>
    </button>

    <!-- 🌟 QQ群弹窗 -->
    <transition name="modal-fade">
      <div v-if="showQQModal" class="modal-overlay" @click.self="closeQQModal">
        <div class="qq-modal-container">
          <header class="modal-header">
            <h3>👥 官方玩家交流群</h3>
            <button class="close-btn" @click="closeQQModal">✕</button>
          </header>
          
          <div class="modal-body">
            <div class="qq-illustration">
              <span class="qq-avatar-badge">🎮</span>
            </div>
            
            <p class="qq-hint">
              欢迎加入官方交流群，与其他玩家一起分享好玩的游戏、交流通关攻略，有任何疑问或合作意向也可以随时联系群主哦！
            </p>

            <div class="qq-info-card">
              <div class="info-row">
                <span class="info-label">群名称：</span>
                <span class="info-value font-bold">745269.com 玩家交流群</span>
              </div>
              <div class="info-row">
                <span class="info-label">群号：</span>
                <span class="info-value qq-number font-bold">{{ qqGroupNumber }}</span>
              </div>
            </div>
            
            <div class="qq-qr-section" v-if="qqGroupQrCode">
              <div class="qr-border-wrap">
                <img :src="qqGroupQrCode" alt="QQ群二维码" class="qr-img" />
              </div>
              <span class="qr-tip">📱 手机QQ扫码即可快速入群</span>
            </div>
          </div>
          
          <footer class="modal-footer">
            <button class="btn-copy" @click="copyQQGroup">
              📋 复制群号
            </button>
            <a :href="qqGroupJoinLink" target="_blank" class="btn-join">
              ⚡ 一键加群
            </a>
          </footer>
        </div>
      </div>
    </transition>

    <!-- 🌟 现有的反馈问题弹窗 -->
    <FeedbackModal
      v-if="showFeedback"
      title="📝 意见反馈 / 资源求助"
      hint="如果您遇到游戏报错、网盘失效、解压密码错误，或者想要求某些好玩的游戏资源，请在下方留言，站长看到后会火速为您解决！"
      placeholder="请详细描述您的问题，例如：XX 游戏百度云链接失效了 / 想要 XX 游戏汉化版..."
      :gameId="0"
      gameName="【全站悬浮按钮】反馈与求助"
      @close="showFeedback = false"
    />

    <!-- 🌟 每日抽奖弹窗 -->
    <DailyLottery
      :isVisible="showLottery"
      @close="showLottery = false"
      @open="showLottery = true"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import FeedbackModal from '@/components/common/FeedbackModal.vue'
import DailyLottery from '@/components/common/DailyLottery.vue'

// ================= 🌟 基础配置 =================
const qqGroupNumber = ref('938491927') // 👈 QQ群号，可按需修改
const qqGroupJoinLink = ref('https://qm.qq.com/cgi-bin/qm/qr?k=T84Y57_y997DAtpYmB-eZ78g8f7h9i02') // 👈 一键加群Web连接
const qqGroupQrCode = ref('') // 👈 QQ群二维码，可配置图片外链，若无则不显示

// ================= 🌟 路由隐藏逻辑 =================
const route = useRoute()
const isAdminRoute = computed(() => {
  return route && route.path && route.path.startsWith('/admin')
})

// 🌟 新增：判断是否在游戏详情页
const isGameDetailPage = computed(() => {
  return route && route.path && route.path.startsWith('/game/')
})

// ================= 🌟 滚动顶部逻辑 =================
const showScrollTop = ref(false)

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 200
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// ================= 🌟 反馈弹窗逻辑 =================
const showFeedback = ref(false)
const openFeedbackModal = () => {
  showFeedback.value = true
}

// ================= 🌟 每日抽奖弹窗逻辑 =================
const showLottery = ref(false)
const showLotteryTip = ref(false)
let lotteryTipTimer = null

const openLotteryModal = () => {
  showLottery.value = true
  // 点击后停止提示
  showLotteryTip.value = false
  if (lotteryTipTimer) {
    clearInterval(lotteryTipTimer)
    lotteryTipTimer = null
  }
}

// 检查今天是否已经抽过卡
const checkTodayLottery = () => {
  const today = new Date().toLocaleDateString('zh-CN')
  const stored = localStorage.getItem('dailyLotteryCards')

  if (!stored) return false

  try {
    const data = JSON.parse(stored)
    return data.date === today && data.cards && data.cards.length > 0
  } catch {
    return false
  }
}

// 启动提示动画
const startLotteryTip = () => {
  // 如果今天已经抽过，不显示提示
  if (checkTodayLottery()) {
    return
  }

  // 每10秒显示一次提示，持续3秒
  lotteryTipTimer = setInterval(() => {
    // 再次检查是否已抽卡
    if (checkTodayLottery()) {
      clearInterval(lotteryTipTimer)
      lotteryTipTimer = null
      return
    }

    showLotteryTip.value = true
    setTimeout(() => {
      showLotteryTip.value = false
    }, 3000)
  }, 10000)

  // 首次立即显示
  showLotteryTip.value = true
  setTimeout(() => {
    showLotteryTip.value = false
  }, 3000)
}

// ================= 🌟 QQ群弹窗逻辑 =================
const showQQModal = ref(false)

const openQQModal = () => {
  showQQModal.value = true
}

const closeQQModal = () => {
  showQQModal.value = false
}

const copyQQGroup = async () => {
  try {
    await navigator.clipboard.writeText(qqGroupNumber.value)
    alert(`✅ 群号 ${qqGroupNumber.value} 复制成功！快去QQ搜索加入交流群吧！`)
  } catch (err) {
    alert(`❌ 复制失败：${err.message || '浏览器暂不支持一键复制'}`)
  }
}

// ================= 🌟 生命周期挂载 =================
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // 启动抽奖提示
  startLotteryTip()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  // 清除抽奖提示定时器
  if (lotteryTipTimer) {
    clearInterval(lotteryTipTimer)
    lotteryTipTimer = null
  }
})
</script>

<style scoped>
/* ================= 🌟 悬浮按钮容器 🌟 ================= */
.floating-buttons-wrapper {
  position: fixed;
  right: 24px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 9999;
}

/* 按钮通用样式 */
.float-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  color: var(--text-main);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  outline: none;
}

.float-btn:hover {
  transform: translateY(-3px);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* 独立按钮专属颜色 */
.btn-scroll-top:hover {
  background: var(--color-primary);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.btn-qq:hover {
  background: #12b7f5;
  box-shadow: 0 6px 16px rgba(18, 183, 245, 0.4);
}

.btn-lottery:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

.btn-feedback:hover {
  background: #f43f5e;
  box-shadow: 0 6px 16px rgba(244, 63, 94, 0.4);
}

/* ================= 🌟 抽奖按钮样式 ================= */
.lottery-btn {
  position: relative;
  /* 使用 CSS 变量适配主题 */
}

/* 卡片图标 - 长方形盒子 */
.lottery-card-icon {
  width: 20px;
  height: 28px;
  background: transparent;
  border-radius: 3px;
  border: 2px solid var(--text-main);
  position: relative;
  animation: cardGlow 2s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
  font-size: 16px;
  font-weight: bold;
}

.lottery-card-icon::before {
  content: '?';
}

/* 微光效果 */
@keyframes cardGlow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(102, 126, 234, 0);
    border-color: rgba(255, 255, 255, 0.6);
  }
  50% {
    box-shadow: 0 0 12px rgba(102, 126, 234, 0.8),
                0 0 16px rgba(102, 126, 234, 0.5);
    border-color: rgba(102, 126, 234, 1);
  }
}

/* 抽奖提示气泡 */
.lottery-tip {
  position: absolute;
  right: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  pointer-events: none;
  z-index: 10;
}

.lottery-tip::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid #764ba2;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.tooltip-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 💡 自定义精致气泡文字 */
.tooltip {
  position: absolute;
  right: 60px;
  background: rgba(15, 23, 42, 0.85);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translateX(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.float-btn:hover .tooltip {
  opacity: 1;
  transform: translateX(0);
}

/* 按钮微调 */
.qq-icon-svg {
  transition: transform 0.2s;
}
.float-btn:hover .qq-icon-svg {
  transform: scale(1.1);
}

/* ================= 🌟 QQ弹窗样式 🌟 ================= */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.qq-modal-container {
  background: var(--bg-card);
  width: 90%;
  max-width: 440px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 1px solid var(--border-light);
  transform: scale(1);
  transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: var(--text-main);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-heading);
  font-weight: 800;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-muted);
  cursor: pointer;
  transition: 0.2s;
}

.close-btn:hover {
  color: #f43f5e;
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
  text-align: center;
}

/* 卡通头像修饰 */
.qq-illustration {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.qq-avatar-badge {
  font-size: 36px;
}

.qq-hint {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0 0 20px;
}

/* 群信息显示卡片 */
.qq-info-card {
  background: var(--bg-hover);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px dashed var(--border-main);
}

.info-label {
  font-size: 14px;
  color: var(--text-muted);
}

.info-value {
  font-size: 14px;
  color: var(--text-heading);
}

.qq-number {
  color: var(--color-primary);
  letter-spacing: 0.5px;
}

.font-bold {
  font-weight: 700;
}

/* 二维码区域 */
.qq-qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.qr-border-wrap {
  border: 1px solid var(--border-main);
  padding: 6px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.qr-img {
  width: 140px;
  height: 140px;
  display: block;
}

.qr-tip {
  font-size: 12px;
  color: var(--text-light);
}

/* 弹窗底部操作按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-hover);
}

.btn-copy {
  background: transparent;
  border: 1px solid var(--border-dark);
  color: var(--text-muted);
  padding: 10px 20px;
  border-radius: 100px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  outline: none;
}

.btn-copy:hover {
  background: var(--border-light);
  color: var(--text-main);
}

.btn-join {
  background: #12b7f5;
  border: none;
  color: #fff;
  padding: 10px 24px;
  border-radius: 100px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.btn-join:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(18, 183, 245, 0.3);
}

/* ================= 🌟 动画 🌟 ================= */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .qq-modal-container, .modal-fade-leave-to .qq-modal-container {
  transform: scale(0.95);
}

/* ================= 🌟 移动端适配 🌟 ================= */
@media (max-width: 768px) {
  .floating-buttons-wrapper {
    right: 16px;
    bottom: 40px;
  }

  .float-btn {
    width: 44px;
    height: 44px;
  }

  .lottery-card-icon {
    width: 18px;
    height: 26px;
  }

  .lottery-tip {
    display: none; /* 移动端不显示提示 */
  }

  .tooltip {
    display: none; /* 移动端不展示 hover 提示泡 */
  }

  .qq-modal-container {
    width: 95%;
  }
}
</style>
