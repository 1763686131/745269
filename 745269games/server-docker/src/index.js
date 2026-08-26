import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto'; // 用于生成 UUID
import bcrypt from 'bcrypt'; // 🔥 用于密码哈希加密

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 1233;

// 告诉 Express 信任前方的代理层(Docker网桥/Cloudflare)
// 加上这句，req.ip 才能穿透 172.20.0.1 拿到真实 IP！
app.set('trust proxy', true);
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

// ================= 2.5 流量监控雷达 (全局记录访客日志) =================
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.') && !req.path.startsWith('/api/')) {
    const clientIP = req.headers['cf-connecting-ip'] || 
                     (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : '') || 
                     req.ip || "unknown_ip";
                     
    const path = req.path;
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const referer = req.headers['referer'] || '';

    try {
      // 1. 记录最新的一条访客轨迹
      db.prepare(`
        INSERT INTO site_logs (user_ip, path, user_agent, referer) 
        VALUES (?, ?, ?, ?)
      `).run(clientIP, path, userAgent, referer);

      // 🌟 2. 核心补丁：无情死神清道夫！
      // 每次有新访客进来，顺手把 30 天前（或者也可以设为 7 天前）的旧日志物理删除！
      // 这样这个表永远只有最近一个月的鲜活数据，数据库永远保持极速状态！
      db.prepare(`
        DELETE FROM site_logs 
        WHERE created_at < datetime('now', '-30 days')
      `).run();

    } catch (error) {
      console.error("记录流量日志失败:", error.message);
    }
  }
  next();
});

// ==========================================
// 3. 后端 API 接口区 (纯正 Express 语法)
// ==========================================

