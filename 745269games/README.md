# Vue 3 + Vite

## VUE3 

运行代码: npm run dev
打包代码：npm run build


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
│         ├──GameFormModal.vue   # 修改&上传编辑游戏组件
│         ├──AccessStats.vue     # 后台访客组件
│         ├──FeedbackList.vue    # 后台反馈组件
│         └──UserList.vue        # 后台用户数据组件
├── layouts/            # 布局包裹层 (重要！)
│   ├── FrontLayout.vue # 前台布局 (包含前台Header和Footer)
│   └── AdminLayout.vue # 后台布局 (包含左侧菜单和顶部面包屑)
├── views/              # 页面级视图 (配合 Vue Router 使用)
│   ├── front/
│   │   ├── gamesHome.vue    # 前台首页 (原 GameHome.vue 的主体)
│   │   ├── Column.vue       # 游戏分类栏目
│   │   └── GameDetail.vue       # 游戏详情 (原 CategoryDetail.vue)
│   └── admin/
│       ├── Dashboard.vue
│       └── GameList.vue     # 游戏管理列表 (原 GameAdminUpload.vue 的主体)
├── store/                   # Pinia 状态管理
│   ├── index.js             # Pinia 实例化
│   └── gameStore.js         # 游戏数据仓库
├── router/             
│   └── index.js        # 路由配置 
├── services/           
│   └── api.js          # 🌐 API 请求层 
├── utils/              # 🛠️ 工具函数 (如日期格式化、数据清洗)
└── main.js             # 入口文件

```

### 后端目录结构

```Plaintext

server-Cloudflare/
├── .wrangler  #本地数据库文件夹（已隐藏）
├── src/
│     └── index.js    #服务端的代码
├── package-lock.json #服务端插件版本
├── package.json      #服务端配置
├── schema.sql        #数据库自动部署脚本
└── wrangler.toml      #Cloudflare  指引文件
```


### 后端运行代码：


确保你在 server-Cloudflare 目录下

```bash

npx wrangler dev

```


### 运行数据库的表

```bash
npx wrangler d1 execute games --local --file=./schema.sql
```


### 数据库增加变量

```bash
npx wrangler d1 execute games --local --command="ALTER TABLE games ADD COLUMN video_url TEXT;"
```


### docker 运行

目录结构：

```Plaintext

server-docker/
├── data/               # 空文件夹，用于 Docker 挂载保存 SQLite 数据库
├── dist/               # 👈 将你刚刚前端打包生成的 dist 文件夹整个复制进来
├── src/
│   └── index.js        # 核心服务代码（融合后端接口与前端托管）
├── schema.sql          # 👈 将你原来的 Cloudflare 里的 schema.sql 复制过来
├── package.json        # 依赖配置
├── Dockerfile          # Docker 镜像构建图纸
└── docker-compose.yml  # Docker 容器编排文件

```

确保你在 server-docker 目录下

```bash

docker-compose up -d --build

```