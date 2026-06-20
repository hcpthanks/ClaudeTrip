# Claude Code 学习站

纯静态 HTML/CSS/JS 构建的 Claude Code 学习 + 项目展示网站，面向国内用户。

> 架构重构 2026-06-18：从纯学习站升级为"项目展示 + 学习路线 + 在线工具"三层结构。

## 技术栈

- 纯静态 HTML + CSS + JS，无框架、无构建工具
- 暗色主题（GitHub-dark 风格）
- localStorage 做解锁状态 + 激活码跨设备恢复
- 无需后端、无需数据库、无需登录（支付用 Vercel Functions + Supabase）

## 文件结构

```
claude-code-learning-site/
├── index.html                  # 首页（作者分享 + 精选项目 + 学习路线 + 免费工具 + 付费升级）
├── CLAUDE.md                   # 本文件
├── package.json                # Vercel Functions + Vitest + Playwright
├── vercel.json                 # Vercel 部署配置（Node.js 20.x）
├── .env.example                # 环境变量模板（微信支付 + Supabase）
├── supabase-schema.sql         # 数据库 schema（orders + activation_codes）
├── assets/
│   ├── css/
│   │   ├── common.css          # 全局样式（设计令牌、布局、组件、项目卡片、学习卡片）
│   │   ├── paywall.css         # 付费墙样式
│   │   └── quiz.css            # 考核系统样式
│   ├── js/
│   │   ├── common.js           # 公共脚本
│   │   ├── nav.js              # 共享导航栏 + TOPIC 注册
│   │   ├── site-config.js      # 站点配置（域名白名单、支付 URL）
│   │   ├── anti-theft.js       # 防盗保护
│   │   ├── paywall.js          # 付费墙逻辑
│   │   ├── recovery.js         # 激活码系统
│   │   └── quiz.js             # 考核系统
│   └── images/
│       ├── projects/           # 项目配图/视频（Agnes AI 生成，待替换为真实素材）
│       ├── screenshots/        # 静态截图（PNG，1280×720）
│       └── gifs/               # 操作演示（MP4，10-30秒）
├── projects/                   # 🚀 精选项目展示（2026-06-18 新建）
│   ├── index.html              #   项目列表页
│   ├── ai-video-factory/       #   AI 视频工厂 — Agnes+TTS 全自动视频生成
│   ├── trading-dashboard/      #   智能交易看板（即将上线）
│   └── content-engine/         #   内容创作引擎（即将上线）
├── learn/                      # 📚 学习路线总览（2026-06-18 新建，为未来内容预留）
│   └── index.html
├── tools/                      # 🛠️ 免费在线工具（2026-06-18 新建）
│   ├── index.html              #   工具列表页
│   ├── ai-chat/                #   AI 对话（待实现）
│   ├── ai-image/               #   AI 生图（待实现）
│   └── ai-video/               #   AI 视频（待实现）
├── pre-basics/                 # 预备课（7 模块简化模板，始终免费）
├── applied/                    # 应用课（AI 帮你做生意）
├── beginner/                   # 入门课程（6个主题）
├── intermediate/               # 进阶课程（4个主题）
├── expert/                     # 专家课程（待建）
├── embed/                      # 外部网站嵌入集成（卡片/banner/widget）
├── api/                        # Vercel Serverless Functions（支付后端）
├── lib/
│   └── wechat-pay.js           # 微信支付工具库
├── pay/                        # 支付/激活码页面
├── tests/                      # Vitest + Playwright 测试
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
├── intermediate/               # 进阶课程（4个主题，2026-06-10 上线）
│   ├── core-commands.html      # ① 核心命令精通（7个每天必用的命令）
│   ├── context-cost.html       # ② 上下文与成本管理（省钱关键）
│   ├── workflow-patterns.html  # ③ 每日工作流实战（4种模式）
│   └── 21-day-plan.html        # ④ 21天进阶计划（第一周详细教程）
├── expert/                     # 专家课程（待建）
├── embed/                      # 外部网站嵌入集成（2026-06-12 新建）
│   ├── README.html             #   三种方案使用说明（含预览+复制按钮）
│   ├── card-banner.html        #   方案A-1：横条推荐卡片
│   ├── card-square.html        #   方案A-2：方块推荐卡片
│   ├── card-float.html         #   方案A-3：右下角浮动按钮
│   ├── iframe-content.html     #   方案B：iframe 嵌入内容页
│   └── widget.js               #   方案C：JS Widget（一行 script 自动渲染）
└── pay/
    ├── pay.html                # 支付页（sim/real 双模式，¥5单页/¥399三年/¥699永久）
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
| `all` | ¥399/3年 或 ¥699永久 | 全站解锁，之后不再看到任何付费墙 |
| `single` | ¥5 | 单主题解锁（⑥-⑨付费模块）|

注：¥1 强制解锁已于 2026-06-08 移除。¥399/3年 或 ¥699永久 用户自动绕过全部付费墙。

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
| `cc-learn-all-access` | `"true"` / 不存在 | 全站解锁 |
| `cc-learn-unlocked` | JSON 数组 | 单页解锁的 topic ID 列表 |
| `cc-activation-codes` | JSON 对象 | 激活码缓存（同浏览器，旧版兼容） |
| `cc-code-counters` | JSON 对象 | 每课计数器（admin 本地） |

### 云端激活校验（2026-06-09 已部署 ✅）

防止激活码被多人分享——每码最多 2 台设备。

**架构：**
```
recover.html → recovery.js verifyWithCloud()
  ├ 本地 verifyActivationCode() 校验格式
  ├ fetch() → 腾讯云 SCF Function URL → COS 存储（activations.json）
  ├ 同设备 → 放行（不占名额）
  ├ 第 2 台设备 → 放行（名额用完）
  └ 第 3 台设备 → 拒绝，提示发邮件解绑
