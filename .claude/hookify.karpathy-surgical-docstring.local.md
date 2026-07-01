---
name: warn-karpathy-docstring-creep
enabled: true
event: file
action: warn
conditions:
  - field: new_text
    operator: regex_match
    pattern: '"""'
  - field: old_text
    operator: not_contains
    pattern: '"""'
---

⚠️ **Karpathy 原则 3（精准变更）**：检测到添加了 docstring。

确认：
- 用户要求了添加 docstring 吗？
- 如果是在修其他东西时顺手加的 → 删掉
- 精准变更 = 只改用户要求改的

> 参考：EXAMPLES.md → Surgical Changes → Example 1（Drive-by Refactoring）
