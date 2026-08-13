<template>
  <transition name="modal-fade">
    <div v-if="showModal" class="modal-overlay">
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
                <label>游戏语言支持 (多选)</label>
                <div class="checkbox-group">
                  <label 
                    v-for="lang in availableLanguages" 
                    :key="lang" 
                    class="checkbox-btn-item"
                    :class="{ 'is-active': selectedLanguages.includes(lang) }"
                  >
                    <input 
                      type="checkbox" 
                      :value="lang" 
                      v-model="selectedLanguages" 
                      class="hidden-input"
                    >
                    <span class="checkbox-text">{{ lang }}</span>
                  </label>
                </div>
              </div>
              
              <div class="form-item full-width">
                <label>游戏分类 (用逗号分隔)</label>
                <input type="text" v-model="tempGenres" placeholder="例如: 动作, 冒险, 开放世界">
                <div class="history-tags-wrapper" v-if="historyGenres.length > 0">
                  <span class="history-label">推荐记录:</span>
                  <div class="history-tags">
                    <button 
                      v-for="tag in historyGenres" 
                      :key="tag" 
                      class="history-tag"
                      @click="appendGenre(tag)"
                    >
                      {{ tag }} +
                    </button>
                    <button class="history-clear" @click="clearHistoryGenres" title="清空历史记录">清空</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-item mt-24">
              <label>游戏封面图 (URL外链)</label>
              <div class="upload-action-row">
                <input type="text" v-model="formData.media.cover" placeholder="请粘贴图片URL链接 (如 https://img.domain.com/cover.jpg)" class="flex-1">
                <span class="upload-tip">输入链接后将自动渲染预览</span>
              </div>

              <div v-if="formData.media?.cover" class="preview-cover-container">
                <div class="preview-cover-box">
                  <img :src="formData.media.cover" class="preview-img-cover" alt="封面图预览" @error="handleImgError">
                  <button class="btn-delete-float" @click="formData.media.cover = ''" title="清空链接">✕</button>
                </div>
              </div>
            </div>

            <div class="form-item mt-24">
              <label>🎬 视频预告片 (支持白嫖B站)</label>
              <input 
                type="text" 
                v-model="formData.media.video" 
                placeholder="请粘贴 B站 的 iframe 分享代码，或直接填写带 src 的链接" 
                class="form-input"
              />
              <p class="form-hint" style="font-size: 12px; color: #94A3B8; margin-top: 4px;">
                💡 去B站视频下方点击“分享” -> “嵌入代码” -> 复制粘贴到这里即可，不消耗本站服务器流量！
              </p>
            </div>

            <div class="form-item mt-24">
              <label>游戏详情截图 (URL外链)</label>
              <div class="upload-action-row">
                <input type="text" v-model="tempScreenshotUrl" @keyup.enter="addScreenshotUrl" placeholder="输入截图URL并按回车 或 点击右侧添加" class="flex-1">
                <button class="btn-upload-file" @click="addScreenshotUrl">添加截图</button>
                <span class="upload-tip">已添加 {{ formData.media?.screenshots?.length || 0 }} 张</span>
              </div>

              <div v-if="formData.media?.screenshots && formData.media.screenshots.length > 0" class="preview-grid-box">
                <div v-for="(imgUrl, index) in formData.media.screenshots" :key="index" class="preview-screenshot-item">
                  <img :src="imgUrl" class="preview-img-thumb" alt="截图预览">
                  <button class="btn-delete-float" @click="removeScreenshot(index)" title="移除此张">✕</button>
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
              <button class="btn-add-block" @click="addDownload">+ 新增平台版本</button>
            </div>

            <div v-for="(dl, dlIndex) in formData.downloads" :key="dlIndex" class="dynamic-block">
              <div class="block-header">
                <h4>平台资源 #{{ dlIndex + 1 }}</h4>
                <button class="btn-delete-text" @click="removeDownload(dlIndex)">删除此版本</button>
              </div>
              
              <div class="form-grid">
                <div class="form-item full-width">
                  <label>下载平台选择 (占用平台自动置灰)</label>
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
                    </label>
                  </div>
                </div>

                <div class="form-item">
                  <label>版本描述</label>
                  <input type="text" v-model="dl.edition" placeholder="例如: 标准高清原版">
                </div>
                <div class="form-item">
                  <label>文件格式</label>
                  <input type="text" v-model="dl.file_format" placeholder="例如: NSP / PKG">
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
                
                <div v-for="(src, srcIndex) in dl.sources" :key="srcIndex" class="source-item-wrapper">
                  <div class="preset-drives-tags">
                    <span class="preset-label">快捷输入:</span>
                    <button 
                      v-for="drive in presetDrives" 
                      :key="drive" 
                      class="preset-tag"
                      @click="setDriveName(dlIndex, srcIndex, drive)"
                    >
                      {{ drive }}
                    </button>
                  </div>
                  
                  <div class="source-row">
                    <input type="text" v-model="src.name" placeholder="网盘名称" class="flex-1">
                    <input type="text" v-model="src.url" @input="handleUrlInput(dlIndex, srcIndex)" placeholder="粘贴网盘分享文字，将自动识别链接与提取码" class="flex-2">
                    <input type="text" v-model="src.password" placeholder="提取码" class="flex-1">
                    <button class="icon-btn-delete" @click="removeSource(dlIndex, srcIndex)" title="删除此链接">✕</button>
                  </div>
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
import { ref, watch, computed, onMounted } from 'vue'
import { useGameStore } from '@/store/gameStore' 

