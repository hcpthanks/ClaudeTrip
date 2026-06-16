# CLAUDE.md — CLAW 项目

## 项目概述

工作台项目，包含多个子项目/站点，以及 AI 工具集成。

## 重要功能（2026-06-16）

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

**备注**: 这是 Claude Code 之前做不到的能力——现在能直接在对话中生成视频。

## 子项目

- `claude-code-learning-site/` — Claude Code 学习站（主要子项目）
- `everything-claude-code/` — ECC 工具集
- `biaohe/` — 标合项目
- `docs/` — GitHub Pages 发布目录（需与 learning-site 双向同步）

## Git

- 主分支: main
- Push: `git -c credential.helper= push origin main`
