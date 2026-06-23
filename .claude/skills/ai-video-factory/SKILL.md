---
name: ai-video-factory
description: |
  全自动视频生产线 — **唯一视频制作入口**。三轨制：极速轨（黑底+TTS→几分钟出品）、品质轨（HyperFrames HTML动效→高质量成品）、解说轨（scenefab→影视解说）。
  当你需要"做视频"时使用。不要再直接调用 hyperframes/faceless-explainer/general-video/storyboard-prompter — 那些是本 skill 的内部引擎。
---

# AI 视频工厂 v3.1 — 三轨路由

> **核心原则：ai-video-factory 是"做视频"的唯一入口。分析用户意图后分流到三个轨道之一。**
> 内部引擎（hyperframes/faceless-explainer/general-video/storyboard-prompter）不再直接暴露给用户。

## 🗺️ 三轨路由（最先看！）

```
用户说"做视频"
  ↓
ai-video-factory（唯一入口，分析意图）
  │
  ├─ 意图：快速/内部/极简/试稿
  │  └─ 🚀 极速轨：tts-video（黑底+edge-tts配音）
  │     耗时：2-5分钟 | 依赖：ffmpeg + edge-tts
  │     触发词："做视频""生成视频""快速出片"
  │
  ├─ 意图：精美/品牌/对外/有设计感
  │  └─ 🎨 品质轨：faceless-explainer → HyperFrames 渲染
  │     耗时：10-30分钟 | 依赖：Node 22+ + Chrome headless + ffmpeg
  │     触发词："品质视频""精美视频""品牌视频""动效视频""有设计感""好看一点"
  │     设计预设（5套）：block-frame/capsule/claude/pin-and-paper/scatterbrain
  │     中文配音降级：无 HeyGen Key → fallback edge-tts
  │
  ├─ 意图：影视解说（已有视频素材）
  │  └─ 🎬 解说轨：scenefab → Qwen3.7分镜 + DeepSeek解说 + EdgeTTS配音
  │     耗时：5-15分钟 | 依赖：QWEN_API_KEY + DEEPSEEK_API_KEY
  │     触发词："影视解说""短剧解说""给这个视频做解说""AI解说"
  │     ⚠️ 需先配置 API Key 才能使用！
  │
  └─ 辅助：AI 生成画面（storyboard-prompter → 仅做风格/色彩建议）
       不直接渲染 — 画面品质轨仍走 HyperFrames
```

## 三轨对比速查

| | 🚀 极速轨 (默认) | 🎨 品质轨 (HyperFrames) | 🎬 解说轨 (SceneFab) |
|---|---|---|---|
| **触发词** | "做视频""生成视频" | "品质视频""精美视频"等 | "影视解说""短剧解说" |
| **耗时** | 2-5 分钟 | 10-30 分钟 | 5-15 分钟 |
| **画面** | 纯黑背景 + 白字字幕 | HTML 动效编排 | 原视频 + AI 解说叠加 |
| **引擎** | edge-tts → FFmpeg 合成 | faceless-explainer → HyperFrames | Qwen3.7 + DeepSeek + EdgeTTS |
| **依赖** | Python + FFmpeg | Node.js 22+ + FFmpeg + npx hyperframes | QWEN_API_KEY + DEEPSEEK_API_KEY |
| **适合** | 快速试稿、内部沟通 | 对外发布、品牌视频 | 影视解说、短剧解说 |
| **状态** | 🟢 可用（SRT合成偶发bug） | 🟢 可用（中文TTS缺HeyGen Key） | 🟡 待配置 API Key |

## 🔥 核心原则

```
   📝 文字内容是主角    — 逻辑、观点、说服力
   🎤 声音是放大器     — edge-tts (zh-CN-YunyangNeural)
   🎬 画面看场景选择   — 极速(黑底) vs 品质(HyperFrames动效) vs 解说(原视频+配音)
   ⚡ 不迭代不重试    — 一次生成，用户决策是否重来
```

## 🚀 极速轨（保留 v2.x 全部功能）

### 引擎

> TTS 引擎详情见 `tts-video` skill。以下仅列优先级：

| 优先级 | 引擎 | 速度 | CPU | 适用 |
|--------|------|------|-----|------|
| 1 | **edge-tts** | ~3s/segment | <5% | 有网首选 |
| 2 | CosyVoice2 | ~107s/segment | 100% | 本地高音质 |
| 3 | Qwen3-TTS | ~47s/segment | 100% | 本地多音色 |

### Agent SOP

```
1. 确认文案内容
2. 直接跑: python generate_simple_video.py <文案.txt>
3. 不问任何问题（不选声音/背景/字幕/分辨率）
4. 只生成一次 — 即使结果不满意也立即停止，由用户决定是否重来
5. 绝不自动重试、不自动迭代、不换参数再跑
```

### 生成命令

```bash
# 从 UTF-8 文件（最安全）
python ~/.claude/tools/tts-video/generate_simple_video.py 文案.txt

# 探针（需要时）
python ~/.claude/tools/tts-video/probe_tts_engines.py "文案"
```

### 输出

- MP4 H.264, 1920x1080, 24fps
- AAC 128kbps
- 白字黑底中文字幕
- 默认声音: zh-CN-YunyangNeural (edge-tts)

---

## 🎨 品质轨（HyperFrames v0.6 — 新增）

### 工作流概览

品质轨委托 **faceless-explainer** 技能作为核心引擎，完整工作流见其 SKILL.md 的 Phase 表（init → scaffold → scriptwriting → design-system → audio → visual-design → prep → captions → scenes → finalize → renders/video.mp4）。

