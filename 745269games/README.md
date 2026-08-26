# 游戏网站前端项目

## VUE3 前端框架

运行代码: npm run dev

打包代码：npm run build

### 前端目录结构

```plaintext
src/
├── assets/                  # 静态资源
│   └── styles/              # 全局样式库
│       ├── reset.css        # 全局样式重置
│       └── theme.css        # 全局 CSS 变量（主题库）
├── components/              # 公共/基础组件（跨页面复用）
│   ├── common/              # 通用组件
│   │   ├── ConfirmModal.vue      # 确认弹窗
│   │   ├── DailyLottery.vue      # 每日抽奖组件（支持 localStorage 持久化）
│   │   ├── FeedbackModal.vue     # 用户反馈表单
│   │   ├── FloatingButtons.vue   # 悬浮按钮（反馈、QQ 群等）
│   │   └── Pagination.vue        # 分页组件
│   ├── front/               # 前台专用组件（目前为空，预留）
│   └── admin/               # 后台专用组件
│       ├── AccessStats.vue       # 访客统计
│       ├── FeedbackList.vue      # 反馈列表
│       ├── GameFormModal.vue     # 游戏编辑表单
│       ├── GameManager.vue       # 游戏管理器
│       └── UserList.vue          # 用户数据列表
├── layouts/                 # 布局包裹层
│   ├── FrontLayout.vue      # 前台布局（Header + Footer）
│   └── AdminLayout.vue      # 后台布局（侧边栏 + 面包屑）
├── views/                   # 页面级视图（配合 Vue Router）
│   ├── front/               # 前台页面
│   │   ├── gamesHome.vue    # 前台首页
│   │   ├── Column.vue       # 游戏分类栏目
│   │   └── GameDetail.vue   # 游戏详情页
│   └── admin/               # 后台页面
│       ├── Dashboard.vue    # 仪表盘
│       └── GameList.vue     # 游戏管理列表
├── store/                   # Pinia 状态管理
│   ├── index.js             # Pinia 实例化
│   └── gameStore.js         # 游戏数据仓库（管理游戏列表、筛选、分页）
├── Router/                  # 路由配置
│   └── index.js             # Vue Router 路由表
├── services/                # API 请求层
│   └── api.js               # 封装后端接口调用
├── App.vue                  # 根组件
├── main.js                  # 入口文件
└── style.css                # 全局样式（根样式）
```

**说明**：
- `components/common/DailyLottery.vue` - 每日抽奖功能，直接调用后端 `/api/games/random` 接口
- `store/gameStore.js` - 负责游戏列表展示，一次加载全部数据用于前端筛选
- `components/front/` - 预留给未来的前台专用小组件（如导航栏、游戏卡片等）


### Cloudflare后端目录结构

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

## 后端运行代码：

确保你在 server-Cloudflare 目录下

```bash

npx wrangler dev

```

### 运行数据库的表（初始化运行）

```bash
npx wrangler d1 execute games --local --file=./schema.sql
```

<br />

### 数据库增加变量（可选）

```bash
npx wrangler d1 execute games --local --command="ALTER TABLE games ADD COLUMN video_url TEXT;"
```

## docker后端目录结构

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

### docker 容器运行

确保你在 server-docker 目录下

```bash
# 构建并启动容器（后台运行）
docker-compose up -d --build

# 查看容器日志
docker logs 745269-nas-app

# 重启容器
docker-compose restart

# 停止容器
docker-compose down
```

### API 接口说明

#### 抽奖接口
- **路径**: `POST /api/games/random`
- **功能**: 从数据库随机抽取符合条件的游戏
- **请求参数**:
  ```json
  {
    "genres": ["动作", "冒险"],  // 游戏类型（可选）
    "players": "single",         // 游戏人数：single/multi/lan（可选）
    "platform": "Switch",        // 平台（可选）
    "count": 4                   // 抽取数量
  }
  ```
- **返回**: 返回随机抽取的游戏数组

#### 游戏列表接口
- **路径**: `GET /api/games`
- **功能**: 获取所有已上架游戏（前端使用 Pinia store 管理）

<br />

## 项目优化进程

* [x] 后台分类分类记录向右排列

* [x] 弹窗点击空白处不会关闭

* [x] 游戏详情截图 (URL外链)支持多个粘贴

* [x] 网盘下载节点支持标签输入

* [x] 下载链接支持http前面字符自动裁剪

* [x] 分类页二级选项框，当选一级的时候二级也要变化

* [x] 分类页点击游戏进入详情页返回分类页刷新数据修复

* [x] IP反馈修复（目前是获取不了IP）

* [x] 访问数据优化，数据不准确

* [x] 游戏页面ID


## 项目增加内容

<br />

* [x] 不知道玩啥？每日抽奖，四张卡片
  - 每日抽奖使用浏览器 localStorage 保存当日抽取的卡片
  - 卡片翻转状态会实时保存（0=未翻开，1=已翻开）
  - 每天凌晨 0:00 后首次打开会自动清除昨日数据
  - 管理员账号会显示"重新占卜"按钮，可清除本地存储
  - 金色稀有卡片有特殊动画效果（边框呼吸效果、翻转速度变慢）
  - 抽奖数据从后端数据库随机抽取，支持按类型/人数/平台筛选

* [x] 增加返回首页按钮

* [ ] 详情页增加用户反馈标签：比如晕3D，无聊等

* [x ] 悬浮按钮，按钮有反馈问题、加QQ群等...

* [x] 增加一个搜索不到按钮反馈给站长的组件

