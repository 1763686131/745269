import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto'; // 用于生成 UUID

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 1233;

// 解析 JSON 格式的请求体
app.use(express.json());

// ================= 1. 数据库初始化 =================
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const dbPath = path.join(dbDir, 'database.sqlite');
const db = new Database(dbPath);

const schemaPath = path.join(__dirname, '../schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql); 
  console.log('数据库表结构校验完毕。');
}

// ================= 2. 全局防刷/节流引擎 (Express 中间件) =================
const rateLimitMap = new Map();
app.use('/api', (req, res, next) => {
  const clientIP = req.ip || req.headers['x-forwarded-for'] || "unknown_ip";
  const now = Date.now();

  // 只拦截 POST, PUT, DELETE (写操作)
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    // 放行 interact 接口（点赞/下载）
    if (!req.path.includes('/interact')) {
      const apiType = req.path.split('/')[1] || "general"; 
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
  }
  next();
});

// ==========================================
// 3. 后端 API 接口区 (纯正 Express 语法)
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
        tagArray.forEach(tag => {
          bindParams.push(`%${tag}%`, `%${tag}%`);
        });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. 真实服务端搜索接口
app.get('/api/games/search', (req, res) => {
  const keyword = req.query.q || "";
  const searchTerm = `%${keyword}%`;

  const results = db.prepare(`
    SELECT * FROM games 
    WHERE title_zh LIKE ? OR title_en LIKE ? 
    ORDER BY id DESC
  `).all(searchTerm, searchTerm);
  
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
});

// 3. 新增游戏
app.post('/api/games', (req, res) => {
  const body = req.body;
  const uuid = crypto.randomUUID();
  
  db.prepare(`
    INSERT INTO games (
      uuid, title_zh, title_en, cover_url, description, 
      aliases_json, metadata_json, downloads_json, media_screenshots_json, video_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuid,
    body.title?.zh_CN || '',
    body.title?.en_US || '',
    body.media?.cover || '',
    body.description || '',
    JSON.stringify(body.aliases || []),
    JSON.stringify(body.metadata || {}),
    JSON.stringify(body.downloads || []),
    JSON.stringify(body.media?.screenshots || []),
    body.media?.video || ''
  );
  res.json({ success: true, message: "游戏上传成功" });
});

// 4. 修改游戏
app.put('/api/games/:id', (req, res) => {
  const id = req.params.id;
  const body = req.body;

  db.prepare(`
    UPDATE games SET 
      title_zh = ?, title_en = ?, cover_url = ?, description = ?,
      aliases_json = ?, metadata_json = ?, downloads_json = ?, media_screenshots_json = ?,
      video_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.title?.zh_CN || '',
    body.title?.en_US || '',
    body.media?.cover || '',
    body.description || '',
    JSON.stringify(body.aliases || []),
    JSON.stringify(body.metadata || {}),
    JSON.stringify(body.downloads || []),
    JSON.stringify(body.media?.screenshots || []),
    body.media?.video || '',
    id
  );
  res.json({ success: true, message: "修改成功" });
});

// 5. 删除游戏
app.delete('/api/games/:id', (req, res) => {
  const id = req.params.id;
  db.prepare("DELETE FROM games WHERE id = ?").run(id);
  res.json({ success: true, message: "游戏已删除" });
});

// 6. 获取单个游戏详情
app.get('/api/games/:id', (req, res) => {
  const id = req.params.id;
  const row = db.prepare("SELECT * FROM games WHERE id = ?").get(id);
  
  if (!row) {
    return res.status(404).json({ error: "未能找到该游戏" });
  }
  
  let gameData = { ...row };
  const jsonFields = ['title', 'media', 'metadata', 'downloads', 'aliases', 'system'];
  jsonFields.forEach(field => {
    if (typeof gameData[field] === 'string') {
      try {
        gameData[field] = JSON.parse(gameData[field]);
      } catch (e) {
        console.error(`解析字段 ${field} 失败:`, e);
      }
    }
  });

  res.json(gameData);
});

// ==========================================
// 7. 获取与保存历史分类标签 (GET / POST /api/tags)
// ==========================================

// 【获取标签】
app.get('/api/tags', (req, res) => {
  try {
    // 获取最新的 30 个独立标签 (注意你原表名是 game_tags)
    const results = db.prepare("SELECT name FROM game_tags ORDER BY id DESC LIMIT 30").all();
    
    // 把 [{name: '动作'}, {name: '冒险'}] 转换为扁平数组 ['动作', '冒险']
    const tags = results.map(r => r.name);
    
    res.json(tags);
  } catch (err) {
    console.error("获取标签报错:", err.message);
    // 兜底机制：即使表不存在或报错，也返回空数组让前端正常渲染
    res.json([]);
  }
});

