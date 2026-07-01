---
name: warn-karpathy-goal-driven
enabled: true
event: stop
action: warn
pattern: ".*"
---

⚠️ **Karpathy 原则 4（目标驱动执行）**：检查本轮修改是否符合 TDD。

停止前确认：
- 修改了实现代码 → 有没有先写复现测试？
- 修了 bug → 测试在修复前失败、修复后通过了吗？
- 加了新功能 → 测试覆盖了吗？

**检验标准**：有没有一个测试能证明你的改动是对的？

> 参考：EXAMPLES.md → Goal-Driven Execution → Example 1 & 3
