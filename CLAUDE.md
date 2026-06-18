# CLAUDE.md — CLAW 项目

## 项目概述

工作台项目，包含多个子项目/站点，以及 AI 工具集成。

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