// 【新增标签】
app.post('/api/tags', (req, res) => {
  try {
    const { tags } = req.body; // 接收前端传来的数组，如 ['动作', '冒险']
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // 准备好原汁原味的 INSERT OR IGNORE 语句，自带绝对去重防御
      const insertStmt = db.prepare("INSERT OR IGNORE INTO game_tags (name) VALUES (?)");
      
      // 🌟 核心优化：使用 SQLite 事务 (Transaction) 替代 Cloudflare 的 batch
      // 这样相当于把所有数据打包成一个包裹一次性塞进硬盘，写入速度提升几十倍！
      const insertBatch = db.transaction((tagsArray) => {
        for (const tag of tagsArray) {
          if (tag && typeof tag === 'string' && tag.trim() !== '') {
            insertStmt.run(tag.trim());
          }
        }
      });
      
      // 执行批量高效插入
      insertBatch(tags);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("保存标签报错:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});



// 8. 互动引擎：增加下载量与赞爆数
app.post('/api/games/:id/interact', (req, res) => {
  const id = req.params.id;
  const body = req.body;
  if (body.type === 'download') {
    db.prepare("UPDATE games SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?").run(id);
  } else if (body.type === 'like') {
    db.prepare("UPDATE games SET likes = COALESCE(likes, 0) + 1 WHERE id = ?").run(id);
  }
  res.json({ success: true });
});

// 9. 用户提交报错与反馈
app.post('/api/feedback', (req, res) => {
  const body = req.body;
  const clientIP = req.ip || req.headers['x-forwarded-for'] || "unknown_ip";
  
  const recentFeedbacks = db.prepare(`
    SELECT id FROM feedbacks 
    WHERE user_ip = ? AND created_at > datetime('now', '-1 day')
  `).all(clientIP);

  if (recentFeedbacks && recentFeedbacks.length > 0) {
    return res.status(429).json({ success: false, error: "为防止恶意提交，同一IP每天仅限反馈一次，请您明天再来哦！感谢支持。" });
  }

  db.prepare(`
    INSERT INTO feedbacks (game_id, game_name, contact_info, content, user_ip)
    VALUES (?, ?, ?, ?, ?)
  `).run(body.game_id || '', body.game_name || '', body.contact_info || '', body.content || '', clientIP);
  
  res.json({ success: true, message: "反馈提交成功！" });
});

// 10. 获取所有反馈列表
app.get('/api/feedbacks', (req, res) => {
  const results = db.prepare("SELECT * FROM feedbacks ORDER BY id DESC LIMIT 50").all();
  res.json(results);
});

// 11. 切换反馈状态/标记已解决
app.put('/api/feedbacks/:id', (req, res) => {
  const id = req.params.id;
  const body = req.body;
  db.prepare("UPDATE feedbacks SET is_handled = ? WHERE id = ?").run(body.is_handled ? 1 : 0, id);
  res.json({ success: true });
});

// 12. 删除反馈
app.delete('/api/feedbacks/:id', (req, res) => {
  const id = req.params.id;
  db.prepare("DELETE FROM feedbacks WHERE id = ?").run(id);
  res.json({ success: true });
});

// 13. 获取用户列表
app.get('/api/users', (req, res) => {
  const results = db.prepare(`
    SELECT id, username, email, avatar_url, role, status, reputation, created_at, last_login_at 
    FROM users ORDER BY id DESC LIMIT 100
  `).all();
  res.json(results);
});

// 14. 新增用户
app.post('/api/users', (req, res) => {
  const body = req.body;
  const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(body.username);
  
  if (existingUser) {
    return res.status(400).json({ success: false, error: "用户名已存在，请换一个" });
  }

  db.prepare(`
    INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)
  `).run(body.username, body.password, body.email || '', body.role || 'user', 'active');

  res.json({ success: true });
});

// 15. 删除用户
app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ success: true });
});

// 16. 获取访问数据概要
app.get('/api/analytics/summary', (req, res) => {
  const todayPvRes = db.prepare("SELECT COUNT(*) as count FROM site_logs WHERE created_at > date('now', 'start of day')").get();
  const todayUvRes = db.prepare("SELECT COUNT(DISTINCT user_ip) as count FROM site_logs WHERE created_at > date('now', 'start of day')").get();
  const totalVisitsRes = db.prepare("SELECT COUNT(*) as count FROM site_logs").get();
  const totalDownloadsRes = db.prepare("SELECT SUM(download_count) as total FROM games").get();

  res.json({
    todayPv: todayPvRes?.count || 0,
    todayUv: todayUvRes?.count || 0,
    totalVisits: totalVisitsRes?.count || 0,
    totalDownloads: totalDownloadsRes?.total || 0
  });
});

// 17. 获取实时访问日志明细
app.get('/api/analytics/logs', (req, res) => {
  const results = db.prepare("SELECT * FROM site_logs ORDER BY id DESC LIMIT 50").all();
  res.json(results);
});

// 18. 后台管理员高安全登录
app.post('/api/login', (req, res) => {
  const body = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || "unknown_ip";

  let attemptRecord = db.prepare("SELECT attempts, last_attempt FROM login_attempts WHERE ip = ?").get(ip);
  
  if (attemptRecord && (new Date() - new Date(attemptRecord.last_attempt)) > 24 * 60 * 60 * 1000) {
    db.prepare("UPDATE login_attempts SET attempts = 0, last_attempt = CURRENT_TIMESTAMP WHERE ip = ?").run(ip);
    attemptRecord.attempts = 0;
  }

  const attempts = attemptRecord ? attemptRecord.attempts : 0;

  if (attempts >= 5) {
    return res.status(429).json({ 
      success: false, 
      error: "密码错误次数过多，为保障系统安全，您的IP已被锁定24小时！" 
    });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'").get(body.username);

  if (!user || user.password !== body.password) {
    if (attemptRecord) {
      db.prepare("UPDATE login_attempts SET attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP WHERE ip = ?").run(ip);
    } else {
      db.prepare("INSERT INTO login_attempts (ip, attempts) VALUES (?, 1)").run(ip);
    }
    
    const newAttempts = attempts + 1;
    return res.json({ 
      success: false, 
      error: `账号或密码错误！今天还有 ${5 - newAttempts} 次机会。`,
      requireCaptcha: newAttempts >= 3
    });
  }

  db.prepare("UPDATE login_attempts SET attempts = 0 WHERE ip = ?").run(ip);
  const token = "ADMIN_TOKEN_" + user.id + "_" + Date.now();
  
  res.json({ success: true, token: token, username: user.username });
});


// ================= 4. 前端静态页面托管 (极其关键) =================
const distPath = path.join(__dirname, '../dist');

app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API 接口不存在' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 全栈服务已启动！浏览器访问地址: http://localhost:${PORT}`);
});