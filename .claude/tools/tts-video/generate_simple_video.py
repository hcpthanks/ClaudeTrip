#!/usr/bin/env python3
"""一键极简视频生成器 — 内容为王、速度优先、画面最低。

引擎: edge-tts (默认, 3s, CPU<5%) > CosyVoice2 (引擎2, 慢) > Qwen3-TTS (引擎3, 慢)

用法:
  python generate_simple_video.py 文案.txt                  # 黑底+普通字幕
  python generate_simple_video.py 文案.txt --ass-karaoke    # 黑底+ASS逐词高亮
  python generate_simple_video.py 文案.txt --bg shot.jpg    # 图片背景
"""

import subprocess, sys, os, time, json, tempfile, shutil, re

if sys.platform == 'win32':
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
    sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)

DEFAULT_VOICE = "zh-CN-YunyangNeural"
OUTPUT_DIR = "output"
VIDEO_SIZE = (1920, 1080)
FPS = 24

CORE_WORDS = {
    'AI','算盘','计算器','赢','垃圾','注定','效率','套话','废话',
    '模糊','答案','博弈','营销文案','营销','网站','方案','结论',
    '许愿机','许愿','版本','赚到钱','奇迹','架构师','引擎','高精度',
    '步骤','框架','结构','执行','幻想','对比','效率','不可能','一定'
}


