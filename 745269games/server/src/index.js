// server/src/index.js

// 统一的跨域头配置
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // 允许任何来源访问 (本地开发必备)
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    // 1. 处理浏览器的 OPTIONS 预检请求 (解决跨域报错的核心)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // ==========================================
      // 🚀 路由 1: 获取游戏列表 (GET /api/games)
      // ==========================================
      if (url.pathname === "/api/games" && request.method === "GET") {
        
        // 这里的 env.DB 对应你在 wrangler.toml 里的 binding
        // const { results } = await env.DB.prepare("SELECT * FROM games ORDER BY id DESC").all();
        
        // 为了让你现在能跑通，我先返回你之前存在 Pinia 里的假数据格式
        const mockData = [
          { id: 1001, title: { zh_CN: "塞尔达传说：旷野之息" }, metadata: { platforms: ["PC", "Switch"] } }
        ];

        return new Response(JSON.stringify(mockData), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // ==========================================
      // 🚀 路由 2: 上传/保存游戏 (POST /api/games)
      // ==========================================
      if (url.pathname === "/api/games" && request.method === "POST") {
        const body = await request.json();
        
        // 这里未来写插入 D1 数据库的逻辑
        // await env.DB.prepare("INSERT INTO games (...) VALUES (...)").bind(...).run();
        
        return new Response(JSON.stringify({ success: true, message: "上传成功", data: body }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 404 兜底
      return new Response(JSON.stringify({ error: "接口不存在" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (error) {
      // 全局错误捕获
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};