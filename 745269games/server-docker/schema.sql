-- =======================================================================
-- 745269.com 核心数据库构建脚本 (完全优化部署版)
-- ⚠️ 警告：如果你想彻底清空所有本地数据重新开始，可以取消下面几行的注释
-- DROP TABLE IF EXISTS games;
-- DROP TABLE IF EXISTS game_tags;
-- DROP TABLE IF EXISTS feedbacks;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS site_logs;
-- DROP TABLE IF EXISTS login_attempts;
-- =======================================================================


-- =========================================================
-- 1. 游戏主体核心表 (Games)
-- =========================================================
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,  
  title_zh TEXT NOT NULL,
  title_en TEXT,
  cover_url TEXT,
  description TEXT,
  
  -- 复杂的嵌套数组直接用 TEXT 存 JSON 字符串
  aliases_json TEXT,
  metadata_json TEXT,
  downloads_json TEXT,
  media_screenshots_json TEXT,
  
  -- 媒体与互动数据
  video_url TEXT,
  download_count INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 🚀 基础搜索查询优化
CREATE INDEX IF NOT EXISTS idx_games_title_zh ON games(title_zh);
CREATE INDEX IF NOT EXISTS idx_games_title_en ON games(title_en);
CREATE INDEX IF NOT EXISTS idx_games_uuid ON games(uuid);

-- 🚀 极速排序优化 (大厂必备)
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_download_count ON games(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_games_likes ON games(likes DESC);


-- =========================================================
-- 2. 全局游戏分类/标签池 (Tags)
-- =========================================================
CREATE TABLE IF NOT EXISTS game_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);


-- =========================================================
-- 3. 玩家错误反馈与修补表 (Feedbacks)
-- =========================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 🌟 2. 核心修改：去掉了 NOT NULL！允许它存入 null (代表首页通用反馈)
  game_id INTEGER,     
  
  game_name TEXT NOT NULL,      
  contact_info TEXT,            
  content TEXT NOT NULL,        
  user_ip TEXT NOT NULL,        
  is_handled BOOLEAN DEFAULT 0, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 级联删除依然保留，如果是绑定了游戏的反馈，游戏删了反馈也删。
  -- 如果是 NULL 的通用反馈，这行规则自动忽略，完美！
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- 🚀 防刷引擎与后台面板查询优化
CREATE INDEX IF NOT EXISTS idx_feedbacks_ip_time ON feedbacks(user_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_handled ON feedbacks(is_handled);


-- =========================================================
-- 4. 论坛社区/全站用户表 (Users) 
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',      -- admin | user
  status TEXT DEFAULT 'active',  -- active | banned
  reputation INTEGER DEFAULT 0,  -- 论坛声望 / 积分余额
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- 🚀 登录与查询优化
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- =========================================================
-- 5. 网站访问日志与流量分析表 (Site Logs)
-- =========================================================
CREATE TABLE IF NOT EXISTS site_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_ip TEXT NOT NULL,
  path TEXT NOT NULL,
  user_agent TEXT,
  referer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 🚀 统计优化：用于后台快速计算今日 PV、今日 UV 等
CREATE INDEX IF NOT EXISTS idx_site_logs_created_at ON site_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_logs_ip ON site_logs(user_ip);


-- =========================================================
-- 6. 后台管理员防爆破拦截表 (Login Attempts)
-- =========================================================
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,           -- 攻击者的 IP 地址
  attempts INTEGER DEFAULT 0,    -- 连续失败次数
  last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 7. 后台登录会话表 (Sessions) —— 服务端可校验、可撤销的真实令牌
-- =========================================================
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);