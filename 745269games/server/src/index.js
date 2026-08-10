import express from 'express';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 5269;

// ======= 【核心修复 1：纯手工跨域，彻底抛弃 cors 插件】 =======
app.use((req, res, next) => {
  // 允许所有前端域名访问
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  // 允许的请求方式
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  // 允许带的请求头 (极其重要：X-Requested-With 也是常用头)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 关键：如果是浏览器发来的 OPTIONS 预检请求，直接返回 204 无内容放行，绝不能往下走！
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// 解析 JSON 请求体 (必须放在跨域放行的下面)
app.use(express.json()); 

// 1. 初始化数据库 (持久化在 data 文件夹)
const dbPath = './data/database.sqlite';
const db = new Database(dbPath);

// 如果数据库是空的，自动执行 schema.sql 建表
try {
  const schemaPath = './schema.sql';
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ 数据库表结构校验完毕');
  }
} catch (err) {
  console.error('⚠️ 执行 schema.sql 失败，请检查文件路径:', err);
}

// 🛡️ 终极安全防御响应头
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// 🛡️ 全局防刷/节流引擎
const rateLimitMap = new Map();

// ======= 【核心修复 2：防止内存泄漏的定时清理机制】 =======
setInterval(() => {
  const now = Date.now();
  for (let [key, unlockTime] of rateLimitMap.entries()) {
    if (now > unlockTime) rateLimitMap.delete(key);
  }
}, 10 * 60 * 1000); // 每 10 分钟打扫一次战场

app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    if (req.path.includes('/interact')) return next();
    
    const clientIP = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || "unknown_ip";
    const now = Date.now();
    const apiType = req.path.split('/')[2] || "general";
    const limitKey = `${clientIP}_${apiType}`;

    if (rateLimitMap.has(limitKey)) {
      const unlockTime = rateLimitMap.get(limitKey);
      if (now < unlockTime) {
        const remaining = Math.ceil((unlockTime - now) / 1000);
        return res.status(429).json({ 
          success: false, 
          error: `操作过于频繁，已被服务端拦截！请等待 ${remaining} 秒后再试` 
        });
      }
    }
    rateLimitMap.set(limitKey, now + 10 * 1000);
  }
  next();
});

// ==========================================
// 🚀 业务路由开始
// ==========================================

// 1. 获取分页游戏/分类栏目列表
app.get('/api/games', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const tags = req.query.tags;

    let sql = "SELECT * FROM games";
    const bindParams = [];

    if (tags) {
      const tagArray = tags.split(',').filter(Boolean);
      if (tagArray.length > 0) {
        const conditions = tagArray.map(() => `(metadata_json LIKE ? OR aliases_json LIKE ?)`);
        sql += " WHERE " + conditions.join(" OR ");
        tagArray.forEach(tag => bindParams.push(`%${tag}%`, `%${tag}%`));
      }
    }

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    bindParams.push(limit, offset);

    const results = db.prepare(sql).all(...bindParams);
    
    const games = results.map(row => ({
      id: row.id,
      uuid: row.uuid,
      title: { zh_CN: row.title_zh, en_US: row.title_en },
      description: row.description,
      media: { cover: row.cover_url, screenshots: JSON.parse(row.media_screenshots_json || '[]'), video: row.video_url || '' },
      aliases: JSON.parse(row.aliases_json || '[]'),
      metadata: JSON.parse(row.metadata_json || '{"platforms":[],"genres":[]}'),
      downloads: JSON.parse(row.downloads_json || '[]'),
      download_count: row.download_count || 0, 
      likes: row.likes || 0,
      system: { is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at }
    }));
    res.json(games);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 真实服务端搜索接口
app.get('/api/games/search', (req, res) => {
  try {
    const keyword = req.query.q || "";
    const searchTerm = `%${keyword}%`;
    const results = db.prepare(`SELECT * FROM games WHERE title_zh LIKE ? OR title_en LIKE ? ORDER BY id DESC`).all(searchTerm, searchTerm);
    
    // 必须和列表接口保持字段一致，否则搜索结果在前端会白屏！
    const games = results.map(row => ({
      id: row.id,
      uuid: row.uuid,
      title: { zh_CN: row.title_zh, en_US: row.title_en },
      description: row.description,
      media: { cover: row.cover_url, screenshots: JSON.parse(row.media_screenshots_json || '[]'), video: row.video_url || '' },
      aliases: JSON.parse(row.aliases_json || '[]'),
      metadata: JSON.parse(row.metadata_json || '{"platforms":[],"genres":[]}'),
      downloads: JSON.parse(row.downloads_json || '[]'),
      download_count: row.download_count || 0, 
      likes: row.likes || 0,
      system: { is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at }
    }));
    res.json(games);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. 新增游戏
app.post('/api/games', (req, res) => {
  try {
    const body = req.body;
    const uuid = crypto.randomUUID();
    db.prepare(`
      INSERT INTO games (uuid, title_zh, title_en, cover_url, description, aliases_json, metadata_json, downloads_json, media_screenshots_json, video_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid, body.title?.zh_CN || '', body.title?.en_US || '', body.media?.cover || '', body.description || '',
      JSON.stringify(body.aliases || []), JSON.stringify(body.metadata || {}), JSON.stringify(body.downloads || []), JSON.stringify(body.media?.screenshots || []), body.media?.video || ''
    );
    res.json({ success: true, message: "游戏上传成功" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======= 【核心修复 3：游戏详情接口数据映射结构修正】 =======
app.get('/api/games/:id', (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "未能找到该游戏" });

    // 绝对不能用循环去 parse JSON，必须手动建立映射字典！
    const gameData = {
      id: row.id,
      uuid: row.uuid,
      title: { zh_CN: row.title_zh, en_US: row.title_en },
      description: row.description,
      media: { 
        cover: row.cover_url, 
        screenshots: JSON.parse(row.media_screenshots_json || '[]'), 
        video: row.video_url || '' 
      },
      aliases: JSON.parse(row.aliases_json || '[]'),
      metadata: JSON.parse(row.metadata_json || '{"platforms":[],"genres":[]}'),
      downloads: JSON.parse(row.downloads_json || '[]'),
      download_count: row.download_count || 0, 
      likes: row.likes || 0,
      system: { is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at }
    };
    
    res.json(gameData);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. 互动引擎：增加下载量与赞爆数
app.post('/api/games/:id/interact', (req, res) => {
  try {
    if (req.body.type === 'download') {
      db.prepare("UPDATE games SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?").run(req.params.id);
    } else if (req.body.type === 'like') {
      db.prepare("UPDATE games SET likes = COALESCE(likes, 0) + 1 WHERE id = ?").run(req.params.id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 18. 后台管理员登录
app.post('/api/login', (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'").get(req.body.username);
    if (!user || user.password !== req.body.password) {
      return res.json({ success: false, error: `账号或密码错误！`});
    }
    const token = "ADMIN_TOKEN_" + user.id + "_" + Date.now();
    res.json({ success: true, token: token, username: user.username });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚨 兜底 404
app.use((req, res) => {
  res.status(404).json({ error: "接口不存在或路径拼写错误" });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 本地后端已启动，运行在 http://localhost:${PORT}`);
});