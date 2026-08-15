<template>
  <div class="confirm-modal-root">
    <!-- 🌟 原有的居中确认弹窗 -->
    <transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
        <div class="confirm-container">
          <header class="confirm-header">
            <div class="icon-circle" :class="type">
              <svg v-if="type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 class="confirm-title">{{ title }}</h3>
          </header>

          <div class="confirm-body">
            <p class="confirm-message">{{ message }}</p>
          </div>

          <footer class="confirm-footer">
            <button class="btn-cancel" @click="handleCancel">{{ cancelText }}</button>
            <button class="btn-confirm" :class="type" @click="handleConfirm">{{ confirmText }}</button>
          </footer>
        </div>
      </div>
    </transition>

    <!-- 🌟 新增：顶部的无感提示 (Toast) -->
    <transition name="toast-slide">
      <div v-if="toastVisible" class="toast-container" :class="toastType">
        <span class="toast-icon">{{ toastType === 'success' ? '✅' : '⚠️' }}</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '操作确认' },
  message: { type: String, default: '您确定要执行此操作吗？' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  type: { type: String, default: 'primary' }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

// ==========================================
// 🌟 顶部轻提示 (Toast) 核心逻辑
// ==========================================
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref('success') // 'success' 绿 | 'danger' 红
let toastTimer = null

// 这个方法专门暴露给父组件调用
const showToast = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true
  
  // 防抖清除：如果连续点击，重置定时器
  if (toastTimer) clearTimeout(toastTimer)
  
  // 2.5 秒后自动关闭
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 2500)
}

// 🌟 核心：暴露给外部使用！
defineExpose({ showToast })
</script>

<style scoped>
/* 原有的弹窗样式保持不变 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 99999; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .confirm-container, .modal-fade-leave-to .confirm-container { transform: scale(0.9) translateY(15px); }
.confirm-container { background: var(--bg-card, #FFFFFF); width: 90%; max-width: 400px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid var(--border-light, #F1F5F9); overflow: hidden; text-align: center; }
.confirm-header { padding: 30px 24px 10px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.icon-circle { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.icon-circle svg { width: 24px; height: 24px; }
.icon-circle.primary { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.icon-circle.danger { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
.confirm-title { margin: 0; font-size: 18px; color: var(--text-heading, #1E293B); font-weight: 800; }
.confirm-body { padding: 0 24px 24px 24px; }
.confirm-message { margin: 0; font-size: 14px; color: var(--text-muted, #64748B); line-height: 1.6; font-weight: 600; }
.confirm-footer { display: flex; gap: 12px; padding: 16px 24px; background: var(--bg-hover, #F8FAFC); border-top: 1px solid var(--border-light, #F1F5F9); }
.confirm-footer button { flex: 1; padding: 12px 0; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; border: none; }
.btn-cancel { background: transparent; border: 1px solid var(--border-dark, #CBD5E1); color: var(--text-muted, #64748B); }
.btn-cancel:hover { background: var(--border-light, #E2E8F0); color: var(--text-heading, #1E293B); }
.btn-confirm.primary { background: var(--color-admin-primary, #10B981); color: #FFF; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.btn-confirm.primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3); }
.btn-confirm.danger { background: var(--color-danger, #EF4444); color: #FFF; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
.btn-confirm.danger:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3); filter: brightness(1.1); }

/* ==========================================
   🌟 顶部轻提示 (Toast) 美化样式
========================================== */
.toast-container {
  position: fixed;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 28px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 999999; /* 必须高于所有元素 */
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
}

.toast-container.success { background: rgba(16, 185, 129, 0.9); border: 1px solid #34D399; }
.toast-container.danger { background: rgba(239, 68, 68, 0.9); border: 1px solid #F87171; }

.toast-icon { font-size: 16px; }
.toast-text { color: #FFFFFF; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; }

/* 丝滑的滑入滑出果冻动画 */
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translate(-50%, -30px) scale(0.9); }
</style>