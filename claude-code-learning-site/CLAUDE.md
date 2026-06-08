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
├── applied/                    # 应用课（10 模块模板，含付费墙，2026-06-08 重写）
│   ├── ai-for-business.html    # ① AI 能帮你做什么
│   ├── talk-to-ai.html         # ② 让AI处理更复杂的事（进阶对话技巧）
│   ├── ai-writing.html         # ③ 让 AI 帮你写文案
│   └── bridge-to-coding.html   # ④ AI帮你管好客户（原"接下来学什么"已替换）
├── beginner/                   # 入门课程（6个主题，2026-06-08 全面重写为老王向）
│   ├── claude-intro.html       # ① 认识 Claude Code
│   ├── plan-guide.html         # ② 做事之前先想清楚
│   ├── shortcuts.html          # ③ 快捷键大全
│   ├── conversation-skills.html # ④ 让AI听懂你的话
│   ├── project-init.html       # ⑤ 第一次让AI帮你做事
│   └── daily-workflow.html     # ⑥ 每天都能用的AI场景
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

每个主题页面**必须**遵循此结构（shortcuts.html 例外，它是参考卡而非教学页）。2026-06-08 付费墙提前到④步前。

```
① 核心理解 — 一句话说清这是什么            ← 免费预览
② 输入方法 — 怎么用（方式/公式/命令）        ← 免费预览
③ 实战场景 — 什么时候用                     ← 免费预览
────── 付费墙 ──────
④ 好 vs 烂 — 正确用法 vs 错误用法（表格）
⑤ 工作流 — 标准操作流程（steps 图表）
⑥ 练习 — 互动练习题
⑦ 快速掌握 — 勾选清单
⑧ 速查卡 — 打印友好的白底黑字速查表
⑨ 总结 — 双栏：🎯最常用 + ⚠️最易错
────── 考核 ──────
⑩ 学习考核 — 5道选择题，答对4题（80%）即通过
```

### 写作原则（面向老王：40+岁个体户，零电脑基础）

- **零编程术语** — 不用 terminal/shell/CLI/git/npm 等词，除非先解释
- **口语化** — 像跟朋友聊天一样写，不要教科书语气
- **每概念一个例子** — 新概念立刻跟一个老王秒懂的实例
- **不超3步** — 任何操作说明不超过3步
- **给安全感** — 每页至少一处"别怕，这步不会弄坏你的电脑"
- **学了就能用** — 每页结尾有"现在你就打开试试____"
- **允许重复** — 前几课反复强调基本操作，用户需要重复

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

### 支付架构（当前：个人收款码 + 邮箱人工处理）

```
用户扫码支付 → 发送邮件到 hcpthanks@163.com（附截图）
  → 作者打开本地 admin/generate-code.html（密码保护）
  → 生成激活码 → 邮件回复客户
  → 客户在 recover.html 输入激活码 → 解锁内容
```

