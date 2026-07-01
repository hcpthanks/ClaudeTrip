---
name: settings-override-hierarchy-trap
description: Claude Code settings.json 合并层级（local > project > user）— 修改配置前必须 grep 所有文件
metadata: 
  node_type: memory
  type: project
  originSessionId: 058893c1-32a6-4974-86b6-3a2d405b764c
---

# 配置覆盖层级陷阱

## 问题

Claude Code 的 settings 合并层级为 **local > project > user**。当 `settings.json` 和 `settings.local.json` 中定义相同 key（如 `statusLine`）时，local 的值会静默覆盖 project 的值，不会报任何错误或警告。

2026-07-01 实战坑：`settings.local.json` 内联 statusline 命令覆盖了 `settings.json` → `statusline.js`，导致反追踪盾牌不显示。`statusline.js` 本身正确运行，但从未被加载。

## 合并优先级

```
settings.local.json (项目本地)  ← 最高
  ↓ 覆盖
settings.json (项目级)
  ↓ 覆盖
~/.claude/settings.local.json (用户本地)
  ↓ 覆盖
~/.claude/settings.json (用户级)  ← 最低
```

## 防护方法

修改 settings 中任何 key 之前，先 grep 所有 settings 文件中该 key 的出现次数：

```bash
grep -rn "statusLine\|hooks\|keyName" \
  .claude/settings*.json \
  ~/.claude/settings*.json 2>/dev/null
```

如果发现同一 key 出现在多个文件里，尤其是 local 版本有更复杂的值 ← **高概率存在覆盖冲突**。

## Related

- [[rules-passive-loading-trap]] — 为什么 passive 规则文本无法防止此类错误
- learned: ecc-rules-enforcement-audit — 94 条 MUST 义务仅 5 条有机械保障，包括本项目缺失的"配置文件覆盖检测"
- learned: ecc-os-compliance — 同一会话中连续 6 次绕过 ECC 门禁（本条目是证据链中的 #1）
- [[karpathy-guidelines #1: Think Before Coding]] — 修改 infra 文件前，先问"这个 key 在哪些地方还定义了？"
