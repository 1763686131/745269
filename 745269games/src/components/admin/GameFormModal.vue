<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        
        <header class="modal-header">
          <h2 class="modal-title">{{ isEdit ? '修改游戏配置' : '上传新游戏' }}</h2>
          <button class="close-btn" @click="handleClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div class="modal-body">
          
          <section class="form-section">
            <h3 class="section-title">基本信息</h3>
            
            <div class="form-grid">
              <div class="form-item">
                <label>游戏名称 (中文)</label>
                <input type="text" v-model="formData.title.zh_CN" placeholder="例如: 塞尔达传说：旷野之息">
              </div>
              <div class="form-item">
                <label>英文名称</label>
                <input type="text" v-model="formData.title.en_US" placeholder="例如: The Legend of Zelda: Breath of the Wild">
              </div>
              <div class="form-item">
                <label>游戏别名 (用逗号分隔)</label>
                <input type="text" v-model="tempAliases" placeholder="例如: 野炊, BotW">
              </div>
              <div class="form-item">
                <label>游戏分类 (用逗号分隔)</label>
                <input type="text" v-model="tempGenres" placeholder="例如: 动作, 冒险, 开放世界">
              </div>
            </div>

            <div class="form-item mt-24">
              <label>游戏封面图</label>
              <div class="upload-action-row">
                <button class="btn-upload-file" @click="triggerCoverUpload">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  选择封面图
                </button>
                <span class="upload-tip">本地选择后立即渲染预览，提交时统一保存</span>
                <input type="file" ref="coverInput" class="hidden-input" accept="image/*" @change="handleCoverChange">
              </div>

              <div v-if="formData.media.cover" class="preview-cover-container">
                <div class="preview-cover-box">
                  <img :src="formData.media.cover" class="preview-img-cover" alt="封面图预览">
                  <button class="btn-delete-float" @click="formData.media.cover = ''" title="移除图片">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-item mt-24">
              <label>游戏详情截图 (支持一次多选)</label>
              <div class="upload-action-row">
                <button class="btn-upload-file" @click="triggerScreenshotsUpload">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  批量选择详情图
                </button>
                <span class="upload-tip">已选择 {{ formData.media.screenshots?.length || 0 }} 张截图</span>
                <input type="file" ref="screenshotsInput" class="hidden-input" accept="image/*" multiple @change="handleScreenshotsChange">
              </div>

              <div v-if="formData.media.screenshots && formData.media.screenshots.length > 0" class="preview-grid-box">
                <div v-for="(imgUrl, index) in formData.media.screenshots" :key="index" class="preview-screenshot-item">
                  <img :src="imgUrl" class="preview-img-thumb" alt="截图预览">
                  <button class="btn-delete-float" @click="removeScreenshot(index)" title="移除此张">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-item mt-24">
              <label>游戏简介</label>
              <textarea 
                v-model="formData.description" 
                class="textarea-box" 
                rows="4" 
                placeholder="请输入游戏背景介绍、特色玩法、推荐评语等信息..."
              ></textarea>
            </div>
          </section>

          <section class="form-section">
            <div class="section-header-row">
              <h3 class="section-title">下载资源配置</h3>
              <button class="btn-add-block" @click="addDownload">
                + 新增平台版本
              </button>
            </div>

            <div v-for="(dl, dlIndex) in formData.downloads" :key="dlIndex" class="dynamic-block">
              <div class="block-header">
                <h4>平台资源 #{{ dlIndex + 1 }}</h4>
                <button class="btn-delete-text" @click="removeDownload(dlIndex)">删除此版本</button>
              </div>
              
              <div class="form-grid">
                
                <div class="form-item full-width">
                  <label>下载平台选择 (已被其他版本占用的平台会自动置灰禁用)</label>
                  <div class="radio-group">
                    <label 
                      v-for="plat in platformOptions" 
                      :key="plat" 
                      class="radio-btn-item"
                      :class="{
                        'is-active': dl.platform === plat,
                        'is-disabled': isPlatformDisabled(plat, dlIndex)
                      }"
                    >
                      <input 
                        type="radio" 
                        :value="plat" 
                        v-model="dl.platform" 
                        :disabled="isPlatformDisabled(plat, dlIndex)"
                        class="hidden-input"
                      >
                      <span class="radio-text">{{ plat }}</span>
                      <span v-if="isPlatformDisabled(plat, dlIndex)" class="disabled-tag">(已选)</span>
                    </label>
                  </div>
                </div>

                <div class="form-item">
                  <label>版本描述</label>
                  <input type="text" v-model="dl.edition" placeholder="例如: 标准高清原版 (模拟器)">
                </div>
                <div class="form-item">
                  <label>文件格式</label>
                  <input type="text" v-model="dl.file_format" placeholder="例如: 免安装绿色版 / NSP / PKG">
                </div>
                <div class="form-item">
                  <label>文件大小</label>
                  <input type="text" v-model="dl.file_size_display" placeholder="例如: 14.4 GB">
                </div>
              </div>

              <div class="nested-section">
                <div class="nested-header">
                  <h5>网盘下载节点</h5>
                  <button class="btn-add-small" @click="addSource(dlIndex)">+ 增加网盘链接</button>
                </div>
                
                <div v-for="(src, srcIndex) in dl.sources" :key="srcIndex" class="source-row">
                  <input type="text" v-model="src.name" placeholder="网盘名称(如:百度网盘)" class="flex-1">
                  <input type="text" v-model="src.url" placeholder="下载链接" class="flex-2">
                  <input type="text" v-model="src.password" placeholder="提取码" class="flex-1">
                  <button class="icon-btn-delete" @click="removeSource(dlIndex, srcIndex)" title="删除此链接">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

            </div>
          </section>

        </div>

        <footer class="modal-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button class="btn-submit" @click="handleSubmit">{{ isEdit ? '保存修改' : '确认上传并保存' }}</button>
        </footer>

      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  gameData: Object
})

