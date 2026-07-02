---
name: scenefab
description: |
  AI影视解说视频一站式生成。上传视频 → Qwen3.7分镜分析 → DeepSeek解说词 → MOSS-TTS配音(优先) → ASS字幕合成。
  三引擎：Qwen3.7(Vision) + DeepSeek(解说) + MOSS-TTS(配音，31语言+零样本声音克隆)。
  适合影视解说、短剧解说、知识类视频创作。当用户需要把视频变成带解说的成品时使用此skill。
version: 1.1.0
---

# SceneFab — AI 影视解说视频生成器

## 概述

输入一个视频，输出带 AI 解说配音 + 同步字幕的成品 MP4。完整流水线：

```
视频 → Step1:FFmpeg抽帧 → Step2:Qwen3.7分镜分析 → Step3:DeepSeek解说词
     → Step4:MOSS-TTS配音 → Step5:FFmpeg音画字幕合成 → 成品.mp4
```

- **分镜分析**：Qwen3.7 Vision（百炼 `qwen3.7-plus`），0.6元/百万tokens
- **解说词**：DeepSeek V4 Flash，0.1元/百万tokens
- **配音**：MOSS-TTS v1.5（默认，免费云端，31语言+声音克隆）
- **字幕**：SRT 按字数比例分段，**免费**
- **合成**：FFmpeg libx264，**本地免费**

## 前置条件

```bash
# API Keys（必须：DeepSeek + Qwen / 可选：MOSS_TTS 默认使用）
export DEEPSEEK_API_KEY="sk-..."
export QWEN_API_KEY="sk-..."
export MOSS_API_KEY="sk-..."  # 免费云端 TTS，默认引擎

# 依赖（一次性安装）
pip install opencv-python scenedetect moviepy pyside6 httpx openai
# MOSS-TTS 只需标准库 (urllib + json + base64)，无需额外 pip 安装

# 源码安装（一次性）
cd E:/WorkBuddy/scenefab/scene-fab-2.1.1 && pip install -e .
```

**初始化脚本**：`E:/WorkBuddy/scenefab/init.sh`（bash）或 `init.bat`（cmd）

## 快速使用

> "帮我把这个视频做成AI解说视频，风格悬疑"

> "分析这个电影片段，生成第一人称解说"

## 核心工具脚本

### 主流水线：`demo_pipeline.py`

```bash
source E:/WorkBuddy/scenefab/init.sh
python E:/WorkBuddy/scenefab/demo_pipeline.py
```

当前版本使用 `E:/WorkBuddy/scenefab/test_video.mp4`（30秒测试彩条）。要处理真实视频，修改脚本中的 `VIDEO_PATH`。

### 分镜分析（Qwen3.7 Vision）

SceneFab 源码中提供了3个 Vision Provider：

| Provider | 文件 | 模型 | 适用场景 |
|----------|------|------|---------|
| `Qwen37Provider` | `providers/qwen37.py` | qwen3.7-max/plus | **主力**，视频理解 SOTA |
| `QwenVLProvider` | `providers/vision_providers.py` | qwen-vl-plus/max | 备选 |
| `Gemini35FlashProvider` | `providers/gemini35_flash.py` | gemini-3.5-flash | 备选，需 GEMINI_API_KEY |

**关键：分镜提示词**

SceneFab 中预定义了两种提示词（`services/ai/vision_base.py`）：

```python
# 通用视觉分析
VISION_ANALYSIS_PROMPT = """
分析这张图片/视频帧，返回 JSON：
{
  "description": "场景描述",
  "objects": ["检测到的物体"],
  "scene_type": "室内/室外/特写/远景",
  "lighting": "明亮/昏暗/暖色/冷色",
  "motion": "静态/轻微/剧烈",
  "emotion": "平静/紧张/激动/忧伤/浪漫/悬疑",
  "is_first_person": true/false,
  "narrative_angle": "从什么视角叙述最合适"
}
"""

# 第一人称解说专用
FIRST_PERSON_ANALYSIS_PROMPT = """
你是一个影视解说专家。用第一人称"我"的视角分析这个画面。
返回 JSON：
{
  "description": "用第一人称描述画面（25字以内，有画面感）",
  "emotion": "平静|紧张|激动|忧伤|浪漫|悬疑|恐惧|温暖",
  "first_person_hook": "作为解说的开场钩子（15字以内）",
  "narrative_angle": "叙述角度：见证者|参与者|旁观者|内心独白",
  "scene_importance": 1-10,
  "transition_hint": "如何衔接到下一段"
}
"""
```

