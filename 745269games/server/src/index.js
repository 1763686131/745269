const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const rateLimitMap = new Map();

export default {
  async fetch(request, env, ctx) {
    // 跨域预检
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const clientIP = request.headers.get("cf-connecting-ip") || "unknown_ip";
    const now = Date.now();
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean); 

    try {
      // 🛡️ 全局防刷/节流引擎 (只限制写操作)
      if (request.method === "POST" || request.method === "PUT" || request.method === "DELETE") {
        
        // 🎯 核心修复：把认 IP 的“全局锁”改为“IP + 具体接口”的独立锁！
        // 比如 '127.0.0.1_tags' 和 '127.0.0.1_games' 是两把不同的锁，互不影响
        const apiType = pathParts[1] || "general"; 
        const limitKey = `${clientIP}_${apiType}`;

        if (rateLimitMap.has(limitKey)) {
          const unlockTime = rateLimitMap.get(limitKey);
          if (now < unlockTime) {
            const remaining = Math.ceil((unlockTime - now) / 1000);
            return new Response(JSON.stringify({ 
              success: false, 
              error: `操作过于频繁，已被服务端拦截！请等待 ${remaining} 秒后再试` 
            }), { 
              status: 429, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
          }
        }
        // 锁定 10 秒
        rateLimitMap.set(limitKey, now + 10 * 1000);
      }

      // ==========================================
      // 1. 获取分页游戏/分类栏目列表 (GET /api/games?limit=x&offset=y&tags=a,b)
      // ==========================================
      if (url.pathname === "/api/games" && request.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit")) || 10;
        const offset = parseInt(url.searchParams.get("offset")) || 0;
        const tags = url.searchParams.get("tags"); // 👈 拿到前端传来的 分类标签

        let sql = "SELECT * FROM games";
        const bindParams = [];

        // 💡 核心逻辑：如果前端传了 tags 参数，动态拼接 WHERE 搜索条件
        if (tags) {
          // 将 "双人,多人同屏" 拆分成数组 ['双人', '多人同屏']
          const tagArray = tags.split(',').filter(Boolean);
          
          if (tagArray.length > 0) {
            // 我们去 metadata_json 或 aliases_json 里模糊匹配这些标签
            const conditions = tagArray.map(() => `(metadata_json LIKE ? OR aliases_json LIKE ?)`);
            // 用 OR 连接，意味着只要满足“双人”或者“多人同屏”任意一个，就把数据拿出来
            sql += " WHERE " + conditions.join(" OR ");
            
            // 把每个词的通配符塞进参数表
            tagArray.forEach(tag => {
              bindParams.push(`%${tag}%`, `%${tag}%`);
            });
          }
        }

        // 拼接排序和分页
        sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
        bindParams.push(limit, offset);

        // 执行动态 SQL
        const { results } = await env.DB.prepare(sql).bind(...bindParams).all();
        
        const games = results.map(row => ({
          id: row.id,
          uuid: row.uuid,
          title: { zh_CN: row.title_zh, en_US: row.title_en },
          description: row.description,
          media: { cover: row.cover_url, screenshots: JSON.parse(row.media_screenshots_json || '[]') },
          aliases: JSON.parse(row.aliases_json || '[]'),
          metadata: JSON.parse(row.metadata_json || '{"platforms":[],"genres":[]}'),
          downloads: JSON.parse(row.downloads_json || '[]'),
          download_count: row.download_count || 0, 
          system: { is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at }
        }));

        return new Response(JSON.stringify(games), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 🌟 2. 真实服务端搜索接口 (GET /api/games/search?q=xxx)
      // ==========================================
      if (url.pathname === "/api/games/search" && request.method === "GET") {
        const keyword = url.searchParams.get("q") || "";
        const searchTerm = `%${keyword}%`;

        // 核心 SQL：同时在中文和英文标题中模糊搜索
        const { results } = await env.DB.prepare(`
          SELECT * FROM games 
          WHERE title_zh LIKE ? OR title_en LIKE ? 
          ORDER BY id DESC
        `).bind(searchTerm, searchTerm).all();
        
        const games = results.map(row => ({
          id: row.id,
          uuid: row.uuid,
          title: { zh_CN: row.title_zh, en_US: row.title_en },
          description: row.description,
          media: { cover: row.cover_url, screenshots: JSON.parse(row.media_screenshots_json || '[]') },
          aliases: JSON.parse(row.aliases_json || '[]'),
          metadata: JSON.parse(row.metadata_json || '{"platforms":[],"genres":[]}'),
          downloads: JSON.parse(row.downloads_json || '[]'),
          download_count: row.download_count || 0,
          system: { is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at }
        }));

        return new Response(JSON.stringify(games), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 3. 新增游戏 (POST /api/games)
      // ==========================================
      if (url.pathname === "/api/games" && request.method === "POST") {
        const body = await request.json();
        const uuid = crypto.randomUUID();
        
        const stmt = env.DB.prepare(`
          INSERT INTO games (
            uuid, title_zh, title_en, cover_url, description, 
            aliases_json, metadata_json, downloads_json, media_screenshots_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          uuid,
          body.title?.zh_CN || '',
          body.title?.en_US || '',
          body.media?.cover || '',
          body.description || '',
          JSON.stringify(body.aliases || []),
          JSON.stringify(body.metadata || {}),
          JSON.stringify(body.downloads || []),
          JSON.stringify(body.media?.screenshots || [])
        );
        await stmt.run();
        return new Response(JSON.stringify({ success: true, message: "游戏上传成功" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 4. 修改游戏 (PUT /api/games/:id)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "games" && pathParts[2] && request.method === "PUT") {
        const id = pathParts[2];
        const body = await request.json();

        const stmt = env.DB.prepare(`
          UPDATE games SET 
            title_zh = ?, title_en = ?, cover_url = ?, description = ?,
            aliases_json = ?, metadata_json = ?, downloads_json = ?, media_screenshots_json = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          body.title?.zh_CN || '',
          body.title?.en_US || '',
          body.media?.cover || '',
          body.description || '',
          JSON.stringify(body.aliases || []),
          JSON.stringify(body.metadata || {}),
          JSON.stringify(body.downloads || []),
          JSON.stringify(body.media?.screenshots || []),
          id
        );
        await stmt.run();
        return new Response(JSON.stringify({ success: true, message: "修改成功" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 5. 删除游戏 (DELETE /api/games/:id)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "games" && pathParts[2] && request.method === "DELETE") {
        const id = pathParts[2];
        await env.DB.prepare("DELETE FROM games WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true, message: "游戏已删除" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 6. 获取单个游戏详情 (GET /api/games/:id)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "games" && pathParts[2] && request.method === "GET") {
        const id = pathParts[2];
        
        // 1. 从 D1 数据库查询单条数据
        const { results } = await env.DB.prepare("SELECT * FROM games WHERE id = ?").bind(id).all();
        
        if (results.length === 0) {
          return new Response(JSON.stringify({ error: "未能找到该游戏" }), { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }
        
        let gameData = { ...results[0] };
        
        // 🎯 核心修复：把 D1 里的所有 JSON 字符串字段，自动还原成前端需要的对象/数组！
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

        // 2. 返回完全解包好的完整对象
        return new Response(JSON.stringify(gameData), { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // ==========================================
      // 7. 获取与保存历史分类标签 (GET / POST /api/tags)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "tags") {
        
        // 【获取标签】
        if (request.method === "GET") {
          // 获取最新的 30 个独立标签
          const { results } = await env.DB.prepare("SELECT name FROM game_tags ORDER BY id DESC LIMIT 30").all();
          const tags = results.map(r => r.name);
          return new Response(JSON.stringify(tags), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        
        // 【新增标签】
        if (request.method === "POST") {
          const { tags } = await request.json(); // 接收前端传来的数组，如 ['动作', '冒险']
          if (tags && tags.length > 0) {
            // 使用 INSERT OR IGNORE，数据库如果有这个词了就忽略，没有才新增，绝不重复！
            const stmt = env.DB.prepare("INSERT OR IGNORE INTO game_tags (name) VALUES (?)");
            const batch = tags.map(tag => stmt.bind(tag));
            await env.DB.batch(batch); // 批量高效插入
          }
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      
      // 🚨 兜底：如果你的请求没匹配到上面的任何路由，就会报 404
      return new Response(JSON.stringify({ error: "接口不存在或路径拼写错误" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (error) {
      console.error(error); 
      // 🚨 报错透传：如果后端 SQL 写错了或者崩溃了，直接把错误原因告诉前端
      return new Response(JSON.stringify({ success: false, error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }




  }
};
