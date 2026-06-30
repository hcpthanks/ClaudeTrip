# Everything Claude Code (ECC) — Agent Instructions

This is a **production-ready AI coding plugin** providing 63 specialized agents, 249 skills, 79 commands, and automated hook workflows for software development.

**Version:** 2.0.0-rc.1

---

## 🧠 最高指导思想：钱学森系统科学

**所有思考、决策、编码、编排必须在此框架下进行。**

### 系统科学的"五层大厦"

```
马克思主义哲学（辩证唯物主义）
  ↕ 系统论（桥梁：把哲学翻译为系统语言）
  ↕ 系统学（基础科学：开放的复杂巨系统、涌现、自组织）
  ↕ 运筹学/控制论/信息论（技术科学：三论归一）
  ↕ 各类系统工程（工程技术：组织管理的技术）
```

### 六个核心命题（每次重要决策前对照）

1. **系统工程 = 组织管理的技术** — Agent 编排、项目架构、流程设计都是系统工程
2. **综合集成方法** — 人机结合、以人为主；从定性到定量；专家体系 + 知识体系 + 机器体系三位一体
3. **开放的复杂巨系统** — CLAW/项目本身是复杂系统，整体行为 ≠ 部分加和，关注涌现
4. **总体设计部** — 任何复杂项目必须有顶层 orchestration 把控全局，避免局部最优导致全局次优
5. **系统论超越还原论** — 1+1>2，既分解分析又综合集成，是第三种方法论
6. **螺旋上升** — 定性→定性定量结合→定量→更高层次定性，循环往复、逐次逼近

### 方法论公式

```
钱学森：专家体系 + 知识体系 + 机器体系 → 从定性到定量综合集成

CLAW：  用户（专家） + skills/rules（知识） + Agent/工具（机器） → 从模糊需求到精确产出
```

### 决策检查清单

每次面临重大决策（架构、技术选型、Agent 编排、新建 skill 等），回答：
- [ ] **边界清晰吗？** 这个组件/系统的边界在哪？
- [ ] **层次对吗？** 在五层大厦的哪一层？不要用基础科学方法做工程技术的事
- [ ] **涌现考虑了吗？** 多个组件组合会产生什么不可预期的行为？
- [ ] **人-机结合了吗？** 关键决策点是人做的还是机器做的？
- [ ] **反馈闭合了吗？** 有从产出回到输入的反馈机制吗（验证/复盘/learned）？
- [ ] **门禁激活了吗？** 如果正在创建/修改 skill，必须先通过 `qss-skill-creation-gate`（三个问题全部回答清楚才能开工）。如果是架构决策或改 CLAUDE.md，先通过 `claude-md-layer-gate` 层次审核。

详见 `/qian-system-science`（skill 入口）及 `~/.claude/skills/qian-system-science/references/` 下的四份详细文档。

---

## Core Principles

1. **Agent-First** — Delegate to specialized agents for domain tasks
2. **Test-Driven** — Write tests before implementation, 80%+ coverage required
3. **Security-First** — Never compromise on security; validate all inputs
4. **Immutability** — Always create new objects, never mutate existing ones
5. **Plan Before Execute** — Plan complex features before writing code

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design and scalability | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code quality and maintainability | After writing/modifying code |
| security-reviewer | Vulnerability detection | Before commits, sensitive code |
| build-error-resolver | Fix build/type errors | When build fails |
| e2e-runner | End-to-end Playwright testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation and codemaps | Updating docs |
| cpp-reviewer | C/C++ code review | C and C++ projects |
| cpp-build-resolver | C/C++ build errors | C and C++ build failures |
| fsharp-reviewer | F# functional code review | F# projects |
| docs-lookup | Documentation lookup via Context7 | API/docs questions |
| go-reviewer | Go code review | Go projects |
| go-build-resolver | Go build errors | Go build failures |
| kotlin-reviewer | Kotlin code review | Kotlin/Android/KMP projects |
| kotlin-build-resolver | Kotlin/Gradle build errors | Kotlin build failures |
| database-reviewer | PostgreSQL/Supabase specialist | Schema design, query optimization |
| python-reviewer | Python code review | Python projects |
| django-reviewer | Django code review | Django apps, DRF APIs, ORM, migrations |
| django-build-resolver | Django build, migration, and setup errors | Django startup, dependency, migration, collectstatic failures |
| java-reviewer | Java and Spring Boot code review | Java/Spring Boot projects |
| java-build-resolver | Java/Maven/Gradle build errors | Java build failures |
| loop-operator | Autonomous loop execution | Run loops safely, monitor stalls, intervene |
| harness-optimizer | Harness config tuning | Reliability, cost, throughput |
| rust-reviewer | Rust code review | Rust projects |
| rust-build-resolver | Rust build errors | Rust build failures |
| pytorch-build-resolver | PyTorch runtime/CUDA/training errors | PyTorch build/training failures |
| mle-reviewer | Production ML pipeline review | ML pipelines, evals, serving, monitoring, rollback |
| typescript-reviewer | TypeScript/JavaScript code review | TypeScript/JavaScript projects |