const gameStore = useGameStore()

const props = defineProps({
  visible: { type: Boolean, default: undefined },
  modelValue: { type: Boolean, default: undefined },
  value: { type: Boolean, default: undefined },
  gameData: Object
})

const emit = defineEmits(['update:visible', 'update:modelValue', 'input', 'submit'])

const showModal = computed(() => {
  if (props.visible !== undefined) return props.visible
  if (props.modelValue !== undefined) return props.modelValue
  if (props.value !== undefined) return props.value
  return false
})

const isEdit = computed(() => !!props.gameData)

// 🌟 1. 默认数据构造器：防止模态框挂载时读属性报错
const getDefaultData = () => ({
  id: null,
  uuid: 'uuid_' + Date.now().toString(36) + Math.random().toString(36).substring(2),
  title: { zh_CN: '', en_US: '' },
  description: '',
  aliases: [], // 语言支持数组
  media: { 
    cover: '', 
    screenshots: [],
    video: '' // 👈 必须初始化 video 字段
  },
  metadata: { platforms: [], genres: [] }, // genres 分类数组
  downloads: [],
  system: { is_active: true }
})

// 初始化为完整结构的 formData
const formData = ref(getDefaultData())

// 🌟 2. 语言支持配置
const availableLanguages = ['简体中文', '繁体中文', '英语', '日语']
const selectedLanguages = ref([])

// 🌟 3. 分类与历史记录
const tempGenres = ref('')
const historyGenres = ref([])

onMounted(async () => {
  await gameStore.fetchTags()
  historyGenres.value = gameStore.historyTags
})

const appendGenre = (tag) => {
  if (!tempGenres.value) {
    tempGenres.value = tag
  } else {
    const currentTags = tempGenres.value.split(/,|，/).map(s => s.trim())
    if (!currentTags.includes(tag)) {
      tempGenres.value += `, ${tag}`
    }
  }
}

const clearHistoryGenres = () => {
  historyGenres.value = []
  localStorage.removeItem('game_genres_history')
}

const tempScreenshotUrl = ref('')

// 🌟 4. 平台互斥配置
const platformOptions = ['Switch', 'PS5', 'PS4', 'PC']
const isPlatformDisabled = (plat, currentIndex) => {
  return formData.value.downloads?.some((dl, index) => index !== currentIndex && dl.platform === plat)
}