**提示词优化建议**（今天的 demo 提示词太简单）：

1. 加上 `scene_importance` 评分 → 优先选高分片段解说
2. 加上 `transition_hint` → 解说词之间自然过渡
3. 真人视频要强调"面部表情、肢体动作、环境氛围"
4. 短剧要加"人物关系、冲突类型、对话情绪"

### 解说词生成（DeepSeek）

`pipeline.py` 中 `ScriptGenerator` 支持 7 种风格：

| 风格 | Style | 适用 |
|------|-------|------|
| 纪录片 | `DOCUMENTARY` | 沉稳客观，适合电影解说 |
| 悬疑 | `MYSTERIOUS` | 紧张氛围，适合悬疑片/短剧 |
| 励志 | `INSPIRATIONAL` | 正能量，适合励志内容 |
| 怀旧 | `NOSTALGIC` | 回忆往事 |
| 浪漫 | `ROMANTIC` | 深情表达 |
| 幽默 | `HUMOROUS` | 轻松活泼 |
| 治愈 | `HEALING` | 温暖治愈 |

### 配音（MOSS-TTS 默认）+ 字幕

音频用 MOSS-TTS v1.5（31语言+零样本声音克隆，免费），字幕用 SRT 按字数比例分段（与极速轨同方案）。

```python
import os, json, base64, urllib.request

MOSS_API_KEY = os.environ.get("MOSS_API_KEY", "")
MOSS_URL = "https://studio.mosi.cn/api/v1/audio/speech"

def gen_moss_tts(text: str, voice_id: str, out_wav: str) -> None:
    """MOSS-TTS v1.5 — 云端免费 TTS"""
    payload = json.dumps({
        "model": "moss-tts",
        "text": text,
        "voice_id": voice_id,
        "expected_duration_sec": max(len(text) * 0.35, 3.0),
        "sampling_params": {
            "max_new_tokens": 20000,
            "temperature": 1.0,
            "top_p": 0.8,
            "top_k": 25,
        },
    }).encode("utf-8")
    req = urllib.request.Request(
        MOSS_URL, data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {MOSS_API_KEY}",
        },
    )
    resp = urllib.request.urlopen(req, timeout=120)
    result = json.loads(resp.read())
    with open(out_wav, "wb") as f:
        f.write(base64.b64decode(result["audio_data"]))

# 音色 ID 速查
# 2001257729754140672  - 默认女声（甜美女声）
# 在 studio.mosi.cn/voice-library 可试听和添加更多音色
```

**字幕生成**（SRT 按字数比例分段，与极速轨 generate.py 同方案）：

```python
import re

def make_srt(text: str, total_dur: float, srt_path: str):
    """按句号/问号/感叹号/换行切分，按字数比例分配时间"""
    parts = re.split(r"(?<=[。！？\n])", text)
    sentences = [s.strip() for s in parts if s.strip()]
    if not sentences:
        sentences = [text]
    total_chars = sum(len(s) for s in sentences)
    char_sec = total_dur / max(total_chars, 1)
    lines, t = [], 0.0
    for i, seg in enumerate(sentences, 1):
        dur = max(len(seg) * char_sec, 0.8)
        if t + dur > total_dur:
            dur = max(total_dur - t, 0.5)
        lines.append(f"{i}\n{fmt_ts(t)} --> {fmt_ts(t + dur)}\n{seg}\n")
        t += dur
        if t >= total_dur:
            break
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def fmt_ts(sec: float) -> str:
    h, m, s = int(sec // 3600), int((sec % 3600) // 60), int(sec % 60)
    return f"{h:02d}:{m:02d}:{s:02d},{int((sec % 1) * 1000):03d}"
```