// 🛠️ 提取公共数据格式化方法，避免代码臃肿
const formatGameData = (results) => {
  return results.map(row => ({
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
};

// ================= 🔥 密码哈希加密与验证 =================
// 1. 加密密码（注册或修改密码时使用）
const hashPassword = async (plainPassword) => {
  try {
    const saltRounds = 10; // 加密强度，10 是推荐值
    const hashed = await bcrypt.hash(plainPassword, saltRounds);
    console.log('[哈希加密] 明文密码已加密');
    return hashed;
  } catch (error) {
    console.error('[哈希加密] ❌ 加密失败:', error.message);
    throw error;
  }
};

// 2. 验证密码（登录时使用）
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    console.log('[验证密码] 开始验证...');
    console.log('[验证密码] 输入密码:', plainPassword);
    console.log('[验证密码] 存储密码:', hashedPassword.substring(0, 20) + '...');

    // 🔥 判断：如果数据库存的是明文（兼容旧数据）
    if (!hashedPassword.startsWith('$2b$') && !hashedPassword.startsWith('$2a$')) {
      console.log('[验证密码] 检测到明文密码，直接比对');
      const result = (plainPassword === hashedPassword);
      console.log('[验证密码] 比对结果:', result ? '✅ 成功' : '❌ 失败');
      return result;
    }

    // 🔥 使用 bcrypt 验证哈希密码
    const result = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('[验证密码] 哈希比对结果:', result ? '✅ 成功' : '❌ 失败');
    return result;
  } catch (error) {
    console.error('[验证密码] ❌ 异常:', error.message);
    return false;
  }
};

// ================= 🔥 创建登录会话（支持多设备）=================
const createSession = (userId) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    console.log('生成新 token:', token.substring(0, 20) + '...');

    // 🔥 关键：如果 sessions 表不存在，自动创建
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 插入新会话
    db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, datetime('now', '+7 days'))
    `).run(token, userId);
    console.log('会话已插入数据库');

    // 清理过期会话
    const cleanResult = db.prepare(`DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`).run();
    console.log('清理过期会话:', cleanResult.changes, '条');

    return token;
  } catch (error) {
    console.error('❌ 创建会话失败:', error);
    throw error;
  }
};

// 🌟【核心中间件】拦截后台 API，验证管理员登录会话
// 🔥 从 sessions 表验证 token，支持多设备登录
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({ error: '请先登录后台' });
  }

  try {
    // 🔥 查询 sessions 表，关联 users 表
    const session = db.prepare(`
      SELECT s.token, u.id as userId, u.username, u.role
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
    `).get(token);

    if (!session || session.role !== 'admin') {
      console.log('[verifyAdmin] token 验证失败');
      return res.status(403).json({ error: '登录已过期或权限不足，请重新登录' });
    }

    console.log('[verifyAdmin] token 验证通过，用户:', session.username);
    req.adminUser = session;
    next();
  } catch (error) {
    console.error('[verifyAdmin] 验证异常:', error.message);
    return res.status(500).json({ error: '验证失败，请重新登录' });
  }
};


// ================= [前台专属 API：完全公开] =================

// 1. 前台：获取游戏列表 (严格在 SQL 层面写死 is_active = 1，绝不外泄)
app.get('/api/games', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const tags = req.query.tags; 

    // 强行锁死只查询上架数据
    let sql = "SELECT * FROM games WHERE is_active = 1";
    const bindParams = [];

    if (tags) {
      const tagArray = tags.split(',').filter(Boolean);
      if (tagArray.length > 0) {
        const conditions = tagArray.map(() => `(metadata_json LIKE ? OR aliases_json LIKE ?)`);
        sql += " AND (" + conditions.join(" OR ") + ")";
        tagArray.forEach(tag => bindParams.push(`%${tag}%`, `%${tag}%`));
      }
    }

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    bindParams.push(limit, offset);

    const results = db.prepare(sql).all(...bindParams);
    res.json(formatGameData(results));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. 前台：搜索接口 (同样锁死 is_active = 1)
app.get('/api/games/search', (req, res) => {
  const keyword = req.query.q || "";
  const searchTerm = `%${keyword}%`;

  const results = db.prepare(`
    SELECT * FROM games
    WHERE is_active = 1 AND (title_zh LIKE ? OR title_en LIKE ?)
    ORDER BY id DESC
  `).all(searchTerm, searchTerm);

  res.json(formatGameData(results));
});

// 🌟 2.5 前台：随机抽取游戏（抽奖专用）
app.post('/api/games/random', (req, res) => {
  try {
    const { genres = [], players, platform, count = 4 } = req.body;

    console.log('📦 收到抽奖请求:', { genres, players, platform, count });

    // 基础条件：只抽取上架游戏
    let sql = "SELECT * FROM games WHERE is_active = 1";
    const bindParams = [];

    // 1. 游戏类型筛选
    if (genres && genres.length > 0) {
      const mainGenres = ['动作', '冒险', '模拟', '角色扮演', '休闲'];
      const hasOther = genres.includes('其他');
      const normalGenres = genres.filter(g => g !== '其他');

      if (hasOther && normalGenres.length > 0) {
        // 选了"其他"和具体类型
        const genreConditions = [];
        const notMainConditions = [];

        normalGenres.forEach(g => {
          genreConditions.push("metadata_json LIKE ?");
          bindParams.push(`%${g}%`);
        });

        mainGenres.forEach(g => {
          notMainConditions.push("metadata_json NOT LIKE ?");
          bindParams.push(`%${g}%`);
        });

        sql += " AND ((" + genreConditions.join(" OR ") + ") OR (" + notMainConditions.join(" AND ") + "))";
      } else if (hasOther) {
        // 只选了"其他"：匹配不属于主要类型的游戏
        mainGenres.forEach(g => {
          sql += " AND metadata_json NOT LIKE ?";
          bindParams.push(`%${g}%`);
        });
      } else {
        // 只选了具体类型
        const genreConditions = normalGenres.map(() => "metadata_json LIKE ?");
        sql += " AND (" + genreConditions.join(" OR ") + ")";
        normalGenres.forEach(g => bindParams.push(`%${g}%`));
      }
    }

    // 2. 游戏人数筛选
    if (players) {
      if (players === 'single') {
        sql += " AND metadata_json LIKE ?";
        bindParams.push('%单人%');
      } else if (players === 'multi') {
        sql += " AND (metadata_json LIKE ? OR metadata_json LIKE ?)";
        bindParams.push('%双人%', '%派对%');
      } else if (players === 'lan') {
        sql += " AND metadata_json LIKE ?";
        bindParams.push('%派对%');
      }
    }

    // 3. 平台筛选
    if (platform) {
      sql += " AND metadata_json LIKE ?";
      bindParams.push(`%${platform}%`);
    }

    console.log('🔍 执行 SQL:', sql);
    console.log('🔍 参数:', bindParams);

    // 查询符合条件的所有游戏
    const allMatched = db.prepare(sql).all(...bindParams);

    console.log('✅ 匹配到游戏数量:', allMatched.length);

    // 如果结果少于请求数量，直接返回
    if (allMatched.length <= count) {
      return res.json(formatGameData(allMatched));
    }

    // 🌟 随机打乱并抽取指定数量
    const shuffled = allMatched.sort(() => Math.random() - 0.5);
    const randomGames = shuffled.slice(0, count);

    console.log('🎲 随机抽取了', randomGames.length, '个游戏');

    res.json(formatGameData(randomGames));
  } catch (error) {
    console.error('❌ 随机抽取失败:', error);
    res.status(500).json({ error: '抽取失败: ' + error.message });
  }
});


// ================= [后台专属 API：高重防线] =================

// 3. 后台：获取全量游戏列表 (必须经过 verifyAdmin 校验)
app.get('/api/admin/games', verifyAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const tags = req.query.tags; 

    // 后台无视 is_active，拉取全部
    let sql = "SELECT * FROM games WHERE 1=1";
    const bindParams = [];

    if (tags) {
      const tagArray = tags.split(',').filter(Boolean);
      if (tagArray.length > 0) {
        const conditions = tagArray.map(() => `(metadata_json LIKE ? OR aliases_json LIKE ?)`);
        sql += " AND (" + conditions.join(" OR ") + ")";
        tagArray.forEach(tag => bindParams.push(`%${tag}%`, `%${tag}%`));
      }
    }

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    bindParams.push(limit, offset);

    const results = db.prepare(sql).all(...bindParams);
    res.json(formatGameData(results));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. 后台：全量搜索 (必须经过 verifyAdmin 校验)
app.get('/api/admin/games/search', verifyAdmin, (req, res) => {
  const keyword = req.query.q || "";
  const searchTerm = `%${keyword}%`;

  const results = db.prepare(`
    SELECT * FROM games 
    WHERE (title_zh LIKE ? OR title_en LIKE ?) 
    ORDER BY id DESC
  `).all(searchTerm, searchTerm);
  
  res.json(formatGameData(results));
});

// 3. 新增游戏
app.post('/api/games', verifyAdmin, (req, res) => {
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

// ==========================================
// 4. 修改游戏 (基础信息编辑)
// ==========================================
app.put('/api/games/:id', verifyAdmin, (req, res) => {
  try {
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
  } catch (error) {
    console.error("❌ 修改游戏失败:", error.message);
    res.status(500).json({ success: false, error: "修改游戏失败: " + error.message });
  }
});

// ==========================================
// 🌟 4.1 切换游戏上下架状态 (双状态秒切)
// ==========================================
app.put('/api/games/:id/status', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    
    // SQLite 中通常用 1 表示 true (上架)，0 表示 false (下架)
    const isActiveStatus = body.is_active ? 1 : 0;
    
    db.prepare(`
      UPDATE games 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(isActiveStatus, id);
    
    res.json({ success: true, message: "状态已成功切换" });
  } catch (error) {
    console.error("❌ 状态切换失败:", error.message);
    res.status(500).json({ success: false, error: "状态切换失败: " + error.message });
  }
});

