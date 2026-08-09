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
│       └── theme.css   # 全局 CSS 变量（主题库）
├── components/         # 公共/基础组件 (跨页面复用)
│   ├── common/         # 如：BaseButton.vue, SearchBar.vue
│   ├── front/          # 前台专用小组件：NavBar.vue, GameCard.vue
│   └── admin/          # 后台专用小组件：AdminSidebar.vue
│         └──GameFormModal.vue   # 修改&上传编辑游戏组件
├── layouts/            # 布局包裹层 (重要！)
│   ├── FrontLayout.vue # 前台布局 (包含前台Header和Footer)
│   └── AdminLayout.vue # 后台布局 (包含左侧菜单和顶部面包屑)
├── views/              # 页面级视图 (配合 Vue Router 使用)
│   ├── front/
│   │   ├── gamesHome.vue    # 前台首页 (原 GameHome.vue 的主体)
│   │   ├── Column.vue  # 游戏分类栏目
│   │   └── Detail.vue  # 游戏详情 (原 CategoryDetail.vue)
│   └── admin/
│       ├── Dashboard.vue
│       └── GameList.vue# 游戏管理列表 (原 GameAdminUpload.vue 的主体)
├── store/              # Pinia 状态管理
│   ├── index.js        # Pinia 实例化
│   └── gameStore.js    # 游戏数据仓库
├── router/             
│   └── index.js        # 路由配置 
├── services/           
│   └── api.js          # 🌐 API 请求层 
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

npx wrangler d1 execute games --local --command="CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, email TEXT UNIQUE, avatar_url TEXT, role TEXT DEFAULT 'user', status TEXT DEFAULT 'active', reputation INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login_at DATETIME); CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);"


npx wrangler d1 execute games --local --command="CREATE TABLE IF NOT EXISTS site_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_ip TEXT NOT NULL, path TEXT NOT NULL, user_agent TEXT, referer TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_site_logs_created_at ON site_logs(created_at DESC); CREATE INDEX IF NOT EXISTS idx_site_logs_ip ON site_logs(user_ip);"


npx wrangler d1 execute games --local --command="CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY, attempts INTEGER DEFAULT 0, last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP);"

### 数据库增加变量

```bash
npx wrangler d1 execute games --local --command="ALTER TABLE games ADD COLUMN video_url TEXT;"
```

npx wrangler d1 execute games --local --command="ALTER TABLE games ADD COLUMN download_count INTEGER DEFAULT 0;"