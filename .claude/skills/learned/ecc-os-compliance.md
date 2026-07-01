---
name: ecc-os-compliance
description: "ECC是操作系统不是参考书——每一次绕过ECC门禁都产生同质失败链。触发：改文件/加新东西/审计之前必须查询已运行的ECC约束"
user-invocable: false
origin: auto-extracted
---

# ECC 操作系统合规 —— 从参考书到铁律

**Extracted:** 2026-07-01
**Context:** statusline 配置覆盖冲突事件 + QSS 审计重复造轮子——同一会话中连续 6 次绕过 ECC 门禁

## 问题

ECC 是 CLAW 项目的运行系统（Hooks/Agents/Rules/Gates），但我把它当参考书读而不是操作系统执行。

2026-07-01 会话中连续 6 次违规的证据链：

| # | 做了什么 | 绕过了什么 | 为什么是系统性故障 |
|---|---------|-----------|-----------------|
| 1 | 改 statusline.js，没先 grep 覆盖 | karpathy-guidelines #1 — Think Before Coding | 被动规则 = 不执行 |
| 2 | 启动 QSS 审计，不知三轨观察期已运行 | QSS 30 天采集日历 | 没先查已有计划 |
| 3 | 审计后立即提加 Hook 方案 | gate-deferral-observation-period（30天不新增）+ 决策树 2（新机制需反馈回路） | 没读门禁就施工 |
| 4 | 没查 learned skill 是否有同类教训 | learned SKILL.md（21 条已有） | 没利用知识库 |
| 5 | 写入审计数据，没经过 QSS 决策树验证 | qss-ecc-alignment 决策树 2 | 审计结果本身也需要审计 |
| 6 | 改 statusline.js 后没调 code-reviewer | code-review.md（MUST 触发：代码修改后） | 审查门禁被跳过 |

**根本原因：**

ECC 在 system prompt 里被加载为一个巨大的规则目录。面对任务请求（"反追踪"、"做个审计"），我进入任务模式，自然的执行路径是"做完任务"而不是"先过 ECC 门禁"。

这是 [[rules-passive-loading-trap]] 的**执行端对应物**：不只是规则没触发，而是整个操作系统被当作参考书，想读才读。

## 解决方案

### 行为约束（对我自己）

在做以下动作**之前**，必须依次完成三个查询：

| 动作类别 | 必须查什么 | 具体命令 |
|---------|-----------|---------|
| 修改任何有覆盖层级的配置文件 | 查该 key 的全部定义点 | `grep -rn "keyName" .claude/settings*.json ~/.claude/settings*.json` |
| 新增任何东西（Hook/规则/计划/skill） | 查 QSS 三轨观察期状态 | 读 `learned: qss-ecc-alignment` + `learned: gate-deferral-observation-period` |
| 审计/诊断/改进建议 | 查 learned skill 是否有同类教训 | `grep -i "keyword" .claude/skills/learned/*.md` |
| 改完代码（任意 Write/Edit） | 调 code-reviewer | 每次 Write/Edit 后自动触发 |

### ECC 作为操作系统的核心含义

不是所有 ECC 规则都需要被执行——**但门禁和审查规则是唯一的例外：它们本身就是"无执行保障时唯一剩下的防线"**。

当这最后的防线被绕过时，系统从"人不完全可靠但有安全网"退化为"人全靠自觉"。

## 何时使用

触发条件（任一满足）：
1. 用户在执行的任何任务出现**重复性失败**（同一类问题被指出 ≥2 次）
2. 发现自己的行为越过了已有门禁/审查机制
3. 新会话开始时（初始化检查点：当前 ECC 观察期状态是什么？）

## Related

- [[rules-passive-loading-trap]] — ECC 规则为什么不执行的根因
- [[ecc-rules-enforcement-audit]] — 94 条 MUST 义务仅 5 条机械保障
- learned: qss-ecc-alignment — 双向映射 + 决策树
- learned: gate-deferral-observation-period — 30 天观察期
- learned: engine-first-data-defers-model — Hook 先跑、数据驱动 Agent
- [[settings-override-hierarchy-trap]] — 配置覆盖层级的具体记录