// 5. 删除游戏
app.delete('/api/games/:id', verifyAdmin, (req, res) => {
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
app.post('/api/tags', verifyAdmin, (req, res) => {
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

// 9. 用户提交报错与反馈 (最终优雅版)
app.post('/api/feedback', (req, res) => {
  try {
    const body = req.body;
    const clientIP = req.headers['cf-connecting-ip'] || 
                     (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : '') || 
                     req.ip || "unknown_ip";
    
    // 120 秒防刷
    const recentFeedbacks = db.prepare(`
      SELECT id FROM feedbacks 
      WHERE user_ip = ? AND created_at > datetime('now', '-120 seconds')
    `).all(clientIP);

    if (recentFeedbacks && recentFeedbacks.length > 0) {
      return res.status(429).json({ success: false, error: "提交太频繁啦，请等待 2 分钟后再试！" });
    }

    // 🌟 既然数据库允许为空了，碰到首页传来的 0 或 ''，我们直接转成 null 塞进去！
    const finalGameId = (body.game_id === 0 || body.game_id === '0' || body.game_id === '') ? null : body.game_id;

    db.prepare(`
      INSERT INTO feedbacks (game_id, game_name, contact_info, content, user_ip)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      finalGameId, 
      body.game_name || '【未指定游戏】通用反馈', 
      body.contact_info || '', 
      body.content || '', 
      clientIP
    );
    
    res.json({ success: true, message: "反馈提交成功！" });

  } catch (error) {
    console.error("❌ 数据库写入崩溃:", error.message);
    res.status(500).json({ success: false, error: "数据库报错: " + error.message });
  }
});

// 10. 获取所有反馈列表
app.get('/api/feedbacks', verifyAdmin, (req, res) => {
  const results = db.prepare("SELECT * FROM feedbacks ORDER BY id DESC LIMIT 50").all();
  res.json(results);
});

// 11. 切换反馈状态/标记已解决
app.put('/api/feedbacks/:id', verifyAdmin, (req, res) => {
  const id = req.params.id;
  const body = req.body;
  db.prepare("UPDATE feedbacks SET is_handled = ? WHERE id = ?").run(body.is_handled ? 1 : 0, id);
  res.json({ success: true });
});

// 12. 删除反馈
app.delete('/api/feedbacks/:id', verifyAdmin, (req, res) => {
  const id = req.params.id;
  db.prepare("DELETE FROM feedbacks WHERE id = ?").run(id);
  res.json({ success: true });
});

// 13. 获取用户列表
app.get('/api/users', verifyAdmin, (req, res) => {
  const results = db.prepare(`
    SELECT id, username, email, avatar_url, role, status, reputation, created_at, last_login_at
    FROM users ORDER BY id DESC LIMIT 100
  `).all();
  res.json(results);
});

// 14. 新增用户
app.post('/api/users', verifyAdmin, async (req, res) => {
  try {
    const body = req.body;
    const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(body.username);

    if (existingUser) {
      return res.status(400).json({ success: false, error: "用户名已存在，请换一个" });
    }

    // 🔥 使用哈希加密密码
    const hashedPassword = await hashPassword(body.password || '');

    db.prepare(`
      INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)
    `).run(body.username, hashedPassword, body.email || '', body.role || 'user', 'active');

    res.json({ success: true });
  } catch (error) {
    console.error('❌ 添加用户失败:', error);
    res.status(500).json({ success: false, error: '添加用户失败' });
  }
});

// 15. 删除用户
app.delete('/api/users/:id', verifyAdmin, (req, res) => {
  const id = req.params.id;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ success: true });
});

// 16. 获取访问数据概要
app.get('/api/analytics/summary', verifyAdmin, (req, res) => {
  try {
    // 修复时区：使用 localtime 确保今日数据的准确性
    const todayPvRes = db.prepare("SELECT COUNT(*) as count FROM site_logs WHERE date(created_at, 'localtime') = date('now', 'localtime')").get();
    const todayUvRes = db.prepare("SELECT COUNT(DISTINCT user_ip) as count FROM site_logs WHERE date(created_at, 'localtime') = date('now', 'localtime')").get();
    const totalVisitsRes = db.prepare("SELECT COUNT(*) as count FROM site_logs").get();
    const totalDownloadsRes = db.prepare("SELECT SUM(download_count) as total FROM games").get();

    res.json({
      todayPv: todayPvRes?.count || 0,
      todayUv: todayUvRes?.count || 0,
      totalVisits: totalVisitsRes?.count || 0,
      totalDownloads: totalDownloadsRes?.total || 0
    });
  } catch (err) {
    res.json({ todayPv: 0, todayUv: 0, totalVisits: 0, totalDownloads: 0 });
  }
});

// 17. 获取实时访问日志明细 (🌟 升级为分页版)
app.get('/api/analytics/logs', verifyAdmin, (req, res) => {
  try {
    // 接收前端传来的参数，默认 100 条
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // 1. 先查出整个表一共多少条数据，供前端计算页数
    const countRes = db.prepare("SELECT COUNT(*) as count FROM site_logs").get();
    const total = countRes ? countRes.count : 0;

    // 2. 根据分页参数，查出当前页的数据
    const data = db.prepare("SELECT * FROM site_logs ORDER BY id DESC LIMIT ? OFFSET ?").all(limit, offset);
    
    // 3. 把总数和数据打包一起返回给前端
    res.json({ total, data });
  } catch (err) {
    res.json({ total: 0, data: [] });
  }
});

// 17.5 管理员手动一键清空所有访问日志
app.delete('/api/analytics/logs', verifyAdmin, (req, res) => {
  try {
    // 物理清空 site_logs 表
    db.prepare("DELETE FROM site_logs").run();
    res.json({ success: true, message: "访问日志已成功清空！" });
  } catch (err) {
    console.error("清空访问日志失败:", err.message);
    res.status(500).json({ success: false, error: "清空失败: " + err.message });
  }
});

// 18. 后台管理员高安全登录
app.post('/api/login', (req, res) => {
  try {
    console.log('=== 登录请求开始 ===');
    const body = req.body;
    console.log('请求体:', { username: body.username, hasPassword: !!body.password });

    const ip = req.ip || req.headers['x-forwarded-for'] || "unknown_ip";
    console.log('客户端 IP:', ip);

    let attemptRecord = db.prepare("SELECT attempts, last_attempt FROM login_attempts WHERE ip = ?").get(ip);
    console.log('登录尝试记录:', attemptRecord);

    if (attemptRecord && (new Date() - new Date(attemptRecord.last_attempt)) > 24 * 60 * 60 * 1000) {
      db.prepare("UPDATE login_attempts SET attempts = 0, last_attempt = CURRENT_TIMESTAMP WHERE ip = ?").run(ip);
      attemptRecord.attempts = 0;
      console.log('已重置登录尝试次数');
    }

    const attempts = attemptRecord ? attemptRecord.attempts : 0;
    console.log('当前失败次数:', attempts);

    if (attempts >= 5) {
      console.log('IP 已被锁定');
      return res.status(429).json({
        success: false,
        error: "密码错误次数过多，为保障系统安全，您的IP已被锁定24小时！"
      });
    }

    console.log('查询用户:', body.username);
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'").get(body.username);
    console.log('用户查询结果:', user ? { id: user.id, username: user.username, hasPassword: !!user.password } : null);

    if (!user) {
      console.log('用户不存在');
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

    console.log('开始验证密码...');
    const passwordValid = await verifyPassword(body.password || '', user.password);
    console.log('密码验证结果:', passwordValid);

    if (!passwordValid) {
      console.log('密码错误，记录失败次数');
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

    console.log('密码验证成功');

    console.log('重置登录尝试次数');
    db.prepare("UPDATE login_attempts SET attempts = 0 WHERE ip = ?").run(ip);

    // 🔥 每次登录都创建新会话，支持多设备
    console.log('创建新会话...');
    const userToken = createSession(user.id);
    console.log('会话创建成功');

    console.log('=== 登录成功 ===');
    res.json({ success: true, token: userToken, username: user.username });
  } catch (error) {
    console.error('❌ 登录接口错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: '服务器内部错误，请查看后端日志',
      details: error.message
    });
  }
});

// 19. 后台退出登录：只清除当前设备的 token
app.post('/api/logout', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    // 🔥 只删除当前 token，不影响其他设备
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    console.log('当前设备 token 已清除');
  }
  res.json({ success: true });
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