-- server/schema.sql

-- ⚠️ 警告：如果你想彻底清空所有本地数据重新开始，可以取消下面两行的注释
-- DROP TABLE IF EXISTS games;
-- DROP TABLE IF EXISTS game_tags;

-- 1. 游戏主体表
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  title_en TEXT,
  cover_url TEXT,
  description TEXT,
  
  -- 复杂的嵌套数组直接用 TEXT 存 JSON 字符串
  aliases_json TEXT,
  metadata_json TEXT,
  downloads_json TEXT,
  media_screenshots_json TEXT,
  
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 🌟 新增：游戏分类/标签历史记录表
CREATE TABLE IF NOT EXISTS game_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);