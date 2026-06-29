---
name: ai-video-factory
description: |
  全自动视频生产线 — **唯一视频制作入口**。三轨制：极速轨（百炼TTS+渐变背景→1-3分钟出品）、品质轨（Agnes Image底图 + HyperFrames文字动效叠加→高质量成品）、解说轨（scenefab→影视解说）。
  当你需要"做视频"时使用。不要再直接调用 hyperframes/faceless-explainer/general-video — 那些是本 skill 的内部引擎。
---

# AI 视频工厂 v3.5 — 三轨路由

> **核心原则：ai-video-factory 是"做视频"的唯一入口。分析用户意图后分流到三个轨道之一。**
> 内部引擎（hyperframes/faceless-explainer/general-video）不再直接暴露给用户。
> **v3.5 (2026-06-29)：借鉴 OpenMontage final_review.schema.json + delivery_promise.py — 质量门禁升级至9项（+视觉抽检+幻灯片风险+类型承诺）。新增视频类型承诺：防止品质轨偷偷降级。**

## 🗺️ 三轨路由（最先看！）

```
用户说"做视频"
  ↓
ai-video-factory（唯一入口，分析意图）
  │
  ├─ 意图：快速/内部/极简/试稿
  │  └─ 🚀 极速轨：百炼 DashScope TTS → FFmpeg 画面合成
  │     耗时：1-3分钟 | 依赖：Python + ffmpeg + dashscope
  │     触发词："做视频""生成视频""快速出片"
  │     画面：深蓝渐变背景 + 大标题 + 字幕 + 可选尾屏
  │
  ├─ 意图：精美/品牌/对外/有设计感
  │  └─ 🎨 品质轨：Agnes Image底图 → HyperFrames文字动效叠加
  │     耗时：10-30分钟 | 依赖：Node 22+ + Chrome headless + ffmpeg + Agnes MCP
  │     触发词："品质视频""精美视频""品牌视频""动效视频""有设计感""好看一点"
  │     管线：底图素材工厂 → HyperFrames(文字层叠加) → FFmpeg(合成)
  │     中文配音：百炼 DashScope qwen3-tts-flash（DASHSCOPE_API_KEY 已配置 ✅）
  │
  ├─ 意图：影视解说（已有视频素材）
  │  └─ 🎬 解说轨：scenefab → Qwen3.7分镜 + DeepSeek解说 + EdgeTTS配音
  │     耗时：5-15分钟 | 依赖：QWEN_API_KEY + DEEPSEEK_API_KEY
  │     触发词："影视解说""短剧解说""给这个视频做解说""AI解说"
  │     状态：🟢 API Keys 已配置（百炼 + DeepSeek）
  │
  └─ 辅助：AI 画面生成（底图素材工厂）
       Agnes Image 生成高质量底图 → HyperFrames 叠加文字/数据/图表动效

📋 三轨降级标准速查（v3.5 新增）

🚀 极速轨 — promise: teacher_explainer
  ├─ 百炼 TTS 失败 → 换音色重试1次 → 仍失败 → 告知用户"配音生成失败"
  ├─ FFmpeg 合成失败 → 保留文案+SRT → 告知用户 → 等决策
  └─ 质量门禁 CRITICAL 项失败 → exit 2

🎨 品质轨 — promise: motion_led
  ├─ Layer 1 底图全部失败 → 告知 → 等确认 → 降为 teacher_explainer
  ├─ Layer 2 动效失败 → 告知 → 等确认 → 降为字幕版
  ├─ Layer 3 合成失败 → 保留中间产物 → 等确认
  └─ 底线：绝不偷偷降级

🎬 解说轨 — promise: source_led
  ├─ Qwen3.7 分镜失败 → 告知"视频分析失败" → 等确认
  ├─ DeepSeek 解说词失败 → 告知"文案生成失败" → 等确认
  ├─ EdgeTTS 配音失败 → 降为百炼 TTS（统一引擎）
  └─ 合成失败 → 保留中间产物 → 等确认
```

## 三轨对比速查

