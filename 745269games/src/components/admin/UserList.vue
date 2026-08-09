<template>
  <div class="user-workspace">
    
    <div class="action-bar">
      <button class="btn-upload" @click="showAddModal = true">+ 添加新用户</button>
    </div>

    <div class="data-card">
      <h2 class="card-title">👥 论坛/全站用户列表</h2>

      <div class="table-container">
        <div class="table-header">
          <div class="col-id">UID</div>
          <div class="col-user">用户 (Username)</div>
          <div class="col-email">联系邮箱</div>
          <div class="col-role">权限组</div>
          <div class="col-rep">论坛声望</div>
          <div class="col-date">注册时间</div>
          <div class="col-actions">管理</div>
        </div>

        <div v-if="isLoading" class="loading-tip">正在同步用户数据...</div>
        <div v-else-if="users.length === 0" class="loading-tip">暂无用户数据，快去添加第一个用户吧！</div>

        <div class="table-row" v-for="user in users" :key="user.id">
          <div class="col-id id-text">{{ user.id }}</div>
          
          <div class="col-user user-info">
            <div class="avatar-placeholder">{{ user.username.charAt(0).toUpperCase() }}</div>
            <div class="user-text">
              <h3>{{ user.username }}</h3>
              <p :class="user.status === 'active' ? 'text-green' : 'text-red'">
                {{ user.status === 'active' ? '状态正常' : '已封禁' }}
              </p>
            </div>
          </div>
          
          <div class="col-email contact-text">{{ user.email || '未绑定' }}</div>
          
          <div class="col-role">
            <span class="role-badge" :class="user.role === 'admin' ? 'bg-purple' : 'bg-blue'">
              {{ user.role === 'admin' ? '管理员 (Admin)' : '普通玩家 (User)' }}
            </span>
          </div>

          <div class="col-rep rep-text">⭐ {{ user.reputation }}</div>
          
          <div class="col-date date-text">{{ formatDate(user.created_at) }}</div>
          
          <div class="col-actions btn-group">
            <button class="btn-delete" @click="handleDelete(user.id)">彻底删除</button>
          </div>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="user-modal-container">
          <header class="modal-header">
            <h3>⚡ 开设新账号</h3>
            <button class="close-btn" @click="showAddModal = false">✕</button>
          </header>
          <div class="modal-body">
            <div class="form-item">
              <label>用户名 <span class="required">*</span></label>
              <input type="text" v-model="form.username" placeholder="输入玩家昵称">
            </div>
            <div class="form-item">
              <label>登录密码 <span class="required">*</span></label>
              <input type="text" v-model="form.password" placeholder="设置初始密码">
            </div>
            <div class="form-item">
              <label>邮箱绑定 <span class="optional">(选填)</span></label>
              <input type="text" v-model="form.email" placeholder="example@mail.com">
            </div>
            <div class="form-item">
              <label>分配权限组</label>
              <select v-model="form.role" class="custom-select">
                <option value="user">普通玩家 (User)</option>
                <option value="admin">超级管理员 (Admin)</option>
              </select>
            </div>
          </div>
          <footer class="modal-footer">
            <button class="btn-cancel" @click="showAddModal = false">取消</button>
            <button class="btn-submit" :disabled="isSubmitting" @click="handleSubmit">
              {{ isSubmitting ? '正在创建...' : '确认创建账号' }}
            </button>
          </footer>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/store/gameStore'

const gameStore = useGameStore()
const users = ref([])
const isLoading = ref(true)

const showAddModal = ref(false)
const isSubmitting = ref(false)

const form = ref({ username: '', password: '', email: '', role: 'user' })

const loadUsers = async () => {
  isLoading.value = true
  users.value = await gameStore.fetchUsers()
  isLoading.value = false
}

onMounted(() => { loadUsers() })

const handleSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    alert('用户名和密码必须填写！')
    return
  }
  isSubmitting.value = true
  const res = await gameStore.addUser(form.value)
  isSubmitting.value = false

  if (res.success) {
    showAddModal.value = false
    form.value = { username: '', password: '', email: '', role: 'user' } // 重置表单
    loadUsers() // 重新拉取列表
  } else {
    alert(`❌ ${res.error}`)
  }
}

const handleDelete = async (id) => {
  const success = await gameStore.deleteUser(id)
  if (success) {
    users.value = users.value.filter(u => u.id !== id)
  }
}

