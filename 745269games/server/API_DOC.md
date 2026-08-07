# 游戏资源管理后台 API 文档

Base URL (本地开发): http://localhost:8787

## 接口列表

### 1. 获取所有游戏列表

接口地址: /api/games

请求方式: GET

请求参数: 无

返回示例:


```JSON
[
  {
    "id": 1,
    "uuid": "xxxxx-xxxx-xxxx",
    "title": { "zh_CN": "塞尔达传说", "en_US": "Zelda" },
    "description": "好玩的游戏...",
    "media": {
      "cover": "https://...",
      "screenshots": ["https://...", "https://..."]
    },
    "metadata": { "platforms": ["Switch"], "genres": ["动作"] },
    "downloads": [
      { "platform": "Switch", "sources": [] }
    ],
    "system": { "is_active": 1 }
  }
]

```

### 2. 新增游戏 (上传)

接口地址: /api/games

请求方式: POST

Content-Type: application/json

请求 Body: (完全对应前端 formData.value 的结构)

```JSON
{
  "title": { "zh_CN": "黑神话：悟空", "en_US": "Black Myth: Wukong" },
  "description": "国产 3A 大作",
  "media": {
    "cover": "https://...",
    "screenshots": ["https://..."]
  },
  "aliases": ["猴子", "Wukong"],
  "metadata": { "platforms": ["PC", "PS5"], "genres": ["动作", "RPG"] },
  "downloads": [
    {
      "platform": "PC",
      "edition": "标准版",
      "file_format": "压缩包",
      "file_size_display": "118 GB",
      "sources": [
         { "name": "百度网盘", "url": "https://...", "password": "123" }
      ]
    }
  ]
}

```

返回示例:

```JSON
{ "success": true, "message": "游戏上传成功" }
```

### 3. 修改游戏

接口地址: /api/games/:id  (例如：/api/games/1)

请求方式: PUT

请求 Body: 结构同上 POST

返回示例:

```JSON
{ "success": true, "message": "修改成功" }
```

### 4. 删除游戏

接口地址: /api/games/:id

请求方式: DELETE

返回示例:

```JSON
{ "success": true, "message": "游戏已删除" }
```

### 5. 图片上传 (目前为模拟接口，待接入 Cloudflare R2)

接口地址: /api/upload

请求方式: POST

Content-Type: multipart/form-data

请求 Body: 包含 file 字段的表单文件

返回示例:

```JSON
{
  "success": true,
  "url": "https://返回的图片外链地址.jpg"
}
```