const emit = defineEmits(['update:visible', 'submit'])

const isEdit = computed(() => !!props.gameData)
const formData = ref({})

// 原生 file input 的 DOM 引用
const coverInput = ref(null)
const screenshotsInput = ref(null)

// 逗号分隔处理的临时字符串
const tempAliases = ref('')
const tempGenres = ref('')

// 平台单选可用列表
const platformOptions = ['Switch', 'PS5', 'PS4', 'PC']

// 判断某个平台是否已被其他下载区块选中 (用于置灰不可选)
const isPlatformDisabled = (plat, currentIndex) => {
  return formData.value.downloads?.some((dl, index) => index !== currentIndex && dl.platform === plat)
}

// 默认初始数据对象结构
const getDefaultData = () => ({
  id: null,
  uuid: crypto.randomUUID(),
  title: { zh_CN: '', en_US: '' },
  description: '', // 新增游戏简介
  aliases: [],
  media: { cover: '', screenshots: [] },
  metadata: { platforms: [], genres: [] },
  downloads: [],
  system: { is_active: true }
})

// 监听弹窗打开状态，进行数据深拷贝回显或重置
watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.gameData) {
      formData.value = JSON.parse(JSON.stringify(props.gameData))
      if (!formData.value.description) formData.value.description = ''
      if (!formData.value.media) formData.value.media = { cover: '', screenshots: [] }
      if (!formData.value.media.screenshots) formData.value.media.screenshots = []
      
      tempAliases.value = formData.value.aliases?.join(', ') || ''
      tempGenres.value = formData.value.metadata?.genres?.join(', ') || ''
    } else {
      formData.value = getDefaultData()
      tempAliases.value = ''
      tempGenres.value = ''
    }
  }
})

// ===== 图片上传处理函数 =====
const triggerCoverUpload = () => coverInput.value.click()
const handleCoverChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    formData.value.media.cover = URL.createObjectURL(file)
  }
  e.target.value = null
}

const triggerScreenshotsUpload = () => screenshotsInput.value.click()
const handleScreenshotsChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) {
    Array.from(files).forEach(file => {
      formData.value.media.screenshots.push(URL.createObjectURL(file))
    })
  }
  e.target.value = null
}

const removeScreenshot = (index) => {
  formData.value.media.screenshots.splice(index, 1)
}

// ===== 下载资源区块增删处理 =====
const addDownload = () => {
  formData.value.downloads.push({
    platform: '',
    edition: '',
    version: '',
    file_format: '',
    file_size_display: '',
    system_requirements: {},
    sources: []
  })
}

