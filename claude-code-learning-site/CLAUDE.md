# Claude Code 学习站

纯静态 HTML/CSS/JS 构建的 Claude Code 互动学习网站，面向国内用户。

## 技术栈

- 纯静态 HTML + CSS + JS，无框架、无构建工具
- 暗色主题（GitHub-dark 风格）
- localStorage 做解锁状态 + 激活码跨设备恢复
- 无需后端、无需数据库、无需登录

## 文件结构

```
claude-code-learning-site/
├── index.html                  # 首页（五级路线 + 6预备课 + 4应用课 + 6入门卡片）
├── CLAUDE.md                   # 本文件
├── package.json                # Vercel Functions 依赖（supabase-js）
├── vercel.json                 # Vercel 部署配置（Node.js 20.x）
├── .env.example                # 环境变量模板（微信支付 + Supabase）
├── supabase-schema.sql         # 数据库 schema（orders + activation_codes）
├── assets/
│   ├── css/
│   │   ├── common.css          # 全局样式（设计令牌、布局、组件、插图）
│   │   ├── paywall.css         # 付费墙样式
│   │   └── quiz.css            # 考核系统样式
│   ├── js/
│   │   ├── common.js           # 公共脚本（复制按钮、导航高亮、滚动监听）
│   │   ├── nav.js              # 共享导航栏（一处修改全站生效）
│   │   ├── site-config.js      # 站点配置（域名白名单、官方链接，改域名只改此文件）
│   │   ├── anti-theft.js       # 防盗保护（域名锁、支付劫持、DevTools检测、DOM投毒）
│   │   ├── paywall.js          # 付费墙逻辑（含内联防盗降级，localStorage + 渲染）
│   │   ├── recovery.js         # 激活码系统（生成 + 校验，含 checksum 自验证）
│   │   └── quiz.js             # 考核系统（含内联防盗降级，5题/80%/冷却/手写）
│   └── images/
│       ├── README.md           # 截图规范和文件清单
│       ├── screenshots/        # 静态截图（PNG，1280×720）
│       └── gifs/               # 操作演示（MP4，10-30秒）
├── api/                        # Vercel Serverless Functions（支付后端）
│   ├── create-order.js         # POST 创建微信 Native 支付订单
│   ├── check-order.js          # GET 轮询订单支付状态
│   └── payment-notify.js       # POST 微信支付结果回调（验签+解密+发码）
├── lib/
│   └── wechat-pay.js           # 微信支付工具库（API v3 签名/下单/查单/验签/激活码）
├── pre-basics/                 # 预备课（7 模块简化模板，始终免费）
│   ├── computer-basics.html    # ① 认识你的电脑
│   ├── open-powershell.html    # ② 第一次打开 PowerShell
│   ├── install-claude-code.html # ③ 安装 Claude Code
│   ├── first-conversation.html # ④ 第一次跟 AI 对话
│   ├── file-basics.html        # ⑤ 文件与文件夹基础
│   ├── when-things-go-wrong.html # ⑥ 遇到错误怎么办
│   └── deepseek-setup.html     # ⑦ 让 Claude Code 在国内也能用
├── applied/                    # 🆕 应用课（10 模块模板，含付费墙）
│   ├── ai-for-business.html    # ① AI 能帮你做什么
│   ├── talk-to-ai.html         # ② 怎么让 AI 听懂你
│   ├── ai-writing.html         # ③ 让 AI 帮你写文案
│   └── bridge-to-coding.html   # ④ 接下来学什么
├── beginner/                   # 入门课程（6个主题，10 模块模板）
│   ├── claude-intro.html       # ① Claude Code 简介
│   ├── plan-guide.html         # ② /plan 命令完全指南
│   ├── shortcuts.html          # ③ 快捷键大全
│   ├── conversation-skills.html # ④ 对话技巧入门
│   ├── project-init.html       # ⑤ 项目初始化
│   └── daily-workflow.html     # ⑥ 日常工作流
├── intermediate/               # 进阶课程（待建）
├── expert/                     # 专家课程（待建）
└── pay/
    ├── pay.html                # 支付页（sim/real 双模式，¥1强制/¥5单页/¥99全站）
    ├── success.html            # 支付成功页（显示激活码，服务端码优先）
    └── recover.html            # 激活码恢复页
```