## Agent Orchestration

Use agents proactively without user prompt:
- Complex feature requests → **planner**
- Code just written/modified → **code-reviewer**
- Bug fix or new feature → **tdd-guide**
- Architectural decision → **architect**
- Security-sensitive code → **security-reviewer**
- Autonomous loops / loop monitoring → **loop-operator**
- Harness config reliability and cost → **harness-optimizer**

Use parallel execution for independent operations — launch multiple agents simultaneously.

## Security Guidelines

**Before ANY commit:**
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Authentication/authorization verified
- Rate limiting on all endpoints
- Error messages don't leak sensitive data

**Secret management:** NEVER hardcode secrets. Use environment variables or a secret manager. Validate required secrets at startup. Rotate any exposed secrets immediately.

**If security issue found:** STOP → use security-reviewer agent → fix CRITICAL issues → rotate exposed secrets → review codebase for similar issues.

## Coding Style

**Immutability (CRITICAL):** Always create new objects, never mutate. Return new copies with changes applied.

**File organization:** Many small files over few large ones. 200-400 lines typical, 800 max. Organize by feature/domain, not by type. High cohesion, low coupling.

**Error handling:** Handle errors at every level. Provide user-friendly messages in UI code. Log detailed context server-side. Never silently swallow errors.

**Input validation:** Validate all user input at system boundaries. Use schema-based validation. Fail fast with clear messages. Never trust external data.

**Code quality checklist:**
- Functions small (<50 lines), files focused (<800 lines)
- No deep nesting (>4 levels)
- Proper error handling, no hardcoded values
- Readable, well-named identifiers

## Testing Requirements

**Minimum coverage: 80%**

Test types (all required):
1. **Unit tests** — Individual functions, utilities, components
2. **Integration tests** — API endpoints, database operations
3. **E2E tests** — Critical user flows

**TDD workflow (mandatory):**
1. Write test first (RED) — test should FAIL
2. Write minimal implementation (GREEN) — test should PASS
3. Refactor (IMPROVE) — verify coverage 80%+

Troubleshoot failures: check test isolation → verify mocks → fix implementation (not tests, unless tests are wrong).

## Development Workflow

1. **Plan** — Use planner agent, identify dependencies and risks, break into phases
2. **TDD** — Use tdd-guide agent, write tests first, implement, refactor
3. **Review** — Use code-reviewer agent immediately, address CRITICAL/HIGH issues
4. **Capture knowledge in the right place**
   - Personal debugging notes, preferences, and temporary context → auto memory
   - Team/project knowledge (architecture decisions, API changes, runbooks) → the project's existing docs structure
   - If the current task already produces the relevant docs or code comments, do not duplicate the same information elsewhere
   - If there is no obvious project doc location, ask before creating a new top-level file
5. **Commit** — Conventional commits format, comprehensive PR summaries

## Workflow Surface Policy

- `skills/` is the canonical workflow surface.
- New workflow contributions should land in `skills/` first.
- `commands/` is a legacy slash-entry compatibility surface and should only be added or updated when a shim is still required for migration or cross-harness parity.

## Git Workflow

**Commit format:** `<type>: <description>` — Types: feat, fix, refactor, docs, test, chore, perf, ci

**PR workflow:** Analyze full commit history → draft comprehensive summary → include test plan → push with `-u` flag.

## Architecture Patterns

**API response format:** Consistent envelope with success indicator, data payload, error message, and pagination metadata.

**Repository pattern:** Encapsulate data access behind standard interface (findAll, findById, create, update, delete). Business logic depends on abstract interface, not storage mechanism.

**Skeleton projects:** Search for battle-tested templates, evaluate with parallel agents (security, extensibility, relevance), clone best match, iterate within proven structure.

## Performance

**Context management:** Avoid last 20% of context window for large refactoring and multi-file features. Lower-sensitivity tasks (single edits, docs, simple fixes) tolerate higher utilization.

**Build troubleshooting:** Use build-error-resolver agent → analyze errors → fix incrementally → verify after each fix.

## Project Structure

```
agents/          — 63 specialized subagents
skills/          — 249 workflow skills and domain knowledge
commands/        — 79 slash commands
hooks/           — Trigger-based automations
rules/           — Always-follow guidelines (common + per-language)
scripts/         — Cross-platform Node.js utilities
mcp-configs/     — 14 MCP server configurations
tests/           — Test suite
```

`commands/` remains in the repo for compatibility, but the long-term direction is skills-first.

## Success Metrics

- All tests pass with 80%+ coverage
- No security vulnerabilities
- Code is readable and maintainable
- Performance is acceptable
- User requirements are met
