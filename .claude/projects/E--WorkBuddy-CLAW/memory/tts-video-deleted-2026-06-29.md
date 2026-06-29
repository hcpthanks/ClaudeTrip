---
name: tts-video-deleted-2026-06-29
description: tts-video skill 已删除，核心工具精简为 generate.py，由 ai-video-factory 直接调用
metadata:
  type: project
---

# tts-video skill 已删除

**日期**: 2026-06-29
**原因**: SKILL.md 描述的三引擎体系（edge-tts/CosyVoice2/Qwen3-TTS）已被百炼 DashScope 统一替代，从未被 ai-video-factory 调用

## 删除文件

| 文件 | 原因 |
|------|------|
| `.claude/skills/tts-video/SKILL.md` | 过时——描述三引擎体系，实际只走百炼 |
| `.claude/tools/tts-video/generate.py` (旧 161行) | 被 generate_simple_video.py 完全覆盖 |
| `.claude/tools/tts-video/probe_tts_engines.py` | 探测废弃引擎 (edge-tts/CosyVoice2/Qwen3-TTS) |
| `.claude/tools/tts-video/zero_shot_prompt.wav` | CosyVoice2 依赖 (🔴 未装) |
| `.claude/tools/tts-video/test.txt` | 测试文件 |

## 保留

| 文件 | 变更 |
|------|------|
| `.claude/tools/tts-video/generate.py` (592行) | 原名 `generate_simple_video.py`，重命名 |

## 当前状态

```
.claude/tools/tts-video/
  └── generate.py  ← 唯一文件，ai-video-factory 极速轨核心执行器
                     百炼 DashScope TTS + FFmpeg 渐变背景 + 9项质检
```

## 职责

generate.py 在 ai-video-factory v3.5 中的两处使用：
- **极速轨**：主渲染引擎
- **品质轨**：降级路径（底图/动效失败时回退到纯色+字幕）

**Why:** SKILL.md 与实际使用完全脱节（3 引擎 vs 1 引擎），skill 不是文件描述而是运行时入口——没人从 `/tts-video` 进。
**How to apply:** 做视频永远走 `/ai-video-factory`，它内部调用 `python .claude/tools/tts-video/generate.py`。
