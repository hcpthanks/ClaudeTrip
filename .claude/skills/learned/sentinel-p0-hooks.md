---
name: sentinel-p0-hooks
description: "哨兵 P0 落地——ecc-context-monitor 集成异质循环检测+静默检测，desktop-notify 集成哨兵徽章，sentinel-state.json 作为 Hook↔Agent 数据总线"
user-invocable: false
origin: auto-extracted
---

# 哨兵 P0 落地 — Hook 实现

**Extracted:** 2026-06-30
**Context:** P0 是哨兵从"纸面存在"到"运行时检测"的关键一步。不同于命令顾问/学习闭环的纯被动规则——P0 通过 Hook 实现了引擎层强制执行，不依赖 LLM 自觉。

## 实现概览

| 文件 | 动作 | 覆盖信号 |
|------|------|---------|
| `scripts/lib/sentinel-state.js` | 新建 — 共享状态库 | 所有信号 |
| `scripts/hooks/ecc-context-monitor.js` | 增强 — +异质循环+静默检测+自限 | Type 5 (同质+异质), Type 6 |
| `scripts/hooks/sentinel-timing.js` | 新建 — 耗时异常检测 | Type 4 |
| `scripts/hooks/desktop-notify.js` | 增强 — +哨兵徽章 | 所有信号 |

## 为什么 P0 不同于顾问/学习闭环

- 顾问/学习闭环 = 纯规则文本 → 依赖 LLM 自觉 → 必然被动失效
- 哨兵 P0 = **Hook 脚本** → Claude Code 引擎在每次 PostToolUse 强制执行 → 不依赖 LLM 自觉
- ecc-context-monitor 的 PostToolUse Hook 已经注册在 hooks.json（matcher: `*`），哨兵逻辑内嵌其中——**零配置激活**

## 自限机制

每种信号每会话最多 3 次 ADVISORY/ALERT。超过后降级为 SILENT（仅写日志，不注入上下文）。防止哨兵自身变成噪音源。

## 三级运行

| 级别 | 行为 | 触发条件 |
|------|------|---------|
| SILENT | 仅写入 sentinel-log.jsonl | 耗时比 < 5×, 偶发低严重度 |
| ADVISORY | 注入 agent 上下文提醒 | 异质循环 ≥5次/5min, 耗时比 ≥5× |
| ALERT | 注入提醒 + desktop-notify 标题变 🛡️ | 耗时比 ≥10×, 极高严重度 |

## 验证方式

P0 无独立 hooks.json 注册 —— ecc-context-monitor 已有 PostToolUse matcher: `*`。
sentinel-timing.js 依赖 hooks.json 注册（matcher: Bash|Agent|Task），或作为独立脚本在后续注册。

验证步骤：
1. 检查 `~/.claude/sentinel-state.json` 是否存在，会话数据是否被持续更新
2. 检查 `~/.claude/sentinel-log.jsonl` 是否在检测到异常时追加记录
3. desktop-notify 弹窗标题是否在哨兵触发时显示 🛡️

## 关键教训

> **Hook 是规则被动加载陷阱的结构性解药。**
> 规则在 system prompt 里 ≠ 会执行。但 Hook 由引擎在每次工具调用后强制执行。
> 哨兵 P0 之所以能破局，不是因为规则写得更好了，而是因为从"被动文本"升级为"引擎层强制执行"。

## Related

- [[session-supervisor]] — 哨兵规则定义
- [[rules-passive-loading-trap]] — 被动加载陷阱根因
- [[qss-gate-feedback-loop]] — QSS 门禁反馈回路（哨兵联动的参考模板）
- [[agent-self-repair-deletion-loop]] — 哨兵应该阻止的故障案例
