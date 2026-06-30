---
name: qian-system-science
description: 钱学森系统科学体系 — CLAW 项目最高指导思想。三本奠基著作（《论系统工程》《创建系统学》《钱学森论系统科学》）的知识体系，作为所有技能、Agent 编排、项目架构的顶层哲学框架。
---

# 钱学森系统科学 — 最高指导思想

> **定位**：本 skill 是 CLAW 项目的**最高指导框架**。所有技能、Agent、工具、流程都应在系统科学思想的指导下运行。
> **为什么是最高**：系统科学不是某一个具体领域的知识，而是**关于"如何组织复杂事物"的元方法**。CLAW 本身就是一个复杂的 Agent-工具-知识的集成系统，天然需要系统工程方法论。

## 知识来源

| # | 著作 | 作者 | 核心贡献 | 详情 |
|---|------|------|----------|------|
| 1 | **《论系统工程》** | 钱学森等 | 系统科学体系结构、系统工程定义 | [→](references/lun-system-engineering.md) |
| 2 | **《创建系统学》** | 钱学森 | 开放的复杂巨系统、综合集成方法 | [→](references/chuangjian-systemology.md) |
| 3 | **《钱学森论系统科学》** | 钱学森（汇编） | 三卷汇整（讲话+书信+文章），最完整原典 | [→](references/lun-system-science.md) |

## 框架体系：三个应用层级

钱学森思想在 CLAW 中的应用分为三层：

### 第一层：哲学指导（做事的"世界观"）
- **普遍联系** → 每个组件都是更大系统的子系统，任何改动要考虑全局影响
- **量变到质变** → 多个小优化累积会涌现新能力（涌现 Emergence）
- **对立统一** → Agent 之间的"竞争+协同"是系统演化的动力

### 第二层：方法论（"怎么做"的具体方法）
- **综合集成方法**：人机结合、以人为主，从定性到定量
- **总体设计部**：每个重大项目都要有"总体部"把控全局
- **三层楼体系**：工程技术(怎么做) → 技术科学(为什么这么做) → 基础科学(一般规律)

### 第三层：工程实践（落地执行）
- **系统工程 = 组织管理的技术**
- 大型 Agent 编排遵循系统工程方法
- 项目架构按系统科学层级组织

## 与 CLAW 的映射

| 钱学森概念 | CLAW 对应 |
|-----------|----------|
| 开放的复杂巨系统 | Agent 生态（多个 Agent + 工具 + MCP + 知识） |
| 综合集成方法 | Agent 编排：人（用户）指导 + 机器（Agent）执行 |
| 总体设计部 | skill 体系中的顶层 orchestration skill |
| 三层楼 | skills（工程技术）→ rules（技术科学）→ 本 skill（基础科学） |
| 系统论桥梁 | 本 skill 本身 — 连接哲学与工程实践 |
| 从定性到定量 | 用户模糊意图 → Agent 精确执行 |

## 使用方式

1. **重大决策时**：查阅 [综合框架](references/synthesis-framework.md)，确认决策是否违背系统科学原则
2. **设计新技能时**：必须通过 `qss-skill-creation-gate`（位于 learned skills）——定位（哪一层）、边界（和已有 skill 的关系）、反馈（怎么评估和改进），三个问题全部回答清楚才能开工。光做三层楼检查是不够的。
3. **Agent 编排时**：遵循"综合集成方法"——人机结合、以人为主
4. **遇到复杂问题**：用"开放的复杂巨系统"视角思考——问题是否超越了还原论能处理的范围？

## 文件索引

| 文件 | 内容 |
|------|------|
| [references/lun-system-engineering.md](references/lun-system-engineering.md) | 《论系统工程》— 体系结构、系统工程定义、总体设计部 |
| [references/chuangjian-systemology.md](references/chuangjian-systemology.md) | 《创建系统学》— 复杂巨系统、综合集成、研讨厅 |
| [references/lun-system-science.md](references/lun-system-science.md) | 《钱学森论系统科学》— 三卷完整原典汇编 |
| [references/synthesis-framework.md](references/synthesis-framework.md) | 综合框架 — 三书统一体系 + CLAW 应用路线图 |