## 完整工作流（Python）

```bash
ffmpeg -y \
  -i 原视频.mp4 \
  -i 配音.mp3 \
  -vf "subtitles='字幕.ass':force_style='FontName=Microsoft YaHei,FontSize=32,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=60'" \
  -c:v libx264 -preset veryfast -crf 23 \
  -c:a aac -b:a 128k \
  -shortest -map 0:v:0 -map 1:a:0 \
  成品.mp4
```

## 完整工作流（Python）

```python
import base64, os, subprocess, asyncio

# 0. 环境
VIDEO = "你的视频.mp4"
OUT = "./output"
os.makedirs(OUT, exist_ok=True)

# 1. 抽帧
import cv2
cap = cv2.VideoCapture(VIDEO)
duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
sample_ts = list(range(0, int(duration), 5))  # 每5秒1帧
frames_b64 = []
for ts in sample_ts:
    cap.set(cv2.CAP_PROP_POS_MSEC, ts*1000)
    ret, frame = cap.read()
    if ret:
        frame = cv2.resize(frame, (640, 360))
        _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        frames_b64.append({'timestamp': ts, 'image_base64': base64.b64encode(buf).decode()})
cap.release()

# 2. Qwen3.7 分镜分析
from scenefab.services.ai.providers.qwen37 import Qwen37Provider
qwen = Qwen37Provider(api_key=os.environ['QWEN_API_KEY'], model='qwen3.7-plus')
scenes = []
for f in frames_b64:
    result = qwen.analyze_image(f['image_base64'],
        prompt="第一人称描述这个画面，返回JSON：{description, emotion, hook, narrative_angle}")
    scenes.append({'start': f['timestamp'], 'end': f['timestamp']+5, **result})

# 3. DeepSeek 解说词
from scenefab.pipeline import ScriptGenerator
from scenefab.models.video import VideoSegment
from scenefab.models.narration import NarrationStyle
segments = [VideoSegment(video_path=VIDEO, start_time=s['start'],
    end_time=s['end'], confidence=0.85, description=s.get('description','')) for s in scenes]
gen = ScriptGenerator()
narrations = gen.generate(segments, style=NarrationStyle.DOCUMENTARY)

# 4. MOSS-TTS 配音 + SRT 字幕（默认）
all_srt, audio_files, offset = [], [], 0.0
for i, nb in enumerate(narrations):
    wav = os.path.join(OUT, f'seg_{i:02d}.wav')
    gen_moss_tts(nb.text, "2001257729754140672", wav)
    srt = os.path.join(OUT, f'seg_{i:02d}.srt')
    make_srt(nb.text, nb.end_time - nb.start_time, srt)
    audio_files.append(wav)
    all_srt.append(srt)

# 5. 合并音频 + SRT 字幕
concat_txt = os.path.join(OUT, "concat.txt")
with open(concat_txt, "w") as f:
    for a in audio_files:
        f.write(f"file '{a}'\n")
final_audio = os.path.join(OUT, "final.wav")
subprocess.run(
    ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c", "copy", final_audio],
    check=True,
)
# SRT 合并
merged_srt = os.path.join(OUT, "merged.srt")
with open(merged_srt, "w", encoding="utf-8") as out_f:
    idx = 1
    for srt_file in all_srt:
        with open(srt_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
        if content:
            out_f.write(content + "\n\n")

# 6. FFmpeg 合成 (SRT 字幕)
final_mp4 = os.path.join(OUT, "final.mp4")
subprocess.run(
    [
        "ffmpeg", "-y",
        "-i", VIDEO,
        "-i", final_audio,
        "-vf", f"subtitles='{merged_srt}':force_style='FontName=Microsoft YaHei,FontSize=32,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Bold=1'",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", "-map", "0:v:0", "-map", "1:a:0",
        final_mp4,
    ],
    check=True,
)
```

