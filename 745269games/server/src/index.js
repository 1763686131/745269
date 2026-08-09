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
        
        // 🌟 核心修复：如果是点赞/下载的 interact 互动接口，直接放行，不参与 10 秒死锁！
        // 因为前端已经做了严格的 10 秒防抖，这里再锁会导致同时提交下载和点赞时报 429
        if (pathParts[3] !== "interact") {
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
          // 普通后台操作（如修改游戏、传数据）继续严密锁定 10 秒
          rateLimitMap.set(limitKey, now + 10 * 1000);
        }
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
          media: { cover: row.cover_url, screenshots: JSON.parse(row.media_screenshots_json || '[]'), video: row.video_url || '' },
          aliases: JSON.parse(row.aliases_json || '[]'),
          metadata: JSON.parse(row.metadata_json || '{"platforms":[],"genres":[]}'),
          downloads: JSON.parse(row.downloads_json || '[]'),
          download_count: row.download_count || 0, 
          likes: row.likes || 0,
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
          // 👇 同样在这里加上 video
          media: { cover: row.cover_url, screenshots: JSON.parse(row.media_screenshots_json || '[]'), video: row.video_url || '' },
          aliases: JSON.parse(row.aliases_json || '[]'),
          metadata: JSON.parse(row.metadata_json || '{"platforms":[],"genres":[]}'),
          downloads: JSON.parse(row.downloads_json || '[]'),
          download_count: row.download_count || 0,
          likes: row.likes || 0,
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
            aliases_json, metadata_json, downloads_json, media_screenshots_json, video_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) -- 👈 注意这里变成了 10 个问号
        `).bind(
          uuid,
          body.title?.zh_CN || '',
          body.title?.en_US || '',
          body.media?.cover || '',
          body.description || '',
          JSON.stringify(body.aliases || []),
          JSON.stringify(body.metadata || {}),
          JSON.stringify(body.downloads || []),
          JSON.stringify(body.media?.screenshots || []),
          body.media?.video || '' // 👈 新增：把前端传来的视频地址绑进去！
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
            video_url = ?, 
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
          body.media?.video || '', // 👈 新增：绑定视频数据
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
        // ... (你原来的 tags 代码保留)
      }

      // ==========================================
      // 8. 互动引擎：增加下载量与赞爆数 (POST /api/games/:id/interact)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "games" && pathParts[3] === "interact" && request.method === "POST") {
        const id = pathParts[2];
        const body = await request.json();
        if (body.type === 'download') {
          await env.DB.prepare("UPDATE games SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?").bind(id).run();
        } else if (body.type === 'like') {
          await env.DB.prepare("UPDATE games SET likes = COALESCE(likes, 0) + 1 WHERE id = ?").bind(id).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 9. 用户提交报错与反馈 (POST /api/feedback)
      // ==========================================
      if (url.pathname === "/api/feedback" && request.method === "POST") {
        const body = await request.json();
        const { results: recentFeedbacks } = await env.DB.prepare(`
          SELECT id FROM feedbacks 
          WHERE user_ip = ? AND created_at > datetime('now', '-1 day')
        `).bind(clientIP).all();

        if (recentFeedbacks && recentFeedbacks.length > 0) {
          return new Response(JSON.stringify({ success: false, error: "为防止恶意提交，同一IP每天仅限反馈一次，请您明天再来哦！感谢支持。" }), { 
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }

        const stmt = env.DB.prepare(`
          INSERT INTO feedbacks (game_id, game_name, contact_info, content, user_ip)
          VALUES (?, ?, ?, ?, ?)
        `).bind(body.game_id || '', body.game_name || '', body.contact_info || '', body.content || '', clientIP);
        await stmt.run();
        return new Response(JSON.stringify({ success: true, message: "反馈提交成功！" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 10. 管理员：获取所有反馈列表 (GET /api/feedbacks)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "feedbacks" && request.method === "GET") {
        const { results } = await env.DB.prepare(`
          SELECT * FROM feedbacks ORDER BY id DESC LIMIT 50
        `).all();
        return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 11. 管理员：切换反馈状态/标记已解决 (PUT /api/feedbacks/:id)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "feedbacks" && pathParts[2] && request.method === "PUT") {
        const id = pathParts[2];
        const body = await request.json();
        await env.DB.prepare("UPDATE feedbacks SET is_handled = ? WHERE id = ?").bind(body.is_handled ? 1 : 0, id).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 12. 管理员：删除反馈 (DELETE /api/feedbacks/:id)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "feedbacks" && pathParts[2] && request.method === "DELETE") {
        const id = pathParts[2];
        await env.DB.prepare("DELETE FROM feedbacks WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // 🚨 兜底拦截器（千万保证这行代码在最后面，上面所有 if 没匹配到才会走到这里）
      return new Response(JSON.stringify({ error: "接口不存在或路径拼写错误" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (error) {
      console.error(error); 
      // 🚨 报错透传
      return new Response(JSON.stringify({ success: false, error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};