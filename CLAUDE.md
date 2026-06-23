# CLAUDE.md — CLAW 项目

## 项目概述

工作台项目，包含多个子项目/站点，以及 AI 工具集成。

## ⚠️ 铁律

1. **Bash→PowerShell 转义**：写 .ps1 文件 → `-File` 执行。绝不在 `-Command` 中直写含 `$_` / `foreach` / `%` 的代码。详见 [[bash-powershell-escape-rule]]
2. **规则被动加载陷阱**：规则在 system prompt 里 ≠ 会执行。关键操作点需主动检查。详见 [[rules-passive-loading-trap]]
3. **双目录同步**：`claude-code-learning-site/` ⇄ `docs/` 必须双向同步，commit 前校验。详见 [[dual-directory-sync-rule]]
4. **C盘最小化**：所有AI模型/缓存/下载必须落在 E 盘。环境变量已锁死（`HF_HOME`/`TORCH_HOME`/`PIP_CACHE_DIR`/`XDG_CACHE_HOME`/`PYTHONPYCACHEPREFIX` → `E:\WorkBuddy\cache\`），TTS 模型实体在 `E:\WorkBuddy\models\`(C 盘是 junction)。新装工具/新建项目时检查模型下载路径是否在 E 盘。详见 [[c-drive-minimization-policy]]
5. **学习卡存E盘**：所有 `*-learning-card.html` / 操作手册 HTML 统一存 `E:\WorkBuddy\learning-cards\`，不在项目目录或 C 盘散落。详见 [[learning-card-storage-location]]

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
| AI 视频工厂 v3.0 | 双轨制：极速(黑底+TTS) + 品质(HyperFrames动效) | `/ai-video-factory` | [[ai-video-factory-skill]] |
| HyperFrames | HTML→MP4 确定性视频渲染 | `npx hyperframes` + 17 skills | [[hyperframes-integration]] |
| TTS 视频 | 配音+字幕 MP4，三引擎 | `python .claude/tools/tts-video/generate.py` 或 `/tts-video` | [[tts-video-tool]] |
| SceneFab | AI 影视解说 | `/scenefab` | [[scenefab-skill]] |
| Edge 修复 | 浏览器异常处理 | `~/.claude/scripts/edge-auto-repair.ps1` | [[edge-browser-permanent-fix]] |

## 硬件

- AMD RX 580 4GB + Philips 34" 3440×1440@100Hz + 200% DPI。详见 [[dev-machine-hardware]]

## 关键教训

- **上下文超限**：长会话（>200条）及时 `/clear`。详见 [[context-overload-prevention]]
- **哨兵/顾问/学习闭环**：被动规则可能同时失效，需主动检查。详见 [[rules-passive-loading-trap]]

<!-- FRAMEPACK MANAGED BLOCK START -->
# Framepack Claude Code Instructions

Framepack is available through the project MCP server.

Project skills are installed under `.claude/skills`. Use `framepack-director`, `framepack-template-fuser`, `framepack-hyperframes-builder`, and `framepack-reference-miner` when the task matches their descriptions. Each skill has a `SKILL.md` index and `references/` with detailed rules, templates, and code patterns — load on demand, do not read all at once.

Use Framepack when the user asks for a polished video, HyperFrames composition, asset-to-video planning, template selection, or vague creative improvements such as cooler, more business, more dynamic, bigger text, faster pacing, or like this reference.

Suggested flow:

1. Create a workbench with `npx -y framepack create --idea "<idea>" --assets <dir> --output-dir <dir>`.
2. Read `FRAMEPACK.md`, then `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `STYLE.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
3. Check `ASSET_GAPS.md` for blocking gaps before writing code. If blocking gaps exist, tell the user what assets are needed.
4. Translate fuzzy user intent into concrete visual language, motion language, template route, and implementation plan.
5. Use HyperFrames-safe rules: CSS first frame visible, scene switches with `tl.set()`, one animation engine per element, and timeline registration on `window.__timelines`.
6. Record render feedback and next actions in `ITERATIONS.md`.
7. Use `framepack workbench brief --project-dir <dir>` when the user needs a plain-language progress recap.

Fallback command surface: `npx -y framepack mcp --describe`.
<!-- FRAMEPACK MANAGED BLOCK END -->