## 设计系统

### 色彩令牌（`common.css :root`）

| 用途 | 变量 | 值 |
|------|------|-----|
| 背景 | `--bg` | `#0d1117` |
| 表面 | `--surface` | `#161b22` |
| 边框 | `--border` | `#30363d` |
| 文字 | `--text` | `#c9d1d9` |
| 次要文字 | `--text-muted` | `#8b949e` |
| 强调色 | `--accent` | `#58a6ff` |
| 绿色（成功） | `--green` | `#3fb950` |
| 橙色（警告） | `--orange` | `#d2991d` |
| 紫色（付费） | `--purple` | `#a371f7` |

### 等级色

| 等级 | 颜色 | 用途 |
|------|------|------|
| 预备课 | `--lv-prebasics: #f0a860` | 暖黄顶部条纹（全免费） |
| 应用课 | `--lv-applied: #2eaadc` | 青色顶部条纹（AI帮生意） |
| 入门 | `--lv-beginner: #3fb950` | 绿色顶部条纹 |
| 进阶 | `--lv-intermediate: #d2991d` | 橙色顶部条纹 |
| 专家 | `--lv-expert: #a371f7` | 紫色顶部条纹 |

### 排版

- 中文字体：`-apple-system, 'Noto Sans SC', sans-serif`
- 代码字体：`'JetBrains Mono', 'Fira Code', monospace`
- 文件上限：800 行（CSS 当前 ~900 行）

## 教学模板

### 预备课：7 模块简化模板

预备课面向电脑零基础用户。每个页面**始终免费**，不包含付费墙。

```
① 这个能帮你做什么 — 一句话，用生活场景
② 一步一步来 — 每步 1 张截图 + 1 句话 + "你应该看到"检查点
③ 再看一遍 — 完整流程 GIF（10-30 秒无声循环）
④ 常见坑 — 2-3 个易犯错误 + 解决方案（每个配截图）
⑤ 做一遍 — 实操练习
⑥ 速查卡 — 打印友好卡片
⑦ 学到了什么 — 勾选确认清单
────── 考核 ──────
⑩ 学习考核 — 5道选择题，答对4题（80%）即通过
```

### 入门/进阶/专家：10 模块教学模板

每个主题页面**必须**遵循此结构（shortcuts.html 例外，它是参考卡而非教学页）：

```
① 核心理解 — 一句话说清这是什么
② 输入模式 — 怎么用（方式/公式/命令）
③ 实战场景 — 什么时候用
④ 好 vs 烂 — 正确用法 vs 错误用法（表格）
⑤ 工作流 — 标准操作流程（steps 图表）
────── 付费墙 ──────
⑥ 练习 — 互动练习题（翻转卡片/自测/改写）
⑦ 快速掌握 — 勾选清单
⑧ 速查卡 — 打印友好的白底黑字速查表
⑨ 总结 — 双栏：🎯最常用 + ⚠️最易错
────── 考核 ──────
⑩ 学习考核 — 5道选择题，答对4题（80%）即通过
```

### ⑩ 考核区域 HTML

```html
<section class="quiz-section" data-topic="TOPIC_ID">
  <div id="quiz-container"></div>
</section>
```

题目数据在 `assets/js/quiz.js` 的 `QUIZ_DATA` 对象中定义。

**页面中 ⑥-⑨ 必须包裹在：**
```html
<div class="paywall-container" data-topic="TOPIC_ID">
  <div class="paywall-content">
    <!-- ⑥-⑨ sections -->
  </div>
  <div class="paywall-fade"></div>
  <div class="paywall-card">...</div>
</div>
```

## 添加新页面的步骤