| | 🚀 极速轨 (默认) | 🎨 品质轨 (Image+HyperFrames) | 🎬 解说轨 (SceneFab) |
|---|---|---|---|
| **触发词** | "做视频""生成视频" | "品质视频""精美视频"等 | "影视解说""短剧解说" |
| **耗时** | 2-5 分钟 | 10-30 分钟 | 5-15 分钟 |
| **画面** | 深蓝渐变背景 + 标题 + 字幕 | Agnes Image AI底图 + HyperFrames动效叠加 | 原视频 + AI 解说叠加 |
| **引擎** | 百炼 DashScope(TTS) → generate.py(FFmpeg合成) | 底图素材工厂 → HyperFrames(文字层) → FFmpeg合成 | Qwen3.7 + DeepSeek + EdgeTTS |
| **依赖** | Python + FFmpeg + dashscope | Node.js 22+ + FFmpeg + npx hyperframes + Agnes MCP | QWEN_API_KEY + DEEPSEEK_API_KEY |
| **适合** | 快速试稿、内部沟通 | 对外发布、品牌视频 | 影视解说、短剧解说 |
| **状态** | 🟢 可用 | 🟢 可用（v3.5降级规则统一） | 🟢 API Keys 已配置 |

## 🔥 核心原则

```
   📝 文字内容是主角    — 逻辑、观点、说服力
   🎤 声音是放大器     — 百炼 DashScope qwen3-tts-flash 中文配音 (国内充值方便)
   🎬 画面分层协作     — Agnes Image(底图背景层) + HyperFrames(文字动效层) + FFmpeg(合成层)
   🎨 极速轨画面升级    — 深蓝渐变背景 + 大标题 + 字幕 (v3.3)
   🔍 质量门禁          — ffprobe 9项自动质检 + 视觉抽检 + 幻灯片风险 + 类型承诺 (v3.5)
   🧠 研究驱动          — 写文案前先搜索 3-5 个来源 (v3.4)
   🔒 以人为主          — 降级决策必须等用户确认，机器不做最终决定 (v3.5)
   🖼️ 静态胜过拙劣运动  — AI底图 + 淡入淡出 > 无意义的相机晃动（v3教训，永不再犯）
   ⚡ 一次生成一个决策  — 不自动重试；降级是人的决策，不是机器的
```

## 🚀 极速轨 v3.5

> **核心变更：百炼 qwen3-tts-flash 中文配音 + FFmpeg 画面合成 + 9项自动质量门禁（借鉴 OpenMontage final_review.schema.json）**

### 管线

```
文案 .txt
  │
  ├─ TTS 引擎（自动选择）：
  │   1. --audio 指定音频文件 → 直接用
  │   2. 百炼 DashScope qwen3-tts-flash → 中文配音（默认）
  │
  ├─ FFmpeg 画面合成：渐变背景 + 大标题 + 字幕 + 可选尾屏
  │
  └─ 🔍 质量门禁：9项自动质检 → PASS/FAIL 报告（v3.5 升级）
```

### 🔍 质量门禁 (v3.5 升级 — 借鉴 OpenMontage)

| # | 检查项 | 严重度 | 来源 | 说明 |
|---|--------|:---:|------|------|
| 1 | 文件大小 ≥ 10KB | CRITICAL | v3.4 | 空文件/损坏文件拦截 |
| 2 | 视频流 | CRITICAL | v3.4 | 确保有可播放的视频轨道 |
| 3 | 音频流 | CRITICAL | v3.4 | 确保配音已合成 |
| 4 | 时长 ≥ 1秒 | CRITICAL | v3.4 | 时长异常检测 |
| 5 | 分辨率 1920×1080 | WARN | v3.4 | 非1080p仅警告 |
| 6 | 帧率 20-30fps | WARN | v3.4 | 帧率异常仅警告 |
| 7 | 视觉抽检 — 4帧均有内容 | CRITICAL | **v3.5** | 4个时间点帧采样，防黑屏/花屏 |
| 8 | 幻灯片风险 — 非高 | WARN | **v3.5** | 4帧hash去重，防纯静态幻灯片 |
| 9 | 类型承诺 — 交付物匹配承诺 | CRITICAL | **v3.5** | 视频不偷偷降级 |

CRITICAL 项任一 FAIL → 脚本返回 exit code 2。