def main():
    import argparse
    p = argparse.ArgumentParser(description="极简视频生成器")
    p.add_argument("input", nargs="?", help="文案 .txt 文件路径")
    p.add_argument("--file", "-f", dest="file_path", help="文案 .txt 文件路径")
    p.add_argument("--bg", "-b", help="背景图片路径")
    p.add_argument("--output", "-o", help="输出文件名")
    p.add_argument("--voice", "-v", default=DEFAULT_VOICE, help="TTS声音")
    p.add_argument("--engine", "-e", choices=["edgetts","cosyvoice2","qwen3tts","auto"], default="auto")
    p.add_argument("--ass-karaoke", action="store_true", help="启用ASS逐词高亮字幕")
    args = p.parse_args()

    text = read_text(args)
    if not text:
        print("[FAIL] Please provide script.txt path")
        sys.exit(1)

    text = text.strip()
    print(f"[TEXT] {len(text)} chars | {text[:60]}...")

    engine = pick_engine(args.engine)
    print(f"[ENGINE] {engine}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ts = time.strftime("%Y%m%d_%H%M%S")
    out_mp4 = os.path.abspath(os.path.join(OUTPUT_DIR, args.output or f"video_{ts}.mp4"))

    tmp = tempfile.mkdtemp(prefix="v_")
    audio_path = os.path.join(tmp, "audio.mp3")
    vtt_path = os.path.join(tmp, "subs.vtt")
    srt_path = os.path.join(tmp, "subs.srt")
    ass_path = os.path.join(tmp, "karaoke.ass")

    try:
        t0 = time.time()

        if engine == "edgetts":
            audio_dur = gen_edgetts(text, args.voice, audio_path, vtt_path)
            vtt_to_srt(vtt_path, srt_path)
        elif engine in ("cosyvoice2", "qwen3tts"):
            audio_dur = gen_local_stub(text, engine, audio_path)
            make_srt(text, audio_dur, srt_path)
        else:
            sys.exit(1)

        tts_time = time.time() - t0
        print(f"[TTS] {audio_dur:.1f}s ({tts_time:.0f}s)")

        print("[COMP] compositing...")
        t1 = time.time()

        if args.ass_karaoke and engine == "edgetts":
            make_ass_karaoke(vtt_path, ass_path, audio_dur)
            composite_ass(ass_path, audio_path, out_mp4, audio_dur, args.bg)
        else:
            composite_srt(audio_path, srt_path, out_mp4, audio_dur, args.bg)

        comp_time = time.time() - t1
        total = time.time() - t0
        size_mb = os.path.getsize(out_mp4) / (1024 * 1024)

        print(f"\nDONE: {out_mp4}")
        print(f"  {audio_dur:.1f}s | {len(text)} chars | {size_mb:.1f}MB | {total:.0f}s | {engine}")

    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def read_text(args):
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


def pick_engine(pref):
    if pref != "auto":
        return pref
    try:
        r = subprocess.run(
            ["edge-tts", "--voice", DEFAULT_VOICE, "--text", "test", "--write-media", "/tmp/_p.mp3"],
            capture_output=True, text=True, timeout=8
        )
        if r.returncode == 0:
            return "edgetts"
    except:
        pass
    for name, path in [
        ("qwen3tts", "~/.claude/models/Qwen3-TTS-12Hz-0.6B-CustomVoice"),
        ("cosyvoice2", "~/.claude/models/CosyVoice2-0.5B"),
    ]:
        if os.path.isdir(os.path.expanduser(path)):
            return name
    return None


def gen_edgetts(text, voice, out_mp3, out_vtt):
    # 用 --file 而不是 --text，避免中文经 bash/CLI 管道编码损坏
    # See: ~/.claude/skills/learned/chinese-encoding-pipeline/SKILL.md
    import tempfile
    script_fp = os.path.join(tempfile.gettempdir(), f"_tts_{os.getpid()}.txt")
    with open(script_fp, "w", encoding="utf-8") as f:
        f.write(text)
    try:
        subprocess.run([
            "edge-tts", "--voice", voice, "--file", script_fp,
            "--write-media", out_mp3, "--write-subtitles", out_vtt,
        ], check=True, capture_output=True, text=True, timeout=120)
    finally:
        try:
            os.unlink(script_fp)
        except OSError:
            pass
    info = json.loads(subprocess.run([
        "ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", out_mp3
    ], capture_output=True, text=True, encoding='utf-8').stdout)
    return float(info["format"]["duration"])


def vtt_to_srt(vtt_path, srt_path):
    with open(vtt_path, "r", encoding="utf-8") as f:
        vtt = f.read()
    lines = []
    idx = 1
    for part in re.split(r'\n\s*\n', vtt.strip()):
        parts = [l.strip() for l in part.strip().split('\n') if l.strip()]
        if not parts or parts[0].upper().startswith('WEBVTT') or parts[0].upper().startswith('NOTE'):
            continue
        for pl in parts:
            m = re.match(r'(\d+):(\d+):(\d+)[.,](\d+)\s*-->\s*(\d+):(\d+):(\d+)[.,](\d+)', pl)
            if m:
                start = f"{m.group(1)}:{m.group(2)}:{m.group(3)},{m.group(4)}"
                end = f"{m.group(5)}:{m.group(6)}:{m.group(7)},{m.group(8)}"
                txt = ' '.join(l for l in parts if l != pl and not re.match(r'^\d+$', l))
                if txt:
                    lines.append(str(idx))
                    lines.append(f"{start} --> {end}")
                    lines.append(txt)
                    lines.append("")
                    idx += 1
                break
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def make_ass_karaoke(vtt_path, ass_path, audio_dur):
    import jieba
    jieba.setLogLevel(0)

    with open(vtt_path, "r", encoding="utf-8") as f:
        vtt = f.read()

    blocks = []
    for part in re.split(r'\n\s*\n', vtt.strip()):
        parts = [l.strip() for l in part.strip().split('\n') if l.strip()]
        if not parts or parts[0].upper().startswith('WEBVTT') or parts[0].upper().startswith('NOTE'):
            continue
        for pl in parts:
            m = re.match(r'(\d+):(\d+):(\d+)[.,](\d+)\s*-->\s*(\d+):(\d+):(\d+)[.,](\d+)', pl)
            if m:
                start = float(m.group(1))*3600+float(m.group(2))*60+float(m.group(3))+float(m.group(4))/1000
                end = float(m.group(5))*3600+float(m.group(6))*60+float(m.group(7))+float(m.group(8))/1000
                txt = ' '.join(l for l in parts if l != pl and not re.match(r'^\d+$', l))
                if txt:
                    blocks.append((start, end, txt))
                break

    ass = [
        "[Script Info]", "ScriptType: v4.00+", "PlayResX: 1920", "PlayResY: 1080",
        "WrapStyle: 0", "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Dim,Microsoft YaHei,30,&H00555555,&H00000000,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,20,20,120,1",
        "Style: Hi,Microsoft YaHei,38,&H00FFFFFF,&H00000000,&H00333333,&H80000000,1,0,0,0,100,100,0,0,1,3,1,2,20,20,120,1",
        "Style: Key,Microsoft YaHei,44,&H00FFD700,&H00000000,&H00AA6600,&H80000000,1,0,0,0,100,100,0,0,1,3,1,2,20,20,120,1",
        "", "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]

    def ts(sec):
        h=int(sec//3600); m=int((sec%3600)//60); s=int(sec%60); cs=int((sec%1)*100)
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    for start, end, txt in blocks:
        words = list(jieba.cut(txt))
        words = [w.strip() for w in words if w.strip()]
        if not words:
            continue
        total_dur = end - start
        total_chars = sum(len(w) for w in words) or 1
        t = start
        for i, w in enumerate(words):
            w_dur = max(0.06, (len(w)/total_chars)*total_dur)
            we = t + w_dur
            style = "Key" if w in CORE_WORDS else "Hi"
            prefix = "".join(words[:i])
            suffix = "".join(words[i+1:])
            disp = "{\\rDim}" + prefix + "{\\r" + style + "}" + w + "{\\rDim}" + suffix
            ass.append(f"Dialogue: 0,{ts(t)},{ts(we)},Dim,,0,0,0,,{disp}")
            t = we

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write("\n".join(ass))


def composite_ass(ass_path, audio_path, out_mp4, duration, bg_image=None):
    if bg_image and os.path.isfile(bg_image):
        subprocess.run([
            "ffmpeg", "-y",
            "-loop", "1", "-i", bg_image,
            "-i", audio_path,
            "-filter_complex",
            f"[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,ass='{ass_path}'[v]",
            "-map", "[v]", "-map", "1:a",
            "-t", str(duration),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", out_mp4,
        ], check=True, capture_output=True, timeout=120)
    else:
        subprocess.run([
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:r=24",
            "-i", audio_path,
            "-filter_complex", f"[0:v]ass='{ass_path}'[v]",
            "-map", "[v]", "-map", "1:a",
            "-t", str(duration),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", out_mp4,
        ], check=True, capture_output=True, timeout=120)


def composite_srt(audio_path, srt_path, out_mp4, duration, bg_image=None):
    srt_safe = srt_path.replace("\\", "/").replace(":", "\\:")
    style = "FontName=Microsoft YaHei,FontSize=28,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Outline=2,Alignment=2,MarginV=80"

    if bg_image and os.path.isfile(bg_image):
        filter_str = (
            f"[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,"
            f"loop=-1:1,fps=24,subtitles='{srt_safe}':force_style='{style}'[v]"
        )
        subprocess.run([
            "ffmpeg", "-y",
            "-loop", "1", "-i", bg_image,
            "-i", audio_path,
            "-filter_complex", filter_str,
            "-map", "[v]", "-map", "1:a",
            "-t", str(duration),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", out_mp4,
        ], check=True, capture_output=True, timeout=120)
    else:
        subprocess.run([
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:r=24",
            "-i", audio_path,
            "-filter_complex", f"[0:v]subtitles='{srt_safe}':force_style='{style}'[v]",
            "-map", "[v]", "-map", "1:a",
            "-t", str(duration),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", out_mp4,
        ], check=True, capture_output=True, timeout=120)


def gen_local_stub(text, engine, out_audio):
    raise NotImplementedError(f"Local engine {engine} not wired. Use --engine edgetts (default).")


def make_srt(text, total_dur, srt_path):
    parts = re.split(r'(?<=[。！？])', text)
    sentences = [s.strip() for s in parts if s.strip()] or [text]
    total_chars = sum(len(s) for s in sentences)
    char_sec = total_dur / max(total_chars, 1)
    lines = []
    t = 0.0
    for i, seg in enumerate(sentences, 1):
        dur = len(seg) * char_sec
        lines.append(str(i))
        lines.append(f"{fmt_ts(t)} --> {fmt_ts(t + dur)}")
        lines.append(seg)
        lines.append("")
        t += dur
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def fmt_ts(sec):
    h, m, s = int(sec // 3600), int((sec % 3600) // 60), int(sec % 60)
    return f"{h:02d}:{m:02d}:{s:02d},{int((sec % 1) * 1000):03d}"


if __name__ == "__main__":
    main()