```

**部署信息：**
- SCF 函数：`cc-activation-verify`（Event 函数，Node.js 18，北京）
- 函数 URL：`https://1253632363-hkdthg8jb2.ap-beijing.tencentscf.com`
- COS 桶：`cc-activation-1253632363`（ap-beijing）
- 运行角色：`SCF_COS_Access`（QcloudCOSFullAccess）
- 环境变量：`COS_BUCKET` + `COS_REGION`

**关键部署要点：**
- ⭐ **参数兼容模式必须开启** — 不开 = error 145（6月8日全部失败的根因）
- 函数 URL CORS 不开启（代码自带 CORS 响应头，表单校验太严）
- API 网关产品已停服（2025年6月），用函数 URL 替代
- 不要用 Web 函数，只用 Event 函数 + 在线编辑

**文件：**
- `serverless/activate/index.js` — SCF 函数代码（零依赖，~220行）
- `serverless/SETUP.md` — 部署指南（COS → SCF → 函数 URL → 测试）
- `assets/js/recovery.js` — 已加 verifyWithCloud() + getFingerprint()
- `pay/recover.html` — 已加云端校验 UI（loading/成功/失败/设备提示）
- `docs/pay/recover.html` — GitHub Pages 部署副本
- `腾讯云SCF部署攻略-失败与成功对比.html` — 6月8日失败 vs 6月9日成功全记录

**降级策略：** 云端不可达时自动降级为本地解锁，不阻塞已付费用户。

### 付费墙云端校验（2026-06-11 已部署 ✅）

防止 F12 修改 localStorage 绕过付费墙。

**架构：**
```
课程页 → paywall.js renderPaywall()
  ├ localStorage 显示已解锁 → 渲染内容
  ├ 同时 cloudVerify() POST → SCF /check-access
  ├ 云端返回 hasAccess:true → 安静通过
  ├ 云端返回 hasAccess:false → 清 localStorage → 刷新 → 付费墙重新锁定
  └ 云端不可达 → 信任 localStorage（fail-open，不阻断已付费用户）
```

**SCF 路由（同一函数 `cc-activation-verify`）：**
| 路径 | 方法 | 用途 |
|------|------|------|
| `/activate` | POST | 激活码校验 + 设备登记（已有） |
| `/check-access` | POST | 查 COS 中是否存有此设备指纹（新增） |