## 短剧模式

短剧每集 1-3 分钟、整季 25-50 集，SceneFab 提供了专用模块：

- `core/short_drama.py` — 4 种短剧风格 + 7 种桥段识别
- `core/batch_processor.py` — 并行 worker + 断点续传（SQLite）

```python
from scenefab.core.short_drama import ShortDramaNarrator, ShortDramaPreset
preset = ShortDramaPreset.suspense()  # 悬疑风
narrator = ShortDramaNarrator(preset=preset)
episodes = narrator.scan_episodes(Path("/series/重生女王/"))
results = narrator.generate_series(episodes, output_dir=Path("output/"))
```

还可以配合 `tts-video` skill 用 CosyVoice2 克隆你自己的声音做配音。

## 现有工具链协同

| 工具 | 作用 | 与 SceneFab 关系 |
|------|------|----------------|
| `ai-video-factory` skill | 全自动视频生产线 | SceneFab 输出配音后可接入 |
| MOSS-TTS (MOSI API) | 免费云端 TTS，31语言+声音克隆 | **唯一配音引擎** |
| Agnes AI (MCP) | 免费文本/图片/视频生成 | 备用 LLM、封面图生成 |
| Wan2.7 (百炼) | 视频生成 | 封面动图/过场动画 |

## AI 提供商速查（SceneFab 原生支持）

| Provider | 文件 | 用途 | 需要 Key |
|----------|------|------|:---:|
| DeepSeek V4 | `providers/deepseek.py` | 解说词生成 | DEEPSEEK_API_KEY |
| Qwen Plus/Max | `providers/qwen.py` | 文本备用 | QWEN_API_KEY |
| Qwen3.7 | `providers/qwen37.py` | 视觉分镜 | QWEN_API_KEY |
| Qwen VL | `providers/vision_providers.py` | 视觉备用 | QWEN_API_KEY |
| Kimi | `providers/kimi.py` | 文本备用 | KIMI_API_KEY |
| GLM-5 | `providers/glm5.py` | 文本备用 | GLM5_API_KEY |
| Claude | `providers/claude.py` | 文本+视觉 | ANTHROPIC_API_KEY |
| Gemini 3.5 | `providers/gemini35_flash.py` | 视觉+视频 | GEMINI_API_KEY |
| 豆包 | `providers/doubao.py` | 文本+视觉 | DOUBAO_API_KEY |
| 混元 | `providers/hunyuan.py` | 文本+视觉 | HUNYUAN_API_KEY |

配置文件：`E:/WorkBuddy/scenefab/scene-fab-2.1.1/config/llm.yaml`

## 安全机制

SceneFab v2.0 内置 FFmpeg 安全封装（`core/ffmpeg_safe.py`）：
- 参数白名单（codec/preset/crf/pix_fmt）
- 路径黑名单（禁止写入系统目录）
- 危险字符检测（`;&|$()` 等）
- subprocess list 模式（非 shell）
- SQLite 审计日志全程记录

## 已知问题 & 解决方案

| 问题 | 现象 | 解决 |
|------|------|------|
| VisionAnalyzerFactory 初始化失败 | `'PipelineConfig' object has no attribute '__dict__'` | 已修复，传 `{}` 替代 `self.config.__dict__` |
| ASS 字幕渲染失败 | `Invalid argument original_size` | 已改用 SRT 字幕，兼容性更好 |
| 测试视频无内容 | 彩条画面 AI 无意义 | 用真实视频素材替换 test_video.mp4 |
| MOSS-TTS 无词级时间戳 | SRT 字幕精度不如 ASS 词级 | 按字数比例分段，效果可接受 |

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.1.0 | 2026-07-02 | MOSS-TTS v1.5 替代 EdgeTTS 为唯一配音引擎；SRT 字幕替代 ASS；移除 EdgeTTS 备选 |
| v1.0.0 | 2026-03 | 初始版本：Qwen3.7 + DeepSeek + EdgeTTS