const removeDownload = (index) => {
  formData.value.downloads.splice(index, 1)
}

const addSource = (dlIndex) => {
  formData.value.downloads[dlIndex].sources.push({
    provider: 'baidu',
    name: '',
    url: '',
    password: '',
    is_valid: true
  })
}

const removeSource = (dlIndex, srcIndex) => {
  formData.value.downloads[dlIndex].sources.splice(srcIndex, 1)
}

// ===== 提交与关闭 =====
const handleClose = () => {
  emit('update:visible', false)
}

const handleSubmit = () => {
  formData.value.aliases = tempAliases.value.split(',').map(s => s.trim()).filter(Boolean)
  formData.value.metadata.genres = tempGenres.value.split(',').map(s => s.trim()).filter(Boolean)
  
  // 从选中的版本下载块中汇总所有的平台名
  formData.value.metadata.platforms = formData.value.downloads.map(dl => dl.platform).filter(Boolean)

  if (!isEdit.value) {
    formData.value.system.created_at = new Date().toISOString()
  }
  formData.value.system.updated_at = new Date().toISOString()

  emit('submit', formData.value)
  handleClose()
}
</script>

<style scoped>
/* ================= 1. 遮罩与动画 ================= */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.modal-container {
  width: 880px;
  max-width: 95%;
  max-height: 90vh;
  background-color: var(--bg-card, #ffffff);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ================= 2. 头部 ================= */
.modal-header {
  height: 70px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light, #F1F5F9);
}
.modal-title { font-size: 18px; font-weight: 800; color: var(--text-heading, #1E293B); }
.close-btn {
  background: transparent; border: none; cursor: pointer;
  color: var(--text-light, #94A3B8); width: 32px; height: 32px;
  border-radius: 50%; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background-color: var(--bg-hover, #F8FAFC); color: var(--color-danger, #EF4444); }

/* ================= 3. 主体与基础输入框 ================= */
.modal-body { flex: 1; overflow-y: auto; padding: 32px; }
.form-section { margin-bottom: 36px; }
.section-title { font-size: 16px; font-weight: 800; color: var(--text-heading, #1E293B); margin-bottom: 20px; }
.section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.mt-24 { margin-top: 24px; }
.full-width { grid-column: span 2; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-item { display: flex; flex-direction: column; gap: 8px; }
.form-item label { font-size: 13px; font-weight: 800; color: var(--text-main, #334155); }

input[type="text"] {
  height: 42px; padding: 0 16px; border-radius: 8px;
  border: 1px solid var(--border-main, #E2E8F0);
  background-color: var(--bg-hover, #F8FAFC);
  font-size: 14px; color: var(--text-heading, #0F172A);
  transition: all 0.2s; outline: none;
}
input[type="text"]:focus, .textarea-box:focus {
  border-color: var(--color-admin-primary, #2DD4BF);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
}

.textarea-box {
  padding: 12px 16px; border-radius: 8px;
  border: 1px solid var(--border-main, #E2E8F0);
  background-color: var(--bg-hover, #F8FAFC);
  font-size: 14px; color: var(--text-heading, #0F172A);
  transition: all 0.2s; outline: none; resize: vertical; line-height: 1.6;
}

/* ================= 4. 图片上传与渲染预览 ================= */
.hidden-input { display: none !important; }
.upload-action-row { display: flex; align-items: center; gap: 16px; }
.btn-upload-file {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
  background-color: var(--bg-hover, #F8FAFC); border: 1px solid var(--border-dark, #CBD5E1);
  color: var(--text-main, #334155); font-size: 13px; font-weight: 800;
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.btn-upload-file svg { width: 16px; height: 16px; }
.btn-upload-file:hover { background-color: #F1F5F9; border-color: var(--color-admin-primary, #2DD4BF); }
.upload-tip { font-size: 12px; color: var(--text-light, #94A3B8); font-weight: 600; }

/* 封面图预览容器 */
.preview-cover-container { margin-top: 12px; }
.preview-cover-box {
  position: relative; display: inline-block; width: 140px; height: 180px;
  border-radius: 12px; overflow: hidden; border: 2px solid var(--border-main, #E2E8F0);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.preview-img-cover { width: 100%; height: 100%; object-fit: cover; }

/* 详情截图预览网格 */
.preview-grid-box {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px; margin-top: 12px;
}
.preview-screenshot-item {
  position: relative; width: 100%; height: 85px; border-radius: 8px;
  overflow: hidden; border: 1px solid var(--border-main, #E2E8F0);
}
.preview-img-thumb { width: 100%; height: 100%; object-fit: cover; }

/* 浮动删除按钮 */
.btn-delete-float {
  position: absolute; top: 6px; right: 6px; width: 24px; height: 24px;
  background-color: rgba(239, 68, 68, 0.85); color: #ffffff; border: none;
  border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; backdrop-filter: blur(2px);
}
.btn-delete-float svg { width: 14px; height: 14px; }
.btn-delete-float:hover { background-color: rgba(220, 38, 38, 1); transform: scale(1.1); }

/* ================= 5. 平台单选框 (互斥禁用样式) ================= */
.radio-group { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
.radio-btn-item {
  position: relative; display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border-main, #E2E8F0);
  background-color: var(--bg-hover, #F8FAFC); cursor: pointer; font-size: 13px;
  font-weight: 800; color: var(--text-main, #334155); transition: all 0.2s; user-select: none;
}
.radio-btn-item:hover:not(.is-disabled) {
  border-color: var(--color-admin-primary, #2DD4BF); color: var(--color-admin-primary, #2DD4BF);
}
/* 选中状态 */
.radio-btn-item.is-active {
  background-color: var(--color-admin-primary, #2DD4BF);
  border-color: var(--color-admin-primary, #2DD4BF);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(45, 212, 191, 0.3);
}
/* 置灰禁用状态 */
.radio-btn-item.is-disabled {
  background-color: #E2E8F0 !important;
  border-color: #CBD5E1 !important;
  color: #94A3B8 !important;
  cursor: not-allowed !important;
  opacity: 0.65;
}
.disabled-tag { font-size: 11px; font-weight: 600; color: #94A3B8; }

/* ================= 6. 动态资源块与嵌套网盘 ================= */
.dynamic-block {
  background-color: #FAFAFA; border: 1px solid var(--border-main, #E2E8F0);
  border-radius: 12px; padding: 24px; margin-bottom: 20px;
}
.block-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.block-header h4 { font-size: 14px; font-weight: 800; color: var(--text-main, #334155); }
.btn-delete-text { background: none; border: none; color: var(--color-danger, #EF4444); font-size: 13px; font-weight: 700; cursor: pointer; }

.nested-section { margin-top: 24px; border-top: 1px dashed var(--border-dark, #CBD5E1); padding-top: 16px; }
.nested-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.nested-header h5 { font-size: 13px; font-weight: 800; color: var(--text-muted, #64748B); }
.source-row { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; }
.flex-1 { flex: 1; } .flex-2 { flex: 2; }
.icon-btn-delete {
  background: #FFF1F2; color: #F43F5E; border: none; width: 38px; height: 38px;
  border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.icon-btn-delete svg { width: 16px; height: 16px; }

.btn-add-block {
  background: var(--bg-hover, #F8FAFC); border: 1px solid var(--border-dark, #CBD5E1);
  color: var(--text-main, #334155); padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; cursor: pointer;
}
.btn-add-small { background: transparent; border: none; color: var(--color-admin-primary, #2DD4BF); font-size: 13px; font-weight: 800; cursor: pointer; }

/* ================= 7. 底部按钮 ================= */
.modal-footer {
  height: 80px; padding: 0 32px; background-color: var(--bg-hover, #F8FAFC);
  display: flex; align-items: center; justify-content: flex-end; gap: 16px;
  border-top: 1px solid var(--border-light, #F1F5F9);
}
.btn-cancel {
  background: white; border: 1px solid var(--border-main, #E2E8F0);
  padding: 10px 24px; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; color: var(--text-main, #334155);
}
.btn-submit {
  background: linear-gradient(135deg, var(--color-admin-primary, #2DD4BF) 0%, var(--color-admin-hover, #34D399) 100%);
  border: none; padding: 10px 32px; border-radius: 100px; font-size: 14px; font-weight: 800; color: white; cursor: pointer;
  box-shadow: 0 4px 14px -4px rgba(45, 212, 191, 0.5);
}
</style>