**关键文件：**
- `assets/js/paywall.js` — renderPaywall() auto-init（第 219 行）+ cloudVerify()（第 181 行）
- `assets/js/site-config.js` — scfVerifyUrl 配置
- `serverless/activate/index.js` — handleCheckAccess()（~50 行）

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
| `core-commands` | 18 | core-commands.html | 核心命令精通 |
| `context-cost` | 19 | context-cost.html | 上下文与成本管理 |
| `workflow-patterns` | 20 | workflow-patterns.html | 每日工作流实战 |
| `21-day-plan` | 21 | 21-day-plan.html | 21天进阶计划 |

添加新课程：在 `nav.js` 的 `TOPIC_IDS` 加一行 `新ID: 22`，`TOPIC_BY_ID` 自动同步。已有激活码不受影响。

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
- ✅ 付费页精简（仅¥399/3年 或 ¥699永久，130行）
- ✅ 导航简化（移除17个主题链接，分区高亮+滚动跟踪）
- ✅ 独立域名上线 + SSL — https://www.hcpthanks.com/（Enforce HTTPS 已开启）
- ✅ 防盗系统 — 全站接入
- ✅ 个人微信收款码 + 邮箱 hcpthanks@163.com
- ✅ 管理后台增强 — 邮箱自动补全 + Chart.js 数据概览 + 一键复制报表
- ✅ 激活码云端校验 — 腾讯云 SCF + COS 已部署，每码绑定 2 台设备
- ✅ 进阶 4 个主题完成（2026-06-10 上线：核心命令/上下文成本/工作流实战/21天计划）
- ✅ 首页文案改版（2026-06-10：面向老王，H1"不用写代码/不用学英语/AI帮你干活"，口号"让每个人都能用AI"）
- ✅ 移动端响应式适配（2026-06-10：hamburger 菜单 + badge 滚动 + 480px 断点）
- ✅ 视频播放组件（2026-06-10：B站嵌入 + 本地mp4，common.css .video-wrap/.video-16x9）
- ✅ 进阶课程付费墙（2026-06-11：4个页面全内容付费，无免费预览，hero标题保留）
- ✅ nav.js 全站修复（2026-06-11：进阶topic注册18-21、intermediate目录路由、hamburger DOMContentLoaded绑定）
- ✅ 付费墙按钮修复（2026-06-11：paywall.js auto-init renderPaywall，之前全站只有shortcuts.html手动调用）
- ✅ 付费墙云端校验（2026-06-11：SCF /check-access + paywall.js cloudVerify POST 背景验证，防F12绕过）
- ✅ 进阶课测验题（2026-06-11：quiz.js 新增 4 个 topic 各 5 题+手写内容，共 20 题）
- ✅ 安全审计 + 6项修复（2026-06-11：删除URL绕过、XSS修复、SALT隐藏、admin加固）
- ✅ 收款码安全提示（2026-06-11：支付页加"收款方：程爱芝"核对，防二维码替换钓鱼）
- ✅ B站视频嵌入（2026-06-11：BV1NiEi6FEdt → 2026-06-12 更换为 BV1YUEz6mEMj 首页"作者分享"板块）
- ✅ 作者分享位置调整（2026-06-12：视频板块从首页底层移至 Hero 下方、预备课前方）
- ✅ 网站嵌入集成（2026-06-12：embed/ 文件夹，三种方案——静态卡片/iframe/JS Widget + README 使用说明）
- ✅ 建站操作手册·简易版（2026-06-12：E:\WorkBuddy\CLAW\建站操作手册-简易版.html + PDF）
- ✅ 学习站建设方法论三合一文档（2026-06-12：进度表+对话法+技术指南，HTML+PDF）
- ✅ 可复用技能蓝图（2026-06-12：content-site-blueprint，全局 skill + project-skill-fuyong 三格式）
- ✅ 导航栏激活码入口（2026-06-13：nav.js 桌面+移动端加"🔑 激活码"链接，全站可见）
- ✅ 支付页邮箱改为复制按钮（2026-06-13：pay.html mailto链接替换为"复制邮箱地址"+"复制邮件主题"按钮，适配国内用户无邮件客户端）
- ✅ 支付页去掉订单号找回（2026-06-13：recover.html 移除"通过订单号找回"功能，场景极少且不适合老王画像）
- ✅ 3个阻塞问题修复（2026-06-13：首页激活码入口 + recover.html 路由修复 deepseek/intermediate + index.html 加载 nav.js）
- ✅ CSP frame-src 修复（2026-06-13：从 `'none'` 改为放行 `bilibili.com` `xigua.com` `v.qq.com`，修复首页 B站视频不显示）
- ✅ B站 HTML5 移动端播放器切换（2026-06-13：`player.bilibili.com` → `www.bilibili.com/blackboard/html5mobileplayer.html`，修复移动端空白）
- ✅ 视频添加操作手册（2026-06-13：E:\WorkBuddy\CLAW\学习站视频添加完全操作手册.html，三方案+7步流程+6类排查）
- ✅ 视频模块知识提取（2026-06-13：learn-eval → `bilibili-html5-mobile-embed` skill + `content-site-blueprint` Module 8 追加）
- ✅ 支付页邮件主题审查（2026-06-13：确认 plan/topic 参数 → mailSubject 逻辑正确，`[topic:xxx]` 机器可检索）
- ✅ 预备课 Win/Mac 双平台改造（2026-06-13：7页全部加 Mac 对照，CSS 新增 ~150行 Mac 组件体系）
- ✅ 预备课质量审计（2026-06-13：7页从零术语/口语化/安全感/可操作性/简洁度/连贯性/老王相关性 7维度评分，平均 49/70）
- ✅ 预备课全面重写（2026-06-14）：Windows 10 纯血版，删除所有 Mac 内容（Mac 引用归零），注入老王五金店人设
- ✅ deepseek-setup 第7课还原为完整4阶段12步教程（2026-06-14）：Workbuddy安装 → 验证 → ccswitch+DeepSeek → VS Code，21张真实截图
- ✅ 第一课 CSS 窗口按钮修复（2026-06-14）：从 macOS 三色圆点改为 Windows 10 方形按钮
- ✅ 删除 Mac 平台支持（2026-06-14）：common.css ~110行 Mac CSS 删除，7页全部 Mac 内容剥离
- ✅ 支付系统安全修复（2026-06-14）：3 CRITICAL + 2 HIGH 漏洞修复，新增 2 个测试套件 87 个测试
- ✅ 测试安全网（2026-06-14）：4 套测试全部通过（activation-code 75 + payment-security-unit 51 + pre-basics-integrity-E2E 146 + payment-security-E2E 36 = 308/308）
- ✅ Canvas 统一设备指纹（2026-06-14）：nav.js 单一来源，recovery.js + paywall.js 均委托调用
- ✅ window.applyActivationCode 私有化（2026-06-14）：改为 IIFE 内部函数，仅 verifyWithCloud 可调用
- ✅ cloudVerify 改为阻塞式 Promise（2026-06-14）：先验后渲，关闭时序漏洞
- ⏳ ICP 备案（等域名实名同步）
- ⬜ 国内 CDN

