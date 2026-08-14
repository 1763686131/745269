<template>
  <transition name="modal-fade">
    <div class="modal-overlay" @click.self="closeModal">
      <div class="feedback-modal-container">
        <header class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </header>
        
        <div class="modal-body">
          <p class="feedback-hint">{{ hint }}</p>
          
          <div class="form-item">
            <label>联系方式 <span class="optional">(选填，QQ / 微信 / 邮箱)</span></label>
            <input type="text" v-model="feedbackForm.contact" placeholder="留下您的联系方式，方便给您回复">
          </div>
          
          <div class="form-item">
            <label>反馈内容 <span class="required">*</span></label>
            <textarea v-model="feedbackForm.content" rows="4" :placeholder="placeholder"></textarea>
          </div>

          <div class="form-item captcha-item" v-if="cooldown <= 0">
            <label>人机验证 <span class="required">*</span></label>
            <div class="captcha-row">
              <div class="captcha-question">
                <span class="math-text">{{ num1 }} + {{ num2 }} =</span>
              </div>
              <input type="number" v-model="captchaAnswer" placeholder="请输入答案" class="captcha-input">
              <button class="refresh-captcha-btn" @click="refreshCaptcha" title="换一题">🔄</button>
            </div>
          </div>

        </div>
        
        <footer class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          
          <button 
            class="btn-submit" 
            :disabled="isSubmitting || cooldown > 0" 
            @click="submitFeedbackHandler"
          >
            <span v-if="cooldown > 0">⏳ 冷却中 ({{ cooldown }}s)</span>
            <span v-else-if="isSubmitting">正在发送...</span>
            <span v-else>提交给站长</span>
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/store/gameStore'

const gameStore = useGameStore()

const props = defineProps({
  title: { type: String, default: '📝 提交问题反馈' },
  hint: { type: String, default: '如果您遇到游戏报错、网盘失效或解压密码错误等问题，请在下方反馈，站长会火速处理！' },
  placeholder: { type: String, default: '请详细描述您遇到的问题...' },
  // 如果调用时没传，默认就是首页
  gameId: { type: [String, Number], default: 'home' },
  gameName: { type: String, default: '【首页】通用反馈 / 资源求助' }
})

const emit = defineEmits(['close'])

const isSubmitting = ref(false)
const feedbackForm = ref({ contact: '', content: '' })

// ================= 🌟 验证码逻辑 =================
const num1 = ref(0)
const num2 = ref(0)
const captchaAnswer = ref('')
const expectedAnswer = computed(() => num1.value + num2.value)

const refreshCaptcha = () => {
  num1.value = Math.floor(Math.random() * 10) + 1 // 1-10的随机数
  num2.value = Math.floor(Math.random() * 10) + 1
  captchaAnswer.value = ''
}

// ================= 🌟 冷却计时器逻辑 =================
const cooldown = ref(0)
let timer = null

const startCooldown = (seconds) => {
  cooldown.value = seconds
  // 记录到浏览器缓存，防止用户按 F5 刷新绕过前端倒计时
  localStorage.setItem('feedback_cooldown_until', Date.now() + seconds * 1000)
  
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(timer)
      refreshCaptcha() // 冷却结束后，刷新一下验证码
    }
  }, 1000)
}