### 生成命令

```bash
# 最简单：百炼自动配音 + 渐变背景 + 字幕
python ~/.claude/tools/tts-video/generate.py 文案.txt

# 带大标题
python ~/.claude/tools/tts-video/generate.py 文案.txt --title "标题"

# 换音色
python ~/.claude/tools/tts-video/generate.py 文案.txt --voice longxiaochun

# 用已有音频（HyperFrames 生成）
python ~/.claude/tools/tts-video/generate.py 文案.txt --audio audio.mp3 --title "标题"

# 完整参数
python ~/.claude/tools/tts-video/generate.py 文案.txt \
  --title "标题" --voice Cherry --end-screen --bg-color 0x1A1A2E
```

### Agent SOP（极速轨）

```
📍 核心原则：AI Agent 是"总导演"，不是"流水线工人"。

0. 🧠 研究驱动（v3.4 新增 — 借鉴 OpenMontage Web Research）
   - 在正式写文案前，先用 agent-reach / WebSearch 搜索 3-5 个相关来源
   - 从搜索结果中提取关键数据、观点、案例
   - 文案必须基于真实数据，不是凭空编造

1. ✍️ 写文案
   - 基于研究结果写 4-6 句精简文案
   - 每句讲一个要点，信息密度高
   - 参考风格：抖音知识类短视频节奏

2. 🎬 出片
   python ~/.claude/tools/tts-video/generate.py 文案.txt
   - 百炼 TTS 自动配音 → 渐变背景 → 标题 → 字幕 → 自动质检
   - 不选声音/背景/字幕参数，用默认值

3. 🔍 看质检报告
   - 9 项全 PASS → 完成
   - 有 FAIL → 报告哪个环节失败，不自动重试
   - 用户决定：重跑 / 改文案 / 放弃
```

### 🎯 参考驱动（v3.4 新增 — 借鉴 OpenMontage Reference-Driven）

当用户提供参考视频链接时：
```
1. agent-reach 下载 + 分析参考视频
2. 提取：节奏模式、画面风格、文案结构、色彩方案
3. 生成"风格适配器"（不是复制，是差异化改编）
4. 将风格参数注入文案写作和 FFmpeg 参数
```

触发词：用户说"像这个一样" / "参考这个风格" / 提供抖音/YouTube/B站链接

### 🔒 视频类型承诺 (v3.5 — 借鉴 OM delivery_promise.py)

> 核心原则：**对用户做出的承诺必须在交付前验证。做不到就降级并告知，绝不允许偷偷换方案。**

#### PromiseType 分类

| 类型 | 音频 | 视频 | 最低动效 | 对应轨道 |
|------|:---:|:---:|:---:|------|
| `teacher_explainer` | ✅ | ❌ | 0% | 极速轨 |
| `data_explainer` | ✅ | ❌ | 0% | 极速轨 |
| `motion_led` | ✅ | ✅ | 30% | 品质轨 |
| `source_led` | ✅ | ✅ | 10% | 品质轨(混合) |

#### 品质轨失败判断标准（每个失败条件独立判定）

品质轨 = **Storyboard-Prompter(底图) + HyperFrames(文字动效) + FFmpeg(合成)**，三层中任一层失败就是品质轨失败。

**Layer 1: 底图失败 (Agnes Image)**

| 判定条件 | 阈值 | 说明 |
|---------|:---:|------|
| 全部 prompt 生成失败 | N 段全部返回 error/超时 | `continual_failures == total_scenes` |
| 首段失败 | 第一段就失败 | 风格锚定失败 = 整条视频风格不可靠 |
| 连续失败 | 连续 ≥2 段失败 | 同 prompt 已重试1次仍失败 |

> ✅ 底图全部成功：每段至少1张 `1792×1024` PNG 写入 `video_scenes/<scene_id>/frame_01.png`

**Layer 2: 文字动效失败 (HyperFrames)**

