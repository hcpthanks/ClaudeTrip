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
├── index.html                  # 首页（三级路线 + 6个入门卡片）
├── CLAUDE.md                   # 本文件
├── assets/
│   ├── css/
│   │   ├── common.css          # 全局样式（设计令牌、布局、组件）
│   │   ├── paywall.css         # 付费墙样式
│   │   └── quiz.css            # 考核系统样式
│   └── js/
│       ├── common.js           # 公共脚本（复制按钮、导航高亮、滚动监听）
│       ├── nav.js              # 共享导航栏（一处修改全站生效）
│       ├── paywall.js          # 付费墙逻辑（localStorage + 渲染）
│       ├── recovery.js         # 激活码系统（生成 + 校验）
│       └── quiz.js             # 考核系统（5题 / 80%达标 / 冷却 / 手写模式）
├── beginner/                   # 入门课程（6个主题，全部完成）
│   ├── claude-intro.html       # ① Claude Code 简介
│   ├── plan-guide.html         # ② /plan 命令完全指南
│   ├── shortcuts.html          # ③ 快捷键大全
│   ├── conversation-skills.html # ④ 对话技巧入门
│   ├── project-init.html       # ⑤ 项目初始化
│   └── daily-workflow.html     # ⑥ 日常工作流
├── intermediate/               # 进阶课程（待建）
├── expert/                     # 专家课程（待建）
└── pay/
    ├── pay.html                # 支付页（¥1强制 / ¥5单页 / ¥99全站）
    ├── success.html            # 支付成功页（显示激活码）
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
| 入门 | `--lv-beginner: #3fb950` | 绿色顶部条纹 |
| 进阶 | `--lv-intermediate: #d2991d` | 橙色顶部条纹 |
| 专家 | `--lv-expert: #a371f7` | 紫色顶部条纹 |

### 排版

- 中文字体：`-apple-system, 'Noto Sans SC', sans-serif`
- 代码字体：`'JetBrains Mono', 'Fira Code', monospace`
- 文件上限：800 行（CSS 当前 ~400 行）

## 教学模板：10 模块结构

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

### 状态存储

| Key | 类型 | 说明 |
|-----|------|------|
| `cc-learn-all-access` | `"true"` / 不存在 | 全站永久解锁 |
| `cc-learn-unlocked` | JSON 数组 | 单页解锁的 topic ID 列表 |
| `cc-activation-codes` | JSON 对象 | 激活码缓存（同浏览器） |

### Topic ID 映射

| ID | 页面 | 中文名 |
|----|------|--------|
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

`intro → plan → shortcuts → convo → init → workflow`

首页卡片根据 `isTopicUnlockedByProgress()` 显示 🔒 锁定状态和 ⏳ 冷却倒计时。

## 当前状态

- ✅ 入门 6 个主题完成（含付费墙 + 激活码 + 考核递进系统）
- ⬜ 进阶 4 个主题（占位卡片）
- ⬜ 专家 3 个主题（占位卡片）
- ⬜ 微信支付真实接入（目前是模拟支付）
- ⬜ 网站部署上线

## 开发注意事项

- **不要引入框架或构建工具**，保持纯静态
- 所有页面必须包含 `<meta name="description">`、favicon、`role="main"`
- 导航用 `nav.js` 的 `document.write` 动态生成，不要手动写 `<nav>`
- 修改付费墙/激活码逻辑时，确保 `nav.js`、`paywall.js`、`recovery.js` 的 TOPIC 映射保持同步
- 每次改动后手动开浏览器验证（无需 build 步骤）
- 暗色主题下 `.cheat-sheet` 组件必须白底黑字（打印友好）
