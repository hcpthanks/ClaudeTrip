# CLAUDE.md — CLAW 项目

## 项目概述

工作台项目，包含多个子项目/站点，以及 AI 工具集成。

## ⚠️ 铁律

1. **Bash→PowerShell 转义**：写 .ps1 文件 → `-File` 执行。绝不在 `-Command` 中直写含 `$_` / `foreach` / `%` 的代码。详见 [[bash-powershell-escape-rule]]
2. **规则被动加载陷阱**：规则在 system prompt 里 ≠ 会执行。关键操作点需主动检查。详见 [[rules-passive-loading-trap]]
3. **双目录同步**：`claude-code-learning-site/` ⇄ `docs/` 必须双向同步，commit 前校验。详见 [[dual-directory-sync-rule]]

## 子项目与关键路径

- `claude-code-learning-site/` — Claude Code 学习站（主项目）
- `docs/` — GitHub Pages 发布目录（需与 learning-site 双向同步）
- `everything-claude-code/` — ECC 工具集
- `biaohe/` — 标合项目

## Git

- 分支: `main`
- Push: `git -c credential.helper= push origin main`

## 核心工具速查

| 工具 | 用途 | 入口 | 详情 |
|------|------|------|------|
| Agnes AI | 文本/图片/视频生成 | MCP: `agnes_chat/image/video` | [[agnes-ai-integration]] |
| TTS 视频 | 配音+字幕 MP4 | `python .claude/tools/tts-video/generate.py` 或 `/tts-video` | [[tts-video-tool]] |
| SceneFab | AI 影视解说 | `/scenefab` | [[scenefab-skill]] |
| Edge 修复 | 浏览器异常处理 | `~/.claude/scripts/edge-auto-repair.ps1` | [[edge-browser-permanent-fix]] |

## 硬件

- AMD RX 580 4GB + Philips 34" 3440×1440@100Hz + 200% DPI。详见 [[dev-machine-hardware]]

## 关键教训

- **上下文超限**：长会话（>200条）及时 `/clear`。详见 [[context-overload-prevention]]
- **哨兵/顾问/学习闭环**：被动规则可能同时失效，需主动检查。详见 [[rules-passive-loading-trap]]
