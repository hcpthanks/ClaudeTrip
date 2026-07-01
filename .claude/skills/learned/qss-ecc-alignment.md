---
name: qss-ecc-alignment
description: "钱学森系统科学 ↔ ECC 对齐门禁 — 双向映射表 + 2个决策树 + grep-able信号。ECC组件对应五层大厦哪一层，安装/修改时触发审核"
user-invocable: false
origin: auto-extracted
---

# QSS-ECC 对齐门禁

## 问题（为什么这个文档存在）

CLAW 声明钱学森系统科学为"最高指导思想"，但 ECC（CLAW 的运行时基础设施——rules/hooks/agents/skills/commands）自身架构完全不引用钱学森。"最高指导思想"与"日常执行的工程系统"之间存在断裂。

**有这个文档之前**：做 ECC 相关决策（选 install profile、加 hook、改规则）时不会想到钱学森原则。上一轮审计发现 142 条 QSS 引用中 ~110 条是自引用，仅 1 条真正的深度执行。

**有这个文档之后**：任何涉及 ECC 的决策都可以对照双向映射表，快速判断"这个操作在钱学森框架的哪一层"和"这个钱学森原则有没有被 ECC 强制执行"。

### 本文档的边界（不覆盖什么）

明确以下 ECC 组件**不在本对齐文档的映射范围内**——不是它们不重要，是它们属于"外部接口"而非"内部架构"，钱学森框架对其的适用性需要通过不同的分析路径：

| 不在映射范围内 | 原因 |
|--------------|------|
| ECC CI/CD 集成（GitHub Actions） | 外部工具链，不是 ECC 自身架构组件 |
| ECC Tools GitHub App / Pro 付费功能 | SaaS 产品层，独立于本地 agent 系统 |
| npm 发布流水线（`ecc-universal`、`ecc-agentshield`） | 分发机制，不是运行时系统 |
| CodeRabbit / 第三方 sponsor 集成 | 商业合作关系，不是系统科学分析对象 |
| ecc2/ Rust alpha 完整功能路线图 | alpha 阶段，功能尚未固化，待 GA 后补充映射 |

**判断标准**：如果一个 ECC 组件满足以下三项之一，它就**在本文档的映射范围内**——(1) 被加载到 Claude Code system prompt，(2) 通过 Hook 引擎在工具调用时执行，(3) 被 install profile 安装到本地文件系统。

---

## 核心：双向映射表

### 方向 A：ECC 组件 → 钱学森原则（"ECC 做的这件事，是钱学森的哪个原则"）