| 判定条件 | 阈值 | 说明 |
|---------|:---:|------|
| `hyperframes doctor` 失败 | 组件缺失 | 全局环境不可用 |
| `lint` 失败 | 任意 composition 有 error | HTML 语法错误 |
| `validate` 失败 | 任意 composition 校验不通过 | 结构/属性错误 |
| `inspect` 失败 | 渲染溢出 >10% | 布局越界 |
| `render` 失败 | 无法写出 MP4 | 渲染引擎崩溃 |
| 任何 scene worker 返回空文件 | 文件大小为 0 或不存在 | 并行 worker 故障 |

**Layer 3: 合成失败 (FFmpeg)**

| 判定条件 | 阈值 | 说明 |
|---------|:---:|------|
| FFmpeg 返回非零 | exit code != 0 | 合成命令失败 |
| 合成产物 <20KB | 文件过小 | 只渲染了头部或空帧 |
| 无音频轨道 | ffprobe 检测不到音频 | 配音未合成进去 |

#### 降级规则（强制 — 含底层桥接说明）

> **桥接实现**：品质轨降级为极速轨时，调用 `generate.py` 重新合成。
> 输入：原文案 .txt + 已生成的音频文件（百炼配音保留）→ 输出纯色渐变+字幕版 MP4。
> 配音不重新生成。

```
┌─ Layer 1 底图失败
│  └─ 全部失败 → 降为 teacher_explainer (纯色渐变背景)
│     告知："AI底图全部生成失败，是否降为基础画面？"
│     实现：generate.py 文案.txt --audio tts_audio.wav
│     保留：百炼配音 → 直接喂给 FFmpeg 合成，画面降级
│
│  └─ 部分失败 → 失败段用纯色背景，成功段保留底图
│     告知："X/N 段底图生成失败，已用纯色替代"
│
├─ Layer 2 动效失败
│  └─ → 降为极速轨 (FFmpeg drawtext 字幕)
│     告知："HyperFrames渲染失败，是否降为字幕版？"
│     实现：generate.py 文案.txt --audio tts_audio.wav|audio_meta.json
│     保留：百炼配音，丢弃 HyperFrames HTML/GSAP 动效层
│
├─ Layer 3 合成失败  
│  └─ → 保留中间产物，报错退出
│     告知："FFmpeg合成失败，请检查音频文件和 FFmpeg 环境"
│     保留：底图 PNG + 配音 wav + SRT 字幕 + HyperFrames HTML
│
└─ 全部失败 (3层全挂)
   └─ → 报告用户，保留所有中间文件，不自动重试
```

#### 底线红线

```
❌ 绝不允许：底图全部失败 → 纯色背景 + 假装是品质轨
❌ 绝不允许：HyperFrames 失败 → 只给音频 + 假装是视频
❌ 绝不允许：任何失败被静默吞掉，用户不知道质量下降了
```

### 输出

- MP4 H.264, 1920×1080, 24fps
- AAC 128kbps
- 深蓝渐变背景（#0A0A1A → 微亮）、白色中文字幕
- 可选：标题（drawtext 大字号顶部居中）、尾屏（3秒引导关注）

---

## 🎨 品质轨（Agnes Image 底图 + HyperFrames 文字叠加）

### 管线架构

```
文案 + 风格选择
  ↓
┌─────────────────── 并行阶段 ───────────────────┐
│                                                    │
│  底图素材工厂                              tts-video │
│  ├─ Step 0-3: 风格/情绪/视觉模板/底图数量           │
│  ├─ Step 4a: Agnes Image 并行生成底图              │
│  │   └─ N段 × M张/段 → video_scenes/<id>/frame_*.png│
│  └─ Step 5: 输出 global_meta.json               │
│                                                    │
│  百炼 DashScope 配音 → tts_audio.wav + SRT字幕          │
│                                                    │
└─────────────────── 汇合 ───────────────────────────┘
  ↓
HyperFrames
  ├─ 读取 global_meta.json → CSS 变量
  ├─ 底图做 <img> 背景层 (video_scenes/**/*.png)
  ├─ 文字/图表/数据层 HTML 动效叠加
  └─ 场景转场（xfade，对齐底图切换节奏）
  ↓
FFmpeg 合成：HyperFrames 渲染流 + 配音 + 字幕 → MP4
```

### 三层画面模型