const formatDate = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.user-workspace { width: 100%; text-align: left; }
.action-bar { margin-bottom: 24px; display: flex; }
.btn-upload { background: linear-gradient(135deg, var(--color-admin-primary, #2DD4BF) 0%, var(--color-admin-hover, #34D399) 100%); color: #ffffff; font-size: 14px; font-weight: 800; border: none; padding: 10px 28px; border-radius: 100px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(52, 211, 153, 0.5); transition: all 0.2s ease; }
.btn-upload:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px rgba(52, 211, 153, 0.6); }

.data-card { background-color: var(--bg-card, #FFFFFF); border-radius: 16px; padding: 32px; border: 1px solid var(--border-light, #F1F5F9); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); }
.card-title { font-size: 18px; font-weight: 800; color: var(--text-heading, #1E293B); margin: 0 0 24px 0; }

.table-container { width: 100%; }
.table-header { display: grid; grid-template-columns: 0.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr; padding-bottom: 16px; border-bottom: 1px solid var(--border-light); font-size: 12px; font-weight: 800; color: var(--text-light); }
.table-row { display: grid; grid-template-columns: 0.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--bg-hover); transition: background-color 0.2s; }
.table-row:hover { background-color: var(--bg-hover); }

.id-text { font-size: 13px; font-weight: 800; color: var(--text-light); }
.user-info { display: flex; align-items: center; gap: 12px; }
.avatar-placeholder { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #60A5FA, #3B82F6); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); }
.user-text h3 { font-size: 14px; font-weight: 800; color: var(--text-heading); margin: 0 0 4px 0; }
.user-text p { font-size: 11px; font-weight: 700; margin: 0; }
.text-green { color: #10B981; }
.text-red { color: #F43F5E; }

.contact-text { font-size: 13px; color: var(--text-muted); font-family: monospace; }
.rep-text { font-size: 14px; font-weight: 800; color: #F59E0B; }
.date-text { font-size: 12px; color: var(--text-muted); font-weight: 600; }

.role-badge { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; }
.bg-blue { background: rgba(59, 130, 246, 0.1); color: #3B82F6; border: 1px solid rgba(59, 130, 246, 0.2); }
.bg-purple { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; border: 1px solid rgba(139, 92, 246, 0.2); }

.btn-group { display: flex; gap: 8px; }
.btn-delete { background-color: #f43f5e; color: #fff; border: none; border-radius: 100px; padding: 6px 14px; font-size: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 10px rgba(244, 63, 94, 0.3); transition: 0.2s; }
.btn-delete:hover { filter: brightness(1.1); transform: translateY(-1px); }
.loading-tip { text-align: center; padding: 40px; color: var(--text-light); font-weight: 600; }

/* 🌟 弹窗 CSS */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.user-modal-container { background: var(--bg-card); width: 90%; max-width: 450px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; border: 1px solid var(--border-light); transform: scale(1); transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .user-modal-container, .modal-fade-leave-to .user-modal-container { transform: scale(0.95); }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
.modal-header h3 { margin: 0; font-size: 18px; color: var(--text-heading); font-weight: 800; }
.close-btn { background: transparent; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
.close-btn:hover { color: #f43f5e; transform: rotate(90deg); }

.modal-body { padding: 24px; }
.form-item { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.form-item label { font-size: 13px; font-weight: 800; color: var(--text-main); }
.form-item .required { color: #f43f5e; }
.form-item .optional { color: var(--text-light); font-weight: normal; }
.form-item input, .custom-select { width: 100%; background: var(--bg-body); border: 1px solid var(--border-main); color: var(--text-main); padding: 12px 16px; border-radius: 12px; font-size: 14px; outline: none; transition: 0.2s; }
.form-item input:focus, .custom-select:focus { border-color: var(--color-admin-primary, #2DD4BF); box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1); }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--border-light); background: var(--bg-hover); }
.btn-cancel { background: transparent; border: 1px solid var(--border-dark); color: var(--text-muted); padding: 10px 20px; border-radius: 100px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-cancel:hover { background: var(--border-light); color: var(--text-main); }
.btn-submit { background: var(--text-heading); border: none; color: var(--bg-card); padding: 10px 24px; border-radius: 100px; font-weight: 800; cursor: pointer; transition: 0.2s; }
.btn-submit:hover:not(:disabled) { background: var(--color-admin-primary, #2DD4BF); color: #fff; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(45, 212, 191, 0.3); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>