// 🌟 5. 核心：监听模态框打开与数据回填（修改 vs 上传）
watch(showModal, (newVal) => {
  if (newVal) {
    if (props.gameData) {
      // 深拷贝防污染
      const data = JSON.parse(JSON.stringify(props.gameData))
      
      // 完善各层级的防空校验，确保回显不出死角
      if (!data.title) data.title = { zh_CN: '', en_US: '' }
      if (!data.description) data.description = ''
      if (!data.aliases) data.aliases = [] 
      if (!data.media) data.media = { cover: '', screenshots: [], video: '' }
      if (!data.media.screenshots) data.media.screenshots = []
      if (data.media.video === undefined) data.media.video = '' // 防空补充
      if (!data.metadata) data.metadata = { platforms: [], genres: [] }
      if (!data.downloads) data.downloads = []

      formData.value = data

      // 回显复选框和输入框
      selectedLanguages.value = [...data.aliases]
      tempGenres.value = data.metadata?.genres?.join(', ') || ''
      tempScreenshotUrl.value = ''
    } else {
      // 上传模式，重置为空表单
      formData.value = getDefaultData()
      selectedLanguages.value = []
      tempGenres.value = ''
      tempScreenshotUrl.value = ''
    }
  }
})

const handleImgError = (e) => {
  // 可加上占位图逻辑
}

// 🌟 6. 核心：截图链接的批量添加逻辑
const addScreenshotUrl = () => {
  const rawString = tempScreenshotUrl.value.trim()
  if (rawString) {
    if (!formData.value.media) formData.value.media = { cover: '', screenshots: [], video: '' }
    if (!formData.value.media.screenshots) formData.value.media.screenshots = []
    
    // 🌟 核心魔法：利用正则表达式，根据“空格”、“英文逗号”、“中文逗号”或者“换行符”自动切割字符串
    const urlArray = rawString.split(/[\s,，]+/).filter(url => url.trim() !== '')
    
    // 将切割出来的多个链接一次性追加到截图数组中
    formData.value.media.screenshots.push(...urlArray)
    
    // 清空输入框
    tempScreenshotUrl.value = '' 
  }
}

const removeScreenshot = (index) => {
  formData.value.media.screenshots.splice(index, 1)
}

const addDownload = () => {
  if (!formData.value.downloads) formData.value.downloads = []
  formData.value.downloads.push({
    platform: '', edition: '', version: '', file_format: '', file_size_display: '', system_requirements: {}, sources: []
  })
}
const removeDownload = (index) => formData.value.downloads.splice(index, 1)

const addSource = (dlIndex) => {
  if (!formData.value.downloads[dlIndex].sources) formData.value.downloads[dlIndex].sources = []
  formData.value.downloads[dlIndex].sources.push({
    provider: 'baidu', name: '', url: '', password: '', is_valid: true
  })
}
const removeSource = (dlIndex, srcIndex) => formData.value.downloads[dlIndex].sources.splice(srcIndex, 1)

const handleClose = () => {
  emit('update:visible', false)
  emit('update:modelValue', false)
  emit('input', false)
}

// 🌟 7. 核心：网盘名称的预设与修改逻辑
const presetDrives = ['百度网盘', '夸克网盘', '迅雷云盘', '阿里云盘', '天翼云盘', '123云盘']
const setDriveName = (dlIndex, srcIndex, driveName) => {
  // 直接精准定位到对应版本、对应网盘链接的 name 字段并赋值
  formData.value.downloads[dlIndex].sources[srcIndex].name = driveName
}


