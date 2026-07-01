# CLAUDE.md — CLAW 项目

## 项目概述

工作台项目，包含多个子项目/站点，以及 AI 工具集成。

## 🧠 最高指导思想：钱学森系统科学

CLAW 项目的所有技能、Agent 编排、架构决策，遵循**钱学森系统科学体系**的指导。详见 `/qian-system-science`。
QSS 与 ECC 的工程对齐关系参见 learned: qss-ecc-alignment。

核心原则：
- **系统工程 = 组织管理的技术** → Agent 编排本身就是系统工程
- **综合集成方法** → 人机结合、以人为主，从定性到定量
- **开放的复杂巨系统** → CLAW 是复杂的 Agent-工具-知识集成系统，需要整体观
- **总体设计部** → 顶层 orchestration 把控全局，避免局部最优
- **五层大厦** → skills(工程技术) → rules(技术科学) → 元技能(基础科学) → 系统论(桥梁) → 哲学

## ⚠️ 铁律

1. **Bash→PowerShell 转义**：写 .ps1 文件 → `-File` 执行。绝不在 `-Command` 中直写含 `$_` / `foreach` / `%` 的代码。详见 [[bash-powershell-escape-rule]]
2. **规则被动加载陷阱**：规则在 system prompt 里 ≠ 会执行。94条MUST义务仅5条机械保障（5.3%）。详见 [[rules-passive-loading-trap]] + learned: ecc-rules-enforcement-audit
3. **双目录同步**：`claude-code-learning-site/` ⇄ `docs/` 必须双向同步，commit 前校验。详见 [[dual-directory-sync-rule]]
4. **C盘最小化**：所有AI模型/缓存/下载/临时文件必须落在 E 盘或 D 盘。`E:\WorkBuddy\cache\`（HF_HOME/TORCH_HOME/PIP_CACHE_DIR/XDG_CACHE_HOME/PYTHONPYCACHEPREFIX）+ `D:\Cache\`（TEMP/TMP/npm）。TTS模型实体在 `E:\WorkBuddy\models\`→junction到`~/.claude/models/`。新装工具时检查默认下载路径。详见 [[c-drive-minimization-policy]]
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
| AI 视频工厂 v3.5 | 三轨制：极速(百炼TTS+渐变背景) + 品质(Agnes底图+HyperFrames动效) + 解说(scenefab) | `/ai-video-factory` | [[video-pipeline-evolution]] |
| HyperFrames | HTML→MP4 确定性视频渲染 | `npx hyperframes` + 17 skills | [[hyperframes-integration]] |
| SceneFab | AI 影视解说 | `/scenefab` | [[scenefab-skill]] |
| Edge 修复 | 浏览器异常处理 | `~/.claude/scripts/edge-auto-repair.ps1` | [[edge-browser-permanent-fix]] |

## 硬件

- AMD RX 580 4GB + Philips 34" 3440×1440@100Hz + 200% DPI。详见 [[dev-machine-hardware]]

## 关键教训

- **上下文超限**：长会话（>200条）及时 `/clear`。详见 [[context-overload-prevention]]
- **哨兵/顾问/学习闭环**：被动规则可能同时失效，需主动检查。详见 [[rules-passive-loading-trap]]
- **哨兵 P0 已部署**：ecc-context-monitor Hook 集成异质循环+静默检测+自限。`~/.claude/sentinel-state.json` + `sentinel-log.jsonl`。详见 `sentinel-p0-hooks` learned rule
- **Agent 失控立即关终端**：发现 agent 反复修改/删除/重建文件 → 直接关闭 VS Code 终端，不等它"自愈"。详见 [[agent-self-repair-deletion-loop]]

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
