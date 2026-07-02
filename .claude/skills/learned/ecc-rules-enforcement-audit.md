# ECC 规则可执行性审计

> 审计日期：2026-07-01 | 触发事件：statusline 配置覆盖冲突（settings.json vs settings.local.json）| 下次复审：2026-07-30

## 摘要

ECC 规则体系共有 **~94 条 MUST/强制 级别义务**，但仅 **~4 条**（4.3%）有确认真实的机械执行保障。这是 [[rules-passive-loading-trap]] 的量化确认。

> **2026-07-02 修正**：审计时（07-01）sentinel-timing.js 被误标为 ✅ 已生效 — 脚本文件存在但未在任何 settings/hooks.json 中注册。已纠正为 ⚠️，并于同日注册到 `settings.local.json` PostToolUse。修正后基线：4 条有效 Hook（ecc-context-monitor + 2×console.log + gateguard-fact-force），1 条脚本存在未注册（sentinel-timing.js→已修复）。暴露了更深层问题：**连审计自身的准确率也无法保障**。

## 规则义务完整清单（MUST/强制 级别）

### common/ 通用规则

| # | 文件 | 义务 | 有无机械保障 |
|---|------|------|:---:|
| 1 | agents.md | 并行任务执行优先于顺序执行 | ❌ |
| 2 | git-workflow.md | 提交消息格式：`<type>: <description>` | ❌ |
| 3 | hooks.md | 永远不用 `dangerously-skip-permissions` | ❌ |
| 4 | hooks.md | 配置 `allowedTools` 而非跳过权限 | ❌ |
| 5 | security.md | 无硬编码密钥 — 每次提交前 | ❌ |
| 6 | security.md | 所有用户输入已验证 — 每次提交前 | ❌ |
| 7 | security.md | SQL 注入防护（参数化查询）— 每次提交前 | ❌ |
| 8 | security.md | XSS 防护（净化 HTML）— 每次提交前 | ❌ |
| 9 | security.md | CSRF 保护已启用 — 每次提交前 | ❌ |
| 10 | security.md | 认证/授权已验证 — 每次提交前 | ❌ |
| 11 | security.md | 所有端点启用速率限制 — 每次提交前 | ❌ |
| 12 | security.md | 错误消息不泄露敏感数据 — 每次提交前 | ❌ |
| 13 | security.md | 永远不用硬编码密钥 | ❌ |
| 14 | security.md | 始终用环境变量或密钥管理器 | ❌ |
| 15 | security.md | 启动时验证所需密钥是否存在 | ❌ |
| 16 | security.md | 安全响应协议：STOP → security-reviewer → 修复 CRITICAL → 轮换密钥 → 审查全代码 | ❌ (Agent) |
| 17 | testing.md | 最低测试覆盖率：80% | ❌ |
| 18 | testing.md | 全部三种测试类型：Unit + Integration + E2E | ❌ |
| 19 | testing.md | TDD 工作流：RED → GREEN → REFACTOR → 验证 80%+ | ❌ |
| 20 | session-supervisor.md | 检测重复重试（≥2 次连续失败）→ 暂停 | ❌ (LLM 自监控) |
| 21 | session-supervisor.md | 检测质量回退 → 暂停 | ❌ (LLM 自监控) |
| 22 | session-supervisor.md | 检测静默换方案 → 暂停 | ❌ (LLM 自监控) |
| 23 | session-supervisor.md | 检测耗时异常（>3x 预期）→ 暂停 | ⚠️ Hook脚本存在（sentinel-timing.js），2026-07-02 前未注册到Hook引擎 |
| 24 | session-supervisor.md | 检测隐形循环（≥3 次同类/5min）→ 暂停 | ✅ Hook: ecc-context-monitor.js |
| 25 | session-supervisor.md | 检测长时间无反馈（≥60s）→ 暂停 | ✅ Hook: ecc-context-monitor.js |
| 26 | session-supervisor.md | 触发后使用标准询问格式 | ❌ (LLM 自监控) |
| 27 | command-advisor.md | 启动协议：每次对话开始前必须读 CLAUDE.md → task_plan.md → memory | ❌ |
| 28 | command-advisor.md | 收尾门禁：5 项全部通过才能 /clear | ❌ |
| 29 | command-advisor.md | 禁止在门禁通过前推荐 /clear | ❌ |
| 30 | command-advisor.md | 禁止跳过门禁直接推荐 /clear | ❌ |
| 31 | command-advisor.md | 禁止把门禁项当"建议"而非"必须" | ❌ |
| 32 | karpathy-guidelines.md | 先想再写：陈述假设、呈现全部解释、主动呈现权衡、不清楚就停 | ❌ |
| 33 | karpathy-guidelines.md | 简单优先：无推测性功能、无单次使用抽象、无未请求灵活性、无不可能场景错误处理 | ❌ |
| 34 | karpathy-guidelines.md | 精准变更：只碰必须改的、不改相邻代码、不重构没坏的东西、匹配已有风格 | ❌ |
| 35 | karpathy-guidelines.md | 目标驱动执行：定义成功标准、循环直到验证通过 | ❌ |
| 36 | coding-style.md | 不可变性：始终创建新对象，永不修改已有对象 | ❌ |
| 37 | coding-style.md | 错误处理：每层显式处理、提供用户友好消息、记录详细上下文、永不静默吞错 | ❌ |
| 38 | coding-style.md | 输入验证：系统边界验证、基于模式、快速失败、永不信任外部数据 | ❌ |
| 39 | coding-style.md | 代码质量检查清单：可读、函数<50行、文件<800行、嵌套<4层、正确处理错误、无硬编码值、无变异 | ❌ |
| 40 | code-review.md | 审查触发：编写/修改代码后 | ❌ |
| 41 | code-review.md | 审查触发：提交到共享分支前 | ❌ |
| 42 | code-review.md | 审查触发：安全敏感代码变更时 | ❌ |
| 43 | code-review.md | 审查触发：架构变更时 | ❌ |
| 44 | code-review.md | 审查触发：合并 PR 前 | ❌ |
| 45 | code-review.md | 审查前要求：CI/CD 通过、合并冲突解决、分支与目标同步 | ❌ |
| 46 | code-review.md | 审查检查清单：10 项 | ❌ |
| 47 | code-review.md | 安全审查 STOP 触发：认证、用户输入、数据库、文件系统、外部 API、加密、支付 — 必须用 security-reviewer | ❌ (Agent) |
| 48 | code-review.md | 严重级别：CRITICAL=阻断、HIGH=警告 | ❌ |
| 49 | development-workflow.md | /plan 先、确认、再 /tdd。永不跳过确认门槛 | ❌ |
| 50 | development-workflow.md | 研究优先：GitHub 代码搜索 → 库文档 → Exa → 包注册表 → 适配实现 | ❌ |