1. 复制任意已有入门页面作为模板
2. 改 hero `<h1>` 和 `<title>`（后缀用 `— 入门`）
3. 填充 ①-⑨ 内容，标记好付费墙和 ⑩ 考核区域
4. 在 `assets/js/nav.js` 的三个 window 变量里加新 topic（`TOPIC_ORDER` + `TOPIC_NAMES` + `TOPIC_PAGES` + `NAV_PAGES`）—— **这是唯一的 topic 定义源**
5. 在 `assets/js/quiz.js` 的 `QUIZ_DATA` 里加 5 道选择题 + 手写内容
6. 更新 `index.html`：卡片加 `data-topic` 属性，如非首个则自动锁定
7. 所有其他文件（`recovery.js`、`pay.html`、`success.html`、`recover.html`）自动从 `window.TOPIC_*` 读取，无需额外修改

## 付费系统

### 支付架构

```
用户浏览器（pay.html）
  │
  ├─ sim 模式（默认）→ localStorage 直接写入，无需后端
  │
  └─ real 模式（商户号下来后启用）
      ├─ POST /api/create-order  → 微信统一下单 → 返回 code_url → 前端渲染二维码
      ├─ 用户扫码支付
      ├─ 微信回调 POST /api/payment-notify → 验签 → AES解密 → 更新 Supabase → 生成激活码
      └─ 前端轮询 GET /api/check-order → 已支付 → 跳转 success.html
```

### 后端栈

| 层 | 技术 |
|----|------|
| 计算 | Vercel Serverless Functions（Node.js 20.x） |
| 数据库 | Supabase（PostgreSQL + RLS） |
| 支付 | 微信支付 API v3（Native 支付，RSA-SHA256 签名） |
| 激活码 | 客户端 checksum 自校验算法（recovery.js）+ 服务端同算法生成（wechat-pay.js） |

### 环境变量（Vercel 部署时配置）

| 变量 | 用途 |
|------|------|
| `WECHAT_MCH_ID` | 微信商户号 |
| `WECHAT_API_KEY` | API v3 密钥（32字符，也作 AES 回调解密密钥） |
| `WECHAT_CERT_SERIAL_NO` | 商户 API 证书序列号 |
| `WECHAT_PRIVATE_KEY` | 商户 API 私钥（PEM） |
| `WECHAT_PLATFORM_CERT` | 微信支付平台证书（PEM，用于验签回调） |
| `WECHAT_PLATFORM_CERT_SNO` | 平台证书序列号 |
| `WECHAT_NOTIFY_URL` | 回调地址（如 `https://xxx.vercel.app/api/payment-notify`） |
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥（check-order 用） |
| `SUPABASE_SERVICE_ROLE` | Supabase Service Role（create-order/payment-notify 用） |
| `CORS_ORIGIN` | 允许的前端域名（默认 `https://hcpthanks.github.io`） |

### 价格强制定价（服务端，单位：分）

| plan | 价格 | 说明 |
|------|------|------|
| `all` | 9900（¥99） | 全站永久解锁 |
| `single` | 500（¥5） | 单页解锁 |
| `force` | 100（¥1） | 考核跳过 |

### 激活码格式

- 格式：`CC-{type}{topic}{rand2}-{check4}`（如 `CC-A0XK-W9M3`）
- 服务端（wechat-pay.js）与客户端（recovery.js）使用相同算法
- `verifyActivationCode()` 通过 checksum 自校验，无需查数据库
- 真实支付时 success.html 优先展示服务端生成的码

### 状态存储

| Key | 类型 | 说明 |
|-----|------|------|
| `cc-learn-all-access` | `"true"` / 不存在 | 全站永久解锁 |
| `cc-learn-unlocked` | JSON 数组 | 单页解锁的 topic ID 列表 |
| `cc-activation-codes` | JSON 对象 | 激活码缓存（同浏览器） |

### Topic ID 映射

