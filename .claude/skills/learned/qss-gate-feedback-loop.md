---
name: qss-gate-feedback-loop
description: "QSS 门禁系统的反馈回路——30天回顾触发器、成功指标、从门禁结果自动生成 learned rule 的规则"
user-invocable: false
origin: auto-extracted
---

# QSS 门禁反馈回路

**Extracted:** 2026-06-30
**Context:** 门禁本身也是系统组件——如果没有从产出回到输入的反馈，门禁会僵化、被绕过、或产生错误拒绝。钱学森综合集成方法的核心是"螺旋上升"：每一轮迭代在上一轮基础上有认识提升。本文件建立门禁自身的反馈机制。

## 三层反馈机制

### 第一层：门禁结果记录

每次门禁被触发时，应在回答中生成一条结构化记录。格式：

```yaml
gate_result:
  gate: <门禁名称>
  date: YYYY-MM-DD
  target: <被审核的对象（skill名/文件名）>
  action: <create | modify | delete>
  q1_layer: <层次判定>
  q1_pass: true|false
  q2_overlap_check: <grep 结果简述>
  q2_pass: true|false
  q3_feedback_mechanism: <反馈机制简述>
  q3_pass: true|false
  verdict: PASS|FAIL
  notes: <额外备注（可选）>
```

**存储位置**：`.claude/skills/qian-system-science/feedback/gate-results/` 目录下。

**命名规则**：`YYYY-MM-DD-<target-name>-gate-result.md`

### 第二层：30 天回顾触发器

每个通过门禁创建的 skill，其 SKILL.md frontmatter 中应包含：

```yaml
review_date: YYYY-MM-DD     # 创建日期 + 30 天
qss_layer: <层次>            # 门禁 Q1 判定
qss_overlap_group: <分组>    # 门禁 Q2 判定的功能分组
```

当 LLM 在任何对话中检测到 `review_date` 已过期（当前日期 > review_date），应触发回顾流程：

1. 加载该 skill 的 SKILL.md
2. 检查：skill 在过去 30 天是否被触发/引用过？
3. 检查：skill 的层次定位是否仍然准确？
4. 检查：有没有新 skill 替代了它的功能？
5. 输出评估结果：✅ 保持 / ⚠️ 改进 / ❌ 退役

### 第三层：从门禁结果生成 learned rule

**触发条件**：
- 门禁 PASS → 提取"这个 skill 为什么通过"的关键决策理由
- 门禁 FAIL → 提取"为什么被拒绝"的具体原因

**生成规则**：

```
门禁 PASS + 决策依据明确
  →
生成 learned rule，格式：
  - 文件名：qss-gate-<target-name>-passed.md
  - 内容：记录通过理由、层次定位分析、边界判断依据
  - 目的：形成"通过模式库"，未来类似 skill 可快速参考

门禁 FAIL + 拒绝原因具体
  →
生成 learned rule，格式：
  - 文件名：qss-gate-<pattern>-rejected.md
  - 内容：记录拒绝原因、缺失的元素、如何修复
  - 目的：形成"常见拒绝模式库"，加速未来判断
```

生成的 learned rule 应追加到 `learned/SKILL.md` 索引中。

---

## 成功指标（30 天后评估，2026-07-30）

| # | 指标 | 目标 | 测量方式 |
|---|------|------|---------|
| 1 | **门禁触发率** | skill 创建时 100% 触发 | 检查 writing-skills 流程是否每次都经过 QSS 检查 |
| 2 | **门禁拒绝率** | 10-30% | 统计 gate-results/ 下 PASS vs FAIL 比例。太低→门禁太松；太高→门禁太严 |
| 3 | **创建后重构率** | 创建 30 天内不需要大幅重写 | 检查新 skill 的 commit 历史中是否有"重写/重构"类提交 |
| 4 | **skill 活跃度** | 80%+ 的 skill 在 30 天内至少被触发一次 | 检查 skill 被加载/引用的日志 |
| 5 | **层次准确性** | 门禁分配的 layer 在 30 天后被证实正确 | 回顾审查时逐项确认 |
| 6 | **外部引用增长** | QSS 外部引用文件数从 3 增长到 ≥ 10 | 执行 `grep -rl "qian-system-science\|钱学森\|系统科学" .claude/skills/ --include="*.md" \| grep -v qian-system-science \| wc -l` |

---

## 30 天回顾触发方式

### 方式 1：人工触发（主要）

在 2026-07-30 前后，用户或 LLM 主动执行：
1. 检查 `gate-results/` 目录下的所有门禁记录
2. 统计 6 个成功指标
3. 逐项评估门禁逻辑是否需要调整
4. 输出评估报告

### 方式 2：自动触发（辅助）

当 LLM 在任何对话中看到 skill 的 `review_date` 已过期时，主动提醒：
> "这个 skill 的 30 天回顾期已到。是否需要运行回顾检查？"

### 方式 3：门禁异常触发

当门禁连续出现以下模式时，自动标记为需要审查：
- 连续 5 次 PASS 无 FAIL → 门禁可能太松
- 连续 3 次 FAIL 同类原因 → 门禁逻辑可能有缺陷
- 30 天内有 skill 绕过门禁直接创建 → 门禁触发机制有漏洞

---

## 与三大系统的联动

| 系统 | 联动方式 |
|------|---------|
| 🧠 QSS | 门禁结果反馈到 synthesis-framework.md 的检查清单（是否需要调整原则） |
| 🛡️ 哨兵 | 检测到"门禁被频繁绕过"时发出异常信号 |
| 🧭 顾问 | 在 /clear 前检查"是否有未完成的 30 天回顾" |

---

## 反馈日志

| 日期 | 事件 | 结果 |
|------|------|------|
| 2026-06-30 | 反馈回路建立 | — |
| *待定* | 首次 30 天回顾 | *待执行* |
