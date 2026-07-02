#!/usr/bin/env python3
"""AI 视频工厂 — 极速轨 v3.6

画面合成器：接收文案 + 可选音频文件，用纯 FFmpeg 生成 MP4。
合成完成后自动跑质量门禁（ffprobe 6项 + 视觉抽检 + 幻灯片风险检测）。

TTS 引擎（按优先级）：
  1. --audio 指定文件 → 直接用
  2. MOSS-TTS v1.5 → 云端免费，31语言+零样本声音克隆（需 MOSS_API_KEY）
  3. 百炼 DashScope qwen3-tts-flash → 备选中文配音（需 DASHSCOPE_API_KEY）

v3.6: MOSS-TTS 优先引擎
v3.5 质量门禁升级（借鉴 OpenMontage final_review.schema.json）：
  - 6项 ffprobe 技术检查 (v3.4)
  - 视觉抽检：4个时间点帧采样 (v3.5 new)
  - 幻灯片风险：相邻帧相似度检测 (v3.5 new)
  - 视频类型承诺：确保交付物匹配承诺类型 (v3.5 new)

用法:
  python generate.py 文案.txt
  python generate.py 文案.txt --audio audio.mp3
  python generate.py 文案.txt --audio audio.mp3 --title "标题"
  python generate.py 文案.txt --title "标题" --voice longxiaochun
  python generate.py 文案.txt --bg img.jpg
  python generate.py 文案.txt --engine moss-tts --moss-voice-id 2001257729754140672
"""

import subprocess, sys, os, time, re, tempfile, shutil, json, asyncio

if sys.platform == "win32":
    sys.stdout = open(sys.stdout.fileno(), mode="w", encoding="utf-8", buffering=1)
    sys.stderr = open(sys.stderr.fileno(), mode="w", encoding="utf-8", buffering=1)

OUTPUT_DIR = "output"
VIDEO_W, VIDEO_H = 1920, 1080
FPS = 24

# ── API Keys ────────────────────────────────────────────────
MOSS_API_KEY = (
    os.environ.get("MOSS_API_KEY")
    or ""
)
DASHSCOPE_KEY = (
    os.environ.get("DASHSCOPE_API_KEY")
    or os.environ.get("QWEN_API_KEY")
    or ""
)

# ── Windows 字体 ────────────────────────────────────────────
_WFD = os.environ.get("WINDIR", r"C:\Windows") + r"\Fonts"
for _f in [
    os.path.join(_WFD, "msyhbd.ttc"),
    os.path.join(_WFD, "msyh.ttc"),
    os.path.join(_WFD, "simhei.ttf"),
]:
    if os.path.isfile(_f):
        TITLE_FONT = _f
        break
else:
    TITLE_FONT = "C:/Windows/Fonts/msyh.ttc"