### web/ 前端规则

| # | 文件 | 义务 | 有无机械保障 |
|---|------|------|:---:|
| 51 | design-quality.md | 不输出通用模板外观 UI | ❌ |
| 52 | design-quality.md | 禁用 8 种模板模式 | ❌ |
| 53 | design-quality.md | 每个有意义的界面至少体现 10 项质量中的 4 项 | ❌ |
| 54 | performance.md | Core Web Vitals：LCP<2.5s、INP<200ms、CLS<0.1 | ❌ |
| 55 | performance.md | Bundle 预算：Landing<150kb JS、App<300kb JS | ❌ |
| 56 | security.md | 始终配置生产环境 CSP | ❌ |
| 57 | security.md | 永不注入未净化 HTML | ❌ |
| 58 | security.md | 所有状态变更表单 CSRF 保护 | ❌ |
| 59 | security.md | 提交端点速率限制 | ❌ |
| 60 | security.md | 客户端和服务端双重验证 | ❌ |

### typescript/ 语言规则

| # | 文件 | 义务 | 有无机械保障 |
|---|------|------|:---:|
| 61 | coding-style.md | 导出函数、共享工具、公共类方法加类型标注 | ❌ |
| 62 | coding-style.md | 避免 `any`（用 `unknown` + 安全收窄） | ❌ |
| 63 | coding-style.md | 组件 Props 用命名接口/类型；回调显式标注 | ❌ |
| 64 | coding-style.md | 生产环境禁止 `console.log` | ✅ Hook: post-edit-console-warn + stop:check-console-log |
| 65 | security.md | 永不硬编码密钥 | ❌ |
| 66 | security.md | 始终用环境变量 | ❌ |
| 67 | security.md | 启动时验证 | ❌ |
| 68 | testing.md | Playwright 作为 E2E 测试框架 | ❌ |

