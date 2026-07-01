# Behavioral Guidelines for LLM Coding

> This file extends [coding-style.md](coding-style.md) with behavioral discipline that prevents common LLM coding mistakes.
> Derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.
> **QSS 定位**: 技术科学层 — 约束编码行为的理论原则，指导工程技术层的具体实践。
> 详细反面教材见 skill: `/karpathy-guidelines`

## Tradeoff

These guidelines bias toward **caution over speed**. For trivial tasks (typo fixes, obvious one-liners), use judgment — not every change needs full rigor.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, **ask** — don't guess.
- If multiple interpretations exist, **present them all** — don't pick silently.
- If a simpler approach exists, **say so**. Push back when warranted.
- If something is unclear, **stop**. Name what's confusing. Ask.

> **QSS 对齐**: 对应"从定性到定量综合集成法"——在做（定量）之前，先把理解（定性）做扎实。不假设 = 不跳过定性阶段。

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

> **与 coding-style.md 的关系**: coding-style.md 的 KISS/YAGNI 是原则陈述，本条是其**行为执行层面**的具体化。

## 3. Surgical Changes (CRITICAL)

**Touch only what you must. Clean up only your own mess.**

> ECC 体系中此前缺失的维度。这是四条原则中对 diff 质量影响最大的一条。

When editing existing code:
- ❌ Don't "improve" adjacent code, comments, or formatting.
- ❌ Don't refactor things that aren't broken.
- ✅ Match existing style, even if you'd do it differently.
- ✅ If you notice unrelated dead code, **mention it** — don't delete it.

When your changes create orphans:
- ✅ Remove imports/variables/functions that YOUR changes made unused.
- ❌ Don't remove pre-existing dead code unless asked.

**The test**: Every changed line should trace directly to the user's request.

> **QSS 对齐**: 对应"边界清晰"原则——系统组件的边界就是"用户请求的范围"。越界修改破坏了系统层次间的契约。

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform imperative tasks into verifiable goals:

| Instead of... | Transform to... |
|--------------|-----------------|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let the agent loop independently. Weak criteria ("make it work") require constant clarification.

> **与 testing.md/development-workflow.md 的关系**: testing.md 提供了 TDD 方法论，本条是其**任务级执行**——把任何模糊需求转化为 TDD 可验证的目标。

---

## Anti-Patterns Summary

| Principle | Anti-Pattern | Fix |
|-----------|-------------|-----|
| Think Before Coding | Silently assumes file format, fields, scope | List assumptions explicitly, ask for clarification |
| Simplicity First | Strategy pattern for single discount calculation | One function until complexity is actually needed |
| Surgical Changes | Reformats quotes, adds type hints while fixing bug | Only change lines that fix the reported issue |
| Goal-Driven | "I'll review and improve the code" | "Write test for bug X → make it pass → verify no regressions" |

---

## How to Know It's Working

These guidelines are working if you see:

- **Fewer unnecessary changes in diffs** — Only requested changes appear
- **Fewer rewrites due to overcomplication** — Code is simple the first time
- **Clarifying questions come before implementation** — Not after mistakes
- **Clean, minimal PRs** — No drive-by refactoring or "improvements"

---

## Integration with Other Rules

This rule works with:

- [coding-style.md](coding-style.md) — KISS, YAGNI, DRY principles
- [testing.md](testing.md) — TDD methodology, 80% coverage
- [development-workflow.md](development-workflow.md) — Plan-first workflow
- [code-review.md](code-review.md) — Review checklist (check for surgical violations)
- [agents.md](agents.md) — Agent delegation strategy