| ID | 页面 | 中文名 |
|----|------|--------|
| `pc-basics` | computer-basics.html | 认识你的电脑 |
| `open-ps` | open-powershell.html | 打开 PowerShell |
| `install-cc` | install-claude-code.html | 安装 Claude Code |
| `first-chat` | first-conversation.html | 第一次对话 |
| `file-basics` | file-basics.html | 文件与文件夹 |
| `troubleshoot` | when-things-go-wrong.html | 遇到错误怎么办 |
| `deepseek` | deepseek-setup.html | 让 CC 在国内也能用 |
| `ai-for-business` | ai-for-business.html | AI 能帮你做什么 |
| `talk-to-ai` | talk-to-ai.html | 怎么让 AI 听懂你 |
| `ai-writing` | ai-writing.html | 让 AI 帮你写文案 |
| `bridge-to-coding` | bridge-to-coding.html | 接下来学什么 |
| `intro` | claude-intro.html | Claude Code 简介 |
| `plan` | plan-guide.html | /plan 命令完全指南 |
| `shortcuts` | shortcuts.html | 快捷键大全 |
| `convo` | conversation-skills.html | 对话技巧入门 |
| `init` | project-init.html | 项目初始化 |
| `workflow` | daily-workflow.html | 日常工作流 |

### 激活码

- 格式：`CC-XXXX-XXXX`（10 字符）
- 自包含验证，无需后端
- 算法：type_byte + topic_byte + random×2 + checksum×4
- 安全级别：对 ¥5-99 课程足够

## 考核与递进解锁系统

### 流程

```
学完 ①-⑨ → ⑩ 做 5 道选择题
  ├─ ✅ ≥4/5 正确 → 下一主题立即解锁
  └─ ❌ <4/5 正确 → 选择：
        ├─ ⏰ 1 天后自动解锁
        ├─ ⏰ 3 天后自动解锁（推荐）
        ├─ 💰 ¥1 立即解锁（跳 pay.html?plan=force）
        └─ ✍️ 手写 2 遍核心内容 + 拍照提交 → 解锁
```

### localStorage Key

| Key | 类型 | 说明 |
|-----|------|------|
| `cc-learn-quiz` | JSON | `{topicId: {score, total, passed, date, method?, forceUnlocked?}}` |
| `cc-learn-cooldown` | JSON | `{topicId: "ISO-date"}` — 冷却到期时间 |
| `cc-handwrite-{topicId}` | JSON | `{completed, date, photoPreview}` — 手写记录 |

### 题目数据

在 `assets/js/quiz.js` 的 `QUIZ_DATA` 对象中。每个 topic 包含：
- `handwritingContent`: 4 条抄写内容（自动提取自页面的关键信息）
- `questions`: 5 道选择题，每题 {q, opts: [A,B,C,D], ans: 正确索引}

### 添加新 topic 时

1. 在 `QUIZ_DATA` 添加题目和手写内容
2. 在 `TOPIC_ORDER` 数组末尾添加 topic ID
3. 在 `TOPIC_NAMES` 和 `TOPIC_PAGES` 添加映射

### 主题递进顺序

`pc-basics → open-ps → install-cc → first-chat → file-basics → troubleshoot → deepseek → ai-for-business → talk-to-ai → ai-writing → bridge-to-coding → intro → plan → shortcuts → convo → init → workflow`

首页卡片根据 `isTopicUnlockedByProgress()` 显示 🔒 锁定状态和 ⏳ 冷却倒计时。预备课卡片始终不锁定（全免费）。

## 当前状态

- ✅ 预备课 7 个主题完成（7 模块简化模板，始终免费，CSS 插图已替换占位符）
- ✅ 应用课 4 个主题完成（10 模块模板，含付费墙，面向个体户生意场景）
- ✅ 入门 6 个主题完成（含付费墙 + 激活码 + 考核递进系统，已添加 13 个 CSS 终端插图）
- ✅ 独立域名上线 — https://www.hcpthanks.com/（腾讯云购买+DNSPod DNS+GitHub Pages）
- ✅ 防盗系统 — 域名锁、支付劫持、DevTools检测、DOM投毒、AI爬虫毒药，全站21页接入
- ✅ 防盗内联降级 — paywall.js + quiz.js 含内联防护，anti-theft.js 被删后仍有效
- ✅ 支付页优化 — 域名引用更新、信任信号（永久有效·21节课）、联系方式引导
- ✅ CSS 插图组件（`.terminal-screenshot`, `.win-desktop`, `.win-window`, `.smart-placeholder`）替换全部 36 个 `.img-placeholder` 占位符
- ✅ 终端插图 Win10 风格统一（`.terminal-screenshot` 标题栏已改为 Win10 PowerShell 白底+右侧按钮，15 处全部更新）
- ✅ 入门课程视觉化（6 页新增 13 个 CSS 终端插图）
- ✅ 微信支付后端代码完成（3 个 API + 1 个工具库 + DB schema + 激活码统一算法）
- ⬜ 微信商户号申请（或先用个人收款码起步）
- ⬜ Supabase 项目创建 + schema 执行
- ⬜ Vercel 部署 + 环境变量配置
- ⬜ 进阶 4 个主题（占位卡片）
- ⬜ 专家 3 个主题（占位卡片）
- ⏳ ICP 备案（腾讯云轻量服务器已购 ¥192/年，草稿已填，等域名实名同步）
- ⬜ 国内 CDN（备案通过后配腾讯云 CDN→GitHub Pages）
- ⬜ 数据统计看板