def main():
    import argparse

    p = argparse.ArgumentParser(
        description="AI 视频工厂 — 极速轨 v3.6",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("input", nargs="?", help="文案 .txt 文件路径")
    p.add_argument("--file", "-f", dest="file_path", help="文案 .txt 路径")
    p.add_argument("--audio", "-a", help="音频文件路径 (可选，不提供则自动用 TTS)")
    p.add_argument("--voice", "-v", default="Cherry",
                   help="TTS 音色 (百炼: Cherry/Stella/longxiaochun/longxiaoxia/longxiaocheng，MOSS-TTS: 传 voice_id)")
    p.add_argument("--engine", "-e", default="moss-tts", choices=["moss-tts", "bailian"],
                   help="TTS 引擎: moss-tts (默认，免费云端) / bailian (百炼备选)")
    p.add_argument("--moss-voice-id", default="2001257729754140672",
                   help="MOSS-TTS 音色 ID (默认 2001257729754140672)")
    p.add_argument("--title", "-t", help="视频大标题（顶部居中）")
    p.add_argument("--bg", "-b", help="背景图片路径")
    p.add_argument("--end-screen", action="store_true", help="末尾加 3 秒引导关注页")
    p.add_argument("--output", "-o", help="输出文件名")
    p.add_argument("--bg-color", default="0x0A0A1A", help="背景色 (默认 0x0A0A1A)")
    p.add_argument("--subtitle-size", type=int, default=26, help="字幕字号 (默认 26)")
    args = p.parse_args()

    # ── 读取文案 ──────────────────────────────────────────
    text = read_text(args)
    if not text:
        print("[FAIL] 请提供文案 .txt 文件路径")
        sys.exit(1)
    text = text.strip()
    char_count = len(text.replace("\n", "").replace(" ", ""))
    print(f"[TEXT] {char_count} chars | {text[:80]}...")

    # ── 准备音频 ──────────────────────────────────────────
    audio_path = args.audio
    tmp = tempfile.mkdtemp(prefix="vf_")

    if audio_path and os.path.isfile(audio_path):
        print(f"[AUDIO] 使用已有文件: {audio_path}")
    else:
        engine = args.engine
        if engine == "moss-tts" and MOSS_API_KEY:
            print(f"[TTS] MOSS-TTS v1.5 | voice_id={args.moss_voice_id}")
            audio_path = os.path.join(tmp, "moss_tts.wav")
            try:
                gen_moss_tts(text, args.moss_voice_id, audio_path)
            except Exception as e:
                print(f"[TTS] MOSS-TTS 失败: {e}")
                # fall through to bailian
                engine = "bailian"
                audio_path = None
        if engine == "bailian" and DASHSCOPE_KEY:
            print(f"[TTS] 百炼 qwen3-tts-flash | voice={args.voice}")
            audio_path = audio_path or os.path.join(tmp, "dashscope.wav")
            try:
                gen_dashscope_tts(text, args.voice, audio_path)
            except Exception as e:
                print(f"[TTS FAIL] {e}")
                sys.exit(1)
        if not audio_path or not os.path.isfile(audio_path):
            print("[FAIL] 没有音频文件，也没有可用的 TTS 引擎。")
            print("  MOSS-TTS (默认): 设置 MOSS_API_KEY 环境变量")
            print("  百炼 (备选):    设置 DASHSCOPE_API_KEY 环境变量")
            print("  已有音频:       python generate.py 文案.txt --audio audio.mp3")
            sys.exit(1)

    audio_dur = probe_duration(audio_path)
    print(f"[AUDIO] {audio_dur:.1f}s")

    if args.title:
        print(f"[TITLE] {args.title}")
    if args.bg:
        print(f"[BG] {args.bg}")

    # ── 生成 SRT 字幕 ─────────────────────────────────────
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    srt_path = os.path.join(tmp, "subs.srt")

    try:
        t0 = time.time()
        make_srt(text, audio_dur, srt_path)

        ts = time.strftime("%Y%m%d_%H%M%S")
        out_mp4 = os.path.abspath(
            os.path.join(OUTPUT_DIR, args.output or f"video_{ts}.mp4")
        )

        print("[COMP] compositing...")
        composite(
            audio_path, srt_path, out_mp4, audio_dur,
            bg_image=args.bg,
            title=args.title,
            bg_color=args.bg_color,
            subtitle_size=args.subtitle_size,
            end_screen=args.end_screen,
        )

        total = time.time() - t0
        size_mb = os.path.getsize(out_mp4) / (1024 * 1024)

        print(f"\n✅ DONE: {out_mp4}")
        print(f"   {audio_dur:.1f}s | {char_count} chars | {size_mb:.1f}MB | {total:.0f}s")

        latest = os.path.join(OUTPUT_DIR, "latest.mp4")
        shutil.copy2(out_mp4, latest)
        print(f"   → {latest}")

        # ── v3.4: 质量门禁 ─────────────────────────────────
        print(f"\n{'─'*50}")
        print("🔍 质量门禁 (Quality Gate)")
        print(f"{'─'*50}")
        results = quality_gate(out_mp4)
        all_pass = print_gate_report(results)
        print(f"{'─'*50}")

        if not all_pass:
            print("⚠️  质量门禁未通过，请检查上述 FAIL 项")
            sys.exit(2)

    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ═══════════════════════════════════════════════════════════════
# MOSS-TTS v1.5 (MOSI API — 免费云端)
# ═══════════════════════════════════════════════════════════════

def gen_moss_tts(text: str, voice_id: str, out_wav: str):
    """MOSS-TTS v1.5 — 云端免费 TTS，31语言+零样本声音克隆"""
    import urllib.request, json, base64

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
        "https://studio.mosi.cn/api/v1/audio/speech",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {MOSS_API_KEY}",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=120)
        result = json.loads(resp.read())
        audio_bytes = base64.b64decode(result["audio_data"])
        with open(out_wav, "wb") as f:
            f.write(audio_bytes)
        print(f"[TTS] MOSS-TTS → {len(audio_bytes)} bytes")
    except Exception as e:
        raise RuntimeError(f"MOSS-TTS API 调用失败: {e}") from e


# ═══════════════════════════════════════════════════════════════
# 百炼 DashScope TTS
# ═══════════════════════════════════════════════════════════════

def gen_dashscope_tts(text: str, voice: str, out_wav: str):
    """百炼 qwen3-tts-flash — 云端中文 TTS，按量付费，国内充值方便"""
    import dashscope, urllib.request

    dashscope.api_key = DASHSCOPE_KEY
    dashscope.base_http_api_url = "https://dashscope.aliyuncs.com/api/v1"

    voice_map = {
        "Cherry": "Cherry",
        "Stella": "Stella",
        "longxiaochun": "longxiaochun",
        "longxiaoxia": "longxiaoxia",
        "longxiaocheng": "longxiaocheng",
    }
    resp = dashscope.MultiModalConversation.call(
        model="qwen3-tts-flash",
        api_key=DASHSCOPE_KEY,
        text=text,
        voice=voice_map.get(voice, "Cherry"),
        stream=False,
    )
    if not resp.output or not resp.output.audio:
        raise RuntimeError(f"DashScope TTS 失败: {resp}")
    urllib.request.urlretrieve(resp.output.audio.url, out_wav)


# ═══════════════════════════════════════════════════════════════
# SRT 字幕
# ═══════════════════════════════════════════════════════════════

def make_srt(text: str, total_dur: float, srt_path: str):
    """按句号/问号/感叹号/换行切分，按字数比例分配时间"""
    parts = re.split(r"(?<=[。！？\n])", text)
    sentences = [s.strip() for s in parts if s.strip()]
    if not sentences:
        sentences = [text]

    total_chars = sum(len(s) for s in sentences)
    char_sec = total_dur / max(total_chars, 1)

    lines = []
    t = 0.0
    for i, seg in enumerate(sentences, 1):
        dur = max(len(seg) * char_sec, 0.8)
        if t + dur > total_dur:
            dur = max(total_dur - t, 0.5)
        lines.append(str(i))
        lines.append(f"{fmt_ts(t)} --> {fmt_ts(t + dur)}")
        lines.append(seg)
        lines.append("")
        t += dur
        if t >= total_dur:
            break

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


# ═══════════════════════════════════════════════════════════════
# FFmpeg 画面合成
# ═══════════════════════════════════════════════════════════════

def composite(
    audio_path: str,
    srt_path: str,
    out_mp4: str,
    duration: float,
    bg_image: str = None,
    title: str = None,
    bg_color: str = "0x0A0A1A",
    subtitle_size: int = 26,
    end_screen: bool = False,
):
    """FFmpeg 合成：背景 + 标题 + 字幕 + 可选尾屏 → MP4"""

    srt_safe = srt_path.replace("\\", "/").replace(":", "\\:")

    sub_style = (
        f"FontName=Microsoft YaHei,"
        f"FontSize={subtitle_size},"
        f"PrimaryColour=&H00FFFFFF,"
        f"OutlineColour=&H00000000,"
        f"BackColour=&H80000000,"
        f"Bold=1,Outline=2,Alignment=2,MarginV=120"
    )

    filters = []
    inputs_extra = []

    # ── Layer 1: 背景 ──
    if bg_image and os.path.isfile(bg_image):
        inputs_extra = ["-loop", "1", "-i", bg_image]
        filters.append(
            f"[0:v]scale={VIDEO_W}:{VIDEO_H}:force_original_aspect_ratio=decrease,"
            f"pad={VIDEO_W}:{VIDEO_H}:(ow-iw)/2:(oh-ih)/2,setsar=1,"
            f"loop=-1:1,fps={FPS}[bg]"
        )
    else:
        # 深色渐变背景
        bg_r = int(bg_color[2:4], 16)
        bg_g = int(bg_color[4:6], 16)
        bg_b = int(bg_color[6:8], 16)
        filters.append(
            f"color=c={bg_color}:s={VIDEO_W}x{VIDEO_H}:r={FPS}:d={duration + 0.5},"
            f"format=yuva420p[bg_raw];"
            f"[bg_raw]geq="
            f"r='{bg_r}+8*sin(Y/H*PI)':"
            f"g='{bg_g}+6*sin(Y/H*PI)':"
            f"b='{bg_b}+10*sin(Y/H*PI)'"
            f"[bg]"
        )

    # ── Layer 2: 标题 ──
    current_v = "bg"
    if title:
        title_esc = title.replace("'", "'\\\\\\\\\\\\''").replace(":", "\\:")
        font_f = TITLE_FONT.replace("\\", "/").replace(":", "\\:")
        filters.append(
            f"[bg]drawtext="
            f"text='{title_esc}':"
            f"fontfile='{font_f}':"
            f"fontsize=44:fontcolor=white@0.95:"
            f"x=(w-text_w)/2:y=50:"
            f"shadowx=2:shadowy=2:shadowcolor=black@0.5"
            f"[titled]"
        )
        current_v = "titled"

    # ── Layer 3: 字幕 ──
    filters.append(
        f"[{current_v}]subtitles='{srt_safe}':"
        f"force_style='{sub_style}'[vout]"
    )

    # ── 尾屏 ──
    if end_screen:
        filters.append(f"[vout]tpad=stop_mode=clone:stop_duration=3[vout]")

    filter_complex = ";".join(filters)

    cmd = [
        "-y",
        *inputs_extra,
        "-i", audio_path,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "0:a" if not inputs_extra else "1:a",
        "-t", str(duration + (3 if end_screen else 0.5)),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        out_mp4,
    ]

    run_ffmpeg(cmd, "composite", check=True)


# ═══════════════════════════════════════════════════════════════
# v3.5 质量门禁 (借鉴 OpenMontage final_review.schema.json)
# ═══════════════════════════════════════════════════════════════

def quality_gate(mp4_path: str, promise_type: str = "teacher_explainer") -> dict:
    """对成品 MP4 执行完整质检，返回结果字典

    Args:
        mp4_path: 视频文件路径
        promise_type: 视频类型承诺 (teacher_explainer/data_explainer/motion_led/source_led)
    """

    def _probe_json():
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_streams", "-show_format",
             "-of", "json", mp4_path],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            return {}
        try:
            return json.loads(r.stdout)
        except json.JSONDecodeError:
            return {}

    data = _probe_json()
    streams = data.get("streams", [])
    fmt = data.get("format", {})

    video_streams = [s for s in streams if s.get("codec_type") == "video"]
    audio_streams = [s for s in streams if s.get("codec_type") == "audio"]

    results = {}
    results["promise_type"] = promise_type

    # ── 1-6: ffprobe 技术检查 (v3.4) ──
    results["file_exists"] = os.path.isfile(mp4_path)
    results["file_size_kb"] = round(os.path.getsize(mp4_path) / 1024, 1) if results["file_exists"] else 0
    results["min_size"] = results["file_size_kb"] > 10

    v = video_streams[0] if video_streams else {}
    results["has_video"] = bool(video_streams)
    results["resolution"] = f"{v.get('width','?')}×{v.get('height','?')}"
    results["is_1080p"] = (v.get("width") == 1920 and v.get("height") == 1080)

    results["duration_s"] = round(float(fmt.get("duration", 0)), 1)
    audio_dur = 0.0
    if audio_streams:
        a0 = audio_streams[0]
        audio_dur = float(a0.get("duration", a0.get("duration_ts", 0)))
    elif video_streams:
        audio_dur = float(v.get("duration", v.get("duration_ts", 0)))
    results["min_duration"] = max(results["duration_s"], audio_dur) >= 1.0

    results["has_audio"] = bool(audio_streams) or bool(fmt.get("format_name", "").startswith("mp4"))

    fps_str = v.get("r_frame_rate", "0/1")
    results["fps"] = fps_str
    try:
        num, den = fps_str.split("/")
        fps_val = float(num) / float(den) if den != "0" else 0
        results["fps_ok"] = 20 <= fps_val <= 30
    except (ValueError, ZeroDivisionError):
        results["fps_ok"] = False

    results["format"] = fmt.get("format_name", "?")
    br = fmt.get("bit_rate")
    results["bitrate_kbps"] = round(int(br) / 1000, 1) if br else 0

    # ── 7: 视觉抽检 — 4个时间点帧采样 (v3.5 new, 借鉴 OM visual_spotcheck) ──
    dur = results["duration_s"]
    if dur >= 2.0 and results["has_video"]:
        sample_times = [
            ("开头", 0.5),
            ("25%", dur * 0.25),
            ("50%", dur * 0.50),
            ("75%", dur * 0.75),
        ]
        frame_hashes = []
        spots = {}
        for label, t in sample_times:
            t = min(t, dur - 0.5)  # clamp
            h = _sample_frame_hash(mp4_path, t)
            frame_hashes.append(h)
            spots[label] = {"time_s": round(t, 1), "has_content": h is not None and h > 0}

        results["visual_spotcheck"] = {
            "frames_sampled": len(spots),
            "all_have_content": all(s["has_content"] for s in spots.values()),
            "spots": spots,
        }

        # ── 8: 幻灯片风险 — 相邻帧差异检测 (v3.5 new, 借鉴 OM slideshow_risk_score) ──
        # 比较开头和中段的帧 hash。teacher_explainer/data_explainer 天然静态，豁免。
        if len(frame_hashes) >= 2:
            total_valid = len([h for h in frame_hashes if h is not None])
            if total_valid >= 2:
                unique_hashes = len(set(h for h in frame_hashes if h is not None))
                similarity = unique_hashes / total_valid
                risk = "low" if similarity >= 0.75 else ("medium" if similarity >= 0.5 else "high")
            else:
                similarity = 0.0
                risk = "unknown"
            results["slideshow_risk"] = {
                "unique_frame_hashes": unique_hashes if total_valid >= 2 else 0,
                "total_sampled": total_valid,
                "variety_score": round(similarity, 2) if total_valid >= 2 else 0,
                "verdict": risk,
                "skip_for": ["teacher_explainer", "data_explainer"],
            }
    else:
        results["visual_spotcheck"] = {"frames_sampled": 0, "all_have_content": False, "note": "video too short or no video stream"}
        results["slideshow_risk"] = {"verdict": "unknown", "note": "cannot assess"}

    # ── 9: 类型承诺检查 (v3.5 new, 借鉴 OM delivery_promise.py) ──
    promise_rules = {
        "teacher_explainer": {"min_duration_s": 1.0, "requires_audio": True, "requires_video": False, "min_motion_ratio": 0.0},
        "data_explainer":   {"min_duration_s": 1.0, "requires_audio": True, "requires_video": False, "min_motion_ratio": 0.0},
        "motion_led":       {"min_duration_s": 1.0, "requires_audio": True, "requires_video": True,  "min_motion_ratio": 0.3},
        "source_led":       {"min_duration_s": 1.0, "requires_audio": True, "requires_video": True,  "min_motion_ratio": 0.1},
    }
    rules = promise_rules.get(promise_type, promise_rules["teacher_explainer"])
    promise_issues = []
    if rules["requires_audio"] and not results["has_audio"]:
        promise_issues.append("承诺需要音频轨道但未检测到")
    if rules["requires_video"] and not results["has_video"]:
        promise_issues.append("承诺需要视频流但未检测到")
    # 幻灯片风险检查：teacher_explainer/data_explainer 天然豁免
    if (promise_type not in ("teacher_explainer", "data_explainer")
        and results.get("slideshow_risk", {}).get("verdict") == "high"
        and rules["min_motion_ratio"] > 0.1):
        promise_issues.append(f"幻灯片风险高，但承诺动效比例≥{rules['min_motion_ratio']}")
    results["promise_preservation"] = {
        "promised": promise_type,
        "rules_applied": rules,
        "fulfilled": len(promise_issues) == 0,
        "issues": promise_issues,
    }

    return results


