import json
import sqlite3
import os
import opencc
from datetime import datetime
  
# =======================================================================
# 1. 核心数据库建表脚本 (已将 is_active 默认值修改为 0)
# =======================================================================
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,  
  title_zh TEXT NOT NULL,
  title_en TEXT,
  cover_url TEXT,
  description TEXT,
  
  aliases_json TEXT,
  metadata_json TEXT,
  downloads_json TEXT,
  media_screenshots_json TEXT,
  
  video_url TEXT,
  download_count INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT 0, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',      
  status TEXT DEFAULT 'active',  
  reputation INTEGER DEFAULT 0,  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);
"""

# =======================================================================
# 2. 数据库初始化与默认账号注入
# =======================================================================
db_name = 'database.sqlite'
conn = sqlite3.connect(db_name)
cursor = conn.cursor()
cursor.executescript(SCHEMA_SQL)

cursor.execute('''
INSERT OR IGNORE INTO users (id, username, password, role)
VALUES (1, '741200', '741200', 'admin')
''')
conn.commit()

# =======================================================================
# 3. 翻译引擎、字典与白名单
# =======================================================================
print("正在加载 OpenCC 繁简转换引擎...")
converter = opencc.OpenCC('hk2s')

LANG_MAP = {
    "ja": "日语", "en": "英语", "es": "西班牙语", "fr": "法语",
    "de": "德语", "it": "意大利语", "nl": "荷兰语", "pt": "葡萄牙语",
    "ru": "俄语", "ko": "韩语", "zh": "中文", 
    "zh-Hans": "简体中文", "zh-Hant": "繁体中文"
}
ALLOWED_LANGS = {"简体中文", "繁体中文", "英语", "日语", "中文"}

# =======================================================================
# 4. 数据融合与写入
# =======================================================================
us_file = 'US.en.json'
hk_file = 'HK.zh.json'
en_title_map = {}

if os.path.exists(us_file):
    print(f"正在读取英文数据库 {us_file}...")
    with open(us_file, 'r', encoding='utf-8') as f:
        us_data = json.load(f)
        for nsu_id, game_info in us_data.items():
            tid = game_info.get('id')
            if tid and len(tid) == 16:
                en_title_map[tid] = game_info.get('name', '')

if not os.path.exists(hk_file):
    print(f"错误：找不到 {hk_file} 数据文件！")
    exit()

print(f"正在读取中文数据库 {hk_file} 并进行严格过滤与格式重构...")
with open(hk_file, 'r', encoding='utf-8') as f:
    hk_data = json.load(f)

insert_count = 0
skip_count = 0

for nsu_id, game_info in hk_data.items():
    uuid = game_info.get('id')
    if not uuid or len(uuid) != 16:
        continue
        
    cover_url = game_info.get('iconUrl')
    if not cover_url:
        skip_count += 1
        continue
        
    # 1. 中英文名处理
    raw_name = game_info.get('name') or '未知游戏'
    title_zh = converter.convert(raw_name)
    title_en = en_title_map.get(uuid, '')

    # 2. 游戏简介
    raw_desc = game_info.get('description') or ''
    description_zh = converter.convert(raw_desc) if raw_desc else ''

    # 3. 语言白名单过滤
    raw_langs = game_info.get('languages') or []
    mapped_langs = [LANG_MAP.get(lang, lang) for lang in raw_langs]
    filtered_langs = [lang for lang in mapped_langs if lang in ALLOWED_LANGS]
    unique_langs = list(set(filtered_langs))
    if "中文" in unique_langs and "简体中文" not in unique_langs:
        unique_langs.remove("中文")
        unique_langs.append("简体中文")
    aliases_json = json.dumps(unique_langs, ensure_ascii=False)

    # 4. 截图处理
    raw_screenshots = game_info.get('screenshots') or []
    screenshots_list = []
    for ss in raw_screenshots:
        if isinstance(ss, dict) and 'url' in ss:
            screenshots_list.append(ss['url'])
        elif isinstance(ss, str):
            screenshots_list.append(ss)
    media_screenshots_json = json.dumps(screenshots_list, ensure_ascii=False)

    # 5. 解析发售时间 (将 releaseDate 转为 DATETIME)
    raw_release = str(game_info.get('releaseDate', '')).strip()
    created_at_val = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if raw_release and raw_release != '0':
        if len(raw_release) == 8 and raw_release.isdigit():
            created_at_val = f"{raw_release[:4]}-{raw_release[4:6]}-{raw_release[6:]} 00:00:00"
        elif len(raw_release) >= 10 and raw_release[4] == '-' and raw_release[7] == '-':
            created_at_val = f"{raw_release[:10]} 00:00:00"

    # 6. 重新构建元数据分类格式 (metadata_json)
    raw_publisher = game_info.get('publisher') or ''
    publisher_zh = converter.convert(raw_publisher) if raw_publisher else ''
    
    raw_categories = game_info.get('category') or []
    category_zh = [converter.convert(cat) for cat in raw_categories] if isinstance(raw_categories, list) else []
    
    size_bytes = game_info.get('size') or 0
    size_gb = round(size_bytes / (1024 ** 3), 2) if size_bytes else 0.0
    
    metadata_dict = {
        "platforms": ["Switch"],         
        "genres": category_zh,           
        "publisher": publisher_zh,      
        "size_gb": size_gb,
        "nsu_id": nsu_id
    }
    metadata_json = json.dumps(metadata_dict, ensure_ascii=False)
    
    # 7. 下载信息模板
    downloads_dict = [{"status": "待传", "format": "NSP/XCI", "link": "", "password": "", "version": "", "has_dlc": False, "notes": ""}]
    downloads_json = json.dumps(downloads_dict, ensure_ascii=False)

    # 8. 执行数据库写入
    cursor.execute('''
    INSERT INTO games (
        uuid, title_zh, title_en, cover_url, description,
        metadata_json, downloads_json, 
        aliases_json, media_screenshots_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(uuid) DO UPDATE SET
        title_zh = excluded.title_zh,
        title_en = excluded.title_en,
        cover_url = excluded.cover_url,
        description = excluded.description,
        metadata_json = excluded.metadata_json,
        aliases_json = excluded.aliases_json,
        media_screenshots_json = excluded.media_screenshots_json,
        created_at = excluded.created_at,  
        updated_at = CURRENT_TIMESTAMP
    ''', (
        uuid, title_zh, title_en, cover_url, description_zh,
        metadata_json, downloads_json, 
        aliases_json, media_screenshots_json, created_at_val
    ))
    
    insert_count += 1

conn.commit()
conn.close()

print(f"🎉 成功！所有入库的 {insert_count} 款游戏状态默认为 0 (待发布隐藏状态)。")