### zh/ 中文翻译（与 common/ 义务一致）

| # | 文件 | 义务 | 有无机械保障 |
|---|------|------|:---:|
| 69-94 | 所有 zh/ 文件 | 与 common/ 对应文件相同的 MUST 义务（中文表述） | 同对应文件 |

---

## 现有机械执行机制

### A. 真正的机械执行（Hook，不可被 LLM 跳过）

| # | Hook | 类型 | 执行内容 |
|---|------|------|---------|
| 1 | config-protection | PreToolUse | 禁止修改 linter/formatter 配置文件 |
| 2 | mcp-health-check | PreToolUse | 禁止调用不健康的 MCP 服务器 |
| 3 | gateguard-fact-force | PreToolUse | 首次编辑文件必须先调查 |
| 4 | simplify-gate | UserPromptSubmit | 400 LOC 警告、800 LOC 阻断（发运动词） |
| 5 | privacy-block | PreToolUse | 禁止访问 .env, .pem, .key, id_rsa |
| 6 | scout-block | PreToolUse | 禁止访问 node_modules/.git 等 |
| 7 | dangerous-cmd-block | PreToolUse | 禁止 git push --force、git reset --hard、rm -rf |
| 8 | post-edit-console-warn | PostToolUse | 编辑后警告 console.log |
| 9 | stop:check-console-log | Stop | 每次响应后检查 console.log |
| 10 | stop:format-typecheck | Stop | 批量 Biome/Prettier + tsc |
| 11 | post:quality-gate | PostToolUse | 每次编辑后格式化/检查 |
| 12 | ecc-context-monitor | PostToolUse | 哨兵异质循环+静默检测+自限 |
| 13 | sentinel-timing | PostToolUse | 哨兵耗时异常检测 |
| 14 | design-quality-check | PostToolUse | 前端编辑偏离模板外观时警告 |
| 15 | doc-file-warning | PreToolUse | 非标准文档文件警告 |

### B. Agent 代理执行（需 LLM 记得调用）

共 65 个 Agent，其中强制执行类：code-reviewer、security-reviewer、tdd-guide、silent-failure-hunter、code-simplifier、performance-optimizer + 20+ 语言专属审查器。

### C. 执行保障覆盖率

| 分类 | MUST 义务数 | 有机械保障 | 覆盖率 |
|------|:----------:|:--------:|:-----:|
| 安全（security.md） | 16 | 0 | 0% |
| 测试（testing.md） | 3 | 0 | 0% |
| 哨兵（session-supervisor.md） | 8 | 3 | 37.5% |
| 编码风格/行为 | 17 | 1 (console.log) | 5.9% |
| 审查/开发流程 | 13 | 0 | 0% |
| 前端（web/） | 10 | 0 | 0% |
| 语言（typescript/） | 8 | 1 | 12.5% |
| **合计** | **~94** | **5** | **5.3%** |

> **2026-07-02 修正**：上表中的 5 条包含了 sentinel-timing.js（审计时误标为 ✅，实际未注册到 Hook 引擎，于同日修复）。审计时的真实有效数为 4（4.3%）。修复后回到 5（5.3%）。

注：5 个有机械保障的义务中，3 个是哨兵 P0 Hook 实现的（其中 sentinel-timing.js 审计后验证发现未注册，已修复），2 个是 console.log Hook。严格来说 console.log 不是"规则规则"而是"代码卫生"——**真正的业务/安全/流程规则，机械覆盖率为 3.2%（3/94）。**

---

## 与 QSS 观察期对齐

此文件作为 **QSS-ECC 对齐文档参考源**，在 30 天观察期内（2026-07-01 → 2026-07-30）输入决策矩阵。关键指标：

- **参考深度目标**：从 C 级（本文被引用）→ D 级（被 grep 命令引用）
- **采集周**：每周日与 `qss-ecc-alignment.md` 的 6 个信号一起采集
- **07-30 决策**：根据哨兵日志中"本应有机械保障的规则缺位导致实际异常"的次数，决定 Hook 升级优先级

## 历史版本

- v1.0 (2026-07-01): 初始审计，基线 5.3%，触发事件 = statusline 配置覆盖冲突