```
┌─────────────────────────────────┐
│  Layer 3: 文字/数据动效层        │  ← HyperFrames (HTML GSAP)
│  标题 · 正文 · 数据面板 · 图表   │
├─────────────────────────────────┤
│  Layer 2: 转场/滤镜层           │  ← HyperFrames (CSS transitions)
│  淡入淡出 · 色彩渐变 · 遮罩      │
├─────────────────────────────────┤
│  Layer 1: AI 底图背景层         │  ← Agnes Image (底图素材工厂)
│  风格化场景 · 情绪画面 · 氛围    │
└─────────────────────────────────┘
```

### 🔒 v3.2 分层设计标准（质量门禁 — 不可跳过）

> 这是 v3.2 的核心标准。v3.1 纯文字排版简单但清晰有功底；v3.2 增加底图层后若不加约束就会乱。
> **以下每条都是必须遵守的硬标准，不是建议。**

#### 标准 1：底图必须生成 16:9 尺寸（不是 1024×1024）

1024×1024 正方形图用 `object-fit: cover` 裁切到 1920×1080 → 构图全毁。

```
❌ agnes_image size=1024x1024 → cover裁切后构图不可控
✅ agnes_image size=1792x1024 → 16:9 比例，无裁切
```

Agnes Image 可用尺寸：`1792x1024`（横屏16:9）、`1024x1792`（竖屏9:16）。

#### 标准 2：底图必须生成"背景版"而非"焦点版"

AI 生成图片的默认倾向是画面中心放最精彩的东西。但视频的文字层也在中心。

```
❌ "宏大的赛博城市，全息塔楼漂浮" → 画面中心是塔楼，文字压上去全乱
✅ "深空背景中的微弱星云纹理，大面积留暗，最亮区域偏右30%"
```

**底图 prompt 必须包含：**
- 禁止中心放视觉焦点物体
- 指定亮区偏移方向（偏左/偏右/偏上/偏下）
- 要求大面积暗调或柔和渐变区域（给文字当"垫板"）
- 加 `"negative space in center, no focal object in middle third of frame"`

#### 标准 3：内容类型 → 底图策略映射

不是所有视频都需要 AI 底图。按内容类型选择底图强度：

| 内容类型 | 底图强度 | 底图含义 | 示例 |
|---------|:---:|------|------|
| 🔢 **技术/代码/数据** | 0-10% | 极致克制。纯色背景 + 细微纹理或暗角光晕。文字是唯一主角。 | 15%不透明度的暗色渐变 + 角落微光 |
| 📖 **教程/知识** | 10-30% | 氛围辅助。抽象纹理、柔和渐变、极简几何。不能有具象物体。 | 柔焦纸张纹理、代码编辑器暗色背景 |
| 🎯 **品牌/产品** | 30-50% | 品牌氛围。产品相关但高度抽象化的底图，色块+品牌色为主。 | 产品色的渐变流体、抽象几何 |
| 🎬 **故事/情感** | 50-70% | 情绪画面。具象场景但文字区必须有暗色垫板。 | 黄昏城市天际线 + 底部暗色渐变垫板 |
| 🎨 **纯视觉/纯氛围** | 70-100% | 底图等于视频。少量文字压在精心设计的负空间上。 | 电影式片头、品牌大片 |

**判定规则（强制）：**
```
技术/代码类内容 → 默认走 0-10%，不使用 AI 底图，用纯色+微纹理
教程/知识类内容 → 默认走 10-30%，使用极简抽象纹理
品牌/故事类内容 → 才走 30%+，启用 Agnes Image 底图
```

#### 标准 4：文字安全区 + 对比度保证

底图和文字不能在同一位置同时高亮。**文字下方的底图区域必须有 ≥70% 的亮度抑制。**

具体做法（二选一，必须）：
```
方案A（推荐）：底图上叠加半透明暗色面板
  └─ position:absolute; background:rgba(0,0,0,0.55); 垫在文字下面

方案B（次选）：底图 prompt 指定留黑区域
  └─ "dark gradient area in center 60% of frame, fade to image edges only"
```

强制检查：任何文字区域的底图亮度不得高于 `#444`（即 luminance ≤ 27%）。

