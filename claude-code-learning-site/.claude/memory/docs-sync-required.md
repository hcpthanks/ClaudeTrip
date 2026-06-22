---
name: docs-sync-required
description: PostToolUse Hook 已自动化 claude-code-learning-site/ → docs/ 同步，三道安全护栏
metadata:
  type: project
---

**关键规则：改完 `claude-code-learning-site/` 下的静态文件后，PostToolUse Hook 自动同步到 `docs/`。**

原因：GitHub Pages 从 `docs/` 目录部署，不同步则线上不更新。

**当前状态：✅ 已自动化**

Hook 配置在 `.claude/settings.json` → `PostToolUse` → `Write|Edit` matcher。
每次编辑 `claude-code-learning-site/` 下的静态文件，自动复制到 `docs/`。

三道安全护栏：
1. 文件类型白名单 — 只同步 .html .css .js .png .jpg .svg .webp .mp4 .json 等
2. 敏感目录黑名单 — api/ lib/ admin/ tests/ serverless/ CLAUDE.md 绝不泄漏
3. 目标存在检查 — docs/ 没有的文件不会新建

**Why:** 这个问题出现了 3 次（应用课 + 预备课 + 支付页价格），不能再靠记忆。

**变更历史：**
- 2026-06-20: 从 LEVEL 1（记忆）升级到 LEVEL 4（PostToolUse Hook），soft-rule-escalation 成功案例
