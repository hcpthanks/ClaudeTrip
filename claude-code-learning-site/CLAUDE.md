# 日文小说阅读站（hcpthanks.com）

日文原版小说在线精读站：汉字附假名、逐句朗读、句子语法解析。纯静态 HTML/CSS/JS，发布到 GitHub Pages（`docs/`）。

> 2026-11-25：由「Claude Code 学习站」整站改版而来。旧内容归档在 `E:\WorkBuddy\CLAW\_archives\learning-site-2026-06\`。

## 目录结构

```
claude-code-learning-site/
├── index.html              # 首页：书库 + 功能说明 + 来源与版权
├── books/                  # 每本书一个阅读页（自动生成，勿手改）
│   ├── ningen-shikkaku.html
│   ├── hashire-merosu.html
│   └── kokoro.html
├── assets/
│   ├── css/site.css        # 首页样式（纸感浅色）
│   ├── css/reader.css      # 阅读页样式（生成）
│   └── js/reader.js        # 朗读 + 句子解析（生成）
├── CNAME                   # www.hcpthanks.com
├── api/ lib/ serverless/   # 原支付后端（保留，将来做 OCR 付费用；不进 docs）
├── supabase-schema.sql
└── CLAUDE.md
```

## 内容生成（不要手改生成物）

- 生成器：`E:\日语 JP\build\site_build.py`（在小说项目里运行）
- 源文本：`E:\日语 JP\aozora\<slug>.txt`（青空文库 Shift-JIS 转 UTF-8）
- 解析器：`E:\日语 JP\build\aozora.py`（处理 `《》` 注音、`｜` 起始符、`［＃］` 注记）
- 重新生成：`cd "E:\日语 JP" && python build\site_build.py`
- 增加书：把青空文库 txt 放进 `aozora/`，在 `site_build.py` 的 `BOOKS` 里加一条（slug/title/author/person/card/blurb），再生成

## 发布（双目录同步）

- 发布目录：仓库根 `docs/`，GitHub Pages 从这里发布
- 同步对象：`index.html`、`books/`、`assets/`、`CNAME`（`docs/.nojekyll` 保留）
- 后端代码（`api/`、`lib/`、`serverless/`、`supabase-schema.sql`）**绝不进入 docs**
- Push：`git -c credential.helper= push origin main`

## 阅读页功能

- 假名标注（一键隐藏）、字号、深色模式、每本书分别记忆阅读位置（`jp-scroll:<书名>`）
- 朗读：Web Speech API，逐句高亮、自动连播、语速/重复/音色
- 句子解析：选中句子点「解」，调用用户自己配置的模型（本机 Ollama 或任意 OpenAI 兼容 API），Key 只存浏览器本地；未配置时可「复制提问」粘贴到任意 AI 网页

## 设计

- 纸感浅色：`--paper:#f6f1e6`、`--ink:#241f18`、`--accent:#a8443a`
- 标题字体优先 `Yu Mincho`（日文），中文回退 `Source Han Serif SC` / `SimSun`
- 阅读页正文用明朝体；每页必须有 `<meta name="description">`、favicon、`role="main"`

## 版权

- 只公开**公有领域**作品（作者逝世满 70 年），文本注明青空文库出处与底本
- 用户上传扫描书属于付费功能（开发中）：仅本人可见、不公开、不索引，按页计费、先付费后处理

## 开发约束

- 不引入框架或构建工具；页面加载不许依赖外部 CDN（国内访问）
- 生成器改 `E:\日语 JP\build\`，改完必须重新生成并本地起服务验证
- 阅读页/首页改动后，`docs/` 同步再提交
