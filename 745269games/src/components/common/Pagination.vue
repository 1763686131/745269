<!-- 分页组件 -->
 
<template>
  <div class="pagination-container" v-if="totalPages > 1">
    <button 
      class="page-btn" 
      :disabled="currentPage === 1" 
      @click="handlePageChange(currentPage - 1)"
    >
      <span class="arrow-icon">◀</span> 上一页
    </button>
    
    <div class="page-info">
      第 <strong class="highlight-text">{{ currentPage }}</strong> 页 / 共 {{ totalPages }} 页
    </div>
    
    <button 
      class="page-btn" 
      :disabled="currentPage === totalPages" 
      @click="handlePageChange(currentPage + 1)"
    >
      下一页 <span class="arrow-icon">▶</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true }, // 当前处于第几页
  totalItems: { type: Number, required: true },  // 数据库里一共多少条数据
  pageSize: { type: Number, default: 100 }       // 每页展示多少条 (默认100)
})

const emit = defineEmits(['update:currentPage', 'change'])

// 计算出一共有多少页 (向上取整)
const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.pageSize) || 1
})

const handlePageChange = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  emit('update:currentPage', newPage)
  emit('change', newPage) // 触发父组件重新去数据库拉数据
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px 0;
  margin-top: 16px;
  border-top: 1px dashed var(--border-light, #F1F5F9);
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-hover, #F8FAFC);
  border: 1px solid var(--border-main, #E2E8F0);
  color: var(--text-heading, #1E293B);
  padding: 8px 20px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn .arrow-icon {
  font-size: 10px;
  color: var(--text-light, #94A3B8);
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-card, #FFFFFF);
  border-color: var(--color-admin-primary, #2DD4BF);
  color: var(--color-admin-primary, #2DD4BF);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 212, 191, 0.15);
}

.page-btn:hover:not(:disabled) .arrow-icon {
  color: var(--color-admin-primary, #2DD4BF);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: var(--text-muted, #64748B);
  font-weight: 600;
}

.highlight-text {
  color: var(--color-admin-primary, #2DD4BF);
  font-size: 16px;
  margin: 0 2px;
}
</style>