#!/usr/bin/env python3
"""
Agnes AI MCP Server — 让 Claude Code 直接调用 Agnes 全模态模型

工具列表:
  agnes_chat   — 文本对话（支持 1M 上下文，OpenAI 兼容）
  agnes_image  — 图片生成（文生图，5秒出图）
  agnes_video  — 视频生成（含异步轮询，音画同出）

环境变量:
  AGNES_API_KEY  — Agnes AI 的 API Key（sk-agnes-xxxx）
"""

import os
import json
import time
import asyncio
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# ── 配置 ────────────────────────────────────────────
BASE_URL = "https://apihub.agnes-ai.com/v1"
API_KEY = os.environ.get("AGNES_API_KEY", "")
HTTP_TIMEOUT = 120  # 视频生成等较久

# ── MCP Server ───────────────────────────────────────
server = Server("agnes-ai")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="agnes_chat",
            description="Agnes AI 文本对话 — 调用 agnes-2.0-flash 模型。支持 1M 上下文窗口、65K 输出。适合编程、写作、问答、Agent 工作流。兼容 OpenAI 格式。",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "用户消息"},
                    "system": {"type": "string", "description": "系统提示词（可选）"},
                    "temperature": {"type": "number", "description": "创造性控制，0-2，默认 0.7"},
                    "max_tokens": {"type": "integer", "description": "最大输出 token 数，最大 65536"},
                },
                "required": ["prompt"],
            },
        ),
        Tool(
            name="agnes_image",
            description="Agnes AI 图片生成 — 调用 agnes-image-2.0-flash 模型。支持文生图、高信息密度图片。约 5 秒生成。",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "图片描述，支持中英文"},
                    "size": {
                        "type": "string",
                        "enum": ["1024x1024", "1792x1024", "1024x1792", "512x512"],
                        "description": "图片尺寸，默认 1024x1024",
                    },
                    "n": {"type": "integer", "description": "生成数量，默认 1", "default": 1},
                },
                "required": ["prompt"],
            },
        ),
        Tool(
            name="agnes_video",
            description="Agnes AI 视频生成 — 调用 agnes-video-v2.0 模型。文生视频，原生音画同出（支持中英文语音）。异步生成，需轮询等待（约 2-3 分钟）。",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "视频描述，支持中英文"},
                    "width": {"type": "integer", "description": "视频宽度，默认 1152", "default": 1152},
                    "height": {"type": "integer", "description": "视频高度，默认 768", "default": 768},
                    "num_frames": {
                        "type": "integer",
                        "description": "帧数，必须满足 8n+1。如 121(约5秒), 241(约10秒), 441(约18秒)。默认 121",
                        "default": 121,
                    },
                    "frame_rate": {"type": "integer", "description": "帧率，默认 24", "default": 24},
                    "negative_prompt": {"type": "string", "description": "负面提示词（可选）"},
                    "seed": {"type": "integer", "description": "随机种子（可选）"},
                },
                "required": ["prompt"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if not API_KEY:
        return [TextContent(type="text", text="❌ 未设置 AGNES_API_KEY 环境变量。\n请先设置: export AGNES_API_KEY=sk-agnes-xxxx")]

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        if name == "agnes_chat":
            return await _chat(client, arguments)
        elif name == "agnes_image":
            return await _image(client, arguments)
        elif name == "agnes_video":
            return await _video(client, arguments)
        else:
            return [TextContent(type="text", text=f"未知工具: {name}")]


# ── 工具实现 ──────────────────────────────────────────

async def _chat(client: httpx.AsyncClient, args: dict) -> list[TextContent]:
    messages = []
    if args.get("system"):
        messages.append({"role": "system", "content": args["system"]})
    messages.append({"role": "user", "content": args["prompt"]})

    body = {
        "model": "agnes-2.0-flash",
        "messages": messages,
    }
    if args.get("temperature"):
        body["temperature"] = args["temperature"]
    if args.get("max_tokens"):
        body["max_tokens"] = args["max_tokens"]

    resp = await client.post(
        f"{BASE_URL}/chat/completions",
        headers=_headers(),
        json=body,
    )
    data = resp.json()

    if resp.status_code != 200:
        return [TextContent(type="text", text=f"❌ Chat 错误 [{resp.status_code}]: {data}")]

    content = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    meta = f"\n\n---\n📊 Tokens: {usage.get('total_tokens', '?')} (输入 {usage.get('prompt_tokens', '?')} / 输出 {usage.get('completion_tokens', '?')})"
    return [TextContent(type="text", text=content + meta)]


async def _image(client: httpx.AsyncClient, args: dict) -> list[TextContent]:
    body = {
        "model": "agnes-image-2.0-flash",
        "prompt": args["prompt"],
        "n": args.get("n", 1),
        "size": args.get("size", "1024x1024"),
    }

    resp = await client.post(
        f"{BASE_URL}/images/generations",
        headers=_headers(),
        json=body,
    )
    data = resp.json()

    if resp.status_code != 200:
        return [TextContent(type="text", text=f"❌ Image 错误 [{resp.status_code}]: {data}")]

    results = []
    for i, img in enumerate(data.get("data", [])):
        url = img.get("url", "")
        revised = img.get("revised_prompt", "")
        results.append(f"### 图片 {i+1}\n- **URL**: {url}\n- **优化提示词**: {revised}")

    return [TextContent(type="text", text="\n\n".join(results))]


async def _video(client: httpx.AsyncClient, args: dict) -> list[TextContent]:
    # 第一步：创建视频任务
    body = {
        "model": "agnes-video-v2.0",
        "prompt": args["prompt"],
        "width": args.get("width", 1152),
        "height": args.get("height", 768),
        "num_frames": args.get("num_frames", 121),
        "frame_rate": args.get("frame_rate", 24),
    }
    if args.get("negative_prompt"):
        body["negative_prompt"] = args["negative_prompt"]
    if args.get("seed"):
        body["seed"] = args["seed"]

    create_resp = await client.post(
        f"{BASE_URL}/videos",
        headers=_headers(),
        json=body,
    )
    create_data = create_resp.json()

    if create_resp.status_code != 200:
        return [TextContent(type="text", text=f"❌ Video 创建失败 [{create_resp.status_code}]: {create_data}")]

    task_id = create_data.get("id", create_data.get("task_id", ""))
    print(f"[Agnes Video] 任务已创建: {task_id}", flush=True)

    # 第二步：轮询等待完成（最多 30 次 × 5 秒 = 2.5 分钟）
    for attempt in range(1, 31):
        await asyncio.sleep(5)

        query_url = f"{BASE_URL}/videos/{task_id}"
        status_resp = await client.get(query_url, headers=_headers())
        status_data = status_resp.json()

        status = status_data.get("status", "")

        if status == "completed" or status == "succeeded":
            video_url = status_data.get("url") or status_data.get("video_url", "")
            result_lines = [
                f"✅ 视频生成完成！",
                f"- **视频 URL**: {video_url}",
                f"- **任务 ID**: {task_id}",
                f"- **耗时**: {attempt * 5} 秒",
            ]
            return [TextContent(type="text", text="\n".join(result_lines))]

        elif status == "failed" or status == "error":
            error_msg = status_data.get("error", status_data.get("message", "未知错误"))
            return [TextContent(type="text", text=f"❌ 视频生成失败: {error_msg}")]

        else:
            progress = status_data.get("progress", "处理中")
            print(f"[Agnes Video] 轮询 {attempt}/30 — 状态: {status} ({progress})", flush=True)

    return [TextContent(type="text", text=f"⏰ 视频生成超时（{30 * 5}秒）。任务 ID: {task_id}，请稍后手动查询。")]


# ── 辅助函数 ──────────────────────────────────────────

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


# ── 入口 ──────────────────────────────────────────────

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