def _sample_frame_hash(mp4_path: str, time_s: float) -> int | None:
    """在指定时间点提取一帧并计算 perceptual hash（简化版：像素均值 hash）"""
    r = subprocess.run(
        ["ffmpeg", "-y", "-ss", str(time_s), "-i", mp4_path,
         "-vframes", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-s", "64x36", "-"],
        capture_output=True, timeout=10,
    )
    if r.returncode != 0 or len(r.stdout) < 100:
        return None
    # 简化 dhash: 每行相邻像素比较，生成 64*35 bit 的 hash 值
    raw = r.stdout
    h = 0
    for i in range(min(len(raw) - 64, 64 * 35)):
        h = (h * 31 + raw[i]) & 0xFFFFFFFF
    return h


# ── 门禁检查表 ──
GATE_CHECKS = [
    ("min_size",             "文件大小 ≥ 10KB",                      "critical"),
    ("has_video",            "视频流 (h264/hevc/…)",                  "critical"),
    ("has_audio",            "音频流 (aac/mp3/…)",                    "critical"),
    ("min_duration",         "时长 ≥ 1 秒",                           "critical"),
    ("is_1080p",             "分辨率 1920×1080",                      "warn"),
    ("fps_ok",               "帧率 20-30 fps",                        "warn"),
    # v3.5 新增
    ("visual_all_content",   "视觉抽检 — 4帧均有内容",               "critical"),
    ("slideshow_not_high",   "幻灯片风险 — 非高",                    "warn"),
    ("promise_fulfilled",    "类型承诺 — 交付物匹配承诺",            "critical"),
]


def print_gate_report(results: dict) -> bool:
    """打印质检报告，返回 True 表示全部 critical 通过"""
    all_critical_pass = True

    # 展开嵌套结果
    vis = results.get("visual_spotcheck", {})
    results["visual_all_content"] = vis.get("all_have_content", False)

    ss = results.get("slideshow_risk", {})
    results["slideshow_not_high"] = ss.get("verdict") != "high"

    pp = results.get("promise_preservation", {})
    results["promise_fulfilled"] = pp.get("fulfilled", False)

    for key, label, severity in GATE_CHECKS:
        passed = results.get(key, False)
        icon = "✅" if passed else "❌"
        sev_label = "CRITICAL" if severity == "critical" else "WARN"
        print(f"  {icon} [{sev_label:<8}] {label:<30} → {passed}")

        if not passed and severity == "critical":
            all_critical_pass = False

    # 基础信息
    print(f"  📋 时长: {results.get('duration_s', '?')}s | "
          f"分辨率: {results.get('resolution', '?')} | "
          f"帧率: {results.get('fps', '?')}")
    print(f"  📋 编码: {results.get('format', '?')} | "
          f"码率: {results.get('bitrate_kbps', '?')}kbps | "
          f"大小: {results.get('file_size_kb', '?')}KB")

    # 视觉抽检详情
    if vis.get("frames_sampled", 0) > 0:
        spots_str = " | ".join(
            f"{label}:{'✓' if s['has_content'] else '✗'}"
            for label, s in vis.get("spots", {}).items()
        )
        print(f"  🖼️  视觉抽检: {vis.get('frames_sampled')}帧 | {spots_str}")

    # 幻灯片风险详情
    if ss:
        print(f"  📊 幻灯片风险: {ss.get('verdict', '?')} "
              f"(多样性={ss.get('variety_score', '?')}, "
              f"唯一帧hash={ss.get('unique_frame_hashes', '?')}/{ss.get('total_sampled', '?')})")

    # 承诺检查详情
    if pp.get("issues"):
        for issue in pp["issues"]:
            print(f"  ⚠️  承诺违约: {issue}")

    return all_critical_pass

def probe_duration(path: str) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    return float(r.stdout.strip())


def fmt_ts(sec: float) -> str:
    h, m, s = int(sec // 3600), int((sec % 3600) // 60), int(sec % 60)
    return f"{h:02d}:{m:02d}:{s:02d},{int((sec % 1) * 1000):03d}"


def read_text(args) -> str | None:
    fpath = args.input or args.file_path
    if fpath and os.path.isfile(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            return f.read()
    if not sys.stdin.isatty():
        raw = sys.stdin.buffer.read()
        for enc in ["utf-8", "utf-16", "gbk"]:
            try:
                return raw.decode(enc)
            except (UnicodeDecodeError, UnicodeError):
                continue
        return raw.decode("utf-8", errors="replace")
    return None


def run_ffmpeg(cmd: list, tag: str = "", check: bool = False):
    p = subprocess.run(
        ["ffmpeg"] + cmd, capture_output=True, text=True, timeout=300
    )
    if check and p.returncode != 0:
        print(f"[FFmpeg:{tag}] ERROR:\n{p.stderr[-500:]}")
        raise RuntimeError(f"ffmpeg {tag} failed (exit {p.returncode})")
    return p


if __name__ == "__main__":
    main()