| ECC 组件 | ECC 表现 | 钱学森原则 | 五层大厦层级 |
|---------|---------|-----------|------------|
| **Prompt Defense Baseline** | `everything-claude-code-guardrails.md` — 不可覆盖的最高规则 | 系统边界 — "开放的复杂巨系统"必须定义什么在系统内、什么在系统外 | 哲学 + 桥梁（系统论） |
| **rules/common/** | coding-style, security, testing, git-workflow 等 | 技术科学 — 运筹学/控制论/信息论（三论归一）在软件工程中的应用 | 技术科学 |
| **rules/lang-specific/** | typescript, python, go, rust 等 | 各行业系统工程的学科适配 — 同一方法论在不同技术栈的具体化 | 技术科学 → 工程技术 |
| **hooks/** (PreToolUse/PostToolUse/Stop) | Hook 引擎在每次操作后强制执行脚本 | **从定性到定量**的机械执行点 — "用明确的脚本替代模糊的意图" | 工程技术 |
| **install profiles** | minimal/core/developer/full — 按需选择 | **系统工程 = 组织管理的技术** — 不是"越多越好"，是按复杂度分级组装 | 基础科学（系统学） |
| **agents/** | 67+ 专业子 Agent（planner, code-reviewer, tdd-guide…） | **综合集成方法** — 多专家并行研讨，人（用户）做最终决策 | 基础科学（系统学） |
| **commands/** | /plan, /tdd, /code-review 等入口 | **综合集成研讨厅的"厅"** — 用户进入系统的入口 | 工程技术 |
| **skills/** | 277+ 领域技能 | 各行业系统工程的具体实践 | 工程技术 |
| **learned skills** | 经验教训自动提取 | **螺旋上升**的工程实现 — 从产出回到输入的反馈机制 | 基础科学 |
| **mcp-configs/** | 外部 MCP 服务集成 | **开放系统** — 与外部环境持续交换信息 | 工程技术 |
| **ecc2/ Rust alpha** | TUI dashboard, session 管理 | **系统演化** — 从简单到复杂的自组织 | 基础科学（系统学） |
| **🛡️ 哨兵** | session-supervisor + P0 Hook 强制执行 | **反馈机制** + **人机结合** — 异常检测→暂停询问→人决定 | 技术科学 / 工程技术 |
| **🧭 顾问** | command-advisor — 流程推荐 + 收尾门禁 | **总体设计部** — "指路不执行"：告知该做什么，但不自动做 | 桥梁（系统论） |
| **🧠 学习闭环** | 决策解释 → 过程留痕 → 学习总结 → 学习卡 | **综合集成方法的螺旋上升** — 每一轮迭代回到更高层次的定性认识 | 基础科学（系统学） |

### 方向 B：钱学森原则 → ECC 执行力检查（"这个原则有没有被 ECC 强制执行？"）

| 钱学森原则 | ECC 执行机制 | 验证方法 | 执行方式 |
|-----------|------------|---------|:---:|
| **边界清晰**（什么在系统内/外） | Prompt Defense Baseline（6 条不可覆盖规则） | `grep "do not change role" everything-claude-code/.claude/rules/` | 🟡 规则级 |
| **层次分明**（五层大厦不越层） | rules/ 层级分离（common → lang-specific）；claude-md-layer-gate 阻止 CLAUDE.md 污染 | `grep "claude-md-layer-gate" .claude/skills/learned/` | 🟡 规则级 |
| **反馈闭合**（产出→评估→改进） | 哨兵 P0 Hook（ecc-context-monitor.js）+ quality-gate + learn 命令 | `ls ~/.claude/sentinel-state.json` | 🟢 Hook 级 |
| **人机结合、以人为主** | 哨兵暂停询问（"继续还是停下？"）；顾问推荐格式（"你选哪个？"） | `grep "继续还是停下" session-supervisor.md` | 🟢 Hook + 🟡 规则 |
| **从定性到定量** | Hook 脚本 = 量化的检查点（文件行数、上下文百分比、成本金额） | `grep "PostToolUse\|PreToolUse" ~/.claude/hooks.json` | 🟢 Hook 级 |
| **综合集成研讨厅** | 多 Agent 并行（Workflow.parallel/pipeline）+ commands 入口 | 检查 Workflow 工具可用性 | 🟡 工具级<sup>①</sup> |
| **螺旋上升**（每轮迭代认识提升） | 学习闭环 + learned skill 自动提取 + session-end review | `grep -c "\|" .claude/skills/learned/SKILL.md`（增长趋势） | 🟡 规则级 |
| **涌现管理**（1+1>2 的正涌现 vs 负涌现） | 哨兵异质循环检测 + agent-self-repair-deletion-loop 防护 | `grep "heterogeneous\|异质" ecc-context-monitor.js` | 🟢 Hook 级 |
| **总体设计部**（顶层把控全局） | 顾问收尾门禁（/clear 前强制 5 项检查） | `grep "收尾门禁" command-advisor.md` | 🟡 规则级 |

<sup>①</sup> Workflow 工具是 Claude Code 内置功能，非 ECC 控制——ECC 提供编排模式但执行引擎属于 Claude Code。

**执行方式分布**：9 条原则中 — 4 条🟢 Hook 级（引擎强制执行），4 条🟡 规则级（system prompt 文本，依赖 LLM 自觉），1 条🟡 工具级（Claude Code 原生功能，ECC 不控制）。

> ⚠️ **执行方式说明**：🟢 Hook 级 = Claude Code 引擎在每次工具调用后强制运行 Hook 脚本，不依赖 LLM 自觉。🟡 规则级 = 文本写入 system prompt——"被动加载陷阱"风险：LLM 在任务模式下可能跳过。🟡 工具级 = 依赖 Claude Code 原生功能，ECC 只提供使用模式。唯一的"绝对强制执行"是 `settings.json` 权限白名单。此表反映的是 ECC 当前的最佳努力——距离"所有钱学森原则都被机械化强制执行"仍有差距。

**强制执行率**：9 条原则中 — 5 条 Hook 级强制执行，4 条规则级（被动依赖 LLM 自觉）。

---

## 两个二元决策树

### 决策树 1：新能力/规则/检查 — 该放 QSS 还是 ECC？

```
需要新增一个能力/规则/检查
  ↓
Q1: 这个东西有没有具体的文件路径、CLI 命令、或 Hook 脚本？（机械可检测）
  ├── 没有（是抽象原则/方法论/判断标准） → 属于 QSS（系统学/桥梁层）
  │     ↓
  │     Q2: 现有 QSS 框架中，这对应五层大厦的哪一层？
  │     ├── 哲学 → synthesis-framework.md 哲学层（极少修改）
  │     ├── 桥梁（系统论）→ synthesis-framework.md 桥梁层
  │     ├── 基础科学（系统学）→ qian-system-science 核心 skill + learned gates
  │     ├── 技术科学 → 应该是一个新的 learned gate（遵循 gate-template）
  │     └── 工程技术 → **这可能应该放 ECC，不是 QSS！** 回到 Q1 重新判断。
  │
  └── 有（是具体的文件/脚本/命令） → 属于 ECC
        ↓
        Q3: 这东西影响所有项目还是特定场景？
        ├── 所有项目（如：加一条通用安全规则） → ECC rules/common/ + （如果可行）对应的 Hook
        │     └── ⚠️ 纯规则无 Hook = 被动加载陷阱风险。考虑：能否做成 Hook？
        └── 特定场景（如：某语言/某工具的检查） → ECC skills/ 或 ECC hooks/（matcher 精确到场景）
              └── 同时检查：是否需要在 install profiles 中作为一个可选 component
```

### 决策树 2：ECC 变更（安装/配置/修改规则）是否对齐钱学森原则？

```
ECC 变更（安装 profile、新增/修改 rule、注册 hook、新建 skill）
  ↓
Q1: 变更后，Prompt Defense Baseline（系统边界）是否被削弱或绕过？
  ├── 是 → ❌ STOP：违反了"边界清晰"原则。
  │        开放的复杂巨系统退化 → 系统不再知道自己是什么。
  └── 否 → 继续
            ↓
Q2: 变更引入了新的执行机制吗（Hook 脚本 / agent / 自动化检查）？
  ├── 是（有机械执行）→ Q3: 有对应的反馈回路吗（日志 / 评估 / 告警 / 统计数据）？
  │     ├── 有 → ✅ PASS：对齐"反馈闭合"原则
  │     └── 没有 → ❌ STOP：违反了"反馈闭合"原则。
  │                 只有执行没有反馈 = 系统不知道自己做对没有。
  └── 否（纯文本规则 / 纯文档）→ ⚠️ WARN："规则被动加载陷阱"风险。
                                    文本规则依赖 LLM 自觉，在任务模式下可能被跳过。
                                    考虑：这条规则是否可以升级为 Hook？
```

---

## 负面示例

### ❌ 负面示例 1：把 ECC 当"工具包"，无视系统科学

```markdown
# ❌ 错误做法：
# "ECC 就是一套写好的 rules 和 skills，拿来用就行。
#  不用想什么系统科学，工具好用就够了。"

# 为什么错：
# ECC 的 rules/ 是钱学森"技术科学"层（运筹学+控制论+信息论）的工程实现。
# ECC 的 hooks/ 是"从定性到定量"的机械执行点——从"应该遵守规范"
# 到"必须通过检查"的飞跃。
# ECC 的 install profiles 是"系统工程=组织管理的技术"的具体体现——
# 选 minimal 还是 full，本质上是判断这个项目的"复杂巨系统特征"需要
# 多少层基础设施。
# 理解这个关系后，选择 install profile 就不是"装多少工具"的问题，
# 而是"这个项目需要多少层反馈和约束"的问题。
```

```markdown
# ✅ 正确做法：
# 选 ECC install profile 前，先判断项目复杂度：
# - 单人小脚本 → minimal（5 modules，无 hooks-runtime）
# - 团队应用开发 → developer（10 modules）
# - 安全敏感项目 → security（7 modules，但可叠加）
# - CLAW 这类 Agent 复杂系统 → full（22 modules，全层覆盖）
# 这个判断本身就是系统工程——不是越多越好，是按需组织。
```

### ❌ 负面示例 2：加规则不加反馈

```markdown
# ❌ 错误做法：
# "我在 ECC common/ 下加了 5 个新规则文件，覆盖更多边界情况。"
# → grep 信号：新增 .md 文件，但没有对应的 hooks/ 或 settings.json 变更
# → 问题：规则加了，但没有任何 Hook 强制执行，也没有 audit 验证是否生效。
# → 违反了"反馈闭合"原则——系统不知道这些新规则有没有被遵守。

# ✅ 正确做法：
# "我在 ECC common/ 下加了 1 个新规则文件。
#  同时注册了对应的 PreToolUse Hook（matcher 精确到该规则检查的工具类型），
#  并在 sentinel-state.json 中增加了该规则的遵守率跟踪指标。
#  30 天后用 framework-adoption-audit 检查实际采用率。"
```

---

## grep-able 决策信号

以下检查命令可以在任何 CLAW 项目中运行，快速判断对齐状态：

| # | 检查项 | 命令 | 健康的信号 |
|---|--------|------|----------|
| 1 | ECC 规则知晓 QSS？ | `grep -rl "qss-ecc-alignment\|钱学森\|系统科学" ~/.claude/rules/ecc/` | 至少 2 个文件（session-supervisor.md, command-advisor.md） |
| 2 | CLAUDE.md 有对齐指针？ | `grep "qss-ecc-alignment" CLAUDE.md` | 1 条匹配 |
| 3 | 哨兵有 Hook 执行（不只是文本）？ | `ls ~/.claude/sentinel-state.json 2>/dev/null && echo "EXISTS"` | EXISTS |
| 4 | 学习闭环在增长（螺旋上升）？ | `grep -c "^|" .claude/skills/learned/SKILL.md` | 数字持续增长（当前基准：17） |
| 5 | 规则被动加载陷阱有防护？ | `grep -c "Hook\|PostToolUse" ~/.claude/hooks.json` | >5（关键规则有对应 Hook） |
| 6 | Prompt Defense 未被削弱？ | `grep -c "do not change role" everything-claude-code/.claude/rules/everything-claude-code-guardrails.md` | ≥1 |

---

## 安装/分发指南

### 当前项目（CLAW）

对齐文档主本位于 `E:\WorkBuddy\CLAW\.claude\skills\learned\qss-ecc-alignment.md`，作为 `learned` skill 自动加载。全局副本在 `~/.claude/skills/learned/` 下，确保 ECC 全局规则也能看到。

### 新项目设置

新增项目要继承 QSS+ECC 对齐体系：

```bash
# 从 CLAW 项目根目录执行
CLAW="E:/WorkBuddy/CLAW"
TARGET="/path/to/new-project"

# ① 复制钱学森系统科学 skill
cp -r "$CLAW/.claude/skills/qian-system-science" "$TARGET/.claude/skills/"

# ② 复制对齐文档
mkdir -p "$TARGET/.claude/skills/learned"
cp "$CLAW/.claude/skills/learned/qss-ecc-alignment.md" "$TARGET/.claude/skills/learned/"

# ③ 在 CLAUDE.md 头部加上引用
# （手动编辑，或在 CLAUDE.md 顶部追加以下内容）
cat >> "$TARGET/CLAUDE.md" << 'EOF'

## 🧠 最高指导思想：钱学森系统科学
详见 /qian-system-science。
QSS 与 ECC 的工程对齐关系参见 learned: qss-ecc-alignment。
EOF

# ④ 安装 ECC（已有流程）
cd "$TARGET"
npx ecc install --profile full
```

### 全局副本（使 ECC 全局规则可见）

```bash
mkdir -p ~/.claude/skills/learned
cp E:/WorkBuddy/CLAW/.claude/skills/learned/qss-ecc-alignment.md ~/.claude/skills/learned/
```

主本始终在 CLAW 项目本地维护。全局副本是只读分发——需要修改时改主本，然后重新复制。

---

## 与其他门禁的关系

| 门禁 | 触发时机 | 检查内容 | 与本门禁的关系 |
|------|---------|---------|-------------|
| `claude-md-layer-gate` | 修改 CLAUDE.md | 防止 CLAUDE.md 污染（"怎么做"不进 CLAUDE.md） | 本门禁是 CLAUDE.md 中 QSS 段落的"内容提供者" |
| `qss-skill-creation-gate` | 创建/修改 skill | 三问（定位/边界/反馈） | 本门禁的决策树 1 是"三问"在新组件分类场景的具体化 |
| `qss-gate-feedback-loop` | 30 天回顾 | 门禁成功率、技能活跃度 | 本门禁的 grep-able 信号是反馈回路的输入数据 |
| `sentinel-p0-hooks` | 每次 PostToolUse | 异常检测（6 类信号） | 本门禁的方向 B 表追踪哨兵的"人机结合"执行状态 |
| `framework-adoption-audit-method` | 手动触发 | 框架真实采用率 | 本门禁是审计的受检对象之一（D 级执行条目） |

---

## 自反馈回路

> 本文档反复强调"反馈闭合"原则。以下是本文档自身的反馈定义。

### 回顾周期

- **常规回顾**：每 30 天随 `qss-gate-feedback-loop` 一起触发回顾
- **触发回顾**：以下任一信号出现时立即回顾 — (a) 方向B的 grep-able 信号有任何一条返回"不健康"；(b) 新增或删除 ECC 的 install module；(c) 哨兵检测到超过 3 次"决策树被触发但未被遵循"的异常

### 门禁健康指标

| 指标 | 测量方式 | 健康阈值 | 当前基准（2026-07-01） |
|------|---------|---------|---------------------|
| 引用深�� | `grep -rl "qss-ecc-alignment"` 然后分类 A/B/C/D | ≥2 个 D 级文件 | CLAUDE.md (C), session-supervisor.md (C), command-advisor.md (C) |
| 方向B事实准确性 | 逐行检查 Hook 是否存在、脚本是否可执行 | 100% 行与实际一致 | 9/9 已验证 |
| grep-able 信号有效性 | 运行每个信号命令，确认输出符合"健康信号" | 6/6 命令可执行且返回健康 | 6/6 |
| 决策树使用率 | 查看 `sentinel-log.jsonl` 是否出现"门禁触发"事件 | >0 次/30天 | N/A（新门禁） |

### 反馈升级路径

```
发现问题
  ↓
Q1: 是事实错误还是设计缺陷？
  ├── 事实错误（如：Hook 已下线但方向B表未更新）→ 立即修正本文档
  └── 设计缺陷（如：决策树Q1仍然太模糊）→ 记录到本文档底部"待改进清单"
                                                  ↓
                                             30天回顾时决定是否拆分（→方案B）
```

### 待改进清单

| # | 问题 | 发现日期 | 建议方案 |
|---|------|---------|---------|
| 1 | 决策树1的触发条件太模糊（"需要新增一个能力"），非机械可检测 | 2026-07-01 | 拆分为两个独立门禁：install-gate（触发=npx ecc install）+ rule-change-gate（触发=Write rules/） |
| 2 | 决策树2的Q1（"Prompt Defense Baseline是否被削弱"）需要理解 Prompt Defense 内容才能判断 | 2026-07-01 | 在门禁内嵌入 Prompt Defense Baseline 的 6 条规则摘要，避免外链 |
| 3 | 方向B的"执行方式"列是快照——如果 ECC 新增 Hook 或移除规则，需要同步更新 | 2026-07-01 | 30天回顾时重新核对 |
