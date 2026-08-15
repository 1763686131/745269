<template>
  <transition name="modal-fade">
    <!-- click.self 确保只有点击黑色半透明背景才会触发取消 -->
    <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
      <div class="confirm-container">
        
        <!-- 弹窗图标与标题 -->
        <header class="confirm-header">
          <div class="icon-circle" :class="type">
            <!-- 危险警告图标 (删除、下架等使用) -->
            <svg v-if="type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <!-- 成功/常规图标 (上架、确认提交等使用) -->
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 class="confirm-title">{{ title }}</h3>
        </header>

        <!-- 弹窗正文内容 -->
        <div class="confirm-body">
          <p class="confirm-message">{{ message }}</p>
        </div>

        <!-- 底部按钮组 -->
        <footer class="confirm-footer">
          <button class="btn-cancel" @click="handleCancel">{{ cancelText }}</button>
          <!-- 动态绑定确认按钮的颜色风格 -->
          <button class="btn-confirm" :class="type" @click="handleConfirm">{{ confirmText }}</button>
        </footer>

      </div>
    </div>
  </transition>
</template>

<script setup>
// 定义父组件传进来的数据
const props = defineProps({
  visible: { type: Boolean, default: false },        // 是否显示
  title: { type: String, default: '操作确认' },      // 标题
  message: { type: String, default: '您确定要执行此操作吗？' }, // 提示正文
  confirmText: { type: String, default: '确定' },    // 确认按钮文本
  cancelText: { type: String, default: '取消' },     // 取消按钮文本
  type: { type: String, default: 'primary' }         // 风格：'primary' (默认蓝绿) | 'danger' (红色警告)
})

// 定义要发送给父组件的事件 (代替原来的返回 true/false)
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// 点击确认：触发 confirm 事件，并关闭弹窗
const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

// 点击取消或空白处：触发 cancel 事件，并关闭弹窗
const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
/* 🌟 极致暗黑科技感样式 */
.modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(6px); 
  display: flex; align-items: center; justify-content: center; 
  z-index: 99999; 
}

/* 进出场平滑果冻动画 */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .confirm-container, .modal-fade-leave-to .confirm-container { transform: scale(0.9) translateY(15px); }

/* 居中卡片本体 */
.confirm-container { 
  background: var(--bg-card, #FFFFFF); 
  width: 90%; max-width: 400px; 
  border-radius: 20px; 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
  border: 1px solid var(--border-light, #F1F5F9); 
  overflow: hidden; text-align: center; 
}

/* 头部图标区 */
.confirm-header { padding: 30px 24px 10px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.icon-circle { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.icon-circle svg { width: 24px; height: 24px; }

/* 动态图标颜色 */
.icon-circle.primary { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.icon-circle.danger { background: rgba(239, 68, 68, 0.1); color: #EF4444; }

.confirm-title { margin: 0; font-size: 18px; color: var(--text-heading, #1E293B); font-weight: 800; }

/* 正文提示语 */
.confirm-body { padding: 0 24px 24px 24px; }
.confirm-message { margin: 0; font-size: 14px; color: var(--text-muted, #64748B); line-height: 1.6; font-weight: 600; }

/* 底部按钮排版 */
.confirm-footer { display: flex; gap: 12px; padding: 16px 24px; background: var(--bg-hover, #F8FAFC); border-top: 1px solid var(--border-light, #F1F5F9); }
.confirm-footer button { flex: 1; padding: 12px 0; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; border: none; }

.btn-cancel { background: transparent; border: 1px solid var(--border-dark, #CBD5E1); color: var(--text-muted, #64748B); }
.btn-cancel:hover { background: var(--border-light, #E2E8F0); color: var(--text-heading, #1E293B); }

/* 动态确认按钮颜色 */
.btn-confirm.primary { background: var(--color-admin-primary, #10B981); color: #FFF; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.btn-confirm.primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3); }

.btn-confirm.danger { background: var(--color-danger, #EF4444); color: #FFF; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
.btn-confirm.danger:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3); filter: brightness(1.1); }
</style>