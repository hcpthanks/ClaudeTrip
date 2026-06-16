---
name: agnes-ai
description: Agnes AI 全模态 API — 文本对话(agnes-2.0-Flash)、图片生成(agnes-Image-2.1-Flash)、视频生成(agnes-Video-V2.0)。三者全免费，需先设置 AGNES_API_KEY 环境变量。
version: 1.0.0
---

# Agnes AI — 免费全模态 API

Agnes AI 是 2026 年 6 月开放的免费全模态 API 平台，提供文本、图像、视频三大模型。

- **官网**: https://platform.agnes-ai.com/（注册获取 API Key）
- **文档**: https://agnes-ai.com/doc/overview
- **Base URL**: `https://apihub.agnes-ai.com/v1`

## 三种模型速查

| 模型 | 用途 | Endpoint | 关键能力 |
|------|------|----------|----------|
| `agnes-2.0-flash` | 文本/Agent | `POST /v1/chat/completions` | OpenAI 兼容，1M 上下文，65K 输出 |
| `agnes-image-2.0-flash` | 图片生成 | `POST /v1/images/generations` | 文生图/图生图，5 秒出图 |
| `agnes-video-v2.0` | 视频生成 | `POST /v1/videos` | 文/图生视频，音画同出，异步轮询 |

## 环境准备

```bash
# 1. 设置 API Key（在 platform.agnes-ai.com 创建）
export AGNES_API_KEY="sk-agnes-xxxxxxxxxxxxx"

# 2. 安装依赖（如用 Python 方式）
pip install httpx
```

## 方式一：OpenAI SDK（最简文本调用）

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-agnes-xxxx",
    base_url="https://apihub.agnes-ai.com/v1"
)

response = client.chat.completions.create(
    model="agnes-2.0-flash",
    messages=[{"role": "user", "content": "用Python写快速排序"}]
)
print(response.choices[0].message.content)
```

## 方式二：requests 直接调用

### 文本对话

```python
import requests

resp = requests.post(
    "https://apihub.agnes-ai.com/v1/chat/completions",
    headers={"Authorization": "Bearer sk-agnes-xxxx"},
    json={
        "model": "agnes-2.0-flash",
        "messages": [{"role": "user", "content": "你好"}]
    }
)
print(resp.json()["choices"][0]["message"]["content"])
```

### 图片生成

```python
import requests

resp = requests.post(
    "https://apihub.agnes-ai.com/v1/images/generations",
    headers={"Authorization": "Bearer sk-agnes-xxxx"},
    json={
        "model": "agnes-image-2.0-flash",
        "prompt": "一只橘猫坐在窗台上，阳光透过窗户",
        "n": 1,
        "size": "1024x1024"
    }
)
print(resp.json()["data"][0]["url"])
```

### 视频生成（异步两步走）

```python
import requests
import time

HEADERS = {"Authorization": "Bearer sk-agnes-xxxx"}

# 第1步：创建任务
resp = requests.post(
    "https://apihub.agnes-ai.com/v1/videos",
    headers=HEADERS,
    json={
        "model": "agnes-video-v2.0",
        "prompt": "一只猫在海滩上奔跑",
        "height": 768,
        "width": 1152,
        "num_frames": 121,   # 必须 8n+1
        "frame_rate": 24
    }
)
task_id = resp.json()["id"]
print(f"任务创建: {task_id}")

# 第2步：轮询结果
while True:
    r = requests.get(f"https://apihub.agnes-ai.com/v1/videos/{task_id}", headers=HEADERS)
    d = r.json()
    if d.get("status") == "completed":
        print(f"✅ 视频: {d['url']}"); break
    if d.get("status") == "failed":
        print(f"❌ 失败: {d.get('error')}"); break
    time.sleep(5)
```

## 方式三：通过 MCP Server（Claude Code 原生集成）

MCP Server 位于 `agents/agnes-mcp/server.py`，提供 3 个工具：

- `agnes_chat` — 文本对话
- `agnes_image` — 图片生成
- `agnes_video` — 视频生成（含自动轮询）

### 注册到 Claude Code

在 `~/.claude.json` 的 `mcpServers` 中添加：

```json
{
  "mcpServers": {
    "agnes-ai": {
      "command": "python",
      "args": ["E:\\WorkBuddy\\CLAW\\agents\\agnes-mcp\\server.py"],
      "env": {
        "AGNES_API_KEY": "sk-agnes-xxxxxxxxxxxxx"
      }
    }
  }
}
```

注册后 Claude Code 可以直接调用这三个工具。

## 关键参数速查

### agnes-2.0-flash（文本）
- `temperature`: 0-2，默认 0.7
- `max_tokens`: 最大 65536
- 支持 function calling / tool use
- 支持 1M 上下文窗口

### agnes-image-2.0-flash（图片）
- `size`: 1024x1024 / 1792x1024 / 1024x1792 / 512x512
- `n`: 1-4 张
- 支持文生图、图生图

### agnes-video-v2.0（视频）
- `num_frames`: 必须 `8n+1`（121/241/441 等）
- `width × height`: 最高 1080p
- `frame_rate`: 最高 25fps
- 最长约 441 帧（~18 秒）
- 原生音画同出，支持中英文语音

## Tips

- 三个模型目前全部免费，无需绑卡
- 视频生成建议先跑小参数（121帧，5秒）验证效果
- API Key 创建后只显示一次，务必保存
- 兼容 OpenAI SDK，大部分生态工具可直连