#### 标准 5：风格选择必须匹配内容类型

```
内容类型 → 推荐风格映射：

  技术/代码 → 不使用AI底图（标准3），纯色背景
  数据/图表 → 风格D（扁平矢量）或纯色背景
  教程/知识 → 风格D（扁平矢量）或风格A（日式动画，极简场景）
  文化/历史 → 风格B（国风二次元）或风格H（3D国风传统）
  品牌/产品 → 风格C（3D赛博）或风格K（真人都市影像）
  情感/故事 → 风格E（3D治愈）或风格J（都市言情）
  科技/AI   → 风格C（3D赛博）—— 但仅当内容不是技术教程时
              ⚠️ 讲"技术工具怎么用" ≠ 科技内容，是教程
```

#### 标准 6：三层画面各司其职（不可替代原则）

```
Layer 1 底图层：只提供氛围，不传递信息
  └─ 规则：如果观众需要看清底图才能理解内容 → 底图过强

Layer 2 遮罩层：确保文字可读性，不参与视觉竞争
  └─ 规则：文字下方的底图亮度必须被抑制到 ≤27%

Layer 3 文字层：100% 的信息载体，对比度 ≥4.5:1
  └─ 规则：文字颜色与底层叠加后，WCAG AA 对比度 ≥4.5:1
```

### 工作流概览

品质轨核心引擎是 **faceless-explainer**+ 底图素材工厂 的分层协作：

1. **底图素材工厂** 负责 Layer 1：选风格 → 生成 prompt → Agnes Image 出图 → 写入素材包
2. **faceless-explainer** 负责 Layer 2+3：读 global_meta.json → HyperFrames 编排 → 渲染

**必须先通过以上 6 条标准检查，再开始生成。** 完整工作流见 faceless-explainer SKILL.md 的 Phase 表。

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

### Agent SOP（v3.5 — 统一降级规则）

