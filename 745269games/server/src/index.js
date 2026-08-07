// server/src/index.js

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean); // ['api', 'games', '1001']

    try {
      // ==========================================
      // 1. 上传图片接口 (POST /api/upload)
      // ==========================================
      if (url.pathname === "/api/upload" && request.method === "POST") {
        // 大厂实践：这里通常会接入 Cloudflare R2 (类似阿里云OSS)
        // 接收前端传来的 FormData 图片文件，存入 R2，然后返回一个公网可访问的 URL
        
        // 此处为模拟返回逻辑（因为配置 R2 需要额外的步骤）
        const mockImageUrl = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400";
        return new Response(JSON.stringify({ 
          success: true, 
          url: mockImageUrl 
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 2. 获取游戏列表 (GET /api/games)
      // ==========================================
      if (url.pathname === "/api/games" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM games ORDER BY id DESC").all();
        
        // 数据清洗：把数据库里的字符串还原为 JSON 对象返回给前端
        const games = results.map(row => ({
          id: row.id,
          uuid: row.uuid,
          title: { zh_CN: row.title_zh, en_US: row.title_en },
          description: row.description,
          media: { 
            cover: row.cover_url, 
            screenshots: JSON.parse(row.media_screenshots_json || '[]') 
          },
          aliases: JSON.parse(row.aliases_json || '[]'),
          metadata: JSON.parse(row.metadata_json || '{"platforms":[],"genres":[]}'),
          downloads: JSON.parse(row.downloads_json || '[]'),
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
        
        return new Response(JSON.stringify({ success: true, message: "游戏上传成功" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
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

        return new Response(JSON.stringify({ success: true, message: "修改成功" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // ==========================================
      // 5. 删除游戏 (DELETE /api/games/:id)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "games" && pathParts[2] && request.method === "DELETE") {
        const id = pathParts[2];
        await env.DB.prepare("DELETE FROM games WHERE id = ?").bind(id).run();

        return new Response(JSON.stringify({ success: true, message: "游戏已删除" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 404 兜底
      return new Response(JSON.stringify({ error: "接口不存在" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (error) {
      console.error(error); // 打印日志方便调试
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};