未来可选升级（需微信商户号）：
```
用户浏览器（pay.html real 模式）
  ├─ POST /api/create-order → 微信统一下单 → 动态二维码
  ├─ 微信回调 POST /api/payment-notify → 验签 → 生成激活码
  └─ 前端轮询 GET /api/check-order → 自动跳转 success.html
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

### 价格（两档制）

| plan | 价格 | 说明 |
|------|------|------|
| `all` | ¥99 | 全站永久解锁，之后不再看到任何付费墙 |
| `single` | ¥5 | 单主题解锁（⑥-⑨付费模块）|

注：¥1 强制解锁已于 2026-06-08 移除。¥99 用户自动绕过全部付费墙。

### 激活码格式 v3（2026-06-08 重构）

**格式：** `CC-SXXX-YYYY-ZZZZ`（16字符）

| 位置 | 含义 | 编码 |
|------|------|------|
| `CC-` | 前缀 | 固定 |
| `S`/`A` | 类型 | S=单页解锁，A=全站永久 |
| `XXX` | 课程编号（3字符） | 永久编号，31³=29,791课，nav.js 中 `TOPIC_IDS` 定义 |
| `YYYY` | 计数器（4字符） | 每课独立递增，31⁴=923,521/课，localStorage `cc-code-counters` |
| `ZZZZ` | 校验码（4字符） | 32位 checksum，防伪造 |

**核心特性：**
- 永久编号替代位置索引 — 插入新课不破坏已有激活码
- 计数器替代随机字符 — 保证绝对不重复，10年100万用户够用
- 兼容旧v2格式（12字符 `CC-SBTT-JBZL`）
- 自包含验证，无需后端数据库
- `generateActivationCode` 不在客户端暴露，仅作者本地 `admin/generate-code.html` 可生成
- `verifyActivationCode` + `applyActivationCode` 保留在 `window`，供 `recover.html` 使用

### 状态存储

| Key | 类型 | 说明 |
|-----|------|------|
| `cc-learn-all-access` | `"true"` / 不存在 | 全站永久解锁 |
| `cc-learn-unlocked` | JSON 数组 | 单页解锁的 topic ID 列表 |
| `cc-activation-codes` | JSON 对象 | 激活码缓存（同浏览器，旧版兼容） |
| `cc-code-counters` | JSON 对象 | 每课计数器（admin 本地） |

### 云端激活校验（2026-06-08 新增）

防止激活码被多人分享——每码最多 3 台设备。

**架构：**
```
recover.html → recovery.js verifyWithCloud()
  ├ 本地 verifyActivationCode() 校验格式
  ├ fetch() → Cloudflare Worker → KV 存储
  ├ < 3 设备 → 允许 → 写入 localStorage
  └ ≥ 3 设备 → 拒绝，提示联系客服
```

**文件：**
- `serverless/cloudflare-worker.js` — Worker 代码（零依赖，~68行）
- `assets/js/recovery.js` — 已加 verifyWithCloud() + getFingerprint()
- `pay/recover.html` — 已加云端校验 UI（loading/成功/失败/设备提示）
- `docs/pay/recover.html` — 同步副本

**Cloudflare Worker 部署：** 需创建 KV namespace 绑定变量名 `DB`。API_BASE 填入 Worker URL 后即可生效。

**降级策略：** 云端不可达时自动降级为本地解锁，不阻塞已付费用户。

### ⚠️ 不要重试 SCF

腾讯云 SCF 部署已确认不可行（2026-06-08 反复验证）：
- Event 函数 + Function URL → error 145
- Web 函数 + scf_bootstrap → exec format error
- 在线编辑不支持 Web 函数的 bash shebang
- 本地上传 zip 包结构不兼容

如需中国大陆服务端，用腾讯云其他产品（如 Lighthouse 轻量服务器跑 Node），不要用 SCF。

### Topic ID 映射

| ID | 永久编号 | 页面 | 中文名 |
|----|---------|------|--------|
| `pc-basics` | 1 | computer-basics.html | 认识你的电脑 |
| `open-ps` | 2 | open-powershell.html | 打开 PowerShell |
| `install-cc` | 3 | install-claude-code.html | 安装 Claude Code |
| `first-chat` | 4 | first-conversation.html | 第一次对话 |
| `file-basics` | 5 | file-basics.html | 文件与文件夹 |
| `troubleshoot` | 6 | when-things-go-wrong.html | 遇到错误怎么办 |
| `deepseek` | 7 | deepseek-setup.html | 国内也能用 |
| `ai-for-business` | 8 | ai-for-business.html | AI 能帮你做什么 |
| `talk-to-ai` | 9 | talk-to-ai.html | 让AI处理更复杂的事 |
| `ai-writing` | 10 | ai-writing.html | 让 AI 帮你写文案 |
| `bridge-to-coding` | 11 | bridge-to-coding.html | AI帮你管好客户 |
| `intro` | 12 | claude-intro.html | 认识 Claude Code |
| `plan` | 13 | plan-guide.html | 做事之前先想清楚 |
| `shortcuts` | 14 | shortcuts.html | 快捷键大全 |
| `convo` | 15 | conversation-skills.html | 让AI听懂你的话 |
| `init` | 16 | project-init.html | 第一次让AI帮你做事 |
| `workflow` | 17 | daily-workflow.html | 每天都能用的AI场景 |

添加新课程：在 `nav.js` 的 `TOPIC_IDS` 加一行 `新ID: 18`，`TOPIC_BY_ID` 自动同步。已有激活码不受影响。

## 考核与递进解锁系统

### 流程

```
学完 ①-⑨ → ⑩ 做 5 道选择题
  ├─ ✅ ≥4/5 正确 → 下一主题立即解锁
  └─ ❌ <4/5 正确 → 选择：
        ├─ ⏰ 1 天后自动解锁
        ├─ ⏰ 3 天后自动解锁（推荐）
        └─ ✍️ 手写 2 遍核心内容 → 拍照上传 → 免费解锁
             （¥1 付费跳过已于 2026-06-08 移除）
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

