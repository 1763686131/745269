# Vue 3 + Vite

## VUE3 

运行代码: npm run dev
打包代码：


### 前端目录结构

```Plaintext

src/
├── assets/             # 静态资源
│   ├── images/         # 图片、Logo
│   └── styles/         # 全局样式库 (把 theme.css 移到这里)
│       ├── reset.css   # 全局样式重置
│       └── theme.css   # 🌈 全局 CSS 变量（主题库）
├── components/         # 🧩 公共/基础组件 (跨页面复用)
│   ├── common/         # 如：BaseButton.vue, SearchBar.vue
│   ├── front/          # 前台专用小组件：NavBar.vue, GameCard.vue
│   └── admin/          # 后台专用小组件：AdminSidebar.vue
├── layouts/            # 📦 布局包裹层 (重要！)
│   ├── FrontLayout.vue # 前台布局 (包含前台Header和Footer)
│   └── AdminLayout.vue # 后台布局 (包含左侧菜单和顶部面包屑)
├── views/              # 🖥️ 页面级视图 (配合 Vue Router 使用)
│   ├── front/
│   │   ├── gamesHome.vue    # 前台首页 (原 GameHome.vue 的主体)
│   │   └── Detail.vue  # 游戏详情 (原 CategoryDetail.vue)
│   └── admin/
│       ├── Dashboard.vue
│       └── GameList.vue# 游戏管理列表 (原 GameAdminUpload.vue 的主体)
├── store/              # 🗄️ Pinia 状态管理
│   ├── index.js        # Pinia 实例化
│   └── gameStore.js    # 游戏数据仓库
├── router/             # 🛣️ 路由配置 (建议引入 vue-router)
│   └── index.js        
├── services/           # 🌐 API 请求层 (未来写 axios 请求的地方)
│   └── api.js          
├── utils/              # 🛠️ 工具函数 (如日期格式化、数据清洗)
└── main.js             # 入口文件

```

### 后端目录结构

```Plaintext
你的项目根目录/
├── src/                #Vue 前端代码
├── vite.config.js      #前端配置
└── server/             #纯净版服务端
    ├── package.json
    ├── wrangler.toml
    └── src/
        └── index.js
```


### 后端运行代码：


确保你在 server 目录下

```bash

npx wrangler dev

```


### 运行数据库的表

```bash
npx wrangler d1 execute games --local --file=./schema.sql
```