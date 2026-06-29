---
name: storyboard-prompter-deleted-2026-06-29
description: storyboard-prompter 已删除，核心数据迁移至 ai-video-factory/references/visual-styles.md
metadata:
  type: project
---

# storyboard-prompter 已删除

**日期**: 2026-06-29
**原因**: 评估确认 ai-video-factory + faceless-explainer 已完全覆盖其功能

## 删除内容

- `.claude/skills/storyboard-prompter/SKILL.md` — 605 行，4/11 风格完整，7 种空壳
- `.claude/skills/ai-video-factory/style-bridge.md` — 风格→HyperFrames 预设映射桥

## 数据迁移目标

- **4 种完整风格数据**（A:日式动画, B:国风二次元, C:3D赛博, D:扁平矢量）→ `ai-video-factory/references/visual-styles.md`
- **风格→HyperFrames 预设映射** → `visual-styles.md` 末尾
- **底图生成规则**（6 条标准）→ 已在 ai-video-factory SKILL.md v3.5 中自包含

## 替代关系

| 原 storyboard-prompter 功能 | 现在由谁负责 |
|------------------------------|-------------|
| 风格选型 + 色彩盘 | ai-video-factory/references/visual-styles.md |
| 情绪→光影映射 | ai-video-factory/references/visual-styles.md |
| 底图生成规则 | ai-video-factory SKILL.md 标准 1-6 |
| Agnes Image prompt 模板 | ai-video-factory SKILL.md 标准 2 |
| 素材包格式约定 | ai-video-factory SKILL.md Agent SOP |
| 风格→HyperFrames 预设 | ai-video-factory/references/visual-styles.md |
| 品质轨整体编排 | faceless-explainer SKILL.md Phase 表 |

**Why:** storyboard-prompter 从未 commit、7/11风格空壳、ai-video-factory v3.5 已吸收全部关键知识。
**How to apply:** 品质轨选风格时读 `ai-video-factory/references/visual-styles.md`，不要试图调用 storyboard-prompter。
