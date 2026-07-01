---
name: warn-karpathy-over-abstraction
enabled: true
event: file
action: warn
conditions:
  - field: new_text
    operator: regex_match
    pattern: "class\\s+\\w+Strategy\\s*\\(|@abstractmethod|class\\s+\\w+\\(\\s*(?:ABC|Protocol)\\s*\\)|class\\s+\\w+(?:Factory|Builder)\\s*:"
  - field: file_path
    operator: not_contains
    pattern: "test"
---

⚠️ **Karpathy 原则 2（简单优先）**：检测到可能过度抽象的信号。

代码中的 `Strategy`/`@abstractmethod`/`ABC`/`Protocol`/`Factory`/`Builder` 模式：
- 现在真的需要多个实现吗？还是只有一个？
- 如果只有一个实现，用一个函数就够了
- 等复杂度真正需要时再重构，不要提前抽象

> 参考：EXAMPLES.md → Simplicity First → Example 1