```
📍 核心原则：AI Agent 是"总导演"。品质轨承诺 motion_led 类型（见 v3.5 视频类型承诺）。

1. 读文案 → 确认 brief → 等待用户回复
2. 用户说"go" → 并行启动两条线：
   ├─ Agnes Image 底图生成（Layer 1）
   └─ 百炼 DashScope qwen3-tts-flash → TTS 中文配音

3. 两条线汇合后 → HyperFrames 文字动效叠加（Layer 2+3）
4. FFmpeg 合成最终 MP4

5. 🔍 质量门禁 — 9项自动质检 → PASS/FAIL 报告

6. 🔒 降级决策（每步检查 + 告知用户 + 等用户确认）：
   ┌─ Layer 1 底图全部失败
   │  → 告知："AI底图全部失败，是否降为基础画面继续？"
   │  → 用户确认后：降为 teacher_explainer 类型，纯色渐变背景
   │
   ├─ Layer 1 部分失败
   │  → 告知：X/N 段底图失败
   │  → 用户选择：①纯色替代失败段 ②重试失败段 ③取消
   │
   ├─ Layer 2 动效失败
   │  → 告知："HyperFrames 渲染失败，是否降为字幕版？"
   │  → 用户确认后：保留配音，用 FFmpeg drawtext 替代动效
   │
   └─ Layer 3 合成失败
      → 保留中间产物，告知错误原因
      → 用户选择：①重试合成 ②降为极速轨 ③取消
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

### TTS 配音（品质轨）

品质轨 TTS 统一用**百炼 DashScope qwen3-tts-flash**（`DASHSCOPE_API_KEY` 已配置 ✅）。与极速轨共用同一引擎，保证音质一致。

```bash
# 品质轨配音 — 在 generate.py 中自动调用百炼
# 如需独立生成音频，也可以用：
python ~/.claude/tools/tts-video/generate.py 文案.txt --output audio_only
```

> **备选方案**：HyperFrames audio.mjs 支持 Kokoro(本地免费英文)、ElevenLabs(云端付费)、HeyGen(云端付费)。中文品质轨如果需要特殊音色，再考虑 HeyGen。

### 降级策略（v3.5 — 统一规则）

> **降级必须获得用户同意**（见 Agent SOP 步骤6）。以下为技术判断标准，Agent 用它检测问题，但**不能代替人工决策**。

| 条件 | 自动检测 | 告知用户 | 用户选项 |
|------|:---:|------|------|
| Agnes Image 单段失败 | 同 prompt 重试 1 次 | 重试仍失败后告知 | ①纯色替代 ②再试一次 ③取消 |
| Agnes Image 连续 ≥2 段失败 | 自动停止后续生成 | 告知失败段数和原因 | ①降为基础画面 ②重试全部底图 ③取消 |
| Agnes Image 全部失败 | 自动停止后续生成 | 告知后**等确认** | ①降为基础画面 ②取消走极速轨 |
| HyperFrames lint/validate 失败 | 自动报错停止 | 告知具体错误文件 | ①修复后重试 ②跳过动效层 ③取消 |
| HyperFrames render 失败 | 自动报错停止 | 告知后**等确认** | ①降为字幕版 ②修复后重试 ③取消 |
| FFmpeg 合成失败 | 保留中间产物 | 告知错误日志 | ①重试合成 ②降为极速轨 ③取消 |
| 全部失败 (3层全挂) | 保留所有中间文件 | 不自动重试 | 用户决策：重来/换轨/放弃 |

> **v3.2→v3.5 核心变更**：降级从"自动处理"改为"检测→告知→等确认→执行"。
> 这符合钱学森 **"以人为主"** 的综合集成方法原则。机器做检测，人做决策。

### 关联 Skill（v3.2 分层路由）

```
ai-video-factory (唯一用户入口)
  │
  ├─ 🚀 极速轨引擎
  │   └─ tts-video (三引擎 TTS 配音)
  │
  ├─ 🎨 品质轨引擎（v3.2 分层模型）
  │   ├─ Layer 1: Agnes Image (底图素材工厂)
  │   │   └─ 11种视觉风格 × 5维度模板 × 多镜头/段
  │   ├─ Layer 2+3: faceless-explainer → HyperFrames (文字动效叠加)
  │   │   ├─ hyperframes-cli (脚手架、lint、inspect、render)
  │   │   ├─ hyperframes-creative (调色板、排版、视觉风格)
  │   │   ├─ hyperframes-media (TTS、BGM、转录)
  │   │   └─ hyperframes-registry (组件库 blocks/components)
  │   └─ Layer 合成: FFmpeg → MP4
  │
  └─ 🎬 解说轨引擎
      └─ scenefab (Qwen3.7 + DeepSeek + EdgeTTS, 独立管线)
         状态: 🟢 API Keys 已配置
```

> **v3.1→v3.2 核心变更：** 底图素材工厂 从"降级为可选辅助"恢复为"Layer 1 底图素材工厂"。
> 纠正原因：v3.1 因 Agnes Video 不可靠(~60%)而把 Image(~95%)也一并降级是过度反应。
> v3.2 的底线：Agnes Image 做底图 → HyperFrames 做文字动效 → 两层独立，互不阻塞。

---

## 依赖

### 极速轨（最小依赖）

| 工具 | 安装 | 验证 |
|------|------|------|
| Python >= 3.10 | 系统安装 | `python --version` |
| ffmpeg | 系统安装 / `winget install ffmpeg` | `ffmpeg -version` |
| dashscope | `pip install dashscope` | `python -c "import dashscope"` |
| DASHSCOPE_API_KEY | 阿里云百炼控制台 → API Key | 已配置在 settings.local.json ✅ |

### 品质轨（额外依赖）

| 工具 | 安装 | 验证 |
|------|------|------|
| Node.js >= 22 | 系统安装 | `node --version` |
| hyperframes | `npm install -g hyperframes` | `npx hyperframes doctor` |
| Chrome (headless) | hyperframes 自动下载 | `npx hyperframes doctor` |

> `npx hyperframes doctor` 一键诊断品质轨全部依赖（含 Chrome、FFmpeg）。

### 解说轨（额外依赖）

| 工具 | 安装 | 验证 |
|------|------|------|
| QWEN_API_KEY | 阿里云百炼 | 已配置 ✅ |
| DEEPSEEK_API_KEY | DeepSeek 开放平台 | 已配置 ✅ |
