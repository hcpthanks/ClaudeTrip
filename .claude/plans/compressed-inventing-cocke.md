# 统一视频生产 Skill 设计方案

## Context

用户目前有 3 个视频相关的 skill/工具（ai-video-factory、scenefab、agnes-ai），它们之间的关系不清晰，用户觉得"乱"。需要合并为一个统一入口，根据用户提供的内容自动选择最佳生产线。

## 核心思路：一个入口，三条产线

```
用户说"做视频" → /make-video
                    │
         ┌──────────┼──────────┐
         │          │          │
    只有文案    文案+要画面   给了视频文件
         │          │          │
         v          v          v
    模式A:快出    模式B:美颜   模式C:解说
    (黑底配音)   (AI配图配B-roll) (SceneFab)
```

## 三个模式

### 模式 A：快速出片（默认）
- **触发**：用户只给文案，没提画面需求
- **流程**：文案 → edge-tts配音 → 字幕 → 黑底 MP4（可选：Agnes 生成封面图）
- **命令**：`generate_simple_video.py script.txt --ass-karaoke`
- **原则**：不提问、不重试、几分钟出片
- **成本**：0 元

### 模式 B：美颜出片（有画面）
- **触发**：用户说"配图/B-roll/素材/有画面/好看一点"
- **流程**：文案分段落 → Agnes 每段生成背景图 → 逐段生成视频 → FFmpeg 拼接
- **可选**：关键段落用 Agnes 生成 5-8 秒 B-roll 动图
- **兜底**：Agnes 失败 → 黑底继续，不卡流程
- **成本**：0 元（Agnes 免费）

### 模式 C：AI 解说（来料加工）
- **触发**：用户给了 .mp4 视频文件
- **流程**：抽帧 → Qwen3.7 分镜 → DeepSeek 解说词 → 配音 → 合成
- **关键改进**：分镜结果**必须展示给用户**（解决之前"分镜没有啊"的投诉）
- **成本**：~0.1-0.5 元/次（Qwen + DeepSeek API）
- **示例**：把电影片段变成带解说的短视频

## Agnes AI 的定位

Agnes 从"独立系统"降级为"素材供应商"：
- `agnes_image` → 模式A/B 的封面图、段落背景图
- `agnes_video` → 模式B 的短 B-roll 动图（5-8秒）
- `agnes_chat` → 文案润色（可选）

**关键原则**：Agnes 只是锦上添花，失败不影响主流程。

## 实现文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `.claude/skills/make-video/SKILL.md` | **新建** | 统一入口 skill，含决策树和 SOP |
| `.claude/skills/ai-video-factory/SKILL.md` | 保留 | 降级为参考文档 |
| `.claude/skills/scenefab/SKILL.md` | 保留 | 模式C内部参考 |
| `CLAUDE.md` | 更新 | 新增 make-video 条目 |

## 改进项

### 改进 1：字幕渲染从 ASS 切换到 drawtext+reload（提升稳定性）

**问题**：当前用 ASS 格式 + FFmpeg `subtitles`/`ass` filter → 依赖 libass 渲染器。Windows 上 libass 通过 fontconfig 找字体经常失败，表现为字幕空白/方块/`original_size` 报错。

**方案**：改用 FFmpeg `drawtext` + `textfile` + `reload=1`，完全绕开 libass，直接用 FreeType 渲染（所有 FFmpeg 版本都内置）。

```
当前（不稳定）                          改进后（稳定）
─────────────────────────────────────────────────────
ASS → libass → fontconfig(经常挂)      drawtext → FreeType(直接渲染)
```

**核心命令**：
```bash
ffmpeg -i audio.mp3 \
  -vf "drawtext=fontfile='C\:/Windows/Fonts/simhei.ttf':\
textfile='subs.txt':reload=1:\
x=(w-text_w)/2:y=h-text_h-80:\
fontsize=42:fontcolor=white@0.95:\
box=1:boxcolor=black@0.5:boxborderw=12" \
  output.mp4
```

**原理**：Python 线程 24fps 写当前字幕到 `subs.txt`，FFmpeg `reload=1` 每帧重读。字体直指文件路径，不走 fontconfig。

**改动范围**：`generate_simple_video.py` — 替换 `composite_srt` + `composite_ass` 为新的 `composite_drawtext` 函数。

**卡拉OK适配**：
- 简化版（优先实现）：全句白色，放弃逐词高亮，渲染绝对稳定
- 进阶版（后续）：PIL 预渲染高亮词为 PNG，逐帧覆盖

**收益**：
- 彻底消灭 libass 字体加载失败
- 中文黑体/雅黑 100% 可靠
- 不再有 `original_size` / 字体路径转义 bug

### ~~改进 2：Agnes MCP video URL bug 修复~~ ✅ 已完成（2026-06-21）
- `server.py` line 205-221：改为尝试 5 个常见字段名 + `remixed_from_video_id` 拼接 + 空 URL 兜底调试输出

### 改进 3：CosyVoice2/Qwen3-TTS 本地引擎接入简单模式
- `generate_simple_video.py` 的 `gen_local_stub()` 当前抛 `NotImplementedError`
- 方案：把 `generate.py` 的本地引擎逻辑移植过来，加 `--engine cosyvoice2/qwen3tts` 支持

---

## 验证方式

1. 模式A：`/make-video` + 给一段文案 → 应出黑底配音视频
2. 模式B：`/make-video` + 文案 + "配图" → 应出带Agnes背景图的多段拼接视频
3. 模式C：`/make-video` + .mp4文件 → 应走SceneFab流程，且分镜结果展示给用户
4. 改进1验证：`generate_simple_video.py` 不用 ASS 也能正常出字幕（中文不空白/不方块）