以下仅记录 ai-video-factory 特有的规则和降级策略。

### 触发条件

用户输入包含以下关键词之一时，走品质轨：
- "品质视频" / "精美视频" / "动效视频" / "品牌视频"
- "hyperframes" / "faceless explainer"
- "数据视频" / "图表视频" / "动画视频"
- 明确要求"有设计感" / "好看一点"

### Brief 确认（必须！不跳过）

```
生成前确认（给出推荐默认值，等用户回复或说"go"）：

| 字段 | 推荐 | 说明 |
|------|------|------|
| 角度/主题 | [从文案提取] | 一个核心想法 |
| 时长 | 60-90秒 | 最多3分钟 |
| 画幅 | 16:9 | 9:16竖屏可选 |
| 语言 | zh-CN | 中文配音 |
| 设计预设 | auto | 脚本 agent 根据内容自动选 |

用户说"go" = 接受全部默认，立即开始。
```

### Agent SOP

```
1. 读文案 → 确认 brief → 等待用户回复（见上方Brief确认）
2. 委托 faceless-explainer 技能执行完整工作流
3. ai-video-factory 特有规则：
   - 过程中任一 agent 返回错误 → 报告，不自动重试
   - HyperFrames 渲染失败 → 降级询问用户是否切换到极速轨（见降级策略）
4. 中文 TTS：优先 HeyGen TTS API Key；无 key 则降级到极速轨 edge-tts
```

### 设计预设（5套，脚本 agent 自动选）

| 预设 | 风格 | 最适合 |
|------|------|--------|
| `block-frame` | 粗体几何、高对比 | 品牌宣言、大胆声明 |
| `capsule` | 圆润药丸形、柔和渐变 | 产品介绍、友好教程 |
| `claude` | 温暖编辑风、代码窗口 | 技术讲解、PR 解说 |
| `pin-and-paper` | 手写笔记、便签纸 | 创意解说、思维过程 |
| `scatterbrain` | 软木板上钉便签 | 头脑风暴、灵感收集 |

### HyperFrames 脚手架

```bash
# 创建视频项目（加 --tailwind 可选启用 Tailwind v4）
npx hyperframes init videos/<project-name> --non-interactive --skip-skills --example=blank
```

### TTS 配音（品质轨用 HyperFrames audio.mjs）

```bash
# faceless-explainer 的音频脚本
(cd videos/<project-name> && node <SKILL_DIR>/scripts/audio.mjs \
  --narrator-scripts ./narrator_scripts.json \
  --hyperframes . \
  --out ./audio_meta.json)
```

支持三种后端：HeyGen TTS（云端，需 API Key）、ElevenLabs（云端）、Kokoro（本地免费，默认英文）。**中文配音需要 HeyGen TTS API Key，否则降级到极速轨的 edge-tts。**

> 🔑 **HeyGen API Key 申请**（⏳ 明天执行）：
> 1. 注册 https://app.heygen.com → Settings → API → 生成 API Token
> 2. 费用：$5 起充，按量付费，无月费。**2026年2月起无免费额度**。
> 3. 获得 Key 后设置环境变量：`export HEYGEN_API_KEY="sk-..."` 或写入 `~/.heygen/credentials`
> 4. 验证：`npx hyperframes doctor` 确认 TTS 可用

### 降级策略

| 条件 | 自动处理 | 询问用户 |
|------|---------|---------|
| TTS 无中文音色 | 调用极速轨 edge-tts 生成 mp3 + ASS 字幕 | — |
| Subagent 返回错误 | 报告具体错误 | 跳过继续？切极速轨？手动修复？ |
| HyperFrames 渲染失败 | — | 切到极速轨？ |
| `hyperframes doctor` 失败 | 提示 `npm install -g hyperframes` | 先用极速轨？ |

### 关联 Skill（新路由层级）

```
ai-video-factory (唯一用户入口)
  │
  ├─ 🚀 极速轨引擎
  │   └─ tts-video (三引擎 TTS 配音)
  │
  ├─ 🎨 品质轨引擎
  │   ├─ faceless-explainer (HyperFrames 工作流引擎)
  │   ├─ hyperframes-cli (脚手架、lint、inspect、render)
  │   ├─ hyperframes-creative (调色板、排版、视觉风格)
  │   ├─ hyperframes-media (TTS、BGM、转录)
  │   ├─ hyperframes-registry (组件库 blocks/components)
  │   └─ storyboard-prompter (→ 降级为可选辅助：仅提供风格/色彩建议)
  │
  └─ 🎬 解说轨引擎
      └─ scenefab (Qwen3.7 + DeepSeek + EdgeTTS, 独立管线)
```

> **storyboard-prompter 角色变更 (v3.1)**：从"主渲染引擎之一"降级为"HyperFrames 的可选辅助输入"。
> 原因：Agnes Video 首次成功率仅 ~60%，7/11 种风格缺数据，不依赖它有更好的降级路径。
> 现在只做颜色/风格建议，实际画面渲染完全走 HyperFrames。

---

## 依赖

| 工具 | 安装方式 | 验证 |
|------|---------|------|
| ffmpeg | 系统安装 | `which ffmpeg` |
| edge-tts | `pip install edge-tts` | `python -c "import edge_tts"` |
| Node.js >= 22 | 系统安装 | `node --version` |
| hyperframes | `npm install -g hyperframes` | `npx hyperframes doctor` |

> `npx hyperframes doctor` 一键诊断品质轨全部依赖（含 Chrome、FFmpeg）。极速轨仅需 ffmpeg + edge-tts。
