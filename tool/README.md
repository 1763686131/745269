# 


github搜 blawar/titledb项目它的代码库中提供了按语言/地区分类的完整文件。这些文件包含了所有游戏的官方名称、发行商和对应的 Title ID


# 下载港区中文游戏数据

```bash
curl -O https://raw.githubusercontent.com/blawar/titledb/master/HK.zh.json

# 下载国行中文游戏数据
curl -O https://raw.githubusercontent.com/blawar/titledb/master/CN.zh.json


# 如果报错就用这个方法
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/blawar/titledb/master/HK.zh.json" -OutFile "HK.zh.json"

```

浏览器直接下载
用最传统的浏览器下载法：

把这个网址复制到你的浏览器（如 Chrome 或 Edge）地址栏并回车：
[https://raw.githubusercontent.com/blawar/titledb/master/HK.zh.json]
(https://raw.githubusercontent.com/blawar/titledb/master/HK.zh.json)

页面加载出来后（你会看到满屏的代码），在页面空白处 右键点击 -> 另存为 (Save as...)。

把文件名确认保存为 HK.zh.json 即可。

国行表也是一样的操作，网址是：

[https://raw.githubusercontent.com/blawar/titledb/master/CN.zh.json]
(https://raw.githubusercontent.com/blawar/titledb/master/CN.zh.json)

下载英文数据文件 (US.en.json)
将文件命名为 US.en.json

[https://raw.githubusercontent.com/blawar/titledb/master/US.en.json]
(https://raw.githubusercontent.com/blawar/titledb/master/US.en.json)



繁体字转简体字：
控制台：

```bash

py -m pip install opencc

```