- ✅ 预备课 7 个主题完成（始终免费，CSS 插图）
- ✅ 应用课 4 个主题完成（2026-06-08 重写：去重叠+进阶对话+客户管理）
- ✅ 入门 6 个主题完成（2026-06-08 全面重写为老王向：零编程术语，生意场景）
- ✅ 激活码 v3 永久编号系统（16字符，29,791课+92万/课，10年100万人够用）
- ✅ 付费墙提前到④步（①-③免费预览）
- ✅ 付费页精简（仅¥99，130行）
- ✅ 导航简化（移除17个主题链接，分区高亮+滚动跟踪）
- ✅ 独立域名上线 + SSL — https://www.hcpthanks.com/（Enforce HTTPS 已开启）
- ✅ 防盗系统 — 全站接入
- ✅ 个人微信收款码 + 邮箱 hcpthanks@163.com
- ✅ 管理后台增强 — 邮箱自动补全 + Chart.js 数据概览 + 一键复制报表
- 🔴 激活码云端校验 — recovery.js 客户端已就绪，服务端待部署（Cloudflare Worker）
- ⬜ 进阶 4 个主题（待开发）
- ⬜ 专家 3 个主题（待开发）
- ⬜ quiz.js 测验题更新（匹配新课程内容）
- ⏳ ICP 备案（等域名实名同步）
- ⬜ 国内 CDN

## 下一步计划（2026-06-08 更新）

1. **部署 Cloudflare Worker** — 激活码云端校验（限制 3 台设备），代码在 `serverless/cloudflare-worker.js`
2. **真人测试支付流程** — 找真实用户扫码支付 → 发邮件 → 生成激活码 → 解锁
3. **quiz.js 更新** — 测验题目匹配重写后的课程内容
4. **进阶/专家课程** — 进阶 4 个 + 专家 3 个主题开发
5. **ICP 备案提交** — 域名实名同步完成后提交

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

> 以下规则适用于 Claude Code 在此项目中的所有操作，优先级高于全局 ECC rules。

### #通用

1. **优先选择编辑而非重写整个文件** — 改一处用 Edit，不改动用 Write。除非改动超过文件一半
2. **除非文件被编辑过，否则不要重复阅读已经读过的文件** — 同一个文件，未被编辑过则信任之前的读取结果
3. **输出必须简洁，但推理过程必须详尽** — 对用户只说结论和关键信息；`thinking` 块里的推理必须充分展开

### #代码规范

1. **一个文件不超过 800 行，超了就拆分** — 超过 800 行必须拆分为多个文件
2. **嵌套不超过 4 层** — 超过 4 层嵌套用提前返回（early return）或提取函数打破。请遵守这个标准。
