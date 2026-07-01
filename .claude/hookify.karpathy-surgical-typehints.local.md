---
name: warn-karpathy-typehint-drift
enabled: true
event: file
action: warn
conditions:
  - field: new_text
    operator: regex_match
    pattern: "def\\s+\\w+\\([^)]*\\)\\s*->\\s*\\w+\\s*:"
  - field: old_text
    operator: not_contains
    pattern: "->"
---

⚠️ **Karpathy 原则 3（精准变更）**：检测到添加了返回类型标注。

确认：
- 用户要求了添加类型标注吗？
- 还是你在"顺手改进"现有代码？
- 如果是修 bug 或加功能时顺路加的 → 删掉，匹配现有风格

> 参考：EXAMPLES.md → Surgical Changes → Example 2（Style Drift）
