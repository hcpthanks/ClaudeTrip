# Skill 安装清单

> **最后更新**: 2026-06-29
> **用途**: 追踪所有已安装 skill 的来源、版本、依赖关系。AgentShield 治理第1层。
> **本次更新**: 删除 storyboard-prompter + tts-video skill，精简工具目录

## 🟢🟡🔴 组件状态一览（2026-06-29）

| 组件 | 状态 | 关键发现 |
|------|:---:|---------|
| HyperFrames (17 skills) | 🟢 | v0.6.121, Chrome headless 已装, ffmpeg 就绪 |
| 百炼 TTS (generate.py) | 🟢 | 极速轨核心执行器, `E:\WorkBuddy\CLAW\.claude\tools\tts-video\generate.py`, 9项质量门禁 |
| Agnes AI (MCP) | 🟢 | 三个模型全免费, Video 首次成功率 ~60%, Image ~95% |
| framepack (4 skills) | 🟢 | npm 已安装, 创意工具链就绪 |
| autoresearch | 🟢 | v2.1.3, 12个子命令, 触发场景已文档化 |
| scenefab | 🟢 | API Keys 已配置（百炼 + DeepSeek） |
| Qwen3-TTS | 🟡 | v0.1.1 已装 (E:\tmp), 未验证可用性 |
| Shotcut | 🟡 | v26.4.30, 已移到 E:\WorkBuddy\tools\Shotcut\ |
| SoX | 🟡 | v14.4.2, 已移到 E:\WorkBuddy\tools\sox\ |
| CLI-Anything | 🟡 | v0.3.0, 已移到 E:\WorkBuddy\tools\CLI-Anything\ |
| remotion | 🟡 | HyperFrames 已替代, 保留备用 |
| ECC skills (~140) | 🟢 | 安装于 .claude/skills/ecc/, 大部分与视频无关 |
| CosyVoice2 | 🔴 | Python 模块未安装 |
| HyperFrames 远程更新 | 🔴 | GitHub 连不上 (代理问题) |
| ~~storyboard-prompter~~ | ⚫ 已删除 | 数据迁移至 ai-video-factory/references/visual-styles.md (2026-06-29) |

## 🗺️ 视频路由层级（v3.5）

```
ai-video-factory (唯一用户入口)
  ├── 🚀 极速轨: 百炼 TTS → FFmpeg 渐变背景+标题+字幕 → 9项质检
  ├── 🎨 品质轨: faceless-explainer → HyperFrames → HTML动效渲染
  │     └── 底图素材工厂 → Agnes Image → references/visual-styles.md (风格数据库)
  └── 🎬 解说轨: scenefab → Qwen3.7 + DeepSeek + 百炼TTS
       🟢 API Keys 已配置
```

## HyperFrames 技能套件 (heygen-com/hyperframes.git)

| # | Skill | 安装日期 | 版本线索 | 依赖项 |
|---|-------|---------|---------|--------|
| 1 | `hyperframes` | 2026-06-22 | CLI v0.6.121 | 入口 skill，路由到其他 |
| 2 | `hyperframes-core` | 2026-06-22 | v0.6.x | HTML 组合契约 |
| 3 | `hyperframes-animation` | 2026-06-22 | v0.6.x | core |
| 4 | `hyperframes-cli` | 2026-06-22 | v0.6.x | core |
| 5 | `hyperframes-creative` | 2026-06-22 | v0.6.x | core, animation |
| 6 | `hyperframes-media` | 2026-06-22 | v0.6.x | core |
| 7 | `hyperframes-registry` | 2026-06-22 | v0.6.x | core |
| 8 | `faceless-explainer` | 2026-06-22 | v0.6.x | core, animation, scripts/ |
| 9 | `pr-to-video` | 2026-06-22 | v0.6.x | core, faceless (共享 scripts) |
| 10 | `product-launch-video` | 2026-06-22 | v0.6.x | core, faceless (共享 scripts) |
| 11 | `website-to-video` | 2026-06-22 | v0.6.x | core |
| 12 | `general-video` | 2026-06-22 | v0.6.x | core |
| 13 | `slideshow` | 2026-06-22 | v0.6.x | core |
| 14 | `remotion-to-hyperframes` | 2026-06-22 | v0.6.x | core |
| 15 | `embedded-captions` | 2026-06-22 | v0.6.x | media |
| 16 | `graphic-overlays` | 2026-06-22 | v0.6.x | core, media |
| 17 | `motion-graphics` | 2026-06-22 | v0.6.x | core, animation |

