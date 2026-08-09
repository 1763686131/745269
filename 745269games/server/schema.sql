-- ⚠️ 警告：如果你想彻底清空所有本地数据重新开始，可以取消下面三行的注释
-- DROP TABLE IF EXISTS games;
-- DROP TABLE IF EXISTS game_tags;
-- DROP TABLE IF EXISTS feedbacks;

-- =========================================================
-- 1. 游戏主体表 (Games)
-- =========================================================
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,  -- 🌟 优化：UUID 加上 UNIQUE 唯一约束
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

-- 🚀 性能优化：为游戏标题和 UUID 建立索引，让首页的搜索接口快如闪电！
CREATE INDEX IF NOT EXISTS idx_games_title_zh ON games(title_zh);
CREATE INDEX IF NOT EXISTS idx_games_title_en ON games(title_en);
CREATE INDEX IF NOT EXISTS idx_games_uuid ON games(uuid);


-- =========================================================
-- 2. 游戏分类/标签历史记录表 (Tags)
-- =========================================================
CREATE TABLE IF NOT EXISTS game_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);


-- =========================================================
-- 3. 🌟 新增：用户反馈与纠错表 (Feedbacks)
-- =========================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,        -- 关联的游戏 ID
  game_name TEXT NOT NULL,      -- 关联的游戏名称
  contact_info TEXT,            -- 玩家联系方式 (选填)
  content TEXT NOT NULL,        -- 报错详细内容
  user_ip TEXT NOT NULL,        -- 玩家真实 IP (用于防刷拦截)
  is_handled BOOLEAN DEFAULT 0, -- 🌟 优化：方便你以后做后台(0=未处理, 1=已修复)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 🚀 性能优化：为 IP 和时间建立联合索引，让后端防刷查询瞬间完成，绝不卡顿！
CREATE INDEX IF NOT EXISTS idx_feedbacks_ip_time ON feedbacks(user_ip, created_at);