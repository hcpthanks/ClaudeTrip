# CLAUDE.md — CLAW 项目

## 项目概述

工作台项目，包含多个子项目/站点，以及 AI 工具集成。

### 🖥️ 开发机硬件

| 组件 | 型号 | 备注 |
|------|------|------|
| GPU | AMD Radeon RX 580 2048SP (4GB) | 驱动 Adrenalin 2019 → 需更新到 26.5.2 |
| 显示器 | Philips 345B1CR | 34" 曲面超宽, 3440×1440@100Hz, DP连接 |
| 用户视力 | 1400度近视 | DPI缩放用200%, 不能低于150% |
| OS | Windows 10 Pro 19045 | |

**显示设置**（2026-06-22 优化后）：3440×1440 @ 100Hz, DPI 200%（有效1720×720）
**优化脚本**：`E:\tmp\amd_optimize.ps1`（切换分辨率+关VSR），`E:\tmp\amd_diag.ps1`（完整诊断）

### ⚠️ Bash→PowerShell 转义铁律

**在 Bash 工具中执行 PowerShell 代码的唯一可靠方式**：写 .ps1 文件 → `-File` 执行。
绝不要在 `-Command` 中直写含 `$_` / `foreach` / `Where-Object` / `%` 的 PowerShell 代码。
详见 memory：[[bash-powershell-escape-rule]]

### ⚠️ 规则被动加载陷阱（2026-06-22 根因分析）

**规则在 system prompt 里 ≠ 模型会按规则执行。**
哨兵/命令顾问/学习闭环三条核心规则曾全部同时失效，根因是：
1. 规则是"被动文本"不是"硬中断"——混在 1万+ tokens 里被"看了但没做"
2. 任务模式跳过元认知——请求越像工具调用（"帮我X"），模型越倾向直接做X
3. 没有强制执行点——可在关键操作点加 Hook 作为双重保障

详见 memory：[[rules-passive-loading-trap]] + skill：`learned/rules-passive-loading-trap`

## 重要功能（2026-06-17）

### 🤖 Agnes AI 全模态集成

已将 Agnes AI 三个免费模型集成到 Claude Code：
- **文本对话** `agnes-2.0-flash`：OpenAI 兼容，1M 上下文，MCP 工具 `agnes_chat`
- **图片生成** `agnes-image-2.0-flash`：文生图，~5秒出图，MCP 工具 `agnes_image`
- **视频生成** `agnes-video-v2.0`：文生视频（异步轮询），音画同出，MCP 工具 `agnes_video`

**相关文件**：
| 文件 | 说明 |
|------|------|
| `agents/agnes-mcp/server.py` | MCP Server，3个工具（含自动轮询） |
| `.mcp.json` | MCP 注册配置，API Key 已配置 |
| `.claude/skills/ecc/agnes-ai/SKILL.md` | 完整 API 参考文档 |
| `E:\示范项目\Agnes_AI_完全使用指南.html` | 10章零基础教程 |

**Base URL**: `https://apihub.agnes-ai.com/v1`
**当前状态**: 三个模型全免费，API Key 已配置
**视频参数**: num_frames 必须满足 8n+1（121/241/361/441）
**首次实战**: 2026-06-16 成功生成 15 秒视频（361帧，1088×832，2.9MB）

### 🔊 TTS 视频工具（三引擎：配音+字幕）

将文案一键转为带中文配音 + 同步字幕的 MP4 视频。

| 引擎 | 类型 | 命令 | 音色 |
|------|------|------|------|
| edge-tts (默认) | 云端 | `--engine edgetts -v <语音>` | 8种 (xiaoxiao/yunxi等) |
| CosyVoice2 | 本地 5.3GB | `--engine cosyvoice2` | 1种 (zero-shot) |
| Qwen3-TTS | 本地 2.4GB | `--engine qwen3tts --qwen3-speaker vivian` | 9种 |

- **命令**: `python .claude/tools/tts-video/generate.py -t "<文案>" -o <输出.mp4> --engine <引擎>`
- **Skill**: `/tts-video` 或直接描述需求
- **与 Agnes 配合**: Agnes 出画面 + TTS 出配音字幕 + 剪映合成
- **指南**: `AI视频生产线使用指南.html`
- **模型目录**: `.claude/models/CosyVoice2-0.5B/` + `.claude/models/Qwen3-TTS-12Hz-0.6B-CustomVoice/`
- **ChatTTS 放弃**: numba/llvmlite Win10崩溃 + 模型格式不兼容 (.pt vs .safetensors)

