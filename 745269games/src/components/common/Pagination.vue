<!-- 公共分页组件 Pagination.vue -->

<template>
  <div class="pagination-container" v-if="totalPages > 1">
    <!-- 1. 上一页 -->
    <button 
      class="page-btn prev-next-btn" 
      :disabled="currentPage === 1" 
      @click="handlePageChange(currentPage - 1)"
    >
      <span class="arrow-icon">◀</span> 上一页
    </button>
    
    <!-- 2. 动态数字页码区 -->
    <ul class="pager-list">
      <li 
        v-for="(item, index) in visiblePages" 
        :key="index"
        :class="[
          'pager-item',
          { active: item === currentPage },
          { ellipsis: item === 'prev-ellipsis' || item === 'next-ellipsis' }
        ]"
        @click="handlePageClick(item)"
        :title="getTooltip(item)"
      >
        <!-- 折叠省略号 (带悬浮变形动画) -->
        <template v-if="item === 'prev-ellipsis' || item === 'next-ellipsis'">
          <span class="ellipsis-text">...</span>
          <span class="ellipsis-icon">{{ item === 'prev-ellipsis' ? '⏪' : '⏩' }}</span>
        </template>
        <!-- 正常数字 -->
        <template v-else>
          {{ item }}
        </template>
      </li>
    </ul>
    
    <!-- 3. 下一页 -->
    <button 
      class="page-btn prev-next-btn" 
      :disabled="currentPage === totalPages" 
      @click="handlePageChange(currentPage + 1)"
    >
      下一页 <span class="arrow-icon">▶</span>
    </button>

    <!-- 4. 快速跳转区 -->
    <div class="jump-container">
      <span class="jump-text">共 {{ totalPages }} 页，前往</span>
      <input 
        type="number" 
        class="jump-input" 
        v-model="jumpInput" 
        @keyup.enter="handleJump"
        :min="1" 
        :max="totalPages"
      />
      <span class="jump-text">页</span>
      <button class="jump-btn" @click="handleJump">跳转</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true }, // 当前处于第几页
  totalItems: { type: Number, required: true },  // 数据库里一共多少条数据
  pageSize: { type: Number, default: 100 }       // 每页展示多少条 (默认100)
})

const emit = defineEmits(['update:currentPage', 'change'])

const jumpInput = ref('') // 跳转输入框的值

// 计算出一共有多少页 (向上取整)
const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.pageSize) || 1
})

// 🌟 核心算法：计算当前应该显示哪些页码 (大厂经典 7 码算法)
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.currentPage
  const pages = []

  // 如果总页数少于等于 7 页，直接全部显示
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    // 逻辑1：当前页靠前
    if (current <= 4) {
      for (let i = 1; i <= 6; i++) pages.push(i)
      pages.push('next-ellipsis')
      pages.push(total)
    } 
    // 逻辑2：当前页靠后
    else if (current >= total - 3) {
      pages.push(1)
      pages.push('prev-ellipsis')
      for (let i = total - 5; i <= total; i++) pages.push(i)
    } 
    // 逻辑3：当前页在中间
    else {
      pages.push(1)
      pages.push('prev-ellipsis')
      for (let i = current - 2; i <= current + 2; i++) pages.push(i)
      pages.push('next-ellipsis')
      pages.push(total)
    }
  }
  return pages
})

// 处理点击页码或省略号
const handlePageClick = (item) => {
  if (item === 'prev-ellipsis') {
    handlePageChange(props.currentPage - 5) // 点击左侧省略号，快退5页
  } else if (item === 'next-ellipsis') {
    handlePageChange(props.currentPage + 5) // 点击右侧省略号，快进5页
  } else {
    handlePageChange(item)
  }
}

// 统一的页码变化分发函数
const handlePageChange = (newPage) => {
  // 越界安全防护
  if (newPage < 1) newPage = 1
  if (newPage > totalPages.value) newPage = totalPages.value
  
  if (newPage === props.currentPage) return // 如果页码没变，不发请求

  emit('update:currentPage', newPage)
  emit('change', newPage)
}