// 🌟 8. 智能解析网盘粘贴文案（自动裁剪 URL 并提取密码）
const handleUrlInput = (dlIndex, srcIndex) => {
  const src = formData.value.downloads[dlIndex].sources[srcIndex]
  const rawText = src.url

  if (!rawText) return

  // 1. 匹配提取纯净的 HTTP/HTTPS 链接（过滤前后的中文和杂质）
  const urlMatch = rawText.match(/(https?:\/\/[^\s\u4e00-\u9fa5]+)/i)

  if (urlMatch) {
    // 剔除末尾可能误带入的句号或英文标点
    let cleanUrl = urlMatch[1].replace(/[,\.！!]+$/, '')

    // 2. 智能提取密码/提取码（支持 pwd=5269、提取码: 5269、密码: 5269 等各种格式）
    let extractedPwd = ''
    
    // 优先识别链接参数里的 ?pwd=xxxx 或 &pwd=xxxx
    const pwdInUrl = cleanUrl.match(/[?&]pwd=([a-zA-Z0-9]+)/i)
    // 其次识别文本里的 提取码: xxxx / 密码: xxxx / pwd: xxxx
    const pwdInText = rawText.match(/(?:提取码|密码|pwd)[:：\s]*([a-zA-Z0-9]+)/i)

    if (pwdInUrl) {
      extractedPwd = pwdInUrl[1]
    } else if (pwdInText) {
      extractedPwd = pwdInText[1]
    }

    // 3. 自动更新输入框中的数据
    src.url = cleanUrl
    if (extractedPwd) {
      src.password = extractedPwd
    }
  }
}

const handleSubmit = async () => {
  formData.value.aliases = [...selectedLanguages.value]
  
  const finalGenresArray = tempGenres.value.split(/,|，/).map(s => s.trim()).filter(Boolean)
  if (!formData.value.metadata) formData.value.metadata = {}
  formData.value.metadata.genres = finalGenresArray
  formData.value.metadata.platforms = (formData.value.downloads || []).map(dl => dl.platform).filter(Boolean)

  if (finalGenresArray.length > 0) {
    await gameStore.saveTags(finalGenresArray)
  }

  emit('submit', formData.value)
  handleClose()
}

</script>


