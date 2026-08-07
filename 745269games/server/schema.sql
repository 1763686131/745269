-- server/schema.sql
DROP TABLE IF EXISTS games;

CREATE TABLE games (
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