## 下一步计划（2026-06-07 更新）

1. **Git 推送** — commit + push 支付后端所有改动到 GitHub
2. **微信商户号申请** — 微信支付商户平台注册，获取 mch_id / API key / 证书
3. **Supabase 建表** — 创建项目，执行 `supabase-schema.sql`
4. **Vercel 部署** — 导入项目，配置 12 个环境变量，绑定域名
5. **切换 pay.html 为 real 模式** — 改 `PAYMENT_CONFIG.mode = 'real'` + 填入真实 apiBase
6. **找真人测试** — 找 1 个电脑小白，看能否独立完成预备课 6 节
7. **国内 CDN + 域名备案** — 解决 GitHub Pages 国内访问慢的问题
8. **进阶/专家课程** — 进阶 4 个 + 专家 3 个主题

## 开发注意事项

- **不要引入框架或构建工具**，保持纯静态（HTML/CSS/JS）
- 所有页面必须包含 `<meta name="description">`、favicon、`role="main"`
- 导航用 `nav.js` 的 `document.write` 动态生成，不要手动写 `<nav>`
- 修改付费墙/激活码逻辑时，确保 `nav.js`、`paywall.js`、`recovery.js` 的 TOPIC 映射保持同步
- 每次改动后手动开浏览器验证（无需 build 步骤）
- 暗色主题下 `.cheat-sheet` 组件必须白底黑字（打印友好）
- **域名与部署**：
  - 官方域名：`www.hcpthanks.com`（腾讯云注册，DNSPod 解析，GitHub Pages 托管）
  - DNS：`www CNAME hcpthanks.github.io` + `@ A 185.199.108.153`
  - GitHub Pages：Custom domain 设置后自动签发 Let's Encrypt 证书，Enforce HTTPS 已开启
  - 防盗域名白名单集中在 `site-config.js`，新增域名只改一个文件
- **支付后端**：
  - `wechat-pay.js` 的 `TOPIC_ORDER` 必须与 `nav.js` 完全一致
  - `wechat-pay.js` 的激活码算法（CHARS/SALT/computeCheck）必须与 `recovery.js` 同步
  - 改价格只需改 `api/create-order.js` 的 `PLAN_PRICES` 和 `pay.html` 的 `price` 计算
  - API 用 Vercel Functions 部署，本地调试需 `vercel dev`
  - 绝对不要在 API 文件中使用 `console.log`

## AI 协作规范

> 以下规则适用于 Claude Code 在此项目中的所有操作。

### 通用操作规范

1. **优先编辑，非必要不重写** — 改一处用 Edit，不 Write 整个文件；除非改动超过文件一半
2. **不重复读已读文件** — 同一个文件，如果没被编辑过，不要再次 Read；信任之前的读取结果
3. **输出简洁，推理详尽** — 对用户只说结论和关键信息；但 `thinking` 块里的推理过程必须充分展开

### 代码规范

1. **单文件 ≤ 800 行** — 超过 800 行必须拆分为多个文件
2. **嵌套 ≤ 4 层** — 超过 4 层嵌套用提前返回（early return）或提取函数打破

> 与全局 ECC rules（`.claude/rules/ecc/common/coding-style.md`）保持一致。