<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.modal-container {
  width: 880px; max-width: 95%; max-height: 90vh;
  background-color: var(--bg-card, #ffffff); border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--border-light, #F1F5F9);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  height: 70px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border-light, #F1F5F9);
  background-color: var(--bg-card, #ffffff);
}
.modal-title { font-size: 18px; font-weight: 800; color: var(--text-heading, #1E293B); }
.close-btn {
  background: transparent; border: none; cursor: pointer;
  color: var(--text-light, #94A3B8); width: 32px; height: 32px;
  border-radius: 50%; transition: all 0.2s; display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background-color: var(--bg-hover, #F8FAFC); color: var(--color-danger, #EF4444); }

.modal-body { flex: 1; overflow-y: auto; padding: 32px; background-color: var(--bg-card, #ffffff); }
.form-section { margin-bottom: 36px; }
.section-title { font-size: 16px; font-weight: 800; color: var(--text-heading, #1E293B); margin-bottom: 20px; }
.section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.mt-24 { margin-top: 24px; }
.full-width { grid-column: span 2; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-item { display: flex; flex-direction: column; gap: 8px; }
.form-item label { font-size: 13px; font-weight: 800; color: var(--text-main, #334155); }

/* 🌟 多选框组样式 (借用原本的 radio 样式逻辑优化) */
.checkbox-group { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
.checkbox-btn-item {
  position: relative; display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-main, #E2E8F0);
  background-color: var(--bg-hover, #F8FAFC); cursor: pointer; font-size: 13px; font-weight: 800; color: var(--text-main, #334155);
  transition: all 0.2s ease;
}
.checkbox-btn-item.is-active {
  background-color: var(--color-admin-primary, #2DD4BF); border-color: var(--color-admin-primary, #2DD4BF); color: #ffffff;
}

/* 🌟 历史标签样式 (已修复左对齐留白问题) */
.history-tags-wrapper { 
  margin-top: 8px; 
  display: flex; 
  align-items: flex-start; 
  justify-content: flex-start; /* 新增：强制外层容器整体靠左对齐 */
  gap: 8px; 
  width: 100%; /* 新增：保证外层容器撑满 100% 宽度 */
}
.history-label { 
  font-size: 12px; 
  color: var(--text-light, #94A3B8); 
  font-weight: 700; 
  white-space: nowrap; 
  padding-top: 4px; 
  flex-shrink: 0; /* 新增：防止“推荐记录:”这几个字被后面的标签挤压变形 */
}
.history-tags { 
  display: flex; 
  flex-wrap: wrap; 
  justify-content: flex-start; /* 新增：强制里面的所有标签严格从左向右排列 */
  gap: 8px; 
  align-items: center; 
  flex: 1; /* 新增：让标签容器独占剩下所有的空间，杜绝往右缩的情况 */
}
.history-tag {
  background: var(--bg-hover, #F1F5F9); border: 1px dashed var(--border-dark, #CBD5E1);
  color: var(--text-main, #475569); padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.history-tag:hover { background: var(--bg-card, #ffffff); border-color: var(--color-admin-primary, #2DD4BF); color: var(--color-admin-primary, #2DD4BF); transform: translateY(-1px); }
.history-clear { background: transparent; border: none; color: var(--color-danger, #EF4444); font-size: 11px; font-weight: 700; cursor: pointer; margin-left: 4px; opacity: 0.8; }
.history-clear:hover { opacity: 1; text-decoration: underline; }


input[type="text"] {
  height: 42px; padding: 0 16px; border-radius: 8px;
  border: 1px solid var(--border-main, #E2E8F0);
  background-color: var(--bg-hover, #F8FAFC);
  font-size: 14px; color: var(--text-heading, #0F172A); outline: none;
}
input[type="text"]:focus, .textarea-box:focus {
  border-color: var(--color-admin-primary, #2DD4BF);
  background-color: var(--bg-card, #ffffff);
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
}

.textarea-box {
  padding: 12px 16px; border-radius: 8px;
  border: 1px solid var(--border-main, #E2E8F0);
  background-color: var(--bg-hover, #F8FAFC);
  font-size: 14px; color: var(--text-heading, #0F172A); outline: none; resize: vertical; line-height: 1.6;
}

.upload-action-row { display: flex; align-items: center; gap: 16px; width: 100%; }
.btn-upload-file {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 42px; padding: 0 20px;
  background-color: var(--bg-hover, #F8FAFC); border: 1px solid var(--border-dark, #CBD5E1);
  color: var(--text-main, #334155); font-size: 13px; font-weight: 800; border-radius: 8px; cursor: pointer;
  white-space: nowrap; transition: all 0.2s;
}
.btn-upload-file:hover {
  background-color: var(--color-admin-primary, #2DD4BF); color: #ffffff; border-color: var(--color-admin-primary, #2DD4BF);
}
.upload-tip { font-size: 12px; color: var(--text-light, #94A3B8); font-weight: 600; white-space: nowrap; }

.preview-cover-container { margin-top: 12px; }
.preview-cover-box {
  position: relative; display: inline-block; width: 140px; height: 180px;
  border-radius: 12px; overflow: hidden; border: 2px solid var(--border-main, #E2E8F0);
}
.preview-img-cover { width: 100%; height: 100%; object-fit: cover; background-color: var(--bg-hover, #f1f5f9); }

.preview-grid-box {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px; margin-top: 12px;
}
.preview-screenshot-item {
  position: relative; width: 100%; height: 85px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-main, #E2E8F0);
}
.preview-img-thumb { width: 100%; height: 100%; object-fit: cover; background-color: var(--bg-hover, #f1f5f9); }

.btn-delete-float {
  position: absolute; top: 6px; right: 6px; width: 24px; height: 24px;
  background-color: rgba(239, 68, 68, 0.85); color: #ffffff; border: none;
  border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.btn-delete-float:hover { background-color: rgba(239, 68, 68, 1); transform: scale(1.1); }

.radio-group { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
.radio-btn-item {
  position: relative; display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border-main, #E2E8F0);
  background-color: var(--bg-hover, #F8FAFC); cursor: pointer; font-size: 13px; font-weight: 800; color: var(--text-main, #334155);
}
.radio-btn-item.is-active {
  background-color: var(--color-admin-primary, #2DD4BF); border-color: var(--color-admin-primary, #2DD4BF); color: #ffffff;
}
.radio-btn-item.is-disabled {
  background-color: var(--border-main, #E2E8F0) !important; border-color: var(--border-dark, #CBD5E1) !important; color: var(--text-light, #94A3B8) !important; cursor: not-allowed !important; opacity: 0.65;
}

.dynamic-block {
  background-color: var(--bg-hover, #FAFAFA); border: 1px solid var(--border-main, #E2E8F0);
  border-radius: 12px; padding: 24px; margin-bottom: 20px;
}
.block-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.block-header h4 { font-size: 14px; font-weight: 800; color: var(--text-main, #334155); }
.btn-delete-text { background: none; border: none; color: var(--color-danger, #EF4444); font-size: 13px; font-weight: 700; cursor: pointer; }

.nested-section { margin-top: 24px; border-top: 1px dashed var(--border-dark, #CBD5E1); padding-top: 16px; }
.nested-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.nested-header h5 { font-size: 13px; font-weight: 800; color: var(--text-muted, #64748B); }
.source-row { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; }
.icon-btn-delete {
  background: transparent; color: var(--color-danger, #F43F5E); border: 1px solid var(--border-main, #E2E8F0); width: 38px; height: 38px;
  border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.icon-btn-delete:hover { background: rgba(239, 68, 68, 0.1); border-color: var(--color-danger, #F43F5E); }

.btn-add-block {
  background: var(--bg-hover, #F8FAFC); border: 1px solid var(--border-dark, #CBD5E1);
  color: var(--text-main, #334155); padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-add-block:hover { background: var(--bg-card, #F1F5F9); border-color: var(--text-light, #94A3B8); }

.btn-add-small { background: transparent; border: none; color: var(--color-admin-primary, #2DD4BF); font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
.btn-add-small:hover { opacity: 0.8; }

.modal-footer {
  height: 80px; padding: 0 32px; background-color: var(--bg-hover, #F8FAFC);
  display: flex; align-items: center; justify-content: flex-end; gap: 16px;
  border-top: 1px solid var(--border-light, #F1F5F9);
}
.btn-cancel {
  background: var(--bg-card, #ffffff); border: 1px solid var(--border-main, #E2E8F0);
  padding: 10px 24px; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; color: var(--text-main, #334155); transition: all 0.2s;
}
.btn-cancel:hover { background: var(--bg-hover, #F8FAFC); color: var(--text-heading, #0F172A); }

.btn-submit {
  background-color: var(--text-heading, #0F172A); 
  color: var(--bg-card, #ffffff);
  border: none; padding: 10px 32px; border-radius: 100px; font-size: 14px; font-weight: 800; cursor: pointer;
  box-shadow: 0 4px 14px -4px rgba(0, 0, 0, 0.2); transition: all 0.2s;
}
.btn-submit:hover { transform: translateY(-1px); opacity: 0.9; }

/* 🌟 网盘快捷标签与容器样式 */
.source-item-wrapper {
  display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;
  padding-bottom: 16px; border-bottom: 1px dashed var(--border-main, #E2E8F0);
}
/* 最后一个隐藏虚线底边 */
.source-item-wrapper:last-child {
  margin-bottom: 0; padding-bottom: 0; border-bottom: none;
}
.preset-drives-tags {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: -2px;
}
.preset-label {
  font-size: 12px; color: var(--text-light, #94A3B8); font-weight: 700; flex-shrink: 0;
}
.preset-tag {
  background: transparent; border: 1px solid var(--border-dark, #CBD5E1);
  color: var(--text-main, #475569); padding: 2px 8px; border-radius: 4px; 
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.preset-tag:hover {
  background: var(--color-admin-primary, #2DD4BF); color: #ffffff; border-color: var(--color-admin-primary, #2DD4BF);
}

.hidden-input { display: none !important; }
</style>