## 子项目

- `claude-code-learning-site/` — Claude Code 学习站（主要子项目）
- `everything-claude-code/` — ECC 工具集
- `biaohe/` — 标合项目
- `docs/` — GitHub Pages 发布目录（需与 learning-site 双向同步）

## Git

- 主分支: main
- Push: `git -c credential.helper= push origin main`

## 重要修复（2026-06-21）

### 🔧 Edge 浏览器永久修复

Edge root 启动器被强杀后损坏为 RuntimeBroker 存根（v8.9.8.9），导致进程有但窗口不出现。
已建立三层防护，详见 `~/.claude/skills/learned/edge-browser-fix-corrupted-launcher/SKILL.md`。

| 层级 | 机制 | 路径/位置 |
|------|------|----------|
| ① | 删除开机自启注册表 | `HKCU\...\Run\MicrosoftEdgeAutoLaunch_*`（已删） |
| ② | 组策略禁用后台运行 | `HKLM\SOFTWARE\Policies\Microsoft\Edge\BackgroundModeEnabled=0` |
| ③ | 登录自动修复计划任务 | `EdgeAutoRepair` → `~/.claude/scripts/edge-auto-repair.ps1` |

### 🛡️ 会话监管哨兵

`~/.claude/rules/ecc/common/session-supervisor.md` — 每次启动自动加载，检测 6 类异常：
重复重试 / 质量回退 / 静默换方案 / 耗时异常 / 隐形循环 / 长时间无反馈

### 🧭 命令顾问 v2 (Command Advisor)

`~/.claude/rules/ecc/common/command-advisor.md` — 每次启动自动加载，3 支柱架构：
- **🧭 项目感知**：启动时读 CLAUDE.md + task_plan.md + memory，基于项目实际规则推荐
- **🔒 收尾门禁**：/clear 前强制检查 commit/push/CLAUDE.md更新/双目录同步/保存会话/学习卡
- **🧠 学习闭环**：设计追问 + 过程留痕 + 学习总结 + HTML 学习卡自动生成
- 与哨兵互补：哨兵喊停，顾问指路。task_plan.md 模板已联动升级（+检查清单+门禁+学习目标）
- 核心教训见 skill：`rule-design-project-awareness`（自动化规则必须有项目感知，不能依赖静态模板）

### 🧑‍💻 个人主页（关于作者）— 2026-06-21 上线

- **线上**：https://www.hcpthanks.com/about
- **首页入口**：Hero 下方作者卡片 + 导航栏"关于作者"链接
- **内容**：5大板块（个人简介/工作方法论/能力技能/项目作品/联系方式）
- **定位**："AI创业研究员" — 先行者叙事，3阶段方法论
- **头像**：抖音 @AI创业研究员 (GuoBaYa9917)，`docs/assets/images/avatar.jpg`
- **设计规格书**：`docs/superpowers/specs/2026-06-21-about-author-page-design.md`
- **关键文件**：`docs/about.html`（228行）+ `docs/index.html`（+14行）+ `docs/assets/js/nav.js`（+2行）
- **备注**：项目展示可替换（当前4个：学习站/AI视频工厂/交易看板/嵌入系统）

### 🎬 SceneFab Skill — AI 影视解说视频生成器（2026-06-21）

将视频自动变成带 AI 解说配音 + 字幕的成品 MP4。
- **Skill**: `.claude/skills/scenefab/SKILL.md`（322行）
- **源码**: `E:\WorkBuddy\scenefab\scene-fab-2.1.1`
- **流水线**: 视频 → FFmpeg抽帧 → Qwen3.7分镜 → DeepSeek解说词 → EdgeTTS配音 → ASS字幕合成
- **三引擎**: Qwen3.7(Vision) + DeepSeek(解说) + EdgeTTS(配音)
- **短剧模式**: 批量处理 25-50 集，支持 7 种解说风格
- **待解决**: 分镜提示词需优化（当前用测试彩条无意义），需真实视频素材测试

### 🎬 AI 视频工厂规则更新

- `generate_simple_video.py` — 修复中文编码（`--text` → `--file`）
- `ai-video-factory` skill — SOP 加"只生成一次，绝不自动重试"
- `autoresearch` skill — Safety Invariants 加"启动前确认 + 禁止静默循环"