> **注意**: `faceless-explainer` 拥有共享的 `scripts/`（audio.mjs, prep.mjs, captions.mjs 等）。`pr-to-video` 和 `product-launch-video` 依赖这些脚本但各自拥有独立的 `SKILL.md` 和 `agents/`。

## Framepack 创意工具 (npm: framepack)

| # | Skill | 安装日期 | 安装方式 | 用途 |
|---|-------|---------|---------|------|
| 1 | `framepack-director` | 2026-06-22 | `npm i -g framepack` | 创意方向翻译 |
| 2 | `framepack-hyperframes-builder` | 2026-06-22 | `npm i -g framepack` | HTML 构建 |
| 3 | `framepack-reference-miner` | 2026-06-22 | `npm i -g framepack` | 参考视频挖掘 |
| 4 | `framepack-template-fuser` | 2026-06-22 | `npm i -g framepack` | 模板融合 |

## 自定义 Skill（我们自己的）

| # | Skill | 版本 | 依赖 |
|---|-------|:---:|------|
| 1 | `ai-video-factory` | v3.5 | faceless-explainer, scenefab, Agnes MCP, 百炼TTs |
| 2 | `scenefab` | v1.0 | Qwen3.7(Vision), DeepSeek, 百炼TTS |
| 3 | `ai-excel` | - | 豆包/大模型 |
| 4 | `autoresearch` | v2.1.3 | - |
| 5 | `brainstorming` | - | - |
| 6 | `dispatching-parallel-agents` | - | - |
| 7 | `douyin-downloader` | - | - |
| 8 | `executing-plans` | - | - |
| 9 | `finishing-a-development-branch` | - | - |
| 10 | `planning-with-files` | - | - |
| 11 | `planning-with-files-zh` | - | - |
| 12 | `receiving-code-review` | - | - |
| 13 | `remotion` | - | - |
| 14 | `requesting-code-review` | - | - |
| 15 | `subagent-driven-development` | - | - |
| 16 | `systematic-debugging` | - | - |
| 17 | `test-driven-development` | - | - |
| 18 | `using-git-worktrees` | - | - |
| 19 | `using-superpowers` | - | - |
| 20 | `verification-before-completion` | - | - |
| 21 | `writing-plans` | - | - |
| 22 | `writing-skills` | - | - |
| 23 | `cli-hub-meta-skill` | - | - |
| 24 | `web-access` | - | - |

## 存储架构

```
.agents/skills/        ← 外部安装（HyperFrames 17 + web-access = 18个）
.claude/skills/         ← 自定义 skill + symlink 到 .agents/skills
.claude/commands/       ← ECC 内置命令（~140个）
E:\WorkBuddy\tools\     ← 外部工具 (Shotcut/SoX/CLI-Anything) [2026-06-23 整理]
E:\WorkBuddy\learning-cards\  ← 学习卡存档 [铁律]
```

## 关键依赖图（v3.5）

```
ai-video-factory v3.5 (唯一入口)
  ├── 🚀 极速轨: 百炼 DashScope TTS → FFmpeg 渐变背景+标题+字幕 → 9项质检
  │     依赖: Python+ffmpeg+dashscope
  │
  ├── 🎨 品质轨: faceless-explainer
  │     ├── hyperframes-cli → npx hyperframes
  │     ├── hyperframes-core → HTML 组合契约
  │     ├── hyperframes-animation → GSAP/CSS/Lottie/Three.js
  │     ├── hyperframes-creative → 调色板/排版
  │     ├── hyperframes-media → TTS/BGM/转录
  │     ├── hyperframes-registry → blocks/components
  │     └── 底图素材工厂: Agnes Image (ai-video-factory/references/visual-styles.md)
  │
  └── 🎬 解说轨: scenefab → Qwen3.7(Vision) + DeepSeek + 百炼TTS
        🟢 API Keys 已配置
```