## 已发现待修复问题（2026-06-13 全站审计）

| 严重度 | 问题 | 位置 |
|--------|------|------|
| ✅ 已修复 | 首页无激活码入口 — index.html 手写导航，缺 🔑 激活码链接（已于2026-06-13修复） | index.html |
| ✅ 已修复 | recover.html 路由错误 — deepseek(索引6)被错误路由到applied/，且不支持intermediate/（已于2026-06-13修复） | recover.html:124 |
| ✅ 已修复 | index.html 引用 window.TOPIC_ORDER 但未加载 nav.js（已于2026-06-13修复） | index.html |
| 🟡 HIGH | index.html 导航栏与 nav.js 各写一套，改一处漏一处 | index.html |
| ✅ 已修复 | recover.html 调试日志暴露给用户（已于2026-06-14修复） | recover.html:79 |
| 🟡 MEDIUM | anti-theft.js DevTools检测在官方域名也运行 | anti-theft.js |
| 🟡 MEDIUM | 防盗代码在 paywall.js/quiz.js 重复3份 | paywall.js, quiz.js |
| ✅ 已修复 | 预备课7页缺 common.js（已于2026-06-14添加） | pre-basics/*.html |
| 🟡 MEDIUM | 进阶课4页零免费预览，客户打开即付费墙 | intermediate/*.html |
| 🟡 MEDIUM | shortcuts.html 基础命令（/clear /exit）锁在付费墙后 | shortcuts.html |
| 🟡 MEDIUM | 首页"专家"板块（MCP/工作流引擎）对老王无意义 | index.html |

## 下一步计划（2026-06-14 更新）

1. ~~**预备课内容提质（Phase 1-3）**~~ ✅ 已完成（2026-06-14：Windows 10 纯血版重写 + 老王五金店人设 + deepseek-setup 4阶段12步 + 第一课 CSS 修复）
2. **B站引流** — 视频简介+评论区置顶加网站链接，从B站带流量
3. **SCF function.zip 部署** — 腾讯云控制台上传最新的 function.zip（CORS 白名单 + SALT 已改为计算表达式）
4. **21天计划第二、三周** — 补全剩余28个任务的详细教程
5. **B站视频录制** — 续录其他课程视频（安装/核心命令等），用操作手册添加
6. **嵌入集成实测** — 外部网站测试三种嵌入方案（card/iframe/widget），验证 widget.js 跨域兼容性

## 双目录同步规则（最高优先级）

> `claude-code-learning-site/` 和 `docs/` 的**重叠文件**必须双向同步，每次 commit 包含两个目录。
> `docs/` 仅保留静态站点文件。后端代码、配置、admin 绝不进入 `docs/`。
> 详见 memory: [[dual-directory-sync-rule]]

## 安全规则（最高优先级）

> 1. 客户端激活码校验仅做格式正则，salt + checksum 由 SCF 服务端判定
> 2. 所有网络校验 fail-closed：云端不可达 = 不放行
> 3. CSP meta 标签所有支付相关页面必须存在
> 4. 推荐任何方案必须同时列出正向效果和反向副作用（尤其是影响线上服务的操作）
> 详见 memory: [[dual-directory-sync-rule]], [[github-pages-private-pitfall]]

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
  - `wechat-pay.js` 的激活码算法（CHARS/SALT/computeCheck）为服务端专用，客户端 `recovery.js` 仅做格式校验
  - 改价格只需改 `api/create-order.js` 的 `PLAN_PRICES` 和 `pay.html` 的 `price` 计算
  - API 用 Vercel Functions 部署，本地调试需 `vercel dev`
  - 绝对不要在 API 文件中使用 `console.log`

## AI 协作规范

> 以下规则适用于 Claude Code 在此项目中的所有操作，优先级高于全局 ECC rules。

### #通用

1. **优先选择编辑而非重写整个文件** — 改一处用 Edit，不改动用 Write。除非改动超过文件一半
2. **除非文件被编辑过，否则不要重复阅读已经读过的文件** — 同一个文件，未被编辑过则信任之前的读取结果
3. **输出必须简洁，但推理过程必须详尽** — 对用户只说结论和关键信息；`thinking` 块里的推理必须充分展开

### #用户画像约束（最高优先级）

> **老王**：40+岁个体户，零电脑基础，脾气大、没耐心、小气。能勉强用浏览器。

**每次给方案前必须过这 5 个问题：**

| # | 问题 | 红线 |
|---|------|------|
| 1 | 需要登录/注册吗？ | ❌ 绝对不能。老王记不住密码 |
| 2 | 需要下载/安装吗？ | ❌ 绝对不能。打开浏览器就能用 |
| 3 | 需要切换多个页面吗？ | ❌ 尽量不超过 3 步。一步能做完绝不分两步 |
| 4 | 需要理解技术概念吗？ | ❌ 任何术语（token/API/域名/缓存）都不能出现在用户界面 |
| 5 | 找不到怎么办？ | ❌ 每个操作入口必须有明确可见的按钮/链接，不要藏在角落 |

**核心原则：后台可以复杂，客户页面必须操作简单、体验流畅。**
- 每个页面只做一件事
- 按钮要大、要醒目、要用老王能懂的话标注
- 页面加载要快，操作反馈要即时（点了按钮必须立刻有反应）
- 流程不能断——扫码→付款→发邮件→收激活码→验证，中间任何一步卡住要有明确指引
- 错误提示要告诉老王"该怎么办"，不只要告诉"哪里错了"
- 邮件/通知/提示的阅读难度不超过小学五年级

### #代码规范

1. **一个文件不超过 800 行，超了就拆分** — 超过 800 行必须拆分为多个文件
2. **嵌套不超过 4 层** — 超过 4 层嵌套用提前返回（early return）或提取函数打破。请遵守这个标准。
