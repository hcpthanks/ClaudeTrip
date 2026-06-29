---
name: skill-retirement-evaluation
description: "评估一个 skill 是否应该删除/合并/保留的 6 步判断框架"
user-invocable: false
origin: auto-extracted
---

# Skill 退役评估框架

**提取自:** 2026-06-29 — storyboard-prompter + tts-video 删除过程
**上下文:** 当怀疑一个 skill 可能已经过时、被替代、或不再需要时使用

## 问题

Skill 文件在 `.claude/skills/` 中积累后，部分 skill 可能：
- SKILL.md 描述的功能已被其他 skill 吸收
- 声称的功能完成度低（如 4/11 数据缺失）
- 从未被实际调用，只是"纸面上的存在"
- 文档与实际行为脱节

不做清理的后果：路由混乱、维护负担、新成员不知道该用哪个。

## 6 步评估框架

### Step 1: 读 SKILL.md — 它声称做什么

```
读 .claude/skills/<name>/SKILL.md → 提取核心声明
问题：它声称的能力边界是什么？依赖哪些外部工具？
```

### Step 2: 查调用方 — 谁在用

```
grep -r '<skill-name>' .claude/skills/ .claude/commands/ --include="*.md"
问题：ai-video-factory（或其他入口 skill）实际调用了它吗？
      还是 SKILL.md 描述了一条从未被触发的路径？
```

### Step 3: 找替代者 — 谁能做同样的事

```
列出该 skill 的每个核心功能 → 逐一检查是否有其他 skill 已覆盖
问题：是完全覆盖、部分覆盖、还是无可替代？
```

### Step 4: 识别不可替代数据

```
如果替代者覆盖了功能但不包含数据（如色彩盘、映射表、锚定词）：
  - 这些数据有价值吗？（实际用过吗？）
  - 如果有 → 迁移到替代者的 references/ 目录
  - 如果无 → 一并删除
```

### Step 5: 检查完成度 + Git 状态

```
完成度 = 已完成功能数 / 声称功能数
Git 状态：committed（已交付） vs untracked（会话草稿）

决策矩阵：
  完成度 < 50% + untracked + 有替代者 → 删除
  完成度 < 50% + committed + 有替代者 → 删除 + commit
  完成度 ≥ 80% + 有替代者 → 合并数据后删除
  完成度 ≥ 80% + 无替代者 → 保留，补全缺失部分
```

### Step 6: 执行 + 留痕

```
删除/合并后必须：
  1. 更新 SKILL_INVENTORY.md（移除条目或更新状态）
  2. 更新入口 skill 的关联图（移除节点引用）
  3. 追加 memory 记录（标注迁移目标，供未来查证）
```

## 使用时机

- 发现 SKILL_INVENTORY.md 中有 🟡 状态的 skill 超过 2 周未改进
- 新 skill 上线后，旧 skill 的职责可能已被覆盖
- 做技能审计时（建议每 2-3 周一次）
- 发现 SKILL.md 描述与实际代码行为不一致时

## 反例：不应删除的情况

- SKILL.md 描述准确、功能完整、只是当前项目没用到（可能其他项目用）
- 完成度低但有明确的补全计划和时间表
- 是唯一实现某功能的 skill，即使完成度低