onMounted(() => {
  // 组件加载时，检查是否还在冷却中
  const until = localStorage.getItem('feedback_cooldown_until')
  if (until) {
    const remaining = Math.ceil((parseInt(until) - Date.now()) / 1000)
    if (remaining > 0) {
      startCooldown(remaining)
    } else {
      refreshCaptcha()
    }
  } else {
    refreshCaptcha()
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// ================= 🌟 提交逻辑 =================
const closeModal = () => emit('close')

const submitFeedbackHandler = async () => {
  if (cooldown.value > 0) return

  if (!feedbackForm.value.content.trim()) {
    alert('反馈内容不能为空哦！请描述一下您遇到的问题。')
    return
  }

  // 前端验证码拦截
  if (parseInt(captchaAnswer.value) !== expectedAnswer.value) {
    alert('❌ 人机验证计算错误啦，请重新计算哦！')
    refreshCaptcha()
    return
  }

  isSubmitting.value = true
  
  const payload = {
    game_id: props.gameId,
    game_name: props.gameName,
    contact_info: feedbackForm.value.contact.trim(),
    content: feedbackForm.value.content.trim()
  }

  const res = await gameStore.submitFeedback(payload)
  isSubmitting.value = false
  
  if (res.success) {
    alert('✅ 反馈提交成功！站长已经收到通知，会尽快处理哒！')
    feedbackForm.value.contact = ''
    feedbackForm.value.content = ''
    
    // 触发 120 秒冷却
    startCooldown(120)
    closeModal()
  } else {
    alert(`❌ 提交失败: ${res.error}`)
    refreshCaptcha()
  }
}
</script>
<!-- 如何在其他页面（如首页搜索不到时）召唤这个组件？
现在这个组件已经变成了个“即插即用”的模块，你后续想在 gamesHome.vue 或者 Column.vue 里用它，只需要两步：

导入它：

import FeedbackModal from '@/components/common/FeedbackModal.vue'
const showFeedbackModal = ref(false)
在页面没数据的地方加个按钮并呼出弹窗：

HTML
<button @click="showFeedbackModal = true">向站长反馈求游戏</button>

<FeedbackModal 
  v-if="showFeedbackModal" 
  title="✨ 跪求游戏资源"
  hint="没有搜到您想玩的游戏？填在下面告诉我，我来帮你找！"
  placeholder="比如：黑神话悟空、只狼..."
  @close="showFeedbackModal = false" 
/>
你看，因为我们在组件里写了 props (参数)，所以你调用时，想让它叫什么标题、提示语是什么都可以随意变幻，极其灵活！ -->



<style scoped>
/* 🌟 这里是该组件专属的弹窗 CSS，不会污染外部 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.feedback-modal-container { background: var(--bg-card); width: 90%; max-width: 500px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; border: 1px solid var(--border-light); transform: scale(1); transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .feedback-modal-container, .modal-fade-leave-to .feedback-modal-container { transform: scale(0.95); }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
.modal-header h3 { margin: 0; font-size: 18px; color: var(--text-heading); font-weight: 800; }
.close-btn { background: transparent; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
.close-btn:hover { color: #f43f5e; transform: rotate(90deg); }

.modal-body { padding: 24px; }
.feedback-hint { font-size: 13px; color: var(--text-muted); margin: 0 0 20px 0; line-height: 1.6; }
.form-item { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.form-item label { font-size: 14px; font-weight: 700; color: var(--text-main); }
.form-item .required { color: #f43f5e; }
.form-item .optional { color: var(--text-light); font-size: 12px; font-weight: normal; }
.form-item input, .form-item textarea { width: 100%; background: var(--bg-body); border: 1px solid var(--border-main); color: var(--text-main); padding: 12px 16px; border-radius: 12px; font-size: 14px; transition: 0.2s; outline: none; box-sizing: border-box; resize: vertical; }
.form-item input:focus, .form-item textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--border-light); background: var(--bg-hover); }
.btn-cancel { background: transparent; border: 1px solid var(--border-dark); color: var(--text-muted); padding: 10px 20px; border-radius: 100px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-cancel:hover { background: var(--border-light); color: var(--text-main); }
.btn-submit { background: var(--color-primary); border: none; color: #fff; padding: 10px 24px; border-radius: 100px; font-weight: 800; cursor: pointer; transition: 0.2s; }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.2); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 768px) {
  .feedback-modal-container { width: 95%; }
  .modal-header, .modal-body, .modal-footer { padding: 16px; }
}


.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.feedback-modal-container { background: var(--bg-card); width: 90%; max-width: 500px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; border: 1px solid var(--border-light); transform: scale(1); transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .feedback-modal-container, .modal-fade-leave-to .feedback-modal-container { transform: scale(0.95); }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
.modal-header h3 { margin: 0; font-size: 18px; color: var(--text-heading); font-weight: 800; }
.close-btn { background: transparent; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
.close-btn:hover { color: #f43f5e; transform: rotate(90deg); }

.modal-body { padding: 24px; }
.feedback-hint { font-size: 13px; color: var(--text-muted); margin: 0 0 20px 0; line-height: 1.6; }
.form-item { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.form-item label { font-size: 14px; font-weight: 700; color: var(--text-main); }
.form-item .required { color: #f43f5e; }
.form-item .optional { color: var(--text-light); font-size: 12px; font-weight: normal; }
.form-item input, .form-item textarea { width: 100%; background: var(--bg-body); border: 1px solid var(--border-main); color: var(--text-main); padding: 12px 16px; border-radius: 12px; font-size: 14px; transition: 0.2s; outline: none; box-sizing: border-box; resize: vertical; }
.form-item input:focus, .form-item textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

/* 🌟 新增的验证码 UI 样式 */
.captcha-row { display: flex; align-items: center; gap: 12px; }
.captcha-question { background: var(--bg-hover); border: 1px dashed var(--border-dark); padding: 10px 16px; border-radius: 10px; min-width: 100px; text-align: center; }
.math-text { font-size: 18px; font-weight: 900; color: var(--color-primary); letter-spacing: 2px; }
.captcha-input { flex: 1; }
.refresh-captcha-btn { background: var(--bg-hover); border: 1px solid var(--border-main); border-radius: 10px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 18px; }
.refresh-captcha-btn:hover { background: var(--border-light); transform: rotate(45deg); }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--border-light); background: var(--bg-hover); }
.btn-cancel { background: transparent; border: 1px solid var(--border-dark); color: var(--text-muted); padding: 10px 20px; border-radius: 100px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-cancel:hover { background: var(--border-light); color: var(--text-main); }
.btn-submit { background: var(--color-primary); border: none; color: #fff; padding: 10px 24px; border-radius: 100px; font-weight: 800; cursor: pointer; transition: 0.2s; min-width: 120px; }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.2); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; background: var(--text-muted); }

@media (max-width: 768px) {
  .feedback-modal-container { width: 95%; }
  .modal-header, .modal-body, .modal-footer { padding: 16px; }
}
</style>