// 处理输入框跳转
const handleJump = () => {
  let page = parseInt(jumpInput.value)
  if (isNaN(page)) return // 输入无效则忽略
  
  // 限制跳转范围在 1 ~ totalPages 之间
  if (page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  
  handlePageChange(page)
  jumpInput.value = '' // 跳转后清空输入框，保持界面干净
}

// 给折叠区域加 Title 提示
const getTooltip = (item) => {
  if (item === 'prev-ellipsis') return '向前 5 页'
  if (item === 'next-ellipsis') return '向后 5 页'
  return ''
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 24px 0;
  margin-top: 16px;
  border-top: 1px dashed var(--border-light, #F1F5F9);
  user-select: none;
}

/* 基础按钮样式 */
.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover, #F8FAFC);
  border: 1px solid var(--border-main, #E2E8F0);
  color: var(--text-heading, #1E293B);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 32px;
}

.prev-next-btn {
  padding: 0 16px;
  gap: 6px;
  border-radius: 100px; /* 上下页保持胶囊形 */
}

.prev-next-btn .arrow-icon {
  font-size: 10px;
  color: var(--text-light, #94A3B8);
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-card, #FFFFFF);
  border-color: var(--color-admin-primary, #2DD4BF);
  color: var(--color-admin-primary, #2DD4BF);
  box-shadow: 0 4px 12px rgba(45, 212, 191, 0.15);
}

.page-btn:hover:not(:disabled) .arrow-icon {
  color: var(--color-admin-primary, #2DD4BF);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 数字页码列表 */
.pager-list {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pager-item {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--bg-hover, #F8FAFC);
  border: 1px solid var(--border-main, #E2E8F0);
  color: var(--text-main, #334155);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pager-item:hover {
  border-color: var(--color-admin-primary, #2DD4BF);
  color: var(--color-admin-primary, #2DD4BF);
}

.pager-item.active {
  background: var(--color-admin-primary, #2DD4BF);
  border-color: var(--color-admin-primary, #2DD4BF);
  color: #FFFFFF;
  box-shadow: 0 4px 10px rgba(45, 212, 191, 0.3);
}

/* 折叠省略号特殊交互 */
.pager-item.ellipsis {
  background: transparent;
  border-color: transparent;
  color: var(--text-light, #94A3B8);
}

.pager-item.ellipsis .ellipsis-icon {
  display: none;
  font-size: 12px;
  color: var(--color-admin-primary, #2DD4BF);
}

.pager-item.ellipsis:hover .ellipsis-text {
  display: none;
}

.pager-item.ellipsis:hover .ellipsis-icon {
  display: block;
}

/* 快速跳转区 */
.jump-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.jump-text {
  font-size: 13px;
  color: var(--text-muted, #64748B);
  font-weight: 600;
}

.jump-input {
  width: 48px;
  height: 32px;
  border: 1px solid var(--border-main, #E2E8F0);
  border-radius: 6px;
  background: var(--bg-card, #FFFFFF);
  color: var(--text-heading, #1E293B);
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  outline: none;
  transition: all 0.2s ease;
}

.jump-input:focus {
  border-color: var(--color-admin-primary, #2DD4BF);
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
}

/* 隐藏输入框原生上下箭头 */
.jump-input::-webkit-outer-spin-button,
.jump-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.jump-input[type=number] {
  -moz-appearance: textfield;
}

.jump-btn {
  height: 32px;
  padding: 0 14px;
  background: var(--bg-hover, #F8FAFC);
  border: 1px solid var(--border-main, #E2E8F0);
  color: var(--text-main, #334155);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.jump-btn:hover {
  background: var(--color-admin-primary, #2DD4BF);
  border-color: var(--color-admin-primary, #2DD4BF);
  color: #FFFFFF;
}
</style>