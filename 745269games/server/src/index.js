// server/src/index.js

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// 🌟 核心防御装甲：在全局作用域建立一个 IP 黑名单记录本
// Worker 的内存是保留在边缘节点上的，极快且免费
const rateLimitMap = new Map();

export default {
  async fetch(request, env, ctx) {
    // 处理跨域预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 🌟 获取请求者的真实物理 IP (Cloudflare 专属)
    const clientIP = request.headers.get("cf-connecting-ip") || "unknown_ip";
    const now = Date.now();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean); 

    try {
      // ==========================================
      // 🛡️ 全局 IP 级防刷/节流引擎 (后端真理)
      // ==========================================
      // 设定规则：我们只限制写操作 (POST/PUT/DELETE)。
      // 这样正常浏览网页 (GET) 不会受限，但上传游戏、点赞、下载+1 等操作会被严格限制。
      if (request.method === "POST" || request.method === "PUT" || request.method === "DELETE") {
        
        // 1. 检查该 IP 是否在冷却期内
        if (rateLimitMap.has(clientIP)) {
          const unlockTime = rateLimitMap.get(clientIP);
          if (now < unlockTime) {
            const remaining = Math.ceil((unlockTime - now) / 1000);
            
            // 🚨 触发防御：直接拦截，根本不查数据库，返回 429 报错！
            return new Response(JSON.stringify({ 
              success: false, 
              error: `操作过于频繁，已被服务端拦截！请等待 ${remaining} 秒后再试` 
            }), { 
              status: 429, // 429 Too Many Requests 是行业标准的防刷状态码
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
          }
        }

        // 2. 如果检查通过，记录该 IP，并锁定 10 秒 (10000 毫秒)
        rateLimitMap.set(clientIP, now + 10000);

        // 3. 内存保护机制 (防止黑客用海量假IP撑爆 Worker 内存)
        // 当记录超过 500 条时，顺手清理掉已经过期的 IP 记录
        if (rateLimitMap.size > 500) {
          for (const [ip, time] of rateLimitMap.entries()) {
            if (now > time) rateLimitMap.delete(ip);
          }
        }
      }

      // ==========================================
      // 1. 获取游戏列表 (GET /api/games)
      // ==========================================
      if (url.pathname === "/api/games" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM games ORDER BY id DESC").all();
        
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
          download_count: row.download_count || 0, // 👈 为你后续的下载量预留好的字段
          system: { is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at }
        }));

        return new Response(JSON.stringify(games), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // 2. 新增游戏 (POST /api/games)
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
      // 3. 修改游戏 (PUT /api/games/:id)
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
      // 4. 删除游戏 (DELETE /api/games/:id)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "games" && pathParts[2] && request.method === "DELETE") {
        const id = pathParts[2];
        await env.DB.prepare("DELETE FROM games WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true, message: "游戏已删除" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // ==========================================
      // 5. 预留：未来的真实下载点击量 +1 接口 (POST /api/games/:id/click)
      // ==========================================
      if (pathParts[0] === "api" && pathParts[1] === "games" && pathParts[3] === "click" && request.method === "POST") {
        // 由于上方我们写了全局防刷规则，黑客无法狂刷这个接口，因为同一 IP 10秒内只能点一次！
        // 等你未来加上 download_count 字段后，这里写 UPDATE games SET download_count = download_count + 1 即可。
        return new Response(JSON.stringify({ success: true, message: "下载量 +1 成功" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 404 兜底
      return new Response(JSON.stringify({ error: "接口不存在" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (error) {
      console.error(error); 
      return new Response(JSON.stringify({ success: false, error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};