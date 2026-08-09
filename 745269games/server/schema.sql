-- =======================================================================
-- 745269.com 核心数据库构建脚本 (完全优化版)
-- ⚠️ 警告：如果你想彻底清空所有本地数据重新开始，可以取消下面四行的注释
-- DROP TABLE IF EXISTS games;
-- DROP TABLE IF EXISTS game_tags;
-- DROP TABLE IF EXISTS feedbacks;
-- DROP TABLE IF EXISTS users;
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

-- 🚀 极速排序优化 (核心！大厂必备)
-- 对应前端页面的 "最新发布"、"热门下载"、"赞爆最多" 功能。
-- 加了 DESC 降序索引后，获取前20名热门游戏的 SQL 查询将从全表扫描变为瞬间读取！
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
  game_id INTEGER NOT NULL,     -- 🌟 优化：改为了 INTEGER，完美匹配 games 表的 id 类型
  game_name TEXT NOT NULL,      
  contact_info TEXT,            
  content TEXT NOT NULL,        
  user_ip TEXT NOT NULL,        
  is_handled BOOLEAN DEFAULT 0, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 🚀 防刷引擎专享索引 (IP + 时间组合查询)
CREATE INDEX IF NOT EXISTS idx_feedbacks_ip_time ON feedbacks(user_ip, created_at);

-- 🚀 后台管理员专享索引：让你在后台秒速筛选出所有 "未处理(0)" 的待办反馈
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_handled ON feedbacks(is_handled);


-- =========================================================
-- 4. 论坛社区/全站用户表 (Users) 
-- (💡 提前为你日后的论坛和积分系统挖好坑)
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

-- 🚀 登录与查询优化
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);